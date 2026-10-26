#!/usr/bin/env python3
"""Check dependency freshness against npm registry for package.json.

    python tools/check_dependency_freshness.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_JSON = REPO_ROOT / "package.json"
REPORT_PATH = REPO_ROOT / "dependency-freshness-report.md"


def get_latest_version(package_name: str) -> str | None:
    url = f"https://registry.npmjs.org/{package_name}/latest"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SanHsien-Freshness-Check/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("version")
    except Exception:
        return None


SPEC_VERSION = re.compile(r"^\s*(?:[\^~]|>=?|=)?\s*v?(\d+)\.(\d+)\.(\d+)")


def classify(spec: str, latest: str | None) -> str:
    """OK / OUTDATED (declared floor is a major behind) / CHECK_FAILED / SKIP."""
    if not latest:
        return "CHECK_FAILED"
    declared = SPEC_VERSION.match(spec)
    newest = SPEC_VERSION.match(latest)
    if not declared or not newest:
        return "SKIP"
    return "OUTDATED" if int(declared[1]) < int(newest[1]) else "OK"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Also return non-zero when a declared floor is a major version behind.",
    )
    args = parser.parse_args(argv)
    if not PACKAGE_JSON.is_file():
        print(f"Error: {PACKAGE_JSON} not found")
        return 1

    data = json.loads(PACKAGE_JSON.read_text(encoding="utf-8-sig"))
    deps = data.get("dependencies", {})
    dev_deps = data.get("devDependencies", {})

    all_deps = []
    for name, spec in sorted(deps.items()):
        all_deps.append((name, spec, "production"))
    for name, spec in sorted(dev_deps.items()):
        all_deps.append((name, spec, "development"))

    print(f"Checking {len(all_deps)} dependencies against npm registry...\n")

    lines = [
        "# Dependency freshness report",
        "",
        "| Package | Type | Declared | npm latest | Status |",
        "| --- | --- | --- | --- | --- |",
    ]

    statuses: list[str] = []
    for name, spec, dep_type in all_deps:
        latest = get_latest_version(name)
        status = classify(spec, latest)
        statuses.append(status)
        lines.append(f"| `{name}` | {dep_type} | `{spec}` | `{latest or 'unknown'}` | {status} |")
        print(f"{name:30} {spec:15} -> {latest or 'unknown':15} [{status}]")

    report = "\n".join(lines) + "\n"
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"\nFreshness report written to {REPORT_PATH.name}")
    if "CHECK_FAILED" in statuses:
        print("ERROR: npm registry lookup failed for at least one package.")
        return 2
    if args.strict and "OUTDATED" in statuses:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())