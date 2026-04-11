#!/usr/bin/env python3
"""
Optimize raster images and video under a directory (recursive).

Images: PNG→JPEG, max side 1500px (OpenCV).
Videos: mp4/mov — longest side at most 1500, frame rate at most 30 fps; mov is
written as mp4 (ffmpeg).

Requires ffmpeg and ffprobe on PATH for video. From repo root:

  cd scripts && uv sync
  uv run python optimize_media.py /path/to/folder
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import cv2

MAX_DIM = 1500
JPEG_QUALITY = 90

RASTER_EXT = {".png", ".jpg", ".jpeg", ".webp"}
VIDEO_EXT = {".mp4", ".mov"}

FPS_CAP = 30.0
FPS_EPS = 0.01


def resize_max_side(img, max_dim: int):
    h, w = img.shape[:2]
    m = max(h, w)
    if m <= max_dim:
        return img
    scale = max_dim / m
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def iter_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*") if p.is_file())


def process_png(path: Path) -> None:
    out = path.with_suffix(".jpg")
    if out.exists():
        print(f"skip PNG (target exists): {path}", file=sys.stderr)
        return

    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        print(f"skip PNG (unreadable): {path}", file=sys.stderr)
        return

    img = resize_max_side(img, MAX_DIM)
    ok = cv2.imwrite(
        str(out),
        img,
        [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY],
    )
    if not ok:
        print(f"failed to write: {out}", file=sys.stderr)
        return

    path.unlink()
    print(f"PNG → JPEG: {path} → {out}")


def downscale_if_needed(path: Path) -> None:
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"skip (unreadable): {path}", file=sys.stderr)
        return

    if img.ndim == 2:
        pass
    elif img.shape[2] == 4:
        bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        img = bgr

    h, w = img.shape[:2]
    if max(h, w) <= MAX_DIM:
        return

    out_img = resize_max_side(img, MAX_DIM)
    tmp = path.with_suffix(path.suffix + ".tmp-opt")
    ext = path.suffix.lower()
    params: list[int] = []
    if ext in (".jpg", ".jpeg"):
        params = [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY]
    elif ext == ".webp":
        params = [int(cv2.IMWRITE_WEBP_QUALITY), JPEG_QUALITY]

    ok = cv2.imwrite(str(tmp), out_img, params)
    if not ok:
        print(f"failed to write temp: {tmp}", file=sys.stderr)
        tmp.unlink(missing_ok=True)
        return

    tmp.replace(path)
    print(f"downscaled: {path} ({w}×{h} → max side {MAX_DIM})")


def _ffmpeg_available() -> bool:
    return bool(shutil.which("ffmpeg") and shutil.which("ffprobe"))


def _parse_rate(s: str | None) -> float:
    if not s or s == "0/0":
        return 0.0
    if "/" in s:
        a, b = s.split("/", 1)
        try:
            fb = float(b)
            return float(a) / fb if fb else 0.0
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def _probe_video_stream(path: Path) -> dict | None:
    try:
        r = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height,avg_frame_rate,r_frame_rate",
                "-of",
                "json",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    data = json.loads(r.stdout)
    streams = data.get("streams") or []
    if not streams:
        return None
    return streams[0]


def _has_audio_stream(path: Path) -> bool:
    try:
        r = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "a:0",
                "-show_entries",
                "stream=codec_type",
                "-of",
                "csv=p=0",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
    return bool(r.stdout.strip())


def _run_ffmpeg(cmd: list[str]) -> bool:
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(e.stderr or e.stdout or str(e), file=sys.stderr)
        return False
    except FileNotFoundError:
        return False


def _encode_video(
    src: Path,
    dst: Path,
    vf_parts: list[str],
) -> bool:
    cmd: list[str] = ["ffmpeg", "-y", "-i", str(src)]
    if vf_parts:
        cmd += ["-vf", ",".join(vf_parts)]
    cmd += [
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "medium",
        "-movflags",
        "+faststart",
    ]
    if _has_audio_stream(src):
        cmd += ["-c:a", "aac", "-b:a", "128k"]
    else:
        cmd += ["-an"]
    cmd.append(str(dst))
    return _run_ffmpeg(cmd)


def process_video(path: Path) -> None:
    if not _ffmpeg_available():
        print(f"skip video (ffmpeg/ffprobe not in PATH): {path}", file=sys.stderr)
        return

    stream = _probe_video_stream(path)
    if stream is None:
        print(f"skip video (no video stream or unreadable): {path}", file=sys.stderr)
        return

    w = int(stream.get("width", 0) or 0)
    h = int(stream.get("height", 0) or 0)
    if w <= 0 or h <= 0:
        print(f"skip video (bad dimensions): {path}", file=sys.stderr)
        return

    fps = _parse_rate(stream.get("avg_frame_rate"))
    if fps <= 0:
        fps = _parse_rate(stream.get("r_frame_rate"))

    needs_scale = max(w, h) > MAX_DIM
    needs_fps = fps > FPS_CAP + FPS_EPS
    ext = path.suffix.lower()
    is_mov = ext == ".mov"
    out_path = path.with_suffix(".mp4") if is_mov else path

    if is_mov and out_path.exists():
        print(f"skip MOV (target exists): {path}", file=sys.stderr)
        return

    vf_parts: list[str] = []
    if needs_scale:
        vf_parts.append(
            "scale=w='min(1500,iw)':h='min(1500,ih)':force_original_aspect_ratio=decrease"
        )
    if needs_fps:
        vf_parts.append("fps=30")

    if not vf_parts and not is_mov:
        # mp4, already within limits
        return

    tmp_out = path.parent / f"{path.stem}.opt.tmp.mp4"

    ok = False
    if not vf_parts and is_mov:
        # Container-only: try stream copy to mp4
        ok = _run_ffmpeg(["ffmpeg", "-y", "-i", str(path), "-c", "copy", str(tmp_out)])
        if not ok:
            ok = _encode_video(path, tmp_out, [])
    elif vf_parts:
        ok = _encode_video(path, tmp_out, vf_parts)

    if not ok or not tmp_out.exists():
        tmp_out.unlink(missing_ok=True)
        print(f"failed video optimize: {path}", file=sys.stderr)
        return

    src_display = str(path)
    if is_mov:
        path.unlink(missing_ok=True)
        tmp_out.replace(out_path)
        print(f"MOV → MP4: {src_display} → {out_path}")
    else:
        path.unlink(missing_ok=True)
        tmp_out.replace(path)
        label = []
        if needs_scale:
            label.append("scaled")
        if needs_fps:
            label.append("fps≤30")
        print(f"video: {src_display} ({', '.join(label)})")


def main() -> None:
    p = argparse.ArgumentParser(
        description="Optimize images and video in a folder (images: max side 1500; video: max side 1500, max 30 fps, mov→mp4).",
    )
    p.add_argument("folder", type=Path, help="Directory to process (recursive)")
    args = p.parse_args()
    root = args.folder.resolve()
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        sys.exit(1)

    pngs: list[Path] = []
    others: list[Path] = []
    videos: list[Path] = []

    for f in iter_files(root):
        ext = f.suffix.lower()
        if ext in VIDEO_EXT:
            videos.append(f)
            continue
        if ext not in RASTER_EXT:
            continue
        if ext == ".png":
            pngs.append(f)
        else:
            others.append(f)

    for path in pngs:
        process_png(path)

    for path in others:
        downscale_if_needed(path)

    for path in videos:
        process_video(path)

    print("Done.")


if __name__ == "__main__":
    main()
