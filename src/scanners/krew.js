import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'krew',
    bin: 'kubectl',
    command: 'kubectl krew list',
    permissionHint: 'Check Krew permissions.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => line !== 'PLUGIN')
        .map((line) => ({ name: line, version: 'installed', type: 'plugin' }))
        .filter((pkg) => pkg.name),
  })
}
