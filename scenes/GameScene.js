import { getCharacter, getTraitPhysics } from '../src/characters.js';
import { loadLevel, buildGround, buildPlatforms, getCheckpoints } from '../src/levelLoader.js';
import { spawnObstacle, updateObstacle } from '../src/obstacles.js';
import { saveResult } from '../src/saveSystem.js';

const GROUND_Y = 456;   // top of ground strip
const CANVAS_W = 800;
const CANVAS_H = 500;
const WORLD_GRAVITY = 1200;
const BASE_SCROLL = { 1:220, 2:260, 3:300, 4:340, 5:380 };

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this._characterId = data.characterId || 'anuka';
    this._levelNum = data.level || 1;
  }

  async create() {
    this._char = getCharacter(this._characterId);
    this._physics = getTraitPhysics(this._char.trait);
    this._hearts = 3;
    this._score = 0;
    this._checkpointIndex = -1;
    this._dead = false;
    this._levelComplete = false;
    this._obstacles = [];
    this._crumbleTimers = new Map();

    try {
      this._levelData = await loadLevel(this, this._levelNum);
    } catch (e) {
      console.error(e);
      this.scene.start('TitleScene');
      return;
    }

    const zone = this._levelData.zone || 1;
    const baseSpeed = BASE_SCROLL[zone] || 220;
    this._scrollSpeed = baseSpeed * this._physics.scrollSpeedMult;

    this.physics.world.setBounds(0, 0, this._levelData.endX + CANVAS_W, CANVAS_H);
    this.cameras.main.setBounds(0, 0, this._levelData.endX + CANVAS_W, CANVAS_H);

    this._buildBackground(zone);
    this._buildGround();
    this._buildPlatforms();
    this._buildPlayer();
    this._buildObstacles();
    this._buildCheckpoints();
    this._buildFinishFlag();
    this._setupCamera();
    this._setupInput();

    // Launch HUD overlay
    this.scene.launch('UIScene', {
      characterId: this._characterId,
      level: this._levelNum,
      hearts: this._hearts,
      levelName: this._levelData.name,
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // ── Background ────────────────────────────────────────────────────────────
  _buildBackground(zone) {
    const bgColors = { 1:0x87ceeb, 2:0x6a9dcc, 3:0x5588bb, 4:0x7ab0d4, 5:0x0a0a1a };
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, bgColors[zone] || 0x87ceeb)
      .setScrollFactor(0).setDepth(0);

    // Sun / spotlight
    if (zone < 5) {
      this.add.circle(CANVAS_W - 70, 55, 26, 0xffd700).setScrollFactor(0).setDepth(1);
    } else {
      // Arena spotlights
      const sg = this.add.graphics().setScrollFactor(0).setDepth(1);
      sg.fillStyle(0xffffcc, 0.15);
      sg.fillTriangle(200, 0, 140, CANVAS_H, 260, CANVAS_H);
      sg.fillTriangle(600, 0, 540, CANVAS_H, 660, CANVAS_H);
    }

    const mtxKey = ['bg_mtn_z1','bg_bld_z2','bg_mtn_z3','bg_tent_z4','bg_crowd_z5'][zone - 1];
    const hillKey = zone === 1 ? 'bg_hill_z1' : (zone === 3 ? 'bg_pine_z3' : null);

    const bgYOffsets = { 1:160, 2:140, 3:150, 4:170, 5:200 };
    const bgY = bgYOffsets[zone] || 160;

    if (this.textures.exists(mtxKey)) {
      this._bgMtn = this.add.tileSprite(0, bgY, CANVAS_W, 140, mtxKey)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(2);
    }
    if (hillKey && this.textures.exists(hillKey)) {
      this._bgHill = this.add.tileSprite(0, CANVAS_H - 100, CANVAS_W, 60, hillKey)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(3);
    }

    // Ground visual
    this.add.rectangle(CANVAS_W / 2, CANVAS_H - 22, CANVAS_W, 44, 0x4a8c2a)
      .setScrollFactor(0).setDepth(4);
    this.add.rectangle(CANVAS_W / 2, CANVAS_H - 44, CANVAS_W, 4, 0x2d5a1b)
      .setScrollFactor(0).setDepth(4);

    // Draw gap/pit visuals in the world
    (this._levelData?.gaps || []).forEach(gap => {
      this.add.rectangle(gap.x + gap.width / 2, CANVAS_H - 22, gap.width, 44, 0x0a1a0a).setDepth(4);
    });
  }

  // ── Physics world ─────────────────────────────────────────────────────────
  _buildGround() {
    this._groundGroup = buildGround(this, this._levelData);
  }

  _buildPlatforms() {
    this._platformGroup = buildPlatforms(this, this._levelData);
  }

  _buildPlayer() {
    const key = `char_${this._characterId}`;
    this._player = this.physics.add.sprite(160, GROUND_Y - 4, key).setOrigin(0.5, 1).setDepth(10);
    this._player.body.setSize(32, 84).setOffset(6, 4);
    this._player.body.maxVelocityY = 900;

    // Ground + platform colliders
    this.physics.add.collider(this._player, this._groundGroup);
    this.physics.add.collider(this._player, this._platformGroup, this._onPlatformLand, null, this);

    // State
    this._coyoteTimer = 0;
    this._jumpBufferTimer = -1000;
    this._isJumping = false;
    this._wasOnGround = true;
    this._invincible = false;
  }

  _buildObstacles() {
    this._obstacleGroup = this.physics.add.group();

    (this._levelData.obstacles || []).forEach(obs => {
      const y = obs.y !== undefined ? obs.y : GROUND_Y;
      const obj = spawnObstacle(this, obs.type, obs.x, y, obs);
      obj.setDepth(8);
      this._obstacleGroup.add(obj);
      this._obstacles.push(obj);
    });

    this.physics.add.overlap(
      this._player, this._obstacleGroup,
      this._onHitObstacle, null, this
    );
  }

  _buildCheckpoints() {
    this._checkpointData = getCheckpoints(this._levelData);
    this._checkpointSprites = [];

    this._checkpointData.forEach((cp, i) => {
      const sprite = this.add.image(cp.x, GROUND_Y - 20, 'checkpoint')
        .setOrigin(0.5, 1).setDepth(9).setAlpha(0.9);
      this._checkpointSprites.push(sprite);
    });

    this._cpOverlapGroup = this.physics.add.staticGroup();
    this._checkpointData.forEach((cp, i) => {
      const body = this.add.rectangle(cp.x, GROUND_Y - 20, 20, 40, 0x000000, 0).setDepth(9);
      this.physics.add.existing(body, true);
      this._cpOverlapGroup.add(body);
      body._cpIndex = i;
    });

    this.physics.add.overlap(this._player, this._cpOverlapGroup, this._onCheckpoint, null, this);
  }

  _buildFinishFlag() {
    const fx = this._levelData.endX - 100;
    this.add.image(fx, GROUND_Y - 4, 'flag').setOrigin(0.5, 1).setDepth(9);

    const finishBody = this.add.rectangle(fx, GROUND_Y - 24, 40, 48, 0, 0);
    this.physics.add.existing(finishBody, true);
    this.physics.add.overlap(this._player, finishBody, this._onLevelComplete, null, this);
  }

  _setupCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this._player, false, 1, 0);
    // Keep player at ~x=160 on screen (center is 400, offset = 400-160 = 240)
    cam.setFollowOffset(240, 0);
  }

  _setupInput() {
    this._jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', () => this._jumpPressed());
    this.input.on('pointerup', () => this._holdReleased());

    this._jumpKey.on('down', () => this._jumpPressed());
    this._jumpKey.on('up', () => this._holdReleased());

    this._holding = false;
  }

  // ── Input handlers ────────────────────────────────────────────────────────
  _jumpPressed() {
    if (this._dead || this._levelComplete) return;
    this._holding = true;
    this._jumpBufferTimer = this.time.now;
  }

  _holdReleased() {
    this._holding = false;
  }

  // ── Collision callbacks ───────────────────────────────────────────────────
  _onPlatformLand(player, platform) {
    if (!platform.isCrumbling || platform._crumbling) return;
    platform._crumbling = true;
    this.time.delayedCall(900, () => {
      if (platform.active) {
        this.tweens.add({ targets: platform, alpha: 0, duration: 200, onComplete: () => {
          this._platformGroup.remove(platform, true, true);
        }});
      }
    });
  }

  _onCheckpoint(player, cpBody) {
    const i = cpBody._cpIndex;
    if (i <= this._checkpointIndex) return;
    this._checkpointIndex = i;
    const sprite = this._checkpointSprites[i];
    if (sprite) {
      this.tweens.add({ targets: sprite, scaleY: 1.4, yoyo: true, duration: 120 });
      sprite.setTint(0xffd700);
    }
    this.events.emit('checkpointReached', i + 1, this._checkpointData.length);
  }

  _onHitObstacle(player, obstacle) {
    if (this._invincible || this._dead || this._levelComplete) return;
    this._takeDamage();
  }

  _onLevelComplete() {
    if (this._levelComplete || this._dead) return;
    this._levelComplete = true;
    this._player.body.setVelocity(0, 0);
    this._player.body.allowGravity = false;

    const stars = this._hearts;
    saveResult(this._characterId, this._levelNum, stars);
    this.scene.stop('UIScene');
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LevelCompleteScene', {
        characterId: this._characterId,
        level: this._levelNum,
        stars,
        score: this._score,
      });
    });
  }

  // ── Damage / death ────────────────────────────────────────────────────────
  _takeDamage() {
    this._hearts = Math.max(0, this._hearts - 1);
    this.events.emit('heartLost', this._hearts);
    this.cameras.main.shake(220, 0.012);

    if (this._hearts <= 0) {
      this._die();
      return;
    }

    this._invincible = true;
    this._respawn();
    this.time.delayedCall(1800, () => { this._invincible = false; });
  }

  _respawn() {
    let spawnX = 160;
    if (this._checkpointIndex >= 0 && this._checkpointData[this._checkpointIndex]) {
      spawnX = this._checkpointData[this._checkpointIndex].x;
    }
    this._player.setX(spawnX);
    this._player.setY(GROUND_Y);
    this._player.body.setVelocity(0, 0);
    this._isJumping = false;

    // Flash for invincibility feedback
    this.tweens.add({
      targets: this._player, alpha: 0, yoyo: true, repeat: 6,
      duration: 130, onComplete: () => this._player.setAlpha(1),
    });
  }

  _die() {
    if (this._dead) return;
    this._dead = true;
    this._player.body.setVelocity(0, -400);
    this._player.body.allowGravity = true;

    this.scene.stop('UIScene');
    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', {
          characterId: this._characterId,
          level: this._levelNum,
          checkpointX: this._checkpointIndex >= 0
            ? this._checkpointData[this._checkpointIndex]?.x
            : null,
        });
      });
    });
  }

  // ── Update loop ───────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this._player || this._dead || this._levelComplete) return;

    this._updatePlayer(time, delta);
    this._updateObstacles(time, delta);
    this._updateParallax();
    this._updateScore();
    this._cleanupOffscreen();
  }

  _updatePlayer(time, delta) {
    const p = this._player;
    const onGround = p.body.blocked.down;

    // Maintain auto-scroll velocity
    p.body.setVelocityX(this._scrollSpeed);

    // Coyote time tracking
    if (onGround) {
      this._coyoteTimer = time;
      this._isJumping = false;
    }
    const coyoteValid = (time - this._coyoteTimer) < 80 && !this._isJumping;
    const canJump = onGround || coyoteValid;

    // Jump buffer: fire jump if buffer active and we can jump
    const bufferValid = (time - this._jumpBufferTimer) < 100;
    if (canJump && bufferValid && this._jumpBufferTimer > 0) {
      p.body.setVelocityY(this._physics.jumpVelocity);
      this._isJumping = true;
      this._jumpBufferTimer = -1000;
    }

    // Glide: reduce gravity while holding and falling
    if (this._holding && p.body.velocity.y > 0) {
      const glideG = -WORLD_GRAVITY * (1 - this._physics.glideGravityMult);
      p.body.setGravityY(glideG);
    } else {
      p.body.setGravityY(0);
    }

    // Visual lean: tilt forward when jumping, squash on landing
    if (!onGround) {
      p.setAngle(-12);
    } else {
      p.setAngle(0);
      if (!this._wasOnGround) {
        this.tweens.add({ targets: p, scaleY: 0.82, yoyo: true, duration: 80 });
      }
    }
    this._wasOnGround = onGround;

    // Running bob while on ground
    if (onGround && !this._bobTween) {
      this._bobTween = this.tweens.add({
        targets: p, y: p.y - 3, yoyo: true, repeat: -1, duration: 140,
      });
    } else if (!onGround && this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }

    // Fell into a pit
    if (p.y > CANVAS_H + 100 && !this._dead) {
      this._takeDamage();
    }
  }

  _updateObstacles(time, delta) {
    this._obstacles.forEach(obs => {
      if (!obs.active) return;
      updateObstacle(obs, time, delta);
    });
  }

  _updateParallax() {
    const scrollX = this.cameras.main.scrollX;
    if (this._bgMtn) this._bgMtn.tilePositionX = scrollX * 0.12;
    if (this._bgHill) this._bgHill.tilePositionX = scrollX * 0.3;
  }

  _updateScore() {
    const newScore = Math.floor(this._player.x / 10) * 10;
    if (newScore !== this._score) {
      this._score = newScore;
      this.events.emit('scoreUpdate', this._score);
    }
  }

  _cleanupOffscreen() {
    const leftEdge = this.cameras.main.scrollX - 400;
    this._obstacles = this._obstacles.filter(obs => {
      if (obs.active && obs.x < leftEdge) {
        obs.destroy();
        return false;
      }
      return obs.active;
    });
  }
}
