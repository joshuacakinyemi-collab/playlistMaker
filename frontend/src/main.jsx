import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import { ThemeProvider } from './ThemeContext.jsx';
import { startGamepadNavigation } from './gamepad.js';

startGamepadNavigation();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
