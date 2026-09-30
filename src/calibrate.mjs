function normalizeRegion(value) {
  return String(value || '').replaceAll(' ', '').toLowerCase();
}

export function calibratePersonaWeights(personas, populationTargets) {
  const counts = new Map();
  for (const persona of personas) {
    const region = persona.profile?.demographics?.province;
    const key = normalizeRegion(region);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const targetEntries = Object.entries(populationTargets.regions || {});
  const targets = new Map(targetEntries.map(([region, population]) => [normalizeRegion(region), population]));

  return personas.map((persona) => {
    const region = persona.profile?.demographics?.province;
    const key = normalizeRegion(region);
    const population = targets.get(key);
    const sampleCount = counts.get(key) || 1;
    return {
      ...persona,
      weight: population ? population / sampleCount : (persona.weight ?? 1),
      calibration: population
        ? { region_population: population, region_sample_count: sampleCount }
        : { status: 'no_target_for_region' }
    };
  });
}
