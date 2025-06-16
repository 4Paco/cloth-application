import { ColorEntry } from './color_handling';
function deltaE(color1: ColorEntry, color2: ColorEntry): number {
  const dL = color1.L - color2.L;
  const da = color1.a - color2.a;
  const db = color1.b - color2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Finds colors close to a selected color based on SCIELAB (CIE76) distance
 * @param selectedColor The reference color
 * @param allColors Array of all color entries
 * @param threshold The ΔE threshold for closeness
 * @returns Filtered array of ids of similar colors
 */
export function findSimilarColors(
  selectedColor: ColorEntry,
  allColors: ColorEntry[],
  threshold: number = 3.0 //by default, consider colors within ΔE 3.0
):number[] {
  return allColors
    .map((color, index) => ({ color, index }))
    .filter(({ color }) =>  deltaE(selectedColor, color) <= threshold)
    .map(({ index }) => index);
}