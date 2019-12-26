#!/usr/bin/env node
'use strict'

const program = require('commander')
const puppeteer = require('puppeteer')
const pick = require('lodash.pick')

const { Ta11y } = require('@ta11y/core')
const { version } = require('../package')

module.exports = async (argv) => {
  if (!process.stdout.columns) {
    process.stdout.columns = 100
  }

  program
    .name('ta11y')
    .version(version)
    .usage('[options] <url>')
    .option('--api-key <string>', 'Optional API key.')
    .option('--api-base-url <string>', 'Optional API base URL.')
    .option(
      '-r, --remote',
      'Run all content extraction remotely (website must be publicly accessible). Default is to run content extraction locally.',
      false
    )
    .option(
      '-e, --extract-only',
      'Only run content extraction and disable auditing.',
      false
    )
    .option(
      '-s, --suites <strings>',
      'Optional comma-separated array of test suites to run. (section508, wcag2a, wcag2aa, wcag2aaa, best-practice, html). Defaults to running all audit suites.',
      (v) => v.split(',')
    )
    .option('-c, --crawl', 'Enable crawling additional pages.', false)
    .option('-d, --max-depth <int>', 'Maximum crawl depth.', 16, (s) =>
      parseInt(s)
    )
    .option(
      '-v, --max-visit <int>',
      'Maximum number of pages to visit while crawling.',
      16,
      (s) => parseInt(s)
    )
    .option(
      '-S, --no-same-origin',
      'By default, we only crawling links with the same origin as the root. Disables this behavior so we crawl links with any origin.'
    )
    .option(
      '-b, --blacklist <strings>',
      'Optional comma-separated array of URL glob patterns to ignore.',
      (v) => v.split(',')
    )
    .option(
      '-w, --whitelist <strings>',
      'Optional comma-separated array of URL glob patterns to include.',
      (v) => v.split(',')
    )
    .option('-u, --user-agent <string>', 'Optional user-agent override.')
    .option(
      '-e, --emulate-device <string>',
      'Optionally emulate a specific device type.'
    )
    .option(
      '-H, --no-headless <string>',
      'Disables headless mode for puppeteer. Useful for debugging.'
    )
    .option('-P, --no-progress', 'Disables progress logging.')

  program.parse(argv)

  if (!program.args.length) {
    console.error('missing required <url> to audit')
    program.help()
    process.exit(1)
  } else if (program.args.length > 1) {
    console.error('invalid extra arguments')
    program.help()
    process.exit(1)
  }

  const url = program.args[0]

  const opts = pick(program, [
    'extractOnly',
    'suites',
    'crawl',
    'maxDepth',
    'maxVisit',
    'sameOrigin',
    'blacklist',
    'whitelist',
    'userAgent',
    'emulateDevice',
    'progress'
  ])

  if (!program.remote) {
    const browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: !!program.headless
    })

    opts.browser = browser
  }

  const ta11y = new Ta11y({
    apiBaseUrl: program.apiBaseUrl,
    apiKey: program.apiKey
  })

  const result = await ta11y.audit(url, opts)

  console.log(JSON.stringify(result, null, 2))
}
