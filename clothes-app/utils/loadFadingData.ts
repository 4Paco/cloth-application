import Papa from 'papaparse';

export async function loadFadingData() {
  const res = await fetch('/data/tmp.csv');
  const text = await res.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
}
