<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="https://raw.githubusercontent.com/saasify-sh/ta11y/master/media/logo.svg?sanitize=true" alt="ta11y Logo" width="256" />
  </a>
</p>

# ta11y

> Modern web accessibility audits. 💪

[![NPM](https://img.shields.io/npm/v/@ta11y/ta11y.svg)](https://www.npmjs.com/package/@ta11y/ta11y) [![Build Status](https://travis-ci.com/saasify-sh/ta11y.svg?branch=master)](https://travis-ci.com/saasify-sh/ta11y) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Features

- **Accessibility as a service**
  - Audit your websites with a range of test suites including WCAG 2.0/2.1 A, AA, AAA, Section 508, HTML validation, as well as our own best practices.
- **Flexible and automated**
  - Run manual tests during development and then integrate into any CI pipeline. Supports generating reports in XLS, XLSX, CSV, JSON, HTML, and more.
- **Runs in any environment**
  - Easy integration that supports localhost, firewalls, custom auth, as well as any public production environment.
- **Modern dynamic websites**
  - Ta11y treats all websites as dynamic with full JavaScript support, so you'll test pages as your users actually experience them.
- **Free to try**
  - Simple to get started for free, then [sign up](/pricing) once you're ready to remove rate limits.
- **Private & secure**
  - Ta11y is built using serverless functions and never stores any of your data or audit results.

## Usage

This project is broken down into the following packages:

- [@ta11y/ta11y](./packages/ta11y) - Main CLI for running web accessibility audits with ta11y.
- [@ta11y/core](./packages/ta11y-core) - Core library for programatically running web accessibility audits with ta11y.
- [@ta11y/extract](./packages/ta11y-extract) - Library to crawl and extract content from websites.
- [@ta11y/reporter](./packages/ta11y-reporter) - Library to convert audit results to different formats.

## CLI

The easiest way to get started is via the CLI.

```bash
npm install -g @ta11y/ta11y
```

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

### Notes

**The CLI defaults to running all crawling and content extraction locally via a headless Puppeteer instance**.

You can disable this and run everything remotely by passing the `--remote` option, though it's not recommended.

See [@ta11y/core](https://github.com/saasify-sh/ta11y/tree/master/packages/ta11y-core) for more detailed descriptions of how the different configuration options affect auditing behavior.

### API Key

The free tier is subject to rate limits as well as a 60 second timeout, so if you're crawling a larger site, you're better off running content extraction locally.

If you're processing a non-publicly accessible website (like `localhost`), then you _must_ perform content extraction locally.

You can bypass rate limiting by [signing up](https://ta11y.saasify.sh/pricing) for an API key and passing it either via the `--api-key` flag or via the `TA11Y_API_KEY` environment variable.

Visit [ta11y](https://ta11y.saasify.sh) once you're ready to sign up for an API key.

### Output

The output format is determined by the file type if given a filename via `-o` or `--output`. If no file is given, the CLI defaults to logging the results in JSON format to `stdout`.

Ta11y supports a large number of [output formats](https://github.com/saasify-sh/ta11y/tree/master/packages/ta11y-reporter#formats) including:
  - **xls**
  - x**lsx**
  - **csv**
  - **json**
  - **html**
  - **txt**

Here are some example audit results so you can get a feel for the data:
  - [example.com](http://example.com/) single page audit: [csv](https://github.com/saasify-sh/ta11y/blob/master/media/example.csv), [json](https://github.com/saasify-sh/ta11y/blob/master/media/example.json), [xls](https://github.com/saasify-sh/ta11y/blob/master/media/example.xls?raw=true), [xlsx](https://github.com/saasify-sh/ta11y/blob/master/media/example.xlsx?raw=true)
  - [Wikipedia](http://en.wikipedia.org) small crawl (`--max-visit 16`): [csv](https://github.com/saasify-sh/ta11y/blob/master/media/wikipedia.csv), [json](https://github.com/saasify-sh/ta11y/blob/master/media/wikipedia.json), [xls](https://github.com/saasify-sh/ta11y/blob/master/media/wikipedia.xls?raw=true), [xlsx](https://github.com/saasify-sh/ta11y/blob/master/media/wikipedia.xlsx?raw=true)

### Examples

<details>
<summary>Basic single page audit</summary>

This example runs all available audit test suites on the given URL.

It uses the default output behavior which logs the results in JSON format to `stdout`.

```bash
ta11y https://example.com
```

```json
{
  "summary": {
    "errors": 4,
    "warnings": 0,
    "infos": 2,
    "numPages": 1,
    "numPagesPass": 0,
    "numPagesFail": 1
  },
  "results": {
    "https://example.com": {
      "url": "https://example.com",
      "depth": 0,
      "rules": [
        {
          "id": "html",
          "description": "A document must not include both a “meta” element with an “http-equiv” attribute whose value is “content-type”, and a “meta” element with a “charset” attribute.",
          "context": "f-8\">\n    <meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">\n    <",
          "type": "error",
          "tags": [
            "html"
          ],
          "firstColumn": 5,
          "lastLine": 5,
          "lastColumn": 71
        },
        {
          "id": "html",
          "description": " The “type” attribute for the “style” element is not needed and should be omitted.",
          "context": "e=1\">\n    <style type=\"text/css\">\n    b",
          "type": "info",
          "tags": [
            "html"
          ],
          "firstColumn": 5,
          "lastLine": 7,
          "lastColumn": 27
        },
        {
          "id": "html",
          "description": "Consider adding a “lang” attribute to the “html” start tag to declare the language of this document.",
          "context": "TYPE html><html><head>",
          "type": "info",
          "tags": [
            "html"
          ],
          "firstColumn": 16,
          "lastLine": 1,
          "lastColumn": 21
        },
        {
          "id": "html-has-lang",
          "type": "error",
          "description": "Ensures every HTML document has a lang attribute",
          "impact": "serious",
          "tags": [
            "cat.language",
            "wcag2a",
            "wcag311"
          ],
          "help": "<html> element must have a lang attribute",
          "helpUrl": "https://dequeuniversity.com/rules/ta11y/3.4/html-has-lang?application=Ta11y%20API"
        },
        {
          "id": "landmark-one-main",
          "type": "error",
          "description": "Ensures the document has only one main landmark and each iframe in the page has at most one main landmark",
          "impact": "moderate",
          "tags": [
            "cat.semantics",
            "best-practice"
          ],
          "help": "Document must have one main landmark",
          "helpUrl": "https://dequeuniversity.com/rules/ta11y/3.4/landmark-one-main?application=Ta11y%20API"
        },
        {
          "id": "region",
          "type": "error",
          "description": "Ensures all page content is contained by landmarks",
          "impact": "moderate",
          "tags": [
            "cat.keyboard",
            "best-practice"
          ],
          "help": "All page content must be contained by landmarks",
          "helpUrl": "https://dequeuniversity.com/rules/ta11y/3.4/region?application=Ta11y%20API"
        }
      ],
      "summary": {
        "errors": 4,
        "warnings": 0,
        "infos": 2,
        "pass": false
      }
    }
  }
}
```

If you only want specific audit results, use the `--suite` option.

</details>

<details>
<summary>Basic single page audit writing results to an Excel file</summary>

This example runs wcag2a and wcag2aa audit test suites on the given URL and outputs the results to an Excel spreadsheet (supports any `xls`, `xlsx`, or `csv` file).

```bash
ta11y https://example.com -o audit.xls
```
</details>

<details>
<summary>Single page audit testing WCAG2A and WCAG2AA writing results to a CSV file</summary>

This example runs wcag2a and wcag2aa audit test suites on the given URL and outputs the results to a comma-separated-value file (`csv`).

```bash
ta11y https://example.com --suites wcag2a,wcag2aa -o audit.csv
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

This example will crawl and extract the target site locally and then perform a full remote audit of the results. You can use the `--remote` flag to force the whole process to operate remotely.

</details>

<details>
<summary>Crawl a localhost site and audit each page</summary>

```bash
ta11y http://localhost:3000 --crawl
```

This example will crawl all pages of a local site and then perform an audit of the results.

Note that the local site does not have to be publicly accessible as content extraction happens locally.

</details>

<details>
<summary>Run a WCAG2AA audit on a localhost site</summary>

```bash
ta11y http://localhost:3000 --crawl --suites wcag2aa
```

This example will crawl all pages of a local site and then perform an audit of the results, **only considering the WCAG2AA test suite**.

Note that the local site does not have to be publicly accessible as content extraction happens locally.

</details>

<details>
<summary>Single page audit using WCAG2A and HTML validation test suites</summary>

```bash
ta11y https://example.com --suites wcag2a,html
```

```json
{
  "summary": {
    "suites": [
      "wcag2a",
      "html"
    ],
    "errors": 2,
    "warnings": 0,
    "infos": 2,
    "numPages": 1,
    "numPagesPass": 0,
    "numPagesFail": 1
  },
  "results": {
    "https://example.com": {
      "url": "https://example.com",
      "depth": 0,
      "rules": [
        {
          "id": "html",
          "description": "A document must not include both a “meta” element with an “http-equiv” attribute whose value is “content-type”, and a “meta” element with a “charset” attribute.",
          "context": "f-8\">\n    <meta http-equiv=\"Content-type\" content=\"text/html; charset=utf-8\">\n    <",
          "type": "error",
          "tags": [
            "html"
          ],
          "firstColumn": 5,
          "lastLine": 5,
          "lastColumn": 71
        },
        {
          "id": "html",
          "description": " The “type” attribute for the “style” element is not needed and should be omitted.",
          "context": "e=1\">\n    <style type=\"text/css\">\n    b",
          "type": "info",
          "tags": [
            "html"
          ],
          "firstColumn": 5,
          "lastLine": 7,
          "lastColumn": 27
        },
        {
          "id": "html",
          "description": "Consider adding a “lang” attribute to the “html” start tag to declare the language of this document.",
          "context": "TYPE html><html><head>",
          "type": "info",
          "tags": [
            "html"
          ],
          "firstColumn": 16,
          "lastLine": 1,
          "lastColumn": 21
        },
        {
          "id": "html-has-lang",
          "type": "error",
          "description": "Ensures every HTML document has a lang attribute",
          "impact": "serious",
          "tags": [
            "cat.language",
            "wcag2a",
            "wcag311"
          ],
          "help": "<html> element must have a lang attribute",
          "helpUrl": "https://dequeuniversity.com/rules/ta11y/3.4/html-has-lang?application=Ta11y%20API"
        }
      ],
      "summary": {
        "errors": 2,
        "warnings": 0,
        "infos": 2,
        "pass": false
      }
    }
  }
}
```
</details>

---

<p align="center">
  <a href="https://ta11y.saasify.sh" title="ta11y">
    <img src="https://storage.googleapis.com/saasify-uploads-prod/c5480c7c4e006629b4a2f7bfc5b783e2fce662ec.jpeg" alt="ta11y Logo" />
  </a>
  <span>Help us with our goal of building a more accessible and inclusive web! ☺️</span>
</p>

## License

MIT © [Saasify](https://saasify.sh)
