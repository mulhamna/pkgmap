import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('nix-env')) return null

  try {
    const raw = execSync('nix-env -q --installed --json', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: process.platform === 'win32' ? 30000 : 15000,
    }).toString()

    const parsed = JSON.parse(raw)
    const packages = Object.entries(parsed)
      .map(([name, info]) => ({
        name,
        version: info?.version || 'unknown',
        type: 'system',
      }))
      .filter((pkg) => pkg.name)

    return { manager: 'nix', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ nix: permission denied. Check nix profile permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ nix: scan timed out, skipping.')
    }
    return null
  }
}
