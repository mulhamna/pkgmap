import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'flatpak',
    bin: 'flatpak',
    command: 'flatpak list --app --columns=application,version',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('Application'))
        .map((line) => {
          const parts = line.split(/\s{2,}/)
          return { name: parts[0]?.trim(), version: parts[1]?.trim() || 'unknown', type: 'app' }
        })
        .filter((pkg) => pkg.name),
  })
}
