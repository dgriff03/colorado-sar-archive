# Colorado SAR Archive

Explore Colorado search and rescue reports by location, title and notes search, year,
and incident type—or group records by outcome, location, county, and agency.
Incidents and filtered views have shareable links. Location counts consolidate
reviewed aliases into browsing areas while preserving reported locations.
See [location curation](docs/locations.md) to extend the mappings.

[Explore the website](https://rescue.typetwo.dev/) ·
[Download SQLite](https://rescue.typetwo.dev/data/colorado-sar.db) ·
[Connect Claude or Codex](https://rescue.typetwo.dev/mcp/)

The initial import contains **3,718 records from 2010–2026**; one confirmed
duplicate has been consolidated, leaving **3,717 published incidents**. Coverage and
source quality vary: counts describe this archive, not all rescues or geographic
risk. Weather data is excluded. Code is [MIT licensed](LICENSE); incident data
and linked source material are **not** covered by that license. Data licensing
awaits maintainer review; source publishers retain their rights.

Canonical domain: **rescue.typetwo.dev**. [Domain setup](docs/domain.md).
AI discovery: [`/llms.txt`](https://rescue.typetwo.dev/llms.txt), with generated
Markdown FAQ/MCP guides and a [data guide](https://rescue.typetwo.dev/data-guide.md).

## 1. Run the website, build it, or build only the database

### Get the source

```sh
git clone https://github.com/dgriff03/colorado-sar-archive.git
cd colorado-sar-archive
```

The data pipeline needs **Python 3.10+**, with no third-party Python packages.
The website and MCP also need **Node.js 22.13+** and npm. Run commands below
from the repository root.

### Use your own domain

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to your public
origin (for example `https://rescues.example.org`). It defaults to
`https://rescue.typetwo.dev`. Use an HTTP(S) origin with no subdirectory, query,
or fragment. This is public configuration, not a secret.

Run `npm run build` and `npm run mcp:build` after changing it. Both builds use
this setting for links, metadata, MCP browser origins, and published Markdown
and `llms.txt`. Shell environment variables override `.env.local` and `.env`.
Repository documentation continues to describe the upstream deployment.

For local stdio MCP or Python duplicate reports, export the same variable in
your shell (`export NEXT_PUBLIC_SITE_URL=https://rescues.example.org`); these
commands read the process environment directly. Domain configuration does not
change Firebase project IDs: self-hosters must also select their own Firebase
project and connect their domain as described in [domain setup](docs/domain.md).

### Just build the database

No Node, Firebase account, or website build is needed:

```sh
python3 scripts/data.py validate
python3 scripts/data.py build
```

This creates `public/data/colorado-sar.db`, a consolidated SQLite database with
an `incidents` table, plus the JSON search index and individual detail files.
Only reviewed files under `data/incidents/` are included; `pending/` is excluded.
Re-running the build regenerates these outputs. Generated files stay out of Git.

Query it with Python's built-in SQLite support:

```sh
python3 - <<'PY'
import sqlite3
with sqlite3.connect('public/data/colorado-sar.db') as db:
    for row in db.execute('''
        SELECT location, outcome, COUNT(*) AS incidents
        FROM incidents
        GROUP BY location, outcome
        ORDER BY incidents DESC
        LIMIT 20
    '''):
        print(row)
PY
```

`id` is a stable UUID v4 stored as TEXT for every record. Imported numeric IDs
remain in `legacy_id` for provenance; old `legacy-*` links resolve via
`config/id-aliases.json`. `summary` is the
searchable title. SQL groups above use stored values; website/MCP grouping also
normalizes case and surrounding whitespace. Consult the [data and operations
reference](docs/operations.md) for import provenance and schema caveats.

### Run and build the website

```sh
npm ci
npm ci --prefix functions
npm run dev
```

Open the local URL printed by the development server. Data is generated
automatically before development and production builds.

```sh
npm run data:validate
npm test
npm run typecheck
npm run build
```

The deployable static website is in **`dist/client/`**, including the SQLite
download, search index, and incident details. Search runs in the browser; no
application server or paid database is required for browsing. The optional hosted
MCP uses a Firebase Cloud Function. `npm run build` also checks
that all website routes and data files were exported successfully.

To deploy **your own copy**, create a Firebase project with Hosting, install the
Firebase CLI, enable the Blaze plan for the hosted MCP, then use your project ID explicitly:

```sh
npm install -g firebase-tools
firebase login
npm run build
npm ci --prefix functions
firebase deploy --only functions:sar-mcp,hosting --project YOUR_FIREBASE_PROJECT_ID
```

The checked-in `.firebaserc` points to the original archive. Do not use the
maintainer's `npm run deploy` shortcut for your fork until you change that
project mapping. Add a custom domain in your Firebase Hosting console.
For your own copy, replace `config/analytics.json` with your own GA measurement
configuration, or remove `<Analytics />` and its import in `app/layout.tsx`.
Replace archive/repository links and MCP URLs when branding a fork. For a static-only
copy on Firebase Spark, remove the MCP rewrites from `firebase.json` and deploy
with `--only hosting`. Hosted MCP deployment details are in
[docs/hosting-mcp.md](docs/hosting-mcp.md).

### Edit content or connect an assistant

- **FAQ:** edit `content/faq.json`. Answers support Markdown links, lists,
  emphasis, and code; use `\n\n` inside JSON strings for paragraphs. A null
  answer displays “Answer coming soon.” Rebuild/deploy to publish.
- **Claude Desktop or Codex:** follow the [MCP setup guide](docs/mcp.md).
  The hosted, read-only server supports search, full details, and grouped counts.
  Connect by URL without installing anything; local/offline setup is optional.
- **Review findings:** [verified fixes and deferred policy decisions](docs/adversarial-review.md).
- **Maintainer reference:** [operations, analytics, provenance, and
  permissions](docs/operations.md). [Landscape credit](public/IMAGE-CREDITS.md).

## 2. Contribute incident entries

### Start with an existing-event check

Search the [archive](https://rescue.typetwo.dev/) for the date, place,
and event before submitting. Two reports about one rescue belong in one record.
For an existing event, propose a correction to its accepted JSON file and add
supporting sources instead of creating a new incident. Keep its stable ID.

### Submit one file per incident

1. Fork the repository and create a branch in your fork.
2. Create a new entry:

   ```sh
   python3 scripts/data.py new
   ```

   The command prints a new `pending/<uuid>.json` path. Edit that file; never
   reuse an example UUID or create a shared numeric ID counter.
3. Fill in the incident date, factual summary, location, and public source URLs.
   Use null for unknown values and explain uncertainty in `notes`. Separate
   multiple source URLs with `|`. Do not add weather fields.
4. Validate and review possible duplicates:

   ```sh
   python3 scripts/data.py validate
   python3 scripts/data.py duplicates
   ```

5. Commit only your incident files and open a pull request against `main`.
   Explain source quality, uncertain dates, and any duplicate candidates.
   A batch of 10–100 incidents can be one PR containing 10–100 files.

See [CONTRIBUTING.md](CONTRIBUTING.md) for a complete example, field conventions,
corrections, and review rules. Node is not required for entry-only contributions.

### Merge duplicates or remove an incident

For a confirmed duplicate, combine sources and details under one surviving ID,
then add the retired ID to `config/incident-merges.json`. Old links keep working.
Follow the [merge example](CONTRIBUTING.md#merge-example) and preserve conflicting facts.

For a removal, use `config/exclusions.json` to exclude incident IDs, normalized
source-URL MD5s or whole-domain MD5s. These prevent re-publication; deleting the
source JSON and handling repository history are separate steps. Follow the
[removal instructions](CONTRIBUTING.md#request-or-perform-an-incident-removal).

**14ers.com and its subdomains are disallowed sources.** Contributions are
validated against `config/disallowed-domains.json` and removal exclusions.
A matching incident is withheld in full, even when it cites other sources.

### How duplicate review and publication work

Identical pending content and duplicate IDs block validation. Similar titles,
nearby dates/places, and shared sources create **review candidates**, not automatic
merges. CI publishes a duplicate report with matching reasons and source links.
These heuristics can miss duplicates or flag distinct events. To audit the full
archive, run:

```sh
python3 scripts/data.py duplicates --all --output work/duplicate-candidates.md
```

After review and merge, pending entries remain unpublished until the maintainer
runs **Promote reviewed incidents** on `main`. That owner-only workflow moves
reviewed entries into `data/incidents/YYYY/`, opens a promotion PR, and builds a
SQLite artifact. The maintainer reviews/merges it and deploys the site separately.
Contributors do not need Firebase access or credentials.

```text
pending/<uuid>.json                 contributor's proposal
          ↓ review + owner promotion
 data/incidents/YYYY/<id>.json      accepted source of truth
          ↓ deterministic build
 public/data/colorado-sar.db        consolidated database
 public/data/incidents.json        search index
 public/data/incidents/<id>.json    full incident details
```

One file per event gives independent diffs and avoids binary database merges.
Accepted files are organized by year; month or ID-prefix folders can be added
as volume grows. Visitors load one generated index, not thousands of files.
