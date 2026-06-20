import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'yarn',
    bin: 'yarn',
    command: 'yarn global list --depth=0 2>/dev/null',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n')) {
        const match = line.match(/info\s+"([^@]+)@([^"]+)"/) || line.match(/[└├─]+\s+([^@]+)@(\S+)/)
        if (match) packages.push({ name: match[1].trim(), version: match[2].trim(), type: 'cli' })
      }
      return packages
    },
  })
}
