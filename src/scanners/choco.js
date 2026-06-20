import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null

  return runScanner({
    manager: 'choco',
    bin: 'choco',
    command: 'choco list --local-only --limit-output',
    timeout: 30000,
    permissionHint: 'Try running in an elevated shell.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('Chocolatey v'))
        .filter((line) => !line.toLowerCase().includes('packages installed'))
        .map((line) => {
          const [name, version] = line.split('|')
          return { name: name?.trim(), version: version?.trim() || 'unknown', type: 'system' }
        })
        .filter((pkg) => pkg.name),
  })
}
