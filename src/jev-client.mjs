import fs from 'node:fs/promises';

const DEFAULT_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

export async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export async function judgePersonas({ policy, personas, model = 'jev-1.13.0' }) {
  const apiKey = process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    throw new Error('TYPESAFE_API_KEY is missing. Set JEV_ENV_FILE or export the key.');
  }

  const questions = Object.fromEntries(personas.map((persona) => [
    persona.id,
    {
      type: 'choice',
      instructions: [
        `You are the fictional voter persona "${persona.label}".`,
        'Would this persona like or dislike the announced policy?',
        'The political profile in the supplied state is a synthetic regional prior, not a fixed party identity. Use it as one factor, then evaluate the policy benefits, costs, and fit with this persona.',
        'Use only the defined criteria. Do not invent a third option.'
      ].join(' '),
      criteria: {
        like: 'The policy is likely to feel beneficial overall to this persona given their values and concerns.',
        dislike: 'The policy is likely to feel harmful, costly, or poorly aligned overall to this persona.'
      }
    }
  ]));

  const response = await fetch(process.env.JEV_ENDPOINT || DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      state: { policy, personas: personas.map(compactPersona) },
      questions
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Jev API ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function clip(value, length = 360) {
  const text = String(value || '');
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function compactPersona(persona) {
  const profile = persona.profile || {};
  const demographics = profile.demographics || {};
  return {
    id: persona.id,
    label: persona.label,
    profile: {
      summary: clip(profile.summary),
      hobbies_and_interests: clip(profile.hobbies_and_interests),
      career_goals_and_ambitions: clip(profile.career_goals_and_ambitions),
      demographics: {
        age: demographics.age,
        sex: demographics.sex,
        marital_status: demographics.marital_status,
        family_type: demographics.family_type,
        housing_type: demographics.housing_type,
        education_level: demographics.education_level,
        occupation: demographics.occupation,
        district: demographics.district,
        province: demographics.province
      }
    },
    political_profile: persona.political_profile
  };
}
