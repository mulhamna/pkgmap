import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('apt')) return null

  try {
    const raw = execSync('apt list --installed 2>/dev/null', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      if (line.startsWith('Listing...')) continue

      const match = line.match(/^([^/]+)\/[^\s]+\s+([^\s]+)\s+/)
      if (match) {
        packages.push({
          name: match[1].trim(),
          version: match[2].trim(),
          type: 'system',
        })
      }
    }

    return { manager: 'apt', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ apt: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ apt: scan timed out, skipping.')
    }
    return null
  }
}