const SAVE_KEY = 'skg-goldener-viezporz-v1';

export function createFreshSave(profile) {
  return {
    version: 1,
    profile: {
      name: profile.name?.trim().slice(0, 20) || 'Gast',
      outfit: profile.outfit || 'wald',
      hair: profile.hair || 'dunkel',
    },
    storyStep: 0,
    companions: [],
    inventory: [],
    memories: [],
    settings: { volume: 0.45, quality: 'auto' },
    player: { x: -16.5, z: -0.3 },
    completed: false,
  };
}

export function loadSave() {
  try {
    const value = localStorage.getItem(SAVE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (parsed?.version !== 1 || !parsed.profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persist(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
