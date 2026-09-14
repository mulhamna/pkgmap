import { join } from 'path'

function directories(root) {
  return [...new Bun.Glob('*/').scanSync({ cwd: root })].map((entry) => entry.replace(/\/$/, ''))
}

function getGradleCacheRoot() {
  const home = process.env.USERPROFILE || process.env.HOME
  if (!home) return null
  return join(home, '.gradle', 'caches', 'modules-2', 'files-2.1')
}

export default async function scan() {
  const root = getGradleCacheRoot()
  if (!root) return null

  try {
    const packages = []

    for (const groupName of directories(root)) {
      const groupPath = join(root, groupName)
      const artifactDirs = directories(groupPath)

      for (const artifactName of artifactDirs) {
        const artifactPath = join(groupPath, artifactName)
        const versionDirs = directories(artifactPath)

        for (const version of versionDirs) {
          packages.push({
            name: `${groupName}:${artifactName}`,
            version,
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
