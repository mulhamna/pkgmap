# pkgmap

> One command to see everything installed on your machine — across all package managers.

---

## Project Overview

`pkgmap` adalah CLI tool berbasis Node.js yang melakukan scan semua package manager yang terinstall di local machine, lalu menampilkan hasilnya dalam terminal table yang rapi dan grouped per package manager.

---

## Tech Stack

- **Runtime:** Node.js (ESM, `"type": "module"`)
- **Dependencies:**
  - `commander` — CLI flags & commands
  - `chalk` — warna terminal
  - `cli-table3` — terminal table
  - `ora` — spinner saat scanning
- **Dev Dependencies:**
  - `eslint` — linting
  - `prettier` — formatting

---

## Folder Structure

```
pkgmap/
├── src/
│   ├── scanners/
│   │   ├── npm.js
│   │   ├── pnpm.js
│   │   ├── yarn.js
│   │   ├── brew.js
│   │   ├── volta.js
│   │   ├── pip.js
│   │   ├── cargo.js
│   │   └── gem.js
│   ├── display/
│   │   └── table.js
│   └── index.js
├── bin/
│   └── pkgmap.js
├── CHANGELOG.md
├── package.json
└── claude.md
```

---

## Package.json (current shape)

```json
{
  "name": "@mulham28/pkgmap",
  "version": "1.0.0",
  "type": "module",
  "description": "One command to see everything installed on your machine",
  "engines": {
    "node": ">=24.0.0"
  },
  "bin": {
    "pkgmap": "bin/pkgmap.js"
  },
  "scripts": {
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "release:check": "node scripts/sync-version-check.mjs",
    "start": "node bin/pkgmap.js"
  }
}
```

---

## CLI Commands & Flags

| Command | Description |
|---|---|
| `pkgmap` | Scan semua package manager, tampilkan table |
| `pkgmap --manager brew` | Filter scan hanya satu package manager |
| `pkgmap --search axios` | Cari package tertentu di semua PM |
| `pkgmap --export` | Export hasil ke `pkgmap-export.json` |

---

## Scanners

Setiap scanner ada di `src/scanners/<name>.js` dan harus export satu default async function dengan interface yang sama:

```js
// Interface wajib tiap scanner
export default async function scan() {
  return {
    manager: 'npm',        // nama package manager
    packages: [
      {
        name: 'typescript',
        version: '5.4.2',
      }
    ]
  }
}
```

### Cara ambil data per package manager:

| Scanner | Command yang dijalankan |
|---|---|
| `npm.js` | `npm list -g --depth=0 --json` |
| `pnpm.js` | `pnpm list -g --depth=0 --json` |
| `yarn.js` | `yarn global list --depth=0` |
| `brew.js` | `brew list --versions` |
| `volta.js` | `volta list --format=plain` |
| `pip.js` | `pip3 list --format=json` |
| `cargo.js` | `cargo install --list` |
| `gem.js` | `gem list` |

---

## Edge Cases — Wajib Dihandle

Setiap scanner harus handle kondisi berikut:

### 1. Package manager tidak terinstall
```js
// Cek dulu apakah binary tersedia sebelum eksekusi
import { execSync } from 'child_process'

function isAvailable(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
```
Kalau tidak tersedia → return `null`, orchestrator akan skip dan tampilkan warning ringan.

### 2. Windows compatibility
- Ganti `which` dengan `where` di Windows
- Detect OS dengan `process.platform === 'win32'`
- Beberapa scanner (brew, gem) mungkin tidak tersedia di Windows — skip gracefully

### 3. Permission error
- Wrap semua `execSync` / `exec` dalam try-catch
- Kalau error karena permission → tampilkan pesan: `⚠ <manager>: permission denied. Try running with sudo.`

### 4. Slow scanner (brew, cargo)
- Tiap scanner dijalankan dengan spinner dari `ora`
- Spinner per package manager: `Scanning brew...`
- Set timeout 10 detik per scanner, kalau lewat → skip + warning

