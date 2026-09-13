import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the checked-in model catalog has the fields used by the UI', async () => {
  const raw = await readFile(new URL('../public/models.json', import.meta.url), 'utf8');
  const models = JSON.parse(raw);

  assert.ok(Array.isArray(models));
  assert.ok(models.length > 0);

  const ids = new Set();
  for (const model of models) {
    assert.equal(typeof model.id, 'string');
    assert.ok(model.id.length > 0);
    assert.equal(typeof model.model_name, 'string');
    assert.ok(Array.isArray(model.capabilities));
    assert.equal(ids.has(model.id), false, `duplicate model id: ${model.id}`);
    ids.add(model.id);
  }
});
