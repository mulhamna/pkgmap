import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('cargo')) return null

  try {
    const raw = execSync('cargo install --list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      // cargo install --list output: "<name> v<version>:"
      const match = line.match(/^([^\s]+)\s+v([^\s:]+):/)
      if (match) {
        packages.push({ name: match[1].trim(), version: match[2].trim() })
      }
    }

    return { manager: 'cargo', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ cargo: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ cargo: scan timed out, skipping.')
    }
    return null
  }
}
