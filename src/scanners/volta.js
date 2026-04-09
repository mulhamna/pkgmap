import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('volta')) return null

  try {
    const raw = execSync('volta list --format=plain', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^(?:tool\s+)?([^\s@]+)@(\S+)/)
      if (match) {
        packages.push({ name: match[1].trim(), version: match[2].trim(), type: 'runtime' })
      }
    }

    return { manager: 'volta', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ volta: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ volta: scan timed out, skipping.')
    }
    return null
  }
}
