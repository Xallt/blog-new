#!/usr/bin/env python3
"""
Replace Jekyll/Kramdown-style markdown images in MDX posts with Astro <Image /> (or <img> for GIFs).

Matches:
  - Standalone line: ![alt](relative-path){: w="600"} optional Kramdown block
  - Optional caption: the next line if it is only _italic text_ (Chirpy figure caption)
  - Table rows where every cell is only such an image: | ![...](...)|![...](...)|

Relative paths only (../assets/...). Skips http(s) URLs and lines already using <Image or <img.

Outputs:
  - import PostImage from '../components/PostImage.astro';
  - import imgN from '<path>';  (or path?url for GIFs)
  - <PostImage src={...} alt="..." width={...} height={...} caption={...} /> (caption optional)
  - Multi-image table rows become <div class="post-img-row"> with one PostImage per cell

Caption and string props use json.dumps where needed for safe escaping.

Usage:
  python3 scripts/jekyll_images_to_mdx_image.py --dry-run
  python3 scripts/jekyll_images_to_mdx_image.py --dir src/posts

Requires PostImage.astro and global.css (.post-img-row).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

# Full line: markdown image + optional {: ... } kramdown IAL
STANDALONE_IMG_RE = re.compile(
    r"^(\s*)!\[([^\]]*)\]\(([^)]+)\)(\s*\{:\s*([^}]*)\})?\s*$",
)
# Same image syntax as a single table cell (trimmed)
CELL_IMG_RE = re.compile(
    r"^!\[([^\]]*)\]\(([^)]+)\)(\s*\{:\s*([^}]*)\})?\s*$",
)
# Whole-line caption: _italic_ (Chirpy figure text); non-greedy avoids stray underscores.
CAPTION_LINE_RE = re.compile(r"^(\s*)_(.+?)_\s*$")
FENCE_START_RE = re.compile(r"^\s*```")
WH_RE = re.compile(r"\b([wh])\s*=\s*[\"']?(\d+)")
POST_IMAGE_IMPORT = "import PostImage from '../components/PostImage.astro';\n"


def is_external(url: str) -> bool:
    u = url.strip()
    return u.startswith("http://") or u.startswith("https://") or u.startswith("//")


def parse_wh(kramdown_block: str | None) -> tuple[int | None, int | None]:
    if not kramdown_block:
        return None, None
    w, h = None, None
    for m in WH_RE.finditer(kramdown_block):
        key, val = m.group(1).lower(), int(m.group(2))
        if key == "w":
            w = val
        else:
            h = val
    return w, h


def jsx_string(s: str) -> str:
    """Safe string for JSX text or attribute expression."""
    return json.dumps(s, ensure_ascii=False)


def is_gif(path: str) -> bool:
    return path.lower().split("?", 1)[0].endswith(".gif")


def decode_path(path: str) -> str:
    return unquote(path.strip())


class ImageEmitter:
    def __init__(self) -> None:
        self._path_to_var: dict[tuple[str, bool], str] = {}
        self._next_id = 0
        self.needs_post_image = False

    def var_for_path(self, path: str, *, gif: bool) -> str:
        key = (path, gif)
        if key in self._path_to_var:
            return self._path_to_var[key]
        var = f"postImg{self._next_id}"
        self._next_id += 1
        self._path_to_var[key] = var
        return var

    def asset_import_lines(self) -> list[str]:
        """import postImgN from 'path' lines only (no astro:assets)."""
        lines: list[str] = []
        items: list[tuple[str, str, bool]] = []
        for (raw_path, gif), var in self._path_to_var.items():
            items.append((var, raw_path, gif))
        items.sort(key=lambda x: x[0])
        for var, raw_path, gif in items:
            qpath = raw_path.replace("\\", "/")
            if gif:
                lines.append(f"import {var} from {json.dumps(qpath + '?url')};\n")
            else:
                lines.append(f"import {var} from {json.dumps(qpath)};\n")
        return lines


def render_figure(
    emitter: ImageEmitter,
    alt: str,
    path: str,
    w: int | None,
    h: int | None,
    caption: str | None,
) -> str:
    path = decode_path(path)
    if is_external(path):
        return ""  # caller should skip

    gif = is_gif(path)
    var = emitter.var_for_path(path, gif=gif)
    emitter.needs_post_image = True

    props: list[str] = [f"src={{{var}}}", f"alt={jsx_string(alt)}"]
    if w is not None:
        props.append(f"width={{{w}}}")
    if h is not None:
        props.append(f"height={{{h}}}")
    if caption is not None:
        props.append(f"caption={jsx_string(caption)}")

    return f"<PostImage {' '.join(props)} />\n"


def try_table_image_row(line: str, emitter: ImageEmitter) -> str | None:
    s = line.rstrip("\n\r")
    stripped = s.strip()
    if not (stripped.startswith("|") and stripped.endswith("|")):
        return None
    parts = stripped.split("|")
    if len(parts) < 3:
        return None
    cells = [c.strip() for c in parts[1:-1]]
    if not cells:
        return None
    parsed: list[tuple[str, str, str | None]] = []
    for cell in cells:
        m = CELL_IMG_RE.fullmatch(cell)
        if not m:
            return None
        alt, path, _, kd = m.group(1), m.group(2), m.group(3), m.group(4)
        if is_external(path):
            return None
        parsed.append((alt, path, kd))
    blocks: list[str] = ['<div class="post-img-row">\n']
    for alt, path, kd in parsed:
        w, h = parse_wh(kd)
        cell = render_figure(emitter, alt, path, w, h, None)
        blocks.append("  " + cell.rstrip("\n") + "\n")
    blocks.append("</div>\n")
    return "".join(blocks)


def import_specifier(line: str) -> str | None:
    m = re.search(r"from\s+['\"]([^'\"]+)['\"]\s*;", line)
    return m.group(1) if m else None


def merge_imports_into_body(body: str, emitter: ImageEmitter) -> str:
    m = re.match(r"^---\n.*?\n---\n", body, re.DOTALL)
    if not m:
        return body
    head = m.group(0)
    tail = body[m.end() :]
    lines = tail.splitlines(keepends=True)
    existing: list[str] = []
    seen_paths: set[str] = set()
    has_post_image = False
    i = 0
    while i < len(lines) and lines[i].strip().startswith("import "):
        line = lines[i]
        if "PostImage" in line and "PostImage.astro" in line:
            has_post_image = True
        spec = import_specifier(line)
        if spec:
            seen_paths.add(spec)
        existing.append(line)
        i += 1
    while i < len(lines) and lines[i].strip() == "":
        i += 1

    to_add: list[str] = []
    if emitter.needs_post_image and not has_post_image:
        to_add.append(POST_IMAGE_IMPORT)
    for ln in emitter.asset_import_lines():
        spec = import_specifier(ln)
        if spec and spec in seen_paths:
            continue
        if spec:
            seen_paths.add(spec)
        to_add.append(ln)

    rest = "".join(lines[i:])
    if not to_add:
        return head + "".join(existing) + "\n" + rest

    return head + "".join(existing) + "".join(to_add) + "\n" + rest


def transform(content: str) -> tuple[str, int]:
    emitter = ImageEmitter()
    lines = content.splitlines(keepends=True)
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
        if "<Image" in line or "<img" in line or "<PostImage" in line:
            out.append(line)
            i += 1
            continue

        row = try_table_image_row(line, emitter)
        if row:
            out.append(row)
            n += 1
            i += 1
            continue

        m = STANDALONE_IMG_RE.match(line)
        if m:
            _indent, alt, path, _kblock, kd = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
            if not is_external(path):
                w, h = parse_wh(kd)
                caption: str | None = None
                if i + 1 < len(lines):
                    cm = CAPTION_LINE_RE.match(lines[i + 1])
                    if cm and not lines[i + 1].lstrip().startswith("|"):
                        caption = cm.group(2).strip()
                fig = render_figure(emitter, alt, path, w, h, caption)
                if fig:
                    out.append(fig)
                    n += 1
                    i += 1
                    if caption is not None:
                        i += 1
                    continue
        out.append(line)
        i += 1

    if n == 0:
        return content, 0

    new_body = "".join(out)
    new_body = merge_imports_into_body(new_body, emitter)
    return new_body, n


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Jekyll markdown images + {: w/h} + _caption_ → Astro Image in MDX",
    )
    ap.add_argument("--dir", type=Path, default=None, help="Posts directory (default: src/posts)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    root = Path(__file__).resolve().parent.parent
    posts_dir = args.dir if args.dir is not None else root / "src" / "posts"
    if not posts_dir.is_dir():
        print(f"Not a directory: {posts_dir}", file=sys.stderr)
        return 1

    files = sorted(posts_dir.glob("*.mdx"))
    if not files:
        print(f"No .mdx in {posts_dir}")
        return 0

    for path in files:
        raw = path.read_text(encoding="utf-8")
        new, count = transform(raw)
        msg = f"{path.name}: {count} image(s) converted" if count else f"{path.name}: (unchanged)"
        print(msg)
        if count and args.dry_run:
            continue
        if count and not args.dry_run:
            path.write_text(new, encoding="utf-8")

    if args.dry_run:
        print("\n(dry-run: no files written)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
