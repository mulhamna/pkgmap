import chalk from 'chalk'
import ora from 'ora'
import { spawnSync } from 'child_process'

import { scanAll, printIssueSummary } from './index.js'
import { isAvailable, getCliOptionValue, hasCliFlag, optsOf } from './utils.js'
import { renderBanner, MANAGER_ICONS } from './display/table.js'

export const UPGRADE_PLANS = {
  npm: { commands: ['npm update -g'] },
  pnpm: { commands: ['pnpm update -g'] },
  yarn: { commands: ['yarn global upgrade'] },
  brew: { commands: ['brew upgrade'] },
  pip: {
    commands: [
      "pip3 list --outdated --format=json | node -e \"let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>{const items=JSON.parse(input||'[]');if(!items.length)process.exit(0);const args=items.map(pkg=>pkg.name.replace(/'/g, \"'\\\\''\")).map(name=>`'${name}'`).join(' ');process.stdout.write(`pip3 install --upgrade ${args}`)})\" | sh",
    ],
  },
  cargo: {
    buildCommands(packages = []) {
      return packages.map((pkg) => `cargo install ${pkg.name}`)
    },
  },
  gem: { commands: ['gem update'] },
  composer: { commands: ['composer global update'] },
  gradle: {
    unsupportedReason: 'cached Gradle artifacts are not safely upgradeable as one global set.',
  },
  maven: {
    unsupportedReason: 'cached Maven artifacts are not safely upgradeable as one global set.',
  },
  nuget: { unsupportedReason: 'global NuGet package cache is not a managed upgrade target.' },
  apt: { commands: ['apt update', 'apt upgrade -y'], elevated: true },
  pacman: { commands: ['pacman -Syu --noconfirm'], elevated: true },
  dnf: { commands: ['dnf upgrade -y'], elevated: true },
  flatpak: { commands: ['flatpak update -y'] },
  snap: { commands: ['snap refresh'], elevated: true },
  yum: { commands: ['yum update -y'], elevated: true },
  winget: {
    commands: [
      'winget upgrade --all --include-unknown --accept-package-agreements --accept-source-agreements',
    ],
  },
  choco: { commands: ['choco upgrade all -y'] },
  scoop: { commands: ['scoop update *'] },
  nix: { commands: ['nix-env -u'] },
  uv: { commands: ['uv tool upgrade --all'] },
  bun: { commands: ['bun update -g'] },
  pipx: { commands: ['pipx upgrade-all'] },
  poetry: { commands: ['poetry self update'] },
  helm: {
    unsupportedReason: 'Helm does not provide a reliable upgrade-all for installed plugins.',
  },
  krew: { commands: ['kubectl krew upgrade'] },
  apk: { commands: ['apk update', 'apk upgrade'], elevated: true },
  zypper: { commands: ['zypper update -y'], elevated: true },
  pkg: { commands: ['pkg upgrade -y'], elevated: true },
  go: {
    unsupportedReason: 'Go binaries in GOPATH/bin do not have one portable bulk-upgrade command.',
  },
  conda: { commands: ['conda update --all -y'] },
  mise: { commands: ['mise upgrade'] },
  asdf: { commands: ['asdf plugin update --all && asdf install'] },
  macports: { commands: ['port selfupdate', 'port upgrade outdated'], elevated: true },
  opam: { commands: ['opam update', 'opam upgrade -y'] },
  vcpkg: { commands: ['vcpkg upgrade --no-dry-run'] },
  volta: {
    unsupportedReason: 'Volta does not expose a single upgrade-all command for installed tools.',
  },
}

function shouldPrefixSudo(plan) {
  return Boolean(
    plan?.elevated &&
    process.platform !== 'win32' &&
    typeof process.getuid === 'function' &&
    process.getuid() !== 0 &&
    isAvailable('sudo')
  )
}

export function getUpgradePlan(manager) {
  return UPGRADE_PLANS[manager] || null
}

