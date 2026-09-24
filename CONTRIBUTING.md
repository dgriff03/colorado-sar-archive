# Contributing incidents

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

Website deployment is separate and owner-operated: pull latest main, `npm ci`,
then `npm run deploy`. GitHub Actions contains no Firebase credential. A commit
created with GITHUB_TOKEN does not automatically start another workflow; this is
why promotion explicitly dispatches the check workflow on the promotion branch.
