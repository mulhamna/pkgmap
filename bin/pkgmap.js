#!/usr/bin/env node
import { program } from 'commander'
import { createRequire } from 'module'
import { run } from '../src/index.js'
import { runPorts } from '../src/ports.js'
import { APP_VERSION } from '../src/version.js'

program
  .name('pkgmap')
  .description('See everything installed on your machine')
  .version(APP_VERSION)
  .option('-m, --manager <name>', 'scan only a specific package manager')
  .option('-s, --search <package>', 'search for a specific package')
  .option('-d, --duplicates', 'show only packages installed via multiple managers')
  .option('-e, --export', 'export results to pkgmap-export.json')
  .option('-j, --json', 'print results as JSON to stdout')
  .action(run)

program
  .command('ports')
  .description('see active listening ports on your machine')
  .option('-j, --json', 'print active ports as JSON to stdout')
  .option('-k, --kill <port-or-pid>', 'terminate the process listening on a port (or matching a PID)')
  .option('-f, --force', 'use SIGKILL instead of SIGTERM when used with --kill')
  .option('-c, --check', 'show only orphan or zombie listening ports')
  .action(runPorts)

program.parse()
