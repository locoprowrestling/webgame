import { CHARACTERS } from '../src/characters.js';
import { getTotalStars, getStarsForLevel } from '../src/saveSystem.js';

const FACTIONS = [
  { key: 'rising', label: 'THE RISING', logoKey: 'logo_rising' },
  { key: 'pillars', label: 'THE PILLARS', logoKey: 'logo_pillars' },
];

export default class SelectScene extends Phaser.Scene {
  constructor() { super('SelectScene'); }

  init(data) {
    this._startLevel = data.level || 1;
    this._launching = false;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this._selectedId = null;
    this._cards = [];

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d2a0d);
    this.add.rectangle(W / 2, 24, W, 48, 0x061a06);
    this.add.text(W / 2, 24, 'SELECT YOUR WRESTLER', {
      fontSize: '18px', fontFamily: 'Impact, sans-serif',
      color: '#ffd700', letterSpacing: 4,
    }).setOrigin(0.5);

    this._buildGrid(W, H);
    this._buildInfoBar(W, H);
    this._addInput();

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _buildGrid(W, H) {
    const CARD_W = 86, CARD_H = 108, GAP_X = 6, GAP_Y = 8;
    const SECTION_HEADER_H = 32;
    let curY = 56;

    FACTIONS.forEach(faction => {
      const chars = CHARACTERS.filter(c => c.faction === faction.key);
      const rowW = chars.length * (CARD_W + GAP_X) - GAP_X;
      const startX = (W - rowW) / 2;

      // Faction header
      const headerBg = this.add.rectangle(W / 2, curY + SECTION_HEADER_H / 2, W - 20, SECTION_HEADER_H, 0x112211)
        .setStrokeStyle(1, 0x3a6a3a);
      if (this.textures.exists(faction.logoKey)) {
        const logo = this.add.image(W / 2 - 80, curY + SECTION_HEADER_H / 2, faction.logoKey).setOrigin(0.5);
        const s = Math.min(60 / logo.width, 22 / logo.height);
        logo.setScale(s);
      }
      this.add.text(W / 2, curY + SECTION_HEADER_H / 2, faction.label, {
        fontSize: '12px', fontFamily: 'Impact, sans-serif',
        color: '#aaddaa', letterSpacing: 3,
      }).setOrigin(0.5);
      curY += SECTION_HEADER_H + 4;

      // Character cards
      chars.forEach((char, i) => {
        const cx = startX + i * (CARD_W + GAP_X) + CARD_W / 2;
        const cy = curY + CARD_H / 2;
        this._makeCard(char, cx, cy, CARD_W, CARD_H);
      });
      curY += CARD_H + GAP_Y + 8;
    });
  }

  _makeCard(char, cx, cy, cw, ch) {
    const card = this.add.container(cx, cy).setSize(cw, ch).setInteractive();

    const border = this.add.rectangle(0, 0, cw, ch, 0x1a3a1a).setStrokeStyle(1, 0x3a6a3a);
    card.add(border);

    // Portrait image
    if (this.textures.exists(`portrait_${char.id}`)) {
      const img = this.add.image(0, -8, `portrait_${char.id}`).setOrigin(0.5, 0.5);
      const s = Math.min((cw - 4) / img.width, (ch - 24) / img.height);
      img.setScale(s);
      card.add(img);
    } else {
      const placeholder = this.add.rectangle(0, -8, cw - 6, ch - 26, char.color);
      card.add(placeholder);
    }

    // Name label
    const nameText = this.add.text(0, ch / 2 - 11, char.name.toUpperCase(), {
      fontSize: '10px', fontFamily: 'Impact, sans-serif', color: '#ffd700',
      stroke: '#000', strokeThickness: 3,
      wordWrap: { width: cw - 4 },
      align: 'center',
    }).setOrigin(0.5, 0.5);
    card.add(nameText);

    // Stars strip
    const stars = getTotalStars(char.id);
    if (stars > 0) {
      const starTxt = this.add.text(0, ch / 2 - 2, '★'.repeat(Math.min(stars, 5)), {
        fontSize: '7px', color: '#ffd700',
      }).setOrigin(0.5, 0);
      card.add(starTxt);
    }

    card._char = char;
    card._border = border;

    card.on('pointerover', () => {
      if (this._selectedId !== char.id) border.setStrokeStyle(2, 0x88cc88);
    });
    card.on('pointerout', () => {
      if (this._selectedId !== char.id) border.setStrokeStyle(1, 0x3a6a3a);
    });
    card.on('pointerdown', () => {
      if (this._selectedId === char.id) { this._launch(); return; }
      this._selectChar(char, card);
    });

    this._cards.push(card);
  }

