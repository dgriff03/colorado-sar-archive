# Analytics privacy configuration

Google Analytics is **enabled** for coarse page views using measurement ID
`G-2L4K7PT38M`. On October 11, 2026, the maintainer confirmed that Enhanced
measurement is off for stream `15837736850`; both source flags were then enabled.
Collection was previously paused because automatic history tracking transmitted
search URLs. Keep Enhanced measurement off when changing account settings.

For a new stream or when re-enabling collection:

1. In GA Admin, open property 555725939, web stream 15837736850.
2. Turn **Enhanced Measurement off entirely**, including history page views,
   site search and outbound clicks. These can otherwise read URLs independently
   of the manual event code. This is an account setting, not just a code flag.
3. Verify the served Google tag reflects the disabled settings.
4. Set both `enabled` and `enhancedMeasurementDisabled` to true in
   `config/analytics.json`, build/deploy, and verify network events contain only
   allowlisted page URLs (`/`, `/faq/`, `/mcp/`), generic titles and empty referrers.
   Do not use a real person's name or other sensitive data to test.

Manual page views count coarse route changes, not search keystrokes, group filters
or individual incident views. No query, hash, record title or record ID is sent by
our manual event builder. DNT/GPC and localhost opt-outs remain in place. This
does not make Google Analytics anonymous: Google's normal processing still applies.
Keep the FAQ accurate if tracking is re-enabled.

Official reference: https://developers.google.com/analytics/devguides/collection/ga4/views

## Launch checklist and verification

Open [Google Analytics](https://analytics.google.com/analytics/web/) as the property
administrator. Select **Colorado SAR Archive → Admin → Data streams → the web
stream with measurement ID G-2L4K7PT38M**. Turn off the **Enhanced measurement**
master switch, then confirm the saved stream settings.

For an API check, provide a short-lived OAuth access token via the environment
variable `GOOGLE_ANALYTICS_ACCESS_TOKEN` and run `npm run analytics:check`.
The token must have `analytics.readonly` or `analytics.edit` scope and access to
this property. A normal Firebase/Cloud CLI token is not sufficient. Do not paste
credentials into issues, commit them, or put them in public environment variables.
The checker is read-only, verifies the configured resource, and fails closed on
missing access, enabled measurement, or an unexpected response. It does not turn
collection on. API reference: [Enhanced Measurement settings](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/EnhancedMeasurementSettings).

After the account setting and served Google tag are verified:

1. Set both flags in `config/analytics.json` to true and build a preview. Use only
   synthetic input such as `launch-check`, never a person's name or medical detail.
2. Inspect browser network requests to Google's `collect` endpoint. On initial
   entry with `?q=launch-check&incident=legacy-000001#launch-check`, verify `dl`
   contains only the canonical origin and `/`, `dt` is `Explore archive`, and
   `dr` is empty/absent. Neither query markers nor incident IDs may appear anywhere
   in the request URL or body.
3. Change filters and open an incident. No additional page view should be sent
   for query-only changes. FAQ and MCP navigation should send their coarse page
   names. Check automatic events as well as the manual `page_view` event.
4. With DNT or GPC enabled, verify the Google tag is not loaded and no collection
   requests are sent. Check mobile once as well.
5. Update the FAQ analytics answer to describe active collection, then deploy.
   For rollback, set `enabled` to false and redeploy Hosting.

The account-side setting was confirmed by the maintainer on October 11, 2026.
This confirmation is distinct from the optional API verification above.

## Hosted MCP tool usage

The Firebase-hosted MCP emits one structured `mcp_tool_usage` event when a known
tool finishes execution. This is independent of the website GA setting.
Local stdio copies do not have a logging sink and emit no usage events.

Fields: `tool`, `timestamp` (UTC), `duration_ms`, `status` (`success`, `no_matches`,
or `error`), and `results_returned`. Search counts returned primary and nearby
records; grouping counts returned groups; a detail lookup counts one incident.
An empty page beyond the last result is a success, not a no-match search. A
missing incident is an error. Returned tool errors and thrown exceptions are
counted without logging their text. Logging failures do not fail tool calls.

Initialization, tools/list, unknown tool names, schema validation failures,
rate-limited requests and other HTTP rejections are not executed tool calls and
are not included. Use infrastructure request logs for HTTP failures. Calls are
not unique users; retries and test calls count separately.

No arguments, query text, incident IDs, result content, exception text, request
headers, client identifiers or IP addresses are added to these custom events.
Google's separate infrastructure logs can still contain request metadata and IP
addresses. Existing Cloud Logging access and retention settings apply.

In Google Cloud Logs Explorer, select project `colorado-sar-archive` and use:

```text
resource.type="cloud_run_revision"
resource.labels.service_name="sarmcp"
jsonPayload.event="mcp_tool_usage"
```

Filter further with `jsonPayload.tool="search_incidents"` or
`jsonPayload.status="error"`. Log-based counters can show calls by tool/status;
a distribution metric on `jsonPayload.duration_ms` can show latency. No custom
metrics are created automatically. Logs are not sent to Google Analytics.
