'use strict'

// const { extract } = require('@ta11y/extract')
// const got = require('got')

exports.Ta11y = class Ta11y {
  constructor(opts = {}) {
    const {
      apiBaseUrl = 'https://ssfy.sh/dev/ta11y',
      apiKey = process.env.TA11Y_API_KEY
    } = opts

    this._apiBaseUrl = apiBaseUrl
    this._apiKey = apiKey
  }

  async audit(url, opts) {
    // const crawlResults = await extract(url, opts)
  }

  async auditCrawlResults(crawlResults) {}
}