  _selectChar(char, card) {
    // Deselect previous
    this._cards.forEach(c => c._border.setStrokeStyle(1, 0x3a6a3a).setFillStyle(0x1a3a1a));
    this._selectedId = char.id;
    card._border.setStrokeStyle(2, 0xffd700).setFillStyle(0x2a4a2a);
    this._updateInfoBar(char);
  }

  _buildInfoBar(W, H) {
    this._infoBar = this.add.container(0, H - 46);

    const bg = this.add.rectangle(W / 2, 23, W, 46, 0x061a06).setStrokeStyle(1, 0xffd700);
    this._infoBar.add(bg);

    this._infoLogo = this.add.image(32, 23, 'logo_locopro').setOrigin(0.5).setAlpha(0.4);
    this._infoLogo.setScale(Math.min(40 / this._infoLogo.width, 28 / this._infoLogo.height));
    this._infoBar.add(this._infoLogo);

    this._infoName = this.add.text(70, 10, 'Choose a wrestler', {
      fontSize: '14px', fontFamily: 'Impact, sans-serif', color: '#ffd700',
    });
    this._infoBar.add(this._infoName);

    this._infoTrait = this.add.text(70, 28, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
    });
    this._infoBar.add(this._infoTrait);

    this._confirmBtn = this.add.container(W - 90, 23).setSize(140, 34).setInteractive().setAlpha(0.3);
    const btnBg = this.add.rectangle(0, 0, 140, 34, 0xff6600).setStrokeStyle(2, 0xaa3300);
    const btnTxt = this.add.text(0, 0, 'CONFIRM ▶', {
      fontSize: '14px', fontFamily: 'Impact, sans-serif', color: '#fff',
    }).setOrigin(0.5);
    this._confirmBtn.add([btnBg, btnTxt]);
    this._infoBar.add(this._confirmBtn);

    this._confirmBtn.on('pointerdown', () => {
      if (this._selectedId) this._launch();
    });
  }

  _updateInfoBar(char) {
    // Update logo
    const logoKey = `logo_${char.id}`;
    if (this.textures.exists(logoKey)) {
      this._infoLogo.setTexture(logoKey).setAlpha(1);
      this._infoLogo.setScale(Math.min(40 / this._infoLogo.width, 28 / this._infoLogo.height));
    }

    this._infoName.setText(char.name.toUpperCase());
    const traitDesc = {
      balanced: 'BALANCED — Default stats',
      floaty: 'FLOATY — Extended glide',
      heavy: 'HEAVY — Higher jump, faster fall',
      quick: 'QUICK — +8% run speed',
    }[char.trait] || '';
    this._infoTrait.setText(traitDesc);
    this._confirmBtn.setAlpha(1);
  }

  _addInput() {
    this.input.keyboard.on('keydown-SPACE', () => { if (this._selectedId) this._launch(); });
    this.input.keyboard.on('keydown-ENTER', () => { if (this._selectedId) this._launch(); });
    this.input.keyboard.on('keydown-ESC', () => this._goBack());
  }

  _goBack() {
    if (this._launching) return;
    this._launching = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
  }

  _launch() {
    if (this._launching) return;
    this._launching = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LevelSelectScene', { characterId: this._selectedId, level: this._startLevel });
    });
  }
}
