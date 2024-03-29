#!/usr/bin/env node
'use strict'

const cli = require('./lib/cli')

cli(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
