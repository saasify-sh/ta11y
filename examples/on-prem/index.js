'use strict'

const puppeteer = require('puppeteer')
const { Ta11y } = require('@ta11y/core')
const { auditExtractResults } = require('@ta11y/on-prem')

const main = async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 10 })
  const ta11y = new Ta11y()

  const extractResults = await ta11y.audit('https://example.com', {
    browser,
    crawl: true,
    maxDepth: 1,
    maxVisit: 1,
    extractOnly: true
  })
  browser.close()

  const results = await auditExtractResults(extractResults)
  console.log(JSON.stringify(results, null, 2))
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
