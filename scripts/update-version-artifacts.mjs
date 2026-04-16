import fs from 'node:fs'

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version

const replace = (file, from, to) => {
  const current = fs.readFileSync(file, 'utf8')
  const next = current.replaceAll(from, to)
  if (next !== current) fs.writeFileSync(file, next)
}

replace('README.md', "version: '1.1.0'", `version: '${version}'`)
replace('README.md', 'v1.1.0', `v${version}`)
replace('claude.md', '"version": "1.0.0"', `"version": "${version}"`)
replace('claude.md', '## [1.0.0] - current baseline', `## [${version}] - current baseline`)
replace('claude.md', 'v1.0.0', `v${version}`)
