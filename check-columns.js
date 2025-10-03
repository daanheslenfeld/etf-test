const XLSX = require('xlsx');

const workbook = XLSX.readFile('./public/ETF_overzicht_met_subcategorie.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

if (data.length > 0) {
  console.log('\n=== Kolommen in Excel ===');
  Object.keys(data[0]).forEach(col => {
    console.log(`- ${col}`);
  });

  console.log('\n=== Unieke waarden per filter kolom ===');

  // Subcategorie
  const subcategories = [...new Set(data.map(row => row.subcategorie))].filter(Boolean).sort();
  console.log(`\nSubcategorieën (${subcategories.length}):`);
  subcategories.forEach(s => console.log(`  - ${s}`));

  // Currency
  const currencies = [...new Set(data.map(row => row['fund ccy']))].filter(Boolean).sort();
  console.log(`\nValuta (${currencies.length}):`);
  currencies.forEach(c => console.log(`  - ${c}`));

  // Distribution
  const distributions = [...new Set(data.map(row => row.distribution))].filter(Boolean).sort();
  console.log(`\nDistributie (${distributions.length}):`);
  distributions.forEach(d => console.log(`  - ${d}`));
}
