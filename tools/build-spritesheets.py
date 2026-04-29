#!/usr/bin/env python3
"""
Preprocess character spritesheets for use in Phaser.

Each source sheet has:
  - Top section (y≈96-406):  8 walk frames with non-uniform gaps between them
  - Bottom section (y≈571-874): 1 jump frame (left) + 1 land frame (right)
  - White (RGB) background throughout

Output: Assets/players-web/spritesheets/<id>.png
  - 10 frames in a horizontal strip (frames 0-7 = walk, 8 = jump, 9 = land)
  - Uniform frame dimensions (TARGET_H tall, width preserves aspect ratio)
  - RGBA with transparent background
"""

import os
import sys
from collections import deque
import numpy as np
from PIL import Image

SRC_DIR = "Assets/players/spritesheets"
OUT_DIR = "Assets/players-web/spritesheets"
TARGET_H = 96  # output frame height in pixels
TOP_PAD = 8   # reserved pixels at top so raised arms/fingers aren't flush to edge
WHITE_THRESH = 230  # channels >= this are considered "white background"
CONTENT_THRESH = 220  # row/col has content if any pixel channel < this
ALPHA_THRESH = 24  # transparent pixels are ignored when locating art

CHAR_MAP = {
    "anuka":     "Anuka-Gutierrez.png",
    "avalon":    "Avalon.png",
    "carter":    "Carter-Cash.png",
    "codah":     "Codah-Alexander.png",
    "cody":      "Cody-Devine.png",
    "dean":      "Dean-Mercer.png",
    "erza":      "Erza.png",
    "franky":    "Franky-Gonzales.png",
    "hussy":     "Hussy-Steele.png",
    "jt":        "JT-Staten.png",
    "crash":     "Johnny-Crash.png",
    "glory":     "Major-Glory.png",
    "morgana":   "Morgana-Lavey.png",
    "nicky":     "Nicky-Hyde.png",
    "vigilante": "Vigilante.png",
    "zeak":      "Zeak-Gallent.png",
}


def find_content_bands_rows(arr, axis_rows=True):
    """Return list of (start, end) row ranges that contain non-white pixels."""
    content_mask = (arr[:, :, 3] > ALPHA_THRESH) & np.any(arr[:, :, :3] < CONTENT_THRESH, axis=2)
    if axis_rows:
        # Check each row for non-white pixels
        has_content = np.any(content_mask, axis=1)
    else:
        has_content = np.any(content_mask, axis=0)

    bands = []
    in_band = False
    start = 0
    for i, v in enumerate(has_content):
        if v and not in_band:
            in_band = True
            start = i
        elif not v and in_band:
            in_band = False
            bands.append((start, i - 1))
    if in_band:
        bands.append((start, len(has_content) - 1))
    return bands


def find_column_bands(section_arr, gap_min=8):
    """Return list of (x_start, x_end) column bands in a section that contain content."""
    # For each column, check if any pixel is non-white
    content_mask = (section_arr[:, :, 3] > ALPHA_THRESH) & np.any(section_arr[:, :, :3] < CONTENT_THRESH, axis=2)
    has_content = np.any(content_mask, axis=0)
    bands = []
    in_band = False
    start = 0
    gap_count = 0

    for x, v in enumerate(has_content):
        if v:
            if not in_band:
                in_band = True
                start = x
            gap_count = 0
        else:
            if in_band:
                gap_count += 1
                if gap_count >= gap_min:
                    bands.append((start, x - gap_count))
                    in_band = False
                    gap_count = 0
    if in_band:
        bands.append((start, len(has_content) - 1))
    return bands


def tight_bbox(frame_arr):
    """Return (x0, y0, x1, y1) tight bounding box of non-white content."""
    mask = (frame_arr[:, :, 3] > ALPHA_THRESH) & np.any(frame_arr[:, :, :3] < CONTENT_THRESH, axis=2)
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        return None
    y0, y1 = np.where(rows)[0][[0, -1]]
    x0, x1 = np.where(cols)[0][[0, -1]]
    return (int(x0), int(y0), int(x1), int(y1))


