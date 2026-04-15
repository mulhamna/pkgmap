import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('zypper')) return null

  try {
    const raw = execSync('zypper search --installed-only --details --type package', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('i |'))
      .map((line) => {
        const parts = line.split('|').map((part) => part.trim())
        if (parts.length < 5) return null

        return {
          name: parts[2],
          version: parts[4] || 'unknown',
          type: 'system',
        }
      })
      .filter((pkg) => pkg?.name)

    return { manager: 'zypper', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ zypper: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ zypper: scan timed out, skipping.')
    }
    return null
  }
}
