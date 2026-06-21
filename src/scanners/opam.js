import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'opam',
    bin: 'opam',
    command: 'opam list --installed --columns=name,version --color=never',
    permissionHint: 'Check OPAM permissions.',
    parse: (raw) =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('#'))
        .filter((line) => !/^name\s+version$/i.test(line))
        .map((line) => {
          const parts = line.split(/\s+/)
          return parts.length < 2
            ? null
            : { name: parts[0], version: parts[1] || 'unknown', type: 'library' }
        })
        .filter((pkg) => pkg?.name),
  })
}
