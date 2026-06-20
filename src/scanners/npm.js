import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'npm',
    bin: 'npm',
    command: 'npm list -g --depth=0 --json',
    timeout: process.platform === 'win32' ? 30000 : 10000,
    parse: (raw) => {
      const deps = JSON.parse(raw).dependencies || {}

      let globalRoot = ''
      try {
        globalRoot = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim()
      } catch {
        /* npm root -g unavailable */
      }

      return Object.entries(deps).map(([name, info]) => {
        let type = 'library'
        if (globalRoot) {
          try {
            const pkgJson = JSON.parse(readFileSync(join(globalRoot, name, 'package.json'), 'utf8'))
            if (pkgJson.bin) type = 'cli'
          } catch {
            /* package.json unreadable, default to library */
          }
        }
        return { name, version: info.version || 'unknown', type }
      })
    },
  })
}
