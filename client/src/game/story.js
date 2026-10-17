// Story script as plain data. Edit text freely; no engine changes needed.
// Nodes: scene | say | q (question + reactions) | choice (options with hidden effects) | end
// Effects (fx) change hidden stats: { health:-1, thirst:+2, hunger:+2, intelligence:-1 }
// In teacher lines, *text between asterisks* renders as a glitch.
const line = (who) => (text) => ({ t: 'say', who, text });
const T = line('teacher'), Y = line('you'), I = line('thought'), N = line('narrator');
const scene = (name, aggro) => ({ t: 'scene', name, aggro });
const q = (right, wrong) => ({ t: 'q', right, wrong });
const choice = (...options) => ({ t: 'choice', options });
const opt = (label, fx, ...then) => ({ label, fx, then });

export const story = [
  scene('Classroom', 0.1),
  T("Hey, you're back!!! You always come back!!! Are you ok? You don't look good. Have you slept recently? It's probably because YOU WANT TO START LEARNING SO BAD!!!"),
  I("I'm so hungry and thirsty. I need food. I need to get out of here! Is my arm broken?"),
  T("HEY HEY HEYYY!!! Zoning out already? You'll never graduate at this rate."),
  q([T("Amazing, you might Actually be able to es*chhhk* Graduate!")], [T("Seems we have a lot of work ahead of us.")]),
  N("You look around for water. You feel on the verge of passing out. There is an old plastic water bottle by the window. There is also a sink dripping in the corner, so the plumbing must still work. And some condensation on your desk that you could lick... you weirdo."),
  choice(
    opt('Go to the window and drink from the water bottle', { health: -1 }, N("You spit the water out. It tastes of mold and morning breath. But maybe that's just you.")),
    opt('Get to the sink and turn on the faucet', { thirst: 2 }, N("At first it's black, then it clears up. You take a sip and, to your surprise, it tastes fine. There was a brain-eating amoeba. It starved tho...")),
    opt('Lick the desk', { thirst: -1 }, N("...Nothing happens. You're still thirsty, but you'll have to worry about it later.")),
    opt("Don't drink water", { thirst: -1 }, N("Be more decisive. Take care of yourself. It might kill ya if you don't. But maybe you have bigger issues to worry about...")),
  ),
  T("Hey Hey HEY! Get back to your seat young man! You don't want the ruler now, do you?"),
  N("You feel your tush aching... You think nothing of it."),
  q([T("So you do have something in that noggin of yours.")], [T("DID YOU JUST *kssshRRK* You'll get it next time...")]),
  N("You want food. The only thing in this classroom that looks edible is a pile of mush on the teacher's desk that might once have been an apple. You head for the door."),
  T("Woah woah woah where do you think you're going?"),
  Y("I think I'll learn better if I eat something. I'm having trouble thinking straight."),
  T("I guess every student needs a lunch break. But before that, answer one more question."),
  q([T("Good Good Good You might actually see the light of *blehaheuosube* the cafeteria!!!")], [T("YOU BAS *grechaalednbelb* Every student needs some food. Maybe that will improve your pathetic performance.")]),

  scene('Stairwell', 0.4),
  I("You need to get to the cafeteria, but you're on the second floor and the cafeteria is on the first. Wait... how do you know this?"),
  N("You look at the stairs. They look precarious. You look around and notice a window..."),
  choice(
    opt('Take the stairs, slowly', {}, N("Each step creaks like it's reading your mind. You make it down. Somehow.")),
    opt('Climb out the window', { health: -1 }, N("The ground arrives sooner than expected. Your ankle files a complaint.")),
    opt('Slide down the banister', { health: -1 }, N("Wheee. Then a splinter. Then less wheee.")),
  ),

  scene('Cafeteria', 0.75),
  T("Student. I did not say you could leave *ZZZT* early. Sit. Eat. Then we continue. *Happily.*"),
  choice(
    opt('Eat the grey stew', { hunger: 2, health: -1 }, N("It's warm. It's filling. It looks back at you.")),
    opt('Take the shriveled apple from the vending machine', { hunger: 2 }, N("Crunchy, a little sad, but it's food.")),
    opt('Skip eating', { hunger: -1 }, N("Your stomach growls. The speaker overhead growls back.")),
  ),
  T("Another question. You'll answer. You always answer. You ALWAYS come back."),
  q([T("Correct. Perfect. *Stay* with me.")], [T("WRONG. WRONG. *WRONG.* We'll stay until you get it.")]),
  { t: 'end', text: 'To be continued...' },
];
