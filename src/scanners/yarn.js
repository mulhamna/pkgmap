import { execSync } from 'child_process'
import { isAvailable } from '../utils.js'

export default async function scan() {
  if (!isAvailable('yarn')) return null

  try {
    const raw = execSync('yarn global list --depth=0 2>/dev/null', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const packages = []
    const lines = raw.split('\n')

    for (const line of lines) {
      // yarn global list output: info "<name>@<version>" has binaries: ...
      // or: └─ <name>@<version>
      const match = line.match(/info\s+"([^@]+)@([^"]+)"/) || line.match(/[└├─]+\s+([^@]+)@(\S+)/)
      if (match) {
        packages.push({ name: match[1].trim(), version: match[2].trim() })
      }
    }

    return { manager: 'yarn', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ yarn: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ yarn: scan timed out, skipping.')
    }
    return null
  }
}
