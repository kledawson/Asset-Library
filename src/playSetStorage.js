// Local set previews and rebuilds share the save service's authoritative files.
export function playSetURL(url) {
  if (typeof window === 'undefined') return url;
  if (!['localhost','127.0.0.1'].includes(window.location.hostname)) return url;
  const parsed = new URL(url,window.location.href);
  if (!/^\/models\/(editor-sources\/)?play-props(?:-organized)?\.glb$/.test(parsed.pathname)) return url;
  return `http://127.0.0.1:3001${parsed.pathname}${parsed.search}`;
}
