import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import chalk from 'chalk'
import Table from 'cli-table3'

import { renderBanner } from './display/table.js'

function safeReaddir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function safeReadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

// Top-level entries in node_modules that are not installed packages.
const SKIP_NAMES = new Set(['.bin', '.cache', 'npm', 'corepack'])

// Read installed packages from one `node_modules` directory. Pure + injectable
// so the scope/skip rules can be tested without touching the filesystem.
export function readGlobalPackages(
  modulesDir,
  { readdir = safeReaddir, readJson = safeReadJson } = {}
) {
  const packages = []

  for (const entry of readdir(modulesDir)) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    if (name.startsWith('.') || SKIP_NAMES.has(name)) continue

    if (name.startsWith('@')) {
      const scopeDir = join(modulesDir, name)
      for (const inner of readdir(scopeDir)) {
        if (!inner.isDirectory() || inner.name.startsWith('.')) continue
        const pkg = readJson(join(scopeDir, inner.name, 'package.json'))
        packages.push({ name: `${name}/${inner.name}`, version: pkg?.version || 'unknown' })
      }
      continue
    }

    const pkg = readJson(join(modulesDir, name, 'package.json'))
    packages.push({ name, version: pkg?.version || 'unknown' })
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

// Every Node version manager keeps installs under a versions dir; map each
// version dir to the node_modules that holds its global packages.
function nodeVersionSources() {
  const home = homedir()
  const env = process.env
  const sources = []
  const libMods = (dir) => join(dir, 'lib', 'node_modules')

  const add = (manager, versionsDir, toModules) => {
    for (const entry of safeReaddir(versionsDir)) {
      if (!entry.isDirectory()) continue
      sources.push({
        manager,
        nodeVersion: entry.name,
        modulesDir: toModules(join(versionsDir, entry.name)),
      })
    }
  }

  add('nvm', join(env.NVM_DIR || join(home, '.nvm'), 'versions', 'node'), libMods)
  if (env.APPDATA) add('nvm-windows', join(env.APPDATA, 'nvm'), (dir) => join(dir, 'node_modules'))

  const fnmBase =
    env.FNM_DIR ||
    (process.platform === 'darwin'
      ? join(home, 'Library', 'Application Support', 'fnm')
      : join(home, '.local', 'share', 'fnm'))
  add('fnm', join(fnmBase, 'node-versions'), (dir) => libMods(join(dir, 'installation')))

  add('volta', join(env.VOLTA_HOME || join(home, '.volta'), 'tools', 'image', 'node'), libMods)
  add('n', join(env.N_PREFIX || '/usr/local', 'n', 'versions', 'node'), libMods)
  add('asdf', join(env.ASDF_DATA_DIR || join(home, '.asdf'), 'installs', 'nodejs'), libMods)
  add('mise', join(home, '.local', 'share', 'mise', 'installs', 'node'), libMods)
  add('nodenv', join(env.NODENV_ROOT || join(home, '.nodenv'), 'versions'), libMods)

  return sources
}

export function collectNodeVersions() {
  return nodeVersionSources()
    .map(({ manager, nodeVersion, modulesDir }) => ({
      manager,
      nodeVersion,
      path: modulesDir,
      packages: readGlobalPackages(modulesDir),
    }))
    .filter((entry) => entry.packages.length > 0)
    .sort(
      (a, b) => a.manager.localeCompare(b.manager) || a.nodeVersion.localeCompare(b.nodeVersion)
    )
}

function renderNodeVersions(versions) {
  renderBanner()

  const totalPackages = versions.reduce((sum, v) => sum + v.packages.length, 0)
  console.log(
    '  ' +
      chalk.dim(
        `Total: ${chalk.bold.white(totalPackages)} global package(s) across ${versions.length} Node version(s)`
      )
  )
  console.log()

  const table = new Table({
    head: [chalk.bold('Manager'), chalk.bold('Node'), chalk.bold('Package'), chalk.bold('Version')],
    colWidths: [12, 16, 38, 16],
    style: { head: [], border: [] },
  })

  for (const version of versions) {
    for (const pkg of version.packages) {
      table.push([
        version.manager,
        chalk.cyan(version.nodeVersion),
        pkg.name,
        chalk.green(pkg.version),
      ])
    }
  }

  console.log(table.toString())
  console.log()
}

export async function runNodeVersions(options) {
  const resolvedOptions = typeof options?.opts === 'function' ? options.opts() : options
  const doJson = Boolean(resolvedOptions?.json || options?.parent?.opts?.().json)

  const versions = collectNodeVersions()

  if (doJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), versions }, null, 2))
    return
  }

  if (versions.length === 0) {
    console.log(chalk.yellow('No managed Node.js versions with global packages found.'))
    return
  }

  renderNodeVersions(versions)
}
