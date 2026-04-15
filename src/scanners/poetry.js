import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('poetry')) return null

  try {
    const raw = execSync('poetry self show plugins --no-ansi', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^([^\s]+)\s+([0-9][^\s]*)/)
        if (!match) return null
        return {
          name: match[1].trim(),
          version: match[2].trim(),
          type: 'plugin',
        }
      })
      .filter((pkg) => pkg?.name)

    return { manager: 'poetry', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ poetry: permission denied. Check Poetry permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ poetry: scan timed out, skipping.')
    }
    return null
  }
}
