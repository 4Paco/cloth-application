"use client";

import React, { useState } from "react";
import { parseCSVText, ColorEntry } from "../../components/color_handling"; // adjust path as needed

export default function ExcelTest() {
  const [parsedData, setParsedData] = useState<ColorEntry[] | null>(null);

  const handleTestStaticCSV = async () => {
    try {
      const res = await fetch("/public/dataset/data_dyes.csv");
      const csvText = await res.text();
      const parsed = parseCSVText(csvText);

      setParsedData(parsed);

      console.log("Parsed CSV data:", parsed);
    } catch (err) {
      console.error("Failed to fetch or parse CSV", err);
    }
  };

  return (
    <div>
      <h2>Test Static CSV File</h2>
      <button onClick={handleTestStaticCSV}>Load /tdataset/data_dyes.csv</button>

      {parsedData && (
        <div>
          <h3>Parsed {parsedData.length} entries</h3>
          <pre>{JSON.stringify(parsedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
