import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'poetry',
    bin: 'poetry',
    command: 'poetry self show plugins --no-ansi',
    permissionHint: 'Check Poetry permissions.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^([^\s]+)\s+([0-9][^\s]*)/)
          return match ? { name: match[1].trim(), version: match[2].trim(), type: 'plugin' } : null
        })
        .filter((pkg) => pkg?.name),
  })
}
