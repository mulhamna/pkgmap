import { join } from 'path'
import { runCommand, runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'npm',
    bin: 'npm',
    command: 'npm list -g --depth=0 --json',
    timeout: process.platform === 'win32' ? 30000 : 10000,
    parse: async (raw) => {
      const deps = JSON.parse(raw).dependencies || {}

      let globalRoot = ''
      try {
        globalRoot = runCommand('npm root -g').trim()
      } catch {
        /* npm root -g unavailable */
      }

      return Promise.all(
        Object.entries(deps).map(async ([name, info]) => {
          let type = 'library'
          if (globalRoot) {
            try {
              const pkgJson = await Bun.file(join(globalRoot, name, 'package.json')).json()
              if (pkgJson.bin) type = 'cli'
            } catch {
              /* package.json unreadable, default to library */
            }
          }
          return { name, version: info.version || 'unknown', type }
        })
      )
    },
  })
}
