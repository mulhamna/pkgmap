import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('uv')) return null

  try {
    const raw = execSync('uv tool list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      const match = line.trim().match(/^([^\s]+)\s+v([^\s]+)/)
      if (match) {
        packages.push({
          name: match[1].trim(),
          version: match[2].trim(),
          type: 'cli',
        })
      }
    }

    return { manager: 'uv', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ uv: permission denied. Check uv tool permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ uv: scan timed out, skipping.')
    }
    return null
  }
}
