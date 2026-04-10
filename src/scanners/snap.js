import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('snap')) return null

  try {
    const raw = execSync('snap list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const lines = raw.split('\n').filter(Boolean)
    const packages = []

    for (const line of lines.slice(1)) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 2) {
        packages.push({ name: parts[0], version: parts[1], type: 'snap' })
      }
    }

    return { manager: 'snap', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ snap: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ snap: scan timed out, skipping.')
    }
    return null
  }
}
