import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('pacman')) return null

  try {
    const raw = execSync('pacman -Q', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const firstSpace = line.indexOf(' ')
        if (firstSpace === -1) return null

        return {
          name: line.slice(0, firstSpace).trim(),
          version: line.slice(firstSpace + 1).trim() || 'unknown',
          type: 'system',
        }
      })
      .filter((pkg) => pkg?.name)

    return { manager: 'pacman', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ pacman: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ pacman: scan timed out, skipping.')
    }
    return null
  }
}
