# Walk Cycle Arrangement: Avalon

**Spritesheet:** `Assets/players-web/spritesheets/avalon.png`
**Total size:** 620 × 96 px
**Frame size:** 62 × 96 px (10 frames total, frames 0–7 are the active walk cycle)

## Desired slot order

| Slot | Source frame | Source X range (px) |
|------|:------------:|---------------------|
| 0 | 4 | 248 – 309 |
| 1 | 1 | 62 – 123 |
| 2 | 2 | 124 – 185 |
| 3 | 4 | 248 – 309 |
| 4 | 5 | 310 – 371 |
| 5 | 3 | 186 – 247 |
| 6 | 6 | 372 – 433 |
| 7 | 7 | 434 – 495 |

## Rearrangement script

Run this from the repo root. It reads the **original** file, then writes the rearranged version.

```python
from PIL import Image

path      = "Assets/players-web/spritesheets/avalon.png"
frame_w   = 62
frame_h   = 96
order     = [4,1,2,4,5,3,6,7]  # order[slot] = source frame index

img    = Image.open(path).convert("RGBA")
frames = [img.crop((i * frame_w, 0, i * frame_w + frame_w, frame_h))
          for i in range(img.width // frame_w)]

out = Image.new("RGBA", (frame_w * len(order), frame_h))
for slot, src in enumerate(order):
    out.paste(frames[src], (slot * frame_w, 0))

out.save(path)
print(f"Saved {path}  ({len(order)} frames × {frame_w}px)")
```

> **Note:** After running, only frames 0–7 are used by the game engine (BootScene `walk_avalon` animation).
> Any extra frames in the source sheet beyond index 7 are preserved but not played.
