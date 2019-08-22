<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="https://raw.githubusercontent.com/saasify-sh/ta11y/master/media/logo.svg?sanitize=true" alt="ta11y Logo" width="256" />
  </a>
</p>

# @ta11y/ta11y

> CLI for running web accessibility audits with ta11y.

[![NPM](https://img.shields.io/npm/v/@ta11y/ta11y.svg)](https://www.npmjs.com/package/@ta11y/ta11y) [![Build Status](https://travis-ci.com/saasify-sh/ta11y.svg?branch=master)](https://travis-ci.com/saasify-sh/ta11y) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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
  --api-key <string>             Optional API key.
  --api-base-url <string>        Optional API base URL.
  -r, --remote                   Run all content extraction remotely (website
                                 must be publicly accessible). Default is to
                                 run content extraction locally. (default:
                                 false)
  -e, --extract-only             Only run content extraction and disable
                                 auditing. (default: false)
  -c, --crawl                    Enable crawling additional pages. (default:
                                 false)
  -d, --max-depth <int>          Maximum crawl depth. (default: 16)
  -v, --max-visit <int>          Maximum number of pages to visit while
                                 crawling. (default: 16)
  -S, --no-same-origin           By default, we only crawling links with the
                                 same origin as the root. Disables this
                                 behavior so we crawl links with any origin.
  -b, --blacklist <strings>      Optional comma-separated array of URL glob
                                 patterns to ignore.
  -w, --whitelist <strings>      Optional comma-separated array of URL glob
                                 patterns to include.
  -u, --user-agent <string>      Optional user-agent override.
  -e, --emulate-device <string>  Optionally emulate a specific device type.
  -H, --no-headless <string>     Disables headless mode for puppeteer. Useful
                                 for debugging.
  -h, --help                     output usage information
```

## Notes

**The CLI defaults to running all crawling and content extraction locally via a headless Puppeteer instance**.

You can disable this and run everything remotely by passing the `--remote` option, though it's not recommended.

See [@ta11y/core](https://github.com/saasify-sh/ta11y/tree/master/packages/ta11y-core) for more detailed descriptions of how the different configuration options affect auditing behavior.

### API Key

The free tier is subject to rate limits as well as a 60 second timeout, so if you're crawling a larger site, you're better off running content extraction locally.

If you're processing a non-publicly accessible website (like `localhost`), then you *must* perform content extraction locally.

You can bypass rate limiting by [signing up](https://ta11y.saasify.sh/pricing) for an API key and passing it either via the `--api-key` flag or via the `TA11Y_API_KEY` environment variable.

Visit [ta11y](https://ta11y.saasify.sh) once you're ready to sign up for an API key.

## Examples

<details>
<summary>Basic single page audit</summary>

```bash
ta11y https://example.com
```

```json
{
  "summary": {},
  "results": {
    "https://example.com": {
      "url": "https://example.com",
      "depth": 0,
      "rules": [
        {
          "code": "html-has-lang",
          "type": "error",
          "message": "<html> element must have a lang attribute (https://dequeuniversity.com/rules/axe/3.4/html-has-lang?application=axeAPI)",
          "description": "Ensures every HTML document has a lang attribute",
          "impact": "serious",
          "help": "<html> element must have a lang attribute",
          "helpUrl": "https://dequeuniversity.com/rules/axe/3.4/html-has-lang?application=axeAPI"
        },
        {
          "code": "landmark-one-main",
          "type": "error",
          "message": "Document must have one main landmark (https://dequeuniversity.com/rules/axe/3.4/landmark-one-main?application=axeAPI)",
          "description": "Ensures the document has only one main landmark and each iframe in the page has at most one main landmark",
          "impact": "moderate",
          "help": "Document must have one main landmark",
          "helpUrl": "https://dequeuniversity.com/rules/axe/3.4/landmark-one-main?application=axeAPI"
        },
        {
          "code": "region",
          "type": "error",
          "message": "All page content must be contained by landmarks (https://dequeuniversity.com/rules/axe/3.4/region?application=axeAPI)",
          "description": "Ensures all page content is contained by landmarks",
          "impact": "moderate",
          "help": "All page content must be contained by landmarks",
          "helpUrl": "https://dequeuniversity.com/rules/axe/3.4/region?application=axeAPI"
        }
      ]
    }
  }
}
```

</details>

<details>
<summary>Basic single page content extraction</summary>

```bash
ta11y https://example.com --extract-only
```

```json
{
  "results": {
    "https://example.com": {
      "url": "https://example.com",
      "depth": 0,
      "content": "<!DOCTYPE html><html><head>\n    <title>Example Domain</title>\n\n    <meta charset=\"utf-8\">\n    <meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <style type=\"text/css\">\n    body {\n        background-color: #f0f0f2;\n        margin: 0;\n        padding: 0;\n        font-family: -apple-system, system-ui, BlinkMacSystemFont, \"Segoe UI\", \"Open Sans\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n        \n    }\n    div {\n        width: 600px;\n        margin: 5em auto;\n        padding: 2em;\n        background-color: #fdfdff;\n        border-radius: 0.5em;\n        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);\n    }\n    a:link, a:visited {\n        color: #38488f;\n        text-decoration: none;\n    }\n    @media (max-width: 700px) {\n        div {\n            margin: 0 auto;\n            width: auto;\n        }\n    }\n    </style>    \n</head>\n\n<body>\n<div>\n    <h1>Example Domain</h1>\n    <p>This domain is for use in illustrative examples in documents. You may use this\n    domain in literature without prior coordination or asking for permission.</p>\n    <p><a href=\"https://www.iana.org/domains/example\">More information...</a></p>\n</div>\n\n\n</body></html>"
    }
  },
  "summary": {
    "root": "https://example.com",
    "visited": 1,
    "success": 1,
    "error": 0
  }
}
```

</details>

<details>
<summary>Crawl part of a site and audit each page</summary>

```bash
ta11y https://en.wikipedia.org --crawl --max-depth 1 --max-visit 8
```

This example will crawl and extract the target site locally and then perform a remote audit of the results. You can use the `--remote` flag to force the whole process to operate remotely.

</details>

<details>
<summary>Crawl a localhost site and audit each page</summary>

```bash
ta11y http://localhost:3000 --crawl
```

This example will crawl all pages of a local site and then perform an audit of the results. Note that the local site does not have to be publicly accessible as content extraction happens locally.
</details>

## License

MIT © [Saasify](https://saasify.sh)
