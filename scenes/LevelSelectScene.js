import { getUnlockedLevels, getStarsForLevel } from '../src/saveSystem.js';
import { CHARACTERS } from '../src/characters.js';

const ZONE_META = [
  { zone: 1, name: 'THE GREENWAY',       color: 0x2a6a10, dark: 0x112208 },
  { zone: 2, name: 'DOWNTOWN LONGMONT',  color: 0x1a3060, dark: 0x080f28 },
  { zone: 3, name: 'THE FOOTHILLS',      color: 0x5a3a10, dark: 0x251408 },
  { zone: 4, name: 'FAIRGROUNDS',        color: 0x804010, dark: 0x351a04 },
  { zone: 5, name: 'THE ARENA',          color: 0x200a40, dark: 0x0a0318 },
];

const LEVEL_NAMES = [
  null,
  'St. Vrain Morning Run', 'Greenway at Sunset', 'Prairie Dog Colony',
  'Irrigation District', 'End of the Greenway',
  'Main Street Hustle', 'Union Reservoir Loop', 'Harvest Festival Route',
  'Left Hand Brewing District', 'Diagonal Highway Dash',
  'Lefthand Canyon Climb', 'Rocky Mountain Ascent', 'Longs Peak Vista',
  'Rattlesnake Gulch', 'Foothills Final Descent',
  'Boulder County Fairgrounds', 'Longmont Rodeo Grounds', 'Harvest Days Chaos',
  'County Fair Gauntlet', 'Fairgrounds Last Stand',
  'LoCoPro Arena — Gates Open', 'LoCoPro Arena — Ring Side',
  'LoCoPro Arena — Main Event', 'LoCoPro Arena — Championship',
  'LoCoPro Arena — TITLE MATCH',
];

const TILE_W = 154;
const TILE_H = 54;
const TILE_GAP = 8;
const CONTENT_LEFT = 20;
const ZONE_HEADER_H = 18;
const ZONE_GAP = 2;
const HEADER_H = 44;
const FOOTER_H = 46;

