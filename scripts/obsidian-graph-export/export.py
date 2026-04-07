#!/usr/bin/env python3
"""
Export obsidiantools vault.graph to JSON for react-force-graph.

  cd scripts/obsidian-graph-export
  uv sync
  uv run python export.py --vault /path/to/vault --out ../../public/obsidian-graph.json
  # Optional: --types paper,library,definition (default) or "" to disable type filter
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path, PurePath

import obsidiantools.api as otools

# Default frontmatter `type` values to keep (YAML `type:` on the note).
DEFAULT_TYPES: tuple[str, ...] = ("paper", "library", "definition")


def repo_root_from_script() -> Path:
    # scripts/obsidian-graph-export/export.py -> blog-new/
    return Path(__file__).resolve().parent.parent.parent


def default_output_path() -> Path:
    return repo_root_from_script() / "public" / "obsidian-graph.json"


def subgraph_top_degree(G, max_nodes: int):
    """Keep the max_nodes highest-degree nodes and the edges between them."""
    if G.number_of_nodes() <= max_nodes:
        return G
    ranked = sorted(G.nodes(), key=lambda n: G.degree(n), reverse=True)[:max_nodes]
    return G.subgraph(ranked).copy()


def parse_types_csv(s: str) -> frozenset[str]:
    parts = [x.strip().lower() for x in s.split(",") if x.strip()]
    return frozenset(parts)


def frontmatter_type_values(vault, node) -> frozenset[str]:
    """Normalized type value(s) from frontmatter, or empty if none / not a note."""
    try:
        fm = vault.get_front_matter(node)
    except ValueError:
        return frozenset()
    if not fm or not isinstance(fm, dict):
        return frozenset()
    raw = fm.get("type")
    if raw is None:
        return frozenset()
    if isinstance(raw, (list, tuple)):
        return frozenset(str(x).strip().lower() for x in raw if str(x).strip())
    return frozenset({str(raw).strip().lower()})


def subgraph_by_frontmatter_types(vault, G, allowed_types: frozenset[str]):
    """Induced subgraph: only nodes whose frontmatter `type` matches allowed_types."""
    if not allowed_types:
        return G
    keep = {
        n
        for n in G.nodes()
        if frontmatter_type_values(vault, n) & allowed_types
    }
    return G.subgraph(keep).copy()


def graph_to_force_json(G, *, skip_self_loops: bool = True) -> dict:
    """Build { nodes, links } for react-force-graph (string ids)."""
    nodes_out = []
    for n in G.nodes():
        nid = str(n)
        deg = int(G.degree(n))
        name = PurePath(nid).name
        if name.lower().endswith(".md"):
            name = name[: -len(".md")]
        nodes_out.append({"id": nid, "name": name, "val": max(1, deg)})

    seen_undirected: set[tuple[str, str]] = set()
    links_out = []
    for u, v in G.edges():
        su, sv = str(u), str(v)
        if skip_self_loops and su == sv:
            continue
        a, b = (su, sv) if su <= sv else (sv, su)
        if (a, b) in seen_undirected:
            continue
        seen_undirected.add((a, b))
        links_out.append({"source": su, "target": sv})

    return {"nodes": nodes_out, "links": links_out}


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--vault",
        type=Path,
        default=None,
        help="Path to Obsidian vault root (default: OBSIDIAN_VAULT env)",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=None,
        help=f"Output JSON path (default: {default_output_path()})",
    )
    p.add_argument(
        "--max-nodes",
        type=int,
        default=None,
        metavar="K",
        help="Keep only the K highest-degree notes and edges among them",
    )
    p.add_argument(
        "--include-self-loops",
        action="store_true",
        help="Include self-links in the export (default: skip)",
    )
    p.add_argument(
        "--types",
        default=",".join(DEFAULT_TYPES),
        metavar="TYPES",
        help=(
            "Comma-separated frontmatter `type` values to include "
            f"(default: {','.join(DEFAULT_TYPES)})"
        ),
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv if argv is not None else sys.argv[1:])
    vault_path = args.vault
    if vault_path is None:
        import os

        raw = os.environ.get("OBSIDIAN_VAULT")
        if not raw:
            print("error: pass --vault or set OBSIDIAN_VAULT", file=sys.stderr)
            return 2
        vault_path = Path(raw)
    vault_path = vault_path.expanduser().resolve()
    if not vault_path.is_dir():
        print(f"error: vault is not a directory: {vault_path}", file=sys.stderr)
        return 2

    out_path = args.out if args.out is not None else default_output_path()
    out_path = out_path.expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading vault: {vault_path}", file=sys.stderr)
    vault = otools.Vault(vault_path).connect().gather()
    G = vault.graph
    print(
        f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges",
        file=sys.stderr,
    )

    allowed_types = parse_types_csv(args.types)
    if allowed_types:
        G = subgraph_by_frontmatter_types(vault, G, allowed_types)
        print(
            f"After --types filter {sorted(allowed_types)!r}: "
            f"{G.number_of_nodes()} nodes, {G.number_of_edges()} edges",
            file=sys.stderr,
        )

    if args.max_nodes is not None and args.max_nodes > 0:
        G = subgraph_top_degree(G, args.max_nodes)
        print(
            f"After --max-nodes {args.max_nodes}: "
            f"{G.number_of_nodes()} nodes, {G.number_of_edges()} edges",
            file=sys.stderr,
        )

    payload = graph_to_force_json(G, skip_self_loops=not args.include_self_loops)
    text = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    out_path.write_text(text, encoding="utf-8")
    print(f"Wrote {out_path} ({len(text) // 1024} KiB)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
