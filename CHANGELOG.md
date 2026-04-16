# Changelog

## [1.1.4](https://github.com/mulhamna/pkgmap/compare/pkgmap-v1.1.3...pkgmap-v1.1.4) (2026-04-16)


### Bug Fixes

* sync runtime version with 1.1.3 release ([06ca7f0](https://github.com/mulhamna/pkgmap/commit/06ca7f0a679721edfa93b225b74b069f6d41566e))

## [1.1.3](https://github.com/mulhamna/pkgmap/compare/pkgmap-v1.1.2...pkgmap-v1.1.3) (2026-04-16)


### Bug Fixes

* sync runtime version with 1.1.2 release ([191234a](https://github.com/mulhamna/pkgmap/commit/191234ab9c917a99ba179b237b79d653ab1ca4b2))

## [1.1.2](https://github.com/mulhamna/pkgmap/compare/pkgmap-v1.1.1...pkgmap-v1.1.2) (2026-04-16)


### Bug Fixes

* sync runtime version with 1.1.1 release ([d0c2df3](https://github.com/mulhamna/pkgmap/commit/d0c2df3f0e406382b227e3541e2072fa1d382a75))

## [1.1.1](https://github.com/mulhamna/pkgmap/compare/pkgmap-v1.1.0...pkgmap-v1.1.1) (2026-04-16)


### Bug Fixes

* sync runtime version with release ([480552a](https://github.com/mulhamna/pkgmap/commit/480552ac7d96fd002dcd1d415cc2d969706f1fc4))

## [1.1.0](https://github.com/mulhamna/pkgmap/compare/pkgmap-v1.0.0...pkgmap-v1.1.0) (2026-04-16)


### Features

* add broader system package manager support ([#9](https://github.com/mulhamna/pkgmap/issues/9)) ([3dcf30f](https://github.com/mulhamna/pkgmap/commit/3dcf30f6de1e7406e0bc1b9f91cee940fd20b34c))
* add linux package manager scanners ([132b2bd](https://github.com/mulhamna/pkgmap/commit/132b2bdaf631677b9d4aeeddd63ac7a964c2bccf))
* expand pkgmap to major cross-platform package ecosystems ([#10](https://github.com/mulhamna/pkgmap/issues/10)) ([23506c0](https://github.com/mulhamna/pkgmap/commit/23506c039cd79173e88da1664d460abb7bc96a24))
* handle windows ([6380882](https://github.com/mulhamna/pkgmap/commit/6380882f0efefdb4e7177ce2310c641cef61dea5))
* improve export and search cli flow ([88e2c26](https://github.com/mulhamna/pkgmap/commit/88e2c26a156b76ffc3a2e0d86f9bac01d3cbf2f7))
* integrate PR [#1](https://github.com/mulhamna/pkgmap/issues/1) and prepare pkgmap v0.3.0 ([#3](https://github.com/mulhamna/pkgmap/issues/3)) ([29685d8](https://github.com/mulhamna/pkgmap/commit/29685d87e9c1fa710f985b6c79db3cf9ef28e1db))
* Version 0.2.0 ([f1d3172](https://github.com/mulhamna/pkgmap/commit/f1d31725559047b4afc920e08c82ce792b66b63f))


### Bug Fixes

* harden cargo parser and target Node 24 ([#8](https://github.com/mulhamna/pkgmap/issues/8)) ([1cf561d](https://github.com/mulhamna/pkgmap/commit/1cf561d5be78ff39db559b0f797899238b919167))
* repair scanners and centralize version constant ([#5](https://github.com/mulhamna/pkgmap/issues/5)) ([727e4bc](https://github.com/mulhamna/pkgmap/commit/727e4bcf3ebcfe29d3ed49a49c8b544171a091fc))
* repair scanners and centralize version constant ([#6](https://github.com/mulhamna/pkgmap/issues/6)) ([33aa0e7](https://github.com/mulhamna/pkgmap/commit/33aa0e73af2963e27f06c9934c50f53b2da31354))
* resolve scanner lint errors on main ([#7](https://github.com/mulhamna/pkgmap/issues/7)) ([79e9c16](https://github.com/mulhamna/pkgmap/commit/79e9c168f7015e5e5f8c22e952871dba0b520a51))
* tighten linux scanner parsing ([9a9488d](https://github.com/mulhamna/pkgmap/commit/9a9488d72e744b8e54cb021c21511edae083d7e7))

## [1.0.0] - 2026-04-15
### Added
- New scanners for winget, Chocolatey, Scoop, Nix, uv, Bun, pipx, Poetry, Helm, and Krew

### Changed
- Project version promoted to 1.0.0 after broad cross-platform package manager coverage

## [0.4.0] - 2026-04-15
### Added
- New scanners for pacman (Arch Linux), dnf (Fedora/RHEL), apk (Alpine), zypper (openSUSE), and pkg (FreeBSD)

### Changed
- dnf scanner now falls back cleanly when repoquery is unavailable
- Release metadata and documentation synced to 0.4.0

## [0.3.2] - 2026-04-15
### Fixed
- Cargo scanner parsing hardened for more resilient `cargo install --list` handling
- Cargo scan failures now surface clearer skip reasons instead of failing silently

### Changed
- Release metadata and documentation synced to 0.3.2

---

## [0.3.0] - 2026-04-14
### Added
- New scanners: composer, gradle, maven, nuget, apt, and yum
- Expanded package manager coverage across macOS, Linux, and Windows environments

### Changed
- Version metadata updated across the CLI, docs, and package manifest to 0.3.0
- README compatibility and install guidance refreshed to match current scanner support

### Fixed
- npm scanner timeout on Windows increased from 10s to 30s to account for slower file system operations
- Runtime version display now matches the published package version

---

## [0.2.1] - 2026-04-13
### Fixed
- Version references corrected for the 0.2.1 release

---

## [0.2.0] - 2026-04-13
### Added
- Linux package manager scanners for flatpak and snap
- Improved export and search CLI flow
- Documentation updates for upcoming scanner roadmap

### Fixed
- Linux scanner parsing tightened for more reliable results

---

## [0.1.0] - Initial release
### Added
- Support: npm, pnpm, yarn, brew, volta, pip, cargo, gem
- Flags: --manager, --search, --export
- Windows compatibility: `where` used instead of `which`, brew and gem auto-skipped
