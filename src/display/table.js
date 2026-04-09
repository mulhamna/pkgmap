import Table from 'cli-table3'
import chalk from 'chalk'

export const MANAGER_ICONS = {
  npm: '📦',
  pnpm: '📦',
  yarn: '🧶',
  brew: '🍺',
  volta: '⚡',
  pip: '🐍',
  cargo: '🦀',
  gem: '💎',
}

export function renderBanner() {
  console.log()
  console.log(chalk.cyan('  ╔═══════════════════════════════════╗'))
  console.log(
    chalk.cyan('  ║') +
      chalk.bold('  📦 pkgmap  ') +
      chalk.dim('v0.1.0') +
      chalk.cyan('               ║')
  )
  console.log(chalk.cyan('  ╚═══════════════════════════════════╝'))
  console.log()
}

export function renderSummary(results) {
  const parts = results.map((r) => {
    const icon = MANAGER_ICONS[r.manager] || '📦'
    return `${icon} ${chalk.bold(r.manager)}: ${chalk.yellow(r.packages.length)}`
  })

  const total = results.reduce((sum, r) => sum + r.packages.length, 0)

  console.log('  ' + parts.join(chalk.dim('  ·  ')))
  console.log(
    '  ' +
      chalk.dim(`Total: ${chalk.bold.white(total)} packages across ${results.length} manager(s)`)
  )
  console.log()
}

const TYPE_COLORS = {
  formula: (s) => chalk.blue(s),
  cask: (s) => chalk.magenta(s),
  cli: (s) => chalk.cyan(s),
  library: (s) => chalk.green(s),
  binary: (s) => chalk.red(s),
  runtime: (s) => chalk.yellow(s),
  gem: (s) => chalk.magenta(s),
}

function colorType(type) {
  const fn = TYPE_COLORS[type]
  return fn ? fn(type) : chalk.dim(type || '—')
}

export function renderAll(results) {
  renderBanner()
  renderSummary(results)

  // Build duplicate map
  const packageManagerMap = {}
  for (const result of results) {
    for (const pkg of result.packages) {
      if (!packageManagerMap[pkg.name]) packageManagerMap[pkg.name] = []
      packageManagerMap[pkg.name].push(result.manager)
    }
  }

  const table = new Table({
    head: [chalk.bold('Manager'), chalk.bold('Package'), chalk.bold('Version'), chalk.bold('Type')],
    colWidths: [10, 36, 18, 12],
    style: { head: [], border: [] },
  })

  for (const result of results) {
    const icon = MANAGER_ICONS[result.manager] || '📦'

    for (const pkg of result.packages) {
      const managers = packageManagerMap[pkg.name]
      const isDuplicate = managers.length > 1
      const otherManagers = managers.filter((m) => m !== result.manager)

      const managerCell = `${icon} ${result.manager}`
      const nameCell = isDuplicate
        ? chalk.yellow(pkg.name) + chalk.dim(` ↔ ${otherManagers.join(', ')}`)
        : pkg.name
      const versionCell = chalk.green(pkg.version)
      const typeCell = colorType(pkg.type)

      table.push([managerCell, nameCell, versionCell, typeCell])
    }
  }

  console.log(table.toString())
  console.log()
}
