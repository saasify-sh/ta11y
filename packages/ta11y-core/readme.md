<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="TODO" alt="ta11y Logo" width="256" />
  </a>
</p>

# @ta11y/core

> Core library for running web accessibility audits with ta11y.

[![NPM](https://img.shields.io/npm/v/@ta11y/core.svg)](https://www.npmjs.com/package/@ta11y/core) [![Build Status](https://travis-ci.com/saasify-sh/ta11y.svg?branch=master)](https://travis-ci.com/saasify-sh/ta11y) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @ta11y/core
```

## Usage

```js
const { Ta11y } = require('@ta11y/core')

const ta11y = new Ta11y()

ta11y.audit('https://en.wikipedia.org')
  .then((results) => {
    console.log(results)
  })
```

```js
// alternatively, you can tell ta11y to crawl starting from the URL
ta11y.audit('https://en.wikipedia.org', {
  crawl: true,
  maxDepth: 1,
  maxVisit: 64
})
```

```js
// if you want to crawl non-public pages, pass an instance of puppeteer
// this is useful for testing in development or behind corporate firewalls
ta11y.audit('http://localhost:3000', {
  crawl: true,
  maxDepth: 0
})
```

```js
// you can also pass HTML directly to audit (whole pages or fragments)
ta11y.audit('<!doctype><html><body><h1>I ❤ accessibility</h1></body></html>')
```

You can optionally pass an `apiKey` to the `Ta11y` constructor which will disable rate-limiting.

You can optionally override the default `apiBaseUrl` here if you have a custom Ta11y deployment which is useful for on-premise scenarios.

## License

MIT © [Saasify](https://saasify.sh)
