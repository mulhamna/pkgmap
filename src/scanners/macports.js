import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('port')) return null

  try {
    const raw = execSync('port installed', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('The following ports'))
      .map((line) => {
        const match = line.match(/^([^\s@]+)\s+@([^\s]+)(?:\s+\(([^)]+)\))?$/)
        if (!match) return null

        return {
          name: match[1].trim(),
          version: match[2].trim() || 'unknown',
          type: 'port',
        }
      })
      .filter((pkg) => pkg?.name)

    if (packages.length === 0) return null

    return { manager: 'macports', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ macports: permission denied. Check MacPorts permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ macports: scan timed out, skipping.')
    }
    return null
  }
}
