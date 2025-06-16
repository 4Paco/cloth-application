import * as XLSX from "xlsx";

export interface ColorEntry {
  id: number;
  hours : number;
  L: number;
  a: number;
  b: number;
  E: number;
}

export function parseExcelFile(file: File): Promise<ColorEntry[]> {
    // gets the data from the excel file and returns it as an array of ColorEntry objects
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      // Map the data to ColorEntry type
      const parsed: ColorEntry[] = json.map((row: any) => ({
        id: Number(row.id),
        hours: Number(row.hours),
        L: Number(row.L),
        a: Number(row.a),
        b: Number(row.b),
        E: Number(row.E),
      }));

      resolve(parsed);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function get_individual_colors(
    // Returns all the colors at their initial state, before any exposure to sunlight
  colors: ColorEntry[]
): ColorEntry[] {
  return colors.filter((color) => color.hours === 0);
}
