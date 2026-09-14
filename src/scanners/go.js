import { join } from 'path'
import { isAvailable, runCommand } from '../utils.js'

export function parseGoBinaryMetadata(raw, binaryName) {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const hasGoBuildMetadata = lines.some(
    (line) => line.startsWith('path\t') || line.startsWith('mod\t')
  )
  if (!hasGoBuildMetadata) return null

  const modLine = lines.find((line) => line.startsWith('mod\t'))
  const modulePath = modLine?.split(/\s+/)[1] || null
  const version = modLine?.split(/\s+/)[2] || 'installed'

  return {
    name: binaryName,
    version,
    type: 'binary',
    ...(modulePath ? { auditName: modulePath } : {}),
  }
}

export default async function scan() {
  if (!isAvailable('go')) return null

  try {
    const gopath = runCommand('go env GOPATH', { timeout: 10000 }).trim()

    if (!gopath) return null

    const binDir = join(gopath, 'bin')
    let binaries
    try {
      binaries = [...new Bun.Glob('*').scanSync({ cwd: binDir, onlyFiles: true })].filter(
        (file) => !file.startsWith('.')
      )
    } catch {
      return null
    }

    if (binaries.length === 0) return null

    const packages = []

    for (const name of binaries) {
      const binaryPath = join(binDir, name)

      try {
        if (!(await Bun.file(binaryPath).exists())) continue

        const raw = runCommand(`go version -m "${binaryPath.replaceAll('"', '\\"')}"`, {
          timeout: 2000,
        })

        const pkg = parseGoBinaryMetadata(raw, name)
        if (pkg) packages.push(pkg)
      } catch {
        // Ignore non-Go or unreadable binaries in GOPATH/bin.
      }
    }

    if (packages.length === 0) return null

    return { manager: 'go', packages }
  } catch (err) {
    if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ go: scan timed out, skipping.')
    }
    return null
  }
}
