'use strict'

const fs = require('fs-extra')
const globby = require('globby')
const path = require('path')
const tempy = require('tempy')
const test = require('ava')

const { formatAuditResults } = require('.')

const fixtures = globby.sync('./fixtures/*.json', {
  cwd: path.join(__dirname, '..')
})

const formats = ['xls', 'xlsx', 'json', 'html', 'csv', 'txt']

for (const fixture of fixtures) {
  const { name } = path.parse(fixture)

  for (const format of formats) {
    test(`${name} => ${format}`, async (t) => {
      const results = await fs.readJson(fixture)
      const file = tempy.file({ extension: format })
      const output = await formatAuditResults(results, file)

      t.deepEqual(results, output)
      t.true(await fs.pathExists(file))
      await fs.remove(file)
    })
  }
}
