const keyNames = { '↑': 'arrowup', '↓': 'arrowdown', '←': 'arrowleft', '→': 'arrowright', 'Page Up': 'pageup', 'Page Down': 'pagedown', Esc: 'escape', Ctrl: 'control' };

export function helpKeyName(key, commandKey) {
  return key === 'Ctrl' && commandKey === '⌘' ? 'meta' : keyNames[key] || key.toLowerCase();
}

export function helpKeyPressed(keys, key, heldKeys, commandKey) {
  const required = keys.map(value => helpKeyName(value, commandKey));
  const modifiers = ['control', 'meta', 'shift', 'alt'];
  // Arrow pairs are alternatives; modifier shortcuts require the whole chord.
  if (keys.includes('Ctrl')) {
    return required.every(value => heldKeys.has(value)) &&
      modifiers.every(value => !heldKeys.has(value) || required.includes(value));
  }
  return heldKeys.has(helpKeyName(key, commandKey)) && !modifiers.some(value => heldKeys.has(value));
}
