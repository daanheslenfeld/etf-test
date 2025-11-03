import jsPDF from 'jspdf';
import 'jspdf-autotable';

// PIGG Kleuren
const COLORS = {
  primary: '#28EBCF',
  darkBg: '#0f172a',
  mediumBg: '#1e293b',
  text: '#ffffff',
  lightText: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444'
};

export const generatePortfolioReport = (user, portfolio, metrics, investmentDetails, performanceData) => {
  try {
    console.log('🔷 Generating PDF report...');
    console.log('User:', user);
    console.log('Portfolio:', portfolio);
    console.log('Metrics:', metrics);
    console.log('InvestmentDetails:', investmentDetails);
    console.log('PerformanceData:', performanceData);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

  // Helper function voor euro formatting
  const formatEuro = (value) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Helper function voor percentage formatting
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Header met PIGG branding
  const addHeader = () => {
    doc.setFillColor(15, 23, 42); // darkBg
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(24);
    doc.setTextColor(40, 235, 207); // primary color
    doc.setFont('helvetica', 'bold');
    doc.text('PIGG', 15, 25);

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Portfolio Overzicht', 15, 35);

    // Datum rechtsboven
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    const today = new Date().toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(today, pageWidth - 15, 25, { align: 'right' });

    return 45;
  };

  // Pagina 1: Samenvatting
  yPos = addHeader();

  // Klantgegevens
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`${user.firstName || user.name}`, 15, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Type: ${user.account_type === 'betaald' ? 'Betaald' : user.account_type === 'fictief' ? 'Fictief' : 'Gratis'}`, 15, yPos);
  yPos += 7;
  doc.text(`Risicoprofiel: ${investmentDetails.riskProfile || 'Neutraal'}`, 15, yPos);
  yPos += 15;

  // Samenvatting sectie
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(15, yPos, pageWidth - 30, 70, 3, 3, 'F');

  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(40, 235, 207);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultaten', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');

  const currentValue = performanceData && performanceData.length > 0
    ? performanceData[performanceData.length - 1].portfolioValue
    : parseFloat(investmentDetails.amount) || 10000;

  const totalInvested = parseFloat(investmentDetails.amount) || 10000;
  const totalReturn = currentValue - totalInvested;
  const returnPercent = (totalReturn / totalInvested * 100);

  // Twee kolommen voor resultaten
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;

  doc.text('Beginvermogen:', col1X, yPos);
  doc.setTextColor(255, 255, 255);
  doc.text(formatEuro(totalInvested), col1X + 60, yPos);

  doc.setTextColor(148, 163, 184);
  doc.text('Huidige Waarde:', col2X, yPos);
  doc.setTextColor(255, 255, 255);
  doc.text(formatEuro(currentValue), col2X + 60, yPos);

  yPos += 8;
  doc.setTextColor(148, 163, 184);
  doc.text('Winst/Verlies:', col1X, yPos);
  doc.setTextColor(totalReturn >= 0 ? 16 : 239, totalReturn >= 0 ? 185 : 68, totalReturn >= 0 ? 129 : 68);
  doc.text(formatEuro(totalReturn), col1X + 60, yPos);

  doc.setTextColor(148, 163, 184);
  doc.text('Rendement:', col2X, yPos);
  doc.setTextColor(returnPercent >= 0 ? 16 : 239, returnPercent >= 0 ? 185 : 68, returnPercent >= 0 ? 129 : 68);
  doc.text(formatPercent(returnPercent), col2X + 60, yPos);

  yPos += 8;
  doc.setTextColor(148, 163, 184);
  doc.text('Aantal ETFs:', col1X, yPos);
  doc.setTextColor(255, 255, 255);
  doc.text(`${portfolio.length}`, col1X + 60, yPos);

  doc.setTextColor(148, 163, 184);
  doc.text('Gemiddelde TER:', col2X, yPos);
  doc.setTextColor(255, 255, 255);
  doc.text(`${metrics.avgTER.toFixed(2)}%`, col2X + 60, yPos);

  yPos += 20;

  // Portfolio Mix
  doc.setFontSize(14);
  doc.setTextColor(40, 235, 207);
  doc.setFont('helvetica', 'bold');
  doc.text('Beleggingsmix', 15, yPos);
  yPos += 10;

  // Bereken categorieën
  const categoryTotals = {};
  portfolio.forEach(etf => {
    const category = etf.categorie || 'Overig';
    const value = (currentValue * (etf.weight || 0) / 100);
    categoryTotals[category] = (categoryTotals[category] || 0) + value;
  });

  // Tabel voor beleggingsmix
  const categoryData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, value]) => [
      category,
      formatEuro(value),
      `${((value / currentValue) * 100).toFixed(1)}%`
    ]);

  doc.autoTable({
    startY: yPos,
    head: [['Categorie', 'Waarde', 'Belang']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [40, 235, 207],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [51, 65, 85]
    },
    margin: { left: 15, right: 15 },
    tableWidth: pageWidth - 30
  });

  // Nieuwe pagina voor Portfolio Holdings
  doc.addPage();
  yPos = addHeader();

  doc.setFontSize(14);
  doc.setTextColor(40, 235, 207);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Holdings', 15, yPos);
  yPos += 10;

  // Holdings tabel
  const holdingsData = portfolio.map(etf => {
    const etfValue = (currentValue * (etf.weight || 0) / 100);
    return [
      etf.naam || 'Onbekend',
      etf.isin || '-',
      `${(etf.weight || 0).toFixed(1)}%`,
      formatEuro(etfValue)
    ];
  });

  doc.autoTable({
    startY: yPos,
    head: [['ETF Naam', 'ISIN', 'Gewicht', 'Waarde']],
    body: holdingsData,
    theme: 'grid',
    headStyles: {
      fillColor: [40, 235, 207],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [51, 65, 85]
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 }
    }
  });

  // Footer op elke pagina
  const addFooter = (pageNum, totalPages) => {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Pagina ${pageNum} van ${totalPages} | Gegenereerd door PIGG | ${new Date().toLocaleDateString('nl-NL')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // Voeg footers toe aan alle pagina's
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Download de PDF
  const fileName = `PIGG_Portfolio_Overzicht_${new Date().toISOString().split('T')[0]}.pdf`;
  console.log('✅ PDF generated successfully, downloading:', fileName);
  doc.save(fileName);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    alert('Er is een fout opgetreden bij het genereren van het rapport. Probeer het opnieuw.');
  }
};
