'use strict'

const debug = require('debug')('ta11y-extract')
const createError = require('http-errors')
const isRelativeUrl = require('is-relative-url')
const normalizeUrl = require('normalize-url')
const resolveRelativeUrl = require('resolve-relative-url')
const mm = require('micromatch')
const ow = require('ow')
const pMap = require('p-map')
const { default: PQueue } = require('p-queue')
const { devices } = require('puppeteer-core')

exports.extract = async function extract(url, opts) {
  ow(url, 'url', ow.string.nonEmpty.url)
  ow(opts, 'opts', ow.object.plain.partialShape({ browser: ow.object }))

  debug('extract', url)

  const { concurrency = 8 } = opts
  const results = {}
  const visited = new Set()
  const origin = new URL(url).origin

  const queue = new PQueue({ concurrency })

  await queue.add(() =>
    visitPage({
      crawl: false,
      sameOrigin: true,
      maxDepth: 16,
      maxVisit: undefined,
      blacklist: undefined,
      whitelist: undefined,
      emulateDevice: undefined,
      userAgent: undefined,
      viewport: undefined,
      ...opts,
      concurrency,
      url,
      origin,
      results,
      visited,
      queue,
      depth: 1
    })
  )

  await queue.onIdle()

  const summary = {
    visited: visited.size,
    success: Object.keys(results).reduce(
      (acc, url) => acc + (results[url].error ? 0 : 1),
      0
    ),
    error: Object.keys(results).reduce(
      (acc, url) => acc + (results[url].error ? 1 : 0),
      0
    )
  }

  debug('extract results summary %O', summary)

  return {
    results,
    summary
  }
}

async function visitPage(opts) {
  const { url, depth } = opts
  if (!url) return

  if (opts.maxDepth && depth > opts.maxDepth) {
    return
  }

  if (opts.maxVisited && opts.visited.size >= opts.maxVisited) {
    return
  }

  const normalizedUrl = normalizeUrl(url)

  if (opts.visited.has(normalizedUrl)) {
    return
  }

  if (opts.sameOrigin && new URL(normalizedUrl).origin !== opts.origin) {
    return
  }

  if (opts.blacklist && mm.isMatch(normalizedUrl, opts.blacklist)) {
    return
  }

  if (opts.whitelist && !mm.isMatch(normalizedUrl, opts.whitelist)) {
    return
  }

  opts.visited.add(normalizedUrl)
  return opts.queue.add(() =>
    extractPage({
      ...opts,
      normalizedUrl
    })
  )
}

async function extractPage(opts) {
  const { normalizedUrl: url, depth } = opts
  debug('extractPage', url)
  let page

  try {
    try {
      page = await getPage(url, opts)

      opts.results[url] = {
        url,
        depth,
        content: await page.content()
      }
    } catch (err) {
      debug('error getting page %s %s', url, err.toString())

      opts.results[url] = {
        url,
        depth,
        error: err.toString()
      }

      return
    }

    if (opts.crawl) {
      if (opts.maxDepth && depth >= opts.maxDepth) {
        return
      }

      if (opts.maxVisited && opts.visited.size >= opts.maxVisited) {
        return
      }

      const hrefs = await page.$$eval('a', (as) => as.map((a) => a.href))
      const links = hrefs.map((href) => {
        if (isRelativeUrl(href)) {
          return resolveRelativeUrl(href, url)
        } else {
          return href
        }
      })

      await pMap(links, (link) =>
        visitPage({
          ...opts,
          url: link,
          depth: depth + 1
        })
      )
    }
  } catch (err) {
    debug('error crawling %s %s', url, err.toString())
  } finally {
    if (page) {
      await page.close()
    }
  }
}

async function getPage(url, opts) {
  ow(url, 'url', ow.string.nonEmpty.url)
  ow(
    opts,
    'opts',
    ow.object.plain.partialShape({
      browser: ow.object
    })
  )

  const page = await opts.browser.newPage()

  if (opts.emulateDevice) {
    const device = devices[opts.emulateDevice]
    if (!device) {
      throw createError(400, `Invalid device name [${opts.emulateDevice}]`)
    }

    await page.emulate(device)
  } else {
    if (opts.userAgent) {
      await page.setUserAgent(opts.userAgent)
    }

    if (opts.viewport) {
      await page.setViewport(opts.viewport)
    }
  }

  await page.goto(url, opts.gotoOptions)

  return page
}
