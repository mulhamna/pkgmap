import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'pipx',
    bin: 'pipx',
    command: 'pipx list --json',
    permissionHint: 'Check pipx permissions.',
    parse: (raw) =>
      Object.entries(JSON.parse(raw).venvs || {})
        .map(([name, info]) => ({
          name,
          version: info?.metadata?.main_package?.package_version || 'unknown',
          type: 'cli',
        }))
        .filter((pkg) => pkg.name),
  })
}
