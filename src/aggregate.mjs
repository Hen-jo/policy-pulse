export function aggregateResults(personas, answers) {
  const rows = personas.map((persona) => {
    const answer = answers[persona.id] || {};
    return {
      persona_id: persona.id,
      label: persona.label,
      region: persona.profile?.demographics?.province || null,
      choice: answer.choice || 'unknown',
      confidence: answer.confidence ?? null,
      orientation: persona.political_profile?.latent_orientation || null,
      weight: persona.weight ?? 1
    };
  });

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const likeWeight = rows
    .filter((row) => row.choice === 'like')
    .reduce((sum, row) => sum + row.weight, 0);

  const byRegion = {};
  const byOrientation = {};
  for (const row of rows) {
    const region = row.region || 'unknown';
    byRegion[region] ||= { total_weight: 0, like_weight: 0 };
    byRegion[region].total_weight += row.weight;
    if (row.choice === 'like') byRegion[region].like_weight += row.weight;

    const orientation = row.orientation || 'unknown';
    byOrientation[orientation] ||= { total_weight: 0, like_weight: 0 };
    byOrientation[orientation].total_weight += row.weight;
    if (row.choice === 'like') byOrientation[orientation].like_weight += row.weight;
  }
  for (const value of Object.values(byRegion)) {
    value.support_rate = value.total_weight ? value.like_weight / value.total_weight : 0;
  }
  for (const value of Object.values(byOrientation)) {
    value.support_rate = value.total_weight ? value.like_weight / value.total_weight : 0;
  }

  return {
    support_rate: totalWeight ? likeWeight / totalWeight : 0,
    total_weight: totalWeight,
    rows,
    by_region: byRegion,
    by_orientation: byOrientation
  };
}
