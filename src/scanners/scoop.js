import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform !== 'win32') return null

  return runScanner({
    manager: 'scoop',
    bin: 'scoop',
    command: 'scoop export',
    timeout: 30000,
    permissionHint: 'Try running in an elevated shell.',
    parse: (raw) =>
      (JSON.parse(raw).apps || [])
        .map((app) => ({
          name: app.Name || app.name,
          version: app.Version || app.version || 'unknown',
          type: 'system',
        }))
        .filter((pkg) => pkg.name),
  })
}
