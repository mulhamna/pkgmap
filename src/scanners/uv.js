import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'uv',
    bin: 'uv',
    command: 'uv tool list',
    permissionHint: 'Check uv tool permissions.',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n').filter(Boolean)) {
        const match = line.trim().match(/^([^\s]+)\s+v([^\s]+)/)
        if (match) packages.push({ name: match[1].trim(), version: match[2].trim(), type: 'cli' })
      }
      return packages
    },
  })
}
