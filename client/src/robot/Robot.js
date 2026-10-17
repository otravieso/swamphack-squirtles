// The robot teacher, drawn with shapes as a placeholder until the pixel art is ready.
// Swap the shapes for a spritesheet later. Keep the setStage() API the same.
import Phaser from 'phaser';

const FACES = [
  { screen: 0xb8f2d8, eyes: 'happy', mouth: 'smile' }, // 0 cheerful
  { screen: 0xc9e8b0, eyes: 'happy', mouth: 'flat' }, // 1 clingy
  { screen: 0xd6d29a, eyes: 'stare', mouth: 'flat' }, // 2 unsettling
  { screen: 0xe0566b, eyes: 'stare', mouth: 'frown' }, // 3 desperate
];

export default class Robot extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.body_ = scene.add.rectangle(0, 0, 90, 110, 0x5ec8a7).setStrokeStyle(4, 0x2b2140);
    this.screen = scene.add.rectangle(0, -14, 70, 54, 0xb8f2d8).setStrokeStyle(3, 0x2b2140);
    this.face = scene.add.graphics();
    const buttons = scene.add.graphics();
    buttons.fillStyle(0xf4d35e).fillRect(-30, 26, 14, 6).fillRect(-26, 22, 6, 14); // d-pad
    buttons.fillStyle(0xe0566b).fillCircle(22, 30, 5);
    buttons.fillStyle(0x3a86ff).fillCircle(32, 22, 4);
    const legL = scene.add.rectangle(-20, 64, 8, 18, 0x2b2140);
    const legR = scene.add.rectangle(20, 64, 8, 18, 0x2b2140);

    this.add([legL, legR, this.body_, this.screen, this.face, buttons]);

    // Idle bob
    scene.tweens.add({ targets: this, y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.stage = -1;
    this.setStage(0);
  }

  setStage(stage) {
    if (stage === this.stage) return;
    this.stage = stage;
    const f = FACES[Math.min(stage, FACES.length - 1)];
    this.screen.setFillStyle(f.screen);

    const g = this.face.clear().lineStyle(3, 0x2b2140).fillStyle(0x2b2140);
    if (f.eyes === 'happy') {
      g.beginPath().arc(-14, -20, 6, Math.PI, 0).strokePath();
      g.beginPath().arc(14, -20, 6, Math.PI, 0).strokePath();
    } else {
      g.fillCircle(-14, -20, 5).fillCircle(14, -20, 5);
    }
    if (f.mouth === 'smile') g.beginPath().arc(0, -8, 10, 0.2, Math.PI - 0.2).strokePath();
    else if (f.mouth === 'flat') g.lineBetween(-10, 0, 10, 0);
    else g.beginPath().arc(0, 6, 10, Math.PI + 0.3, -0.3).strokePath();

    this.glitchTimer?.remove();
    if (stage >= 2) {
      // Occasional glitch: jitter + flicker, more often when desperate.
      this.glitchTimer = this.scene.time.addEvent({
        delay: stage === 3 ? 900 : 2500,
        loop: true,
        callback: () => this.glitch(),
      });
    }
  }

  glitch() {
    const dx = Phaser.Math.Between(-6, 6);
    this.scene.tweens.add({ targets: this, x: this.x + dx, duration: 40, yoyo: true, repeat: 2 });
    this.screen.setAlpha(0.3);
    this.scene.time.delayedCall(80, () => this.screen.setAlpha(1));
  }
}
