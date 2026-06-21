import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'pip',
    bin: ['pip3', 'pip'],
    command: (bin) => `${bin} list --format=json`,
    parse: (raw) =>
      JSON.parse(raw).map((pkg) => ({ name: pkg.name, version: pkg.version, type: 'library' })),
  })
}
