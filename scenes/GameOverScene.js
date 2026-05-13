const PS2P = '"Press Start 2P", monospace';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this._characterId = data.characterId;
    this._level = data.level;
    this._checkpointX = data.checkpointX || null;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    this.add.text(W / 2, H / 2 - 90, 'YOU FELL', {
      fontSize: '26px', fontFamily: PS2P,
      color: '#ff2200', stroke: '#660000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 52, `LEVEL ${this._level}`, {
      fontSize: '11px', fontFamily: PS2P, color: '#aaaaaa',
    }).setOrigin(0.5);

    this._makeBtn(W / 2, H / 2 + 20, 'RESTART LEVEL', 0xff6600, () => {
      this.scene.start('GameScene', { characterId: this._characterId, level: this._level });
    });

    this._makeBtn(W / 2, H / 2 + 74, 'CHANGE WRESTLER', 0x334466, () => {
      this.scene.start('SelectScene', { level: this._level });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { characterId: this._characterId, level: this._level });
    });
  }

  _makeBtn(x, y, label, color, callback) {
    const btn = this.add.container(x, y).setSize(260, 42).setInteractive();
    const bg = this.add.rectangle(0, 0, 260, 42, color).setStrokeStyle(2, 0xffffff, 0.2);
    const txt = this.add.text(0, 0, label, {
      fontSize: '11px', fontFamily: PS2P, color: '#ffffff',
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.on('pointerover', () => bg.setAlpha(0.85));
    btn.on('pointerout', () => bg.setAlpha(1));
    btn.on('pointerdown', callback);
    return btn;
  }
}
