import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
const srcVersion = fs.readFileSync('src/version.js', 'utf8')

const pkgVersion = pkg.version
const mismatches = []

if (lock.version !== pkgVersion) mismatches.push(`package-lock.json version=${lock.version}`)
if (lock.packages?.['']?.version !== pkgVersion) {
  mismatches.push(`package-lock.json packages[""].version=${lock.packages?.['']?.version}`)
}

const versionMatch = srcVersion.match(/APP_VERSION\s*=\s*'([^']+)'/)
if (!versionMatch) {
  mismatches.push('src/version.js APP_VERSION not found')
} else if (versionMatch[1] !== pkgVersion) {
  mismatches.push(`src/version.js APP_VERSION=${versionMatch[1]}`)
}

if (mismatches.length) {
  console.error(`Version drift detected. package.json=${pkgVersion}`)
  for (const item of mismatches) console.error(`- ${item}`)
  process.exit(1)
}

console.log(`Version sync OK: ${pkgVersion}`)
