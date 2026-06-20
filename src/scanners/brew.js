import { runScanner } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  return runScanner({
    manager: 'brew',
    bin: 'brew',
    command: 'brew info --json=v2 --installed',
    parse: (raw) => {
      const parsed = JSON.parse(raw)
      return [
        ...(parsed.formulae || []).map((f) => ({
          name: f.name,
          version: f.installed?.[0]?.version || 'unknown',
          type: 'formula',
        })),
        ...(parsed.casks || []).map((c) => ({
          name: c.token,
          version: c.installed || 'unknown',
          type: 'cask',
        })),
      ]
    },
  })
}