export default class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }

  init(data) {
    this._characterId = data.characterId;
    const unlocked = getUnlockedLevels();
    this._unlockedLevels = unlocked;
    this._selectedLevel = Math.min(data.level || unlocked, unlocked);
    this._launching = false;
  }

  create() {
    const W = this.scale.width;

    this._tiles = [];

    this._buildBackground(W);
    this._buildHeader(W);
    this._buildGrid(W);
    this._buildFooter(W);
    this._addInput();
    this._refreshFooterText();

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _buildBackground(W) {
    const H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a18);
  }

  _buildHeader(W) {
    this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, 0x061a06);
    this.add.text(W / 2 - 60, HEADER_H / 2, 'SELECT LEVEL', {
      fontSize: '18px', fontFamily: 'Impact, sans-serif',
      color: '#ffd700', letterSpacing: 4,
    }).setOrigin(0.5);

    const char = CHARACTERS.find(c => c.id === this._characterId);
    if (char) {
      if (this.textures.exists(`portrait_${char.id}`)) {
        const img = this.add.image(W - 78, HEADER_H / 2, `portrait_${char.id}`).setOrigin(0.5);
        const s = Math.min(32 / img.width, 32 / img.height);
        img.setScale(s);
      }
      this.add.text(W - 44, HEADER_H / 2, char.name.toUpperCase(), {
        fontSize: '10px', fontFamily: 'Impact, sans-serif',
        color: '#aaddaa', letterSpacing: 2,
      }).setOrigin(0, 0.5);
    }
  }

  _buildGrid(W) {
    let y = HEADER_H + 2;

    ZONE_META.forEach(({ zone, name, color, dark }) => {
      const firstLevel = (zone - 1) * 5 + 1;

      // Zone label row
      this.add.rectangle(W / 2, y + ZONE_HEADER_H / 2, W - 24, ZONE_HEADER_H, 0x0a1a0a)
        .setStrokeStyle(1, color, 0.5);
      this.add.text(CONTENT_LEFT + 4, y + ZONE_HEADER_H / 2, `ZONE ${zone}: ${name}`, {
        fontSize: '10px', fontFamily: 'Impact, sans-serif',
        color: '#' + color.toString(16).padStart(6, '0'),
        letterSpacing: 2,
      }).setOrigin(0, 0.5);
      y += ZONE_HEADER_H + 2;

      // 5 level tiles
      for (let i = 0; i < 5; i++) {
        const level = firstLevel + i;
        const tx = CONTENT_LEFT + i * (TILE_W + TILE_GAP) + TILE_W / 2;
        const ty = y + TILE_H / 2;
        this._makeTile(level, tx, ty, color, dark);
      }

      y += TILE_H + ZONE_GAP + 2;
    });
  }

  _makeTile(level, cx, cy, zoneColor, zoneDark) {
    const unlocked = level <= this._unlockedLevels;
    const stars = unlocked ? getStarsForLevel(this._characterId, level) : 0;
    const bgColor = unlocked ? zoneColor : zoneDark;

    const container = this.add.container(cx, cy).setSize(TILE_W, TILE_H);

    const border = this.add.rectangle(0, 0, TILE_W, TILE_H, bgColor)
      .setStrokeStyle(1, unlocked ? 0x446644 : 0x222222);
    container.add(border);

    if (!unlocked) {
      container.setAlpha(0.35);
      const lockIcon = this.add.text(0, 0, '🔒', { fontSize: '18px' }).setOrigin(0.5);
      container.add(lockIcon);
    } else {
      // Level number
      const numText = this.add.text(0, -10, String(level), {
        fontSize: '22px', fontFamily: 'Impact, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);
      container.add(numText);

      // Stars
      if (stars > 0) {
        const starText = this.add.text(0, 14, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
          fontSize: '11px', color: '#ffd700',
        }).setOrigin(0.5);
        container.add(starText);
      } else {
        const starText = this.add.text(0, 14, '☆☆☆', {
          fontSize: '11px', color: '#444444',
        }).setOrigin(0.5);
        container.add(starText);
      }

      container.setInteractive();
      container.on('pointerover', () => {
        if (level !== this._selectedLevel) border.setStrokeStyle(2, 0x88cc88);
      });
      container.on('pointerout', () => {
        if (level !== this._selectedLevel) border.setStrokeStyle(1, 0x446644);
      });
      container.on('pointerdown', () => {
        if (level === this._selectedLevel) {
          this._launch();
        } else {
          this._selectLevel(level);
        }
      });
    }

    container._level = level;
    container._border = border;
    container._unlocked = unlocked;
    this._tiles.push(container);
  }

  _selectLevel(level) {
    this._selectedLevel = level;
    this._tiles.forEach(t => {
      if (!t._unlocked) return;
      if (t._level === level) {
        t._border.setStrokeStyle(2, 0xffd700).setFillStyle(this._tileColor(level));
        t.setScale(1.04);
      } else {
        t._border.setStrokeStyle(1, 0x446644);
        t.setScale(1);
      }
    });
    this._refreshFooterText();
  }

  _tileColor(level) {
    const zone = Math.ceil(level / 5);
    return ZONE_META[zone - 1]?.color || 0x2a6a10;
  }

  _buildFooter(W) {
    const H = this.scale.height;
    const footerY = H - FOOTER_H;

    this.add.rectangle(W / 2, footerY + FOOTER_H / 2, W, FOOTER_H, 0x061a06)
      .setStrokeStyle(1, 0x334433);

    // Back button
    const backBtn = this.add.container(64, footerY + FOOTER_H / 2).setSize(100, 30).setInteractive();
    const backBg = this.add.rectangle(0, 0, 100, 30, 0x334466).setStrokeStyle(1, 0x556688);
    const backTxt = this.add.text(0, 0, '◀ BACK', {
      fontSize: '12px', fontFamily: 'Impact, sans-serif', color: '#aaccff',
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBtn.on('pointerover', () => backBg.setFillStyle(0x445577));
    backBtn.on('pointerout', () => backBg.setFillStyle(0x334466));
    backBtn.on('pointerdown', () => this._goBack());

    // Level name display
    this._footerText = this.add.text(130, footerY + FOOTER_H / 2, '', {
      fontSize: '13px', fontFamily: 'Impact, sans-serif',
      color: '#ffffff', letterSpacing: 1,
    }).setOrigin(0, 0.5);

    // Continue button
    this._continueBtn = this.add.container(W - 90, footerY + FOOTER_H / 2)
      .setSize(140, 34).setInteractive().setAlpha(this._selectedLevel ? 1 : 0.3);
    const btnBg = this.add.rectangle(0, 0, 140, 34, 0xff6600).setStrokeStyle(2, 0xaa3300);
    const btnTxt = this.add.text(0, 0, 'CONTINUE ▶', {
      fontSize: '14px', fontFamily: 'Impact, sans-serif', color: '#fff',
    }).setOrigin(0.5);
    this._continueBtn.add([btnBg, btnTxt]);
    this._continueBtn.on('pointerdown', () => { if (this._selectedLevel) this._launch(); });
  }

  _refreshFooterText() {
    const name = LEVEL_NAMES[this._selectedLevel] || `Level ${this._selectedLevel}`;
    this._footerText?.setText(`Level ${this._selectedLevel}: ${name}`);
    this._continueBtn?.setAlpha(this._selectedLevel ? 1 : 0.3);

    // Highlight selected tile border
    this._tiles.forEach(t => {
      if (!t._unlocked) return;
      if (t._level === this._selectedLevel) {
        t._border.setStrokeStyle(2, 0xffd700);
        t.setScale(1.04);
      }
    });
  }

  _addInput() {
    this.input.keyboard.on('keydown-ENTER', () => { if (this._selectedLevel) this._launch(); });
    this.input.keyboard.on('keydown-SPACE', () => { if (this._selectedLevel) this._launch(); });
    this.input.keyboard.on('keydown-ESC', () => this._goBack());
  }

  _goBack() {
    if (this._launching) return;
    this._launching = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('SelectScene', { level: this._selectedLevel });
    });
  }

  _launch() {
    if (this._launching) return;
    this._launching = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { characterId: this._characterId, level: this._selectedLevel });
    });
  }
}
