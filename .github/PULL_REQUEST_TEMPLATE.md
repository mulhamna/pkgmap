<!--
  Title: ≤ 70 chars, Conventional Commits style (feat:/fix:/chore:/refactor:/docs:/test:/ci:),
  no trailing period. release-please parses commit/PR titles.
-->

## Summary

<!-- 1–3 bullets: WHY this change exists, not what (the diff shows the what). -->

-

## Changes

<!-- Bullet list of the actual edits, grouped per area. -->

-

## Type of change

<!-- Tick all that apply. Match the leading Conventional Commit type. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — no behavior change
- [ ] `chore` — tooling / maintenance
- [ ] `docs` — documentation only
- [ ] `test` — tests only
- [ ] `ci` / `build` — pipeline or build

## Test plan

- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run release:check`
- [ ] Ran `pkgmap` locally and verified output

## Checklist

- [ ] Subject line ≤ 72 chars, imperative mood, no trailing period
- [ ] One logical change — no unrelated edits bundled in
- [ ] New/changed scanner follows the interface (`export default async function` → `{ manager, packages }`)
- [ ] No `CHANGELOG.md` hand-edits in release-please-managed sections
