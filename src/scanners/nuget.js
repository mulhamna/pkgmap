import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join } from 'path'
import { isAvailable } from '../utils.js'

function getNugetGlobalPackagesPath() {
  if (isAvailable('dotnet')) {
    const raw = execSync('dotnet nuget locals global-packages --list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: process.platform === 'win32' ? 30000 : 10000,
    }).toString()

    const match = raw.match(/global-packages\s*:\s*(.+)$/im)
    if (match) return match[1].trim()
  }

  if (isAvailable('nuget')) {
    const raw = execSync('nuget locals global-packages -list', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: process.platform === 'win32' ? 30000 : 10000,
    }).toString()

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

    const packageDirs = readdirSync(globalPackagesPath, { withFileTypes: true }).filter((d) =>
      d.isDirectory()
    )

    const packages = []

    for (const packageDir of packageDirs) {
      const versionDirs = readdirSync(join(globalPackagesPath, packageDir.name), {
        withFileTypes: true,
      }).filter((d) => d.isDirectory())

      for (const versionDir of versionDirs) {
        packages.push({
          name: packageDir.name,
          version: versionDir.name,
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
