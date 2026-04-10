# Changelog

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
