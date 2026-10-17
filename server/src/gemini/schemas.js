// Structured-output schemas. Gemini is forced to return exactly these shapes,
// so the game never has to parse free-form text.
import { Type } from '@google/genai';

export const studyPackSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: 'Short name for what the notes cover' },
    topics: {
      type: Type.ARRAY,
      description: 'Main topics found in the notes, in a sensible learning order',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          summary: { type: Type.STRING, description: 'One or two sentence summary' },
        },
        required: ['name', 'summary'],
      },
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 4 answer choices',
          },
          answerIndex: { type: Type.INTEGER, description: 'Index (0-3) of the correct option' },
          explanation: { type: Type.STRING, description: 'Why the answer is correct' },
          topic: { type: Type.STRING, description: 'Must match one of the topic names' },
          difficulty: { type: Type.INTEGER, description: '1 (easy) to 5 (hard)' },
          sourceQuote: {
            type: Type.STRING,
            description: 'Short quote from the notes that supports the answer',
          },
        },
        required: ['question', 'options', 'answerIndex', 'explanation', 'topic', 'difficulty'],
      },
    },
  },
  required: ['subject', 'topics', 'questions'],
};

export const robotLineSchema = {
  type: Type.OBJECT,
  properties: {
    line: { type: Type.STRING, description: "The robot teacher's next line of dialogue" },
    mood: {
      type: Type.STRING,
      enum: ['cheerful', 'clingy', 'unsettling', 'desperate'],
    },
  },
  required: ['line', 'mood'],
};
