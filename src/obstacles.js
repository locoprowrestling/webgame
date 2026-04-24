// Obstacle type registry: defines visual drawing + hitbox + behavior for each obstacle type.
// spawnObstacle() is called by the level loader to create each obstacle in GameScene.

export const ANIMATED_OBSTACLE_TYPES = [
  'boulder',
  'tumbleweed',
  'deer',
  'hawk',
  'cyclist',
  'hay_bale',
  'rattlesnake',
  'road_cone',
  'prairie_dog',
];

const DEFAULT_ANIM_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];

const DEFS = {
  prairie_dog: {
    w: 48, h: 56, bodyW: 32, bodyH: 44, flipX: true,
    // The source spritesheet includes digging/burrowed poses that make
    // the hazard read as missing in Level 1. Keep only clearly visible poses.
    animFrames: [0, 1, 2, 3, 4, 6],
    animFrameRate: 6,
    draw(g) {
      g.fillStyle(0x8b6914, 1); g.fillEllipse(11, 18, 22, 24);
      g.fillStyle(0xc8a050, 1); g.fillCircle(11, 8, 9);
      g.fillStyle(0x111111, 1); g.fillCircle(8, 6, 2); g.fillCircle(14, 6, 2);
    },
    behavior: 'static',
  },
  tumbleweed: {
    w: 64, h: 64, bodyW: 44, bodyH: 44,
    draw(g) {
      g.fillStyle(0x9b7a3a, 0.85); g.fillCircle(18, 18, 17);
      g.lineStyle(2, 0x7a5a20, 0.6);
      g.strokeCircle(18, 18, 10); g.strokeCircle(18, 18, 6);
      g.beginPath(); g.moveTo(1, 18); g.lineTo(35, 18); g.strokePath();
      g.beginPath(); g.moveTo(18, 1); g.lineTo(18, 35); g.strokePath();
    },
    behavior: 'rolling',
  },
  hay_bale: {
    w: 80, h: 60, bodyW: 58, bodyH: 42,
    draw(g) {
      g.fillStyle(0xe8c840, 1); g.fillRect(0, 0, 48, 36);
      g.lineStyle(3, 0xaa8800, 1);
      g.strokeRect(1, 1, 46, 34);
      g.beginPath(); g.moveTo(0, 12); g.lineTo(48, 12); g.strokePath();
      g.beginPath(); g.moveTo(0, 24); g.lineTo(48, 24); g.strokePath();
    },
    behavior: 'static',
  },
  road_cone: {
    w: 40, h: 60,
    draw(g) {
      g.fillStyle(0xff6600, 1);
      g.fillTriangle(12, 0, 0, 36, 24, 36);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 14, 20, 5);
      g.fillStyle(0x888888, 1); g.fillRect(0, 36, 24, 4);
    },
    behavior: 'static',
  },
  deer: {
    w: 80, h: 96,
    draw(g) {
      g.fillStyle(0xaa7722, 1);
      g.fillRect(8, 24, 34, 28);
      g.fillStyle(0xcc9944, 1);
      g.fillEllipse(36, 18, 22, 20);
      g.fillStyle(0xaa7722, 1);
      g.fillRect(10, 50, 10, 16); g.fillRect(30, 50, 10, 16);
      g.fillStyle(0x442200, 1);
      g.fillRect(30, 0, 4, 18); g.fillRect(36, 0, 4, 14);
    },
    behavior: 'pacing',
  },
  cyclist: {
    w: 96, h: 80,
    draw(g) {
      g.lineStyle(3, 0x333333, 1);
      g.strokeCircle(14, 38, 13); g.strokeCircle(46, 38, 13);
      g.beginPath(); g.moveTo(14, 38); g.lineTo(30, 20); g.lineTo(46, 38); g.strokePath();
      g.beginPath(); g.moveTo(30, 20); g.lineTo(30, 38); g.strokePath();
      g.fillStyle(0x2255cc, 1);
      g.fillRect(26, 4, 12, 20);
      g.fillStyle(0xffcc88, 1); g.fillCircle(30, 4, 7);
    },
    behavior: 'moving_left',
  },
  boulder: {
    w: 64, h: 60,
    draw(g) {
      g.fillStyle(0x888880, 1); g.fillEllipse(22, 20, 44, 40);
      g.fillStyle(0xaaa898, 0.5); g.fillEllipse(14, 12, 14, 10);
      g.lineStyle(2, 0x555550, 0.7); g.strokeEllipse(22, 20, 44, 40);
    },
    behavior: 'rolling',
  },
  crumbling_platform: {
    w: 96, h: 16,
    draw(g) {
      g.fillStyle(0x8b6914, 1); g.fillRect(0, 0, 96, 16);
      g.fillStyle(0xaa8820, 0.6);
      g.fillRect(4, 2, 28, 6); g.fillRect(36, 2, 20, 6); g.fillRect(60, 2, 30, 6);
      g.lineStyle(1, 0x5a4000, 0.8);
      g.beginPath(); g.moveTo(32, 0); g.lineTo(30, 16); g.strokePath();
      g.beginPath(); g.moveTo(58, 0); g.lineTo(56, 16); g.strokePath();
    },
    behavior: 'crumbling',
  },
  hawk: {
    w: 80, h: 36,
    draw(g) {
      g.fillStyle(0x442200, 1);
      g.fillTriangle(24, 0, 0, 24, 48, 24);
      g.fillStyle(0xff4400, 1); g.fillCircle(24, 5, 5);
      g.fillStyle(0xffff00, 1); g.fillTriangle(22, 5, 26, 5, 24, 10);
    },
    behavior: 'airborne_sine',
  },
  steel_steps: {
    w: 64, h: 52,
    draw(g) {
      g.fillStyle(0x888888, 1);
      g.fillRect(0, 24, 44, 12);
      g.fillRect(0, 12, 30, 12);
      g.fillRect(0, 0, 16, 12);
      g.lineStyle(1, 0x444444, 1);
      g.strokeRect(0, 24, 44, 12); g.strokeRect(0, 12, 30, 12); g.strokeRect(0, 0, 16, 12);
    },
    behavior: 'projectile',
  },
  rattlesnake: {
    w: 80, h: 28,
    draw(g) {
      g.fillStyle(0x6a8a2a, 1);
      g.fillEllipse(8, 9, 16, 18);
      g.fillRect(8, 6, 32, 6);
      g.fillStyle(0x4a6a1a, 0.6);
      for (let i = 0; i < 4; i++) g.fillRect(10 + i * 8, 6, 4, 6);
      g.fillStyle(0xddcc22, 1); g.fillTriangle(40, 6, 48, 9, 40, 12);
      g.fillStyle(0xff0000, 1); g.fillRect(44, 8, 5, 2);
    },
    behavior: 'static',
  },
  folding_chair: {
    w: 48, h: 68,
    draw(g) {
      g.fillStyle(0xddcc44, 1); g.fillRect(4, 4, 24, 20);
      g.lineStyle(3, 0x888800, 1);
      g.beginPath(); g.moveTo(6, 24); g.lineTo(4, 44); g.strokePath();
      g.beginPath(); g.moveTo(26, 24); g.lineTo(28, 44); g.strokePath();
      g.beginPath(); g.moveTo(4, 4); g.lineTo(2, 0); g.strokePath();
      g.beginPath(); g.moveTo(28, 4); g.lineTo(30, 0); g.strokePath();
    },
    behavior: 'static',
  },
  turnbuckle: {
    w: 28, h: 80,
    draw(g) {
      g.fillStyle(0xcc0000, 1); g.fillRect(0, 0, 20, 60);
      g.fillStyle(0xaaaaaa, 1); g.fillRect(4, 0, 12, 8); g.fillRect(4, 52, 12, 8);
      g.fillStyle(0xffffff, 0.3); g.fillRect(14, 0, 4, 60);
    },
    behavior: 'static',
  },
  crowd_barrier: {
    w: 72, h: 32,
    draw(g) {
      g.fillStyle(0x446688, 1); g.fillRect(0, 8, 72, 24);
      g.lineStyle(3, 0x99bbdd, 1);
      for (let i = 0; i <= 4; i++) {
        g.beginPath(); g.moveTo(i * 18, 8); g.lineTo(i * 18, 32); g.strokePath();
      }
      g.fillStyle(0x99bbdd, 1); g.fillRect(0, 8, 72, 4);
    },
    behavior: 'static',
  },
  spotlight: {
    w: 30, h: 16,
    draw(g) {
      g.fillStyle(0x222222, 1); g.fillRect(8, 0, 14, 10);
      g.fillStyle(0xffffaa, 0.9); g.fillCircle(15, 10, 7);
    },
    behavior: 'airborne_static',
  },
};

