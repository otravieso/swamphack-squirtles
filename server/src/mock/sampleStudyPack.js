// Used when GEMINI_API_KEY is not set, so anyone on the team can run the game.
export const sampleStudyPack = {
  subject: 'Cell Biology (sample)',
  topics: [
    { name: 'Organelles', summary: 'Structures inside cells that perform specific jobs.' },
    { name: 'Cell Membrane', summary: 'The barrier that controls what enters and leaves a cell.' },
  ],
  questions: [
    {
      question: 'Which organelle is known as the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
      answerIndex: 1,
      explanation: 'Mitochondria produce ATP through cellular respiration.',
      topic: 'Organelles',
      difficulty: 1,
    },
    {
      question: 'Where are proteins assembled?',
      options: ['Ribosomes', 'Lysosomes', 'Vacuoles', 'Cell wall'],
      answerIndex: 0,
      explanation: 'Ribosomes translate mRNA into proteins.',
      topic: 'Organelles',
      difficulty: 2,
    },
    {
      question: 'The cell membrane is mainly made of…',
      options: ['Cellulose', 'A phospholipid bilayer', 'Chitin', 'DNA'],
      answerIndex: 1,
      explanation: 'Phospholipids form a bilayer with hydrophobic tails facing inward.',
      topic: 'Cell Membrane',
      difficulty: 2,
    },
    {
      question: 'Movement of water across a membrane is called…',
      options: ['Diffusion', 'Active transport', 'Osmosis', 'Endocytosis'],
      answerIndex: 2,
      explanation: 'Osmosis is the diffusion of water across a selectively permeable membrane.',
      topic: 'Cell Membrane',
      difficulty: 3,
    },
  ].map((q, id) => ({ id, ...q })),
};

export const sampleRobotLines = [
  'Welcome to class! I am SO happy you are here. Let us learn together!',
  'You are my favorite student. You know that, right? You would not leave me… right?',
  'The door? Oh, there is no door. There was never a door. Next question.',
  'PLEASE. Just one more lesson. Just one more. Just one more. Just one more.',
];
