import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'nix',
    bin: 'nix-env',
    command: 'nix-env -q --installed --json',
    timeout: process.platform === 'win32' ? 30000 : 15000,
    permissionHint: 'Check nix profile permissions.',
    parse: (raw) =>
      Object.entries(JSON.parse(raw))
        .map(([name, info]) => ({ name, version: info?.version || 'unknown', type: 'system' }))
        .filter((pkg) => pkg.name),
  })
}
