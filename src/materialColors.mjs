import { Color, LinearSRGBColorSpace } from 'three';

// Picker values are sRGB; GLTF material factors are linear. Be explicit so
// loading, editing and exporting agree without changing global color settings.
export function materialHex(material) {
  return material?.color ? `#${material.color.clone().convertLinearToSRGB().getHexString(LinearSRGBColorSpace)}` : '#ffffff';
}

export function describeMaterials(material) {
  return (Array.isArray(material) ? material : [material]).map((entry, index) => ({
    name: entry?.name || `Material ${index + 1}`, color: materialHex(entry), textured: !!entry?.map,
  }));
}

export function applyMaterialColors(material, overrides = {}) {
  const apply = (entry, index) => {
    const hex = overrides[index];
    if (!entry?.color || !/^#[0-9a-f]{6}$/i.test(hex || '')) return entry;
    const clone = entry.clone();
    const value = Number.parseInt(hex.slice(1), 16);
    clone.color.copy(new Color().setRGB(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255).convertSRGBToLinear());
    return clone;
  };
  return Array.isArray(material) ? material.map(apply) : apply(material, 0);
}

export function disposeColorMaterials(material, original) {
  const values = Array.isArray(material) ? material : [material];
  const sources = Array.isArray(original) ? original : [original];
  values.forEach((entry, index) => { if (entry !== sources[index]) entry.dispose(); });
}
