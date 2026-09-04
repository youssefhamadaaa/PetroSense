import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import Alert, SensorReading, Well

# ---------------------------------------------------------------------------
# Seed 5 wells (realistic Egyptian fields) with ~200 readings each — mostly
# normal, a few anomalies (flow DOWN, pressure/temp/vibration UP) — plus the
# explainable alerts those anomalies produce. Idempotent: re-running replaces
# the seeded wells' readings/alerts rather than duplicating them.
# ---------------------------------------------------------------------------

# Normal operating point per sensor (matches the frontend baselines).
BASELINE = {
    "pressure": 120.0,     # bar
    "temperature": 78.0,   # °C
    "vibration": 3.2,      # mm/s
    "flow_rate": 1450.0,   # m³/day
}

# name, location, status. Status drives how often anomalies appear.
WELLS = [
    ("Well_001", "El Morgan Field · Gulf of Suez", "normal"),
    ("Well_002", "Belayim Marine · Gulf of Suez", "warning"),
    ("Well_003", "Badr El-Din (BED-3) · Western Desert", "critical"),
    ("Well_004", "Zohr · Mediterranean Offshore", "normal"),
    ("Well_005", "October Field · Gulf of Suez", "normal"),
]

READINGS_PER_WELL = 200
STEP = timedelta(minutes=5)  # one reading every 5 minutes

# How strongly readings drift from baseline, and how likely an anomaly is.
STATUS_DRIFT = {"normal": 0.12, "warning": 0.5, "critical": 1.0}
STATUS_ANOMALY_P = {"normal": 0.02, "warning": 0.08, "critical": 0.18}


def _round(value: float, dp: int) -> float:
    return round(value, dp)


def _make_reading(well: Well, ts, drift: float, anomaly_p: float):
    """Build (unsaved) a plausible reading; anomalies push flow down, rest up."""
    pressure = BASELINE["pressure"] + random.uniform(-3, 3)
    temperature = BASELINE["temperature"] + random.uniform(-1.5, 1.5)
    vibration = BASELINE["vibration"] + random.uniform(-0.4, 0.4)
    flow_rate = BASELINE["flow_rate"] + random.uniform(-40, 40)

    is_anomaly = random.random() < anomaly_p
    if is_anomaly:
        pressure += random.uniform(15, 35) * drift
        temperature += random.uniform(8, 18) * drift
        vibration += random.uniform(2.5, 5.0) * drift
        flow_rate -= random.uniform(200, 500) * drift

    return SensorReading(
        well=well,
        timestamp=ts,
        pressure=_round(pressure, 1),
        temperature=_round(temperature, 1),
        vibration=_round(vibration, 2),
        flow_rate=_round(max(flow_rate, 0.0), 0),
        is_anomaly=is_anomaly,
    )


# Sensor metadata for building explainable alert reasons.
SENSOR_META = {
    "pressure": ("Pressure", "bar"),
    "temperature": ("Temperature", "°C"),
    "vibration": ("Vibration", "mm/s"),
    "flow_rate": ("Flow rate", "m³/day"),
}


def _explain(reading: SensorReading):
    """Pick the most-deviating sensor and craft a human-readable reason."""
    best_key, best_dev = "vibration", 0.0
    for key in SENSOR_META:
        base = BASELINE[key]
        dev = abs((getattr(reading, key) - base) / base)
        if dev > best_dev:
            best_dev, best_key = dev, key

    label, unit = SENSOR_META[best_key]
    value = getattr(reading, best_key)
    pct = round((value - BASELINE[best_key]) / BASELINE[best_key] * 100)
    direction = "above" if pct >= 0 else "below"
    severity = "critical" if abs(pct) > 45 else "warning" if abs(pct) > 20 else "normal"
    reason = f"{label} {value} {unit} — {abs(pct)}% {direction} normal baseline"
    return severity, reason


class Command(BaseCommand):
    help = "Seed 5 wells with ~200 readings each (mostly normal, a few anomalies) + alerts. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="RNG seed for reproducible data (default 42).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(options["seed"])
        now = timezone.now()

        total_readings = 0
        total_alerts = 0

        for name, location, status in WELLS:
            well, _ = Well.objects.update_or_create(
                name=name,
                defaults={"location": location, "status": status},
            )

            # Idempotent: wipe this well's existing readings/alerts, then rebuild.
            well.alerts.all().delete()
            well.readings.all().delete()

            drift = STATUS_DRIFT[status]
            anomaly_p = STATUS_ANOMALY_P[status]

            readings = []
            for i in range(READINGS_PER_WELL):
                ts = now - STEP * (READINGS_PER_WELL - 1 - i)
                readings.append(_make_reading(well, ts, drift, anomaly_p))

            SensorReading.objects.bulk_create(readings)
            total_readings += len(readings)

            # Create explainable alerts for the most recent anomalies.
            anomalies = [r for r in readings if r.is_anomaly][-6:]
            alerts = []
            for r in anomalies:
                severity, reason = _explain(r)
                alerts.append(
                    Alert(
                        well=well,
                        reading=r,
                        severity=severity,
                        reason=reason,
                        acknowledged=False,
                    )
                )
            Alert.objects.bulk_create(alerts)
            total_alerts += len(alerts)

            self.stdout.write(
                f"  {name}: {len(readings)} readings, "
                f"{len(anomalies)} anomalies → {len(alerts)} alerts ({status})"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Well.objects.count()} wells, "
                f"{total_readings} readings, {total_alerts} alerts."
            )
        )
