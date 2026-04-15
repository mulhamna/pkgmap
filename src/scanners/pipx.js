import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('pipx')) return null

  try {
    const raw = execSync('pipx list --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const venvs = parsed.venvs || {}

    const packages = Object.entries(venvs)
      .map(([name, info]) => ({
        name,
        version: info?.metadata?.main_package?.package_version || 'unknown',
        type: 'cli',
      }))
      .filter((pkg) => pkg.name)

    return { manager: 'pipx', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ pipx: permission denied. Check pipx permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ pipx: scan timed out, skipping.')
    }
    return null
  }
}
