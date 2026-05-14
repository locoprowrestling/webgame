import { CHARACTERS } from '../src/characters.js';
import { playMusic, applyMuteState } from '../src/audioManager.js';

const PS2P = '"Press Start 2P", monospace';
const SPOT_COLORS = [0xff0044, 0x0088ff, 0xffcc00, 0x00ff88, 0xff6600, 0xaa00ff, 0x00ccff];

export default class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }

  init(data) {
    this._characterId = data.characterId;
    this._finalScore = data.finalScore || 0;
    this._stars = data.stars || 0;
    this._hearts = data.hearts || 0;
    this._gemCount = data.gemCount || 0;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    applyMuteState(this.game);
    playMusic(this, 'final');

    this._buildBackground(W, H);
    this._buildTitle(W, H);
    this._buildDancers(W, H);
    this._spawnConfetti(W, H);
    this._buildButtons(W, H);

    this.cameras.main.fadeIn(700, 0, 0, 0);
  }

  _buildBackground(W, H) {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

    if (this.textures.exists('bg_arena_1')) {
      this.add.tileSprite(0, 0, W, H, 'bg_arena_1')
        .setOrigin(0, 0).setScrollFactor(0).setDepth(1);
    }

    // Sweeping coloured spotlights
    SPOT_COLORS.forEach((color, i) => {
      const cx = (i + 0.5) * (W / SPOT_COLORS.length);
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(color, 0.10);
      g.fillTriangle(cx, 0, cx - 90, H, cx + 90, H);
      this.tweens.add({
        targets: g,
        x: Phaser.Math.Between(-100, 100),
        yoyo: true, repeat: -1,
        duration: 1100 + i * 350,
        ease: 'Sine.InOut',
        delay: i * 140,
      });
    });

    // Stage floor strip
    const floorY = H - 56;
    this.add.rectangle(W / 2, floorY + 28, W, 56, 0x110808).setDepth(3);
    this.add.rectangle(W / 2, floorY, W, 3, 0xff2200).setDepth(4);
  }

  _buildTitle(W, H) {
    const title = this.add.text(W / 2, 26, 'YOU ARE CHAMPION!', {
      fontSize: '18px', fontFamily: PS2P,
      color: '#ffd700', stroke: '#7a3a00', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: title, scaleX: 1.05, scaleY: 1.05,
      yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut',
    });

    this.add.text(W / 2, 55, `FINAL SCORE: ${this._finalScore.toLocaleString()}`, {
      fontSize: '10px', fontFamily: PS2P, color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    const maxStars = 4;
    const starStr = '★'.repeat(this._stars) + '☆'.repeat(Math.max(0, maxStars - this._stars));
    this.add.text(W / 2, 76, starStr, {
      fontSize: '18px', color: '#ffd700',
    }).setOrigin(0.5).setDepth(10);
  }

  _buildDancers(W, H) {
    const FLOOR_Y = H - 56;
    const chars = [...CHARACTERS];

    // Two rows: back row of 7, front row of 9
    const frontChars = chars.slice(0, 9);
    const backChars = chars.slice(9);

    backChars.forEach((char, i) => {
      const x = (i + 0.5) * (W / backChars.length);
      this._spawnDancer(char, x, FLOOR_Y - 20, 0.70, 4, i % 2 === 0);
    });

    frontChars.forEach((char, i) => {
      const x = (i + 0.5) * (W / frontChars.length);
      this._spawnDancer(char, x, FLOOR_Y, 0.86, 5, i % 2 !== 0);
    });
  }

  _spawnDancer(char, x, baseY, scale, depth, flipX) {
    const sprite = this.add.sprite(x, baseY, `sheet_${char.id}`)
      .setOrigin(0.5, 1).setScale(scale).setDepth(depth).setFlipX(flipX);

    if (this.anims.exists(`walk_${char.id}`)) {
      sprite.play(`walk_${char.id}`);
      sprite.anims.setProgress(Math.random());
    }

    const startBob = (delay = 0) => {
      this.tweens.add({
        targets: sprite,
        y: baseY - Phaser.Math.Between(5, 13),
        yoyo: true, repeat: -1,
        duration: Phaser.Math.Between(270, 540),
        ease: 'Sine.InOut',
        delay,
      });
    };

    startBob(Phaser.Math.Between(0, 500));
    this._scheduleJump(sprite, baseY, scale, startBob);
  }

  _scheduleJump(sprite, baseY, scale, resumeBob) {
    this.time.delayedCall(Phaser.Math.Between(1800, 5500), () => {
      if (!sprite.active) return;
      this.tweens.killTweensOf(sprite);

      this.tweens.add({
        targets: sprite, y: baseY - Math.round(38 * scale),
        duration: 220, ease: 'Power2.Out',
        onComplete: () => {
          if (!sprite.active) return;
          this.tweens.add({
            targets: sprite, y: baseY,
            duration: 240, ease: 'Bounce.Out',
            onComplete: () => {
              if (!sprite.active) return;
              resumeBob();
              this._scheduleJump(sprite, baseY, scale, resumeBob);
            },
          });
        },
      });
    });
  }

  _spawnConfetti(W, H) {
    const colors = [0xff0044, 0x00aaff, 0xffdd00, 0x00ff88, 0xff6600, 0xcc00ff, 0xffffff, 0xff88cc];
    const drop = (piece) => {
      piece.setPosition(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(-180, -10),
      ).setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({
        targets: piece,
        y: H + 20,
        x: piece.x + Phaser.Math.Between(-70, 70),
        angle: piece.angle + Phaser.Math.Between(-200, 200),
        duration: Phaser.Math.Between(2200, 4500),
        ease: 'Linear',
        onComplete: () => { if (piece.active) drop(piece); },
      });
    };

    for (let i = 0; i < 50; i++) {
      const w = Phaser.Math.Between(3, 6), h = Phaser.Math.Between(5, 9);
      const piece = this.add.rectangle(0, 0, w, h,
        Phaser.Utils.Array.GetRandom(colors)).setDepth(20);
      this.time.delayedCall(Phaser.Math.Between(0, 4000), () => { if (piece.active) drop(piece); });
    }
  }

  _buildButtons(W, H) {
    const btnY = H - 20;
    this._makeBtn(W / 2 - 110, btnY, 'PLAY AGAIN', 0xff6600, () => this.scene.start('SelectScene'));
    this._makeBtn(W / 2 + 110, btnY, 'TITLE', 0x1a1a4a, () => this.scene.start('TitleScene'));
  }

  _makeBtn(x, y, label, color, callback) {
    const btn = this.add.container(x, y).setSize(170, 30).setInteractive().setDepth(25);
    const bg = this.add.rectangle(0, 0, 170, 30, color).setStrokeStyle(2, 0xffffff, 0.4);
    const txt = this.add.text(0, 0, label, {
      fontSize: '10px', fontFamily: PS2P, color: '#ffffff',
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.on('pointerover', () => bg.setScale(1.05));
    btn.on('pointerout', () => bg.setScale(1));
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', callback);
    });
    return btn;
  }
}
