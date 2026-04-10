import ora from 'ora'
import chalk from 'chalk'
import { writeFileSync } from 'fs'

import npmScanner from './scanners/npm.js'
import pnpmScanner from './scanners/pnpm.js'
import yarnScanner from './scanners/yarn.js'
import brewScanner from './scanners/brew.js'
import voltaScanner from './scanners/volta.js'
import pipScanner from './scanners/pip.js'
import cargoScanner from './scanners/cargo.js'
import gemScanner from './scanners/gem.js'
import { renderAll } from './display/table.js'

const ALL_SCANNERS = {
  npm: npmScanner,
  pnpm: pnpmScanner,
  yarn: yarnScanner,
  brew: brewScanner,
  volta: voltaScanner,
  pip: pipScanner,
  cargo: cargoScanner,
  gem: gemScanner,
}

export async function run(options) {
  const { manager: filterManager, search: searchTerm, export: doExport } = options

  // Determine which scanners to run
  let scanners = Object.entries(ALL_SCANNERS)

  if (filterManager) {
    const selected = ALL_SCANNERS[filterManager.toLowerCase()]
    if (!selected) {
      console.error(chalk.red(`✗ Unknown manager: "${filterManager}"`))
      console.error(`  Available: ${Object.keys(ALL_SCANNERS).join(', ')}`)
      process.exit(1)
    }
    scanners = [[filterManager.toLowerCase(), selected]]
  }

  const spinner = ora('Scanning package managers...').start()

  // Run all scanners in parallel
  const settled = await Promise.allSettled(
    scanners.map(async ([_name, scanFn]) => {
      const result = await scanFn()
      return result
    })
  )

  spinner.stop()

  // Collect successful, non-null results with at least 1 package
  let results = settled
    .map((s) => (s.status === 'fulfilled' ? s.value : null))
    .filter((r) => r && r.packages.length > 0)

  if (results.length === 0) {
    console.log(chalk.yellow('No package managers found or all scans failed.'))
    return
  }

  // Apply search filter
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

    console.log(chalk.cyan(`Found ${results.reduce((sum, r) => sum + r.packages.length, 0)} matching package(s) for "${searchTerm}".`))
  }

  // Export to JSON
  if (doExport) {
    const exportData = {
      generatedAt: new Date().toISOString(),
      results,
    }
    writeFileSync('pkgmap-export.json', JSON.stringify(exportData, null, 2))
    console.log(chalk.green('✔ Exported to pkgmap-export.json'))
    if (!searchTerm) return
  }

  renderAll(results)
}
