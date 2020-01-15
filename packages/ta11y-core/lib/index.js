'use strict'

const { extract } = require('@ta11y/extract')
const { formatExtractResults, formatAuditResults } = require('@ta11y/reporter')

const debug = require('debug')('ta11y:core')
const got = require('got')
const isHtml = require('is-html')
const isUrl = require('is-url-superb')
const pick = require('lodash.pick')
const pMap = require('p-map')

// const util = require('util')
// const zlib = require('zlib')

const noopSpinner = require('./noop-spinner')
const spinner = require('./spinner')

// TODO: ZEIT now seems to have a bug with handling content-encoding compression
// const compress = util.promisify(zlib.brotliCompress.bind(zlib))

/**
 * Class to run web accessibility audits via the [ta11y API](https://ta11y.saasify.sh).
 *
 * @name Ta11y
 * @class
 *
 * @param {object} [opts] - Config options.
 * @param {string} [opts.apiKey] - Optional ta11y API key which disables rate limits.
 * @param {string} [opts.apiBaseUrl='https://ssfy.sh/dev/ta11y'] - Optional custom Ta11y deployment which is useful for on-premise scenarios.
 */
exports.Ta11y = class Ta11y {
  constructor(opts = {}) {
    const {
      apiBaseUrl = process.env.TA11Y_API_BASE_URL ||
        'https://ssfy.sh/dev/ta11y',
      apiKey = process.env.TA11Y_API_KEY
    } = opts

    this._apiBaseUrl = apiBaseUrl
    this._headers = {
      'accept-encoding': 'gzip'
    }

    if (apiKey) {
      this._headers.authorization = `Bearer ${apiKey}`
    }
  }

  /**
   * Runs an accessibility audit against the given URL or raw HTML, optionally crawling the
   * site to discover additional pages and auditing those too.
   *
   * To audit local or private websites, pass an instance of Puppeteer as `opts.browser`.
   *
   * The default behavior is to perform content extraction and auditing remotely. This works
   * best for auditing publicly accessible websites.
   *
   * @param {string} urlOrHtml - URL or raw HTML to process.
   * @param {object} opts - Config options.
   * @param {string[]} [opts.suites] - Optional array of audit suites to run. Possible values:
   *
   * - `section508`
   * - `wcag2a`
   * - `wcag2aa`
   * - `wcag2aaa`
   * - `best-practice`
   * - `html`
   *
   * Defaults to running all audit suites.
   * @param {object} [opts.browser] - Optional [Puppeteer](https://pptr.dev) browser instance to use for auditing websites that aren't publicly reachable.
   * @param {boolean} [opts.crawl=false] - Whether or not to crawl additional pages.
   * @param {number} [opts.maxDepth=16] - Maximum crawl depth while crawling.
   * @param {number} [opts.maxVisit] - Maximum number of pages to visit while crawling.
   * @param {boolean} [opts.sameOrigin=true] - Whether or not to only consider crawling links with the same origin as the root URL.
   * @param {string[]} [opts.blacklist] - Optional blacklist of URL [glob patterns](https://github.com/micromatch/micromatch) to ignore.
   * @param {string[]} [opts.whitelist] - Optional whitelist of URL [glob patterns](https://github.com/micromatch/micromatch) to only include.
   * @param {object} [opts.gotoOptions] - Customize the `Page.goto` navigation options.
   * @param {object} [opts.viewport] - Set the browser window's viewport dimensions and/or resolution.
   * @param {string} [opts.userAgent] - Set the browser's [user-agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent).
   * @param {string} [opts.emulateDevice] - Emulate a specific device type.
   * - Use the `name` property from one of the built-in [devices](https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js).
   * - Overrides `viewport` and `userAgent`.
   * @param {function} [opts.onNewPage] - Optional async function called every time a new page is
   * initialized before proceeding with extraction.
   * @param {string} [opts.file] - Write results to a file (output format determined by file type). See the docs for more info on supported file formats (xls, xlsx, csv, json, html, txt, etc.)
   *
   * @return {Promise}
   */
  async audit(urlOrHtml, opts) {
    if (!opts || !opts.browser) {
      return this._remoteAudit(urlOrHtml, {
        ...opts,
        extractOnly: false
      })
    } else {
      const extractResults = await this.extract(urlOrHtml, opts)

      console.error('extraction results', extractResults.summary)
      return this.auditExtractResults(extractResults, opts)
    }
  }

  /**
   * Extracts the content from a given URL or raw HTML, optionally crawling the
   * site to discover additional pages and auditing those too.
   *
   * To audit local or private websites, pass an instance of Puppeteer as `opts.browser`.
   *
   * @param {string} urlOrHtml - URL or raw HTML to process.
   * @param {object} opts - Config options.
   * @param {object} [opts.browser] - Optional [Puppeteer](https://pptr.dev) browser instance to use for auditing websites that aren't publicly reachable.
   * @param {boolean} [opts.crawl=false] - Whether or not to crawl additional pages.
   * @param {number} [opts.maxDepth=16] - Maximum crawl depth while crawling.
   * @param {number} [opts.maxVisit] - Maximum number of pages to visit while crawling.
   * @param {boolean} [opts.sameOrigin=true] - Whether or not to only consider crawling links with the same origin as the root URL.
   * @param {string[]} [opts.blacklist] - Optional blacklist of URL [glob patterns](https://github.com/micromatch/micromatch) to ignore.
   * @param {string[]} [opts.whitelist] - Optional whitelist of URL [glob patterns](https://github.com/micromatch/micromatch) to only include.
   * @param {object} [opts.gotoOptions] - Customize the `Page.goto` navigation options.
   * @param {object} [opts.viewport] - Set the browser window's viewport dimensions and/or resolution.
   * @param {string} [opts.userAgent] - Set the browser's [user-agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent).
   * @param {string} [opts.emulateDevice] - Emulate a specific device type.
   * - Use the `name` property from one of the built-in [devices](https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js).
   * - Overrides `viewport` and `userAgent`.
   * @param {function} [opts.onNewPage] - Optional async function called every time a new page is
   * initialized before proceeding with extraction.
   * @param {string} [opts.file] - Write results to a file (output format determined by file type). See the docs for more info on supported file formats (xls, xlsx, csv, json, html, txt, etc.)
   *
   * @return {Promise}
   */
  async extract(urlOrHtml, opts) {
    if (!opts || !opts.browser) {
      return this._remoteAudit(urlOrHtml, {
        ...opts,
        extractOnly: true
      })
    } else {
      const progressSpinner = opts.progress === false ? noopSpinner : spinner
      const extractResults = await progressSpinner(
        extract(urlOrHtml, opts),
        'Extracting content via headless chrome'
      )

      return formatExtractResults(extractResults, opts)
    }
  }

  /**
   * Runs an accessibility audit against previously collected extraction results from
   * `@ta11y/extract`.
   *
   * @param {object} extractResults - Extraction results conforming to the output format
   * from `@ta11y/extract`.
   * @param {object} opts - Config options.
   * @param {string[]} [opts.suites] - Optional array of audit suites to run. Possible values:
   *
   * - `section508`
   * - `wcag2a`
   * - `wcag2aa`
   * - `wcag2aaa`
   * - `best-practice`
   * - `html`
   *
   * Defaults to running all audits suites.
   * @param {string} [opts.file] - Write results to a file (output format determined by file type). See the docs for more info on supported file formats (xls, xlsx, csv, json, html, txt, etc.)
   *
   * @return {Promise}
   */
  async auditExtractResults(extractResults, opts = {}) {
    const auditResults = await this._auditExtractResults(extractResults, opts)
    return formatAuditResults(auditResults, opts)
  }

  /**
   * @private
   */
  async _remoteAudit(urlOrHtml, opts = {}) {
    const progressSpinner = opts.progress === false ? noopSpinner : spinner
    let label
    let url
    let html

    if (isUrl(urlOrHtml)) {
      url = urlOrHtml
      label = `Auditing URL ${url}`
    } else if (isHtml(urlOrHtml)) {
      html = urlOrHtml
      label = 'Auditing HTML'
    } else {
      throw new Error('audit expects either a URL or HTML input')
    }

    const { extractOnly = false, file } = opts

    const apiUrl = extractOnly
      ? `${this._apiBaseUrl}/extract`
      : `${this._apiBaseUrl}/audit`

    delete opts.extractOnly
    delete opts.progress
    delete opts.file

    // TODO: support this remotely as well
    delete opts.onNewPage

    try {
      const res = await progressSpinner(
        got.post(apiUrl, {
          body: {
            ...opts,
            url,
            html
          },
          headers: this._headers,
          json: true
        }),
        label
      )

      const results = res.body

      if (file) {
        if (extractOnly) {
          return formatExtractResults(results, { file })
        } else {
          return formatAuditResults(results, { file })
        }
      }

      return results
    } catch (err) {
      throw new Error(`Auditing failed: ${err.message}`)
    }
  }

  /**
   * @private
   */
  async _auditExtractResults(extractResults, opts = {}) {
    const progressSpinner = opts.progress === false ? noopSpinner : spinner
    const bodyRaw = JSON.stringify({
      ...pick(opts, ['suites', 'rules']),
      extractResults
    })
    // const body = await compress(Buffer.from(bodyRaw))
    const body = bodyRaw

    // break up large request bodies into more manageable chunks to prevent
    // potential timeouts
    if (
      body.length >= 990000 &&
      Object.keys(extractResults.results).length > 1
    ) {
      const keys = Object.keys(extractResults.results)
      const results = {}

      await pMap(
        keys,
        async (key) => {
          const page = extractResults.results[key]

          try {
            debug('auditing page %s', key)
            const result = await this._auditExtractResults(
              {
                summary: extractResults.summary,
                results: {
                  [key]: page
                }
              },
              opts
            )

            results[key] = result
            debug('done auditing page %s %s', key, result.summary)
          } catch (err) {
            debug('error auditing page %s %s', key, err.message)

            results[key] = {
              url: key,
              depth: page.depth,
              error: err.message,
              rules: []
            }
          }
        },
        {
          concurrency: 4
        }
      )

      const summary = {
        suites: opts.suites || [],

        errors: keys.reduce((acc, key) => acc + results[key].summary.errors, 0),
        warnings: keys.reduce(
          (acc, key) => acc + results[key].summary.warnings,
          0
        ),
        infos: keys.reduce((acc, key) => acc + results[key].summary.infos, 0),

        numPages: keys.length,
        numPagesPass: keys.filter((key) => results[key].summary.pass).length,
        numPagesFail: keys.filter((key) => !results[key].summary.pass).length
      }

      return {
        summary,
        results
      }
    } else {
      // console.log({ body: body.length, bodyRaw: bodyRaw.length })

      const apiAuditUrl = `${this._apiBaseUrl}/auditExtractResults`
      try {
        const res = await progressSpinner(
          got.post(apiAuditUrl, {
            body,
            headers: {
              ...this._headers,
              accept: 'application/json',
              'content-type': 'application/json'
              // 'content-encoding': 'br'
            },
            responseType: 'json'
          }),
          'Auditing extraction results'
        )

        return JSON.parse(res.body)
      } catch (err) {
        throw new Error(`Auditing failed: ${err.message}`)
      }
    }
  }
}
