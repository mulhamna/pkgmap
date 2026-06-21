import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'pnpm',
    bin: 'pnpm',
    command: 'pnpm list -g --depth=0 --json',
    parse: (raw) => {
      const parsed = JSON.parse(raw)
      const deps = Array.isArray(parsed) ? parsed[0]?.dependencies || {} : parsed.dependencies || {}
      return Object.entries(deps).map(([name, info]) => ({
        name,
        version: info.version || 'unknown',
        type: 'cli',
      }))
    },
  })
}
