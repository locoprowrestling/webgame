# Walk Cycle Arrangement: Anuka Gutierrez

**Spritesheet:** `Assets/players-web/spritesheets/anuka.png`
**Total size:** 640 × 96 px
**Frame size:** 64 × 96 px (10 frames total, frames 0–7 are the active walk cycle)

## Desired slot order

| Slot | Source frame | Source X range (px) |
|------|:------------:|---------------------|
| 0 | 0 | 0 – 63 |
| 1 | 1 | 64 – 127 |
| 2 | 4 | 256 – 319 |
| 3 | 3 | 192 – 255 |
| 4 | 2 | 128 – 191 |
| 5 | 3 | 192 – 255 |
| 6 | 4 | 256 – 319 |
| 7 | 7 | 448 – 511 |

## Rearrangement script

Run this from the repo root. It reads the **original** file, then writes the rearranged version.

```python
from PIL import Image

path      = "Assets/players-web/spritesheets/anuka.png"
frame_w   = 64
frame_h   = 96
order     = [0,1,4,3,2,3,4,7]  # order[slot] = source frame index

img    = Image.open(path).convert("RGBA")
frames = [img.crop((i * frame_w, 0, i * frame_w + frame_w, frame_h))
          for i in range(img.width // frame_w)]

out = Image.new("RGBA", (frame_w * len(order), frame_h))
for slot, src in enumerate(order):
    out.paste(frames[src], (slot * frame_w, 0))

out.save(path)
print(f"Saved {path}  ({len(order)} frames × {frame_w}px)")
```

> **Note:** After running, only frames 0–7 are used by the game engine (BootScene `walk_anuka` animation).
> Any extra frames in the source sheet beyond index 7 are preserved but not played.
