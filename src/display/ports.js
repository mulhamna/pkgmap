import Table from 'cli-table3'
import chalk from 'chalk'

function renderHealth(status) {
  if (status === 'zombie') return chalk.red('zombie')
  if (status === 'orphan') return chalk.yellow('orphan')
  return chalk.green('ok')
}

export function renderPorts(ports, options = {}) {
  const includeHealth = Boolean(options.includeHealth)
  const table = new Table({
    head: [
      chalk.bold('Port'),
      chalk.bold('Protocol'),
      chalk.bold('Process'),
      chalk.bold('PID'),
      chalk.bold('Address'),
      chalk.bold('State'),
      ...(includeHealth ? [chalk.bold('Health')] : []),
    ],
    colWidths: includeHealth ? [8, 10, 22, 10, 28, 12, 12] : [8, 10, 22, 10, 28, 12],
    style: { head: [], border: [] },
  })

  for (const item of ports) {
    table.push([
      chalk.cyan(`:${item.port}`),
      chalk.magenta(item.protocol),
      item.process,
      item.pid ? chalk.yellow(String(item.pid)) : chalk.dim('—'),
      chalk.dim(item.address),
      chalk.green(item.state),
      ...(includeHealth ? [renderHealth(item.healthStatus)] : []),
    ])
  }

  console.log(`  ${chalk.bold.yellow(ports.length)} active listening port(s)\n`)
  console.log(table.toString())
  console.log()
}
