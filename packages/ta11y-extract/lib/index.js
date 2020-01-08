'use strict'

const debug = require('debug')('ta11y-extract')
const createError = require('http-errors')
const isHtml = require('is-html')
const isRelativeUrl = require('is-relative-url')
const isUrl = require('is-url-superb')
const normalizeUrl = require('normalize-url')
const resolveRelativeUrl = require('resolve-relative-url')
const mm = require('micromatch')
const ow = require('ow')
const pMap = require('p-map')
const { default: PQueue } = require('p-queue')
const { devices } = require('puppeteer-core')

/**
 * Extracts the dynamic HTML content from a website, optionally crawling the site
 * to discover additional pages and extracting those too.
 *
 * @param {string} urlOrHtml - URL or raw HTML to process.
 * @param {object} opts - Config options.
 * @param {object} opts.browser - Required [Puppeteer](https://pptr.dev) browser instance to use.
 * @param {boolean} [opts.crawl=false] - Whether or not to crawl secondary pages.
 * @param {number} [opts.maxDepth=16] - Maximum crawl depth while crawling.
 * @param {number} [opts.maxVisit] - Maximum number of pages to visit while crawling.
 * @param {boolean} [opts.sameOrigin=true] - Whether or not to only consider crawling links with the same origin as the root URL.
 * @param {string[]} [opts.blacklist] - Optional blacklist of URL [glob patterns](https://github.com/micromatch/micromatch) to ignore.
 * @param {string[]} [opts.whitelist] - Optional whitelist of URL [glob patterns](https://github.com/micromatch/micromatch) to only include.
 * @param {object} [opts.gotoOptions] - Customize the `Page.goto` navigation options.
 * @param {object} [opts.viewport] - Set the browser window's viewport dimensions and/or resolution.
 * @param {string} [opts.userAgent] - Set the browser's [user-agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent).
 * @param {string} [opts.emulateDevice] - Make it look like the screenshot was taken on the specified device.
 * - Use the `name` property from one of the built-in [devices](https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js).
 * - Overrides `viewport` and `userAgent`.
 *
 * @return {Promise}
 */
exports.extract = async function extract(urlOrHtml, opts) {
  let sameOrigin = opts.sameOrigin === undefined ? true : !!opts.sameOrigin
  let origin
  let url
  let html

  if (isUrl(urlOrHtml)) {
    url = normalizeUrl(urlOrHtml)
    origin = new URL(url).origin
  } else if (isHtml(urlOrHtml)) {
    html = urlOrHtml
    url = 'root'
    origin = 'localhost'

    if (opts.sameOrigin) {
      throw new Error('extract "sameOrigin" is not supported with HTML input')
    }

    sameOrigin = false
  } else {
    throw new Error('extract expects either a URL or HTML input')
  }

  ow(url, 'url', ow.string.nonEmpty)
  ow(opts, 'opts', ow.object.plain.partialShape({ browser: ow.object }))

  debug('extract', url)

  const { concurrency = 8 } = opts
  const results = {}
  const visited = new Set()

  const queue = new PQueue({ concurrency })

  await queue.add(() =>
    visitPage({
      crawl: false,
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
      html,
      origin,
      sameOrigin,
      results,
      visited,
      queue,
      depth: 0
    })
  )

  await queue.onIdle()

  const summary = {
    root: url,
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

  if (opts.maxVisit && opts.visited.size >= opts.maxVisit) {
    return
  }

  let normalizedUrl

  if (depth === 0 && opts.html) {
    normalizedUrl = url
  } else {
    normalizedUrl = normalizeUrl(url)

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

      await pMap(
        links,
        (link) =>
          visitPage({
            ...opts,
            url: link,
            depth: depth + 1
          }),
        {
          concurrency: 128
        }
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

  if (opts.depth === 0 && opts.html) {
    ow(opts.html, 'html', ow.string.nonEmpty)
    await page.setContent(opts.html)
  } else {
    ow(url, 'url', ow.string.nonEmpty.url)
    await page.goto(url, opts.gotoOptions)
  }

  return page
}