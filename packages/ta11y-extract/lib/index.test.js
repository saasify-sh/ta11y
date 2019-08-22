'use strict'

const puppeteer = require('puppeteer')
const test = require('ava')
const { extract } = require('.')

const launchOptions = { headless: true }

test('wikipedia url', async (t) => {
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

test('wikipedia url crawl', async (t) => {
  const browser = await puppeteer.launch(launchOptions)

  const result = await extract('https://en.wikipedia.org', {
    browser,
    crawl: true,
    maxDepth: 1, // stop crawling after one link of depth
    maxVisit: 8 // stop crawling after visiting 8 URLs to speed up
  })
  console.log(result.summary)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)
  t.is(result.summary.visited, 8)
  t.is(result.summary.success, 8)
  t.is(result.summary.error, 0)

  await browser.close()
})

test('simple html', async (t) => {
  const browser = await puppeteer.launch(launchOptions)

  const result = await extract(
    '<!doctype><html><body><h1>I ❤ unicorns</h1></body></html>',
    {
      browser
    }
  )
  t.snapshot(result)
  t.truthy(result)
  t.truthy(result.results)
  t.truthy(result.summary)
  t.is(result.summary.visited, 1)
  t.is(result.summary.success, 1)
  t.is(result.summary.error, 0)
  t.truthy(result.results.root)

  await browser.close()
})
