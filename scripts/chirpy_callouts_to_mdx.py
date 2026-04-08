#!/usr/bin/env python3
"""
Convert src/posts/*.md to .mdx and replace Jekyll/Kramdown Chirpy callouts:

    > line one
    > line two
    {: .prompt-info}

with:

    <Callout type="info">
    line one
    line two
    </Callout>

Supported classes: prompt-tip, prompt-info, prompt-warning, prompt-danger
(Classifier may be {:.prompt-x}, {: .prompt-x}, optional spaces.)

Usage:
  python scripts/chirpy_callouts_to_mdx.py              # write .mdx next to .md
  python scripts/chirpy_callouts_to_mdx.py --dry-run    # print planned changes only
  python scripts/chirpy_callouts_to_mdx.py --dir path/to/posts

After review, remove the old .md files so content collections do not duplicate slugs.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

CLASSIFIER_RE = re.compile(
    r"^\{\:\s*\.?\s*prompt-(tip|info|warning|danger)\s*\}\s*$",
    re.IGNORECASE,
)

IMPORT_LINE = "import Callout from '../components/Callout.astro';\n"


def strip_blockquote_line(line: str) -> str:
    """Turn a blockquote source line into inner markdown (no trailing newline)."""
    if not line.startswith(">"):
        return line
    rest = line[1:]
    if rest.startswith(" "):
        rest = rest[1:]
    return rest.rstrip("\n")


def ensure_callout_import(body: str) -> str:
    if "Callout" in body and "from '../components/Callout.astro'" in body:
        return body
    m = re.match(r"^---\n.*?\n---\n", body, re.DOTALL)
    if not m:
        return IMPORT_LINE + body
    end = m.end()
    return body[:end] + IMPORT_LINE + body[end:]


FENCE_START_RE = re.compile(r"^\s*```")


def replace_callouts(text: str) -> tuple[str, int]:
    """
    Replace Chirpy blockquote + classifier blocks with <Callout>.
    Ignores lines inside fenced code blocks (``` ... ```).
    Returns (new_text, number_of_replacements).
    """
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    n = 0
    in_fence = False

    while i < len(lines):
        line = lines[i]
        if FENCE_START_RE.match(line):
            in_fence = not in_fence
            out.append(line)
            i += 1
            continue
        if in_fence:
            out.append(line)
            i += 1
            continue
        if line.startswith(">"):
            bq: list[str] = []
            while i < len(lines) and lines[i].startswith(">"):
                bq.append(lines[i])
                i += 1
            if i < len(lines) and CLASSIFIER_RE.match(lines[i].rstrip("\n\r")):
                kind = CLASSIFIER_RE.match(lines[i].rstrip("\n\r"))
                assert kind is not None
                prompt_type = kind.group(1).lower()
                i += 1
                inner = "\n".join(strip_blockquote_line(L) for L in bq).rstrip() + "\n"
                out.append(f'<Callout type="{prompt_type}">\n')
                out.append(inner)
                out.append("</Callout>\n")
                n += 1
                continue
            out.extend(bq)
            continue
        out.append(line)
        i += 1

    return "".join(out), n


def process_file(path: Path, dry_run: bool) -> tuple[bool, str]:
    raw = path.read_text(encoding="utf-8")
    new_raw, count = replace_callouts(raw)
    if count:
        new_raw = ensure_callout_import(new_raw)
    out_path = path.with_suffix(".mdx")
    msg = f"{path.name} -> {out_path.name}" + (
        f" ({count} callout(s))" if count else " (no callouts)"
    )
    if dry_run:
        return True, msg
    path.unlink()
    out_path.write_text(new_raw, encoding="utf-8")
    return True, msg


def main() -> int:
    parser = argparse.ArgumentParser(
        description="MD + Chirpy callouts -> MDX + Callout component"
    )
    parser.add_argument(
        "--dir",
        type=Path,
        default=None,
        help="Directory containing .md posts (default: <repo>/src/posts)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write files; print what would happen",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    posts_dir = args.dir if args.dir is not None else repo_root / "src" / "posts"
    if not posts_dir.is_dir():
        print(f"Not a directory: {posts_dir}", file=sys.stderr)
        return 1

    md_files = sorted(posts_dir.glob("*.md"))
    if not md_files:
        print(f"No .md files in {posts_dir}")
        return 0

    for md in md_files:
        ok, msg = process_file(md, args.dry_run)
        if ok:
            print(msg)

    if args.dry_run:
        print("\n(dry-run: no files written)")
    else:
        print(
            "\nDone. Remove the original .md files for converted posts when ready "
            "so Astro content collections do not register duplicates.",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
