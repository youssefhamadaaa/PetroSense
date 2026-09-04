"""
Train the PetroSense anomaly-detection model.

  - Load the labelled oil-well CSV with pandas (generating it if missing).
  - Engineer the two ratio features.
  - Stratified train/test split.
  - RandomForestClassifier(class_weight="balanced").
  - Print accuracy / precision / recall / F1 + feature_importances_.
  - Save the model (with metadata) to ml/model.pkl via joblib.

Run:  python -m ml.train      (from the backend/ directory)
"""

import os
import sys

# Allow running as `python ml/train.py` too, not just `python -m ml.train`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.ensemble import RandomForestClassifier  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split  # noqa: E402

from ml.features import FEATURES, all_baselines, compute_ratios  # noqa: E402
from ml.generate_dataset import CSV_PATH, generate  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, "model.pkl")


def load_dataset(path: str = CSV_PATH) -> pd.DataFrame:
    if not os.path.exists(path):
        print("Dataset not found — generating it…")
        generate(path)
    df = pd.read_csv(path)

    # Engineer the two ratio features (vectorized).
    ptr, fvr = compute_ratios(
        df["flow_rate"], df["pressure"], df["temperature"], df["vibration"]
    )
    df["pressure_temp_ratio"] = ptr
    df["flow_vibration_ratio"] = fvr
    return df


def main():
    df = load_dataset()

    X = df[FEATURES]
    y = df["is_anomaly"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    print("\n=== PetroSense anomaly model — evaluation ===")
    print(f"  Train / test rows : {len(X_train)} / {len(X_test)}")
    print(f"  Accuracy          : {acc:.4f}")
    print(f"  Precision         : {prec:.4f}")
    print(f"  Recall            : {rec:.4f}")
    print(f"  F1                : {f1:.4f}")

    importances = dict(zip(FEATURES, clf.feature_importances_))
    print("\n=== feature_importances_ ===")
    for feat, imp in sorted(importances.items(), key=lambda kv: kv[1], reverse=True):
        print(f"  {feat:22s} {imp:.4f}")

    # Persist the model plus everything the service needs to be self-contained.
    payload = {
        "model": clf,
        "features": FEATURES,
        "importances": importances,
        "baselines": all_baselines(),
        "sklearn_metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1,
        },
    }
    joblib.dump(payload, MODEL_PATH)
    print(f"\nSaved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
