import Phaser from 'phaser';
import { api } from '../api/api.js';
import { state } from '../game/state.js';
import Robot from '../robot/Robot.js';
import { DialogueBox, FONT, QuestionPanel } from '../ui/widgets.js';

// Room color shifts from cozy to wrong as the robot's corruption stage rises.
const ROOM_COLORS = [0xffe8c2, 0xf3d9b8, 0xc9b6a4, 0x6b4a5a];

// Main loop: robot talks → question → grade → robot reacts → repeat → escape.
export default class ClassroomScene extends Phaser.Scene {
  constructor() {
    super('Classroom');
  }

  create() {
    const { width } = this.scale;
    this.wall = this.add.rectangle(width / 2, 120, width, 240, ROOM_COLORS[0]);
    this.add.rectangle(width / 2, 300, width, 120, 0x9c6b4e); // floor
    this.add.rectangle(400, 90, 300, 120, 0x2f5d50).setStrokeStyle(6, 0x8a5a3c); // chalkboard
    this.boardText = this.add.text(262, 42, '', { ...FONT, color: '#f0f0e0', fontSize: '13px', wordWrap: { width: 280 } });
    this.progressText = this.add.text(12, 10, '', { ...FONT, fontSize: '12px', fontStyle: 'bold' });

    this.robot = new Robot(this, 120, 170);
    this.dialogue = new DialogueBox(this);
    this.questions = new QuestionPanel(this);

    this.refreshRoom();
    this.run();
  }

  refreshRoom() {
    const { progress, subject } = state.pack;
    this.robot.setStage(progress.stage);
    this.wall.setFillStyle(ROOM_COLORS[progress.stage]);
    this.progressText.setText(`Lessons: ${progress.correct}/${progress.total}`);
    this.boardText.setText(`Today's lesson:\n${subject}${state.usingSample ? '\n(sample mode)' : ''}`);
    if (progress.stage >= 3) this.cameras.main.shake(300, 0.004);
  }

  async robotSays(event, topic) {
    let line;
    try {
      ({ line } = await api.robotLine(state.stage, event, topic));
    } catch {
      line = '…';
    }
    await this.dialogue.say(line);
  }

  async run() {
    await this.robotSays('start_lesson', state.pack.topics?.[0]?.name);

    let q;
    while ((q = state.nextQuestion())) {
      this.dialogue.setVisible(false);
      const choice = await this.questions.ask(q);

      const result = await api.answer(q.id, choice);
      this.questions.reveal(choice, result.correctIndex);
      if (result.correct) q.answered = true;

      const oldStage = state.stage;
      state.pack.progress = result.progress;
      this.refreshRoom();

      await this.dialogue.say(result.explanation, { speaker: result.correct ? 'CORRECT ★' : 'NOT QUITE' });
      this.questions.close();

      // The robot reacts, and always speaks when its personality shifts.
      const stageChanged = state.stage !== oldStage;
      if (stageChanged || !result.correct || Math.random() < 0.35) {
        await this.robotSays(result.correct ? 'correct_answer' : 'wrong_answer', q.topic);
      }

      // Wrong answers go to the back of the line to be asked again later.
      if (!result.correct) {
        const qs = state.pack.questions;
        qs.push(qs.splice(qs.indexOf(q), 1)[0]);
      }
    }

    await this.robotSays('near_exit');
    this.scene.start('Escape');
  }
}
