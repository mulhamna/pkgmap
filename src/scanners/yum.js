import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'yum',
    bin: 'yum',
    command: 'yum list installed -q',
    parse: (raw) => {
      const packages = []
      for (const line of raw.split('\n').filter(Boolean)) {
        if (line.startsWith('Installed Packages')) continue
        const match = line.match(/^([^\s]+)\s+([^\s]+)\s+/)
        if (match) {
          packages.push({
            name: match[1].replace(/\.[^.\s]+$/, ''),
            version: match[2].trim(),
            type: 'system',
          })
        }
      }
      return packages
    },
  })
}
