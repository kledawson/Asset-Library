// Archive pages share an origin with Latest, but never its editor drafts or view state.
function scopedStorage(storage, prefix) {
  const keys = () => Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(key => key !== null && key.startsWith(prefix));
  return {
    get length() { return keys().length; },
    key(index) { const key = keys()[index]; return key === undefined ? null : key.slice(prefix.length); },
    getItem(key) { return storage.getItem(prefix + String(key)); },
    setItem(key, value) { storage.setItem(prefix + String(key), value); },
    removeItem(key) { storage.removeItem(prefix + String(key)); },
    clear() { keys().forEach(key => storage.removeItem(key)); },
  };
}
module.exports = { scopedStorage };
