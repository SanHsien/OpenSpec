#!/usr/bin/env python3
"""檢查本 fork 維護文件之間的相對連結。

只驗公開入口與 docs。外部網址交給人看。

    python tools/check_links.py
"""

from __future__ import annotations

import os
import re
import sys
from functools import lru_cache
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
LINK_PATTERN = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
IMAGE_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
HTML_SRC_PATTERN = re.compile(r"""(?is)<img[^>]+src=["']([^"']+)["']""")
FENCE_PATTERN = re.compile(r"(?ms)^[ \t]*(`{3,}|~{3,}).*?^[ \t]*\1[`~]*[ \t]*$")
HEADING_PATTERN = re.compile(r"(?m)^ {0,3}#{1,6}[ \t]+(.+?)[ \t#]*$")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:")
SKIP_NAMES = {
    "upstream-review-report.md",
    "dependency-freshness-report.md",
}
MAINTAINED_DOCUMENTS = (
    "README.md",
    "README.en.md",
    "FORK.md",
    "NOTICE.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "REVIEW.md",
    "docs/DEVELOPMENT.md",
    "docs/DECISIONS.md",
    "docs/UPSTREAM.md",
    ".github/pull_request_template.md",
)


def iter_documents() -> list[Path]:
    missing = [relative for relative in MAINTAINED_DOCUMENTS if not (ROOT / relative).is_file()]
    if missing:
        raise FileNotFoundError("maintained documents missing: " + ", ".join(missing))
    return [ROOT / relative for relative in MAINTAINED_DOCUMENTS]


def strip_code_fences(text: str) -> str:
    """Blank out fenced code blocks so example links inside them are not checked."""
    return FENCE_PATTERN.sub("", text)


def slugify(heading: str) -> str:
    """GitHub-style heading anchor: lowercase, drop punctuation, spaces to hyphens."""
    heading = re.sub(r"[`*~]", "", heading.strip().lower())
    heading = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", heading)
    heading = re.sub(r"[^\w\s-]", "", heading)
    return re.sub(r"\s", "-", heading)


@lru_cache(maxsize=None)
def anchors_of(path: Path) -> frozenset[str]:
    text = strip_code_fences(path.read_text(encoding="utf-8-sig"))
    seen: dict[str, int] = {}
    anchors: set[str] = set()
    for match in HEADING_PATTERN.finditer(text):
        slug = slugify(match.group(1))
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        anchors.add(slug if count == 0 else f"{slug}-{count}")
    return frozenset(anchors)


def exists_exact(path: Path) -> bool:
    """Existence check that is case-sensitive even on Windows' case-insensitive disks."""
    if not path.exists():
        return False
    try:
        relative = path.relative_to(ROOT)
    except ValueError:
        return True
    current = ROOT
    for part in relative.parts:
        if part not in os.listdir(current):
            return False
        current = current / part
    return True


def clean_target(target: str) -> str:
    """`path "title"` -> `path`; `<path with spaces>` -> `path with spaces`."""
    target = target.strip()
    if target.startswith("<") and ">" in target:
        return target[1 : target.index(">")]
    return target.split(None, 1)[0] if target else target


def _missing_relative(path: Path, target: str) -> str | None:
    target = clean_target(target)
    if not target or target.startswith(SKIP_PREFIXES):
        return None
    file_part, _, fragment = target.partition("#")
    file_part = unquote(file_part)
    resolved = Path(os.path.abspath(path.parent / file_part)) if file_part else path
    if not exists_exact(resolved):
        try:
            shown = resolved.relative_to(ROOT)
        except ValueError:
            shown = resolved
        return f"{target} → 找不到 {shown}"
    fragment = unquote(fragment).lower()
    if fragment and resolved.suffix.lower() == ".md" and resolved.is_file():
        if fragment not in anchors_of(resolved):
            return f"{target} → 找不到錨點 #{fragment}"
    return None


def check_document(path: Path) -> list[str]:
    problems: list[str] = []
    text = strip_code_fences(path.read_text(encoding="utf-8-sig"))
    for pattern in (LINK_PATTERN, IMAGE_PATTERN, HTML_SRC_PATTERN):
        for match in pattern.finditer(text):
            missing = _missing_relative(path, match.group(1))
            if missing:
                problems.append(missing)
    return problems


def main() -> int:
    documents = iter_documents()
    if not documents:
        print("找不到任何維護用 Markdown 檔")
        return 1

    failures = 0
    for path in documents:
        problems = check_document(path)
        rel = path.relative_to(ROOT)
        if problems:
            failures += 1
            for problem in problems:
                print(f"FAIL {rel}: {problem}")
        else:
            print(f"OK   {rel}")

    print(f"\n共 {len(documents)} 份文件，{failures} 份有斷掉的相對連結。")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())