import { runScanner } from '../utils.js'

export default async function scan() {
  return runScanner({
    manager: 'asdf',
    bin: 'asdf',
    command: 'asdf list',
    permissionHint: 'permission denied.',
    parse: (raw) => {
      const packages = []
      let currentPlugin = null

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue

        // Plugin names have no leading whitespace, versions are indented
        if (!line.startsWith(' ') && !line.startsWith('\t')) {
          currentPlugin = line.trim()
        } else if (currentPlugin) {
          const version = line.trim().replace(/^\*/, '').trim()
          if (version) packages.push({ name: currentPlugin, version })
        }
      }

      return packages
    },
  })
}
