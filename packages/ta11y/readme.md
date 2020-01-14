<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="https://raw.githubusercontent.com/saasify-sh/ta11y/master/media/logo.svg?sanitize=true" alt="ta11y Logo" width="256" />
  </a>
</p>

# @ta11y/ta11y

> CLI for running web accessibility audits with ta11y.

[![NPM](https://img.shields.io/npm/v/@ta11y/ta11y.svg)](https://www.npmjs.com/package/@ta11y/ta11y) [![Build Status](https://travis-ci.com/saasify-sh/ta11y.svg?branch=master)](https://travis-ci.com/saasify-sh/ta11y) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**See the [ta11y docs](https://ta11y.saasify.sh/docs) for in-depth examples.**

## Install

```bash
npm install -g @ta11y/ta11y
```

This installs a `ta11y` executable globally.

## Usage

```bash
Usage: ta11y [options] <url>

Options:
  -V, --version                  output the version number
  -o, --output <file>            Output the results to the given file (format determined by file
                                 type). Supports xls, xlsx, csv, json, html, txt, etc.
  -r, --remote                   Run all content extraction remotely (website must be publicly
                                 accessible). Default is to run content extraction locally.
                                 (default: false)
  -e, --extract-only             Only run content extraction and disable auditing. (default: false)
  -s, --suites <strings>         Optional comma-separated array of test suites to run. (section508,
                                 wcag2a, wcag2aa, wcag2aaa, best-practice, html). Defaults to
                                 running all audit suites.
  -c, --crawl                    Enable crawling additional pages. (default: false)
  -d, --max-depth <int>          Maximum crawl depth. (default: 16)
  -v, --max-visit <int>          Maximum number of pages to visit while crawling.
  -S, --no-same-origin           By default, we only crawling links with the same origin as the
                                 root. Disables this behavior so we crawl links with any origin.
  -b, --blacklist <strings>      Optional comma-separated array of URL glob patterns to ignore.
  -w, --whitelist <strings>      Optional comma-separated array of URL glob patterns to include.
  -u, --user-agent <string>      Optional user-agent override.
  -e, --emulate-device <string>  Optionally emulate a specific device type.
  -H, --no-headless              Disables headless mode for puppeteer. Useful for debugging.
  -P, --no-progress              Disables progress logging.
  --api-key <string>             Optional API key.
  --api-base-url <string>        Optional API base URL.
  -h, --help                     output usage information
```

## License

MIT © [Saasify](https://saasify.sh)
