const ORIENTATIONS = ['progressive', 'center', 'conservative'];

function stableUnit(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function normalize(values) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  if (!total) return Object.fromEntries(ORIENTATIONS.map((key) => [key, 1 / ORIENTATIONS.length]));
  return Object.fromEntries(ORIENTATIONS.map((key) => [key, values[key] / total]));
}

export function deriveOrientationTargets(benchmark) {
  const totals = Object.fromEntries(ORIENTATIONS.map((key) => [key, 0]));
  let totalWeight = 0;

  for (const election of benchmark.elections || []) {
    const weight = Number(election.weight ?? 1);
    const shares = normalize(election.orientation_votes || {});
    for (const key of ORIENTATIONS) totals[key] += shares[key] * weight;
    totalWeight += weight;
  }

  return normalize(Object.fromEntries(
    ORIENTATIONS.map((key) => [key, totalWeight ? totals[key] / totalWeight : 0])
  ));
}

function allocateQuotas(count, targets) {
  const raw = ORIENTATIONS.map((key) => ({
    key,
    floor: Math.floor(targets[key] * count),
    remainder: targets[key] * count - Math.floor(targets[key] * count)
  }));
  let remaining = count - raw.reduce((sum, item) => sum + item.floor, 0);
  raw.sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; index < raw.length && remaining > 0; index += 1, remaining -= 1) {
    raw[index].floor += 1;
  }
  return Object.fromEntries(raw.map((item) => [item.key, item.floor]));
}

function personaPrior(persona, targets, seed) {
  const values = {};
  for (const key of ORIENTATIONS) {
    const jitter = (stableUnit(`${seed}:${persona.id}:${key}`) - 0.5) * 0.12;
    values[key] = Math.max(0.01, targets[key] + jitter);
  }
  return normalize(values);
}

export function calibratePersonaOrientations(personas, benchmark, { seed = 'daejeon-election-v1' } = {}) {
  const targets = deriveOrientationTargets(benchmark);
  const quotas = allocateQuotas(personas.length, targets);
  const enriched = personas.map((persona) => ({
    persona,
    prior: personaPrior(persona, targets, seed)
  }));
  const remaining = new Set(enriched.map((item) => item.persona.id));
  const assigned = new Map();

  for (const orientation of [...ORIENTATIONS].sort((left, right) => quotas[right] - quotas[left])) {
    const candidates = enriched
      .filter((item) => remaining.has(item.persona.id))
      .sort((left, right) => {
        const margin = right.prior[orientation] - left.prior[orientation];
        if (margin !== 0) return margin;
        return stableUnit(`${seed}:${right.persona.id}`) - stableUnit(`${seed}:${left.persona.id}`);
      });
    for (const item of candidates.slice(0, quotas[orientation])) {
      remaining.delete(item.persona.id);
      assigned.set(item.persona.id, orientation);
    }
  }

  return enriched.map(({ persona, prior }) => ({
    ...persona,
    political_profile: {
      latent_orientation: assigned.get(persona.id) || 'center',
      orientation_prior: prior,
      calibration: {
        region: benchmark.region,
        benchmark_as_of: benchmark.as_of,
        target_distribution: targets,
        method: 'deterministic synthetic assignment calibrated to regional election aggregates',
        seed
      }
    }
  }));
}

export function summarizeOrientation(personas) {
  const counts = Object.fromEntries(ORIENTATIONS.map((key) => [key, 0]));
  const weightByOrientation = Object.fromEntries(ORIENTATIONS.map((key) => [key, 0]));
  let totalWeight = 0;

  for (const persona of personas) {
    const orientation = persona.political_profile?.latent_orientation || 'unknown';
    const weight = persona.weight ?? 1;
    if (orientation in counts) {
      counts[orientation] += 1;
      weightByOrientation[orientation] += weight;
      totalWeight += weight;
    }
  }

  return {
    counts,
    weighted_share: Object.fromEntries(
      ORIENTATIONS.map((key) => [key, totalWeight ? weightByOrientation[key] / totalWeight : 0])
    )
  };
}

export const ORIENTATION_CLASSES = [...ORIENTATIONS];
