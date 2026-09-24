# Analytics privacy configuration

Google Analytics is **disabled in source by default** after the review found that
automatic history tracking transmitted search URLs. The deployed version may still
use the older behavior until the new website is published.

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
