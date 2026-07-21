import { runScanner, parseTabbed } from '../utils.js'

export default async function scan() {
  if (process.platform === 'win32') return null

  // ponytail: dropped the legacy `dnf list installed` fallback; repoquery ships
  // with dnf4/dnf5 by default. Restore it if a repoquery-less env turns up.
  return runScanner({
    manager: 'dnf',
    bin: ['dnf5', 'dnf'],
    command: (bin) => `${bin} repoquery --installed --qf "%{name}\t%{version}-%{release}"`,
    timeout: 15000,
    parse: parseTabbed,
  })
}
