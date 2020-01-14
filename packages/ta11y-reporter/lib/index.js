'use strict'

const fs = require('fs-extra')
const xlsx = require('xlsx')

const getExtension = require('./get-extension')

/**
 * Formats and outputs the given audit results from `@ta11y/core`, optionally writing
 * them to a `file`.
 *
 * If no options / filename is passed, the input will be returned untransformed.
 *
 * @param {object} auditResults - JSON audit results to format.
 * @param {object|string} [opts] - Filename to write or config options.
 * @param {string} [opts.file] - Filename to write.
 * @param {string} [opts.format] - File format to use (by default this is inferred from the filename).
 * @param {string} [opts.encoding] - File encoding to use (by default this is inferred from the file format).
 *
 * @return {Promise}
 */
exports.formatAuditResults = async (auditResults, opts) => {
  if (typeof opts === 'string') {
    opts = { file: opts }
  }

  const { format, file } = opts

  if (!format && !file) {
    return auditResults
  }

  if (file && getExtension(file) === 'json') {
    await fs.writeJson(file, auditResults, { spaces: 2 })
    return auditResults
  }

  const results = Object.keys(auditResults.results)
    .map((url) => {
      const auditResultsPage = auditResults.results[url]

      return [
        auditResultsPage.error && {
          url,
          depth: auditResultsPage.depth,
          error: auditResultsPage.error
        }
      ]
        .concat(
          auditResultsPage.rules.map((rule) => ({
            url,
            depth: auditResultsPage.depth,
            ...rule,
            tags: rule.tags.join(',')
          }))
        )
        .filter(Boolean)
    })
    .reduce((acc, cur) => acc.concat(cur), [])

  const formattedResults = await exports.formatResults(results, {
    label: 'Audit Results',
    ...opts
  })

  if (file) {
    return auditResults
  } else {
    return formattedResults
  }
}

/**
 * Formats and outputs the given extraction results from `@ta11y/extract`, optionally writing
 * them to a `file`.
 *
 * If no options / filename is passed, the input will be returned untransformed.
 *
 * @param {object} auditResults - JSON audit results to format.
 * @param {object|string} [opts] - Filename to write or config options.
 * @param {string} [opts.file] - Filename to write.
 * @param {string} [opts.format] - File format to use (by default this is inferred from the filename).
 * @param {string} [opts.encoding] - File encoding to use (by default this is inferred from the file format).
 *
 * @return {Promise}
 */
exports.formatExtractResults = async (extractResults, opts) => {
  if (typeof opts === 'string') {
    opts = { file: opts }
  }

  const { format, file } = opts

  if (!format && !file) {
    return extractResults
  }

  if (file && getExtension(file) === 'json') {
    await fs.writeJson(file, extractResults, { spaces: 2 })
    return extractResults
  }

  const results = Object.keys(extractResults.results).map(
    (url) => extractResults.results[url]
  )

  const formattedResults = await exports.formatResults(results, {
    label: 'Extract Results',
    ...opts
  })

  if (file) {
    return extractResults
  } else {
    return formattedResults
  }
}

/**
 * @private
 */
exports.formatResults = async (results, opts) => {
  let { format, encoding, file, label = 'Results' } = opts

  if (!format && !file) {
    return results
  }

  if (file && getExtension(file) === 'json') {
    await fs.writeJson(file, results, { spaces: 2 })
    return results
  }

  const ws = xlsx.utils.json_to_sheet(results)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, label)

  if (file) {
    return xlsx.writeFile(wb, file)
  }

  format = format ? format.toLowerCase() : undefined
  encoding = encoding ? encoding.toLowerCase() : undefined

  if (!encoding) {
    encoding =
      {
        htm: 'string',
        html: 'string',
        txt: 'string',
        csv: 'string',
        tsv: 'string',
        xml: 'string',
        lxml: 'string'
      }[format] || 'binary'
  }

  return xlsx.write(wb, {
    bookType: format,
    type: encoding
  })
}
