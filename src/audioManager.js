const MUSIC_DEFS = {
  menu:    { key: 'music_menu_intro', loop: true  },
  final:   { key: 'music_final',      loop: false },
  fanfare: { key: 'music_fanfare',    loop: false },
  zone1:   { key: 'music_z1_intro',   loop: true  },
  zone2:   { key: 'music_z2_intro',   loop: true  },
  zone3:   { key: 'music_z3_intro',   loop: true  },
  zone4:   { key: 'music_z4_intro',   loop: true  },
  zone5:   { key: 'music_z5_intro',   loop: true  },
};

const MUTE_KEY = 'locopro_muted';

export function playMusic(scene, key) {
  const reg = scene.game.registry;
  if (reg.get('bgMusicKey') === key) return;

  _stopCurrent(reg);
  reg.set('bgMusicKey', key);

  const def = MUSIC_DEFS[key];
  if (!def) return;

  const mgr = scene.game.sound;
  const sound = mgr.add(def.key, { volume: 0.65, loop: def.loop });
  reg.set('bgMusicIntro', sound);
  reg.set('bgMusicLoop', null);
  sound.play();
}

export function stopMusic(scene) {
  _stopCurrent(scene.game.registry);
  scene.game.registry.set('bgMusicKey', null);
}

// Returns the new mute state (true = now muted).
export function toggleMute(game) {
  const muted = !isMuted();
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
  game.sound.mute = muted;
  return muted;
}

export function isMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

// Call once at game start to restore saved mute preference.
export function applyMuteState(game) {
  game.sound.mute = isMuted();
}

function _stopCurrent(reg) {
  try { reg.get('bgMusicIntro')?.destroy(); } catch {}
  try { reg.get('bgMusicLoop')?.destroy(); } catch {}
  reg.set('bgMusicIntro', null);
  reg.set('bgMusicLoop', null);
}
