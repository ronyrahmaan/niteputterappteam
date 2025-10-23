export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Convert color temperature (Kelvin) to RGB using Tanner Helland's approximation
// Range: 1000K – 40000K (we will clamp to 1000–6500K for UI)
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  let temp = clamp(kelvin, 1000, 40000) / 100;

  let r: number;
  let g: number;
  let b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = clamp(r, 0, 255);
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    g = clamp(g, 0, 255);
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = clamp(g, 0, 255);
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else {
    if (temp <= 19) {
      b = 0;
    } else {
      b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
      b = clamp(b, 0, 255);
    }
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(clamp(r, 0, 255))}${toHex(clamp(g, 0, 255))}${toHex(clamp(b, 0, 255))}`;
}

export function kelvinToHex(kelvin: number): string {
  return rgbToHex(kelvinToRgb(kelvin));
}