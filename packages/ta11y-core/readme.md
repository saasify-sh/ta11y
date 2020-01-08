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

You can optionally pass an `apiKey` in the `Ta11y` constructor which will disable rate-limiting for the Ta11y API.

You can also optionally override the default `apiBaseUrl` here if you have a custom Ta11y deployment.

## License

MIT © [Saasify](https://saasify.sh)
