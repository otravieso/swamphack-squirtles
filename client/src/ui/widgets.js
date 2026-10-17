// Small reusable UI pieces drawn with Phaser shapes (no art assets needed yet).
export const FONT = { fontFamily: '"Courier New", monospace', color: '#2b2140' };

/** A clickable pixel-style button. Returns the container. */
export function makeButton(scene, x, y, label, onClick, { width = 220, height = 32, fill = 0x5ec8a7 } = {}) {
  const bg = scene.add.rectangle(0, 0, width, height, fill).setStrokeStyle(3, 0x2b2140);
  const text = scene.add
    .text(0, 0, label, { ...FONT, fontSize: '14px', fontStyle: 'bold', align: 'center', wordWrap: { width: width - 12 } })
    .setOrigin(0.5);
  const btn = scene.add.container(x, y, [bg, text]).setSize(width, height);
  btn.setInteractive({ useHandCursor: true });
  btn.on('pointerover', () => bg.setFillStyle(0xfff6e9));
  btn.on('pointerout', () => bg.setFillStyle(fill));
  btn.on('pointerdown', onClick);
  btn.label = text;
  btn.bg = bg;
  return btn;
}

/** Dialogue box with a typewriter effect. `say()` resolves when the player clicks to continue. */
export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.box = scene.add.rectangle(width / 2, height - 46, width - 24, 76, 0xfff6e9).setStrokeStyle(4, 0x2b2140);
    this.name = scene.add.text(24, height - 92, 'TEACHER', { ...FONT, fontSize: '12px', fontStyle: 'bold', backgroundColor: '#5ec8a7', padding: { x: 6, y: 2 } });
    this.text = scene.add.text(26, height - 74, '', { ...FONT, fontSize: '14px', wordWrap: { width: width - 56 } });
    this.hint = scene.add.text(width - 28, height - 22, '▼', { ...FONT, fontSize: '12px' }).setOrigin(1, 0.5).setVisible(false);
    this.items = [this.box, this.name, this.text, this.hint];
  }

  setVisible(v) {
    this.items.forEach((i) => i.setVisible(v));
    if (!v) this.hint.setVisible(false);
  }

  /** Typewriter a line, then wait for a click / space. */
  say(line, { speaker = 'TEACHER', waitForClick = true } = {}) {
    this.setVisible(true);
    this.name.setText(speaker);
    this.text.setText('');
    return new Promise((resolve) => {
      let i = 0;
      const timer = this.scene.time.addEvent({
        delay: 22,
        repeat: line.length - 1,
        callback: () => this.text.setText(line.slice(0, ++i)),
      });
      const finish = () => {
        timer.remove();
        this.text.setText(line);
        if (!waitForClick) return resolve();
        this.hint.setVisible(true);
        this.scene.time.delayedCall(150, () => {
          const done = () => {
            this.hint.setVisible(false);
            this.scene.input.off('pointerdown', done);
            this.scene.input.keyboard?.off('keydown-SPACE', done);
            resolve();
          };
          this.scene.input.once('pointerdown', done);
          this.scene.input.keyboard?.once('keydown-SPACE', done);
        });
      };
      this.scene.time.delayedCall(22 * line.length + 30, finish);
    });
  }
}

/** Multiple-choice question popup. `ask()` resolves with the chosen option index. */
export class QuestionPanel {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
  }

  ask(q) {
    this.close();
    const { width } = this.scene.scale;
    return new Promise((resolve) => {
      const panel = this.scene.add.rectangle(width / 2, 140, width - 60, 240, 0xfff6e9).setStrokeStyle(4, 0x2b2140);
      const meta = this.scene.add
        .text(46, 30, `${q.topic}  ·  ${'★'.repeat(q.difficulty)}`, { ...FONT, fontSize: '11px' });
      const title = this.scene.add
        .text(46, 48, q.question, { ...FONT, fontSize: '15px', fontStyle: 'bold', wordWrap: { width: width - 100 } });
      const buttons = q.options.map((opt, i) =>
        makeButton(this.scene, width / 2, 130 + i * 40, `${'ABCD'[i]}. ${opt}`, () => resolve(i), {
          width: width - 110,
          height: 34,
          fill: 0xd9f2ea,
        })
      );
      this.buttons = buttons;
      this.container = this.scene.add.container(0, 0, [panel, meta, title, ...buttons]);
    });
  }

  /** Color the buttons after grading. */
  reveal(chosen, correctIndex) {
    this.buttons?.forEach((b, i) => {
      b.disableInteractive();
      if (i === correctIndex) b.bg.setFillStyle(0x5ec8a7);
      else if (i === chosen) b.bg.setFillStyle(0xe0566b);
    });
  }

  close() {
    this.container?.destroy();
    this.container = null;
    this.buttons = null;
  }
}