export function buildUpgradeCommand(manager, plan, packages = []) {
  const commands = plan?.buildCommands ? plan.buildCommands(packages, manager) : plan?.commands
  if (!commands?.length) return null

  const prefix = shouldPrefixSudo(plan) ? 'sudo ' : ''
  return commands.map((command) => `${prefix}${command}`).join(' && ')
}

function renderUpgradeSummary(results) {
  const bucketCounts = new Map()

  for (const result of results) {
    const bucket =
      result.status === 'success' || result.status === 'failed' ? result.status : 'skipped'
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1)
  }

  const bucketMeta = [
    ['success', '✅'],
    ['failed', '❌'],
    ['skipped', '⏭'],
  ]

  const parts = bucketMeta
    .filter(([bucket]) => bucketCounts.get(bucket) > 0)
    .map(
      ([bucket, icon]) => `${icon} ${chalk.bold(bucket)}: ${chalk.yellow(bucketCounts.get(bucket))}`
    )

  console.log('  ' + parts.join(chalk.dim('  ·  ')))
  console.log()
}

function renderUpgradeResults(results) {
  renderBanner()
  renderUpgradeSummary(results)

  for (const result of results) {
    const icon = MANAGER_ICONS[result.manager] || '📦'
    const label = `${icon} ${result.manager}`

    if (result.status === 'success') {
      const suffix = result.message ? result.message : 'upgrade finished'
      console.log(chalk.green(`✔ ${label}: ${suffix}`))
      continue
    }

    if (result.status === 'failed') {
      console.log(chalk.red(`✗ ${label}: ${result.message}`))
      continue
    }

    console.log(chalk.yellow(`- ${label}: ${result.message}`))
  }

  console.log()
}

async function detectInstalledManagers(filterManager) {
  const spinner = ora('Detecting installed package managers...').start()
  const { results } = await scanAll(filterManager)
  spinner.stop()

  return results
    .filter((result) => result.packages?.length > 0)
    .map((result) => ({ manager: result.manager, packages: result.packages }))
}

export async function runUpgrade(options) {
  const resolvedOptions = optsOf(options)
  const parentOptions = options?.parent?.opts?.() || {}
  const filterManager = (
    resolvedOptions?.manager ||
    parentOptions.manager ||
    getCliOptionValue(['--manager', '-m'])
  )?.toLowerCase()
  const dryRun = Boolean(resolvedOptions?.dryRun || hasCliFlag(['--dry-run']))

  const managers = await detectInstalledManagers(filterManager)

  if (managers.length === 0) {
    console.log(chalk.yellow('No matching installed package managers found to upgrade.'))
    return
  }

  const results = []
  const warnings = []

  for (const { manager, packages } of managers) {
    const plan = getUpgradePlan(manager)

    if (!plan) {
      results.push({
        manager,
        status: 'skipped',
        message: 'upgrade not implemented yet.',
      })
      continue
    }

    if (plan.unsupportedReason) {
      results.push({ manager, status: 'skipped', message: plan.unsupportedReason })
      continue
    }

    const command = buildUpgradeCommand(manager, plan, packages)
    if (!command) {
      results.push({ manager, status: 'skipped', message: 'no upgrade command configured.' })
      continue
    }

    if (dryRun) {
      results.push({ manager, status: 'success', message: command, dryRun: true })
      continue
    }

    console.log(chalk.cyan(`\n→ Upgrading ${manager} with: ${command}`))
    const child = spawnSync(command, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    })

    if (child.status === 0) {
      results.push({ manager, status: 'success' })
      continue
    }

    const failureMessage = child.error?.message || `command exited with code ${child.status ?? 1}`
    warnings.push({ manager, message: failureMessage, level: 'error' })
    results.push({ manager, status: 'failed', message: failureMessage })
  }

  renderUpgradeResults(
    results.map((result) =>
      result.dryRun ? { ...result, message: `would run: ${result.message}` } : result
    )
  )
  printIssueSummary(warnings)
}
