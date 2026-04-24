// Generates a character sprite texture in BootScene and registers it with Phaser's texture manager.
// Each character gets a unique texture key 'char_<id>' used in GameScene.

export function generateCharacterTextures(scene) {
  const { CHARACTERS } = window.__LCP__;

  CHARACTERS.forEach(char => {
    const key = `char_${char.id}`;
    if (scene.textures.exists(key)) return;

    const g = scene.add.graphics();
    const w = 44, h = 88;
    const bodyColor = char.color;
    const skin = char.skinColor;

    // Body
    g.fillStyle(bodyColor, 1);
    g.fillRect(6, 20, w - 12, h - 40);

    // Head
    g.fillStyle(skin, 1);
    g.fillCircle(w / 2, 14, 13);

    // Arms
    g.fillStyle(bodyColor, 1);
    g.fillRect(0, 22, 8, 26);
    g.fillRect(w - 8, 22, 8, 26);

    // Legs
    g.fillRect(8, h - 28, 12, 28);
    g.fillRect(w - 20, h - 28, 12, 28);

    // Boots
    g.fillStyle(0x111111, 1);
    g.fillRect(6, h - 8, 16, 8);
    g.fillRect(w - 22, h - 8, 16, 8);

    g.generateTexture(key, w, h);
    g.destroy();
  });
}
