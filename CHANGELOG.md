# Changelog

## [Unreleased]
### Fixed
- npm scanner timeout on Windows — increased from 10s to 30s to account for slower Windows file system operations

### Added
- Prerequisites section in README (Node.js >= 18 requirement)
- Windows install tip in README (run terminal as Administrator for `npm link`)
- Platform compatibility table in README showing which managers support macOS / Linux / Windows
- New scanners: composer, gradle, maven, nuget
- Linux scanners: apt and yum

---

## [0.1.0] - TBD
### Added
- Initial release
- Support: npm, pnpm, yarn, brew, volta, pip, cargo, gem
- Flags: --manager, --search, --export
- Windows compatibility: `where` used instead of `which`, brew and gem auto-skipped
