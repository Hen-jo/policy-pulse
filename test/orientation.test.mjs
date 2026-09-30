import test from 'node:test';
import assert from 'node:assert/strict';
import { calibratePersonaOrientations, deriveOrientationTargets } from '../src/orientation.mjs';

const benchmark = {
  region: '대전광역시',
  as_of: 'test',
  elections: [
    {
      weight: 0.5,
      orientation_votes: { progressive: 54, center: 3, conservative: 43 }
    },
    {
      weight: 0.5,
      orientation_votes: { progressive: 52, center: 10, conservative: 38 }
    }
  ]
};

test('derives a normalized regional orientation target', () => {
  const targets = deriveOrientationTargets(benchmark);
  assert.ok(Math.abs(Object.values(targets).reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.ok(targets.progressive > targets.conservative);
});

test('assigns deterministic synthetic orientation quotas', () => {
  const personas = Array.from({ length: 100 }, (_, index) => ({ id: `p-${index}`, label: `P${index}` }));
  const first = calibratePersonaOrientations(personas, benchmark);
  const second = calibratePersonaOrientations(personas, benchmark);
  assert.deepEqual(first, second);

  const counts = first.reduce((result, persona) => {
    const key = persona.political_profile.latent_orientation;
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { progressive: 53, center: 7, conservative: 40 });
});
