
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element in index.html');
}

// App shows login -> upload/saved notes -> the game (GameApp).
// No <StrictMode>: in development it runs effects twice, which would restart the game.
createRoot(root).render(createElement(App));
