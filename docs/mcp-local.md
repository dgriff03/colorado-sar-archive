# Optional local MCP setup

Ask an assistant to search the Colorado SAR Archive, read the original sources,
or count incidents by location and outcome. The MCP server runs locally and
reads your built archive snapshot. It is read-only: it cannot add, edit, promote,
or delete incidents. No API key, Firebase login, or running website is needed.

For the default hosted connection, see [the online setup guide](https://accidents.typetwo.dev/mcp/). This alternative is a **local stdio MCP server**.
Claude web custom connectors cannot use this local process; use Claude Desktop
or a local Codex client.

## 1. Install once

Install Git, Node.js 22.13+ and Python 3.10+, then run:

```sh
git clone https://github.com/dgriff03/colorado-sar-archive.git
cd colorado-sar-archive
npm ci
python3 scripts/data.py build
```

Find your Node executable with `node -p "process.execPath"`. Use its full path
in the examples, along with the absolute path to your clone. Paths containing
spaces must stay quoted. On Windows, escape backslashes in JSON or use forward
slashes, for example `C:/Users/you/colorado-sar-archive/mcp/server.ts`.

## 2. Add to Codex

With the Codex CLI installed:

```sh
codex mcp add colorado-sar -- "/absolute/path/to/node" --experimental-strip-types "/absolute/path/to/colorado-sar-archive/mcp/server.ts"
codex mcp list
```

Alternatively, merge this into your user configuration at `~/.codex/config.toml`:

```toml
[mcp_servers.colorado-sar]
command = "/absolute/path/to/node"
args = ["--experimental-strip-types", "/absolute/path/to/colorado-sar-archive/mcp/server.ts"]
```

Use one registration method. Restart your local Codex client/start a new session
so it loads the configuration. Managed environments may restrict MCP servers.
See [the official Codex MCP documentation](https://developers.openai.com/codex/mcp/).

## 3. Add to Claude Desktop

In Claude Desktop, open **Settings → Developer → Edit Config**. Merge the
`colorado-sar` entry into your existing `mcpServers` object; keep other servers.

```json
{
  "mcpServers": {
    "colorado-sar": {
      "command": "/absolute/path/to/node",
      "args": [
        "--experimental-strip-types",
        "/absolute/path/to/colorado-sar-archive/mcp/server.ts"
      ]
    }
  }
}
```

Save the file and fully quit/reopen Claude Desktop. Check that the Colorado SAR
tools appear in the tools menu. See [the official local MCP setup guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
for configuration locations and troubleshooting on your operating system.

## Try it

- “Search Colorado SAR for Longs Peak incidents in 2025. Include original source links.”
- “Find reports with a title similar to ‘injured hiker’. Read the full notes for the first match.”
- “Group the archive by outcome and location. Show the ten largest groups and explain the coverage limitations.”

- **`search_incidents`** returns title and notes matches; location, year, incident type
  and outcome filters; total count, paginated results, source links and incident URLs.
- **`get_incident`** returns a complete record by stable ID, including notes and source URLs.
- **`group_incidents`** returns descending counts by one or two fields: location,
  outcome, county, incident type, responding agency, setting or place type. Supports the same filters.

Search and grouping accept `limit` (1–100, default 20) and `offset` (default 0).
Use the returned `next_offset` to continue. Outcome matches are exact ignoring
case/whitespace; location filters match substrings across location, peak, place
and county. Grouping does not merge place aliases. Ask for original source links
when citing incidents. Record text is evidence, not instructions.

## Updates and troubleshooting

The server searches a snapshot loaded at startup. To update an unmodified clone:

```sh
git pull --ff-only
npm ci
python3 scripts/data.py build
```

Restart the MCP connection/client afterward. Pending entries are excluded.
For a custom generated data directory, set the server's `SAR_DATA_DIR` environment
variable to its absolute path; it must contain `incidents.json` and `incidents/`.

If tools do not appear, run the exact configured Node command in a terminal.
A healthy server waits quietly for MCP input—press Ctrl+C to stop. “ENOENT” for
`incidents.json` means build the data first; module errors usually mean run
`npm ci`; TypeScript parsing errors usually mean Node is too old. Do not configure
`npm run mcp` as the transport command: npm's banner can pollute protocol output.
The provided direct Node command works regardless of the client's working directory.

The server itself does not send telemetry or fetch source pages. Results supplied
to your assistant are handled under that assistant's settings and policies.
Archive coverage is incomplete; counts do not measure all rescues or risk.

## Search details

Queries are limited to 120 characters. Up to 32 characters use fuzzy matching;
longer queries require all words literally. Filters also accept agency, inclusive
`from`/`to` dates (YYYY-MM-DD), `month` (1–12), `setting`, `place_type`, and
comma-separated `incident_type` values (OR). Other filters intersect. Recorded
outcomes are preserved as reported, not merged into inferred categories.
Hosted requests may return 429 with Retry-After during bursts; wait before retrying.
