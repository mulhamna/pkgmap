import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('helm')) return null

  try {
    const raw = execSync('helm plugin list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('NAME'))
      .map((line) => {
        const parts = line.split(/\s{2,}|\t+/).filter(Boolean)
        if (parts.length < 2) return null
        return {
          name: parts[0],
          version: parts[1] || 'unknown',
          type: 'plugin',
        }
      })
      .filter((pkg) => pkg?.name)

    return { manager: 'helm', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ helm: permission denied. Check Helm plugin permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ helm: scan timed out, skipping.')
    }
    return null
  }
}
