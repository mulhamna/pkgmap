import Table from 'cli-table3'
import chalk from 'chalk'

const MANAGER_ICONS = {
  npm: '📦',
  pnpm: '📦',
  yarn: '🧶',
  brew: '🍺',
  volta: '⚡',
  pip: '🐍',
  cargo: '🦀',
  gem: '💎',
}

export function renderAll(results) {
  // Header banner
  console.log()
  console.log(chalk.bold.cyan('┌─────────────────────────────────────────────┐'))
  console.log(chalk.bold.cyan('│') + chalk.bold('  pkgmap — local package inventory           ') + chalk.bold.cyan('│'))
  console.log(chalk.bold.cyan('└─────────────────────────────────────────────┘'))
  console.log()

  // Build a map of package name → managers, for duplicate detection
  const packageManagerMap = {}
  for (const result of results) {
    for (const pkg of result.packages) {
      if (!packageManagerMap[pkg.name]) packageManagerMap[pkg.name] = []
      packageManagerMap[pkg.name].push(result.manager)
    }
  }

  for (const result of results) {
    const icon = MANAGER_ICONS[result.manager] || '📦'
    console.log(chalk.bold(`${icon} ${result.manager} (${result.packages.length} packages)`))

    const table = new Table({
      head: [chalk.bold('Package'), chalk.bold('Version')],
      colWidths: [30, 20],
      style: { head: [], border: [] },
    })

    for (const pkg of result.packages) {
      const managers = packageManagerMap[pkg.name]
      const isDuplicate = managers.length > 1

      const otherManagers = managers.filter((m) => m !== result.manager)
      const dupBadge = isDuplicate ? chalk.dim(` [also in ${otherManagers.join(', ')}]`) : ''

      const nameCell = isDuplicate
        ? chalk.yellow(pkg.name) + dupBadge
        : pkg.name

      table.push([nameCell, chalk.green(pkg.version)])
    }

    console.log(table.toString())
    console.log()
  }
}
