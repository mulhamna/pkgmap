import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('asdf')) return null

  try {
    const raw = execSync('asdf list', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const packages = []
    let currentPlugin = null

    for (const line of raw.split('\n')) {
      if (!line.trim()) continue

      // Plugin names have no leading whitespace, versions are indented
      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        currentPlugin = line.trim()
      } else if (currentPlugin) {
        const version = line.trim().replace(/^\*/, '').trim()
        if (version) {
          packages.push({ name: currentPlugin, version })
        }
      }
    }

    if (packages.length === 0) return null

    return { manager: 'asdf', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ asdf: permission denied.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ asdf: scan timed out, skipping.')
    }
    return null
  }
}
