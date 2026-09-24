## What changed and why

<!-- Describe the outcome. For a bug, give a concrete before/after example.
Use a focused PR: incident batch, correction, code, or documentation.
Guidelines: CONTRIBUTING.md. Target branch: main. -->

## Evidence and review notes

<!-- Data: list incident IDs, source links, uncertain facts and duplicate candidates.
Corrections: explain the evidence and retain the existing IDs.
Code/docs: mention relevant issues, compatibility or deployment steps.
Write N/A when this section does not apply. -->

## Validation

<!-- List commands run and outcomes. State any checks not run and why.
Data: python3 scripts/data.py validate; python3 scripts/data.py duplicates.
Code: data:validate, test, typecheck, build, mcp:build (see CONTRIBUTING.md).
Docs: check links/commands; build for published content changes. -->

## Checklist

- [ ] This PR has one clear purpose and follows CONTRIBUTING.md.
- [ ] The diff excludes credentials, generated databases/data exports, builds and logs.
- [ ] Validation results and remaining limitations are documented above.

For incident changes only (otherwise mark N/A in the review notes):

- [ ] New incidents use separate UUID-named files in `pending/`; corrections preserve IDs.
- [ ] I searched for existing events and explained duplicate candidates.
- [ ] Dates refer to incidents, or uncertainty is explicit in notes.
- [ ] Public sources support the summary; unknowns remain unknown.
- [ ] I omitted weather fields, unnecessary identifiers and nonpublic information.
- [ ] No pending records were promoted by this PR.
