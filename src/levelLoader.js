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

export function buildPlatforms(scene, levelData) {
  const group = scene.physics.add.staticGroup();
  const PLAT_H = 16;

  (levelData.platforms || []).forEach(p => {
    const cx = p.x + p.width / 2;
    const cy = p.y + PLAT_H / 2;
    const plat = scene.add.rectangle(cx, cy, p.width, PLAT_H, 0x8b6914);
    scene.physics.add.existing(plat, true);
    plat.isCrumbling = p.crumbling || false;
    group.add(plat);
  });

  return group;
}

export function getCheckpoints(levelData) {
  return levelData.checkpoints || [];
}
