import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('opam')) return null

  try {
    const raw = execSync('opam list --installed --columns=name,version --color=never', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('#'))
      .filter((line) => !/^name\s+version$/i.test(line))
      .map((line) => {
        const parts = line.split(/\s+/)
        if (parts.length < 2) return null

        return {
          name: parts[0],
          version: parts[1] || 'unknown',
          type: 'library',
        }
      })
      .filter((pkg) => pkg?.name)

    if (packages.length === 0) return null

    return { manager: 'opam', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ opam: permission denied. Check OPAM permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ opam: scan timed out, skipping.')
    }
    return null
  }
}
