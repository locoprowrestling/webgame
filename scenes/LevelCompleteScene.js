import { playMusic, applyMuteState } from '../src/audioManager.js';

const PS2P = '"Press Start 2P", monospace';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() { super('LevelCompleteScene'); }

  init(data) {
    this._characterId = data.characterId;
    this._level = data.level;
    this._stars = data.stars || 0;
    this._totalCollectibles = data.totalCollectibles || 0;
    this._finalScore = data.finalScore || data.score || 0;
    this._distScore = data.distScore || 0;
    this._gemCount = data.gemCount || 0;
    this._hearts = data.hearts ?? 0;
    this._isNewRecord = data.isNewRecord || false;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const isLastLevel = this._level >= 25;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4a90d9, 0x4a90d9, 0x87ceeb, 0x87ceeb, 1);
    bg.fillRect(0, 0, W, H);

    // Panel — taller to fit breakdown
    this.add.rectangle(W / 2, H / 2, 480, 380, 0x000000, 0.82)
      .setStrokeStyle(2, 0xffd700);

    // Title
    this.add.text(W / 2, H / 2 - 175, isLastLevel ? 'YOU WIN!' : 'LEVEL COMPLETE', {
      fontSize: '14px', fontFamily: PS2P,
      color: '#ffd700', stroke: '#aa6600', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 154, `Level ${this._level}`, {
      fontSize: '10px', fontFamily: PS2P, color: '#cccccc',
    }).setOrigin(0.5);

    // Stars (animate in) — 4 slots for levels with collectibles, 3 otherwise
    const maxStars = this._totalCollectibles > 0 ? 4 : 3;
    const starSpacing = 38;
    const starStartX = W / 2 - ((maxStars - 1) * starSpacing) / 2;
    const starTexts = [];
    for (let i = 0; i < maxStars; i++) {
      const filled = i < this._stars;
      const s = this.add.text(starStartX + i * starSpacing, H / 2 - 118, filled ? '★' : '☆', {
        fontSize: '32px', color: filled ? '#ffd700' : '#555555',
      }).setOrigin(0.5).setScale(0);
      starTexts.push({ obj: s, filled });
    }

    starTexts.forEach((item, i) => {
      this.time.delayedCall(300 + i * 200, () => {
        this.tweens.add({ targets: item.obj, scale: 1, ease: 'Back.Out', duration: 300 });
        if (item.filled) this.cameras.main.shake(80, 0.006);
      });
    });

    // Score breakdown
    const labelX = W / 2 - 185;
    const valueX = W / 2 + 185;
    const startY = H / 2 - 62;
    const lineH = 18;

    const rows = [
      ['DISTANCE', this._distScore],
      [`GEMS x${this._gemCount}`, this._gemCount * 100],
      [`HEARTS x${this._hearts}`, this._hearts * 1000],
      ['TITLE', 500],
    ];

    rows.forEach(([label, value], i) => {
      this.add.text(labelX, startY + i * lineH, label, {
        fontSize: '10px', fontFamily: PS2P, color: '#cccccc',
      }).setOrigin(0, 0.5);
      this.add.text(valueX, startY + i * lineH, value.toLocaleString(), {
        fontSize: '10px', fontFamily: PS2P, color: '#ffffff',
      }).setOrigin(1, 0.5);
    });

    // Divider
    const divY = startY + rows.length * lineH + 4;
    this.add.rectangle(W / 2, divY, 370, 1, 0x888888);

    // Total
    this.add.text(labelX, divY + 15, 'TOTAL', {
      fontSize: '11px', fontFamily: PS2P, color: '#ffd700',
    }).setOrigin(0, 0.5);
    this.add.text(valueX, divY + 15, this._finalScore.toLocaleString(), {
      fontSize: '11px', fontFamily: PS2P, color: '#ffd700',
    }).setOrigin(1, 0.5);

    // New record badge
    if (this._isNewRecord) {
      const badge = this.add.text(W / 2, divY + 40, '★ NEW RECORD!', {
        fontSize: '11px', fontFamily: PS2P,
        color: '#ffd700', stroke: '#aa6600', strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: badge, scaleX: 1.08, scaleY: 1.08,
        yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut',
      });
    }

    // Buttons
    const btnY = H / 2 + 148;
    if (!isLastLevel) {
      this._makeBtn(W / 2 - 150, btnY, 'NEXT ▶', 0xff6600, () => {
        this.scene.start('GameScene', { characterId: this._characterId, level: this._level + 1 });
      });
    }
    this._makeBtn(W / 2 + (isLastLevel ? -75 : 0), btnY, 'SELECT', 0x336633, () => {
      this.scene.start('LevelSelectScene', { characterId: this._characterId, level: this._level });
    });
    this._makeBtn(W / 2 + (isLastLevel ? 75 : 150), btnY, 'RETRY', 0x444444, () => {
      this.scene.start('GameScene', { characterId: this._characterId, level: this._level });
    });

    applyMuteState(this.game);
    playMusic(this, isLastLevel ? 'final' : 'fanfare');
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _makeBtn(x, y, label, color, callback) {
    const btn = this.add.container(x, y).setSize(120, 30).setInteractive();
    const bg = this.add.rectangle(0, 0, 120, 30, color).setStrokeStyle(2, 0x000000, 0.5);
    const txt = this.add.text(0, 0, label, {
      fontSize: '10px', fontFamily: PS2P, color: '#ffffff',
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.on('pointerover', () => bg.setScale(1.05));
    btn.on('pointerout', () => bg.setScale(1));
    btn.on('pointerdown', callback);
    return btn;
  }
}
