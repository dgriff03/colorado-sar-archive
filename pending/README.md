# Pending review

Add one incident per UUID-named JSON file. Run `npm run data:new` to generate a
blank record, fill it out, and submit a pull request. Required: `id`, `date`,
`summary`, `location`, `source_urls`. Use the incident date (YYYY-MM-DD). Separate
multiple HTTP(S) source URLs with `|`. Use `null` for unknown values, never invent
an outcome. `summary` serves as the searchable title; keep it factual.

These files are **public in GitHub** but are excluded from the published website
and generated SQLite until promoted. Do not put private material here.

Only the repository owner can run **Actions → Promote reviewed incidents** on
`main`. The action opens a PR that moves files to `data/incidents/YYYY/`; it never silently
replaces another incident. Accepted JSON stays in Git permanently. Files in this
folder should already have been reviewed when their PR was merged.
