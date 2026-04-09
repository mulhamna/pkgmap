import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('gem')) return null

  try {
    const raw = execSync('gem list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^([^\s(]+)\s+\(([^)]+)\)/)
      if (match) {
        const versions = match[2].split(',').map((v) => v.trim())
        packages.push({ name: match[1].trim(), version: versions[0], type: 'gem' })
      }
    }

    return { manager: 'gem', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ gem: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ gem: scan timed out, skipping.')
    }
    return null
  }
}
