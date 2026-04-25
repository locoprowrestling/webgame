import { getCharacter, getTraitPhysics } from '../src/characters.js';
import { loadLevel, buildGround, buildPlatforms, getCheckpoints } from '../src/levelLoader.js';
import { spawnObstacle, updateObstacle } from '../src/obstacles.js';
import { saveResult } from '../src/saveSystem.js';

const GROUND_Y = 456;   // top of ground strip
const CANVAS_W = 888;
const CANVAS_H = 500;
const PLAYER_START_X = CANVAS_W / 2;
const WORLD_GRAVITY = 1200;
const BASE_SCROLL = { 1:220, 2:260, 3:300, 4:340, 5:380 };

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this._characterId = data.characterId || 'anuka';
    this._levelNum = data.level || 1;
    this._isShuttingDown = false;
    this._hudLaunched = false;
    this._createStage = 'init';

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this._onShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this._onDestroy, this);
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
    this._finishX = null;
    this._interactionPoints = [];
    this._baseScrollSpeed = 0;
    this._currentPlayerState = null;

    try {
      this._createStage = 'loadLevel';
      this._levelData = await loadLevel(this, this._levelNum);
      if (!this._canContinueSceneSetup()) return;

      const zone = this._levelData.zone || 1;
      const baseSpeed = this._levelData.scrollSpeed || BASE_SCROLL[zone] || 220;
      this._baseScrollSpeed = baseSpeed * this._physics.scrollSpeedMult;
      this._scrollSpeed = this._baseScrollSpeed;
      this._buildPacingProfile();

      this._createStage = 'worldBounds';
      this.physics.world.setBounds(0, 0, this._levelData.endX + CANVAS_W, CANVAS_H);
      this.cameras.main.setBounds(0, 0, this._levelData.endX + CANVAS_W, CANVAS_H);

      this._createStage = 'background';
      this._buildBackground(zone);
      this._createStage = 'ground';
      this._buildGround();
      this._createStage = 'platforms';
      this._buildPlatforms();
      this._createStage = 'player';
      this._buildPlayer();
      this._createStage = 'obstacles';
      this._buildObstacles();
      this._createStage = 'checkpoints';
      this._buildCheckpoints();
      this._createStage = 'finishFlag';
      this._buildFinishFlag();
      this._createStage = 'camera';
      this._setupCamera();
      this._createStage = 'input';
      this._setupInput();

      if (this.scene.isActive('UIScene')) {
        this.scene.stop('UIScene');
      }

      this._createStage = 'uiSceneLaunch';
      this.scene.launch('UIScene', {
        characterId: this._characterId,
        level: this._levelNum,
        hearts: this._hearts,
        levelName: this._levelData.name,
      });
      this._hudLaunched = true;

      this._createStage = 'fadeIn';
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this._createStage = 'ready';
    } catch (error) {
      this._handleCreateError(error);
      return;
    }
  }

  _canContinueSceneSetup() {
    return !this._isShuttingDown && this.scene.isActive(this.sys.settings.key);
  }

  _handleCreateError(error) {
    console.error(
      `GameScene.create failed during ${this._createStage} (level ${this._levelNum}, character ${this._characterId})`,
      error
    );

    if (this._hudLaunched && this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
      this._hudLaunched = false;
    }

    this._teardownRuntime();

    if (this._canContinueSceneSetup()) {
      this.scene.start('SelectScene', { level: this._levelNum });
    }
  }

  _onShutdown() {
    this._isShuttingDown = true;
    this._teardownRuntime();
  }

  _onDestroy() {
    this._isShuttingDown = true;
    this._teardownRuntime();
  }

  _teardownRuntime() {
    this._holding = false;

    if (this.input) {
      if (this._handlePointerDown) this.input.off('pointerdown', this._handlePointerDown);
      if (this._handlePointerUp) this.input.off('pointerup', this._handlePointerUp);
    }

    if (this._jumpKey) {
      if (this._handleJumpDown) this._jumpKey.off('down', this._handleJumpDown);
      if (this._handleJumpUp) this._jumpKey.off('up', this._handleJumpUp);
    }

    this._handlePointerDown = null;
    this._handlePointerUp = null;
    this._handleJumpDown = null;
    this._handleJumpUp = null;
    this._jumpKey = null;
    this._player = null;
    this._obstacles = [];
    this._currentPlayerState = null;
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
      sg.fillTriangle(222, 0, 156, CANVAS_H, 288, CANVAS_H);
      sg.fillTriangle(666, 0, 600, CANVAS_H, 732, CANVAS_H);
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
    const sheetKey = `sheet_${this._characterId}`;
    if (!this.textures.exists(sheetKey)) {
      throw new Error(`Missing player spritesheet: ${sheetKey}`);
    }

    this._player = this.physics.add.sprite(PLAYER_START_X, GROUND_Y - 4, sheetKey, 0).setOrigin(0.5, 1).setDepth(10);
    if (!this._player.body) {
      throw new Error(`Player physics body was not created: ${sheetKey}`);
    }

    this._walkAnimKey = `walk_${this._characterId}`;
    this._currentPlayerState = null;
    this._player.play(this._walkAnimKey);

    const frame = this.textures.getFrame(sheetKey, 0);
    const fw = frame.realWidth;
    this._player.body.setSize(32, 84).setOffset((fw - 32) / 2, 96 - 84 - 4);
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

  _buildPacingProfile() {
    const markers = [];

    (this._levelData?.gaps || []).forEach(gap => markers.push(gap.x - 60));
    (this._levelData?.obstacles || []).forEach(obs => markers.push(obs.x));
    (this._levelData?.platforms || []).forEach(platform => {
      if (platform.y < GROUND_Y - 18) markers.push(platform.x);
    });
    (this._levelData?.checkpoints || []).forEach(cp => markers.push(cp.x));
    markers.push((this._levelData?.endX || 0) - 100);

    this._interactionPoints = markers
      .filter(value => Number.isFinite(value))
      .sort((a, b) => a - b);
  }

  _buildObstacles() {
    this._obstacleGroup = this.physics.add.group();
    const crumblingObstacles = [];

    (this._levelData.obstacles || []).forEach(obs => {
      const y = obs.y !== undefined ? obs.y : GROUND_Y;
      const obj = spawnObstacle(this, obs.type, obs.x, y, obs);
      if (!obj?.body) {
        throw new Error(`Obstacle physics body was not created: ${obs.type} @ (${obs.x}, ${y})`);
      }
      obj.setDepth(8);
      this._obstacles.push(obj);

      if (obj.obstacleDef.behavior === 'crumbling') {
        obj.body.setImmovable(true);
        obj.isCrumbling = true;
        crumblingObstacles.push(obj);
      } else {
        this._obstacleGroup.add(obj);
        obj.resetObstacleBody?.();
      }
    });

    this.physics.add.overlap(
      this._player, this._obstacleGroup,
      this._onHitObstacle, null, this
    );

    if (crumblingObstacles.length) {
      this.physics.add.collider(
        this._player,
        crumblingObstacles,
        this._onPlatformLand,
        (player, platform) => {
          return player.body.velocity.y >= 0 &&
                 player.body.bottom <= platform.body.top + 8;
        },
        this
      );
    }
  }

  _buildCheckpoints() {
    this._checkpointData = getCheckpoints(this._levelData);
    this._checkpointSprites = [];

    if (this._checkpointData.length && !this.textures.exists('checkpoint')) {
      throw new Error('Missing checkpoint texture');
    }

    this._checkpointData.forEach((cp, i) => {
      const sprite = this.add.image(cp.x, GROUND_Y - 20, 'checkpoint')
        .setOrigin(0.5, 1).setDepth(9);
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
    if (!this.textures.exists('flag')) {
      throw new Error('Missing finish flag texture');
    }

    const fx = this._levelData.endX - 100;
    this._finishX = fx;
    this.add.image(fx, GROUND_Y - 4, 'flag').setOrigin(0.5, 1).setDepth(9);

    // Treat the flag as a finish line, not a tiny target at ground height.
    const finishBody = this.add.rectangle(fx, CANVAS_H / 2, 72, CANVAS_H + 120, 0, 0);
    this.physics.add.existing(finishBody, true);
    this.physics.add.overlap(this._player, finishBody, this._onLevelComplete, null, this);
  }

  _setupCamera() {
    const cam = this.cameras.main;
    cam.roundPixels = true;
    cam.startFollow(this._player, false, 1, 0);
    cam.setFollowOffset(0, 0);
  }

  _setupInput() {
    this._jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._handlePointerDown = () => this._jumpPressed();
    this._handlePointerUp = () => this._holdReleased();
    this._handleJumpDown = () => this._jumpPressed();
    this._handleJumpUp = () => this._holdReleased();

    this.input.on('pointerdown', this._handlePointerDown);
    this.input.on('pointerup', this._handlePointerUp);
    this._jumpKey.on('down', this._handleJumpDown);
    this._jumpKey.on('up', this._handleJumpUp);

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
          if (platform.active) platform.destroy();
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
      sprite.setTexture('checkpoint_lit');
      this.tweens.add({
        targets: sprite, scaleX: 1.15, scaleY: 1.15,
        yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut',
      });
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
    this._setPlayerState('idle', 0);

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

  _hasCrossedFinishLine(player) {
    return !!this._finishX && !!player?.body && player.body.right >= this._finishX;
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
    let spawnX = PLAYER_START_X;
    if (this._checkpointIndex >= 0 && this._checkpointData[this._checkpointIndex]) {
      spawnX = this._checkpointData[this._checkpointIndex].x;
    }
    this._player.setPosition(spawnX, GROUND_Y - 4);
    this._player.setAngle(0);
    this._player.body.allowGravity = true;
    this._player.body.setVelocity(0, 0);
    this._player.body.setAcceleration(0, 0);
    this._player.body.setGravityY(0);
    this._holding = false;
    this._isJumping = false;
    this._jumpBufferTimer = -1000;
    this._coyoteTimer = 0;
    this._setPlayerState('walk');

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
    if (!this._player?.body || !this._player.active || this._dead || this._levelComplete) return;

    this._updateScrollSpeed(delta);
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

    this._updatePlayerPresentation(time, onGround);
    this._wasOnGround = onGround;

    if (this._hasCrossedFinishLine(p)) {
      this._onLevelComplete();
      return;
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

  _getNextInteractionDistance(playerX) {
    for (const marker of this._interactionPoints) {
      if (marker >= playerX) return marker - playerX;
    }
    return 0;
  }

  _updateScrollSpeed(delta) {
    const playerX = this._player?.x || 0;
    const progress = Phaser.Math.Clamp(playerX / Math.max(this._levelData?.endX || 1, 1), 0, 1);
    const nextDistance = this._getNextInteractionDistance(playerX);

    let target = this._baseScrollSpeed * (1 + progress * 0.12);

    if (nextDistance > 720) {
      const sprintBoost = Phaser.Math.Clamp((nextDistance - 720) / 680, 0, 1);
      target *= Phaser.Math.Linear(1.04, 1.22, sprintBoost);
    } else if (nextDistance < 180) {
      const caution = Phaser.Math.Clamp((180 - nextDistance) / 180, 0, 1);
      target *= Phaser.Math.Linear(1, 0.92, caution);
    }

    target = Phaser.Math.Clamp(
      target,
      this._baseScrollSpeed * 0.9,
      this._baseScrollSpeed * 1.25
    );

    const lerp = Phaser.Math.Clamp(delta / 280, 0.04, 0.18);
    this._scrollSpeed = Phaser.Math.Linear(this._scrollSpeed, target, lerp);
  }

  _setPlayerState(state, frame = null) {
    if (this._currentPlayerState === state) return;
    this._currentPlayerState = state;
    if (state === 'walk') {
      this._player.play(this._walkAnimKey, true);
    } else {
      this._player.stop();
      if (frame !== null) this._player.setFrame(frame);
    }
  }

  _updatePlayerPresentation(time, onGround) {
    const p = this._player;
    const vy = p.body.velocity.y;

    if (!onGround) {
      if (this._holding && vy > 90 && this._physics.glideGravityMult < 0.5) {
        this._setPlayerState('glide', 8);
        p.setAngle(6);
      } else if (vy < -60) {
        this._setPlayerState('jump', 8);
        p.setAngle(-10);
      } else {
        this._setPlayerState('jump', 8);
        p.setAngle(Phaser.Math.Clamp(vy * 0.025, -8, 12));
      }
      return;
    }

    p.setAngle(0);
    if (!this._wasOnGround) {
      this.tweens.add({
        targets: p,
        scaleX: 1.08,
        scaleY: 0.88,
        yoyo: true,
        duration: 90,
      });
    }

    this._setPlayerState('walk');
    const strideMs = Phaser.Math.Clamp(180 - ((this._scrollSpeed - this._baseScrollSpeed) * 0.18), 90, 180);
    this._player.anims.timeScale = 100 / strideMs;
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
