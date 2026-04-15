import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('apk')) return null

  try {
    const raw = execSync('apk info -v', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+)-([0-9][A-Za-z0-9._-]*)$/)
        if (!match) {
          return { name: line, version: 'unknown', type: 'system' }
        }

        return {
          name: match[1].trim(),
          version: match[2].trim() || 'unknown',
          type: 'system',
        }
      })
      .filter((pkg) => pkg.name)

    return { manager: 'apk', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ apk: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ apk: scan timed out, skipping.')
    }
    return null
  }
}
