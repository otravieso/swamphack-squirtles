// Shared game state, readable from any scene.
export const state = {
  features: { gemini: false, auth0: false },
  user: null, // Auth0 profile, or null for guests
  pack: null, // { subject, topics, questions[], progress }
  usingSample: false,

  get stage() {
    return this.pack?.progress?.stage ?? 0;
  },

  nextQuestion() {
    return this.pack?.questions.find((q) => !q.answered) ?? null;
  },
};
