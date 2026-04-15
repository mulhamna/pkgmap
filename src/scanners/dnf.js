import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

function parsePackages(raw) {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, version] = line.split('\t')
      return {
        name: name?.trim(),
        version: version?.trim() || 'unknown',
        type: 'system',
      }
    })
    .filter((pkg) => pkg.name)
}

export default async function scan() {
  if (process.platform === 'win32') return null
  if (!isAvailable('dnf')) return null

  const timeout = 15000

  try {
    if (isAvailable('dnf5')) {
      const raw = execSync('dnf5 repoquery --installed --qf "%{name}\t%{version}-%{release}"', {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout,
      }).toString()

      return { manager: 'dnf', packages: parsePackages(raw) }
    }

    try {
      const raw = execSync('dnf repoquery --installed --qf "%{name}\t%{version}-%{release}"', {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout,
      }).toString()

      return { manager: 'dnf', packages: parsePackages(raw) }
    } catch (_repoqueryErr) {
      const raw = execSync('dnf list installed --quiet', {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout,
      }).toString()

      const packages = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('Installed Packages'))
        .map((line) => {
          const parts = line.split(/\s+/)
          if (parts.length < 2) return null

          return {
            name: parts[0].replace(/\.[^.\s]+$/, ''),
            version: parts[1]?.trim() || 'unknown',
            type: 'system',
          }
        })
        .filter((pkg) => pkg?.name)

      return { manager: 'dnf', packages }
    }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ dnf: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ dnf: scan timed out, skipping.')
    }
    return null
  }
}
