import Phaser from 'phaser';
import { api } from '../api/api.js';
import { state } from '../game/state.js';

// Uses the HTML form in index.html (file inputs are much easier in HTML than in canvas).
export default class UploadScene extends Phaser.Scene {
  constructor() {
    super('Upload');
  }

  create() {
    this.cameras.main.setBackgroundColor('#ffd6e8');

    const form = document.getElementById('upload-panel');
    const input = document.getElementById('notes-input');
    const nameInput = document.getElementById('player-name');
    const label = document.getElementById('file-label');
    const status = document.getElementById('upload-status');
    const button = document.getElementById('upload-btn');

    if (state.user?.given_name) nameInput.value = state.user.given_name;
    form.hidden = false;

    const onChange = () => {
      const n = input.files.length;
      label.textContent = n ? `${n} file${n > 1 ? 's' : ''} selected` : 'Choose PDFs, photos of notes, or .txt files';
    };

    const onSubmit = async (e) => {
      e.preventDefault();
      if (!state.features.gemini) {
        status.textContent = 'Gemini is off, so using sample questions.';
      } else if (input.files.length === 0) {
        status.textContent = 'Please choose at least one file.';
        status.className = 'status error';
        return;
      }
      button.disabled = true;
      status.className = 'status';
      status.textContent = 'Reading your notes… preparing your lessons… ♪';
      try {
        const pack = await api.uploadNotes([...input.files], nameInput.value.trim());
        state.pack = pack;
        state.usingSample = pack.usingSample;
        cleanup();
        this.scene.start('Classroom');
      } catch (err) {
        status.textContent = err.message;
        status.className = 'status error';
      } finally {
        button.disabled = false;
      }
    };

    const cleanup = () => {
      form.hidden = true;
      status.textContent = '';
      input.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
    };

    input.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    this.events.once('shutdown', cleanup);
  }
}
