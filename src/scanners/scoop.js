import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null
  if (!isAvailable('scoop')) return null

  try {
    const raw = execSync('scoop export', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30000,
    }).toString()

    const parsed = JSON.parse(raw)
    const apps = parsed.apps || []

    const packages = apps
      .map((app) => ({
        name: app.Name || app.name,
        version: app.Version || app.version || 'unknown',
        type: 'system',
      }))
      .filter((pkg) => pkg.name)

    return { manager: 'scoop', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ scoop: permission denied. Try running in an elevated shell.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ scoop: scan timed out, skipping.')
    }
    return null
  }
}
