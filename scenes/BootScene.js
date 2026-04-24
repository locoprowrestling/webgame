import { CHARACTERS } from '../src/characters.js';
import { generateCharacterTextures } from '../src/characterSprite.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Make character data globally accessible (avoids re-importing in non-module contexts)
    window.__LCP__ = { CHARACTERS };

    this._createLoadingUI();

    // Load all character portraits
    CHARACTERS.forEach(c => {
      this.load.image(`portrait_${c.id}`, c.portrait);
      if (c.logo) this.load.image(`logo_${c.id}`, c.logo);
    });

    // Load faction + brand logos
    this.load.image('logo_rising', 'Assets/logos-web/logo-the-rising.png');
    this.load.image('logo_pillars', 'Assets/logos-web/logo-the-pillars.png');
    this.load.image('logo_locopro', 'Assets/logos-web/logo-locopro-primary-mark-thumb.png');

    this.load.on('progress', v => this._updateBar(v));
  }

  create() {
    generateCharacterTextures(this);
    this._buildBackgroundTextures();
    this._buildObstacleTextures();
    this.scene.start('TitleScene');
  }

  _createLoadingUI() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1a0a);
    this.add.text(width / 2, height / 2 - 40, 'LOCOPRO', {
      fontSize: '36px', fontFamily: 'Impact, sans-serif',
      color: '#ffd700', stroke: '#aa6600', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 10, 'CHAMPIONSHIP RUN', {
      fontSize: '14px', fontFamily: 'Impact, sans-serif',
      color: '#ffffff', letterSpacing: 4,
    }).setOrigin(0.5);

    this._barBg = this.add.rectangle(width / 2, height / 2 + 40, 400, 12, 0x333333).setOrigin(0.5);
    this._bar = this.add.rectangle(width / 2 - 200, height / 2 + 40, 0, 12, 0xffd700).setOrigin(0, 0.5);
    this._loadText = this.add.text(width / 2, height / 2 + 62, 'Loading...', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace',
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

  _buildObstacleTextures() {
    // Pre-generate a finish flag texture
    const g = this.add.graphics();
    g.fillStyle(0xffd700, 1); g.fillRect(0, 0, 24, 16);
    g.fillStyle(0x000000, 1);
    g.fillRect(4, 4, 6, 4); g.fillRect(10, 0, 6, 4); g.fillRect(16, 4, 6, 4);
    g.lineStyle(3, 0x888888, 1); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 48); g.strokePath();
    g.generateTexture('flag', 24, 48);
    g.destroy();

    // Checkpoint banner
    const c = this.add.graphics();
    c.fillStyle(0xffd700, 0.9); c.fillRect(0, 0, 40, 12);
    c.lineStyle(2, 0xaa6600, 1); c.strokeRect(0, 0, 40, 12);
    c.generateTexture('checkpoint', 40, 12);
    c.destroy();
  }
}
