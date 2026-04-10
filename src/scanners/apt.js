import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('dpkg-query')) return null

  try {
    const raw = execSync('dpkg-query -W -f="${Package}\t${Version}\n"', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, version] = line.split('\t')
        return { name: name?.trim(), version: version?.trim() || 'unknown', type: 'package' }
      })
      .filter((pkg) => pkg.name)

    return { manager: 'apt', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ apt: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ apt: scan timed out, skipping.')
    }
    return null
  }
}
