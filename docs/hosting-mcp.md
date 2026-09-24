# Hosted MCP operations

The MCP runs as the public, read-only `sarMcp` second-generation Cloud Function
in `us-central1`. Firebase Hosting rewrites `/api/mcp` and `/api/mcp/**` to it.
The human-readable guide stays at `/mcp/`.

## Deploy

Enable the Firebase **Blaze** plan before the first function deployment. Cloud
Functions requires a billing account; the static website alone does not.
Install the Firebase CLI and authenticate as the project maintainer, then run:

```sh
npm ci
npm ci --prefix functions
npm run data:validate
npm test
npm run typecheck
npm run deploy
```

`npm run deploy` builds the website, then deploys both the `sar-mcp` functions
codebase and Hosting. Firebase's predeploy hook runs `npm run mcp:build`, which
builds accepted data and bundles the MCP code and all full incident records under
`functions/lib/`. This generated directory is ignored by Git. Both deployments
therefore use the same canonical accepted files. Pending entries never enter
this bundle. Do not deploy a changed dataset to Hosting alone if MCP must stay
in sync. For a fork, pass `--project YOUR_PROJECT_ID` explicitly to Firebase.

The server uses stateless Streamable HTTP with JSON responses. Each request has
its own MCP server/transport, so instances need no sticky sessions or persistent
storage. GET returns 405 because no server-to-client SSE stream is offered.
POST is the protocol endpoint; it is not a REST search URL. No credentials are
needed because the dataset is already public and no write tools are registered.

## Scaling, requests and data

Runtime configuration in `functions/index.ts` sets zero minimum instances,
two maximum instances, concurrency 20, 256 MiB memory and a 30-second timeout.
These settings limit capacity; **they are not a spending cap**. Billing can
include build/artifact storage, networking and requests. Configure budget alerts
in your Google Cloud billing account as appropriate. Never commit credentials.

Request bodies are limited to 32 KiB; search/group results to 100 per page.
Unknown Origin headers are rejected; server-to-server clients without Origin
are supported. Allowed browser origins are in `mcp/http.ts`; add your custom
domain there before using a browser client on that domain. Responses use
`Cache-Control: no-store`. Application code does not log query bodies.

The bundled records are held in memory; redeploy to update them. Tools share
`mcp/archive.ts` and the existing search/grouping code with the local server.
`tests/mcp-http.test.ts` exercises real HTTP initialization, discovery, concurrent
tool calls, full details, invalid methods/origins/JSON and oversized requests.
`tests/mcp.test.ts` continues to verify local stdio compatibility.

After deployment, verify with an MCP client using:

```sh
codex mcp add colorado-sar --url https://accidents.typetwo.dev/api/mcp
```

Then ask it to list tools and search for Longs Peak. A browser GET returning 405
alone is not a complete health check; protocol initialization and tool calls
must succeed. Check Cloud Functions logs for failures without adding query-body
logging. Firebase deployments are not atomic across Hosting and Functions, so
confirm both releases succeeded before announcing an update.

References: [Firebase Hosting with Cloud Functions](https://firebase.google.com/docs/hosting/functions),
[MCP Streamable HTTP SDK](https://ts.sdk.modelcontextprotocol.io/server),
[Firebase runtime scaling](https://firebase.google.com/docs/functions/manage-functions).

## Application admission control

The handler shares its immutable search index across requests, while MCP server
and transport instances remain isolated. Per instance, a 40-token bucket refills
at 20 requests/second and at most 10 requests enter the handler concurrently.
HTTP 429 responses include Retry-After. These are best-effort limits, reset on cold
starts, and are not a global/IP quota, billing cap, or edge DDoS defense.
