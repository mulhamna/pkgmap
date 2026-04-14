import { readdirSync } from 'fs'
import { join } from 'path'
import { isAvailable } from '../utils.js'

function getGradleCacheRoot() {
  const home = process.env.USERPROFILE || process.env.HOME
  if (!home) return null
  return join(home, '.gradle', 'caches', 'modules-2', 'files-2.1')
}

export default async function scan() {
  if (!isAvailable('gradle')) return null

  const root = getGradleCacheRoot()
  if (!root) return null

  try {
    const groupDirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())
    const packages = []

    for (const groupDir of groupDirs) {
      const groupPath = join(root, groupDir.name)
      const artifactDirs = readdirSync(groupPath, { withFileTypes: true }).filter((d) =>
        d.isDirectory()
      )

      for (const artifactDir of artifactDirs) {
        const artifactPath = join(groupPath, artifactDir.name)
        const versionDirs = readdirSync(artifactPath, { withFileTypes: true }).filter((d) =>
          d.isDirectory()
        )

        for (const versionDir of versionDirs) {
          packages.push({
            name: `${groupDir.name}:${artifactDir.name}`,
            version: versionDir.name,
            type: 'java',
          })
        }
      }
    }

    return { manager: 'gradle', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ gradle: permission denied. Try running with sudo.')
    }
    return null
  }
}
