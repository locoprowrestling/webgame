export default class LevelCompleteScene extends Phaser.Scene {
  constructor() { super('LevelCompleteScene'); }

  init(data) {
    this._characterId = data.characterId;
    this._level = data.level;
    this._stars = data.stars || 0;
    this._score = data.score || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const isLastLevel = this._level >= 25;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x4a90d9, 0x4a90d9, 0x87ceeb, 0x87ceeb, 1);
    bg.fillRect(0, 0, W, H);

    // Panel
    const panel = this.add.rectangle(W / 2, H / 2, 480, 300, 0x000000, 0.75)
      .setStrokeStyle(2, 0xffd700);

    // Title
    this.add.text(W / 2, H / 2 - 120, isLastLevel ? 'YOU WIN!' : 'LEVEL COMPLETE', {
      fontSize: '28px', fontFamily: 'Impact, sans-serif',
      color: '#ffd700', stroke: '#aa6600', strokeThickness: 4,
    }).setOrigin(0.5);

    const levelName = `Level ${this._level}`;
    this.add.text(W / 2, H / 2 - 88, levelName, {
      fontSize: '14px', fontFamily: 'monospace', color: '#cccccc',
    }).setOrigin(0.5);

    // Stars (animate in)
    const starTexts = [];
    for (let i = 0; i < 3; i++) {
      const filled = i < this._stars;
      const s = this.add.text(W / 2 - 48 + i * 48, H / 2 - 50, filled ? '★' : '☆', {
        fontSize: '40px', color: filled ? '#ffd700' : '#555555',
      }).setOrigin(0.5).setScale(0);
      starTexts.push({ obj: s, filled });
    }

    starTexts.forEach((item, i) => {
      this.time.delayedCall(300 + i * 200, () => {
        this.tweens.add({ targets: item.obj, scale: 1, ease: 'Back.Out', duration: 300 });
        if (item.filled) this.cameras.main.shake(80, 0.006);
      });
    });

    // Score
    this.add.text(W / 2, H / 2 + 10, `SCORE  ${this._score.toLocaleString()}`, {
      fontSize: '16px', fontFamily: 'Impact, sans-serif', color: '#ffffff', letterSpacing: 2,
    }).setOrigin(0.5);

    // Buttons — 3 buttons evenly spaced inside 480px panel (centers at -150, 0, +150)
    const btnY = H / 2 + 80;
    if (!isLastLevel) {
      this._makeBtn(W / 2 - 150, btnY, 'NEXT LEVEL ▶', 0xff6600, () => {
        this.scene.start('GameScene', { characterId: this._characterId, level: this._level + 1 });
      });
    }
    this._makeBtn(W / 2 + (isLastLevel ? -75 : 0), btnY, 'SELECT', 0x336633, () => {
      this.scene.start('SelectScene', { level: this._level });
    });
    this._makeBtn(W / 2 + (isLastLevel ? 75 : 150), btnY, 'RETRY', 0x444444, () => {
      this.scene.start('GameScene', { characterId: this._characterId, level: this._level });
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _makeBtn(x, y, label, color, callback) {
    const btn = this.add.container(x, y).setSize(120, 30).setInteractive();
    const bg = this.add.rectangle(0, 0, 120, 30, color).setStrokeStyle(2, 0x000000, 0.5);
    const txt = this.add.text(0, 0, label, {
      fontSize: '11px', fontFamily: 'Impact, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.on('pointerover', () => bg.setScale(1.05));
    btn.on('pointerout', () => bg.setScale(1));
    btn.on('pointerdown', callback);
    return btn;
  }
}
