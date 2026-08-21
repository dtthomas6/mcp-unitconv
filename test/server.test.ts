import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleCallTool } from '../src/server.ts';

test('convert tool returns a formatted result for a valid request', async () => {
  const res = await handleCallTool({ params: { name: 'convert', arguments: { value: 1, from: 'km', to: 'm' } } });
  assert.equal(res.isError, undefined);
  assert.equal(res.content[0].text, '1 km = 1000 m');
});

test('convert tool reports dimension mismatch as a tool error, not a throw', async () => {
  const res = await handleCallTool({ params: { name: 'convert', arguments: { value: 1, from: 'km', to: 'kg' } } });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /量纲不匹配/);
});

test('convert tool reports an unknown unit as a tool error', async () => {
  const res = await handleCallTool({ params: { name: 'convert', arguments: { value: 1, from: 'parsec', to: 'm' } } });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /未知单位/);
});

test('convert tool reports a non-finite value as a tool error', async () => {
  const res = await handleCallTool({ params: { name: 'convert', arguments: { value: NaN, from: 'm', to: 'km' } } });
  assert.equal(res.isError, true);
});

test('requesting an unknown tool name throws rather than returning a result', async () => {
  await assert.rejects(
    () => handleCallTool({ params: { name: 'nope', arguments: {} } }),
    /Unknown tool: nope/,
  );
});
