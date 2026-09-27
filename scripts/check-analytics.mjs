import { readFile } from 'node:fs/promises';
const config = JSON.parse(
  await readFile(new URL('../config/analytics.json', import.meta.url), 'utf8'),
);
const token = process.env.GOOGLE_ANALYTICS_ACCESS_TOKEN;
if (!token) {
  console.error(
    'Set GOOGLE_ANALYTICS_ACCESS_TOKEN to a short-lived OAuth token with analytics.readonly or analytics.edit scope. Never commit this token. See docs/analytics.md.',
  );
  process.exit(1);
}
const name = `properties/${config.propertyId}/dataStreams/${config.streamId}/enhancedMeasurementSettings`;
const response = await fetch(
  `https://analyticsadmin.googleapis.com/v1alpha/${name}`,
  {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  },
);
if (!response.ok) {
  console.error(
    `Analytics settings could not be verified (HTTP ${response.status}). Check account access and OAuth scopes; collection must stay disabled.`,
  );
  process.exit(1);
}
const settings = await response.json();
// The protobuf API may omit false booleans. Verify the resource identity first
// so a malformed/unrelated response can never be mistaken for disabled settings.
if (
  settings.name !== name ||
  ![undefined, false].includes(settings.streamEnabled)
) {
  console.error(
    'Enhanced Measurement is enabled or the settings response is invalid. Disable the master switch in the web stream and retry.',
  );
  process.exit(1);
}
console.log(`Enhanced Measurement is disabled for stream ${config.streamId}.`);
console.log(
  'Before enabling collection, verify the served tag and synthetic network events using docs/analytics.md. This command does not enable tracking or change configuration.',
);
