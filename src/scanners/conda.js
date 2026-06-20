import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'conda',
    bin: ['mamba', 'conda'],
    command: (bin) => `${bin} list --json`,
    permissionHint: 'permission denied.',
    parse: (raw) => {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed)
        ? parsed.map((pkg) => ({ name: pkg.name, version: pkg.version, type: 'library' }))
        : []
    },
  })
}
