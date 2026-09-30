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

## Run

Node.js 20+ is required.

```bash
npm run test
npm run personas:nvidia -- --count=12 --offset=100
JEV_ENV_FILE=/Users/jo/.config/jev-bot/.env npm run simulate
```

To run one region, the repository includes a provenance-preserving Gwangju
smoke-test persona:

```bash
PERSONAS_FILE=data/personas.gwangju.json JEV_ENV_FILE=/Users/jo/.config/jev-bot/.env npm run simulate
```

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

## License

MIT
