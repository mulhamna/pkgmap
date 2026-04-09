import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('brew')) return null

  try {
    const raw = execSync('brew info --json=v2 --installed', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const formulae = parsed.formulae || []
    const casks = parsed.casks || []

    const packages = [
      ...formulae.map((f) => ({
        name: f.name,
        version: f.installed?.[0]?.version || 'unknown',
        type: 'formula',
      })),
      ...casks.map((c) => ({
        name: c.token,
        version: c.installed || 'unknown',
        type: 'cask',
      })),
    ]

    return { manager: 'brew', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ brew: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ brew: scan timed out, skipping.')
    }
    return null
  }
}