### 5. Duplikat package
- Kalau package yang sama muncul di lebih dari satu PM → tampilkan keduanya, jangan deduplicate
- Di kolom tabel, beri tanda visual (misal baris dengan warna berbeda atau badge `[also in npm]`)

---

## Display / Table Format

Output dikelompokkan per package manager:

```
┌─────────────────────────────────────────────┐
│  pkgmap — local package inventory           │
└─────────────────────────────────────────────┘

📦 npm (12 packages)
┌──────────────────┬───────────┐
│ Package          │ Version   │
├──────────────────┼───────────┤
│ typescript       │ 5.4.2     │
│ nodemon          │ 3.1.0     │
└──────────────────┴───────────┘

🍺 brew (8 packages)
┌──────────────────┬───────────┐
│ Package          │ Version   │
├──────────────────┼───────────┤
│ git              │ 2.44.0    │
│ ffmpeg           │ 6.1.1     │
└──────────────────┴───────────┘
```

---

## Orchestrator (src/index.js)

Flow utama:
1. Import semua scanner
2. Jalankan semua scanner secara **paralel** (`Promise.allSettled`) — jangan sequential, biar cepat
3. Kumpulkan hasilnya
4. Filter yang null / error
5. Pass ke display/table.js untuk render

```js
// Skeleton orchestrator
import { Promise } from 'node:...'
import npmScanner from './scanners/npm.js'
// ... import lainnya

const scanners = [npmScanner, pnpmScanner, yarnScanner, brewScanner, voltaScanner, pipScanner, cargoScanner, gemScanner]

const results = await Promise.allSettled(scanners.map(s => s()))
```

---

## bin/pkgmap.js

```js
#!/usr/bin/env node
import { program } from 'commander'
import { run } from '../src/index.js'
import { APP_VERSION } from '../src/version.js'

program
  .name('pkgmap')
  .description('See everything installed on your machine')
  .version(APP_VERSION)
  .option('-m, --manager <name>', 'scan only a specific package manager')
  .option('-s, --search <package>', 'search for a specific package')
  .option('-e, --export', 'export results to pkgmap-export.json')
  .action(run)

program.parse()
```

---

## Install & Local Dev

```bash
# Clone repo
git clone https://github.com/<username>/pkgmap.git
cd pkgmap

# Install dependencies
npm install

# Link secara lokal biar bisa dipanggil sebagai CLI
npm link

# Jalankan
pkgmap
```

---

## Publish ke npm

```bash
# Pastikan sudah login
npm login

# Publish
npm publish --access public
```

### Release and versioning rules
- Version source of truth is `package.json`
- Keep `src/version.js` in sync with `package.json`
- Keep `package-lock.json` root version in sync with `package.json`
- Run `npm run release:check` before publish-sensitive changes
- CI enforces version sync to catch drift early
- Release PR flow owns version bumps and changelog preparation

Setelah publish ke npm, otomatis bisa diinstall via:
- `npm install -g @mulham28/pkgmap`
- `pnpm add -g @mulham28/pkgmap`
- `yarn global add @mulham28/pkgmap`
- `volta install @mulham28/pkgmap`

---

## Homebrew Tap (later)

Belum jadi prioritas. Dikerjain setelah ada user base.
Nanti perlu bikin repo `homebrew-pkgmap` dan Formula `.rb`.

---

## CHANGELOG.md (template)

```md
# Changelog

## [1.0.0] - current baseline
### Added
- Cross-platform package manager coverage expanded through v1.0.0
- Release PR flow prepares version bumps and changelog updates
- CI now validates version sync before release-sensitive runs
```

---

## Contribution Guide (ringkas, taruh di README nanti)

- Mau nambah support package manager baru? Tinggal buat file baru di `src/scanners/`
- Ikutin interface scanner yang sudah ada (export default async function, return `{ manager, packages }`)
- PR welcome!
