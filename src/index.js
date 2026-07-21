import ora from 'ora'
import chalk from 'chalk'
import { writeFileSync, readdirSync } from 'fs'

import { renderAll } from './display/table.js'
import { optsOf } from './utils.js'

export function normalizeWarning(args) {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.message
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
    .trim()
}

export function printIssueSummary(scanIssues) {
  if (scanIssues.length === 0) return

  console.log()
  console.log(chalk.yellow(`Warnings: ${scanIssues.length}`))

  for (const issue of scanIssues) {
    console.log(chalk.yellow(`- ${issue.manager}: ${issue.message}`))
  }
}

export function filterDuplicatePackages(results) {
  const packageManagerMap = new Map()

  for (const result of results) {
    for (const pkg of result.packages) {
      if (!packageManagerMap.has(pkg.name)) packageManagerMap.set(pkg.name, new Set())
      packageManagerMap.get(pkg.name).add(result.manager)
    }
  }

  return results
    .map((result) => ({
      ...result,
      packages: result.packages.filter((pkg) => packageManagerMap.get(pkg.name)?.size > 1),
    }))
    .filter((result) => result.packages.length > 0)
}

// Auto-load every scanner in ./scanners keyed by filename (filename === manager).
// Drop a new file in that dir and it registers itself — no edit here needed.
const scannerDir = new URL('./scanners/', import.meta.url)
export const ALL_SCANNERS = Object.fromEntries(
  await Promise.all(
    readdirSync(scannerDir)
      .filter((file) => file.endsWith('.js'))
      .sort()
      .map(async (file) => [file.slice(0, -3), (await import(`./scanners/${file}`)).default])
  )
)

// Resolve the scanner list for an optional manager filter; exit on unknown name.
export function resolveScanners(filterManager) {
  if (!filterManager) return Object.entries(ALL_SCANNERS)

  const key = filterManager.toLowerCase()
  const selected = ALL_SCANNERS[key]
  if (!selected) {
    console.error(chalk.red(`✗ Unknown manager: "${filterManager}"`))
    console.error(`  Available: ${Object.keys(ALL_SCANNERS).join(', ')}`)
    process.exit(1)
  }
  return [[key, selected]]
}

// Run every selected scanner in parallel; split into results and error issues.
export async function scanAll(filterManager) {
  const scanners = resolveScanners(filterManager)
  const settled = await Promise.allSettled(scanners.map(([, scanFn]) => scanFn()))

  const results = []
  const issues = []
  settled.forEach((entry, index) => {
    if (entry.status === 'fulfilled') {
      if (entry.value) results.push(entry.value)
    } else {
      issues.push({
        manager: scanners[index][0],
        message: entry.reason?.message || 'scan failed unexpectedly',
        level: 'error',
      })
    }
  })

  return { results, issues }
}

export async function run(options) {
  const resolvedOptions = optsOf(options)
  const {
    manager: filterManager,
    search: searchTerm,
    duplicates: duplicatesOnly,
    export: doExport,
    json: doJson,
  } = resolvedOptions

  const spinner = ora('Scanning package managers...').start()

  const scanIssues = []
  const originalWarn = console.warn

  console.warn = (...args) => {
    const message = normalizeWarning(args)
    const managerMatch = message.match(/^⚠\s*([a-z0-9-]+):/i)
    scanIssues.push({
      manager: managerMatch?.[1] || 'scan',
      message,
      level: 'warning',
    })
  }

  const { results: scanned, issues } = await scanAll(filterManager)

  console.warn = originalWarn
  spinner.stop()

  scanIssues.push(...issues)

  let results = scanned.filter((r) => r && r.packages.length > 0)

  if (results.length === 0) {
    console.log(chalk.yellow('No package managers found or all scans failed.'))
    printIssueSummary(scanIssues)
    return
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    results = results
      .map((r) => ({
        ...r,
        packages: r.packages.filter((p) => p.name.toLowerCase().includes(term)),
      }))
      .filter((r) => r.packages.length > 0)

    if (results.length === 0) {
      console.log(chalk.yellow(`No packages found matching "${searchTerm}".`))
      return
    }

    console.log(
      chalk.cyan(
        `Found ${results.reduce((sum, r) => sum + r.packages.length, 0)} matching package(s) for "${searchTerm}".`
      )
    )
  }

  if (duplicatesOnly) {
    results = filterDuplicatePackages(results)

    if (results.length === 0) {
      console.log(chalk.yellow('No duplicate packages found across managers.'))
      printIssueSummary(scanIssues)
      return
    }
  }

  const exportData = {
    generatedAt: new Date().toISOString(),
    results,
    warnings: scanIssues,
  }

  if (doExport) {
    writeFileSync('pkgmap-export.json', JSON.stringify(exportData, null, 2))
    console.log(chalk.green('✔ Exported to pkgmap-export.json'))
  }

  if (doJson) {
    console.log(JSON.stringify(exportData, null, 2))
    return
  }

  if (doExport && searchTerm) return

  renderAll(results)
  printIssueSummary(scanIssues)
}
