import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join } from 'path'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('go')) return null

  try {
    const gopath = execSync('go env GOPATH', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    })
      .toString()
      .trim()

    if (!gopath) return null

    const binDir = join(gopath, 'bin')
    let binaries
    try {
      binaries = readdirSync(binDir).filter((f) => !f.startsWith('.'))
    } catch {
      return null
    }

    if (binaries.length === 0) return null

    const packages = binaries.map((name) => ({ name, version: 'installed' }))

    return { manager: 'go', packages }
  } catch (err) {
    if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ go: scan timed out, skipping.')
    }
    return null
  }
}
