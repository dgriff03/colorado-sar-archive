<!-- Detailed reference; start with ../README.md for setup and contributions. -->
# Archive operations and data reference

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
only from accepted files, never pending submissions. See [CONTRIBUTING.md](../CONTRIBUTING.md).

`npm run data:new` creates a blank pending record. `npm run data:validate`
validates accepted and pending records. `npm run data:promote` moves reviewed
records locally; repository permissions and the manual workflow enforce who can
publish changes. No local script can stop the owner of a local clone from editing it.

## Import and provenance

The initial SQLite upload was read as a standalone immutable snapshot and passed
SQLite integrity_check. All 3,718 rows were retained. Weather fields (`wx_*`) were subsequently removed
at the maintainer’s request; all other original fields are preserved. Original
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
Read source notes before interpreting statistics. Weather fields are excluded
from canonical JSON, the website, new imports, and generated SQLite. The original
upload and past Git revisions remain untouched.

## FAQ

Edit `content/faq.json`. Answers support standard Markdown: inline links, emphasis,
lists, blockquotes, and code. Questions remain plain text. Set `answer` to null
to show “Answer coming soon.” No CMS is involved. For example:

```json
{
  "question": "Where can I find the project?",
  "answer": "Visit the [public repository](https://github.com/dgriff03/colorado-sar-archive).\n\nRead the **contribution guide** before submitting an incident."
}
```

Inside JSON strings, use `\n` for a line break and `\n\n` for a new paragraph.
Raw HTML is skipped, and unsafe link schemes are filtered by the Markdown renderer.
Rebuild and deploy to publish edits.

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

## Validation notes

All original fields were compared with the supplied SQLite snapshot after import.
The ingestion/search tests cover malformed input, batch preflight, duplicate IDs and content,
pending exclusion, fuzzy search, combined filters and generated SQLite consistency.
Production checks verify the explorer, FAQ, and MCP guide routes, the search index, incident details and
database downloads over HTTP. Browser interaction/visual testing was not run.
The optional WebMCP search tool has registry contract tests; a native WebMCP
browser context was not available for verification.

The current 1.6 MB search index is appropriate for this initial archive. As the
collection grows substantially (for example, beyond tens of thousands of rows),
move search into a worker or server index instead of loading the full index into
the main browser thread. Canonical incident files and the contribution flow can
remain unchanged.

## Finding duplicates

```sh
npm run data:duplicates                         # pending vs accepted + pending
npm run data:duplicates -- --all --output work/duplicate-candidates.md
```

CI attaches a **Duplicate review** summary and full downloadable Markdown report
on each check and promotion run. Every candidate has IDs, dates, places, source
URLs and matching reasons. Identical pending content (excluding IDs and empty
optional fields) blocks validation and promotion, including matches elsewhere
in the pending batch. Similar descriptions, nearby dates, places, and shared
source URLs are advisory review candidates; no records are automatically merged
or deleted. Common source URLs (more than 10 records) are treated as collection
reports and cannot alone trigger a match. Recognizable category, tag, pagination,
and mission-summary URLs are also treated as collections. Different explicit
mission numbers from the same agency suppress a fuzzy match. These heuristics
trade some recall for fewer false alarms; they are not a proof of distinct events.
Tracking parameters are stripped for
comparison; article-identifying URL parameters remain intact.

Different wording, inaccurate dates, and missing sources can hide duplicates;
multiple incidents in one article can cause false positives. The default date
window is ±3 days. Uncommon shared sources can also find date disagreements.
Use the full archive scan for a cleanup audit; resolve a candidate by editing the
existing record with its stable ID and adding sources, then removing a redundant
pending submission. Historical accepted duplicates need an explicit reviewed
correction; the tool never edits data.

One file per incident trades a larger file count for independent diffs. Current
year folders are small. If ingestion grows toward 100 incidents/day, introduce
month or ID-prefix subfolders before any one directory becomes too wide. The
website reads one generated search index and fetches details on demand; it does
not make one request per repository file on page load.

## Grouped exploration and sharing

Use **Group & count** to group the filtered archive by location, outcome, county,
incident type, or responding agency, with an optional second field. Counts sort
descending. Clicking a group shows only its exact members (not substring matches).
Case and surrounding whitespace are normalized; empty values form a “Not recorded”
group. Place aliases are not automatically merged. Counts reflect this collection,
not all incidents or geographic risk.

Filters, selected group, view, pagination, and incident IDs are encoded in the URL.
Opening an incident adds a history entry; Back closes it and restores the previous
view, and Forward reopens it. Direct incident links work on Firebase without a
server route. Closing a direct link returns to the archive instead of leaving the
site. The incident panel includes **Copy incident link**.

## Analytics

The archive has its own GA4 property **555725939**, web stream **15837736850**, and
measurement ID **G-2L4K7PT38M**, under the owner's existing Analytics account.
[Open Analytics](https://analytics.google.com/analytics/web/#/p555725939/reports/intelligenthome).
The public measurement configuration lives in `config/analytics.json`; it contains
no secrets. No Firebase SDK credentials are needed in the website.

The Google tag sends page views for page loads and browser history changes, including
group and incident navigation and Back/Forward. Enhanced measurement was verified
as enabled in the tag configuration. The application deliberately does not send
manual `page_view` events as well, which would double-count them. URL filter changes
also represent page views; reports can use “Page path + query string” to distinguish
them. Reporting can be delayed, and blockers, Do Not Track, and Global Privacy
Control can prevent collection. Localhost is excluded. Google signals, ad
personalization, and enhanced conversions are disabled in the tag configuration.

The code and configured Google tag were checked; real production visitor reports
need to populate after deployment. Search URLs may include typed queries, so do
not enter private information.

## Landscape credit

The header uses a public-domain National Park Service photo of Hallett Peak and
Dream Lake, attributed to John Marino / NPS. Source and processing details are in
`public/IMAGE-CREDITS.md`. The image is stored locally as an optimized WebP.
