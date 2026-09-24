# Colorado SAR Archive

A public, searchable archive of Colorado search and rescue incidents.

**Website:** https://colorado-sar-archive.web.app  
**Initial dataset:** 3,718 records, January 1, 2010–September 21, 2026.

Search by place, peak, trail, or county; use typo-tolerant title search; filter by
year and incident type; inspect the original sources and caveats for each record.
The site is static and deployed to Firebase Hosting. No application server or
paid database is needed. Search happens in the browser.

## Start locally

```sh
npm ci
npm run dev
```

Node 22.13+ and Python 3.10+ are required. The dev/build commands generate public
data automatically. `npm test`, `npm run typecheck`, and `npm run build` validate
the pipeline and produce the Firebase artifact in `dist/client/`.

## Repository model

```text
pending/<uuid>.json              proposed incident, one file per event
             │ owner-only manual promotion
             ▼
data/incidents/YYYY/<id>.json    canonical, reviewed source of truth
             │ deterministic build
             ├── public/data/incidents.json           browser search index
             ├── public/data/incidents/<id>.json      on-demand detail
             └── public/data/colorado-sar.db          consolidated SQLite
content/faq.json                 editable FAQ questions and answers
```

Accepted JSON remains in Git. SQLite and public JSON are generated, ignored
artifacts: no binary merges and no shared ID counter. UUID names let multiple
contributors independently submit 10–100 records per day. The index is generated
only from accepted files, never pending submissions. See [CONTRIBUTING.md](CONTRIBUTING.md).

`npm run data:new` creates a blank pending record. `npm run data:validate`
validates accepted and pending records. `npm run data:promote` moves reviewed
records locally; repository permissions and the manual workflow enforce who can
publish changes. No local script can stop the owner of a local clone from editing it.

## Import and provenance

The initial SQLite upload was read as a standalone immutable snapshot and passed
SQLite integrity_check. All 3,718 rows and original fields were retained. Original
numeric IDs are in `legacy_id`; stable public IDs are `legacy-000001`, etc. New
incidents use UUID v4 IDs. The generated SQLite `id` column is TEXT, with the
original numeric ID available in `legacy_id`. SQL columns preserve original
names (`summary` is the website's searchable title). `detail_score` intentionally
has no SQLite type affinity because the source contains text labels and numbers.

The original file is not modified or committed. `scripts/import_sqlite.py` is a
one-time importer and refuses to overwrite accepted records. Its immutable mode
is for standalone snapshots; export/checkpoint a live WAL database before import.

Dates, counties, outcomes, and source coverage are not uniformly complete or
verified. County strings are preserved verbatim, including multi-county values.
The weather lat/lon fields may be county-level estimates and are deliberately not
plotted as rescue locations. Read source notes before interpreting statistics.

## FAQ

Edit `content/faq.json`. Set `answer` to a string to publish an answer; null shows
“Answer coming soon.” Starter questions are included for the maintainer to fill.

## Deploy and custom domain

The new Firebase project is `colorado-sar-archive`.

```sh
firebase login
npm run deploy
```

Deployment rebuilds the accepted data and site, then deploys Hosting only.
In the [Firebase Hosting console](https://console.firebase.google.com/project/colorado-sar-archive/hosting),
choose **Add custom domain** and follow the ownership/DNS steps. No code change is
required for a domain. [Firebase Hosting documentation](https://firebase.google.com/docs/hosting).

The initial deployment uses the owner's existing Firebase login; no credentials
are committed or sent to GitHub. Recurring deployment remains a manual owner step.

## Permissions

The owner-only promotion workflow checks both the actor and `main` ref.
CODEOWNERS identifies the maintainer. Main branch protection requires the
`check` status and code-owner review, and blocks force pushes/deletion. The owner can use the
admin override when reviewing their own work. Promotion opens a PR, so it respects
these protections. External
contributors use forks and PRs, not direct writes to main. If the repo moves to an
organization, replace the workflow's repository-owner actor check with the exact
maintainer username before running promotion.

## Rights

Project code is MIT licensed; see LICENSE. Incident data and linked source
material are **not** covered by that code license. Data redistribution/licensing
terms are pending maintainer review. Source publishers retain their rights.
This archive does not claim completeness or agency endorsement.
