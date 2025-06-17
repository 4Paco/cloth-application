"use client";

import React, { useState } from "react";
import { parseCSVText, ColorEntry } from "../../components/color_handling"; // adjust path as needed



export default function ExcelTest() {
  const [parsedData, setParsedData] = useState<ColorEntry[] | null>(null);

  const handleTestStaticCSV = async () => {
    try {
      const res = await fetch("./dataset/data_dyes.csv");
      const csvText = await res.text();
      const parsed = parseCSVText(csvText);

      setParsedData(parsed);

      console.log("Parsed CSV data:", parsed);
    } catch (err) {
      console.error("Failed to fetch or parse CSV", err);
    }
  };
  function ColorButton() {
  const [clicked, setClicked] = useState(false);

  return (
    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      onClick={() => handleTestStaticCSV()
      
      }
    
    >
      Load
    </button>
  );
};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2>Test Static CSV File</h2>
      <ColorButton />
      {parsedData && (
        <div>
          <h3>Parsed {parsedData.length} entries</h3>
          <pre>{JSON.stringify(parsedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
