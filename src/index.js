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
import composerScanner from './scanners/composer.js'
import gradleScanner from './scanners/gradle.js'
import mavenScanner from './scanners/maven.js'
import nugetScanner from './scanners/nuget.js'
import aptScanner from './scanners/apt.js'
import pacmanScanner from './scanners/pacman.js'
import dnfScanner from './scanners/dnf.js'
import flatpakScanner from './scanners/flatpak.js'
import snapScanner from './scanners/snap.js'
import yumScanner from './scanners/yum.js'
import wingetScanner from './scanners/winget.js'
import chocoScanner from './scanners/choco.js'
import scoopScanner from './scanners/scoop.js'
import nixScanner from './scanners/nix.js'
import uvScanner from './scanners/uv.js'
import bunScanner from './scanners/bun.js'
import pipxScanner from './scanners/pipx.js'
import poetryScanner from './scanners/poetry.js'
import helmScanner from './scanners/helm.js'
import krewScanner from './scanners/krew.js'
import apkScanner from './scanners/apk.js'
import zypperScanner from './scanners/zypper.js'
import pkgScanner from './scanners/pkg.js'
import goScanner from './scanners/go.js'
import condaScanner from './scanners/conda.js'
import miseScanner from './scanners/mise.js'
import asdfScanner from './scanners/asdf.js'
import macportsScanner from './scanners/macports.js'
import opamScanner from './scanners/opam.js'
import vcpkgScanner from './scanners/vcpkg.js'
import { renderAll } from './display/table.js'

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

function printIssueSummary(scanIssues) {
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

const ALL_SCANNERS = {
  npm: npmScanner,
  pnpm: pnpmScanner,
  yarn: yarnScanner,
  brew: brewScanner,
  volta: voltaScanner,
  pip: pipScanner,
  cargo: cargoScanner,
  gem: gemScanner,
  composer: composerScanner,
  gradle: gradleScanner,
  maven: mavenScanner,
  nuget: nugetScanner,
  apt: aptScanner,
  pacman: pacmanScanner,
  dnf: dnfScanner,
  flatpak: flatpakScanner,
  snap: snapScanner,
  yum: yumScanner,
  winget: wingetScanner,
  choco: chocoScanner,
  scoop: scoopScanner,
  nix: nixScanner,
  uv: uvScanner,
  bun: bunScanner,
  pipx: pipxScanner,
  poetry: poetryScanner,
  helm: helmScanner,
  krew: krewScanner,
  apk: apkScanner,
  zypper: zypperScanner,
  pkg: pkgScanner,
  go: goScanner,
  conda: condaScanner,
  mise: miseScanner,
  asdf: asdfScanner,
  macports: macportsScanner,
  opam: opamScanner,
  vcpkg: vcpkgScanner,
}

export async function run(options) {
  const resolvedOptions = typeof options?.opts === 'function' ? options.opts() : options
  const {
    manager: filterManager,
    search: searchTerm,
    duplicates: duplicatesOnly,
    export: doExport,
    json: doJson,
  } = resolvedOptions

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

  const settled = await Promise.allSettled(scanners.map(([_name, scanFn]) => scanFn()))

  console.warn = originalWarn
  spinner.stop()

  settled.forEach((entry, index) => {
    if (entry.status === 'rejected') {
      scanIssues.push({
        manager: scanners[index][0],
        message: entry.reason?.message || 'scan failed unexpectedly',
        level: 'error',
      })
    }
  })

  let results = settled
    .map((s) => (s.status === 'fulfilled' ? s.value : null))
    .filter((r) => r && r.packages.length > 0)

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
