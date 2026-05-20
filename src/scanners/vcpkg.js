import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export function parseVcpkgList(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Total installed packages:/i.test(line))
    .map((line) => {
      const match = line.match(/^([^\s:]+)(?::([^\s]+))?\s+([^\s]+)/)
      if (!match) return null

      return {
        name: match[2] ? `${match[1]}:${match[2]}` : match[1],
        version: match[3] || 'unknown',
        type: 'library',
      }
    })
    .filter((pkg) => pkg?.name)
}

export default async function scan() {
  if (!isAvailable('vcpkg')) return null

  try {
    const raw = execSync('vcpkg list', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const packages = parseVcpkgList(raw)

    if (packages.length === 0) return null

    return { manager: 'vcpkg', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ vcpkg: permission denied. Check vcpkg permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ vcpkg: scan timed out, skipping.')
    }
    return null
  }
}
