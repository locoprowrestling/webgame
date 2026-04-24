import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import SelectScene from './scenes/SelectScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  width: 800,
  height: 500,
  backgroundColor: '#87ceeb',
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: [BootScene, TitleScene, SelectScene, GameScene, UIScene, LevelCompleteScene, GameOverScene]
};

const game = new Phaser.Game(config);

window.__LCP_GAME__ = game;
window.render_game_to_text = () => {
  const activeScenes = game.scene.scenes
    .filter(scene => scene.scene.isActive())
    .map(scene => scene.scene.key);
  const scene = game.scene.getScene('GameScene');

  if (!scene?.scene?.isActive()) {
    return JSON.stringify({ mode: activeScenes[0] || 'loading', activeScenes });
  }

  const player = scene._player;
  return JSON.stringify({
    mode: 'GameScene',
    level: scene._levelNum,
    hearts: scene._hearts,
    score: scene._score,
    dead: scene._dead,
    levelComplete: scene._levelComplete,
    player: player ? {
      x: Math.round(player.x),
      y: Math.round(player.y),
      vx: Math.round(player.body?.velocity?.x || 0),
      vy: Math.round(player.body?.velocity?.y || 0),
      body: player.body ? {
        x: Math.round(player.body.x),
        y: Math.round(player.body.y),
        w: Math.round(player.body.width),
        h: Math.round(player.body.height),
      } : null,
    } : null,
    obstacles: (scene._obstacles || [])
      .filter(obstacle => obstacle.active)
      .slice(0, 8)
      .map(obstacle => ({
        type: obstacle.obstacleType,
        x: Math.round(obstacle.x),
        y: Math.round(obstacle.y),
        texture: obstacle.texture?.key,
        frame: obstacle.frame?.name,
        body: obstacle.body ? {
          x: Math.round(obstacle.body.x),
          y: Math.round(obstacle.body.y),
          w: Math.round(obstacle.body.width),
          h: Math.round(obstacle.body.height),
          vx: Math.round(obstacle.body.velocity.x),
          vy: Math.round(obstacle.body.velocity.y),
          gravity: obstacle.body.allowGravity,
        } : null,
      })),
  });
};
