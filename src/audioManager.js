const MUSIC_DEFS = {
  menu:    { intro: 'music_menu_intro',  loop: 'music_menu_loop'  },
  final:   { intro: 'music_final',       loop: null               },
  fanfare: { intro: 'music_fanfare',     loop: null               },
  zone1:   { intro: 'music_z1_intro',    loop: 'music_z1_loop'    },
  zone2:   { intro: 'music_z2_intro',    loop: 'music_z2_loop'    },
  zone3:   { intro: 'music_z3_intro',    loop: 'music_z3_loop'    },
  zone4:   { intro: 'music_z4_intro',    loop: 'music_z4_loop'    },
  zone5:   { intro: 'music_z5_intro',    loop: 'music_z5_loop'    },
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
  const intro = mgr.add(def.intro, { volume: 0.65 });
  reg.set('bgMusicIntro', intro);

  if (def.loop) {
    const loopSound = mgr.add(def.loop, { volume: 0.65, loop: true });
    reg.set('bgMusicLoop', loopSound);
    intro.once('complete', () => {
      if (reg.get('bgMusicKey') === key) loopSound.play();
    });
  } else {
    reg.set('bgMusicLoop', null);
  }

  intro.play();
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
