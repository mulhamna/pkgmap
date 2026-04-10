import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('composer')) return null

  try {
    const timeout = process.platform === 'win32' ? 30000 : 10000
    const raw = execSync('composer global show --format=json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout,
    }).toString()

    const parsed = JSON.parse(raw)
    const installed = parsed.installed || []

    const packages = installed.map((pkg) => ({
      name: pkg.name,
      version: pkg.version || 'unknown',
      type: 'php',
    }))

    return { manager: 'composer', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ composer: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ composer: scan timed out, skipping.')
    }
    return null
  }
}