export function getObstacleDef(type) {
  return DEFS[type] || DEFS.prairie_dog;
}

export function getObstacleAnimConfig(type) {
  const def = getObstacleDef(type);
  return {
    frames: def.animFrames || DEFAULT_ANIM_FRAMES,
    frameRate: def.animFrameRate || 8,
  };
}

export function getObstacleFrameTextureKey(type, frame = 0) {
  return `obs_${type}_${frame}`;
}

function applyObstacleBody(obj, def) {
  if (!obj.body) return;

  const bodyW = def.bodyW || Math.max(12, Math.round(def.w * 0.72));
  const bodyH = def.bodyH || Math.max(12, Math.round(def.h * 0.78));
  obj.body.setAllowGravity(false);
  obj.body.setGravityY(0);
  if (def.behavior !== 'projectile') obj.body.setVelocityY(0);
  obj.body.setSize(bodyW, bodyH);
  obj.body.setOffset(
    Math.round((def.w - bodyW) / 2),
    Math.round(def.h - bodyH),
  );
}

function applyObstacleBehavior(obj, def, config, x, y) {
  switch (def.behavior) {
    case 'rolling':
      obj.body.setVelocityX(config.speed || -60);
      break;
    case 'pacing':
      obj._paceMin = config.paceMin || (x - 120);
      obj._paceMax = config.paceMax || (x + 120);
      obj._paceDir = 1;
      obj.body.setVelocityX(50);
      break;
    case 'moving_left':
      obj.body.setVelocityX(config.speed || -180);
      break;
    case 'projectile':
      obj.body.setVelocityX(config.speed || -320);
      obj.body.setVelocityY(config.vy || 0);
      break;
    case 'airborne_sine':
      obj._sineBase = y;
      obj._sineAmp = config.amp || 40;
      obj._sineSpeed = config.sineSpeed || 2.5;
      obj._sineOffset = config.offset || 0;
      obj.body.setVelocityX(config.speed || -100);
      break;
    case 'airborne_static':
      obj.body.setVelocityX(0);
      break;
    case 'crumbling':
      obj._crumbling = false;
      break;
    default:
      obj.body.setVelocityX(0);
      break;
  }
}

