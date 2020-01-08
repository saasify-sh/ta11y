'use strict'

const nock = require('nock')
const puppeteer = require('puppeteer')
const test = require('ava')
const { Ta11y } = require('.')

const launchOptions = { headless: true }

test('wikipedia url local extract', async (t) => {
  const scope = nock('https://ssfy.sh')
    .post('/dev/ta11y/auditExtractResults', (body) => true)
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
