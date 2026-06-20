import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'volta',
    bin: 'volta',
    command: 'volta list --format=plain',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n').filter(Boolean)) {
        const match = line.match(/^(?:tool\s+)?([^\s@]+)@(\S+)/)
        if (match)
          packages.push({ name: match[1].trim(), version: match[2].trim(), type: 'runtime' })
      }
      return packages
    },
  })
}
