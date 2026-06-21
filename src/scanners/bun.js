import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'bun',
    bin: 'bun',
    command: 'bun pm ls --global --json',
    permissionHint: 'Check bun global install permissions.',
    parse: (raw) => {
      const parsed = JSON.parse(raw)
      return (parsed.packages || parsed || [])
        .map((pkg) => ({ name: pkg.name, version: pkg.version || 'unknown', type: 'library' }))
        .filter((pkg) => pkg.name)
    },
  })
}
