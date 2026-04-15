import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null
  if (!isAvailable('choco')) return null

  try {
    const raw = execSync('choco list --local-only --limit-output', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 30000,
    }).toString()

    const packages = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('Chocolatey v'))
      .filter((line) => !line.toLowerCase().includes('packages installed'))
      .map((line) => {
        const [name, version] = line.split('|')
        return {
          name: name?.trim(),
          version: version?.trim() || 'unknown',
          type: 'system',
        }
      })
      .filter((pkg) => pkg.name)

    return { manager: 'choco', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ choco: permission denied. Try running in an elevated shell.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ choco: scan timed out, skipping.')
    }
    return null
  }
}
