import { useEffect, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hexRGB = hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
const rgbHex = rgb => '#' + rgb.map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('');
function toHSV(hex) {
  const [r, g, b] = hexRGB(hex).map(value => value / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta) h = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [h * 60, max ? delta / max : 0, max];
}
function fromHSV([h, s, v]) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbHex(rgb.map(value => (value + m) * 255));
}

export default function MaterialColorPicker({ value, mixed, textured, onChange, onStart, onEnd, onReset, canReset }) {
  const [hsv, setHSV] = useState(() => toHSV(value));
  const [hex, setHex] = useState(value);
  const dragging = useRef(false);
  useEffect(() => {
    setHex(value);
    setHSV(current => fromHSV(current) === value.toLowerCase() ? current : toHSV(value));
  }, [value]);
  function change(next) { setHSV(next); onChange(fromHSV(next)); }
  function atPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    change([hsv[0], clamp((event.clientX - rect.left) / rect.width, 0, 1), 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)]);
  }
  const rangeEvents = { onPointerDown: onStart, onPointerUp: onEnd, onPointerCancel: onEnd, onBlur: onEnd, onKeyDown: onStart, onKeyUp: onEnd };
  return <div className="material-color-picker">
    <div className="material-color-summary">
      <span className="material-color-swatch" style={{ background: value }} aria-hidden="true" />
      <span>{mixed ? 'Mixed Colors' : 'Selected Color'}</span>
      <button type="button" disabled={!canReset} onClick={onReset}>Reset Color</button>
    </div>
    <div className="material-color-square" role="slider" tabIndex={0} aria-label="Saturation And Brightness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv[1] * 100)} aria-valuetext={`Saturation ${Math.round(hsv[1] * 100)}%, brightness ${Math.round(hsv[2] * 100)}%`}
      style={{ backgroundColor: `hsl(${hsv[0]}, 100%, 50%)` }}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.focus(); onStart(); dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); atPointer(event); }}
      onPointerMove={event => { if (dragging.current) atPointer(event); }}
      onPointerUp={event => { dragging.current = false; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); onEnd(); }}
      onPointerCancel={() => { dragging.current = false; onEnd(); }} onLostPointerCapture={() => { if (dragging.current) { dragging.current = false; onEnd(); } }}
      onKeyDown={event => { if (!event.key.startsWith('Arrow')) return; event.preventDefault(); onStart(); const step = event.shiftKey ? .1 : .01; change([hsv[0], clamp(hsv[1] + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 1), clamp(hsv[2] + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0), 0, 1)]); }} onKeyUp={onEnd} onBlur={onEnd}>
      <span className="material-color-cursor" style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%` }} />
    </div>
    <label className="material-color-range"><span>Hue</span><input aria-label="Hue" type="range" min="0" max="359" value={Math.round(hsv[0])} {...rangeEvents} onChange={event => change([Number(event.target.value), hsv[1], hsv[2]])} className="material-hue-range" /></label>
    <label className="material-color-range"><span>Brightness</span><input aria-label="Brightness" type="range" min="0" max="100" value={Math.round(hsv[2] * 100)} {...rangeEvents} onChange={event => change([hsv[0], hsv[1], Number(event.target.value) / 100])} style={{ background: `linear-gradient(to right, #000, ${fromHSV([hsv[0], hsv[1], 1])})` }} /></label>
    <div className="material-color-values">
      <label className="material-hex"><span>Hex</span><input aria-label="Hex Color" value={hex.toUpperCase()} maxLength={7} spellCheck={false} onFocus={onStart} onChange={event => { const text = event.target.value; setHex(text); const normalized = text.startsWith('#') ? text : '#' + text; if (/^#[0-9a-f]{6}$/i.test(normalized)) onChange(normalized.toLowerCase()); }} onBlur={() => { setHex(value); onEnd(); }} /></label>
      {hexRGB(value).map((channel, index) => <label key={index}><span>{['R', 'G', 'B'][index]}</span><input aria-label={`${['Red', 'Green', 'Blue'][index]} Channel`} type="number" min="0" max="255" value={channel} onFocus={onStart} onBlur={onEnd} onChange={event => { const rgb = hexRGB(value); rgb[index] = Number(event.target.value); onChange(rgbHex(rgb)); }} /></label>)}
    </div>
    {textured && <p className="material-color-note">Tints the existing texture.</p>}
  </div>;
}
