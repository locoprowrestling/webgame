// Fetches and parses a level JSON, then builds physics bodies + obstacle spawn data.
// Returns a structured object ready for GameScene to consume.

export async function loadLevel(scene, levelNum) {
  const id = String(levelNum).padStart(2, '0');
  const res = await fetch(`levels/level-${id}.json`);
  if (!res.ok) throw new Error(`Level ${levelNum} not found`);
  return res.json();
}

const GROUND_Y = 456;   // top of ground strip (canvas height 500 - 44px)
const GROUND_H = 44;
const CANVAS_W = 800;

export function buildGround(scene, levelData) {
  const group = scene.physics.add.staticGroup();

  const gaps = levelData.gaps || [];
  // Build sorted list of gap ranges
  const gapRanges = gaps.map(g => ({ start: g.x, end: g.x + g.width }))
    .sort((a, b) => a.start - b.start);

  // Create ground segments between gaps
  const segments = [];
  let cursor = 0;
  for (const gap of gapRanges) {
    if (gap.start > cursor) segments.push({ x: cursor, width: gap.start - cursor });
    cursor = gap.end;
  }
  segments.push({ x: cursor, width: levelData.endX - cursor });

  segments.forEach(seg => {
    const cx = seg.x + seg.width / 2;
    const cy = GROUND_Y + GROUND_H / 2;
    const body = scene.add.rectangle(cx, cy, seg.width, GROUND_H, 0x4a8c2a);
    scene.physics.add.existing(body, true);
    group.add(body);
  });

  return group;
}

const PLAT_H = 16;   // physics collision height
const SPRITE_H = 32; // visual height
const CAP_W = 28;    // width of each endcap sprite

export function buildPlatforms(scene, levelData) {
  const group = scene.physics.add.staticGroup();

  (levelData.platforms || []).forEach(p => {
    const cx = p.x + p.width / 2;
    const spriteY = p.y + SPRITE_H / 2;
    const centerW = p.width - CAP_W * 2;
    const visuals = [];

    if (centerW > 0) {
      // Left cap
      visuals.push(
        scene.add.image(p.x + CAP_W / 2, spriteY, 'platform_cap')
          .setDepth(6),
      );
      // Tiled center
      visuals.push(
        scene.add.tileSprite(p.x + CAP_W + centerW / 2, spriteY, centerW, SPRITE_H, 'platform_mid')
          .setDepth(6),
      );
      // Right cap (mirrored)
      visuals.push(
        scene.add.image(p.x + p.width - CAP_W / 2, spriteY, 'platform_cap')
          .setFlipX(true).setDepth(6),
      );
    } else {
      // Platform too narrow for caps — use the full-design sprite stretched to fit
      visuals.push(
        scene.add.image(cx, spriteY, 'platform_full')
          .setDisplaySize(p.width, SPRITE_H).setDepth(6),
      );
    }

    visuals.push(
      scene.add.rectangle(cx, p.y + 3, p.width - 8, 3, 0xf0d24f, 0.72)
        .setDepth(6.1),
    );

    // Invisible physics body — top edge aligns with top of sprite
    const body = scene.add.rectangle(cx, p.y + PLAT_H / 2, p.width, PLAT_H)
      .setVisible(false);
    scene.physics.add.existing(body, true);
    body.isCrumbling = p.crumbling || false;
    body._visuals = visuals;
    group.add(body);
  });

  return group;
}

export function getCheckpoints(levelData) {
  return levelData.checkpoints || [];
}
