import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateResults } from '../src/aggregate.mjs';

test('aggregates weighted like/dislike choices', () => {
  const personas = [
    { id: 'a', label: 'A', weight: 2 },
    { id: 'b', label: 'B', weight: 1 }
  ];
  const result = aggregateResults(personas, {
    a: { choice: 'like', confidence: 0.9 },
    b: { choice: 'dislike', confidence: 0.8 }
  });

  assert.equal(result.support_rate, 2 / 3);
  assert.equal(result.rows.length, 2);
});
