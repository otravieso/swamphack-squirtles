// Maps the scene names used in story.js (scene('Classroom', ...)) to a background.
// Background art lives in client/public/assets/Scenes/ and is served at /assets/Scenes/...
// If an image file is missing, the CSS for that scene still paints a themed fallback,
// so the game never shows a blank screen.

export const SCENES = {
  classroom: { key: 'classroom', label: 'Classroom', image: '/assets/Scenes/classroom.png' },
  hallway: { key: 'hallway', label: 'Hallway', image: '/assets/Scenes/hallway.png' },
  cafeteria: { key: 'cafeteria', label: 'Cafeteria', image: '/assets/Scenes/cafeteria.png' },
  library: { key: 'library', label: 'Library', image: '/assets/Scenes/library.png' },
};

// Other names the script may use for the same place.
const ALIASES = {
  stairwell: 'hallway',
  stairs: 'hallway',
  corridor: 'hallway',
  lieberry: 'library',
};

/** Returns the scene entry for a story scene name, or null if it's unknown/empty. */
export function sceneFor(name) {
  const id = String(name ?? '').trim().toLowerCase();
  if (!id) return null;
  return SCENES[ALIASES[id] ?? id] ?? null;
}

/** Preload every background so switching scenes doesn't flash. Safe to call more than once. */
let preloaded = false;
export function preloadScenes() {
  if (preloaded || typeof Image === 'undefined') return;
  preloaded = true;
  for (const { image } of Object.values(SCENES)) {
    const img = new Image();
    img.src = image;
  }
}