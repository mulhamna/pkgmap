import test from 'node:test'
import assert from 'node:assert/strict'

import { filterDuplicatePackages, normalizeWarning } from '../src/index.js'
import { annotatePorts, filterSuspiciousPorts, terminatePorts } from '../src/ports.js'

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

test('annotatePorts marks orphan and zombie listeners', () => {
  const ports = [
    {
      port: 3000,
      protocol: 'tcp',
      address: '127.0.0.1',
      process: 'node',
      pid: 111,
      state: 'LISTEN',
    },
    {
      port: 4000,
      protocol: 'tcp',
      address: '0.0.0.0',
      process: 'unknown',
      pid: null,
      state: 'LISTEN',
    },
    {
      port: 5000,
      protocol: 'tcp',
      address: '0.0.0.0',
      process: 'python',
      pid: 222,
      state: 'LISTEN',
    },
  ]

  const annotated = annotatePorts(ports, (pid) => {
    if (pid === 111)
      return { healthStatus: 'ok', reason: 'process found', meta: { command: 'node' } }
    if (pid === 222)
      return { healthStatus: 'zombie', reason: 'zombie process', meta: { command: 'python' } }
    return { healthStatus: 'orphan', reason: 'pid not found' }
  })

  assert.equal(annotated[0].healthStatus, 'ok')
  assert.equal(annotated[1].healthStatus, 'orphan')
  assert.equal(annotated[2].healthStatus, 'zombie')
  assert.deepEqual(
    filterSuspiciousPorts(annotated).map((entry) => entry.port),
    [4000, 5000]
  )
})

test('terminatePorts deduplicates PIDs before signalling', () => {
  const ports = [
    { port: 3000, pid: 111 },
    { port: 3001, pid: 111 },
    { port: 3002, pid: null },
  ]

  const calls = []
  const originalKill = process.kill
  process.kill = (pid, signal) => calls.push({ pid, signal })

  try {
    const result = terminatePorts(ports, { signal: 'SIGTERM' })
    assert.deepEqual(calls, [{ pid: 111, signal: 'SIGTERM' }])
    assert.deepEqual(result.killed, [111])
    assert.equal(result.skipped.length, 1)
  } finally {
    process.kill = originalKill
  }
})
