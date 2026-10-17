# client/src/api/

`api.js`: every call to our server goes through here (it attaches the login token).

```js
import { api } from './api.js';
await api.me();
await api.saveQuestionSet({ title, questions });
await api.listQuestionSets();
await api.getQuestionSet(id);
await api.deleteQuestionSet(id);

// Notes → Gemini → saved set (takes ~5–20 s, longer for PDFs; show a loading state)
const pack = await api.generateQuestions({ title: 'Bio Ch. 3', notes });
// PDF: send it as base64 (see client/src/main.js for reading a File)
const pack2 = await api.generateQuestions({ file: { name, mimeType: 'application/pdf', data: base64 } });
```
