import { useTheme } from '../../ThemeContext';

function ThemeControls() {
  const { isDark, toggleMode, accentIndex, setAccent, ACCENTS } = useTheme();

  return (
    <div className="theme-controls">
      <button className="mode-toggle" onClick={toggleMode}>
        <i className={`ti ${isDark ? 'ti-moon' : 'ti-sun'}`} aria-hidden="true" />
        {isDark ? 'Light' : 'Dark'}
      </button>
      <div className="color-swatches">
        {ACCENTS.map((a, i) => (
          <div
            key={a.label}
            className={`swatch${i === accentIndex ? ' selected' : ''}`}
            style={{ background: a.color }}
            title={a.label}
            onClick={() => setAccent(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default ThemeControls;
