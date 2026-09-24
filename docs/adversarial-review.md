# Adversarial review disposition

Reviewed against the current canonical files and code, not assumed from the pasted
report. No canonical records were edited or deleted as part of this work.

## Verified and addressed

- Blank/whitespace detail strings now show “Not recorded”; numeric zero is preserved.
- Results show recorded outcome, people involved (not “casualties”), and responding
  agency. Details expose place type and the imported detail score without claiming
  that score has a standardized meaning.
- Notes, source URLs, people counts, setting and place type are included in the
  generated search index. Search covers titles and notes. The full per-incident
  JSON/SQLite already preserved these fields before this change.
- Filters support reported outcome, agency, inclusive date range, month, multiple
  incident types (OR), setting and place type. Other filters intersect. Grouping
  also supports setting/place type. URLs preserve the new filters and history.
- Location suggestions use recorded names; Mt/Mount spelling is normalized for
  matching. No unverified geographic aliases or coordinates are invented.
- Mobile filters are collapsed by default and expand with an accessible control.
  Group controls explicitly say counts reflect source coverage, not danger.
- New records reject unsupported incident types, unknown county names, dates
  before 1900 or after today, credential-bearing URLs and oversized strings/files.
  County names come from the Census source recorded in config/counties.json.
  Legacy categories/counties are preserved rather than silently rewritten.
- The MCP search index/map is initialized once per handler. Protocol server and
  transport objects remain per-request so concurrent requests are isolated.
- Queries are capped at 120 characters; fuzzy matching uses at most 32 characters.
  Longer queries match all literal words. A local pre-change run took ~723 ms for
  a repeated 300-character query over 3,718 records; this was expensive fuzzy work,
  not evidence of regex-based ReDoS.
- Per-instance admission control limits bursts (40 tokens, refill 20/s) and active
  requests (10), with HTTP 429 and Retry-After. Direct Node body reads time out
  after 5 seconds; Firebase's pre-parsed body still has a 32 KiB application cap.
  These controls are best-effort load shedding, not a distributed per-user quota
  or protection against volumetric attacks before requests reach the function.
- Analytics is paused by default. A sanitized manual page-view implementation
  strips queries, hashes, incident IDs/titles and referrers. It cannot be enabled
  until account-side Enhanced Measurement is disabled and verified; setting
  send_page_view:false alone does not disable automatic history events.
- Added issue forms, a community conduct policy, contribution source guidance,
  source-link nofollow/ugc attributes, and factual answers to all FAQ placeholders.

## Corrections to the review

- A PR template and sole-owner CODEOWNERS already existed. GitHub recognizes the
  lowercase pull_request_template.md filename; an uppercase file is not missing.
- Reduced search-index fields were a payload tradeoff, not lost canonical data.
  Full source URLs and notes were already available in incident details.
- There are 73 distinct county values in the current JSON snapshot (including
  missing/compound values), and 81 exact Eagle County records, not the stated
  71 values and 41 Eagle records. Clear Creek has 1,167; Summit 84; blank county 85.
- Forty concurrent requests do not by themselves establish a sustained outage;
  request duration and arrival rate matter. There was nevertheless no admission
  control, and expensive fuzzy searches deserved a bound.
- An absent Origin header is expected for native MCP clients. Origin checking is
  a browser-origin defense, not authentication or a bot filter. Requiring it
  would break the intended public API without stopping an attacker from forging it.
- Sharing one transport/server across concurrent stateless requests is not the
  appropriate optimization. Immutable search data can be shared safely instead.

## Explicitly deferred decisions

- **Dataset licensing/contributor grants:** the maintainer must establish what
  rights exist before adopting a dataset license or CLA/DCO policy. No license
  can grant rights to third-party reporting the project does not possess.
- **Personal-data review:** no automated name/age deletion. The review's “247”
  classification was not independently verified. A reviewed, per-record redaction
  policy must address summaries, notes, exports, search, MCP and Git history; merely
  hiding names in the UI would not remove them from downloadable data.
- **Outcome taxonomy:** source outcomes mix final state and transport method.
  Preserve the raw value; introduce a separately reviewed normalized classification
  if desired. Treating rescued/assisted/airlifted as synonyms would change meaning.
- **Source allowlist:** no mandatory list of approved publishers. It would exclude
  valid regional/new sources and would not verify facts. Public-source review is
  required before promotion; credential URLs and unsafe link schemes are rejected.
- **Promotion workflow:** retain the explicitly requested owner-only two-stage
  flow and full CI. Pending-on-main is intentionally excluded from publication.
  The existing-branch check prevents overlapping promotion batches. Replacing
  these controls needs a separate workflow decision, not a security “fix.”
- **Maps:** provide a labeled place-name map search link. No incident markers or
  coordinates without verified geocoding/provenance. No inferred rescue coordinates.
- **Edge abuse controls:** Cloud Armor or authenticated quotas require deployment
  architecture/account decisions. Firebase App Check cannot simply be required of
  generic Claude/Codex MCP clients. Per-instance caps do not create a billing cap.

## Release notes

All changes must be deployed before they affect the live site. Hosted MCP still
requires Firebase billing and domain setup. To re-enable analytics safely, follow
[analytics operations](analytics.md). Do not claim live collection is sanitized
until the new website and the account settings have both been verified.
