# Analytics privacy configuration

Google Analytics is **disabled in source by default** after the review found that
automatic history tracking transmitted search URLs. The live launch review on September 27, 2026 confirmed collection is paused.

Before enabling:

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

The site is prepared for collection, but the September 27 account-side verification
was blocked by unavailable Analytics authentication. Neither flag was enabled.
