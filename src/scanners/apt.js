import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'apt',
    bin: 'dpkg-query',
    command: 'dpkg-query -W -f="${Package}\t${Version}\n"',
    parse: (raw) =>
      raw
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [name, version] = line.split('\t')
          return { name: name?.trim(), version: version?.trim() || 'unknown', type: 'system' }
        })
        .filter((pkg) => pkg.name),
  })
}
