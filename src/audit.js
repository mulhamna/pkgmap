import ora from 'ora'
import chalk from 'chalk'
import Table from 'cli-table3'

import { renderBanner, MANAGER_ICONS } from './display/table.js'
import { ALL_SCANNERS, printIssueSummary } from './index.js'

const OSV_QUERY_BATCH_URL = 'https://api.osv.dev/v1/querybatch'
const BATCH_SIZE = 100

export const AUDIT_ECOSYSTEMS = {
  npm: 'npm',
  pnpm: 'npm',
  yarn: 'npm',
  bun: 'npm',
  cargo: 'crates.io',
  pip: 'PyPI',
  pipx: 'PyPI',
  poetry: 'PyPI',
  uv: 'PyPI',
  gem: 'RubyGems',
  composer: 'Packagist',
  go: 'Go',
  nuget: 'NuGet',
  maven: 'Maven',
  gradle: 'Maven',
}

export function getAuditEcosystem(manager) {
  return AUDIT_ECOSYSTEMS[manager] || null
}

export function formatAuditStatus(vulns) {
  if (!Array.isArray(vulns) || vulns.length === 0) return 'ok'

  const counts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }

  for (const vuln of vulns) {
    const severities = Array.isArray(vuln?.severity) ? vuln.severity : []
    const level = severities
      .map((entry) => String(entry?.score || '').toUpperCase())
      .find((score) => score.includes('CRITICAL'))
      ? 'critical'
      : severities
            .map((entry) => String(entry?.score || '').toUpperCase())
            .find((score) => score.includes('HIGH'))
        ? 'high'
        : severities
              .map((entry) => String(entry?.score || '').toUpperCase())
              .find((score) => score.includes('MEDIUM'))
          ? 'medium'
          : severities
                .map((entry) => String(entry?.score || '').toUpperCase())
                .find((score) => score.includes('LOW'))
            ? 'low'
            : 'unknown'

    counts[level] += 1
  }

  const parts = ['critical', 'high', 'medium', 'low']
    .filter((level) => counts[level] > 0)
    .map((level) => `${level}:${counts[level]}`)

  if (counts.unknown > 0 || parts.length === 0) {
    parts.push(`unknown:${counts.unknown || vulns.length}`)
  }

  return parts.join(', ')
}

function colorStatus(status) {
  if (status === 'ok') return chalk.green(status)
  if (status === 'unsupported') return chalk.dim(status)
  if (status === 'error') return chalk.red(status)
  if (status.startsWith('critical:')) return chalk.red(status)
  if (status.includes('critical:')) return chalk.red(status)
  if (status.includes('high:')) return chalk.yellow(status)
  return chalk.magenta(status)
}

function renderAuditSummary(results) {
  const managerCounts = new Map()

  for (const result of results) {
    managerCounts.set(result.manager, (managerCounts.get(result.manager) || 0) + 1)
  }

  const parts = [...managerCounts.entries()].map(([manager, count]) => {
    const icon = MANAGER_ICONS[manager] || '📦'
    return `${icon} ${chalk.bold(manager)}: ${chalk.yellow(count)}`
  })

  console.log('  ' + parts.join(chalk.dim('  ·  ')))
  console.log(
    '  ' +
      chalk.dim(
        `Total: ${chalk.bold.white(results.length)} package audit check(s) across ${managerCounts.size} manager(s)`
      )
  )
  console.log()
}

function renderAuditResults(results) {
  renderBanner()
  renderAuditSummary(results)

  const table = new Table({
    head: [chalk.bold('Package Manager'), chalk.bold('Package'), chalk.bold('Status')],
    colWidths: [18, 38, 24],
    style: { head: [], border: [] },
  })

  const sorted = [...results].sort(
    (a, b) => a.manager.localeCompare(b.manager) || a.package.localeCompare(b.package)
  )

  for (const result of sorted) {
    table.push([result.manager, result.package, colorStatus(result.status)])
  }

  console.log(table.toString())
  console.log()
}

