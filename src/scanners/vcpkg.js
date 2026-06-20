import { runScanner } from '../utils.js'

export function parseVcpkgList(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Total installed packages:/i.test(line))
    .map((line) => {
      const match = line.match(/^([^\s:]+)(?::([^\s]+))?\s+([^\s]+)/)
      if (!match) return null

      return {
        name: match[2] ? `${match[1]}:${match[2]}` : match[1],
        version: match[3] || 'unknown',
        type: 'library',
      }
    })
    .filter((pkg) => pkg?.name)
}

export default async function scan() {
  return runScanner({
    manager: 'vcpkg',
    bin: 'vcpkg',
    command: 'vcpkg list',
    permissionHint: 'Check vcpkg permissions.',
    parse: parseVcpkgList,
  })
}
