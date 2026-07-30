"""Offline contract check for the committed golden set; not an LLM quality score."""
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import mock_analysis

root = Path(__file__).resolve().parents[2]
cases = [json.loads(line) for line in (root / "eval" / "golden_set.jsonl").read_text(encoding="utf-8").splitlines() if line]
failures = []
for case in cases:
    result = mock_analysis(case["text"])
    if not all(item in case["text"] for item in result.evidence):
        failures.append(case["id"])
print(f"Checked {len(cases)} cases; evidence-substring failures: {len(failures)}")
if failures:
    print(", ".join(failures))
    raise SystemExit(1)
