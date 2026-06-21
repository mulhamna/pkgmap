import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null

  return runScanner({
    manager: 'winget',
    bin: 'winget',
    command: 'winget list --accept-source-agreements',
    timeout: 30000,
    permissionHint: 'Try running in an elevated shell.',
    parse: (raw) => {
      const lines = raw
        .split('\n')
        .map((line) => line.replace(/\r$/, ''))
        .filter(Boolean)

      const separatorIndex = lines.findIndex((line) => /^[-\s]+$/.test(line))
      if (separatorIndex === -1) return []

      const packages = []
      for (const line of lines.slice(separatorIndex + 1)) {
        const trimmed = line.trim()
        if (!trimmed) continue

        const match = trimmed.match(/^(.+?)\s{2,}(\S+)?\s{2,}(\S+)?\s{2,}(\S+)?(?:\s{2,}.*)?$/)
        if (!match) continue

        packages.push({
          name: match[1]?.trim(),
          version: match[3]?.trim() || 'unknown',
          type: 'system',
        })
      }

      return packages.filter((pkg) => pkg.name)
    },
  })
}
