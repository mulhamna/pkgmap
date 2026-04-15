import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('kubectl')) return null

  try {
    const raw = execSync('kubectl krew list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line !== 'PLUGIN')
      .map((line) => ({
        name: line,
        version: 'installed',
        type: 'plugin',
      }))
      .filter((pkg) => pkg.name)

    return { manager: 'krew', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ krew: permission denied. Check Krew permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ krew: scan timed out, skipping.')
    }
    return null
  }
}
