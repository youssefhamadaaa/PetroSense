"""
Feature engineering shared by training (ml/train.py) and serving
(core/ml_service.py) so the two never drift.

Raw sensors + two engineered ratios make up the model's feature vector, in a
fixed order. Baselines are the normal operating point (same values the seed and
frontend use), used both to build ratio baselines and to score how far an input
deviates from normal.
"""

# Fixed feature order the model is trained on and expects at predict time.
FEATURES = [
    "flow_rate",
    "pressure",
    "temperature",
    "vibration",
    "pressure_temp_ratio",
    "flow_vibration_ratio",
]

# Normal operating point per raw sensor.
BASELINES = {
    "flow_rate": 1450.0,   # m³/day
    "pressure": 120.0,     # bar
    "temperature": 78.0,   # °C
    "vibration": 3.2,      # mm/s
}

# Which direction is "abnormal" for each feature:
#   +1 -> abnormally HIGH is the problem (pressure, temperature, vibration, …)
#   -1 -> abnormally LOW is the problem (flow_rate)
ABNORMAL_DIRECTION = {
    "flow_rate": -1,
    "pressure": +1,
    "temperature": +1,
    "vibration": +1,
    "pressure_temp_ratio": +1,
    "flow_vibration_ratio": -1,
}

# Human-friendly labels for reasons.
LABELS = {
    "flow_rate": "flow rate",
    "pressure": "pressure",
    "temperature": "temperature",
    "vibration": "vibration",
    "pressure_temp_ratio": "pressure/temp ratio",
    "flow_vibration_ratio": "flow/vibration ratio",
}


def compute_ratios(flow_rate, pressure, temperature, vibration):
    """
    Derive the two engineered ratios from the four raw sensors.

    Plain division so it works element-wise on pandas Series (training) as well
    as on scalars (serving). Scalar divide-by-zero is guarded in
    build_feature_row, which is the only scalar caller.
    """
    pressure_temp_ratio = pressure / temperature
    flow_vibration_ratio = flow_rate / vibration
    return pressure_temp_ratio, flow_vibration_ratio


def build_feature_row(flow_rate, pressure, temperature, vibration) -> dict:
    """Return a dict of all six features (raw + ratios), keyed by FEATURES."""
    # Guard scalar divide-by-zero (physically invalid inputs).
    safe_temp = temperature if temperature else 1e-9
    safe_vib = vibration if vibration else 1e-9
    ptr, fvr = compute_ratios(flow_rate, pressure, safe_temp, safe_vib)
    return {
        "flow_rate": flow_rate,
        "pressure": pressure,
        "temperature": temperature,
        "vibration": vibration,
        "pressure_temp_ratio": ptr,
        "flow_vibration_ratio": fvr,
    }


# Baselines for the engineered ratios, derived from the raw baselines so they
# stay consistent.
def ratio_baselines() -> dict:
    ptr, fvr = compute_ratios(
        BASELINES["flow_rate"],
        BASELINES["pressure"],
        BASELINES["temperature"],
        BASELINES["vibration"],
    )
    return {"pressure_temp_ratio": ptr, "flow_vibration_ratio": fvr}


def all_baselines() -> dict:
    """Baselines for every feature (raw + ratios)."""
    return {**BASELINES, **ratio_baselines()}
