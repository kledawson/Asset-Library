// Small local line icons keep help independent of external fonts and requests.
const cursor = <path d="m5 3 14 9-7 1-3 7Z" />;
export default function HelpIcon({ name, className = '' }) {
  const icons = {
    'reset-view': <><path d="M4 9a8 8 0 1 1 0 7M4 4v5h5" /><circle cx="12" cy="12" r="2.5" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="m3 3 18 18M9.5 5.3A13 13 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.2 6.2A18 18 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2M10 10a3 3 0 0 0 4 4" /></>,
    drop: <><path d="M12 3v12m-4-4 4 4 4-4M4 20h16" /><path d="M7 20v-2m10 2v-2" /></>,
    'open-file': <><path d="M14 3H5v18h14V8Z" /><path d="M14 3v5h5M12 17v-6m-3 3 3-3 3 3" /></>,
    library: <><path d="M4 4v16M9 4v16M14 4v16m4-15 3 14" /><path d="M4 7h10M4 17h10" /></>,
    orbit: <><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)" /><circle cx="12" cy="12" r="3" /><path d="m18 3 3 1-1 3" /></>,
    'sliders-horizontal': <><path d="M3 6h5m4 0h9M3 12h11m4 0h3M3 18h2m4 0h12" /><circle cx="10" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="7" cy="18" r="2" /></>,
    'mouse-pointer-2': cursor,
    'move-3d': <><path d="M12 20V3m-3 3 3-3 3 3M12 20 3 13m0 4v-4h4m5 7 9-7m-4 0h4v4" /></>,
    save: <><path d="M5 3h12l4 4v14H3V3h2Z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.7 1.7 0 0 1 1-3.3h3a3 3 0 0 0 3-3c0-4.4-4-8-9-8Z" /><circle cx="7.5" cy="11" r=".8" /><circle cx="10" cy="7" r=".8" /><circle cx="15" cy="7.5" r=".8" /></>,
    panels: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M11 9v11" /></>,
    cursor,
    'double-click': <><g transform="translate(-2 -1) scale(.82)">{cursor}</g><g transform="translate(7 5) scale(.72)">{cursor}</g></>,
    'click-outside': <><circle cx="10" cy="10" r="8" strokeDasharray="2 3" /><path d="m10 9 11 7-5 1-2 5Z" fill="#fff5e3" /></>,
    mouse: <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M6 9h12M12 2v7" /></>,
    'left-drag': <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M6 9h12M12 2v7" /><path d="M7 8V6a4 4 0 0 1 4-3v5Z" fill="currentColor" stroke="none" /></>,
    'right-drag': <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M6 9h12M12 2v7" /><path d="M13 3a4 4 0 0 1 4 3v2h-4Z" fill="currentColor" stroke="none" /></>,
    scroll: <><rect x="6" y="2" width="12" height="20" rx="6" /><rect x="10.5" y="5" width="3" height="6" rx="1.5" fill="currentColor" stroke="none" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    package: <><path d="m3 7 9-4 9 4v10l-9 4-9-4Z" /><path d="m3 7 9 4 9-4M12 11v10M7 5l9 4" /></>,
    cube: <><path d="m4 7 8-4 8 4v10l-8 4-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    return: <><path d="M20 18v-5a5 5 0 0 0-5-5H4m4-4L4 8l4 4" /></>,
    'ring-drag': <><ellipse cx="12" cy="13" rx="9" ry="5" /><path d="m17 6 3 2-3 2" /><path d="M7 8c3-3 8-3 13 0" /></>,
    'header-drag': <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M10 7h4m-2-2v4" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg className={`help-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name] || icons.mouse}</svg>;
}
