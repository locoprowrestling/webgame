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
    this.add.rectangle(W / 2, H / 2, W, H, 0x6a9dcc).setDepth(0);

    if (this.textures.exists('bg_dt_1')) {
      this._mtnSprite = this.add.tileSprite(0, -28, W, H + 28, 'bg_dt_1')
        .setOrigin(0, 0).setDepth(1);
    }
    if (this.textures.exists('bg_dt_2')) {
      this._hillSprite = this.add.tileSprite(0, H - 88, W, 44, 'bg_dt_2')
        .setOrigin(0, 0).setDepth(3);
    }

    // Ground strip
    if (this.textures.exists('tile_asphalt_road_01')) {
      this._groundSprite = this.add.tileSprite(0, H - 44, W, 44, 'tile_asphalt_road_01')
        .setOrigin(0, 0).setDepth(4);
    } else {
      this.add.rectangle(W / 2, H - 22, W, 44, 0x34373b).setDepth(4);
    }
    this.add.rectangle(W / 2, H - 44, W, 4, 0x202020).setDepth(4);
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
      fontSize: '13px', fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
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
      fontSize: '13px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff',
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
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffd700',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(11);
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); this._creditsVisible = false; });
  }

  _addInput() {
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
  }

  update() {
    if (this._mtnSprite) this._mtnSprite.tilePositionX += 0.25;
    if (this._hillSprite) this._hillSprite.tilePositionX += 0.55;
    if (this._groundSprite) this._groundSprite.tilePositionX += 0.9;
  }

  _startGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('SelectScene'));
  }
}
