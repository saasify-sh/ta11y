'use strict'

const puppeteer = require('puppeteer')
const test = require('ava')
const { extract } = require('.')

test('wikipedia', async (t) => {
  const browser = await puppeteer.launch({ headless: true })

  const result = await extract('https://en.wikipedia.org', {
    browser
  })
  console.log(result.summary)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)

  await browser.close()
})

test.only('wikipedia crawl', async (t) => {
  const browser = await puppeteer.launch({ headless: true })

  const result = await extract('https://en.wikipedia.org', {
    browser,
    crawl: true,
    maxDepth: 2
  })
  console.log(result.summary)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)

  await browser.close()
})
