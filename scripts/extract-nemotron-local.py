#!/usr/bin/env python3
"""Extract a small, provenance-preserving regional sample from local Parquet shards."""

import argparse
import json
from pathlib import Path

import pyarrow.dataset as ds


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default=".cache/nemotron-personas-korea/data")
    parser.add_argument("--province", default="대전")
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--out", default=".cache/personas.daejeon-100.json")
    return parser.parse_args()


def persona_from_row(row, source_file, index):
    return {
        "id": f"nemotron-korea-{row['uuid']}",
        "label": row["persona"],
        "weight": 1,
        "source": {
            "dataset": "nvidia/Nemotron-Personas-Korea",
            "split": "train",
            "source_file": source_file,
            "filtered_sample_index": index,
            "license": "CC-BY-4.0",
            "url": "https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea",
        },
        "profile": {
            "summary": row["persona"],
            "cultural_background": row["cultural_background"],
            "skills_and_expertise": row["skills_and_expertise"],
            "hobbies_and_interests": row["hobbies_and_interests"],
            "career_goals_and_ambitions": row["career_goals_and_ambitions"],
            "demographics": {
                key: row[key]
                for key in (
                    "sex",
                    "age",
                    "marital_status",
                    "military_status",
                    "family_type",
                    "housing_type",
                    "education_level",
                    "occupation",
                    "district",
                    "province",
                    "country",
                )
            },
        },
    }


def main():
    args = parse_args()
    if args.count < 1:
        raise SystemExit("--count must be positive")

    input_dir = Path(args.input_dir)
    files = sorted(input_dir.glob("*.parquet"))
    if not files:
        raise SystemExit(f"No Parquet files found in {input_dir}")

    columns = [
        "uuid",
        "persona",
        "cultural_background",
        "skills_and_expertise",
        "hobbies_and_interests",
        "career_goals_and_ambitions",
        "sex",
        "age",
        "marital_status",
        "military_status",
        "family_type",
        "housing_type",
        "education_level",
        "occupation",
        "district",
        "province",
        "country",
    ]
    dataset = ds.dataset([str(file) for file in files], format="parquet")
    table = dataset.to_table(
        columns=columns,
        filter=ds.field("province") == args.province,
        use_threads=True,
    )
    if table.num_rows < args.count:
        raise SystemExit(
            f"Only found {table.num_rows} {args.province} personas; requested {args.count}"
        )

    rows = table.slice(0, args.count).to_pylist()
    personas = [persona_from_row(row, "local Parquet shards", index) for index, row in enumerate(rows)]
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(personas, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(personas)} {args.province} personas to {output}")


if __name__ == "__main__":
    main()
