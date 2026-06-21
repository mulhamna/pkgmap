import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'composer',
    bin: 'composer',
    command: 'composer global show --format=json',
    timeout: process.platform === 'win32' ? 30000 : 10000,
    parse: (raw) =>
      (JSON.parse(raw).installed || []).map((pkg) => ({
        name: pkg.name,
        version: pkg.version || 'unknown',
        type: 'php',
      })),
  })
}
