import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'zypper',
    bin: 'zypper',
    command: 'zypper search --installed-only --details --type package',
    timeout: 15000,
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('i |'))
        .map((line) => {
          const parts = line.split('|').map((part) => part.trim())
          return parts.length < 5
            ? null
            : { name: parts[2], version: parts[4] || 'unknown', type: 'system' }
        })
        .filter((pkg) => pkg?.name),
  })
}
