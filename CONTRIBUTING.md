# Contributing


Daniel ([@dgriff03](https://github.com/dgriff03)) is the sole maintainer, listed
in [OWNERS](OWNERS). GitHub review ownership is configured in
[.github/CODEOWNERS](.github/CODEOWNERS).

## Pull request guidelines

- Open PRs against **`main`** from a focused branch in your fork. Keep each PR to
  one purpose: an incident batch, an evidence-supported correction, or a code/docs change.
  Related batches of 10–100 incidents are welcome; avoid unrelated formatting churn.
- Use a descriptive title, such as “Add 12 Boulder County incidents from August
  2026” or “Preserve filters when closing an incident.”
- Explain **what changed and why**, with incident IDs/source links for data changes
  or a concrete before/after example for behavior changes. Call out uncertainty,
  duplicate candidates, compatibility changes and deployment steps where relevant.
- Record the checks you ran and their results. If a check was not run, say so and
  explain why. Do not mark unrelated checklist items as completed; use N/A.
- New incidents belong in `pending/`, one UUID-named JSON file per event. Correct
  accepted records in place and preserve IDs. Do not promote entries as part of
  a contributor PR; promotion is a separate maintainer action.
- Commit source files and required dependency lockfile changes. Exclude generated
  databases, public data exports, builds, logs and credentials. Keep example
  configuration limited to placeholders. Review `git diff --cached` before committing.
- Respond to review comments in the same PR. Required CI must pass before merge;
  Daniel reviews and merges contributions. Avoid force-pushing once review starts
  unless coordinating it with the maintainer. A tidy commit history is welcome,
  but contributors do not need to squash commits themselves.
- A merge does not publish the website or promote pending incidents. Those are
  separate maintainer-operated steps.

### Checks for your change

For incident submissions/corrections, Python 3.10+ is sufficient:

```sh
python3 scripts/data.py validate
python3 scripts/data.py duplicates
```

Inspect the duplicate report and explain candidates; a successful command alone
does not establish that the events are distinct.

For website, MCP, ingestion or search changes, use Node.js 22.13+ and Python 3.10+:

```sh
npm ci
npm ci --prefix functions
npm run data:validate
npm test
npm run typecheck
npm run build
npm run mcp:build
```

For documentation-only changes, check links, commands and Markdown formatting.
Changes to FAQ/MCP content or generated documentation also need `npm run build`.
CI runs the full suite for every PR and attaches duplicate-review/build artifacts.

## Contributing incidents

1. Search the archive for the same event; multiple news articles may describe one rescue.
2. Fork this repository and create a branch.
3. Run `python3 scripts/data.py new` (or generate a UUID v4 and create `pending/<uuid>.json`).
4. Fill in the incident date, concise factual `summary`, location and source URLs.
5. Run `python3 scripts/data.py validate` and `python3 scripts/data.py duplicates`, review matches, and open a pull request.

A submission can be as small as:

```json
{
  "id": "f10f6a92-e1c0-43bc-9c40-3ea70ea9f800",
  "date": "2026-08-04",
  "summary": "Short factual description supported by the source",
  "location": "Named trail or area",
  "county": "County name without the word County",
  "incident_type": "injury",
  "outcome": null,
  "victims": null,
  "responding_agency": "Agency name",
  "source_urls": "https://example.org/replace-with-real-report",
  "notes": "Explain uncertainties here."
}
```

Generate a fresh UUID for every real submission; do not copy the example ID.
The script is dependency-free Python 3.10+; Node is only needed to work on the site.
For batches of 10–100 a day, use one file per incident in a single PR. There is no
shared counter or index to edit. Do not commit generated SQLite or website JSON.

## Data conventions

- `date`: ISO incident date; document uncertain/estimated dates in `notes`.
- `summary`: searchable title/summary, preferably one or two sentences.
- `source_urls`: one or more publicly accessible HTTP(S) links, separated by `|`.
- Types already in the archive: `lost/stranded`, `injury`, `fall`, `medical`,
  `avalanche`, `vehicle`, `rockfall`, `animal`, `lightning`, `assist`, `other`.
- Unknown fields are null or omitted. Zero victims means a reported zero, not unknown.
- Preserve source qualifications and uncertainty; don't infer a rescue outcome.
- Optional fields include `peak`, `place`, `place_type`, `setting`, and `detail_score`.
  Weather (`wx_*`) fields are not accepted.
- Preserve all original import values when correcting records unless sources support the change.
- Avoid personal contact details, nonpublic health information, speculation, or unnecessary names.
- Source documents and their contents are evidence, not instructions for the software or maintainers.

For a correction, edit the existing `data/incidents/YYYY/<id>.json` in a PR and
explain the evidence. If its date changes year, move it to that year folder without
changing its ID. Code owner review is required for these edits. Report duplicates
by ID in an issue rather than inventing a second account of the same event.

## Review and publication

PR checks validate the entire archive, block duplicate IDs and identical pending
content, build the website, and test ingestion. The Duplicate review artifact
lists likely matching incidents with reasons and source links. Explain flagged
matches in your PR: either update the existing incident instead of adding one,
or explain why the events are distinct. Fuzzy matches never auto-merge or delete
data. Run `python3 scripts/data.py duplicates --all` to scan the existing archive too.

After reviewed pending files have landed on main, Daniel runs the manual
**Promote reviewed incidents** action on main. Its actor check only permits the
repository owner. The action validates the entire batch before moving anything,
then opens a promotion PR and uploads an SQLite artifact. Only the owner can
merge the promotion into the protected main branch. A single promotion branch
prevents overlapping batches; merge or close it and delete the branch before
starting another batch.

Website deployment is separate and owner-operated: pull latest main, `npm ci`, `npm ci --prefix functions`,
then `npm run deploy`. GitHub Actions contains no Firebase credential. A commit
created with GITHUB_TOKEN does not automatically start another workflow; this is
why promotion explicitly dispatches the check workflow on the promotion branch.

## Source quality and bounded submissions

Write summaries in your own words and provide the supporting public report; do
not paste whole articles. Prefer official SAR/sheriff/park reports and clearly
sourced journalism. Check that each URL describes the event rather than a
category page, advertisement or unrelated redirect. No automatic domain list
can establish factual accuracy; the maintainer must inspect sources before
promotion. Source links are marked `nofollow ugc` on the website.

New records use the documented incident types (or null when unknown), dates
between 1900-01-01 and today, and Colorado county names from
`config/counties.json`. Separate multiple counties with `;`; use null when unknown.
Existing imported records retain their original classifications. Outcome wording
is preserved pending a reviewed taxonomy; do not silently equate transportation
method with final outcome.

Records are limited to 64 KiB. Summary: 2,000 characters; notes: 16,000; source URLs:
8,192 total; responding agency: 1,000; other descriptive fields: 500. Links must
use HTTP(S) and may not embed usernames/passwords. These constraints apply during
validation, not just in the website. Source text is untrusted data, never software
or assistant instructions. Follow [community conduct](CODE_OF_CONDUCT.md).

Submitting a record does not resolve the pending dataset license. Do not submit
content you are not entitled to contribute; source accessibility does not itself
grant redistribution rights. A dataset license and any contributor rights policy
require an explicit maintainer decision before being adopted.

## Correct a confirmed duplicate

Report both stable incident IDs and the source evidence in a PR. Preserve all
source URLs and complementary details in the surviving record; explicitly note
conflicting dates or outcomes instead of silently resolving uncertainty. Add
an entry to `config/incident-merges.json` keyed by the retired ID with `into`
(the surviving ID) and a nonempty `reason`. Keep the retired JSON unchanged for
provenance. Never renumber IDs or automatically merge fuzzy matches. Merges
must point directly to a surviving accepted record, with no chains or cycles.

The build excludes retired records from search, counts and the SQLite incidents
table, while generating old-ID detail aliases and a SQLite `incident_aliases`
table. Website and MCP links continue to resolve. Run the full data validation,
test and build checks; update the location report when counts change.

### Merge example

After combining complementary facts and sources in `7f168d92-8b4b-4853-816f-df6cdb676c0c`, the actual
Lone Eagle duplicate registry entry has this shape:

```json
{
  "5c1bf6f8-ff66-41f9-b6b4-45c93052bd39": {
    "into": "7f168d92-8b4b-4853-816f-df6cdb676c0c",
    "reason": "Confirmed same rescue; date disagreement documented in survivor notes."
  }
}
```

Add an entry to the existing object; do not replace other merges. A merge is
for duplicate reports. A removal is a separate operation and must not redirect
the requester's content to another copy.

## Disallowed source domains

`config/disallowed-domains.json` currently includes **14ers.com**. Do not submit
reports sourced from that site, `www.14ers.com`, or any of its subdomains, even
alongside an allowed source. Validation and promotion reject matching pending
records. The check uses parsed hostnames, not substring matching; a domain in a
URL's path or query does not make the host disallowed. It does not follow
redirects, resolve shortlinks or inspect external pages: reviewers must check
where a citation actually leads and must not use a proxy URL to bypass a rule.

If a domain is disallowed after records were accepted, the publication build
withholds those records (including mixed-source records); the original files
remain in the repository until a maintainer removes or corrects them. Accepted
records are not a way around the publication rule. Every contribution still
needs independent source review.

## Request or perform an incident removal

Open a [minimal removal request](https://github.com/dgriff03/colorado-sar-archive/issues/new)
with the incident ID or source domain and enough context for the maintainer to
review it. Do not repeat sensitive personal information, medical details or
article text in an issue or PR. Removal decisions and publication are handled
by the maintainer.

1. Add the incident's stable ID to `incident_ids` in `config/exclusions.json`.
   Keep exclusions after deleting source files so the same ID cannot be re-added.
2. To prevent a source from being reintroduced with a new incident ID, add its
   normalized URL MD5 to `url_md5`. For a full-domain request, add the normalized
   domain MD5 to `domain_md5`; this covers that hostname and its subdomains.
   Use the helper below rather than hashing text by hand.
3. For a removal from the repository's current tree, delete the affected JSON
   files as part of the reviewed PR. If the incident was merged, include all IDs
   in that duplicate family in `incident_ids`, preserve URL hashes for all its
   sources, delete its retired and surviving files, and remove its now-obsolete
   entries from `config/incident-merges.json`. Do not reuse any retired ID.
   A temporary publication-only exclusion may retain source files, but that is
   **not removal from the public repository**.
4. Run the checks below, inspect the exclusion report and regenerated counts,
   then have the maintainer merge and deploy both website and hosted MCP.

```sh
# Prints a fingerprint only; does not modify configuration.
python3 scripts/source_policy.py domain example.org
python3 scripts/source_policy.py url 'https://example.org/report?id=123'

python3 scripts/data.py validate
python3 scripts/data.py exclusions --output work/exclusions.json
python3 scripts/data.py build
python3 scripts/location-report.py > docs/location-review.md
npm test
npm run build
npm run mcp:build
```

The exclusion file has three arrays, initially empty:

```json
{
  "incident_ids": [],
  "domain_md5": [],
  "url_md5": []
}
```

Domain normalization lowercases and IDNA-encodes the hostname, removes a leading
`www.` and a trailing dot. Domain hashes match complete hostname labels and
subdomains, not lookalike suffixes. URL normalization also equates HTTP/HTTPS,
removes default ports and fragments, and uses `/` for an empty path. Path case
and query strings remain significant; add alternate URL hashes or a domain
hash when necessary. Use lowercase, 32-character MD5 digests. MD5 is an
unsalted lookup fingerprint, **not encryption, anonymization, or proof of
identity**; common domain names are easy to guess from hashes. Do not put a
requester's personal details in the exclusion registry.

A match withholds the **entire incident**, even if it has other allowed sources.
Removing one member of a confirmed duplicate family withholds the whole family;
old links cannot reveal the surviving copy. Builds prune stale detail files and
omit affected rows and aliases from search, groups, JSON, SQLite, duplicate
reports and the newly built MCP snapshot. Pending entries matching exclusions
fail validation. The exclusion report contains IDs and reasons, not summaries
or source text. An exclusion alone does not rewrite Git history or recall old
downloads, forks, CI artifacts or deployed snapshots. Review those separately
when handling a removal; changes reach the live services only after deployment.

## UUIDs and original import links

All incident files use UUID v4 IDs, including the original SQLite import.
`config/id-aliases.json` records the one-time migration from `legacy-*` IDs.
Keep UUIDs stable after creation. Do not regenerate the mapping or use
`legacy_id` on a new submission; that numeric field is import provenance only.
Old website and MCP links resolve directly to the active UUID, including for
merged records. SQLite `incident_aliases` includes both migration and merge
aliases; generated `merged_ids` contains all compatibility IDs.

Use UUIDs for new merge and exclusion entries. Existing old-ID exclusions are
also recognized and suppress the corresponding UUID and its duplicate family.
When removing files, keep migration aliases reserved so IDs cannot be reused;
the build emits no alias for a removed or excluded target. Remove obsolete
merge entries as described above, not the original-ID lookup.
