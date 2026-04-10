import { readdirSync } from 'fs'
import { join } from 'path'
import { isAvailable } from '../utils.js'

function getMavenRepoRoot() {
  const home = process.env.USERPROFILE || process.env.HOME
  if (!home) return null
  return join(home, '.m2', 'repository')
}

function walkMavenRepo(root, relativeParts = [], collector = []) {
  const entries = readdirSync(root, { withFileTypes: true })

  const hasFiles = entries.some((entry) => entry.isFile())
  if (hasFiles && relativeParts.length >= 3) {
    const version = relativeParts[relativeParts.length - 1]
    const artifact = relativeParts[relativeParts.length - 2]
    const group = relativeParts.slice(0, -2).join('.')
    collector.push({
      name: `${group}:${artifact}`,
      version,
      type: 'java',
    })
    return collector
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const nextParts = [...relativeParts, entry.name]
    const fullPath = join(root, entry.name)
    walkMavenRepo(fullPath, nextParts, collector)
  }

  return collector
}

export default async function scan() {
  // Keep an availability check so we only report Maven when it is actually installed.
  if (!isAvailable('mvn')) return null

  const root = getMavenRepoRoot()
  if (!root) return null

  try {
    const packages = walkMavenRepo(root)
    return { manager: 'maven', packages }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn('⚠ maven: permission denied. Try running with sudo.')
    }
    return null
  }
}