import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('flatpak')) return null

  try {
    const raw = execSync('flatpak list --app --columns=application,version', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, version] = line.split(/\s{2,}/)
        return { name: name?.trim(), version: version?.trim() || 'unknown', type: 'app' }
      })
      .filter((pkg) => pkg.name)

    return { manager: 'flatpak', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ flatpak: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ flatpak: scan timed out, skipping.')
    }
    return null
  }
}
