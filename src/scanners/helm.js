import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'helm',
    bin: 'helm',
    command: 'helm plugin list',
    permissionHint: 'Check Helm plugin permissions.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('NAME'))
        .map((line) => {
          const parts = line.split(/\s{2,}|\t+/).filter(Boolean)
          return parts.length < 2
            ? null
            : { name: parts[0], version: parts[1] || 'unknown', type: 'plugin' }
        })
        .filter((pkg) => pkg?.name),
  })
}
