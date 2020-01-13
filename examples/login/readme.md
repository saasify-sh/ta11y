<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="https://raw.githubusercontent.com/saasify-sh/ta11y/master/media/logo.svg?sanitize=true" alt="ta11y Logo" width="256" />
  </a>
</p>

# ta11y-example-login

> Example auditing a site that requires login.

[![NPM](https://img.shields.io/npm/v/@ta11y/ta11y.svg)](https://www.npmjs.com/package/@ta11y/ta11y) [![Build Status](https://travis-ci.com/saasify-sh/ta11y.svg?branch=master)](https://travis-ci.com/saasify-sh/ta11y) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Overview

This example Uses standard [Puppeteer](https://pptr.dev) methods to log into [Instagram](https://www.instagram.com) and then passes the initialized headless browser to `@ta11y/core`.

Ta11y then performs a basic crawl starting from the authenticated user's Instagram homepage. **Any pages that ta11y visits will inherit all of the auth cookies previously initialized during login.**

By allowing developers to pass any Puppeteer [Browser instance](https://pptr.dev/#?product=Puppeteer&version=v1.12.2&show=api-class-browser), we ensure maximum flexibility in supporting any potential auth or initialization scenarios.

## Running

The example assumes that you create a `.env` file in this directory containing a valid Instagram username and password via the `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD` environment variables.

Then just run `yarn` to install the dependencies and `yarn start` to run the example.

Feel free to play around with various Puppeteer launch options, including `headless`, `slowMo`, and any others your use case may benefit from.

## License

MIT © [Saasify](https://saasify.sh)
