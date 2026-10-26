"""Behavior tests for the maintainer tools. Run: python -m unittest discover -s tools -p "test_*.py"

Nothing here launches a program or opens a window; the tools are imported and called directly.
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_dependency_freshness as freshness  # noqa: E402
import check_links as links  # noqa: E402
import check_upstream_updates as upstream  # noqa: E402


class LinkCheckerTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name).resolve()
        self._old_root = links.ROOT
        links.ROOT = self.root
        links.anchors_of.cache_clear()
        (self.root / "Target.md").write_text("# Hello World\n\n## Setup (2)\n", encoding="utf-8")

    def tearDown(self) -> None:
        links.ROOT = self._old_root
        links.anchors_of.cache_clear()
        self._tmp.cleanup()

    def check(self, body: str) -> list[str]:
        doc = self.root / "doc.md"
        doc.write_text(body, encoding="utf-8")
        return links.check_document(doc)

    def test_valid_link_and_anchor_pass(self) -> None:
        self.assertEqual(self.check("[a](Target.md#hello-world) [b](Target.md#setup-2)"), [])

    def test_missing_anchor_is_reported(self) -> None:
        problems = self.check("[a](Target.md#no-such-heading)")
        self.assertEqual(len(problems), 1)
        self.assertIn("no-such-heading", problems[0])

    def test_same_file_anchor_is_checked(self) -> None:
        self.assertEqual(self.check("# Top\n\n[x](#top)"), [])
        self.assertEqual(len(self.check("# Top\n\n[x](#nope)")), 1)

    def test_link_title_is_not_part_of_path(self) -> None:
        self.assertEqual(self.check('[a](Target.md "the title")'), [])

    def test_links_inside_code_fences_are_ignored(self) -> None:
        self.assertEqual(self.check("```md\n[a](missing.md)\n```\n"), [])

    def test_wrong_case_path_is_reported(self) -> None:
        problems = self.check("[a](target.md)")
        self.assertEqual(len(problems), 1)

    def test_underscore_is_kept_in_anchor(self) -> None:
        self.assertEqual(self.check("# Hello_World\n\n[x](#hello_world)"), [])

    def test_missing_file_is_reported(self) -> None:
        self.assertEqual(len(self.check("[a](nope.md)")), 1)


class FreshnessTests(unittest.TestCase):
    def test_classify(self) -> None:
        self.assertEqual(freshness.classify("^4.1.12", "4.2.0"), "OK")
        self.assertEqual(freshness.classify("^3.9.0", "4.0.1"), "OUTDATED")
        self.assertEqual(freshness.classify("^4.1.12", None), "CHECK_FAILED")
        self.assertEqual(freshness.classify("workspace:*", "1.0.0"), "SKIP")

    def test_registry_failure_is_not_success(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            package = Path(tmp) / "package.json"
            package.write_text(json.dumps({"dependencies": {"x": "^1.0.0"}}), encoding="utf-8")
            old = (freshness.PACKAGE_JSON, freshness.REPORT_PATH, freshness.get_latest_version)
            freshness.PACKAGE_JSON = package
            freshness.REPORT_PATH = Path(tmp) / "report.md"
            freshness.get_latest_version = lambda name: None
            try:
                self.assertNotEqual(freshness.main([]), 0)
            finally:
                freshness.PACKAGE_JSON, freshness.REPORT_PATH, freshness.get_latest_version = old

    def test_strict_fails_on_outdated_major(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            package = Path(tmp) / "package.json"
            package.write_text(json.dumps({"dependencies": {"x": "^1.0.0"}}), encoding="utf-8")
            old = (freshness.PACKAGE_JSON, freshness.REPORT_PATH, freshness.get_latest_version)
            freshness.PACKAGE_JSON = package
            freshness.REPORT_PATH = Path(tmp) / "report.md"
            freshness.get_latest_version = lambda name: "2.0.0"
            try:
                self.assertEqual(freshness.main([]), 0)
                self.assertEqual(freshness.main(["--strict"]), 1)
            finally:
                freshness.PACKAGE_JSON, freshness.REPORT_PATH, freshness.get_latest_version = old


class BaselineTests(unittest.TestCase):
    def load(self, payload: object) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "baseline.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            return upstream.load_baseline(path)

    def good(self, **extra: object) -> dict:
        return {
            "repo": "https://github.com/o/r.git",
            "branch": "main",
            "reviewed_through": "a" * 40,
            "reviewed_date": "2026-01-01",
            **extra,
        }

    def test_valid_baseline_loads(self) -> None:
        self.assertEqual(self.load(self.good(reviewed_pr_through=5))["reviewed_pr_through"], 5)

    def test_non_object_baseline_is_a_clean_error(self) -> None:
        with self.assertRaises(upstream.UpstreamCheckError):
            self.load([1, 2])

    def test_non_hex_sha_is_rejected(self) -> None:
        bad = self.good()
        bad["reviewed_through"] = "z" * 40
        with self.assertRaises(upstream.UpstreamCheckError):
            self.load(bad)

    def test_non_numeric_watermark_is_a_clean_error(self) -> None:
        with self.assertRaises(upstream.UpstreamCheckError):
            self.load(self.good(reviewed_pr_through="2142x"))


if __name__ == "__main__":
    unittest.main()
