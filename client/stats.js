import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import GameApp from './GameApp.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');
createRoot(root).render(createElement(GameApp));
