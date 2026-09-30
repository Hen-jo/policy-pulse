# policy-pulse

`policy-pulse` is an open-source, reproducible policy-reaction simulator.
It uses fictional voter personas as inputs, Jev for structured `like` / `dislike`
judgments, and a transparent weighted aggregation step for the result.

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

The persona schema is intentionally provider-neutral. A future NVIDIA Persona
adapter can generate or enrich the JSON without changing the simulator or Jev
client.

## Run

Node.js 20+ is required.

```bash
npm run test
JEV_ENV_FILE=/Users/jo/.config/jev-bot/.env npm run simulate
```

The API key is read locally from `TYPESAFE_API_KEY`; it is never part of the
repository. To check the file and data schemas without calling Jev:

```bash
npm run simulate:offline
```

## Roadmap

- NVIDIA Persona adapter with explicit provenance and scenario seeds
- group-level breakdowns by age, region, occupation, and issue concerns
- scenario comparison and support-rate charts
- uncertainty, abstention, and opinion-decay models
- saved experiment manifests for reproducible runs

## License

MIT
