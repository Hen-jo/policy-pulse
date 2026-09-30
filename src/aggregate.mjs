export function aggregateResults(personas, answers) {
  const rows = personas.map((persona) => {
    const answer = answers[persona.id] || {};
    return {
      persona_id: persona.id,
      label: persona.label,
      choice: answer.choice || 'unknown',
      confidence: answer.confidence ?? null,
      weight: persona.weight ?? 1
    };
  });

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const likeWeight = rows
    .filter((row) => row.choice === 'like')
    .reduce((sum, row) => sum + row.weight, 0);

  return {
    support_rate: totalWeight ? likeWeight / totalWeight : 0,
    total_weight: totalWeight,
    rows
  };
}
