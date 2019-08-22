'use strict'

exports.Ta11y = class Ta11y {
  constructor(opts = {}) {
    const {
      apiBaseUrl = 'https://ssfy.sh/dev/ta11y',
      apiKey = process.env.TA11Y_API_KEY
    } = opts

    this._apiBaseUrl = apiBaseUrl
    this._apiKey = apiKey
  }
}
