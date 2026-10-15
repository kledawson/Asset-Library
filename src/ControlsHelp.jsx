import { libraryVersion } from './libraryVersion';
import { useEffect, useRef, useState } from 'react';
import { controlHelpSections } from './controlHelpCatalog';
import HelpIcon from './HelpIcon';
import StableButtonLabel from './StableButtonLabel';
import { helpKeyPressed } from './helpKeyFeedback';

const gestures = {
  Click: ['cursor', 'Select'], 'Double-click': ['double-click', 'Double Click'], 'Click Outside': ['click-outside', 'Deselect'],
  'Left Drag': ['left-drag', 'Left Drag'], 'Right Drag': ['right-drag', 'Right Drag'], Scroll: ['scroll', 'Mouse Wheel'],
  'Ring Drag': ['ring-drag', 'Drag'], 'Header Drag': ['header-drag', 'Drag'],
};

function RotationDemo() {
  const [angle, setAngle] = useState(0);
  return <div className="asset-model-label controls-help-rotation-demo">
    <button type="button" aria-label="Rotate Asset Left (Help Demo)" onClick={() => setAngle(value => value - 22.5)}>↶</button>
    <span style={{ transform: `rotate(${angle}deg)` }}>Asset</span>
    <button type="button" aria-label="Rotate Asset Right (Help Demo)" onClick={() => setAngle(value => value + 22.5)}>↷</button>
  </div>;
}

function ControlRow({ row, commandKey, heldKeys, helpOpen }) {
  const [demoIndex, setDemoIndex] = useState(row.id === 'sliders-horizontal-2' ? 1 : 0);
  const isToggleDemo = ['sliders-horizontal-2', 'mouse-pointer-2-0', 'save-1'].includes(row.id);
  const centerControl = row.kind === 'keyboard' || (row.kind === 'gesture' && row.keys.every(key => gestures[key] && !gestures[key][1]));
  const demoPressed = row.id === 'sliders-horizontal-2' ? demoIndex === 0 : demoIndex === 1;
  return <div className="controls-help-row">
    <div className={`controls-help-keys${centerControl ? ' controls-help-keys-centered' : ''}`} aria-label={row.keys.map(key => key === 'Ctrl' ? commandKey : key).join(row.keys.includes('Ctrl') ? ' + ' : ' or ')}>
      {row.id === 'orbit-4' ? <RotationDemo key={String(helpOpen)} /> : isToggleDemo ? <button type="button" className="controls-help-button-label controls-help-demo" aria-label={`${row.keys[demoIndex]} (Help Demo)`} aria-pressed={demoPressed} onClick={() => setDemoIndex(index => 1 - index)}><StableButtonLabel labels={row.keys} value={row.keys[demoIndex]} /></button>
        : row.kind === 'field' ? <span className="controls-help-gesture"><HelpIcon name={row.icon} /><span>{row.keys[0]}</span></span> : row.keys.map(key => gestures[key]
        ? <span key={key} className="controls-help-gesture" title={key}><HelpIcon name={gestures[key][0]} />{gestures[key][1] && <span>{gestures[key][1]}</span>}</span>
        : row.kind === 'keyboard' ? <kbd key={key} className={helpKeyPressed(row.keys, key, heldKeys, commandKey) ? 'help-key-held' : ''}>{key === 'Ctrl' ? commandKey : key === 'Page Up' ? 'PgUp' : key === 'Page Down' ? 'PgDn' : key}</kbd> : <button key={key} type="button" className="controls-help-button-label controls-help-action-demo" aria-label={`${key} (Help Demo)`}>{key}</button>)}
    </div>
    <div className="controls-help-description"><strong>{row.title}</strong><p>{row.description}</p></div>
  </div>;
}

function ControlSection({ section, index, commandKey, heldKeys, helpOpen, expanded, onExpanded }) {
  const expandButton = useRef(null), collapseButton = useRef(null);
  function toggle(next) {
    onExpanded(next);
    requestAnimationFrame(() => (next ? collapseButton.current : expandButton.current)?.focus({ preventScroll: next }));
  }
  return <section className="controls-help-section" style={{ '--help-section-order': index }} aria-labelledby={`help-section-${section.icon}`}>
    <h3 id={`help-section-${section.icon}`}><HelpIcon name={section.icon} />{section.title}</h3>
    {section.rows.slice(0, 3).map(row => <ControlRow key={row.id} row={row} commandKey={commandKey} heldKeys={heldKeys} helpOpen={helpOpen} />)}
    {section.rows.length > 3 && <div className="controls-help-disclosure">
      <button ref={expandButton} hidden={expanded} className="controls-help-text-toggle" aria-expanded={expanded} aria-controls={`help-more-${section.icon}`} onClick={() => toggle(true)}><HelpIcon name="chevron-down" /><StableButtonLabel labels={['All Controls', 'Fewer Controls']} value="All Controls" /></button>
      <div id={`help-more-${section.icon}`} hidden={!expanded}>
        {section.rows.slice(3).map(row => <ControlRow key={row.id} row={row} commandKey={commandKey} heldKeys={heldKeys} helpOpen={helpOpen} />)}
        <button ref={collapseButton} className="controls-help-text-toggle controls-help-collapse" aria-expanded={expanded} aria-controls={`help-more-${section.icon}`} onClick={() => toggle(false)}><HelpIcon name="chevron-down" /><StableButtonLabel labels={['All Controls', 'Fewer Controls']} value="Fewer Controls" /></button>
      </div>
    </div>}
  </section>;
}

