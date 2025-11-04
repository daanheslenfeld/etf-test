import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PIGG Kleuren
const COLORS = {
  primary: '#28EBCF',
  primaryRgb: [40, 235, 207],
  darkBg: '#0f172a',
  mediumBg: '#1e293b',
  text: '#ffffff',
  lightText: '#94a3b8',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444'
};

export const generatePortfolioReport = (user, portfolio, metrics, investmentDetails, staticPerformanceData, currentMonth, animatedPortfolioValue) => {
  try {
    console.log('🔷 Generating PDF report (Landscape, Rabobank-style)...');

    // Create PDF in LANDSCAPE mode (A4 landscape)
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Manually bind autoTable if needed
    if (typeof doc.autoTable !== 'function' && autoTable) {
      doc.autoTable = function(options) {
        return autoTable(this, options);
      };
    }

    if (typeof doc.autoTable !== 'function') {
      throw new Error('PDF library niet correct geladen. Herlaad de pagina en probeer opnieuw.');
    }

    const pageWidth = doc.internal.pageSize.width;  // 297mm in landscape
    const pageHeight = doc.internal.pageSize.height; // 210mm in landscape
    let yPos = 15;

    // Helper function voor euro formatting
    const formatEuro = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '€ 0,00';
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    };

    // Helper function voor percentage formatting
    const formatPercent = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '0,00 %';
      return `${value >= 0 ? '' : ''}${value.toFixed(2)} %`;
    };

    // Load logo
    const logoImg = new Image();
    logoImg.src = '/logo192.png';

    // Header met PIGG branding (Rabobank-style)
    const addHeader = () => {
      // Title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // Blue color like Rabobank
      doc.setFont('helvetica', 'normal');
      doc.text('Periode-overzicht beleggingsportefeuille', 15, yPos);

      yPos += 8;
      doc.setFontSize(14);
      doc.setTextColor(40, 235, 207); // PIGG color
      doc.setFont('helvetica', 'bold');
      doc.text('PIGG', 15, yPos);

      // Add logo (top right)
      try {
        doc.addImage(logoImg, 'PNG', pageWidth - 35, 10, 20, 20);
      } catch (e) {
        console.log('Could not load logo:', e);
      }

      // Contact info (right side)
      doc.setFontSize(9);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'normal');
      const contactX = pageWidth - 80;
      doc.text('Voor vragen over uw beleggingen', contactX, 15);
      doc.text('neem contact op met', contactX, 19);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PIGG Support', contactX, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('E-mail support@pigg.nl', contactX, 29);

      // Client info (left side below title)
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user.firstName || user.name}`, 15, yPos);

      // Right side info
      doc.setFont('helvetica', 'bold');
      doc.text('Datum overzicht', contactX, yPos);
      doc.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.text(today, contactX + 35, yPos);

      yPos += 5;
      doc.text(`Account Type: ${user.account_type === 'betaald' ? 'Betaald' : user.account_type === 'fictief' ? 'Fictief' : 'Gratis'}`, 15, yPos);

      doc.setFont('helvetica', 'bold');
      doc.text('Portefeuillewaarde', contactX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatEuro(animatedPortfolioValue), contactX + 35, yPos);

      yPos += 10;

      return yPos;
    };

    // Start first page
    yPos = addHeader();

    // Samenvatting Section Header
    doc.setFillColor(220, 230, 240); // Light blue background
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('Samenvatting', 17, yPos + 5);
    yPos += 10;

    // Resultaten Box (left column)
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultaten', 17, yPos);
    yPos += 2;

    // Calculate values
    const initialInvestment = parseFloat(investmentDetails.amount) || 10000;
    const monthlyContribution = parseFloat(investmentDetails.monthlyContribution) || 0;
    const currentValue = animatedPortfolioValue || initialInvestment;
    const totalInvested = initialInvestment + (monthlyContribution * currentMonth);
    const totalReturn = currentValue - totalInvested;
    const returnPercent = totalInvested > 0 ? (totalReturn / totalInvested * 100) : 0;

    // YTD calculation - from start of current year or from month 0
    let ytdReturn = 0;
    if (staticPerformanceData && staticPerformanceData.length > 0) {
      const startValue = staticPerformanceData[0]?.portfolioValue || initialInvestment;
      ytdReturn = startValue > 0 ? ((currentValue - startValue) / startValue * 100) : 0;
    }

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const leftCol = 17;
    const valueCol = 70;

    yPos += 6;
    doc.text('Beginvermogen', leftCol, yPos);
    doc.text(formatEuro(initialInvestment), valueCol, yPos);

    yPos += 5;
    doc.text('Stortingen (+)', leftCol, yPos);
    doc.text(formatEuro(monthlyContribution * currentMonth), valueCol, yPos);

    yPos += 5;
    doc.text('Netto resultaat (+)', leftCol, yPos);
    doc.setTextColor(totalReturn >= 0 ? 0 : 255, totalReturn >= 0 ? 128 : 0, 0);
    doc.text(formatEuro(totalReturn), valueCol, yPos);

    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Netto rendement', leftCol, yPos);
    doc.setTextColor(returnPercent >= 0 ? 0 : 255, returnPercent >= 0 ? 128 : 0, 0);
    doc.text(formatPercent(returnPercent), valueCol, yPos);

    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Eindvermogen', leftCol, yPos);
    doc.text(formatEuro(currentValue), valueCol, yPos);

    // YTD section
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Bruto rendement YTD*', leftCol, yPos);
    doc.setTextColor(ytdReturn >= 0 ? 0 : 255, ytdReturn >= 0 ? 128 : 0, 0);
    doc.text(formatPercent(ytdReturn), valueCol, yPos);

    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.text('Kosten*', leftCol, yPos);
    doc.text(formatPercent(metrics.avgTER), valueCol, yPos);

    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Netto rendement', leftCol, yPos);
    doc.setTextColor(ytdReturn >= 0 ? 0 : 255, ytdReturn >= 0 ? 128 : 0, 0);
    doc.text(formatPercent(ytdReturn - metrics.avgTER), valueCol, yPos);

    // Beleggingsmix Section (right column)
    const rightColStart = 120;
    let rightYPos = 60;

    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('Beleggingsmix', rightColStart, rightYPos);
    rightYPos += 2;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    rightYPos += 6;
    doc.text('Beleggingscategorie', rightColStart, rightYPos);
    doc.text('Waarde', rightColStart + 50, rightYPos);
    doc.text('Belang', rightColStart + 70, rightYPos);

    doc.setFont('helvetica', 'normal');
    rightYPos += 5;

    // Calculate categories from portfolio
    const categoryTotals = {};
    portfolio.forEach(etf => {
      const category = etf.categorie || 'Overig';
      const value = (currentValue * (etf.weight || 0) / 100);
      categoryTotals[category] = (categoryTotals[category] || 0) + value;
    });

    // Sort and display categories
    Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, value]) => {
        const percentage = (value / currentValue * 100);
        doc.text(category, rightColStart, rightYPos);
        doc.text(formatEuro(value), rightColStart + 50, rightYPos);
        doc.text(`${percentage.toFixed(1)} %`, rightColStart + 70, rightYPos);
        rightYPos += 5;
      });

    // Total row
    doc.setFont('helvetica', 'bold');
    doc.text('Totaal', rightColStart, rightYPos);
    doc.text(formatEuro(currentValue), rightColStart + 50, rightYPos);
    doc.text('100 %', rightColStart + 70, rightYPos);

    // New page for Portfolio overview
    doc.addPage();
    yPos = 15;

    // Header on new page
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text('Periode-overzicht beleggingsportefeuille', 15, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(40, 235, 207);
    doc.setFont('helvetica', 'bold');
    doc.text('PIGG', 15, yPos);

    // Add logo on second page too
    try {
      doc.addImage(logoImg, 'PNG', pageWidth - 35, 10, 20, 20);
    } catch (e) {
      console.log('Could not load logo:', e);
    }

    yPos += 10;

    // Portefeuille Section Header
    doc.setFillColor(220, 230, 240);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('Portefeuille', 17, yPos + 5);
    yPos += 10;

    doc.setFontSize(11);
    doc.text('Overzicht van de portefeuille', 17, yPos);
    yPos += 8;

    // Build portfolio table data grouped by category
    const portfolioByCategory = {};
    portfolio.forEach(etf => {
      const category = etf.categorie || 'Overig';
      if (!portfolioByCategory[category]) {
        portfolioByCategory[category] = [];
      }
      portfolioByCategory[category].push(etf);
    });

    // Process each category
    Object.entries(portfolioByCategory)
      .sort((a, b) => {
        // Sort categories by total weight
        const weightA = a[1].reduce((sum, etf) => sum + (etf.weight || 0), 0);
        const weightB = b[1].reduce((sum, etf) => sum + (etf.weight || 0), 0);
        return weightB - weightA;
      })
      .forEach(([category, etfs]) => {
        // Category header
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'italic');
        doc.text(category, 17, yPos);
        yPos += 6;

        // Table for this category
        const categoryData = etfs
          .filter(etf => (etf.weight || 0) > 0) // Filter out ETFs with 0 weight
          .map(etf => {
            const etfValue = (currentValue * (etf.weight || 0) / 100);

            // Get current price - from ytd field or calculate
            let currentPrice = 'N/A';
            if (etf.ytd) {
              // Parse ytd percentage
              const ytdStr = String(etf.ytd).replace('%', '').replace(',', '.');
              const ytdNum = parseFloat(ytdStr);
              if (!isNaN(ytdNum)) {
                // Assume a base price of 100 and calculate current
                currentPrice = (100 * (1 + ytdNum / 100)).toFixed(2);
              }
            }

            // Calculate number of shares (assuming price per share)
            const pricePerShare = currentPrice !== 'N/A' ? parseFloat(currentPrice) : 100;
            const numberOfShares = Math.round(etfValue / pricePerShare);

            // YTD return in euros
            const ytdReturnEuro = etfValue * (parseFloat(String(etf.ytd || '0').replace('%', '').replace(',', '.')) / 100);

            return [
              etf.naam || 'Onbekend',
              numberOfShares.toString(),
              currentPrice !== 'N/A' ? currentPrice : '-',
              formatEuro(etfValue),
              formatEuro(ytdReturnEuro)
            ];
          });

        if (categoryData.length > 0) {
          doc.autoTable({
            startY: yPos,
            head: [['Naam', 'Aantal', 'Koers', 'Waarde', 'Bruto resultaat YTD']],
            body: categoryData,
            theme: 'plain',
            headStyles: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
              fontStyle: 'normal',
              fontSize: 8,
              cellPadding: 2
            },
            bodyStyles: {
              textColor: [0, 0, 0],
              fontSize: 8,
              cellPadding: 2
            },
            columnStyles: {
              0: { cellWidth: 120 }, // Naam
              1: { cellWidth: 20, halign: 'right' },  // Aantal
              2: { cellWidth: 25, halign: 'right' },  // Koers
              3: { cellWidth: 35, halign: 'right' },  // Waarde
              4: { cellWidth: 40, halign: 'right' }   // YTD
            },
            margin: { left: 17, right: 15 },
            didDrawPage: function(data) {
              // Don't add header/footer here, we'll do it at the end
            }
          });

          yPos = doc.lastAutoTable.finalY + 2;

          // Total row for category
          const categoryTotal = etfs
            .filter(etf => (etf.weight || 0) > 0)
            .reduce((sum, etf) => sum + (currentValue * (etf.weight || 0) / 100), 0);

          const categoryYtdTotal = etfs
            .filter(etf => (etf.weight || 0) > 0)
            .reduce((sum, etf) => {
              const etfValue = (currentValue * (etf.weight || 0) / 100);
              const ytdReturnEuro = etfValue * (parseFloat(String(etf.ytd || '0').replace('%', '').replace(',', '.')) / 100);
              return sum + ytdReturnEuro;
            }, 0);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(`Totaal ${category}`, 17, yPos);
          doc.text(formatEuro(categoryTotal), 215, yPos, { align: 'right' });
          doc.text(formatEuro(categoryYtdTotal), 262, yPos, { align: 'right' });
          yPos += 8;
        }

        doc.setFont('helvetica', 'normal');
      });

    // Grand totals at bottom
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Bruto resultaat', 150, yPos);
    doc.text(formatEuro(totalReturn), 262, yPos, { align: 'right' });

    yPos += 6;
    doc.text('Portefeuillewaarde', 150, yPos);
    doc.text(formatEuro(currentValue), 262, yPos, { align: 'right' });

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Pagina ${i}/${totalPages}`,
        15,
        pageHeight - 10
      );
      doc.text(
        `Versie ${new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | PIGG`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Download the PDF
    const fileName = `Periode-overzicht_Beleggingsportefeuille_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('✅ PDF generated successfully:', fileName);

    setTimeout(() => {
      try {
        doc.save(fileName);
        console.log('✅ PDF download initiated!');
      } catch (saveError) {
        console.error('❌ Error during save:', saveError);
        alert('Download gefaald. Probeer het opnieuw of gebruik een andere browser.');
      }
    }, 100);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    alert('Er is een fout opgetreden bij het genereren van het rapport: ' + error.message);
  }
};
