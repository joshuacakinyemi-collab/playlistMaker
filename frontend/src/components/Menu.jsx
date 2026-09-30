// The building blocks of every screen: a list of full-width rows with a
// highlight bar, like the menus on a pocket mp3 player. Rows are real
// <button>s so mouse, keyboard and the controller's D-pad all work.

export function Menu({ label, children }) {
  return (
    <div className="menu-group">
      {label && <div className="menu-label">{label}</div>}
      <ul className="menu">{children}</ul>
    </div>
  );
}

export function MenuRow({ icon, title, detail, active = false, chevron = true, danger = false, onClick, trailing, ...rest }) {
  return (
    <li className={`menu-item${active ? ' active' : ''}`}>
      <button
        type="button"
        className={`menu-row${danger ? ' danger' : ''}`}
        onClick={onClick}
        {...rest}
      >
        {icon !== undefined && <span className="menu-icon" aria-hidden="true">{icon}</span>}
        <span className="menu-text">
          <span className="menu-title">{title}</span>
          {detail && <span className="menu-detail">{detail}</span>}
        </span>
        {chevron && <span className="menu-chevron" aria-hidden="true">›</span>}
      </button>
      {trailing}
    </li>
  );
}
