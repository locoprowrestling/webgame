// Vigilante moved to The Rising per design update
export const CHARACTERS = [
  // ── The Rising ──────────────────────────────────────────────
  {
    id: 'anuka', name: 'Anuka Gutierrez', faction: 'rising',
    portrait: 'Assets/players-web/tas-anuka-gutierrez.png',
    logo: 'Assets/logos-web/logo-anuka.png',
    trait: 'balanced', color: 0xc2813a, skinColor: 0xd4956e, shortsColor: 0x1f2736,
    sheetW: 64,
  },
  {
    id: 'avalon', name: 'Avalon', faction: 'rising',
    portrait: 'Assets/players-web/tas-avalon.png',
    logo: 'Assets/logos-web/logo-avalon.png',
    trait: 'floaty', color: 0x7a2fa0, skinColor: 0xf0c8a0,
    sheetW: 62,
  },
  {
    id: 'carter', name: 'Carter Cash', faction: 'rising',
    portrait: 'Assets/players-web/tas-carter-cash.png',
    logo: 'Assets/logos-web/logo-carter-cash.png',
    trait: 'balanced', color: 0x2a4a8a, skinColor: 0xe0c090,
    sheetW: 78,
  },
  {
    id: 'erza', name: 'ERZA', faction: 'rising',
    portrait: 'Assets/players-web/tas-erza.png',
    logo: 'Assets/logos-web/logo-emt.png',
    trait: 'quick', color: 0xcc2200, skinColor: 0xf0b090,
    sheetW: 68,
  },
  {
    id: 'crash', name: 'Johnny Crash', faction: 'rising',
    portrait: 'Assets/players-web/tas-johnny-crash.png',
    logo: 'Assets/logos-web/logo-crash.png',
    trait: 'heavy', color: 0x222222, skinColor: 0xe8c080,
    sheetW: 68,
  },
  {
    id: 'glory', name: 'Major Glory', faction: 'rising',
    portrait: 'Assets/players-web/tas-major-glory.png',
    logo: 'Assets/logos-web/logo-major-glory.png',
    trait: 'heavy', color: 0xcc0000, skinColor: 0xe8c8a0,
    sheetW: 68,
  },
  {
    id: 'zeak', name: 'Zeak Gallent', faction: 'rising',
    portrait: 'Assets/players-web/tas-zeak-gallent.png',
    logo: 'Assets/logos-web/logo-zeak.png',
    trait: 'heavy', color: 0x1a5c1a, skinColor: 0xe0b880,
    sheetW: 70,
  },
  {
    id: 'vigilante', name: 'Vigilante OAI', faction: 'rising',
    portrait: 'Assets/players-web/tas-vigilante-oai.png',
    logo: 'Assets/logos-web/logo-vigilante.png',
    trait: 'floaty', color: 0x5a4a20, skinColor: 0xe0c090,
    sheetW: 68,
  },
  // ── The Pillars ──────────────────────────────────────────────
  {
    id: 'codah', name: 'Codah', faction: 'pillars',
    portrait: 'Assets/players-web/tas-codah.png',
    logo: 'Assets/logos-web/logo-codah.png',
    trait: 'heavy', color: 0x009988, skinColor: 0xd8b090,
    sheetW: 70,
  },
  {
    id: 'cody', name: 'Cody Devine', faction: 'pillars',
    portrait: 'Assets/players-web/tas-cody-devine.png',
    logo: 'Assets/logos-web/logo-cody-devine.png',
    trait: 'balanced', color: 0x6a0a0a, skinColor: 0xf0c890,
    sheetW: 68,
  },
  {
    id: 'dean', name: 'Dean Mercer', faction: 'pillars',
    portrait: 'Assets/players-web/tas-dean-mercer.png',
    logo: 'Assets/logos-web/logo-dean-mercer.png',
    trait: 'quick', color: 0x0a2060, skinColor: 0xe8c090,
    sheetW: 68,
  },
  {
    id: 'franky', name: 'Franky Gonzales', faction: 'pillars',
    portrait: 'Assets/players-web/tas-franky-gonzales.png',
    logo: 'Assets/logos-web/logo-franky.png',
    trait: 'balanced', color: 0xc8940a, skinColor: 0xd4906a,
    sheetW: 66,
  },
  {
    id: 'hussy', name: 'Hussy Steele', faction: 'pillars',
    portrait: 'Assets/players-web/tas-hussy.png',
    logo: 'Assets/logos-web/logo-hussy.png',
    trait: 'floaty', color: 0xe0208a, skinColor: 0xf0c0a0,
    sheetW: 68,
  },
  {
    id: 'jt', name: 'JT Staten', faction: 'pillars',
    portrait: 'Assets/players-web/tas-jt-staten.png',
    logo: 'Assets/logos-web/logo-jt-staten.png',
    trait: 'quick', color: 0x606060, skinColor: 0xc8a070,
    sheetW: 72,
  },
  {
    id: 'morgana', name: 'Morgana Lavey', faction: 'pillars',
    portrait: 'Assets/players-web/tas-morgana-lavey.png',
    logo: 'Assets/logos-web/logo-morgana-lavey.png',
    trait: 'floaty', color: 0x2a0a40, skinColor: 0xd0a080,
    sheetW: 72,
  },
  {
    id: 'nicky', name: 'Nicky Hyde', faction: 'pillars',
    portrait: 'Assets/players-web/tas-nicky-hyde.png',
    logo: 'Assets/logos-web/logo-nicky-hyde.png',
    trait: 'balanced', color: 0x0a6020, skinColor: 0xd8c090,
    sheetW: 76,
  },
];

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

// Base physics constants — traits modify these
export const BASE_PHYSICS = {
  jumpVelocity: -680,
  scrollSpeedMult: 1.0,
  glideGravityMult: 0.4,  // fraction of world gravity kept while gliding
};

export function getTraitPhysics(trait) {
  switch (trait) {
    case 'floaty':
      return { ...BASE_PHYSICS, glideGravityMult: 0.22 };
    case 'heavy':
      return { ...BASE_PHYSICS, jumpVelocity: -790, glideGravityMult: 0.55 };
    case 'quick':
      return { ...BASE_PHYSICS, scrollSpeedMult: 1.08 };
    default:
      return { ...BASE_PHYSICS };
  }
}
