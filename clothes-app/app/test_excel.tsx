// In excel_loader.tsx or another test component file

import React, { useState } from "react";
import { parseExcelFile, ColorEntry } from "../components/color_handling";
import { findSimilarColors } from "../components/find_colors";

export default function ExcelTest() {
  const [parsedData, setParsedData] = useState<ColorEntry[] | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await parseExcelFile(file);
        console.log("Parsed Data:", result);
        setParsedData(result);
      } catch (err) {
        console.error("Failed to parse Excel file", err);
      }
    }
  };

  return (
    <div>
      <h2>Upload Excel File</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      {parsedData && (
        <div>
          <h3>Parsed {parsedData.length} entries</h3>
          <pre>{JSON.stringify(parsedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
