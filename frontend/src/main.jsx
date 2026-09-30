import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import { ThemeProvider } from './ThemeContext.jsx';
import { PlayerProvider } from './player/PlayerContext.jsx';
import { startGamepadNavigation } from './gamepad.js';

startGamepadNavigation();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </ThemeProvider>
  </StrictMode>
);
