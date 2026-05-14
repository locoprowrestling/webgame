import { CHARACTERS } from '../src/characters.js';
import {
  ANIMATED_OBSTACLE_TYPES,
  getObstacleAnimConfig,
  getObstacleDef,
  getObstacleFrameTextureKey,
} from '../src/obstacles.js';

const SHEET_H = 96;
const OBSTACLE_SHEET_COLS = 4;
const OBSTACLE_FRAME_W = 192;
const OBSTACLE_FRAME_H = 256;
const OBSTACLE_SCAN_TOP = 84;
const OBSTACLE_ALPHA_THRESHOLD = 24;
const STATIC_OBSTACLE_TYPES = [
  'turnbuckle',
  'steel_steps',
  'folding_chair',
  'crowd_barrier',
  'spotlight',
];

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Make character data globally accessible (avoids re-importing in non-module contexts)
    window.__LCP__ = { CHARACTERS };

    this._createLoadingUI();

    // Load all character portraits and spritesheets
    CHARACTERS.forEach(c => {
      this.load.image(`portrait_${c.id}`, c.portrait);
      if (c.logo) this.load.image(`logo_${c.id}`, c.logo);
      this.load.spritesheet(
        `sheet_${c.id}`,
        `Assets/players-web/spritesheets/${c.id}.png`,
        { frameWidth: c.sheetW, frameHeight: SHEET_H },
      );
    });

    // Load faction + brand logos
    this.load.image('logo_rising', 'Assets/logos-web/logo-the-rising.png');
    this.load.image('logo_pillars', 'Assets/logos-web/logo-the-pillars.png');
    this.load.image('logo_locopro', 'Assets/logos-web/logo-locopro-primary-mark-thumb.png');

    // Source sheets contain labels and empty padding, so gameplay frames are
    // cropped into clean textures in create() before animations are built.
    ANIMATED_OBSTACLE_TYPES.forEach(type =>
      this.load.image(`obs_src_${type}`, `Assets/obstacles-web/${type}.png`),
    );

    // Static single-frame obstacles
    STATIC_OBSTACLE_TYPES.forEach(type =>
      this.load.image(`obs_${type}`, `Assets/obstacles-web/${type}.png`),
    );

    this.load.image('collectible_belt', 'Assets/collectibles/championship_belt.png');
    this.load.image('collectible_shirt', 'Assets/collectibles/loco_pro_shirt.png');
    this.load.image('collectible_star', 'Assets/collectibles/star.png');
    this.load.image('collectible_heart', 'Assets/collectibles/heart.png');

    // Ground / floor tiles and water background tiles
    ['asphalt_road', 'dry_grass_tile', 'floor_boards', 'grass_tile'].forEach(name => {
      this.load.image(`tile_${name}_01`, `Assets/bg_tiles/${name}_01.png`);
      this.load.image(`tile_${name}_02`, `Assets/bg_tiles/${name}_02.png`);
    });
    this.load.image('tile_water_flow_01', 'Assets/bg_tiles/water_flow_01.png');
    this.load.image('tile_water_flow_02', 'Assets/bg_tiles/water_flow_02.png');
    this.load.image('bg_lp_1', 'Assets/bg_tiles/bg-lp-1.png');
    this.load.image('bg_lp_2', 'Assets/bg_tiles/bg-lp-2.png');
    this.load.image('bg_dt_1', 'Assets/bg_tiles/bg-dt-1.png?v=2');
    this.load.image('bg_dt_2', 'Assets/bg_tiles/bg-dt-2.png');
    this.load.image('bg_fh_1', 'Assets/bg_tiles/bg-fh-1.png');
    this.load.image('bg_fg_1', 'Assets/bg_tiles/bg-fg-1.png');
    this.load.image('bg_fg_mid_1', 'Assets/bg_tiles/fairgrounds_middle_01.png');
    this.load.image('bg_arena_1', 'Assets/bg_tiles/bg-arena-1.png');
    this.load.image('platform_cap', 'Assets/bg_tiles/platform-cap.png');
    this.load.image('platform_mid', 'Assets/bg_tiles/platform-mid.png');
    this.load.image('platform_full', 'Assets/bg_tiles/platform-full.png');
    this.load.image('platform_crumbling_cap', 'Assets/bg_tiles/platform-crumbling-cap.png');
    this.load.image('platform_crumbling_mid', 'Assets/bg_tiles/platform-crumbling-mid.png');
    this.load.image('platform_crumbling_full', 'Assets/bg_tiles/platform-crumbling-full.png');
    this.load.spritesheet('flag', 'Assets/sprites/finish-flag.png', { frameWidth: 144, frameHeight: 224 });

    this.load.on('progress', v => this._updateBar(v));
  }

  create() {
    CHARACTERS.forEach(c => {
      this.anims.create({
        key: `walk_${c.id}`,
        frames: this.anims.generateFrameNumbers(`sheet_${c.id}`, { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });
    });
    this.anims.create({
      key: 'flag_wave',
      frames: this.anims.generateFrameNumbers('flag', { start: 0, end: 2 }),
      frameRate: 6,
      repeat: -1,
    });

    this._buildBackgroundTextures();
    this._buildObstacleTextures();
    this._buildObstacleFrameTextures();
    this._buildStaticObstacleTextures();
    this._buildObstacleAnims();
    this._buildCollectibleTextures();
    this.scene.start('TitleScene');
  }

  _createLoadingUI() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a0a);
    this.add.text(width / 2, height / 2 - 40, 'LOCOPRO', {
      fontSize: '28px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffd700', stroke: '#aa6600', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 10, 'CHAMPIONSHIP RUN', {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this._barBg = this.add.rectangle(width / 2, height / 2 + 40, 400, 12, 0x333333).setOrigin(0.5);
    this._bar = this.add.rectangle(width / 2 - 200, height / 2 + 40, 0, 12, 0xffd700).setOrigin(0, 0.5);
    this._loadText = this.add.text(width / 2, height / 2 + 62, 'Loading...', {
      fontSize: '7px', color: '#aaaaaa', fontFamily: '"Press Start 2P", monospace',
    }).setOrigin(0.5);
  }

  _updateBar(value) {
    this._bar.width = 400 * value;
    this._loadText.setText(`Loading... ${Math.floor(value * 100)}%`);
  }

  _buildBackgroundTextures() {
    // Zone 1 – Greenway: bright sky + white mountains + green hill
    this._makeMountainTex('bg_mtn_z1', 400, 120, 0xf0f8ff, [
      [0,120, 50,35, 100,65, 160,15, 220,45, 280,20, 340,50, 400,120]
    ]);
    this._makeMountainTex('bg_hill_z1', 400, 60, 0x5aaa30, [
      [0,60, 40,25, 100,40, 180,15, 260,35, 340,20, 400,60]
    ]);

    // Zone 2 – Downtown: sky + building silhouettes
    this._makeBuildingTex('bg_bld_z2', 400, 140);

    // Zone 3 – Foothills: darker peaks + pine trees
    this._makeMountainTex('bg_mtn_z3', 400, 140, 0xc8d8e8, [
      [0,140, 60,40, 110,75, 180,10, 250,55, 320,25, 400,140]
    ]);
    this._makePineTex('bg_pine_z3', 400, 70);

    // Zone 4 – Fairgrounds: open fields + tent peaks
    this._makeTentTex('bg_tent_z4', 400, 80);

    // Zone 5 – Arena: black with crowd silhouette
    this._makeCrowdTex('bg_crowd_z5', 400, 80);
  }

  _makeMountainTex(key, w, h, color, pointArrays) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    pointArrays.forEach(pts => {
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i+1]);
      g.closePath(); g.fillPath();
    });
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _makeBuildingTex(key, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x334455, 1);
    const buildings = [
      [10,h,40,80], [60,h,30,60], [100,h,50,100], [160,h,35,70],
      [205,h,25,90], [240,h,45,55], [295,h,60,110], [365,h,30,75],
    ];
    buildings.forEach(([x,base,bw,bh]) => g.fillRect(x, base-bh, bw, bh));
    // Windows
    g.fillStyle(0xffee88, 0.6);
    buildings.forEach(([x,base,bw,bh]) => {
      for (let wy = base-bh+6; wy < base-6; wy += 14) {
        for (let wx = x+4; wx < x+bw-4; wx += 10) {
          if (Math.random() > 0.4) g.fillRect(wx, wy, 5, 7);
        }
      }
    });
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _makePineTex(key, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x2a6a1a, 1);
    for (let x = 0; x < w; x += 40) {
      g.fillTriangle(x+20, 0, x, h, x+40, h);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _makeTentTex(key, w, h) {
    const g = this.add.graphics();
    const colors = [0xcc2200, 0xffffff, 0x2244cc, 0xcc2200];
    for (let i = 0; i < 4; i++) {
      g.fillStyle(colors[i % colors.length], 1);
      const x = i * 100;
      g.fillTriangle(x+50, 0, x, h, x+100, h);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _makeCrowdTex(key, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x111111, 1);
    for (let x = 5; x < w; x += 18) {
      const headH = 12 + Math.floor(Math.random() * 10);
      g.fillCircle(x, h - headH - 10, 7);
      g.fillRect(x - 6, h - 10, 12, 14);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _buildObstacleAnims() {
    ANIMATED_OBSTACLE_TYPES.forEach(type => {
      const config = getObstacleAnimConfig(type);
      const frames = config.frames
        .map(frame => ({ key: getObstacleFrameTextureKey(type, frame) }))
        .filter(frame => this.textures.exists(frame.key));

      if (frames.length === 0) return;

      this.anims.create({
        key: `obs_anim_${type}`,
        frames,
        frameRate: config.frameRate,
        repeat: -1,
      });
    });
  }

  _buildObstacleTextures() {
    // Fallback finish flag if the sprite asset fails to load.
    if (!this.textures.exists('flag')) {
      const g = this.add.graphics();
      g.fillStyle(0xffd700, 1); g.fillRect(0, 0, 24, 16);
      g.fillStyle(0x000000, 1);
      g.fillRect(4, 4, 6, 4); g.fillRect(10, 0, 6, 4); g.fillRect(16, 4, 6, 4);
      g.lineStyle(3, 0x888888, 1); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 48); g.strokePath();
      g.generateTexture('flag', 24, 48);
      g.destroy();
    }

    // Checkpoint checkmarks — unlit (transparent) and lit (solid glow)
    const drawCheck = (g) => {
      g.beginPath(); g.moveTo(7, 22); g.lineTo(16, 32); g.lineTo(37, 10); g.strokePath();
    };

    const cu = this.add.graphics();
    cu.fillStyle(0x111111, 0.55); cu.fillRoundedRect(0, 0, 44, 44, 8);
    cu.lineStyle(2, 0x00dd44, 0.5); cu.strokeRoundedRect(0, 0, 44, 44, 8);
    cu.lineStyle(5, 0x00dd44, 0.45); drawCheck(cu);
    cu.generateTexture('checkpoint', 44, 44);
    cu.destroy();

    const cl = this.add.graphics();
    cl.fillStyle(0x003311, 0.85); cl.fillRoundedRect(0, 0, 44, 44, 8);
    cl.lineStyle(2, 0x44ff88, 1); cl.strokeRoundedRect(0, 0, 44, 44, 8);
    cl.lineStyle(11, 0x00ff66, 0.35); drawCheck(cl);
    cl.lineStyle(5, 0x44ff88, 1); drawCheck(cl);
    cl.generateTexture('checkpoint_lit', 44, 44);
    cl.destroy();

    // Collectible gem — gold 5-point star
    const cg = this.add.graphics();
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 10 : 4;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: 12 + r * Math.cos(a), y: 12 + r * Math.sin(a) });
    }
    cg.fillStyle(0xffd700);
    cg.fillPoints(pts, true);
    cg.fillStyle(0xffee88, 0.6);
    cg.fillCircle(12, 12, 4);
    cg.generateTexture('collectible', 24, 24);
    cg.destroy();
  }

  _buildObstacleFrameTextures() {
    const scratch = document.createElement('canvas');
    scratch.width = OBSTACLE_FRAME_W;
    scratch.height = OBSTACLE_FRAME_H;
    const scratchContext = scratch.getContext('2d', { willReadFrequently: true });

    ANIMATED_OBSTACLE_TYPES.forEach(type => {
      const sourceKey = `obs_src_${type}`;
      if (!this.textures.exists(sourceKey)) return;

      const texture = this.textures.get(sourceKey);
      const source = texture.getSourceImage();
      const def = getObstacleDef(type);
      const frameCount = Math.floor(source.width / OBSTACLE_FRAME_W) * Math.floor(source.height / OBSTACLE_FRAME_H);

      for (let frame = 0; frame < frameCount; frame++) {
        const frameX = (frame % OBSTACLE_SHEET_COLS) * OBSTACLE_FRAME_W;
        const frameY = Math.floor(frame / OBSTACLE_SHEET_COLS) * OBSTACLE_FRAME_H;
        const bounds = this._findObstacleArtBounds(source, frameX, frameY, scratchContext);
        this._createObstacleFrameTexture(type, frame, source, frameX, frameY, bounds, def);
      }
    });
  }

  _buildStaticObstacleTextures() {
    STATIC_OBSTACLE_TYPES.forEach(type => {
      const def = getObstacleDef(type);
      const key = getObstacleFrameTextureKey(type, 0);
      const sourceKey = `obs_${type}`;

      if (this.textures.exists(sourceKey)) {
        const source = this.textures.get(sourceKey).getSourceImage();
        const bounds = this._findStaticArtBounds(source);
        this._createStaticObstacleFrameTexture(key, source, bounds, def);
        return;
      }

      const graphics = this.add.graphics();
      def.draw(graphics);
      graphics.generateTexture(key, def.w, def.h);
      graphics.destroy();
    });
  }

  _findStaticArtBounds(source) {
    const scratch = document.createElement('canvas');
    scratch.width = source.width;
    scratch.height = source.height;
    const context = scratch.getContext('2d', { willReadFrequently: true });
    context.clearRect(0, 0, source.width, source.height);
    context.drawImage(source, 0, 0);

    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const alpha = pixels[((y * source.width + x) * 4) + 3];
        if (alpha <= OBSTACLE_ALPHA_THRESHOLD) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      return { x: 0, y: 0, w: source.width, h: source.height };
    }

    return {
      x: Math.max(0, minX - 2),
      y: Math.max(0, minY - 2),
      w: Math.min(source.width - 1, maxX + 2) - Math.max(0, minX - 2) + 1,
      h: Math.min(source.height - 1, maxY + 2) - Math.max(0, minY - 2) + 1,
    };
  }

  _createStaticObstacleFrameTexture(key, source, bounds, def) {
    const texture = this.textures.createCanvas(key, def.w, def.h);
    const context = texture.getContext();
    const scale = Math.min(def.w / bounds.w, def.h / bounds.h);
    const drawW = Math.max(1, Math.round(bounds.w * scale));
    const drawH = Math.max(1, Math.round(bounds.h * scale));
    const drawX = Math.round((def.w - drawW) / 2);
    const drawY = Math.round(def.h - drawH);

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, def.w, def.h);
    context.drawImage(
      source,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      drawX,
      drawY,
      drawW,
      drawH,
    );
    texture.refresh();
  }

  _findObstacleArtBounds(source, frameX, frameY, scratchContext) {
    scratchContext.clearRect(0, 0, OBSTACLE_FRAME_W, OBSTACLE_FRAME_H);
    scratchContext.drawImage(
      source,
      frameX,
      frameY,
      OBSTACLE_FRAME_W,
      OBSTACLE_FRAME_H,
      0,
      0,
      OBSTACLE_FRAME_W,
      OBSTACLE_FRAME_H,
    );

    const pixels = scratchContext.getImageData(0, 0, OBSTACLE_FRAME_W, OBSTACLE_FRAME_H).data;
    const visited = new Uint8Array(OBSTACLE_FRAME_W * OBSTACLE_FRAME_H);
    let best = null;

    const isArtPixel = (x, y) => {
      if (x < 0 || x >= OBSTACLE_FRAME_W || y < OBSTACLE_SCAN_TOP || y >= OBSTACLE_FRAME_H) return false;
      const index = y * OBSTACLE_FRAME_W + x;
      return !visited[index] && pixels[(index * 4) + 3] > OBSTACLE_ALPHA_THRESHOLD;
    };

    for (let y = OBSTACLE_SCAN_TOP; y < OBSTACLE_FRAME_H; y++) {
      for (let x = 0; x < OBSTACLE_FRAME_W; x++) {
        if (!isArtPixel(x, y)) continue;

        const stack = [y * OBSTACLE_FRAME_W + x];
        visited[y * OBSTACLE_FRAME_W + x] = 1;
        let count = 0;
        let minX = x;
        let minY = y;
        let maxX = x;
        let maxY = y;

        while (stack.length > 0) {
          const index = stack.pop();
          const px = index % OBSTACLE_FRAME_W;
          const py = Math.floor(index / OBSTACLE_FRAME_W);
          count++;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);

          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (ox === 0 && oy === 0) continue;
              const nx = px + ox;
              const ny = py + oy;
              if (!isArtPixel(nx, ny)) continue;
              const nextIndex = ny * OBSTACLE_FRAME_W + nx;
              visited[nextIndex] = 1;
              stack.push(nextIndex);
            }
          }
        }

        if (!best || count > best.count) {
          best = { count, minX, minY, maxX, maxY };
        }
      }
    }

    if (!best) {
      return { x: 0, y: OBSTACLE_SCAN_TOP, w: OBSTACLE_FRAME_W, h: OBSTACLE_FRAME_H - OBSTACLE_SCAN_TOP };
    }

    const minX = Math.max(0, best.minX - 3);
    const minY = Math.max(OBSTACLE_SCAN_TOP, best.minY - 3);
    const maxX = Math.min(OBSTACLE_FRAME_W - 1, best.maxX + 3);
    const maxY = Math.min(OBSTACLE_FRAME_H - 1, best.maxY + 3);

    return {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
    };
  }

  _createObstacleFrameTexture(type, frame, source, frameX, frameY, bounds, def) {
    const key = getObstacleFrameTextureKey(type, frame);
    const texture = this.textures.createCanvas(key, def.w, def.h);
    const context = texture.getContext();
    const scale = Math.min(def.w / bounds.w, def.h / bounds.h);
    const drawW = Math.max(1, Math.round(bounds.w * scale));
    const drawH = Math.max(1, Math.round(bounds.h * scale));
    const drawX = Math.round((def.w - drawW) / 2);
    const drawY = Math.round(def.h - drawH);

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, def.w, def.h);
    context.drawImage(
      source,
      frameX + bounds.x,
      frameY + bounds.y,
      bounds.w,
      bounds.h,
      drawX,
      drawY,
      drawW,
      drawH,
    );
    texture.refresh();
  }

  _buildCollectibleTextures() {
    // Fallback orb — used when a specific type texture is missing
    const orb = this.add.graphics();
    orb.fillStyle(0xffd700, 1);
    orb.fillCircle(14, 14, 12);
    orb.fillStyle(0xffffff, 0.4);
    orb.fillCircle(10, 10, 5);
    orb.generateTexture('collectible', 28, 28);
    orb.destroy();

    // Star
    const star = this.add.graphics();
    star.fillStyle(0xffd700, 1);
    star.lineStyle(1, 0xffa500, 1);
    star.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 12 : 5;
      const angle = (i * Math.PI / 5) - Math.PI / 2;
      const x = 14 + r * Math.cos(angle);
      const y = 14 + r * Math.sin(angle);
      if (i === 0) star.moveTo(x, y); else star.lineTo(x, y);
    }
    star.closePath();
    star.fillPath();
    star.strokePath();
    star.generateTexture('collectible_star', 28, 28);
    star.destroy();

    // Championship belt
    const belt = this.add.graphics();
    belt.fillStyle(0xffd700, 1);
    belt.fillRect(0, 4, 44, 16);
    belt.fillStyle(0xcc8800, 1);
    belt.fillRect(3, 6, 6, 12);
    belt.fillRect(35, 6, 6, 12);
    belt.fillStyle(0xffa500, 1);
    belt.fillEllipse(22, 12, 18, 14);
    belt.fillStyle(0xffffff, 0.85);
    belt.fillCircle(22, 12, 4);
    belt.generateTexture('collectible_belt', 44, 24);
    belt.destroy();

    // Heart
    const heart = this.add.graphics();
    heart.fillStyle(0xff4444, 1);
    heart.fillCircle(9, 10, 8);
    heart.fillCircle(19, 10, 8);
    heart.fillTriangle(1, 13, 27, 13, 14, 26);
    heart.generateTexture('collectible_heart', 28, 26);
    heart.destroy();

    // Shirt
    const shirt = this.add.graphics();
    shirt.fillStyle(0xffffff, 0.9);
    shirt.fillRect(5, 10, 20, 18);
    shirt.fillRect(0, 8, 8, 10);
    shirt.fillRect(22, 8, 8, 10);
    shirt.fillStyle(0xdddddd, 1);
    shirt.fillEllipse(15, 10, 10, 8);
    shirt.generateTexture('collectible_shirt', 30, 28);
    shirt.destroy();
  }
}
