'use strict'

const nock = require('nock')
const puppeteer = require('puppeteer')
const test = require('ava')
const { Ta11y } = require('.')

const launchOptions = { headless: true }

test('wikipedia url local extract', async (t) => {
  const scope = nock('https://ssfy.sh')
    .post('/dev/ta11y/auditExtractResults', (body) => {
      t.is(body.summary.visited, 1)
      t.is(body.summary.success, 1)
      t.is(body.summary.error, 0)
      return true
    })
    .reply(200, {
      foo: 'bar'
    })

  const browser = await puppeteer.launch(launchOptions)

  const ta11y = new Ta11y()
  const result = await ta11y.audit('https://en.wikipedia.org', {
    browser
  })

  t.deepEqual(result, { foo: 'bar' })
  t.true(scope.isDone())

  await browser.close()
})

test('wikipedia url remote extract', async (t) => {
  const scope = nock('https://ssfy.sh')
    .post('/dev/ta11y/audit', (body) => {
      t.deepEqual(body, { url: 'https://en.wikipedia.org' })
      return true
    })
    .reply(200, {
      foo: 'bar'
    })

  const ta11y = new Ta11y()
  const result = await ta11y.audit('https://en.wikipedia.org')

  t.deepEqual(result, { foo: 'bar' })
  t.true(scope.isDone())
})
