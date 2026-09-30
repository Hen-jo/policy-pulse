import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateResults } from './aggregate.mjs';
import { judgePersonas, loadEnvFile } from './jev-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const personas = JSON.parse(await fs.readFile(path.join(root, 'data/personas.json'), 'utf8'));
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

const result = await judgePersonas({ policy, personas });
const aggregate = aggregateResults(personas, result.answers || {});

console.log(JSON.stringify({
  model: result.model,
  policy: { id: policy.id, title: policy.title },
  simulation: aggregate,
  usage: result.usage || null
}, null, 2));
