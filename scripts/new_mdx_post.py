#!/usr/bin/env python3
"""
Create a new empty MDX post under src/posts/ with frontmatter only.

Prompts for post title and space-separated tags. Before the tags prompt,
prints all tags already used in src/posts so you can reuse them. Filename
is the title lowercased with whitespace replaced by dashes.

Usage:
  python scripts/new_mdx_post.py
"""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = REPO_ROOT / "src" / "posts"


def extract_frontmatter(text: str) -> str | None:
    if not text.startswith("---"):
        return None
    sep = "\n---"
    end = text.find(sep, 3)
    if end == -1:
        return None
    # Skip opening --- and following newline
    start = 3
    if text[start : start + 1] == "\n":
        start += 1
    elif text[start : start + 2] == "\r\n":
        start += 2
    return text[start:end]


def _strip_scalar(val: str) -> str:
    val = val.strip()
    if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
        return val[1:-1]
    return val


def parse_tags_from_frontmatter(fm: str) -> list[str]:
    tags: list[str] = []
    lines = fm.splitlines()
    for i, line in enumerate(lines):
        if not line.startswith("tags:"):
            continue
        rest = line[5:].strip()
        if rest.startswith("["):
            if rest == "[]":
                return []
            inner = rest.removeprefix("[").removesuffix("]").strip()
            for part in re.split(r"\s*,\s*", inner):
                part = _strip_scalar(part)
                if part:
                    tags.append(part)
            return tags
        if rest == "[]":
            return []
        j = i + 1
        while j < len(lines):
            ln = lines[j]
            m = re.match(r"^\s*-\s+(.+)$", ln)
            if m:
                tags.append(_strip_scalar(m.group(1)))
                j += 1
            elif ln.strip() == "":
                j += 1
            else:
                break
        return tags
    return tags


def iter_post_files() -> list[Path]:
    paths: list[Path] = []
    seen: set[Path] = set()
    for pattern in ("**/*.mdx", "**/*.md"):
        for path in sorted(POSTS_DIR.glob(pattern)):
            rp = path.resolve()
            if rp not in seen:
                seen.add(rp)
                paths.append(path)
    return paths


def collect_existing_tags() -> list[str]:
    found: list[str] = []
    for path in iter_post_files():
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        fm = extract_frontmatter(text)
        if fm is None:
            continue
        found.extend(parse_tags_from_frontmatter(fm))
    unique = sorted(set(found), key=str.casefold)
    return unique


def print_existing_tags(tags: list[str]) -> None:
    print("Existing tags in src/posts:")
    if not tags:
        print("  (none found)")
        return
    for t in tags:
        print(f"  {t}")
    print()


def slugify_tags(line: str) -> list[str]:
    parts = [p for p in line.split() if p.strip()]
    out: list[str] = []
    for p in parts:
        t = p.strip().lower()
        t = re.sub(r"\s+", "-", t)
        if t:
            out.append(t)
    return out


def yaml_title(title: str) -> str:
    if (
        re.search(r"[:#\n]", title)
        or title.startswith((" ", '"', "'"))
        or title.endswith(" ")
    ):
        escaped = title.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return title


def title_to_filename(title: str) -> str:
    base = "-".join(title.lower().split())
    base = re.sub(r"-+", "-", base).strip("-")
    return base or "untitled"


def format_pub_date() -> str:
    dt = datetime.now().astimezone()
    # Match existing posts, e.g. 2023-11-16 21:29 +0400
    return dt.strftime("%Y-%m-%d %H:%M %z")


def build_frontmatter(title: str, tags: list[str]) -> str:
    lines = [
        "---",
        f"title: {yaml_title(title)}",
        "",
    ]
    if tags:
        lines.append("tags:")
        lines.extend(f"- {t}" for t in tags)
    else:
        lines.append("tags: []")
    lines.extend(
        [
            "",
            f"pubDate: {format_pub_date()}",
            "---",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    title = input("Post title: ").strip()
    if not title:
        print("Title is required.", file=sys.stderr)
        return 1

    print_existing_tags(collect_existing_tags())
    tags_line = input("Tags (space-separated): ").strip()
    tags = slugify_tags(tags_line)

    stem = title_to_filename(title)
    path = POSTS_DIR / f"{stem}.mdx"
    if path.exists():
        print(f"Refusing to overwrite existing file: {path}", file=sys.stderr)
        return 1

    path.write_text(build_frontmatter(title, tags), encoding="utf-8")
    print(f"Wrote {path.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
