import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  const cmd = isAvailable('pip3') ? 'pip3' : isAvailable('pip') ? 'pip' : null
  if (!cmd) return null

  try {
    const raw = execSync(`${cmd} list --format=json`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const parsed = JSON.parse(raw)
    const packages = parsed.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
    }))

    return { manager: 'pip', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ pip: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ pip: scan timed out, skipping.')
    }
    return null
  }
}
