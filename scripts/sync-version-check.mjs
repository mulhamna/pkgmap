const pkg = await Bun.file('package.json').json()
const lock = await Bun.file('bun.lock').text()

const pkgVersion = pkg.version
const mismatches = []

// Bun lockfiles do not duplicate the package version like npm lockfiles do.
// They are JSONC rather than strict JSON, so verify the root workspace name
// from the lockfile text instead of parsing it as JSON.
const workspaceName = lock.match(/"":\s*\{[\s\S]*?"name":\s*"([^"]+)"/)?.[1]
if (workspaceName !== pkg.name) {
  mismatches.push(`bun.lock workspace name=${workspaceName}`)
}

if (mismatches.length) {
  console.error(`Version drift detected. package.json=${pkgVersion}`)
  for (const item of mismatches) console.error(`- ${item}`)
  process.exit(1)
}

console.log(`Version sync OK: ${pkgVersion}`)