def remove_white_bg(img_rgba_arr):
    """BFS flood fill from all 4 edges to mark background pixels, set alpha=0."""
    arr = img_rgba_arr.copy()
    h, w = arr.shape[:2]
    white_mask = (arr[:, :, 3] <= ALPHA_THRESH) | np.all(arr[:, :, :3] >= WHITE_THRESH, axis=2)
    visited = np.zeros((h, w), dtype=bool)

    q = deque()
    for x in range(w):
        if white_mask[0, x] and not visited[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if white_mask[h - 1, x] and not visited[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if white_mask[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if white_mask[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))

    while q:
        y, x = q.popleft()
        arr[y, x, 3] = 0
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and white_mask[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    return arr


def extract_frames(char_id, src_path):
    """Extract 10 frames from a spritesheet, returns list of RGBA PIL images."""
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)

    row_bands = find_content_bands_rows(arr)
    if len(row_bands) < 2:
        print(f"  WARNING: only found {len(row_bands)} content band(s), expected 2")
        return None

    # Walk section: largest band in top half; Jump/Land: largest in bottom half
    h = arr.shape[0]
    top_bands = [b for b in row_bands if b[0] < h // 2]
    bottom_bands = [b for b in row_bands if b[1] > h // 2]

    if not top_bands or not bottom_bands:
        print(f"  WARNING: could not split into walk and jump/land sections")
        return None

    # Pick the tallest band in each half
    walk_band = max(top_bands, key=lambda b: b[1] - b[0])
    jl_band = max(bottom_bands, key=lambda b: b[1] - b[0])

    walk_section = arr[walk_band[0]:walk_band[1] + 1, :, :]
    jl_section = arr[jl_band[0]:jl_band[1] + 1, :, :]

    walk_col_bands = find_column_bands(walk_section, gap_min=4)
    jl_col_bands = find_column_bands(jl_section, gap_min=20)

    if len(walk_col_bands) < 8:
        print(f"  WARNING: found {len(walk_col_bands)} walk column bands, expected 8")
        # Try with smaller gap
        walk_col_bands = find_column_bands(walk_section, gap_min=2)

    if len(jl_col_bands) < 2:
        print(f"  WARNING: found {len(jl_col_bands)} jump/land column bands, expected 2")

    walk_col_bands = walk_col_bands[:8]
    jl_col_bands = jl_col_bands[:2]

    frames = []
    for i, (cx0, cx1) in enumerate(walk_col_bands):
        frame_arr = walk_section[:, cx0:cx1 + 1, :]
        frames.append(Image.fromarray(frame_arr))

    for cx0, cx1 in jl_col_bands:
        frame_arr = jl_section[:, cx0:cx1 + 1, :]
        frames.append(Image.fromarray(frame_arr))

    return frames


def process_character(char_id, src_path, out_dir):
    print(f"  {char_id}: extracting frames...")
    frames = extract_frames(char_id, src_path)
    if not frames or len(frames) < 10:
        print(f"  ERROR: only got {len(frames) if frames else 0} frames, skipping {char_id}")
        return None

    # Compute tight bboxes and find max content dimensions
    bboxes = []
    for f in frames:
        arr = np.array(f)
        bb = tight_bbox(arr)
        bboxes.append(bb)

    valid = [(b, f) for b, f in zip(bboxes, frames) if b is not None]
    if not valid:
        print(f"  ERROR: no valid frames for {char_id}")
        return None

    max_content_w = max(b[2] - b[0] + 1 for b, _ in valid)
    max_content_h = max(b[3] - b[1] + 1 for b, _ in valid)

    # Uniform scale: tallest frame fits in (TARGET_H - TOP_PAD), feet anchored to bottom
    scale = (TARGET_H - TOP_PAD) / max_content_h
    frame_w = int(round(max_content_w * scale))
    if frame_w % 2 != 0:
        frame_w += 1
    frame_h = TARGET_H

    print(f"  {char_id}: content {max_content_w}x{max_content_h} → frame {frame_w}x{frame_h} (scale {scale:.3f})")

    # Remove white bg from each frame, crop to content, scale uniformly, anchor to bottom
    out_frames = []
    for i, (bbox, frame_img) in enumerate(zip(bboxes, frames)):
        arr = np.array(frame_img)
        bg_removed = remove_white_bg(arr)

        if bbox is not None:
            x0, y0, x1, y1 = bbox
            cropped = bg_removed[y0:y1 + 1, x0:x1 + 1, :]
        else:
            cropped = bg_removed

        crop_img = Image.fromarray(cropped)
        cw, ch = crop_img.size
        if ch == 0:
            canvas = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
            out_frames.append(canvas)
            continue
        # Use the same uniform scale for every frame so characters stay the same size
        new_w = max(1, int(round(cw * scale)))
        new_h = max(1, int(round(ch * scale)))
        scaled = crop_img.resize((new_w, new_h), Image.LANCZOS)

        canvas = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        paste_x = (frame_w - new_w) // 2
        paste_y = frame_h - new_h  # anchor feet to bottom; top pad gives fingers room
        canvas.paste(scaled, (paste_x, paste_y), scaled)
        out_frames.append(canvas)

    # Stitch into horizontal strip
    strip = Image.new("RGBA", (frame_w * 10, frame_h), (0, 0, 0, 0))
    for i, f in enumerate(out_frames):
        strip.paste(f, (i * frame_w, 0))

    out_path = os.path.join(out_dir, f"{char_id}.png")
    strip.save(out_path, "PNG")
    print(f"  {char_id}: saved → {out_path} ({frame_w * 10}x{frame_h})")
    return frame_w, frame_h


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    frame_sizes = {}

    for char_id, src_file in CHAR_MAP.items():
        src_path = os.path.join(SRC_DIR, src_file)
        if not os.path.exists(src_path):
            print(f"MISSING: {src_path}")
            continue
        print(f"Processing {char_id} ({src_file})...")
        result = process_character(char_id, src_path, OUT_DIR)
        if result:
            frame_sizes[char_id] = result

    if frame_sizes:
        widths = [w for w, h in frame_sizes.values()]
        print(f"\nFrame widths: min={min(widths)} max={max(widths)} values={sorted(set(widths))}")
        print(f"\nAdd to BootScene.js preload():")
        print(f"  SHEET_H = 96")
        print(f"  Widths per character: {frame_sizes}")
        print(f"\nAll done. {len(frame_sizes)}/16 characters processed.")


if __name__ == "__main__":
    main()
