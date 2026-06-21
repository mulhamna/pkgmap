import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'gem',
    bin: 'gem',
    command: 'gem list',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n').filter(Boolean)) {
        const match = line.match(/^([^\s(]+)\s+\(([^)]+)\)/)
        if (match) {
          const versions = match[2].split(',').map((v) => v.trim())
          packages.push({ name: match[1].trim(), version: versions[0], type: 'gem' })
        }
      }
      return packages
    },
  })
}
