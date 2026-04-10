import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('yum')) return null

  try {
    const raw = execSync('yum list installed -q', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n').filter(Boolean)

    for (const line of lines) {
      if (line.startsWith('Installed Packages')) continue

      const match = line.match(/^([^\s]+)\s+([^\s]+)\s+/)
      if (match) {
        const pkgName = match[1].replace(/\.[^.\s]+$/, '')
        packages.push({
          name: pkgName,
          version: match[2].trim(),
          type: 'system',
        })
      }
    }

    return { manager: 'yum', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ yum: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ yum: scan timed out, skipping.')
    }
    return null
  }
}