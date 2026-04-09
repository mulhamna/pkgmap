import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('npm')) return null

  try {
    const raw = execSync('npm list -g --depth=0 --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const deps = parsed.dependencies || {}

    let globalRoot = ''
    try {
      globalRoot = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
    } catch (_err) {
      /* npm root -g unavailable */
    }

    const packages = Object.entries(deps).map(([name, info]) => {
      let type = 'library'
      if (globalRoot) {
        try {
          const pkgJson = JSON.parse(readFileSync(join(globalRoot, name, 'package.json'), 'utf8'))
          if (pkgJson.bin) type = 'cli'
        } catch (_err) {
          /* package.json unreadable, default to library */
        }
      }
      return { name, version: info.version || 'unknown', type }
    })

    return { manager: 'npm', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ npm: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ npm: scan timed out, skipping.')
    }
    return null
  }
}
