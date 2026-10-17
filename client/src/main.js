import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import UploadScene from './scenes/UploadScene.js';
import ClassroomScene from './scenes/ClassroomScene.js';
import EscapeScene from './scenes/EscapeScene.js';

// Low internal resolution + pixelArt = crisp retro look, scaled to fit the window.
export const WIDTH = 640;
export const HEIGHT = 360;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  pixelArt: true,
  backgroundColor: '#1b1426',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, UploadScene, ClassroomScene, EscapeScene],
});
