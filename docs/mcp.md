# Connect Claude or Codex

Search Colorado SAR incidents directly from your assistant. The hosted MCP offers
title and notes search, location filters, full records with source links, and grouped
counts. No clone, local installation, API key, or archive account is required.

**Server URL — Streamable HTTP:**

```text
https://rescue.typetwo.dev/api/mcp
```

The server is public and read-only. It cannot add, edit, promote, or delete
incidents. This `/mcp/` page is the setup guide; use `/api/mcp` for the connection.

## Add to Codex

Run:

```sh
codex mcp add colorado-sar --url https://rescue.typetwo.dev/api/mcp
codex mcp list
```

If you installed the earlier local version, remove it first with
`codex mcp remove colorado-sar`, then run the command above.
Alternatively, replace its section in `~/.codex/config.toml` with:

```toml
[mcp_servers.colorado-sar]
url = "https://rescue.typetwo.dev/api/mcp"
```

Use one registration method. Start a new session or restart your client to load
the change. No bearer token or OAuth login is needed. Managed environments can
restrict which servers are allowed. See the [official Codex MCP documentation](https://developers.openai.com/codex/mcp/).

## Add to Claude

1. Open **Customize → Connectors** (or **Settings → Connectors**, depending on your client).
2. Choose **Add custom connector**, and name it **Colorado SAR Archive**.
3. Paste `https://rescue.typetwo.dev/api/mcp` as the server URL.
4. Leave OAuth client ID and secret empty, then add/connect it.
5. Enable Colorado SAR Archive from the conversation's **+ → Connectors** menu.

Use the remote connector flow in Claude web or Desktop, rather than editing
`claude_desktop_config.json`. If you previously added the local version, remove
its `colorado-sar` entry from that file and restart Desktop to avoid duplicate
tools. Keep any unrelated server entries.

Team/Enterprise organizations may require an owner to add the connector first.
Menu names and availability depend on your account. See [Claude's remote MCP
instructions](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

## Try it

- “Search Colorado SAR for Longs Peak incidents in 2025. Include original source links.”
- “Find reports similar to ‘injured hiker’ and read the full notes for the first match.”
- “Group the archive by outcome and location. Show the ten largest groups and explain the coverage limitations.”

## Available tools

- **`search_incidents`**: title and notes search (`query`), location substring,
  year, incident type, and exact outcome filters. Returns total, stable IDs,
  source URLs and shareable incident links.
- **`get_incident`**: full record and notes for an ID returned by search.
- **`group_incidents`**: descending counts by one or two fields: location,
  outcome, county, incident type, or responding agency. Accepts the same filters.

Search and grouping accept `limit` (1–100; default 20) and `offset` (default 0).
Use `next_offset` to continue. Case/whitespace is normalized for groups and outcome
filters. Location groups consolidate reviewed, county-scoped aliases and nearby
features into browsing areas; original location text remains in each record. These are counts of archive records,
not all Colorado rescues or geographic risk. Always preserve source uncertainty.

## Data, privacy and troubleshooting

The hosted server uses the accepted archive bundled with its latest deployment;
pending submissions are excluded. Maintainers update the website and server
together. No local database refresh is needed.

Queries are sent to the public server and results to your assistant. Hosting
infrastructure may retain request metadata; the MCP application does not log
query bodies or use Google Analytics. Do not submit private information.

Opening the endpoint in a browser can return **405 Method Not Allowed**. That is
expected: MCP clients send protocol requests using POST. Use the guide URL
`https://rescue.typetwo.dev/mcp/` for a human-readable page. If a client
cannot connect, check the exact URL, remove an old local configuration, and retry.
The service can take longer after inactivity or return errors under heavy load.

For offline use or a private copy, the [optional local setup guide](https://github.com/dgriff03/colorado-sar-archive/blob/main/docs/mcp-local.md)
remains available. Hosting/deployment details are in the [repository](https://github.com/dgriff03/colorado-sar-archive).

## Search details

Queries are limited to 120 characters. Up to 32 characters use fuzzy matching;
longer queries require all words literally. Filters also accept agency, inclusive
`from`/`to` dates (YYYY-MM-DD), `month` (1–12), `setting`, `place_type`, and
comma-separated `incident_type` values (OR). Other filters intersect. Recorded
outcomes are preserved as reported, not merged into inferred categories.
Hosted requests may return 429 with Retry-After during bursts; wait before retrying.
