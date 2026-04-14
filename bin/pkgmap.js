#!/usr/bin/env node
import { program } from 'commander'
import { createRequire } from 'module'
import { run } from '../src/index.js'
import { APP_VERSION } from '../src/version.js'

program
  .name('pkgmap')
  .description('See everything installed on your machine')
  .version(APP_VERSION)
  .option('-m, --manager <name>', 'scan only a specific package manager')
  .option('-s, --search <package>', 'search for a specific package')
  .option('-e, --export', 'export results to pkgmap-export.json')
  .action(run)

program.parse()
