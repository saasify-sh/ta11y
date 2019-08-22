'use strict'

const { extract } = require('@ta11y/extract')
const got = require('got')
const isHtml = require('is-html')
const isUrl = require('is-url-superb')

exports.Ta11y = class Ta11y {
  constructor(opts = {}) {
    const {
      apiBaseUrl = 'https://ssfy.sh/dev/ta11y',
      apiKey = process.env.TA11Y_API_KEY
    } = opts

    this._apiBaseUrl = apiBaseUrl

    this._headers = {}

    if (apiKey) {
      this._headers.authorization = `Bearer ${apiKey}`
    }
  }

  async audit(urlOrHtml, opts) {
    if (!opts || opts.remote) {
      delete opts.remote
      return this._remoteAudit(urlOrHtml, opts)
    } else {
      const extractResults = await extract(urlOrHtml, opts)

      return this.auditExtractResults(extractResults)
    }
  }

  async auditExtractResults(extractResults) {
    const apiAuditUrl = `${this.apiBaseUrl}/auditExtractResults`
    const auditResults = await got
      .post(apiAuditUrl, {
        json: extractResults,
        headers: this._headers
      })
      .json()

    return auditResults
  }

  async _remoteAudit(urlOrHtml, opts) {
    let url
    let html

    if (isUrl(urlOrHtml)) {
      url = urlOrHtml
    } else if (isHtml(urlOrHtml)) {
      html = urlOrHtml
    } else {
      throw new Error('audit expects either a URL or HTML input')
    }

    const apiAuditUrl = `${this.apiBaseUrl}/audit`
    const auditResults = await got
      .post(apiAuditUrl, {
        json: {
          ...opts,
          url,
          html
        },
        headers: this._headers
      })
      .json()

    return auditResults
  }
}
