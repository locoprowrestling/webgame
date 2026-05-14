const PS2P = '"Press Start 2P", monospace';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) {
    this._characterId = data.characterId;
    this._hearts = data.hearts ?? 3;
    this._levelNum = data.level;
    this._levelName = data.levelName || '';
  }

  create() {
    const W = this.scale.width;
    this._score = 0;
    this._stars = 0;

    // Top bar background
    this.add.rectangle(W / 2, 24, W, 48, 0x000000, 0.55);

    // LEFT: portrait thumbnail + hearts
    this._portraitImg = this.textures.exists(`portrait_${this._characterId}`)
      ? this.add.image(28, 24, `portrait_${this._characterId}`).setOrigin(0.5)
      : this.add.rectangle(28, 24, 28, 36, 0x444444);
    if (this._portraitImg.width) {
      const s = Math.min(28 / this._portraitImg.width, 36 / this._portraitImg.height);
      this._portraitImg.setScale(s);
    }
    this._portraitImg.setDepth(20);

    this._heartIcons = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(58 + i * 22, 24, '♥', {
        fontSize: '20px', color: '#ff4444',
      }).setOrigin(0.5).setDepth(20);
      this._heartIcons.push(h);
    }

    // CENTER: level name
    this.add.text(W / 2, 13, `LEVEL ${this._levelNum}`, {
      fontSize: '10px', fontFamily: PS2P,
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 31, this._levelName.toUpperCase(), {
      fontSize: '8px', fontFamily: PS2P, color: '#cccccc',
    }).setOrigin(0.5).setDepth(20);

    // RIGHT: stars + score row (arrow left of score)
    this._starText = this.add.text(W - 80, 13, '☆ ☆ ☆', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5).setDepth(20);

    this._arrowText = this.add.text(W - 122, 32, '▲', {
      fontSize: '11px', fontFamily: PS2P, color: '#00ff88',
    }).setOrigin(0.5).setDepth(20);

    this._scoreText = this.add.text(W - 62, 32, '0', {
      fontSize: '11px', fontFamily: PS2P, color: '#ffffff',
    }).setOrigin(0.5).setDepth(20);

    // Checkpoint toast (hidden)
    this._toastBg = this.add.rectangle(W / 2, 70, 300, 28, 0x000000, 0.7).setAlpha(0).setDepth(21);
    this._toastText = this.add.text(W / 2, 70, '', {
      fontSize: '10px', fontFamily: PS2P, color: '#ffd700',
    }).setOrigin(0.5).setAlpha(0).setDepth(22);

    // Hook into GameScene events
    this._gameScene = this.scene.get('GameScene');
    this._gameScene.events.on('heartsChanged', this._onHeartsChanged, this);
    this._gameScene.events.on('checkpointReached', this._onCheckpoint, this);
    this._gameScene.events.on('scoreUpdate', this._onScore, this);
  }

  shutdown() {
    if (this._gameScene) {
      this._gameScene.events.off('heartsChanged', this._onHeartsChanged, this);
      this._gameScene.events.off('checkpointReached', this._onCheckpoint, this);
      this._gameScene.events.off('scoreUpdate', this._onScore, this);
      this._gameScene = null;
    }
  }

  _onHeartsChanged(hearts, delta) {
    this._hearts = hearts;
    this._heartIcons.forEach((h, i) => {
      h.setColor(i < hearts ? '#ff4444' : '#444444');
    });
    if (delta > 0) {
      // Heart gained — pulse the newly lit icon
      const idx = Math.min(hearts - 1, this._heartIcons.length - 1);
      this.tweens.add({ targets: this._heartIcons[idx], scaleX: 1.5, scaleY: 1.5, yoyo: true, duration: 180, repeat: 2 });
    } else if (hearts === 1) {
      this.tweens.add({ targets: this._heartIcons[0], scaleX: 1.4, scaleY: 1.4, yoyo: true, duration: 200, repeat: 2 });
    }
  }

  _onCheckpoint(current, total) {
    this._toastText.setText(`CHECKPOINT ${current}/${total}`);
    this._toastBg.setAlpha(0.8);
    this._toastText.setAlpha(1);
    this.tweens.add({ targets: [this._toastBg, this._toastText], alpha: 0, delay: 1200, duration: 500 });

    const hearts = this._gameScene?._hearts ?? this._hearts;
    const starStr = '★'.repeat(hearts) + '☆'.repeat(3 - hearts);
    this._starText.setText(starStr).setColor('#ffd700');
  }

  _onScore(score, direction) {
    this._scoreText.setText(score.toLocaleString());
    if (direction >= 0) {
      this._arrowText.setText('▲').setColor('#00ff88');
    } else {
      this._arrowText.setText('▼').setColor('#ff4444');
    }
  }
}
