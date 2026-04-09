import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('npm')) return null

  try {
    const raw = execSync('npm list -g --depth=0 --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const deps = parsed.dependencies || {}

    const packages = Object.entries(deps).map(([name, info]) => ({
      name,
      version: info.version || 'unknown',
    }))

    return { manager: 'npm', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ npm: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ npm: scan timed out, skipping.')
    }
    return null
  }
}