export default function ControlsHelp({ open, onOpen, onClose }) {
  const dialog = useRef(null);
  const launcher = useRef(null);
  const body = useRef(null);
  const helpState = useRef({ open, onClose });
  helpState.current = { open, onClose };
  const [expandedSections, setExpandedSections] = useState({});
  const [heldKeys, setHeldKeys] = useState(new Set());
  const expandableSections = controlHelpSections.filter(section => section.rows.length > 3);
  const allExpanded = expandableSections.every(section => expandedSections[section.icon]);
  const commandKey = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  useEffect(() => {
    setHeldKeys(new Set());
    if (!open) return undefined;
    const held = new Set();
    function update(event) {
      const key = event.key.toLowerCase();
      if (event.type === 'keydown') {
        if (key !== 'tab') event.preventDefault();
        if (event.repeat) return;
        held.add(key);
      } else held.delete(key);
      // Reconcile modifiers even if Help opened while a key was already held.
      [['control', event.ctrlKey], ['meta', event.metaKey], ['shift', event.shiftKey], ['alt', event.altKey]].forEach(([name, down]) => down ? held.add(name) : held.delete(name));
      setHeldKeys(new Set(held));
    }
    function clear() { held.clear(); setHeldKeys(new Set()); }
    window.addEventListener('keydown', update, true);
    window.addEventListener('keyup', update, true);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      window.removeEventListener('keydown', update, true);
      window.removeEventListener('keyup', update, true);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    };
  }, [open]);
  useEffect(() => {
    const element = dialog.current;
    // Native dialog events must be handled directly, including browser dismissals.
    const preventDismiss = event => event.preventDefault();
    const synchronizeClose = () => {
      if (!element.open && helpState.current.open) helpState.current.onClose();
    };
    element.addEventListener('cancel', preventDismiss);
    element.addEventListener('close', synchronizeClose);
    return () => {
      element.removeEventListener('cancel', preventDismiss);
      element.removeEventListener('close', synchronizeClose);
    };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) {
      window.dispatchEvent(new Event('workshop-help-open'));
      element.showModal();
    } else if (!open && element.open) {
      element.close();
      launcher.current?.focus({ preventScroll: true });
    }
  }, [open]);

  return <>
    <button ref={launcher} className="controls-help-launcher" aria-label="Controls and help" aria-haspopup="dialog" aria-expanded={open} onClick={() => {
      if (open && !dialog.current.open) {
        window.dispatchEvent(new Event('workshop-help-open'));
        dialog.current.showModal();
      }
      onOpen();
    }}><span aria-hidden="true">i</span></button>
    <dialog ref={dialog} data-workshop-help className="controls-help-dialog" aria-labelledby="controls-help-title"
      onCancel={event => event.preventDefault()}
      onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Tab') {
          const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), summary, [tabindex="0"]')].filter(element => element.getClientRects().length);
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}
      onClick={event => {
        if (event.target !== dialog.current) return;
        const rect = dialog.current.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <header className="controls-help-header">
        <div><span className="brand-kicker version-kicker">VERSION <span className="version-number">{libraryVersion}</span></span><h2 id="controls-help-title">Controls &amp; Help</h2><p>Find your way around the library, preview, and editor.</p></div>
        <button autoFocus className="controls-help-close" aria-label="Close help" onClick={onClose}><HelpIcon name="close" /></button>
      </header>
      <div ref={body} className="controls-help-body" tabIndex={0} aria-label="Control guide">
        <div className="controls-help-grid">
          {[0, 1].map(column => <div key={column} className="controls-help-column">
            {controlHelpSections.map((section, index) => ({ section, index })).filter(item => item.index % 2 === column).map(({ section, index }) => <ControlSection key={section.icon} section={section} index={index} commandKey={commandKey} heldKeys={heldKeys} helpOpen={open} expanded={!!expandedSections[section.icon]} onExpanded={next => setExpandedSections(current => ({ ...current, [section.icon]: next }))} />)}
          </div>)}
        </div>
      </div>
      <footer className="controls-help-footer">
        <span>App shortcuts pause while Controls &amp; Help is open.</span>
        <div className="controls-help-footer-actions">
          <button type="button" className="controls-help-bulk-toggle" aria-pressed={allExpanded} onClick={() => setExpandedSections(allExpanded ? {} : Object.fromEntries(expandableSections.map(section => [section.icon, true])))}>
            <HelpIcon name="chevron-down" className={allExpanded ? 'controls-help-collapse-icon' : ''} />
            <StableButtonLabel labels={['Expand All', 'Collapse All']} value={allExpanded ? 'Collapse All' : 'Expand All'} />
          </button>
        </div>
      </footer>
    </dialog>
  </>;
}
