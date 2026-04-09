# pkgmap

> One command to see everything installed on your machine — across all package managers.

```
  ╔═══════════════════════════════════╗
  ║  📦 pkgmap  v0.1.0               ║
  ╚═══════════════════════════════════╝
```

---

## What is pkgmap?

`pkgmap` scans all package managers installed on your local machine and displays everything in a single, clean terminal table — with manager info, version, and a short description of each package.

No more switching between `npm list -g`, `brew list`, `pip list`, and so on. One command, full picture.

---

## Supported Package Managers

| Icon | Manager | Command Used |
|------|---------|-------------|
| 📦 | npm | `npm list -g --depth=0 --json` |
| 📦 | pnpm | `pnpm list -g --depth=0 --json` |
| 🧶 | yarn | `yarn global list --depth=0` |
| 🍺 | brew | `brew info --json=v2 --installed` |
| ⚡ | volta | `volta list --format=plain` |
| 🐍 | pip | `pip3 list --format=json` |
| 🦀 | cargo | `cargo install --list` |
| 💎 | gem | `gem list` |

Only managers that are **installed and have packages** will appear in the output.

---

## Output

```
  ╔═══════════════════════════════════╗
  ║  📦 pkgmap  v0.1.0               ║
  ╚═══════════════════════════════════╝

  📦 npm: 4  ·  🍺 brew: 64  ·  🐍 pip: 3  ·  💎 gem: 48
  Total: 119 packages across 4 manager(s)

┌──────────┬────────────────────────────┬──────────────┬──────────┐
│ Manager  │ Package                    │ Version      │ Type     │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 📦 npm   │ typescript                 │ 5.4.2        │ cli      │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 🍺 brew  │ git                        │ 2.44.0       │ formula  │
├──────────┼────────────────────────────┼──────────────┼──────────┤
│ 🍺 brew  │ docker                     │ 29.2.1       │ cask     │
└──────────┴────────────────────────────┴──────────────┴──────────┘
```

---

## Install

> **Note:** pkgmap is not yet published to npm. Please use the manual install below.

### Manual install (recommended for now)

```bash
git clone https://github.com/mulhamna/pkgmap.git
cd pkgmap
npm install
npm link

pkgmap
```

### Via npm *(coming soon)*

```bash
npm install -g pkgmap
pnpm add -g pkgmap
yarn global add pkgmap
volta install pkgmap
```

---

## Usage

```bash
# Scan all package managers
pkgmap

# Scan only one manager
pkgmap --manager brew
pkgmap --manager npm

# Search for a specific package across all managers
pkgmap --search node
pkgmap --search git

# Export results to JSON
pkgmap --export
# → creates pkgmap-export.json
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

- **Manager not installed** → silently skipped, won't appear in output
- **Manager installed but no global packages** → also skipped (no empty tables)
- **Permission errors** → shows `⚠ <manager>: permission denied. Try running with sudo.`
- **Slow scanners** → 10 second timeout per scanner, skipped with a warning if exceeded
- **Duplicate packages** (same package in multiple managers) → shown in both, highlighted in yellow with a `↔ <other manager>` badge
- **Windows** → brew and gem are skipped automatically; `where` used instead of `which`

---

## Adding a New Scanner

1. Create `src/scanners/<name>.js`
2. Follow the standard interface:

```js
export default async function scan() {
  return {
    manager: 'mymanager',
    packages: [
      { name: 'some-package', version: '1.0.0', description: 'Does something cool' }
    ]
  }
}
```

3. Register it in `src/index.js`
4. Add its icon to `src/display/table.js` → `MANAGER_ICONS`

---

## Tech Stack

- **Runtime:** Node.js (ESM)
- `commander` — CLI flags
- `chalk` — terminal colors
- `cli-table3` — table rendering
- `ora` — spinner while scanning

---

## License

MIT — see [LICENSE](./LICENSE) for details.
