import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATASET = 'nvidia/Nemotron-Personas-Korea';
const API = 'https://datasets-server.huggingface.co/rows';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function option(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const count = Math.max(1, Math.min(100, Number(option('count', '12'))));
const offset = Math.max(0, Number(option('offset', '0')));
const output = option('out', path.join(root, 'data/personas.nemotron-korea.json'));
const province = option('province', '').trim();
const provinceAliases = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  충청북도: '충청북',
  충청남도: '충청남',
  전북특별자치도: '전북',
  전라남도: '전라남',
  경상북도: '경상북',
  경상남도: '경상남',
  제주특별자치도: '제주'
};
const provinceFilter = provinceAliases[province] || province;

function normalize(value) {
  return String(value || '').replaceAll(' ', '').toLowerCase();
}

async function fetchRows(start, length) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    dataset: DATASET,
    config: 'default',
    split: 'train',
    offset: String(start),
    length: String(length)
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Hugging Face dataset API ${response.status}`);
  return response.json();
}

const matched = [];
const batchSize = province ? 100 : count;
for (let cursor = offset; matched.length < count && cursor < offset + 5000; cursor += batchSize) {
  const payload = await fetchRows(cursor, batchSize);
  for (const item of payload.rows) {
    if (!province || normalize(item.row.province).includes(normalize(provinceFilter))) matched.push(item);
    if (matched.length === count) break;
  }
}

if (matched.length < count) {
  throw new Error(`Only found ${matched.length}/${count} personas for province=${province || '(any)'}`);
}

const personas = matched.map(({ row_idx: rowIndex, row }) => ({
  id: `nemotron-korea-${row.uuid}`,
  label: row.persona,
  weight: 1,
  source: {
    dataset: DATASET,
    split: 'train',
    row_index: rowIndex,
    license: 'CC-BY-4.0',
    url: `https://huggingface.co/datasets/${DATASET}`
  },
  profile: {
    summary: row.persona,
    cultural_background: row.cultural_background,
    skills_and_expertise: row.skills_and_expertise,
    hobbies_and_interests: row.hobbies_and_interests,
    career_goals_and_ambitions: row.career_goals_and_ambitions,
    demographics: {
      sex: row.sex,
      age: row.age,
      marital_status: row.marital_status,
      family_type: row.family_type,
      housing_type: row.housing_type,
      education_level: row.education_level,
      occupation: row.occupation,
      district: row.district,
      province: row.province,
    country: row.country
    }
  }
}));

await fs.writeFile(output, `${JSON.stringify(personas, null, 2)}\n`);
console.log(`Wrote ${personas.length} NVIDIA Nemotron-Personas-Korea personas to ${output}`);
