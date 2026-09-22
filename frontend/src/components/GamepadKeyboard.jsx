import { useEffect, useRef, useState } from 'react';
import { registerGamepadActions } from '../gamepad.js';

// Y cycles through these in order, wrapping back to the start.
const PAGES = ['letters', 'symbols'];
const NEXT_PAGE_LABEL = { letters: '123', symbols: 'ABC' };

const ROWS_BY_PAGE = {
  letters: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ],
  symbols: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['-', '_', '+', '=', '.', ',', '/', '\\', ':', ';'],
    ["'", '"', '?', '~', '`', '|', '[', ']', '{', '}', '<', '>'],
  ],
};

// React controls these inputs via value+onChange, so setting el.value
// directly wouldn't be picked up — this goes through the native setter and
// fires a real 'input' event, which is what React's synthetic event system
// actually listens for.
function setNativeValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// A controller-only on-screen keyboard: opens when A is pressed on a
// focused text field (see gamepad.js's onActivateInput), and is itself
// fully navigable with the D-pad + A, using the same spatial navigation as
// the rest of the app since every key is just a real <button>.
function GamepadKeyboard() {
  const [target, setTarget] = useState(null);
  const [value, setValue] = useState('');
  const [caps, setCaps] = useState(false);
  const [page, setPage] = useState('letters');
  const firstKeyRef = useRef(null);

  // Registered once, for the app's whole lifetime — this is how any input
  // anywhere in the app opens the keyboard when A is pressed on it.
  useEffect(() => {
    return registerGamepadActions({
      onActivateInput: (el) => {
        setTarget(el);
        setValue(el.value || '');
        setCaps(false);
        setPage('letters');
      },
    });
  }, []);

  const close = () => {
    target?.focus();
    setTarget(null);
  };

  // X/Y/B only mean caps/symbols-page/close while the keyboard is actually
  // open — registering them only in this effect (torn down when `target`
  // goes back to null) means whatever B meant before the keyboard opened
  // is restored automatically afterward.
  useEffect(() => {
    if (!target) return undefined;
    return registerGamepadActions({
      onX: () => setCaps((c) => !c),
      onY: () => setPage((p) => PAGES[(PAGES.indexOf(p) + 1) % PAGES.length]),
      onBack: close,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    if (target) firstKeyRef.current?.focus();
  }, [target, page]);

  if (!target) return null;

  const commit = (next) => {
    setValue(next);
    setNativeValue(target, next);
  };

  const pressKey = (key) => {
    const toInsert = page === 'letters' ? (caps ? key.toUpperCase() : key.toLowerCase()) : key;
    commit(value + toInsert);
  };

  const rows = ROWS_BY_PAGE[page];

  return (
    <div className="vkbd-backdrop" onClick={close}>
      <div className="vkbd" onClick={(e) => e.stopPropagation()}>
        <div className="vkbd-preview">
          {value ? <span>{value}</span> : <span className="vkbd-placeholder">Type…</span>}
          <span className="vkbd-caret" aria-hidden="true">|</span>
        </div>

        <div className="vkbd-page-label">{page}</div>

        <div className="vkbd-rows">
          {rows.map((row, ri) => (
            <div className="vkbd-row" key={ri}>
              {row.map((key, ki) => (
                <button
                  key={key}
                  ref={ri === 0 && ki === 0 ? firstKeyRef : undefined}
                  type="button"
                  className="vkbd-key"
                  onClick={() => pressKey(key)}
                >
                  {page === 'letters' ? (caps ? key.toUpperCase() : key.toLowerCase()) : key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="vkbd-row vkbd-controls">
          <button type="button" className="vkbd-key vkbd-key--wide" onClick={() => commit(value.slice(0, -1))}>
            ⌫ Backspace
          </button>
          <button type="button" className="vkbd-key vkbd-key--space" onClick={() => commit(value + ' ')}>
            Space
          </button>
          <button type="button" className="vkbd-key vkbd-key--wide" onClick={close}>
            ✓ Done
          </button>
        </div>

        <div className="vkbd-hints">
          <span><b>X</b> {caps ? 'Caps: ON' : 'Caps'}</span>
          <span><b>Y</b> {NEXT_PAGE_LABEL[page]}</span>
          <span><b>B</b> Done</span>
        </div>
      </div>
    </div>
  );
}

export default GamepadKeyboard;
