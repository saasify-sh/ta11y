'use strict'

const { extract } = require('@ta11y/extract')
const got = require('got')

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
    const extractResults = await extract(urlOrHtml, opts)

    return this.auditExtractResults(extractResults)
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
}
