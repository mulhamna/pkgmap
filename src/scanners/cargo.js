import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

function parseCargoInstallList(raw) {
  const packages = []
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const match = line.match(/^([^\s]+)\s+v?([^\s:]+):/)
    if (match) {
      packages.push({ name: match[1].trim(), version: match[2].trim(), type: 'binary' })
    }
  }

  return packages
}

export default async function scan() {
  if (!isAvailable('cargo')) return null

  try {
    const raw = execSync('cargo install --list', {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    }).toString()

    const packages = parseCargoInstallList(raw)

    if (packages.length === 0) {
      const hasInstalledBinaries = /:\s*$/m.test(raw)
      if (!hasInstalledBinaries) {
        console.warn('⚠ cargo: output format not recognized, skipping.')
      }
      return null
    }

    return { manager: 'cargo', packages }
  } catch (err) {
    const stderr = err.stderr?.toString?.() || ''
    const message = err.message || ''

    if (
      message.includes('EACCES') ||
      message.includes('permission') ||
      stderr.includes('permission denied')
    ) {
      console.warn('⚠ cargo: permission denied. Check Rustup/Cargo permissions.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ cargo: scan timed out, skipping.')
    } else if (stderr) {
      console.warn('⚠ cargo: scan failed, skipping.')
    }
    return null
  }
}
