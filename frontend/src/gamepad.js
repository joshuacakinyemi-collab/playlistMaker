// Adds game-controller navigation to the whole app using the browser's
// built-in Gamepad API — no dependencies, no native modules. The D-pad
// (or left stick) moves real DOM focus between on-screen buttons/inputs
// using nearest-neighbor spatial navigation (like a TV app), A activates
// whatever's focused (or opens the on-screen keyboard if it's a text
// field), and B/X/Y/bumpers/Start are wired up by whichever screen
// currently cares about them via registerGamepadActions.
//
// Button indices follow the "standard" Gamepad API mapping, which the
// browser normalizes most Xbox/PlayStation/generic controllers to.
const BUTTON = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

const STICK_DEADZONE = 0.5;
const REPEAT_DELAY_MS = 400;
const REPEAT_RATE_MS = 150;

// The currently-visible screen registers the actions it supports — e.g.
// the music player registers onX/onNext/onPrev while it's mounted, the
// on-screen keyboard registers onX/onY/onBack only while it's open, and
// App registers onBack/onStart since it always owns that navigation
// state. Whatever isn't registered right now is simply a no-op.
//
// registerGamepadActions snapshots whatever was previously in each key it
// touches and restores it on unregister, rather than clearing to null —
// so when the keyboard (opened on top of, say, Settings) closes, B goes
// back to whatever it meant before the keyboard took it over, instead of
// going dead.
const actions = {
  onBack: null,
  onStart: null,
  onX: null,
  onY: null,
  onNext: null,
  onPrev: null,
  onActivateInput: null,
};

export function registerGamepadActions(partial) {
  const previous = {};
  for (const key of Object.keys(partial)) {
    previous[key] = actions[key] ?? null;
    actions[key] = partial[key];
  }
  return () => {
    for (const key of Object.keys(previous)) actions[key] = previous[key];
  };
}

function isFocusable(el) {
  if (el.disabled) return false;
  if (el.tabIndex < 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.offsetParent !== null || style.position === 'fixed';
}

function isTextEntry(el) {
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    const type = (el.type || 'text').toLowerCase();
    return ['text', 'search', 'email', 'url', 'tel', 'password'].includes(type);
  }
  return false;
}

function getFocusableElements() {
  // Scope to the innermost open overlay, so the D-pad can't "escape" it
  // onto whatever's behind it — the on-screen keyboard takes priority
  // since it can itself be opened on top of the Settings modal.
  const scope = document.querySelector('.vkbd') || document.querySelector('.settings-modal') || document;
  return Array.from(scope.querySelectorAll('button, input, a[href], [tabindex]')).filter(isFocusable);
}

function rectCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function findNextFocusable(current, direction) {
  const candidates = getFocusableElements();
  if (!current || current === document.body || !candidates.includes(current)) {
    return candidates[0] || null;
  }
  const cur = rectCenter(current);
  let best = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === current) continue;
    const r = rectCenter(el);
    const dx = r.x - cur.x;
    const dy = r.y - cur.y;
    let primary;
    let cross;
    if (direction === 'up' && dy < -2) { primary = -dy; cross = Math.abs(dx); }
    else if (direction === 'down' && dy > 2) { primary = dy; cross = Math.abs(dx); }
    else if (direction === 'left' && dx < -2) { primary = -dx; cross = Math.abs(dy); }
    else if (direction === 'right' && dx > 2) { primary = dx; cross = Math.abs(dy); }
    else continue;
    // Cross-axis distance is weighted higher so navigation prefers the
    // element roughly aligned with the current one over a closer-but-
    // diagonal one.
    const score = primary + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

function moveFocus(direction) {
  const next = findNextFocusable(document.activeElement, direction);
  next?.focus();
}

function activateFocused() {
  const el = document.activeElement;
  if (!el || el === document.body) return;
  if (isTextEntry(el) && actions.onActivateInput) {
    actions.onActivateInput(el);
    return;
  }
  el.click();
}

function directionFromPad(pad) {
  if (pad.buttons[BUTTON.DPAD_UP]?.pressed) return 'up';
  if (pad.buttons[BUTTON.DPAD_DOWN]?.pressed) return 'down';
  if (pad.buttons[BUTTON.DPAD_LEFT]?.pressed) return 'left';
  if (pad.buttons[BUTTON.DPAD_RIGHT]?.pressed) return 'right';
  const [x, y] = pad.axes;
  if (y < -STICK_DEADZONE) return 'up';
  if (y > STICK_DEADZONE) return 'down';
  if (x < -STICK_DEADZONE) return 'left';
  if (x > STICK_DEADZONE) return 'right';
  return null;
}

function handleButtonDown(index) {
  switch (index) {
    case BUTTON.A: activateFocused(); break;
    case BUTTON.B: actions.onBack?.(); break;
    case BUTTON.X: actions.onX?.(); break;
    case BUTTON.Y: actions.onY?.(); break;
    case BUTTON.LB: actions.onPrev?.(); break;
    case BUTTON.RB: actions.onNext?.(); break;
    case BUTTON.START: actions.onStart?.(); break;
    default: break;
  }
}

const previousButtons = {};
// One { direction, since, lastRepeat } entry per pad index, reset whenever
// the held direction changes so switching directions doesn't inherit the
// old hold's repeat timing.
const dpadState = {};

function pollButtons(pad) {
  const prev = previousButtons[pad.index] || [];
  pad.buttons.forEach((button, i) => {
    if (button.pressed && !prev[i]) handleButtonDown(i);
  });
  previousButtons[pad.index] = pad.buttons.map((b) => b.pressed);
}

function pollDirectional(pad, timestamp) {
  const direction = directionFromPad(pad);
  const state = dpadState[pad.index];
  if (!direction) {
    dpadState[pad.index] = null;
    return;
  }
  if (!state || state.direction !== direction) {
    dpadState[pad.index] = { direction, since: timestamp, lastRepeat: timestamp };
    moveFocus(direction);
    return;
  }
  const heldFor = timestamp - state.since;
  const sinceRepeat = timestamp - state.lastRepeat;
  if (heldFor > REPEAT_DELAY_MS && sinceRepeat > REPEAT_RATE_MS) {
    state.lastRepeat = timestamp;
    moveFocus(direction);
  }
}

let rafId = null;

function pollGamepads(timestamp) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad) continue;
    pollButtons(pad);
    pollDirectional(pad, timestamp);
  }
  rafId = requestAnimationFrame(pollGamepads);
}

function anyPadConnected() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  return Array.from(pads).some(Boolean);
}

let started = false;

// Only polls while a controller is actually connected, so the app doesn't
// spend a requestAnimationFrame tick on this every frame when no one has
// one plugged in.
export function startGamepadNavigation() {
  if (started) return;
  started = true;

  const start = () => {
    if (rafId === null) rafId = requestAnimationFrame(pollGamepads);
  };
  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  window.addEventListener('gamepadconnected', start);
  window.addEventListener('gamepaddisconnected', () => {
    if (!anyPadConnected()) stop();
  });

  // A controller already plugged in before the app loaded doesn't always
  // fire 'gamepadconnected' — check once up front too.
  if (anyPadConnected()) start();
}
