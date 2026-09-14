import { join } from 'path'
import { isAvailable, runCommand } from '../utils.js'

function getNugetGlobalPackagesPath() {
  if (isAvailable('dotnet')) {
    const raw = runCommand('dotnet nuget locals global-packages --list', {
      timeout: process.platform === 'win32' ? 30000 : 10000,
    })

    const match = raw.match(/global-packages\s*:\s*(.+)$/im)
    if (match) return match[1].trim()
  }

  if (isAvailable('nuget')) {
    const raw = runCommand('nuget locals global-packages -list', {
      timeout: process.platform === 'win32' ? 30000 : 10000,
    })

    const match = raw.match(/global-packages\s*:\s*(.+)$/im)
    if (match) return match[1].trim()
  }

  return null
}

export default async function scan() {
  if (!isAvailable('dotnet') && !isAvailable('nuget')) return null

  try {
    const globalPackagesPath = getNugetGlobalPackagesPath()
    if (!globalPackagesPath) return null

    const packageDirs = [
      ...new Bun.Glob('*').scanSync({ cwd: globalPackagesPath, onlyFiles: false }),
    ]

    const packages = []

    for (const packageName of packageDirs) {
      const versionDirs = [
        ...new Bun.Glob('*').scanSync({
          cwd: join(globalPackagesPath, packageName),
          onlyFiles: false,
        }),
      ]

      for (const version of versionDirs) {
        packages.push({
          name: packageName,
          version,
          type: 'dotnet',
        })
      }
    }

    return { manager: 'nuget', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ nuget: permission denied. Try running with sudo.')
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn('⚠ nuget: scan timed out, skipping.')
    }
    return null
  }
}
