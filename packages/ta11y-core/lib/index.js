'use strict'

const { extract } = require('@ta11y/extract')
const got = require('got')
const pick = require('lodash.pick')
const isHtml = require('is-html')
const isUrl = require('is-url-superb')
const util = require('util')
const zlib = require('zlib')

const gzip = util.promisify(zlib.gzip.bind(zlib))

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
   * @param {string[]} [opts.suites=['wcag2aa']] - Optional array of audit suites to run. Possible values:
   * - `section508`
   * - `wcag2a`
   * - `wcag2aa`
   * - `wcag2aaa`
   * - `best-practice`
   * - `html`
   * @param {object} [opts.browser] - Optional [Puppeteer](https://pptr.dev) browser instance to use for auditing websites that aren't publicly reachable.
   * @param {boolean} [opts.extractOnly=false] - Whether or not to perform extraction and auditing, or just extraction. By default, a full audit is performed, but in some cases it can be useful to store the extraction results for later processing.
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
   *
   * @return {Promise}
   */
  async audit(urlOrHtml, opts) {
    if (!opts || !opts.browser) {
      return this._remoteAudit(urlOrHtml, opts)
    } else {
      const extractResults = await extract(urlOrHtml, opts)

      if (opts.extractOnly) {
        return extractResults
      } else {
        console.error('extraction results', extractResults.summary)
        return this.auditExtractResults(extractResults, opts)
      }
    }
  }

  /**
   * Runs an accessibility audit against previously collected extraction results from
   * `@ta11y/extract`.
   *
   * @param {object} extractResults - Extraction results conforming to the output format
   * from `@ta11y/extract`.
   * @param {object} opts - Config options.
   * @param {string[]} [opts.suites=['wcag2aa']] - Optional array of audit suites to run. Possible values:
   * - `section508`
   * - `wcag2a`
   * - `wcag2aa`
   * - `wcag2aaa`
   * - `best-practice`
   * - `html`
   *
   * @return {Promise}
   */
  async auditExtractResults(extractResults, opts) {
    const bodyRaw = JSON.stringify({
      ...pick(opts, ['suites', 'rules']),
      extractResults
    })
    const body = await gzip(Buffer.from(bodyRaw))

    const apiAuditUrl = `${this._apiBaseUrl}/auditExtractResults`
    const res = await got.post(apiAuditUrl, {
      body,
      headers: {
        ...this._headers,
        accept: 'application/json',
        'content-type': 'application/json',
        'content-encoding': 'gzip'
      },
      responseType: 'json'
    })

    return JSON.parse(res.body)
  }

  /**
   * @private
   */
  async _remoteAudit(urlOrHtml, opts = {}) {
    let url
    let html

    if (isUrl(urlOrHtml)) {
      url = urlOrHtml
    } else if (isHtml(urlOrHtml)) {
      html = urlOrHtml
    } else {
      throw new Error('audit expects either a URL or HTML input')
    }

    const apiUrl = opts.extractOnly
      ? `${this._apiBaseUrl}/extract`
      : `${this._apiBaseUrl}/audit`
    delete opts.extractOnly

    const res = await got.post(apiUrl, {
      body: {
        ...opts,
        url,
        html
      },
      headers: this._headers,
      json: true
    })

    return res.body
  }
}
