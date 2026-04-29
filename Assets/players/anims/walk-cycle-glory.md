# Walk Cycle Arrangement: Major Glory

**Spritesheet:** `Assets/players-web/spritesheets/glory.png`
**Total size:** 680 × 96 px
**Frame size:** 68 × 96 px (10 frames total, frames 0–7 are the active walk cycle)

## Desired slot order

| Slot | Source frame | Source X range (px) |
|------|:------------:|---------------------|
| 0 | 3 | 204 – 271 |
| 1 | 4 | 272 – 339 |
| 2 | 5 | 340 – 407 |
| 3 | 6 | 408 – 475 |
| 4 | 7 | 476 – 543 |
| 5 | 4 | 272 – 339 |
| 6 | 3 | 204 – 271 |
| 7 | 0 | 0 – 67 |

## Rearrangement script

Run this from the repo root. It reads the **original** file, then writes the rearranged version.

```python
from PIL import Image

path      = "Assets/players-web/spritesheets/glory.png"
frame_w   = 68
frame_h   = 96
order     = [3,4,5,6,7,4,3,0]  # order[slot] = source frame index

img    = Image.open(path).convert("RGBA")
frames = [img.crop((i * frame_w, 0, i * frame_w + frame_w, frame_h))
          for i in range(img.width // frame_w)]

out = Image.new("RGBA", (frame_w * len(order), frame_h))
for slot, src in enumerate(order):
    out.paste(frames[src], (slot * frame_w, 0))

out.save(path)
print(f"Saved {path}  ({len(order)} frames × {frame_w}px)")
```

> **Note:** After running, only frames 0–7 are used by the game engine (BootScene `walk_glory` animation).
> Any extra frames in the source sheet beyond index 7 are preserved but not played.
