import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'snap',
    bin: 'snap',
    command: 'snap list',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n').filter(Boolean).slice(1)) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 2) packages.push({ name: parts[0], version: parts[1], type: 'snap' })
      }
      return packages
    },
  })
}
