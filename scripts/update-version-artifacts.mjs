import fs from 'node:fs'

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version
const majorMinor = version.split('.').slice(0, 2).join('.')
const currentVersionTag = `v${version}`
const previousVersionTag = `v${majorMinor}.0`

const replace = (file, from, to) => {
  const current = fs.readFileSync(file, 'utf8')
  const next = current.replaceAll(from, to)
  if (next !== current) fs.writeFileSync(file, next)
}

replace('README.md', "version: '1.1.0'", `version: '${version}'`)
replace('README.md', currentVersionTag, currentVersionTag)
replace('claude.md', '"version": "1.0.0"', `"version": "${version}"`)
replace('claude.md', '## [1.0.0] - current baseline', `## [${version}] - current baseline`)
replace('claude.md', previousVersionTag, currentVersionTag)
