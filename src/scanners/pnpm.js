import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('pnpm')) return null

  try {
    const raw = execSync('pnpm list -g --depth=0 --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const deps = Array.isArray(parsed) ? parsed[0]?.dependencies || {} : parsed.dependencies || {}

    const packages = Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || 'unknown',
      type: 'cli',
    }))

    return { manager: 'pnpm', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ pnpm: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ pnpm: scan timed out, skipping.')
    }
    return null
  }
}
