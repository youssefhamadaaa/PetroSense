"""
Anomaly-prediction service.

Loads ml/model.pkl once (lazily, on first use, then cached) and exposes
predict(reading) -> {is_anomaly, probability, top_features, reason}.

`top_features` combines the model's global feature_importances_ with how far
each input deviates from its normal baseline — so it explains *this* reading,
not just the model in general.
"""

import os
import threading

import joblib

from ml.features import (
    ABNORMAL_DIRECTION,
    FEATURES,
    LABELS,
    build_feature_row,
)

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ml",
    "model.pkl",
)

_lock = threading.Lock()
_bundle = None  # cached {model, features, importances, baselines, ...}


def _load():
    """Load the model bundle once (thread-safe)."""
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                if not os.path.exists(MODEL_PATH):
                    raise FileNotFoundError(
                        f"Model not found at {MODEL_PATH}. "
                        f"Train it first: `python -m ml.train`."
                    )
                _bundle = joblib.load(MODEL_PATH)
    return _bundle


def is_ready() -> bool:
    return os.path.exists(MODEL_PATH)


def _deviation(feature: str, value: float, baseline: float) -> float:
    """
    Signed deviation from baseline, oriented so POSITIVE means 'toward the
    abnormal direction' for that feature (flow high-is-good, so low is +).
    """
    if not baseline:
        return 0.0
    raw = (value - baseline) / baseline
    return raw * ABNORMAL_DIRECTION[feature]


def predict(reading: dict) -> dict:
    """
    reading: {flow_rate, pressure, temperature, vibration}
    Returns {is_anomaly, probability, top_features, reason}.
    """
    bundle = _load()
    model = bundle["model"]
    importances = bundle["importances"]
    baselines = bundle["baselines"]

    row = build_feature_row(
        reading["flow_rate"],
        reading["pressure"],
        reading["temperature"],
        reading["vibration"],
    )
    X = [[row[f] for f in FEATURES]]

    proba = float(model.predict_proba(X)[0][1])  # P(anomaly)
    is_anomaly = bool(model.predict(X)[0])

    # Per-feature contribution = global importance × abnormal-direction deviation.
    contributions = []
    for f in FEATURES:
        dev = _deviation(f, row[f], baselines.get(f, 0.0))
        contributions.append(
            {
                "feature": f,
                "label": LABELS[f],
                "importance": round(importances.get(f, 0.0), 4),
                "deviationPct": round(dev * 100, 1),
                "score": round(importances.get(f, 0.0) * max(dev, 0.0), 4),
            }
        )
    contributions.sort(key=lambda c: c["score"], reverse=True)
    top_features = contributions[:3]

    return {
        "is_anomaly": is_anomaly,
        "probability": round(proba, 4),
        "top_features": top_features,
        "reason": _build_reason(is_anomaly, contributions),
    }


# Raw sensors make for the most human-readable reasons (ratios stay in
# top_features but are kept out of the sentence).
_RAW_SENSORS = ("flow_rate", "pressure", "temperature", "vibration")


def _build_reason(is_anomaly: bool, contributions: list) -> str:
    """
    Human-readable reason from the raw sensors driving the result, e.g.
    'Anomaly detected: Vibration and pressure abnormally high'.
    """
    raw = [c for c in contributions if c["feature"] in _RAW_SENSORS]
    # Drivers = raw sensors deviating meaningfully in the abnormal direction.
    drivers = sorted(
        [c for c in raw if c["deviationPct"] > 8],
        key=lambda c: c["score"],
        reverse=True,
    )[:2]

    if not drivers:
        return (
            "All sensors within normal operating range."
            if not is_anomaly
            else "Anomaly detected: subtle multi-sensor pattern."
        )

    def direction(c) -> str:
        return "low" if c["feature"] == "flow_rate" else "high"

    prefix = "Anomaly detected: " if is_anomaly else "Watch: "

    if len(drivers) == 1:
        d = drivers[0]
        body = f"{d['label']} abnormally {direction(d)}"
    else:
        d1, d2 = drivers
        if direction(d1) == direction(d2):
            # Same direction → group: "Vibration and pressure abnormally high"
            body = f"{d1['label']} and {d2['label']} abnormally {direction(d1)}"
        else:
            body = (
                f"{d1['label']} abnormally {direction(d1)}, "
                f"{d2['label']} abnormally {direction(d2)}"
            )

    return prefix + body[0].upper() + body[1:]
