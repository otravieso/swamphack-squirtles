import Phaser from 'phaser';
import { api } from '../api/api.js';
import { initAuth } from '../auth/auth.js';
import { state } from '../game/state.js';
import { FONT } from '../ui/widgets.js';

// Checks the server, finishes any Auth0 login redirect, then goes to the title.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { width, height } = this.scale;
    const msg = this.add
      .text(width / 2, height / 2, 'Booting up… ♪', { ...FONT, color: '#fff6e9', fontSize: '16px' })
      .setOrigin(0.5);

    (async () => {
      try {
        const health = await api.health();
        state.features = health.features;
      } catch {
        msg.setText('Cannot reach the server.\nIs `npm run dev` running?').setAlign('center');
        return;
      }
      try {
        const { user } = await initAuth();
        state.user = user;
      } catch (err) {
        console.warn('Auth0 init failed, continuing as guest', err);
      }
      this.scene.start('Title');
    })();
  }
}
