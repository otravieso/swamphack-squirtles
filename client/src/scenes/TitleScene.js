import Phaser from 'phaser';
import { api } from '../api/api.js';
import { authEnabled, login, logout } from '../auth/auth.js';
import { state } from '../game/state.js';
import { FONT, makeButton } from '../ui/widgets.js';

// Deliberately wholesome title screen. The tagline is a good thing to corrupt later.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  async create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#ffd6e8');

    this.add
      .text(width / 2, 80, 'Forever Learning', { ...FONT, fontSize: '40px', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 122, 'Learning has never been this fun! ★', { ...FONT, fontSize: '14px' })
      .setOrigin(0.5);

    const needsLogin = authEnabled && !state.user;
    if (needsLogin) {
      makeButton(this, width / 2, 200, 'Sign in to attend class', () => login());
      return;
    }

    if (state.user) {
      this.add
        .text(width / 2, 150, `Welcome back, ${state.user.given_name || state.user.name || 'student'}!`, {
          ...FONT,
          fontSize: '13px',
        })
        .setOrigin(0.5);
      makeButton(this, width - 70, height - 24, 'Sign out', () => logout(), { width: 110, height: 26 });
    }

    // Resume a saved game if there is one.
    let saved = null;
    try {
      saved = await api.loadProgress();
    } catch (err) {
      console.warn(err);
    }

    if (saved?.hasGame && !saved.progress.finished) {
      makeButton(this, width / 2, 200, 'Continue class', () => {
        state.pack = saved;
        this.scene.start('Classroom');
      });
      makeButton(this, width / 2, 245, 'New notes', () => this.scene.start('Upload'));
    } else {
      makeButton(this, width / 2, 210, 'Start learning!', () => this.scene.start('Upload'));
    }
  }
}
