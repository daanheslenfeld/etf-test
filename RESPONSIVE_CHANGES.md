# Responsive Design Changes

## Aangepaste Pagina's

### 1. LandingPage ✅
- Navigation buttons: `px-3 md:px-6` voor kleinere padding op mobiel
- Tekst "Open een rekening" verkorte tot "Registreer" op mobiel
- Grid van 2 kolommen naar 1 kolom op mobiel: `grid-cols-1 lg:grid-cols-2`
- Headings schaalbaar: `text-3xl md:text-5xl lg:text-6xl`
- Tekst gecentreerd op mobiel, links op desktop: `text-center lg:text-left`
- Full-width buttons op mobiel: `w-full md:w-auto`

## Belangrijkste Responsive Patterns Gebruikt

- **Breakpoints**: `md:` (768px+), `lg:` (1024px+)
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Text**: `text-sm md:text-base lg:text-xl`
- **Spacing**: `px-3 md:px-6`, `py-2 md:py-4`
- **Hidden/Show**: `hidden md:inline`, `md:hidden`

## Nog Te Doen voor Complete Mobile Support

1. Dashboard grafieken - kleinere height op mobiel
2. Tabellen - horizontal scroll op mobiel
3. Filter buttons - vertical stack op kleine schermen
4. Navigation - hamburger menu voor mobiel
