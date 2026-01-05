# Combined ETF Project

This project combines the **ETF Test Portal** with the **Income/Wealth Preservation Calculator** into one unified application.

## What's New

### Income Calculator Integration
A comprehensive income and wealth preservation calculator has been added to the ETF portal. This calculator helps users:
- Calculate retirement income based on savings and investments
- Perform reverse calculations to determine required savings
- Factor in AOW (Dutch state pension) amounts
- Upload and parse pension data from Mijnpensioenoverzicht.nl
- Export reports as PDF

### How to Access

1. Log into the application
2. From the Main Dashboard, click on **"Inkomen Calculator"** (bottom right button)
3. Follow the step-by-step wizard to calculate your wealth preservation strategy

## Project Structure

```
combined-etf-project/
├── src/
│   ├── App.js                      # Main application with navigation
│   ├── IncomeCalculator.js         # Income calculator component (NEW)
│   ├── IncomeCalculator.css        # Income calculator styles (NEW)
│   ├── Chat.js                     # Chat functionality
│   ├── Footer.js                   # Footer component
│   └── utils/
│       └── pdfGenerator.js         # PDF generation utilities
├── api/                            # API endpoints
├── public/                         # Public assets
└── package.json                    # Dependencies
```

## New Dependencies

The following packages were added to support the Income Calculator:

- **html2pdf.js** (v0.10.1) - For exporting dashboard to PDF
- **pdfjs-dist** (v3.11.174) - For parsing uploaded pension PDF files

## Features

### ETF Portal (Original)
- ETF database and comparison
- Portfolio builder
- Pre-configured portfolios
- Customer database
- Real-time ETF price updates

### Income Calculator (New)
- **Personal Information**: Birth date, AOW age calculation
- **Build-up Period**: Savings and investment calculations
- **Withdrawal Period**: Income drawdown calculations
- **Reverse Calculation Mode**: Calculate required savings to meet income goals
- **Partner Support**: Joint calculations with partner information
- **Pension Data Upload**: Parse PDF files from Mijnpensioenoverzicht.nl
- **Investment Profiles**: 6 profiles from conservative to aggressive
- **PDF Export**: Download comprehensive reports

## Installation

```bash
cd C:\Users\Daan\Desktop\combined-etf-project
npm install
```

## Running the Application

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Environment Variables

Make sure to copy `.env.example` to `.env` and configure:
- Supabase credentials
- Email settings (for nodemailer)
- Other API keys as needed

## Testing

```bash
npm test
```

## Technology Stack

- **React** 19.1.1
- **Tailwind CSS** 4.1.13
- **Recharts** 3.2.1 - For data visualization
- **Supabase** 2.58.0 - For authentication and database
- **jsPDF** 3.0.3 - For PDF generation
- **html2pdf.js** 0.10.1 - For HTML to PDF conversion
- **pdfjs-dist** 3.11.174 - For PDF parsing

## Navigation Flow

```
Login → Main Dashboard → Choose:
  ├── ETF Database
  ├── Zelf Samenstellen (Build Your Own)
  ├── Vooraf Samengesteld (Pre-configured)
  └── Inkomen Calculator (NEW)
```

## Notes

- The Income Calculator is fully integrated into the existing authentication flow
- All user data is preserved from the original ETF portal
- The calculator uses the same design system (Tailwind CSS) for consistency
- PDF export requires the user to have a modern browser with print support

## Support

For issues or questions about this combined project, refer to the original project documentation or contact the development team.

## Version

- ETF Portal: v0.1.0
- Income Calculator: Integrated v0.1.0
- Combined Project: v0.1.0

---

**Created:** November 10, 2025
**Integration:** Claude Code Assistant
