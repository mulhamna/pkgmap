#!/usr/bin/env node
import { program } from 'commander'
import { run } from '../src/index.js'

program
  .name('pkgmap')
  .description('See everything installed on your machine')
  .version('0.1.0')
  .option('-m, --manager <name>', 'scan only a specific package manager')
  .option('-s, --search <package>', 'search for a specific package')
  .option('-e, --export', 'export results to pkgmap-export.json')
  .action(run)

program.parse()