function chunk(items, size) {
  const batches = []
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }
  return batches
}

async function queryOsvBatch(queries) {
  const response = await globalThis.fetch(OSV_QUERY_BATCH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ queries }),
  })

  if (!response.ok) {
    throw new Error(`OSV request failed with ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data?.results) ? data.results : []
}

async function auditPackages(manager, packages) {
  const ecosystem = getAuditEcosystem(manager)
  if (!ecosystem) {
    return packages.map((pkg) => ({
      manager,
      package: pkg.name,
      version: pkg.version,
      status: 'unsupported',
    }))
  }

  const queries = packages.map((pkg) => ({
    package: { ecosystem, name: pkg.name },
    version: pkg.version,
  }))

  const batches = chunk(queries, BATCH_SIZE)
  const results = []

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]
    const batchResults = await queryOsvBatch(batch)

    for (let itemIndex = 0; itemIndex < batch.length; itemIndex += 1) {
      const pkg = packages[index * BATCH_SIZE + itemIndex]
      const vulns = batchResults[itemIndex]?.vulns || []
      results.push({
        manager,
        package: pkg.name,
        version: pkg.version,
        status: formatAuditStatus(vulns),
      })
    }
  }

  return results
}

export async function runAudit(options) {
  const resolvedOptions = typeof options?.opts === 'function' ? options.opts() : options
  const filterManager = resolvedOptions?.manager?.toLowerCase()
  const packageFilter = resolvedOptions?.package?.toLowerCase()
  const doJson = Boolean(resolvedOptions?.json || options?.parent?.opts?.().json)

  let scanners = Object.entries(ALL_SCANNERS)
  if (filterManager) {
    const selected = ALL_SCANNERS[filterManager]
    if (!selected) {
      console.error(chalk.red(`✗ Unknown manager: "${filterManager}"`))
      console.error(`  Available: ${Object.keys(ALL_SCANNERS).join(', ')}`)
      process.exit(1)
    }
    scanners = [[filterManager, selected]]
  }

  const spinner = ora('Checking package audit status...').start()
  const scanIssues = []

  try {
    const settled = await Promise.allSettled(scanners.map(([_name, scanFn]) => scanFn()))

    const scanned = settled
      .map((entry, index) => {
        if (entry.status === 'fulfilled') return entry.value
        scanIssues.push({
          manager: scanners[index][0],
          message: entry.reason?.message || 'scan failed unexpectedly',
          level: 'error',
        })
        return null
      })
      .filter(Boolean)
      .map((result) => ({
        ...result,
        packages: packageFilter
          ? result.packages.filter((pkg) => pkg.name.toLowerCase().includes(packageFilter))
          : result.packages,
      }))
      .filter((result) => result.packages.length > 0)

    if (scanned.length === 0) {
      spinner.stop()
      console.log(chalk.yellow('No matching installed packages found to audit.'))
      printIssueSummary(scanIssues)
      return
    }

    const auditResults = []
    for (const result of scanned) {
      try {
        const rows = await auditPackages(result.manager, result.packages)
        auditResults.push(...rows)
      } catch (error) {
        auditResults.push(
          ...result.packages.map((pkg) => ({
            manager: result.manager,
            package: pkg.name,
            version: pkg.version,
            status: 'error',
          }))
        )
        scanIssues.push({
          manager: result.manager,
          message: error.message || 'audit check failed',
          level: 'error',
        })
      }
    }

    spinner.stop()

    const payload = {
      generatedAt: new Date().toISOString(),
      results: auditResults,
      warnings: scanIssues,
    }

    if (doJson) {
      console.log(JSON.stringify(payload, null, 2))
      return
    }

    renderAuditResults(auditResults)
    printIssueSummary(scanIssues)
  } catch (error) {
    spinner.stop()
    console.error(chalk.red(`✗ ${error.message || 'Audit check failed.'}`))
    process.exit(1)
  }
}
