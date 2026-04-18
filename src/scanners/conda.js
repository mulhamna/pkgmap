import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  const cmd = isAvailable('mamba') ? 'mamba' : isAvailable('conda') ? 'conda' : null
  if (!cmd) return null

  try {
    const raw = execSync(`${cmd} list --json`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const packages = parsed.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      type: 'library',
    }))

    return { manager: cmd, packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn(`⚠ ${cmd}: permission denied.`)
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn(`⚠ ${cmd}: scan timed out, skipping.`)
    }
    return null
  }
}
