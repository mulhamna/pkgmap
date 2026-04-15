import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('bun')) return null

  try {
    const raw = execSync('bun pm ls --global --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const packages = (parsed.packages || parsed || [])
      .map((pkg) => ({
        name: pkg.name,
        version: pkg.version || 'unknown',
        type: 'library',
      }))
      .filter((pkg) => pkg.name)

    return { manager: 'bun', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ bun: permission denied. Check bun global install permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ bun: scan timed out, skipping.')
    }
    return null
  }
}
