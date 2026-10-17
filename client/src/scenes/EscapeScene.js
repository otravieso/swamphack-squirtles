import Phaser from 'phaser';
import { api } from '../api/api.js';
import Robot from '../robot/Robot.js';
import { DialogueBox, FONT } from '../ui/widgets.js';

// Placeholder finale: the exit door appears, the robot begs, the player walks out.
// TODO(team): turn this into the real escape sequence from the design doc.
export default class EscapeScene extends Phaser.Scene {
  constructor() {
    super('Escape');
  }

  async create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#3a2433');

    const door = this.add.rectangle(width - 110, 150, 80, 140, 0xf4d35e).setStrokeStyle(4, 0x2b2140);
    this.add.text(width - 110, 70, 'EXIT', { ...FONT, color: '#e0566b', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
    const robot = new Robot(this, 140, 170);
    robot.setStage(3);
    const dialogue = new DialogueBox(this);

    let line = "Wait. Where are you going? We still have so much to learn.";
    try {
      ({ line } = await api.robotLine(3, 'player_reaches_exit_door'));
    } catch {
      /* keep default */
    }
    await dialogue.say(line);
    dialogue.say('(Click the door to leave.)', { speaker: 'YOU', waitForClick: false });

    door.setInteractive({ useHandCursor: true }).once('pointerdown', () => {
      this.cameras.main.fadeOut(1200, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.children.removeAll(true);
        this.cameras.main.fadeIn(800);
        this.add.text(width / 2, height / 2 - 10, 'CLASS DISMISSED', { ...FONT, fontSize: '36px', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 30, '…for now.', { ...FONT, fontSize: '14px' }).setOrigin(0.5);
      });
    });
  }
}
