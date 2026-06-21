import { runScanner } from '../utils.js'

export default async function scan() {
  if (!['freebsd', 'openbsd'].includes(process.platform)) return null

  return runScanner({
    manager: 'pkg',
    bin: 'pkg',
    command: 'pkg info',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const lastDash = line.lastIndexOf('-')
          if (lastDash === -1) return { name: line, version: 'unknown', type: 'system' }
          return {
            name: line.slice(0, lastDash).trim(),
            version: line.slice(lastDash + 1).trim() || 'unknown',
            type: 'system',
          }
        })
        .filter((pkg) => pkg.name),
  })
}
