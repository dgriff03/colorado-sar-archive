import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolObserver, type ToolUsage } from '../mcp/usage.ts';

test('usage reports bounded metadata without response content, including errors', async () => {
  const events: ToolUsage[] = [];
  const observe = createToolObserver(e => events.push(e));
  const secret = 'PRIVATE-QUERY-AND-INCIDENT';
  const response = { content: [{type: 'text' as const, text: secret}], structuredContent: {
    total: 1, incidents: [{id: secret, summary: secret}], nearby: [{id: secret}], nearby_total: 1,
  }};
  assert.equal(await observe('search_incidents', async () => response), response);
  await observe('search_incidents', async () => ({content: [], structuredContent: {total: 0, incidents: []}}));
  await observe('search_incidents', async () => ({content: [], structuredContent: {total: 5, incidents: []}}));
  await observe('group_incidents', async () => ({content: [], structuredContent: {total_groups: 2, groups: [{name: secret}, {name: secret}]}}));
  await observe('group_incidents', async () => ({content: [], structuredContent: {total_groups: 0, groups: []}}));
  await observe('get_incident', async () => ({content: [], structuredContent: {incident: {id: secret}}}));
  await observe('get_incident', async () => ({content: [{type: 'text', text: secret}], isError: true}));
  await assert.rejects(observe('get_incident', async () => {throw new Error(secret);}), new RegExp(secret));
  assert.deepEqual(events.map(e => [e.status, e.results_returned]), [
    ['success', 2], ['no_matches', 0], ['success', 0], ['success', 2],
    ['no_matches', 0], ['success', 1], ['error', 0], ['error', 0],
  ]);
  for (const event of events) {
    assert.deepEqual(Object.keys(event).sort(), ['duration_ms','event','results_returned','status','timestamp','tool']);
    assert.ok(event.duration_ms >= 0 && Number.isFinite(event.duration_ms));
    assert.ok(Number.isFinite(Date.parse(event.timestamp)));
  }
  assert.ok(!JSON.stringify(events).includes(secret));
});

test('disabled or failed telemetry preserves responses and original failures', async () => {
  const response = {content: []};
  assert.equal(await createToolObserver()('get_incident', async () => response), response);
  const observe = createToolObserver(() => {throw new Error('logger failed');});
  assert.equal(await observe('get_incident', async () => response), response);
  await assert.rejects(observe('get_incident', async () => {throw new Error('original failure');}), /original failure/);
});
