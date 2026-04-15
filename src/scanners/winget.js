import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null
  if (!isAvailable('winget')) return null

  try {
    const raw = execSync('winget list --accept-source-agreements', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30000,
    }).toString()

    const lines = raw
      .split('\n')
      .map((line) => line.replace(/\r$/, ''))
      .filter(Boolean)

    const separatorIndex = lines.findIndex((line) => /^[-\s]+$/.test(line))
    if (separatorIndex === -1) return null

    const packages = []
    for (const line of lines.slice(separatorIndex + 1)) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const match = trimmed.match(/^(.+?)\s{2,}(\S+)?\s{2,}(\S+)?\s{2,}(\S+)?(?:\s{2,}.*)?$/)
      if (!match) continue

      packages.push({
        name: match[1]?.trim(),
        version: match[3]?.trim() || 'unknown',
        type: 'system',
      })
    }

    return { manager: 'winget', packages: packages.filter((pkg) => pkg.name) }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ winget: permission denied. Try running in an elevated shell.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ winget: scan timed out, skipping.')
    }
    return null
  }
}
