"""
Generate a labelled oil-well CSV for training the anomaly model.

Columns: flow_rate, pressure, temperature, vibration, is_anomaly
Anomalies follow the physical pattern the whole product assumes:
  flow DOWN, pressure / temperature / vibration UP.

Run:  python -m ml.generate_dataset   (from the backend/ directory)
Writes ml/oil_well_data.csv (reproducible via the fixed seed).
"""

import csv
import os
import random

from ml.features import BASELINES

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "oil_well_data.csv")

N_ROWS = 3000
ANOMALY_RATE = 0.15  # ~15% anomalies (imbalanced, hence class_weight balanced)
SEED = 42


def _normal_reading(rng):
    return {
        "flow_rate": rng.gauss(BASELINES["flow_rate"], 45),
        "pressure": rng.gauss(BASELINES["pressure"], 3),
        "temperature": rng.gauss(BASELINES["temperature"], 1.5),
        "vibration": rng.gauss(BASELINES["vibration"], 0.4),
    }


def _anomalous_reading(rng):
    # flow down; pressure / temperature / vibration up. `strength` in [0,1]
    # scales the deviation so many anomalies are mild/borderline (overlapping
    # normal readings) and only some are severe — realistic, not separable.
    s = rng.random()
    return {
        "flow_rate": BASELINES["flow_rate"] - (40 + s * 500),
        "pressure": BASELINES["pressure"] + (3 + s * 35),
        "temperature": BASELINES["temperature"] + (2 + s * 18),
        "vibration": BASELINES["vibration"] + (0.6 + s * 5.0),
    }


def generate(path: str = CSV_PATH, n: int = N_ROWS, seed: int = SEED) -> str:
    rng = random.Random(seed)
    rows = []
    for _ in range(n):
        is_anomaly = rng.random() < ANOMALY_RATE
        r = _anomalous_reading(rng) if is_anomaly else _normal_reading(rng)
        # Sensor noise so normal and mild-anomaly readings overlap.
        for k in ("flow_rate", "pressure", "temperature", "vibration"):
            r[k] += rng.gauss(0, {"flow_rate": 30, "pressure": 2.5,
                                  "temperature": 1.3, "vibration": 0.35}[k])
        rows.append(
            {
                "flow_rate": round(max(r["flow_rate"], 0.0), 1),
                "pressure": round(r["pressure"], 1),
                "temperature": round(r["temperature"], 1),
                "vibration": round(max(r["vibration"], 0.0), 2),
                "is_anomaly": int(is_anomaly),
            }
        )

    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["flow_rate", "pressure", "temperature", "vibration", "is_anomaly"],
        )
        writer.writeheader()
        writer.writerows(rows)

    anomalies = sum(row["is_anomaly"] for row in rows)
    print(f"Wrote {len(rows)} rows to {path} ({anomalies} anomalies).")
    return path


if __name__ == "__main__":
    generate()
