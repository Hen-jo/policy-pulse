# policy-pulse

`policy-pulse` is an open-source, reproducible policy-reaction simulator.
It uses NVIDIA's synthetic `Nemotron-Personas-Korea` dataset as the default
persona source, Jev for structured `like` / `dislike` judgments, and a
transparent weighted aggregation step for the result.

> This is an educational simulation, not an election forecast, poll, or tool for
> targeting real voters. Do not use real personal data.

## Current MVP

```text
persona JSON + policy JSON
        ↓
   Jev Choice API
        ↓
like/dislike per fictional persona
        ↓
weighted support rate
```

The NVIDIA adapter fetches only the requested sample through the Hugging Face
dataset server; it does not download the full dataset. The transformed local
JSON includes row-level provenance and the CC-BY-4.0 attribution target.

Before aggregation, persona weights are calibrated against a checked-in
population snapshot from the Ministry of the Interior and Safety. This keeps a
small experiment sample from accidentally treating each region as equally
large. The snapshot is versioned by `as_of`; update it when running a new
official release.

The Daejeon demo also adds a synthetic political-profile layer. Its
`progressive` / `center` / `conservative` prior is calibrated from the Daejeon
results in the 22nd National Assembly district and proportional ballots. The
profile is not a claim about a real person or a party membership. It is a
deterministic, reproducible prior that Jev can weigh alongside the persona's
demographics, interests, policy costs, and benefits.

## Run

Node.js 20+ is required.

To preview the visible policy workspace locally:

```bash
npm run dashboard
# open http://localhost:4173
```

The dashboard is an interactive browser preview: choose a region and type a
policy sentence to see the current baseline, proposed support rate, and
orientation breakdown update immediately. It is intentionally labeled as a
preview until a live Jev run replaces the deterministic browser estimate with
a model response. The workspace presents a real Leaflet/OpenStreetMap map on
the left and YES/NO reaction counts plus orientation breakdown on the right.

```bash
npm run test
npm run personas:nvidia -- --count=12 --offset=100
JEV_ENV_FILE=/Users/jo/.config/jev-bot/.env npm run simulate
```

To run one region, use the local Parquet shards and extract a reproducible
regional sample. For the current demo we use Daejeon:

```bash
python scripts/extract-nemotron-local.py --province=대전 --count=100 --out=.cache/personas.daejeon-100.json
PERSONAS_FILE=.cache/personas.daejeon-100.json JEV_BATCH_SIZE=20 JEV_ENV_FILE=/Users/jo/.config/jev-bot/.env npm run simulate
```

The live result includes `simulation.by_orientation` so a policy can be
compared across the calibrated synthetic groups instead of collapsing
everything into one headline percentage.

For a larger regional sample, use the adapter when the Hugging Face dataset
server is available:

```bash
npm run personas:nvidia -- --province=서울특별시 --count=12 --out=data/personas.seoul.json
```

The API key is read locally from `TYPESAFE_API_KEY`; it is never part of the
repository. To check the file and data schemas without calling Jev:

```bash
npm run simulate:offline
```

The default persona file is `data/personas.nemotron-korea.json`. Use
`PERSONAS_FILE=/path/to/personas.json` to run a different compatible sample.

## Roadmap

- NVIDIA Persona adapter with explicit provenance and scenario seeds
- group-level breakdowns by age, region, occupation, and issue concerns
- scenario comparison and support-rate charts
- uncertainty, abstention, and opinion-decay models
- saved experiment manifests for reproducible runs

## Data attribution

Persona records are derived from [NVIDIA Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea), licensed CC-BY-4.0.
The simulator stores dataset, split, row index, and source URL for each record.

Regional calibration uses the [Ministry of the Interior and Safety resident
registration population statistics](https://jumin.mois.go.kr/agePpltStus.do).
The checked-in snapshot is a simulation input, not an election forecast.

Political-profile calibration uses the [National Election Commission's 22nd
National Assembly election dataset](https://www.data.go.kr/data/15025527/fileData.do)
and its [district/proportional party vote release](https://nec.go.kr/site/nec/ex/bbs/View.do?bcIdx=265654&cbIdx=1084).
The party-to-orientation grouping is an explicit modeling choice in
`data/election-benchmarks.daejeon.json`, not an official classification.

## License

MIT
