# pkgmap

> One command to see everything installed on your machine, across all your package managers.

```
  ╔═══════════════════════════════════╗
  ║  📦 pkgmap  v0.3.2               ║
  ╚═══════════════════════════════════╝
```

---

## What is pkgmap?

`pkgmap` scans package managers installed on your machine and displays everything in one clean terminal table, including manager, version, and package type.

No more jumping between `npm list -g`, `brew list`, `pip list`, `flatpak list`, or distro-specific package commands. One command, one inventory view.

---

## Supported Package Managers

| Icon | Manager | Command Used | macOS | Linux | Windows |
|------|---------|-------------|:-----:|:-----:|:-------:|
| 📦 | npm | `npm list -g --depth=0 --json` | ✅ | ✅ | ✅ |
| 📦 | pnpm | `pnpm list -g --depth=0 --json` | ✅ | ✅ | ✅ |
| 🧶 | yarn | `yarn global list --depth=0` | ✅ | ✅ | ✅ |
| 🍺 | brew | `brew info --json=v2 --installed` | ✅ | ✅ | ❌ |
| ⚡ | volta | `volta list --format=plain` | ✅ | ✅ | ✅ |
| 🐍 | pip | `pip3 list --format=json` | ✅ | ✅ | ✅ |
| 🦀 | cargo | `cargo install --list` | ✅ | ✅ | ✅ |
| 💎 | gem | `gem list` | ✅ | ✅ | ❌ |
| 🎼 | composer | `composer global show --format=json` | ✅ | ✅ | ✅ |
| 🐘 | gradle | scan `~/.gradle/caches/modules-2/files-2.1` | ✅ | ✅ | ✅ |
| ☕ | maven | scan `~/.m2/repository` | ✅ | ✅ | ✅ |
| 🔷 | nuget | scan global packages via `dotnet nuget locals global-packages --list` | ✅ | ✅ | ✅ |
| 🐧 | apt | `dpkg-query -W -f="${Package}\t${Version}\n"` | ❌ | ✅ | ❌ |
| 🏹 | pacman | `pacman -Q` | ❌ | ✅ | ❌ |
| 🎩 | dnf | `dnf repoquery --installed --qf "%{name}\t%{version}-%{release}"` | ❌ | ✅ | ❌ |
| 🧊 | flatpak | `flatpak list --app --columns=application,version` | ✅ | ✅ | ❌ |
| 📦 | snap | `snap list` | ❌ | ✅ | ❌ |
| 🛠 | yum | `yum list installed -q` | ❌ | ✅ | ❌ |
| 🏔 | apk | `apk info -v` | ❌ | ✅ | ❌ |
| 🦎 | zypper | `zypper search --installed-only --details --type package` | ❌ | ✅ | ❌ |
| 🐡 | pkg | `pkg info` | ❌ | ❌ | ✅ |

Only managers that are installed and return packages will appear in the output.

---

## Output

```
  ╔═══════════════════════════════════╗
  ║  📦 pkgmap  v0.3.2               ║
  ╚═══════════════════════════════════╝

  📦 npm: 4  ·  🍺 brew: 64  ·  🐍 pip: 3  ·  🐧 apt: 1812  ·  🏹 pacman: 512
  Total: 2395 packages across 5 manager(s)

┌──────────┬────────────────────────────┬──────────────┬──────────┐
│ Manager  │ Package                    │ Version      │ Type     │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 📦 npm   │ typescript                 │ 5.4.2        │ cli      │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 🍺 brew  │ git                        │ 2.44.0       │ formula  │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 🐧 apt   │ curl                       │ 8.5.0        │ system   │
└──────────┴────────────────────────────┴──────────────┴──────────┘
```

---

## Prerequisites

- **Node.js >= 24** for the supported runtime baseline
- **npm** bundled with Node.js

> If Node.js is not installed yet, get it from [nodejs.org](https://nodejs.org) or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

---

## Install

### Via npm

```bash
npm install -g @mulham28/pkgmap
pnpm add -g @mulham28/pkgmap
yarn global add @mulham28/pkgmap
volta install @mulham28/pkgmap
```

### Manual install

```bash
git clone https://github.com/mulhamna/pkgmap.git
cd pkgmap
npm install
npm link

pkgmap
```

> Tip for macOS/Linux: if `npm link` fails with a permission error, use `nvm` or fix your npm global prefix instead of relying on sudo.
>
> Tip for Windows: run PowerShell or CMD as Administrator before `npm link`.

---

## Usage

```bash
# Scan all package managers
pkgmap

# Scan only one manager
pkgmap --manager brew
pkgmap --manager apt

# Search for a specific package across all managers
pkgmap --search node
pkgmap --search git

# Export results to JSON
pkgmap --export
# creates pkgmap-export.json
```

---

## Flags

| Flag | Shorthand | Description |
|------|-----------|-------------|
| `--manager <name>` | `-m` | Scan only a specific package manager |
| `--search <package>` | `-s` | Search for a package by name |
| `--export` | `-e` | Export results to `pkgmap-export.json` |
| `--version` | `-V` | Show version |
| `--help` | `-h` | Show help |

---

## Edge Cases Handled

- Manager not installed, silently skipped
- Manager installed but no packages, also skipped
- Permission issues, warning shown and scan continues
- Slow scanners, timeout and skip with a warning
- Duplicate packages across managers, highlighted with cross-manager hints
- Windows compatibility, unsupported managers auto-skipped and longer npm timeout applied
- Arch Linux, Fedora/RHEL, Alpine, openSUSE, and FreeBSD package inventories supported via pacman, dnf, apk, zypper, and pkg

---

## Adding a New Scanner

1. Create `src/scanners/<name>.js`
2. Return this shape:

```js
export default async function scan() {
  return {
    manager: 'mymanager',
    packages: [
      { name: 'some-package', version: '1.0.0', type: 'library' }
    ]
  }
}
```

3. Register it in `src/index.js`
4. Add an icon in `src/display/table.js`

---

## Tech Stack

- **Runtime:** Node.js (ESM)
- `commander` for CLI flags
- `chalk` for terminal colors
- `cli-table3` for table rendering
- `ora` for the scanning spinner

---

## License

MIT, see [LICENSE](./LICENSE).
