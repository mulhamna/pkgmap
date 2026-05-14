import test from 'node:test'
import assert from 'node:assert/strict'

import { filterDuplicatePackages, normalizeWarning } from '../src/index.js'

test('normalizeWarning flattens mixed warning arguments', () => {
  const error = new Error('kaput')
  const warning = normalizeWarning(['⚠ npm: scan failed', { retry: false }, error])

  assert.equal(warning, '⚠ npm: scan failed {"retry":false} kaput')
})

test('filterDuplicatePackages keeps only packages seen in multiple managers', () => {
  const results = [
    {
      manager: 'npm',
      packages: [
        { name: 'typescript', version: '5.8.0', type: 'cli' },
        { name: 'eslint', version: '9.0.0', type: 'cli' },
      ],
    },
    {
      manager: 'brew',
      packages: [{ name: 'typescript', version: '5.7.0', type: 'formula' }],
    },
    {
      manager: 'pip',
      packages: [{ name: 'requests', version: '2.0.0', type: 'library' }],
    },
  ]

  assert.deepEqual(filterDuplicatePackages(results), [
    {
      manager: 'npm',
      packages: [{ name: 'typescript', version: '5.8.0', type: 'cli' }],
    },
    {
      manager: 'brew',
      packages: [{ name: 'typescript', version: '5.7.0', type: 'formula' }],
    },
  ])
})
