import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateResults } from './aggregate.mjs';
import { calibratePersonaWeights } from './calibrate.mjs';
import { judgePersonas, loadEnvFile } from './jev-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const personasFile = process.env.PERSONAS_FILE || path.join(root, 'data/personas.nemotron-korea.json');
const rawPersonas = JSON.parse(await fs.readFile(personasFile, 'utf8'));
const populationTargets = JSON.parse(await fs.readFile(path.join(root, 'data/population-targets.json'), 'utf8'));
const personas = calibratePersonaWeights(rawPersonas, populationTargets);
const policies = JSON.parse(await fs.readFile(path.join(root, 'data/policies.json'), 'utf8'));
const policy = policies[0];

const envFile = process.env.JEV_ENV_FILE || path.join(root, '.env');
await loadEnvFile(envFile);

if (process.argv.includes('--offline')) {
  console.log(JSON.stringify({
    mode: 'offline',
    message: 'Offline mode is a schema smoke test; live opinions require Jev.',
    policy: policy.id,
    persona_count: personas.length
  }, null, 2));
  process.exit(0);
}

const batchSize = Math.max(1, Number(process.env.JEV_BATCH_SIZE || 20));
const batches = [];
for (let index = 0; index < personas.length; index += batchSize) {
  batches.push(await judgePersonas({ policy, personas: personas.slice(index, index + batchSize) }));
}
const answers = Object.assign({}, ...batches.map((batch) => batch.answers || {}));
const aggregate = aggregateResults(personas, answers);
const usage = batches.reduce((total, batch) => ({
  input_tokens: total.input_tokens + (batch.usage?.input_tokens || 0),
  output_tokens: total.output_tokens + (batch.usage?.output_tokens || 0)
}), { input_tokens: 0, output_tokens: 0 });

console.log(JSON.stringify({
  model: batches[0]?.model || null,
  batch_count: batches.length,
  policy: { id: policy.id, title: policy.title },
  simulation: aggregate,
  usage
}, null, 2));
