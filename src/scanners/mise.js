import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'mise',
    bin: 'mise',
    command: 'mise ls --json',
    permissionHint: 'permission denied.',
    parse: (raw) => {
      const parsed = JSON.parse(raw)
      const packages = []

      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (entry.tool && entry.version)
            packages.push({ name: entry.tool, version: entry.version })
        }
      } else if (typeof parsed === 'object') {
        for (const [name, versions] of Object.entries(parsed)) {
          for (const v of Array.isArray(versions) ? versions : [versions]) {
            packages.push({ name, version: typeof v === 'string' ? v : v.version || 'installed' })
          }
        }
      }

      return packages
    },
  })
}