export function spawnObstacle(scene, type, x, y, config = {}) {
  const def = getObstacleDef(type);
  const cleanKey = getObstacleFrameTextureKey(type, 0);
  const key = scene.textures.exists(cleanKey) ? cleanKey : `obs_${type}`;

  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    def.draw(g);
    g.generateTexture(key, def.w, def.h);
    g.destroy();
  }

  const obj = scene.physics.add.sprite(x, y, key).setOrigin(0.5, 1);
  obj.setDisplaySize(def.w, def.h);
  if (def.flipX) obj.setFlipX(true);
  obj.obstacleType = type;
  obj.obstacleDef = def;
  obj.resetObstacleBody = () => {
    applyObstacleBody(obj, def);
    applyObstacleBehavior(obj, def, config, x, y);
  };

  if (scene.anims.exists(`obs_anim_${type}`)) {
    obj.play(`obs_anim_${type}`);
    // Avoid every copy of the same obstacle hitting the same animation frame.
    obj.anims.setProgress(Math.random() * 0.92);
    obj.on('animationupdate', () => applyObstacleBody(obj, def));
  }

  // Must be applied after play()/setProgress(), because animation frame changes
  // refresh the Arcade body and can otherwise restore source-sheet dimensions.
  obj.resetObstacleBody();

  return obj;
}

export function updateObstacle(obj, time, delta) {
  const def = obj.obstacleDef;
  if (!def) return;
  applyObstacleBody(obj, def);

  switch (def.behavior) {
    case 'pacing':
      if (obj.x >= obj._paceMax) { obj._paceDir = -1; obj.body.setVelocityX(-50); }
      if (obj.x <= obj._paceMin) { obj._paceDir = 1; obj.body.setVelocityX(50); }
      break;
    case 'airborne_sine':
      obj.y = obj._sineBase + Math.sin((time * 0.001 * obj._sineSpeed) + obj._sineOffset) * obj._sineAmp;
      break;
  }
}
