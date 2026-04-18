import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('mise')) return null

  try {
    const raw = execSync('mise ls --json', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)

    const packages = []

    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (entry.tool && entry.version) {
          packages.push({ name: entry.tool, version: entry.version })
        }
      }
    } else if (typeof parsed === 'object') {
      for (const [name, versions] of Object.entries(parsed)) {
        const list = Array.isArray(versions) ? versions : [versions]
        for (const v of list) {
          packages.push({
            name,
            version: typeof v === 'string' ? v : v.version || 'installed',
          })
        }
      }
    }

    if (packages.length === 0) return null

    return { manager: 'mise', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ mise: permission denied.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ mise: scan timed out, skipping.')
    }
    return null
  }
}
