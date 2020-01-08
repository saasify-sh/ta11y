'use strict'

const puppeteer = require('puppeteer')
const test = require('ava')
const { extract } = require('.')

const launchOptions = { headless: true }

test('wikipedia', async (t) => {
  const browser = await puppeteer.launch(launchOptions)

  const result = await extract('https://en.wikipedia.org', {
    browser
  })
  console.log(result.summary)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)
  t.is(result.summary.visited, 1)
  t.is(result.summary.success, 1)
  t.is(result.summary.error, 0)

  await browser.close()
})

test('wikipedia crawl', async (t) => {
  const browser = await puppeteer.launch(launchOptions)

  const result = await extract('https://en.wikipedia.org', {
    browser,
    crawl: true,
    maxDepth: 1
  })
  console.log(result.summary)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)
  t.true(result.summary.visited > 100)
  t.true(result.summary.success > 100)
  t.is(result.summary.error, 0)
  t.is(result.summary.visited, result.summary.success)

  await browser.close()
})
