import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'pacman',
    bin: 'pacman',
    command: 'pacman -Q',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const firstSpace = line.indexOf(' ')
          if (firstSpace === -1) return null
          return {
            name: line.slice(0, firstSpace).trim(),
            version: line.slice(firstSpace + 1).trim() || 'unknown',
            type: 'system',
          }
        })
        .filter((pkg) => pkg?.name),
  })
}
