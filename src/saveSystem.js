const KEY = 'locopro_save';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { characters: {}, unlockedLevels: 1 };
  } catch {
    return { characters: {}, unlockedLevels: 1 };
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function getUnlockedLevels() {
  return load().unlockedLevels;
}

export function getCharacterStars(characterId) {
  const data = load();
  return data.characters[characterId]?.stars || [];
}

export function getStarsForLevel(characterId, level) {
  return getCharacterStars(characterId)[level - 1] || 0;
}

export function saveResult(characterId, level, stars) {
  const data = load();
  if (!data.characters[characterId]) {
    data.characters[characterId] = { stars: [] };
  }
  const existing = data.characters[characterId].stars[level - 1] || 0;
  data.characters[characterId].stars[level - 1] = Math.max(existing, stars);
  data.unlockedLevels = Math.max(data.unlockedLevels, level + 1);
  save(data);
}

export function getTotalStars(characterId) {
  return getCharacterStars(characterId).reduce((a, b) => a + b, 0);
}

export function clearAll() {
  localStorage.removeItem(KEY);
}
