export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this._buildBackground(W, H);
    this._buildRunner(W, H);
    this._buildUI(W, H);
    this._addInput();
  }

  _buildBackground(W, H) {
    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4a90d9, 0x4a90d9, 0x87ceeb, 0x87ceeb, 1);
    sky.fillRect(0, 0, W, H);

    // Sun
    this.add.circle(W - 60, 60, 28, 0xffd700).setDepth(1);
    const glow = this.add.circle(W - 60, 60, 38, 0xffd700, 0.2).setDepth(0);
    this.tweens.add({ targets: glow, scaleX: 1.3, scaleY: 1.3, alpha: 0, yoyo: true, repeat: -1, duration: 1800 });

    // Parallax mountains (tileSprite updated in update)
    this._mtnSprite = this.add.tileSprite(0, H - 200, W, 120, 'bg_mtn_z1').setOrigin(0, 0).setDepth(2);
    this._hillSprite = this.add.tileSprite(0, H - 100, W, 60, 'bg_hill_z1').setOrigin(0, 0).setDepth(3);

    // Ground strip
    this.add.rectangle(W / 2, H - 22, W, 44, 0x4a8c2a).setDepth(4);
    this.add.rectangle(W / 2, H - 44, W, 4, 0x2d5a1b).setDepth(4);
  }

  _buildRunner(W, H) {
    this._addTitleRunner(34, H - 44, 'anuka', 0.88, 130, false);
    this._addTitleRunner(90, H - 44, 'carter', 0.84, 180, false);
    this._addTitleRunner(146, H - 44, 'codah', 0.95, 150, false);
    this._addTitleRunner(246, H - 44, 'hussy', 0.90, 150, false);
    this._addTitleRunner(600, H - 44, 'glory', 0.86, 150, false);
    this._addTitleRunner(650, H - 44, 'crash', 0.91, 150, false);
    this._addTitleRunner(700, H - 44, 'erza', 0.86, 150, false);
    this._addTitleRunner(750, H - 44, 'zeak', 0.86, 150, false);
  }

  _addTitleRunner(x, y, characterId, scale, bobDuration, flipX) {
    const runner = this.add.container(x, y).setDepth(5);
    const sheetKey = `sheet_${characterId}`;
    const walkKey = `walk_${characterId}`;
    const sprite = this.add.sprite(0, 0, sheetKey, 0)
      .setOrigin(0.5, 1)
      .setScale(scale);

    sprite.flipX = flipX;

    if (this.anims.exists(walkKey)) {
      sprite.play(walkKey);
    }

    runner.add(sprite);

    // Keep the title runner lively without affecting the sprite animation.
    this.tweens.add({
      targets: runner, y: y - 3, yoyo: true, repeat: -1,
      duration: bobDuration, ease: 'Sine.easeInOut',
    });
  }

  _buildUI(W, H) {
    // Logo
    const logoImg = this.textures.exists('logo_locopro')
      ? this.add.image(W / 2, H * 0.22, 'logo_locopro').setOrigin(0.5).setDepth(6)
      : null;

    if (logoImg) {
      const maxW = 280, maxH = 120;
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      logoImg.setScale(scale);
    }

    // Title text (fallback or always shown beneath logo)
    this.add.text(W / 2, H * 0.38, 'CHAMPIONSHIP RUN', {
      fontSize: '16px', fontFamily: 'Impact, sans-serif',
      color: '#ffffff', letterSpacing: 5,
      stroke: '#2a5a10', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // PLAY button
    const playBtn = this._makeButton(W / 2, H * 0.56, '▶  PLAY', 0xff6600, 0xaa3300);
    playBtn.on('pointerdown', () => this._startGame());

    // CREDITS button
    const credBtn = this._makeButton(W / 2, H * 0.68, 'CREDITS', 0x333333, 0x111111);
    credBtn.on('pointerdown', () => this._showCredits(W, H));

    this._creditsVisible = false;
  }

  _makeButton(x, y, label, fillColor, strokeColor) {
    const btn = this.add.container(x, y).setDepth(7).setSize(220, 44).setInteractive();
    const bg = this.add.rectangle(0, 0, 220, 44, fillColor).setStrokeStyle(2, strokeColor);
    const txt = this.add.text(0, 0, label, {
      fontSize: '18px', fontFamily: 'Impact, sans-serif', color: '#ffffff',
    }).setOrigin(0.5);
    btn.add([bg, txt]);
    btn.on('pointerover', () => bg.setScale(1.05));
    btn.on('pointerout', () => bg.setScale(1));
    return btn;
  }

  _showCredits(W, H) {
    if (this._creditsVisible) return;
    this._creditsVisible = true;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82).setDepth(10).setInteractive();
    const lines = [
      'LoCoPro Championship Run',
      '',
      'Longmont, CO Professional Wrestling',
      'locopro.pw',
      '',
      'Characters & Logos © LoCoPro',
      '',
      'Tap / click anywhere to close',
    ];
    const txt = this.add.text(W / 2, H / 2, lines.join('\n'), {
      fontSize: '14px', fontFamily: 'Impact, sans-serif', color: '#ffd700',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setDepth(11);
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); this._creditsVisible = false; });
  }

  _addInput() {
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
  }

  update() {
    this._mtnSprite.tilePositionX += 0.3;
    this._hillSprite.tilePositionX += 0.7;
  }

  _startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('SelectScene'));
  }
}
