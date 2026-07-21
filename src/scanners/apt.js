import { runScanner, parseTabbed } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'apt',
    bin: 'dpkg-query',
    command: 'dpkg-query -W -f="${Package}\t${Version}\n"',
    parse: parseTabbed,
  })
}
