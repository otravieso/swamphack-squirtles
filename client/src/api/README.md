# client/src/api/

`api.js`: every call to our server goes through here (it attaches the login token).

```js
import { api } from './api.js';
await api.me();
await api.saveQuestionSet({ title, questions });
await api.listQuestionSets();
await api.getQuestionSet(id);
await api.deleteQuestionSet(id);
```

Planned: `api.generateQuestions(files)` once the Gemini route exists.
