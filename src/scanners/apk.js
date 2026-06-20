import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'apk',
    bin: 'apk',
    command: 'apk info -v',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^(.+)-([0-9][A-Za-z0-9._-]*)$/)
          return match
            ? { name: match[1].trim(), version: match[2].trim() || 'unknown', type: 'system' }
            : { name: line, version: 'unknown', type: 'system' }
        })
        .filter((pkg) => pkg.name),
  })
}
