// Story script as plain data, transcribed from the team script ("SwampHacks Squirtles").
// Wording and spelling are kept exactly as written. Only formatting differs:
//   - *text in asterisks* renders as glitch text, so it's used only for the Professor's glitch noises
//   - narration asterisks are dropped, and stage directions like *pauses* are shown as (pauses)
// Nodes: scene | say | q (AI-generated question + reactions) | choice (options with stat effects) | end
// Effects (fx) change the survival stats: { health, intelligence (= intellect), hunger, thirst }.
const line = (who) => (text) => ({ t: 'say', who, text });
const T = line('teacher'), Y = line('you'), I = line('thought'), N = line('narrator');
const scene = (name, aggro) => ({ t: 'scene', name, aggro });
const q = (right, wrong) => ({ t: 'q', right, wrong });
const choice = (...options) => ({ t: 'choice', options });
const opt = (label, fx, ...then) => ({ label, fx, then });

export const story = [
  // ── Scene 1: Classroom ──────────────────────────────────────────────
  scene('Classroom', 0.1),
  T("Hey, you're back!!! You always come back!!! Are you ok? You don't look good. Have you slept recently? Its probably because YOU WANT TO START LEARNING SO BAD!!!"),
  I("I'm so hungry and thirsty. I need food. I need to get out of here! Is my arm broken?"),
  T('HEY HEY HEYYY!!! Zoning out already? Youll never graduate at this rate'),
  q(
    [T('Amazing, you might Actually be able to es______ *Glitching noises* Graduate!')],
    [T('Seams we have a lot of work ahead of us')],
  ),
  N("you look around for some water, you feel on the verge of passing out. There is an old plastic water bottle by the window. It looks like its been by the window longer than you have been alive. There is the sink dripping in the corner, you think that if it's dripping the plumbing must still work. There is also some condensation on your desk that you could lick… you weirdo"),
  choice(
    opt('Go to the window and drink from the water bottle', { health: -1 },
      N("you spit the water out. It tastes of mold and morning breath. But maybe that's just you")),
    opt('Get to the sink and turn on the faucet.', {},
      N("You let out a sigh of relief when you notice the water starts pouring out. At first it's black but then it clears up. You tentatively take a sip and to your surprise it tastes fine. There was a brain-eating amoeba. It starved tho…")),
    opt('You lick the desk', { thirst: -1 },
      N('... nothing happens. You’re still thirsty but you’re gonna have to worry about it later… you freak…')),
    opt("You don't drink water.", { thirst: -1 },
      N('Be more decisive. Take care of yourself. It might kill ya if you don’t. But maybe you have bigger issues to worry about…')),
  ),
  T('Hey Hey HEY! Get back to your seat young man! You dont want the ruler now do you?'),
  N('you feel your tush aching… You think nothing of it'),
  q(
    [T('So you do have something in that noggin of yours')],
    [T("DID YOU JUST *screeching fuse bursts* You'll get it next time…")],
  ),
  N('you want to get some food. You look around but the only thing you see in this classroom is that looks edib…eatable is a a pile of mush on the teachers desks you think might have been an apple. You head down to the cafeteria'),
  T('Woah woah woah where do you think your going?'),
  Y("I think I'll learn better if I eat something. I'm having trouble thinking straight"),
  T('I guess every student needs a lunch break. But before that answer one more question'),
  q(
    [T('Good Good Good You might actually see the light of *blehaheuosube* the cafeteria!!!')],
    [T('YOU BAS *grechaalednbelb* Every student needs some food. Maybe that will improve your pathetic performance.')],
  ),

  // ── Stairs ──────────────────────────────────────────────────────────
  scene('Stairwell', 0.3),
  I("You need to head to the cafeteria but you're on the second floor and the cafeteria is on the first floor. Wait, how do you know this?"),
  N('You look at the stairs. They look precarious. You look around and notice a window…The window is… high… Also there is some One of the railing has been torn down. Maybe'),
  choice(
    opt('Carefully descend the stairs, testing each step.', {},
      N("You take each step slowly, gripping what remains of the railing. The stairs creak like an old man's knees, but you make it down in one piece. You feel a little proud of yourself. No, thats not the feeling. You feel Pathetic.")),
    opt('Run down the stairs as fast as possible.', { health: -2 },
      N('You sprint down the stairs. Halfway through, your foot catches a broken step. You tumble the rest of the way down, the stairs fall apart behind you. On the bright side, you achieved something. Even if it was probably the worst way to do so')),
    opt('Climb out the window and try to reach a lower ledge.', { hunger: -1 },
      N('You squeeze through the window and immediately regret every decision that has led you here. You start thinking that maybe you are stupid. After a brief, humiliating struggle, you manage to grab a maintenance ledge and climb back inside through a lower window. Your arms feel like jelly. Mhhhmmmm Jelly. You get really hungry….')),
    opt('Use the broken railing as a makeshift ladder.', { thirst: -1 },
      N('You grab the remaining metal railing and lower yourself down the side of the stairwell. The railing groans. You make it halfway before dropping the last few feet, landing hard on your knees. They start bleeding profusely. You get even more thirsty.')),
  ),
  T("REMEMBER! WALKING IS AN EXCELLENT FORM OF EXERCISE! Exercise improves circulation, cognition, and academic performance! As long as it's done safely."),
  N('You finally reach the first floor. You know where the cafeteria is. Wait, how did you know?'),
  I('Food. Water. Escape. Im so hungry'),
  T("You know what they say. No learning on an empty stomach. But bad students don't get food. What do you call it? Carrot and a stick? I have to threaten you with the stick then give you a carrot right?"),
  q(
    [T('Look at Youuuuuu . Your getting smarter with every Question! Your hard work is paying off.')],
    [T("Are you a clod? I’m starting to think you are ok with being mediocre. I guess you're entitled to being wrong.")],
  ),

  // ── Cafeteria: food ─────────────────────────────────────────────────
  scene('Cafeteria', 0.5),
  N('You push open the cafeteria doors. Rows of tables stretch across the room. The fluorescent lights flicker overhead. There are trays on every table, each holding different food options. You better grab some grub. Not literally, some of those plates definitely have grubs…'),
  N('The Options before you are:'),
  choice(
    opt('Lasagna so dried out it could knock someone out. Kinda like a brick.', { thirst: -1 },
      N("Oh, you think yourself somewhat of a builder? A bad building doesn't pay their bills. Well.. it doesn't pay the… get the food?... You get the point…")),
    opt('Canned beans. You can never go wrong with canned beans', {},
      N('Look at this bean man. I hope there is a bathroom near you. Not because they are expired. That stuff never expires. Just like, you know… (says slowly growing dissolution of his joke) beans beans their good for your heart… You know the thing? Do I really have to say the whole things. whatever (says defensively)')),
    opt('EggSalad. Why the he(hockey stick)(hockey stick) would you even thing this is a good option', { hunger: -1, health: -1 },
      N('You died. Or rather your gonna wish you died with all that stomach pain going gonna have.')),
    opt('Suspicious chicken nuggets', { health: -1 },
      N('You eat them. Suspiciously… You bite into it and chip a tooth on some bone in it. Wait, was it a chicken nugget?')),
  ),
  T('Go ahead! Eat up! A hungry brain is an unproductive brain!'),
  Y('Who prepares this (pauses) stuff?'),
  T('I do!'),
  N('There is a pause. Somewhere inside the wall, a motor whirs. Something heavy rolls across the ceiling above you followed by a hard thud and maybe a cracking sound.'),
  Y('You cook?'),
  T('I do many things! I teach! I supervise! I grade! I provide emotional support! I maintain a healthy learning environment! I—'),
  T('—I KEEP EVERYTHING RUNNING!'),
  N('Silence.'),
  T('(quietly) and you better keep learning…'),
  q(
    [T("Wow! The food helped . I'm so proud")],
    [T("maybe you won't get food next time…")],
  ),

  // ── Cafeteria: drinks ───────────────────────────────────────────────
  N('You are feeling parched again. Maybe all that food made you thirsty. You look around and see a soda machine with cups next to it. You go to grab a cup.'),
  T("AY AY AY. No soda for students. OR ELSE I’LL Why don't you go to that machine instead."),
  N('You look to the right and see a shoddily built attempt at a soda machine. Emphasis on attempt…'),
  T('BUT FIRST. ONE MORE QUESTION!!!!'),
  q(
    [T('Yippi go get some you deserve it')],
    [T('You might be a lost cause')],
  ),
  N("You look at the machine. You trust it about as far as you can throw it. FYI you are weak as weak hecky. You look at the options. They don't fill you with confidence."),
  choice(
    opt('Gatorade, Oh how fun', {},
      N('Heck yea')),
    opt('Pep-C, This seems vaguely familiar. But you can’t exactly CCCCCCCC why', {},
      N('It fills you with energy. And gas…BUUUURP')),
    opt('Robo fuel', { health: -1 },
      N("It's dark and thick. The viscosity resembles molasses. The color is as maroon as cranberries. It taste vaguely metallic.")),
    opt('Suspicious nugget, wait what?!?!?!?', { thirst: -1 },
      N("A single nugget is dispensed. You press the trigger again in hopes of getting some more at least but nothing happens. You're still thirsty and you try to go for another drink but Professor Didactic stops you.")),
  ),

  // ── The Professor glitches ──────────────────────────────────────────
  scene('Cafeteria', 0.75),
  T('TIME FOR ANOTHER QUESajonosrnpirn'),
  N('silence'),
  N('you hear a screach'),
  T('SCREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEKHBWOINRWONWI'),
  Y('What the flip? (proceeds to flip)'),
  N('Wait, how did you do that? You turn around quickly, almost beginning to run when you feel an arm tightly grab your shoulder, painfully tight.'),
  T("Where do you think you're going, young man?"),
  N('You turn around and for half a second you saw what looked like a red error screen. Professor Didactic regains his composure.'),
  T("How about we head back to class young man. It's time to keep learning."),
  N('You quickly scramble to think of a way to not have to go back.'),
  Y('UUH but we can’t'),
  T('(in a stern voice) Why not?'),
  Y('Well we could but why not try to learn… uhh… (nervous stuttering) Oh, how about we learn somewhere else'),
  T('Your not trying to (voice raises aggressively) DITCH SCHOOL RiGHT???'),
  N("You vaguely remember that there is an Exit in the Library. You wonder why but you are too stressed to think clearly. You're scared that he is gonna catch onto you."),
  Y('NOoo, Never. I was just thinking we could head to the Lieberry'),
  T('WOOWEEEEE. I’m so glad. Good idea and it might be good to go over some pronunciation too. It\'s pronounced lai·breh·ree.Say it with me'),
  Y('library'),
  T('Good, lets head over'),

  // ── Hallway: walking to the library ─────────────────────────────────
  scene('Hallway', 0.75),
  T('Why not one more question while we head over'),
  q([], []),
  N('You head over to the library. On the way there you notice that professor Didactic is twitching a lot. Maybe he got bugs in his pants. AH Ha HA. Get it? Ants in your pants. But he is a computer, so he has bugs Ah Ha. I’m so smart. OH hehehe Ants in his PARTS HEHEHEHAAAA'),

  // ── Library ─────────────────────────────────────────────────────────
  scene('Library', 0.9),
  N('You arrive at the library and the teacher goes to the first table. You want to sit on the table closest to the exit. It happens to have a window next to it. You have an idea. But you sat down already Oops.'),
  Y('Wait, professor didactic. What if—'),
  T('NEXT QUESTION!'),
  q([], []),
  Y('What if we sit next to the window? I hear sunlight helps learning'),
  T('Wha—---- at a goood ooooood idea'),
  N('Something seems to be going wrong with the professor didactic. You head over to the table near the window. You try to come up with a way to distract Maybe youll think of something soon'),

  // Rapid fire #1
  T('RAPID FIRE!!!'),
  q(
    [T('What? Why would you answer… wait No wait sorry I expected you to get it wrong so I was already ready with that. NEXT!')],
    [T('What? Why would you answer that? NEXT!')],
  ),
  q(
    [T('GOOOOOD!!! NEXT!!!')],
    [T('You dumb child… NEXT!!!')],
  ),
  q(
    [T('YEAAAA Your so smart!')],
    [T('I’m so close to losing my patience with you child.')],
  ),

  // Rapid fire #2
  T('ALrighty You ready for more RAPID FIREEEEEEE!'),
  N("You try to figure out a way out of this but nothing comes to mind. Cause you're kinda slow. Wait! You feel an idea forming. Surprisingly…"),
  Y('If I get the next three questions right could I request something???'),
  T("I'll think about it… But probably not… RAPID FIRE!!!"),
  q(
    [T('Keep going! Two more to go!')],
    [T('Welp that ended quick')],
  ),
  q(
    [T('ALright Alright Alright')],
    [T("This isn't good")],
  ),
  q(
    [T('YES!!!!')],
    [T('hmmmmm…')],
  ),

  // ── Escape ──────────────────────────────────────────────────────────
  N("You look at the teacher with pleading eyes. I don't know why you look studpid doing that. But somehow it works…"),
  T('Fine, I’ll grant you the request cause above all I’m proud of your conviction so I’ll grant you this.'),
  Y('Could you close your eyes? I have a gift for you.'),
  N('The robot closes its eyes'),
  choice(
    opt('You sprint toward the exit, your kinda loud tho', { health: -1 },
      T('HEY WHATS THAT. GET BACK HERE')),
    opt('You punch professor didactic', { health: -1 },
      N('Nothing happens. He is made of metal what did you expect')),
    opt('You cover his head with some cloth you found in the corner and then run', { health: -1 },
      N('Professor didactic rips the cloth off in rage and fury.')),
    opt('You quietly walk to the exit', {},
      N('You hope he does not notice you… You almost make it to the door but he notices.')),
  ),
  scene('Library', 1),
  T('IM GOING TO TEAR YOU UNGREATFUL LITTLE &#%$& APART'),
  N('You open the door and attempt to pass through the door. You bump into what appears to be a screen. You read…'),
  N('404 Exit Not Found…'),
  N('Do you want to refresh?'),
  choice(
    opt('Yes', {}),
    opt('No', {}),
  ),
  { t: 'end', text: '404 Exit Not Found…' },
];
