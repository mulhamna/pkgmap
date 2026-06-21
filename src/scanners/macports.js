import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'macports',
    bin: 'port',
    command: 'port installed',
    permissionHint: 'Check MacPorts permissions.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('The following ports'))
        .map((line) => {
          const match = line.match(/^([^\s@]+)\s+@([^\s]+)(?:\s+\(([^)]+)\))?$/)
          return match
            ? { name: match[1].trim(), version: match[2].trim() || 'unknown', type: 'port' }
            : null
        })
        .filter((pkg) => pkg?.name),
  })
}
