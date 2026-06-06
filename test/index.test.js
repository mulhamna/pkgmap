import test from 'node:test'
import assert from 'node:assert/strict'

import { filterDuplicatePackages, normalizeWarning } from '../src/index.js'
import { formatAuditStatus, getAuditEcosystem } from '../src/audit.js'
import { annotatePorts, filterSuspiciousPorts, terminatePorts } from '../src/ports.js'
import { parseGoBinaryMetadata } from '../src/scanners/go.js'
import { parseVcpkgList } from '../src/scanners/vcpkg.js'
import { buildUpgradeCommand, getUpgradePlan } from '../src/upgrade.js'

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

test('formatAuditStatus summarizes vulnerability severity counts', () => {
  const status = formatAuditStatus([
    { severity: [{ score: 'CVSS_V3:CRITICAL/9.8' }] },
    { severity: [{ score: 'CVSS_V3:HIGH/8.1' }] },
    { severity: [{ score: 'CVSS_V3:HIGH/7.5' }] },
  ])

  assert.equal(status, 'critical:1, high:2')
})

test('formatAuditStatus falls back to advisory when severity is missing', () => {
  const status = formatAuditStatus([{ id: 'GHSA-demo' }])

  assert.equal(status, 'advisory:1')
})

test('getAuditEcosystem maps supported managers', () => {
  assert.equal(getAuditEcosystem('npm'), 'npm')
  assert.equal(getAuditEcosystem('cargo'), 'crates.io')
  assert.equal(getAuditEcosystem('apt'), null)
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

test('parseVcpkgList ignores footer lines', () => {
  const raw = [
    'abseil:x64-windows 20240116.1#1',
    'zlib:x64-windows 1.3.1#2',
    'Total installed packages: 2',
  ].join('\n')

  assert.deepEqual(parseVcpkgList(raw), [
    {
      name: 'abseil:x64-windows',
      version: '20240116.1#1',
      type: 'library',
    },
    {
      name: 'zlib:x64-windows',
      version: '1.3.1#2',
      type: 'library',
    },
  ])
})

test('parseGoBinaryMetadata keeps only binaries with Go build metadata', () => {
  const raw = [
    '/tmp/gopls: go1.24.0',
    '\tpath\tgolang.org/x/tools/gopls',
    '\tmod\tgolang.org/x/tools/gopls\tv0.16.2\th1:abc',
    '\tbuild\t-buildmode=exe',
  ].join('\n')

  assert.deepEqual(parseGoBinaryMetadata(raw, 'gopls'), {
    name: 'gopls',
    version: 'v0.16.2',
    type: 'binary',
    auditName: 'golang.org/x/tools/gopls',
  })

  assert.equal(parseGoBinaryMetadata('not a Go executable', 'random-tool'), null)
})

test('getUpgradePlan exposes supported manager upgrade commands', () => {
  assert.deepEqual(getUpgradePlan('npm'), { commands: ['npm update -g'] })
  assert.equal(typeof getUpgradePlan('cargo')?.buildCommands, 'function')
})

test('buildUpgradeCommand joins multi-step plans', () => {
  assert.equal(
    buildUpgradeCommand('apt', { commands: ['apt update', 'apt upgrade -y'], elevated: false }),
    'apt update && apt upgrade -y'
  )
})

test('buildUpgradeCommand expands dynamic cargo package installs', () => {
  assert.equal(
    buildUpgradeCommand(
      'cargo',
      {
        buildCommands(packages = []) {
          return packages.map((pkg) => `cargo install ${pkg.name}`)
        },
      },
      [{ name: 'cargo-audit' }, { name: 'bacon' }]
    ),
    'cargo install cargo-audit && cargo install bacon'
  )
})
