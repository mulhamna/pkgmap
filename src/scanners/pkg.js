import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!['freebsd', 'openbsd'].includes(process.platform)) return null
  if (!isAvailable('pkg')) return null

  try {
    const raw = execSync('pkg info', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const lastDash = line.lastIndexOf('-')
        if (lastDash === -1) {
          return { name: line, version: 'unknown', type: 'system' }
        }

        return {
          name: line.slice(0, lastDash).trim(),
          version: line.slice(lastDash + 1).trim() || 'unknown',
          type: 'system',
        }
      })
      .filter((pkg) => pkg.name)

    return { manager: 'pkg', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ pkg: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ pkg: scan timed out, skipping.')
    }
    return null
  }
}
