# Investment Portal Style Guide

A modern, calm, and professional design system for fintech / broker-grade applications.

---

## 1. Color System

### Primary Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Primary** | `#28EBCF` | `text-[#28EBCF]` | CTAs, active states, highlights |
| **Primary Hover** | `#20D4B8` | `text-[#20D4B8]` | Hover states |
| **Primary Muted** | `#28EBCF/10` | `bg-[#28EBCF]/10` | Subtle backgrounds |
| **Primary Border** | `#28EBCF/20` | `border-[#28EBCF]/20` | Active borders |

### Background Colors (Dark Mode)
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Base** | `#0D0E10` | `bg-[#0D0E10]` | Page background |
| **Surface** | `#1A1B1F` | `bg-[#1A1B1F]` | Cards, panels |
| **Surface Elevated** | `#22242A` | `bg-[#22242A]` | Modals, dropdowns |
| **Surface Hover** | `#2A2D35` | `bg-gray-800/50` | Hover states |

### Neutral Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Text Primary** | `#FFFFFF` | `text-white` | Headlines, important text |
| **Text Secondary** | `#9CA3AF` | `text-gray-400` | Body text, descriptions |
| **Text Muted** | `#6B7280` | `text-gray-500` | Labels, placeholders |
| **Text Disabled** | `#4B5563` | `text-gray-600` | Disabled states |

### Border Colors
| Name | Tailwind | Usage |
|------|----------|-------|
| **Default** | `border-gray-800/50` | Card borders |
| **Subtle** | `border-gray-700/30` | Dividers, table rows |
| **Hover** | `border-gray-600` | Interactive hover |
| **Active** | `border-[#28EBCF]/30` | Selected items |

### Semantic Colors
| State | Color | Background | Border |
|-------|-------|------------|--------|
| **Success** | `#10B981` | `bg-emerald-500/10` | `border-emerald-500/30` |
| **Warning** | `#F59E0B` | `bg-amber-500/10` | `border-amber-500/30` |
| **Error** | `#EF4444` | `bg-red-500/10` | `border-red-500/30` |
| **Info** | `#3B82F6` | `bg-blue-500/10` | `border-blue-500/30` |

### Category Colors (ETF Types)
| Category | Color | Gradient |
|----------|-------|----------|
| Equity | `#28EBCF` | `from-emerald-500/20 to-teal-500/10` |
| Bonds | `#60A5FA` | `from-blue-500/20 to-indigo-500/10` |
| Commodities | `#FBBF24` | `from-amber-500/20 to-yellow-500/10` |
| Real Estate | `#F472B6` | `from-pink-500/20 to-rose-500/10` |
| Money Market | `#A78BFA` | `from-violet-500/20 to-purple-500/10` |
| Crypto | `#FB923C` | `from-orange-500/20 to-amber-500/10` |

---

## 2. Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-family: 'JetBrains Mono', 'Fira Code', monospace; /* for numbers/code */
```

### Type Scale
| Element | Size | Weight | Tailwind |
|---------|------|--------|----------|
| **Page Title** | 24px | 600 | `text-2xl font-semibold` |
| **Section Header** | 18-20px | 600 | `text-lg font-semibold` or `text-xl font-semibold` |
| **Card Title** | 16px | 500 | `text-base font-medium` |
| **Body** | 14px | 400 | `text-sm` |
| **Small / Meta** | 12px | 400 | `text-xs` |
| **Tiny / Labels** | 10-11px | 500 | `text-[11px] font-medium` |

### Text Styles
```jsx
// Page title
<h1 className="text-2xl font-semibold text-white tracking-tight">

// Section header
<h2 className="text-lg font-semibold text-white">

// Card title with icon
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 text-[#28EBCF]" />
  <h3 className="text-base font-medium text-white">

// Body text
<p className="text-sm text-gray-400">

// Label (uppercase)
<label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">

// Monospace numbers (financial data)
<span className="font-mono text-sm tabular-nums">
```

### Number Formatting
- Always use `tabular-nums` for aligned columns
- Use `font-mono` for prices, percentages, ISINs
- Right-align numeric columns in tables

---

## 3. Spacing & Layout

### Spacing Scale
| Name | Size | Tailwind | Usage |
|------|------|----------|-------|
| **xs** | 4px | `p-1`, `gap-1` | Icon padding, tight gaps |
| **sm** | 8px | `p-2`, `gap-2` | Chip padding, small gaps |
| **md** | 12-16px | `p-3`, `p-4`, `gap-3` | Default component padding |
| **lg** | 20-24px | `p-5`, `p-6`, `gap-5` | Card padding, section gaps |
| **xl** | 32px | `p-8`, `gap-8` | Page margins, large sections |

### Card Padding Rules
```jsx
// Standard card
<div className="p-5">  // 20px all around

// Compact card
<div className="p-4">  // 16px all around

// Card with header
<div className="border border-gray-800/50 rounded-xl">
  <div className="p-5 border-b border-gray-800/50">  // Header
  <div className="p-5">  // Body
</div>
```

### Section Margins
```jsx
// Between major sections
<div className="space-y-6">  // 24px gap

// Between cards
<div className="space-y-4">  // 16px gap

// Inside cards (between elements)
<div className="space-y-3">  // 12px gap
```

### Grid Layouts
```jsx
// Dashboard cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Filter dropdowns
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

// Category tabs (7 items)
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
```

---

## 4. Component Styles

### Cards
```jsx
// Standard card
<div className="bg-[#1A1B1F] border border-gray-800/50 rounded-xl">

// Elevated card (with gradient)
<div className="bg-gradient-to-br from-[#1A1B1F] to-[#16171B] border border-gray-800/50 rounded-2xl shadow-2xl">

// Interactive card
<div className="bg-[#1A1B1F] border border-gray-800/50 rounded-xl hover:border-gray-700 transition-colors">

// Active/selected card
<div className="bg-gradient-to-br from-[#28EBCF]/10 to-[#28EBCF]/5 border-2 border-[#28EBCF]/30 rounded-xl">
```

### Buttons

#### Primary Button
```jsx
<button className="px-4 py-2.5 bg-gradient-to-r from-[#28EBCF] to-[#20D4B8] text-gray-900 font-medium rounded-xl hover:shadow-lg hover:shadow-[#28EBCF]/20 transition-all">
```

#### Secondary Button
```jsx
<button className="px-4 py-2.5 bg-gray-800/60 text-gray-300 font-medium rounded-xl border border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600 transition-all">
```

#### Ghost Button
```jsx
<button className="px-4 py-2.5 text-gray-400 font-medium rounded-xl hover:text-white hover:bg-gray-800/50 transition-colors">
```

#### Disabled State
```jsx
<button className="px-4 py-2.5 bg-gray-800/30 text-gray-600 font-medium rounded-xl cursor-not-allowed" disabled>
```

#### Icon Button
```jsx
<button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
  <Icon className="w-4 h-4" />
</button>
```

### Input Fields
```jsx
// Text input
<input className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#28EBCF]/40 focus:ring-2 focus:ring-[#28EBCF]/10 transition-all" />

// With icon
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
  <input className="w-full pl-12 pr-4 py-3 ..." />
</div>
```

### Dropdown Select
```jsx
// Trigger button
<button className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border bg-gray-900/40 border-gray-700/50 text-gray-300 hover:border-gray-600 transition-all">
  <span>{value}</span>
  <ChevronDown className="w-4 h-4 text-gray-500" />
</button>

// Dropdown menu
<div className="absolute z-50 mt-1.5 w-full bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
  <button className="w-full px-4 py-2.5 text-sm text-left text-gray-300 hover:bg-gray-800/50">
```

### Tables
```jsx
// Table container
<div className="overflow-x-auto">
  <table className="w-full">

// Header
<thead className="bg-gray-800/50 sticky top-0">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">

// Body
<tbody className="divide-y divide-gray-800/30">
  <tr className="hover:bg-gray-800/30 transition-colors">
    <td className="px-6 py-4 text-sm text-white">

// Number column (right-aligned)
<td className="px-6 py-4 text-right font-mono text-sm tabular-nums text-white">
```

### Chips / Tags
```jsx
// Filter chip (removable)
<span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30">
  <span className="text-gray-400">Label:</span>
  Value
  <button className="p-0.5 hover:bg-white/10 rounded">
    <X className="w-3 h-3" />
  </button>
</span>

// Status badge
<span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
  Active
</span>

// Count badge
<span className="px-2 py-0.5 bg-[#28EBCF]/10 text-[#28EBCF] text-xs rounded-full font-medium">
  24
</span>
```

### Tooltips
```jsx
<div className="absolute z-50 px-3 py-2 bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl text-sm text-white">
```

---

## 5. Dark Mode Guidelines

### Do's
- Use `#0D0E10` or `#111214` for page background (not pure black)
- Use `#1A1B1F` for elevated surfaces
- Maintain 4.5:1 contrast ratio for text
- Use subtle gradients for depth
- Keep shadows soft with low opacity

### Don'ts
- Avoid pure black (`#000000`)
- Avoid pure white text on dark backgrounds (use `#F9FAFB` max)
- Avoid high-contrast borders
- Avoid saturated colors at full brightness

### Contrast Examples
```jsx
// Good - soft contrast
<div className="bg-[#1A1B1F] border-gray-800/50">
  <p className="text-gray-400">Secondary text</p>
</div>

// Bad - harsh contrast
<div className="bg-black border-white">
  <p className="text-white">Too bright</p>
</div>
```

---

## 6. Animation & Transitions

### Standard Transitions
```jsx
// Color transitions
className="transition-colors"  // 150ms default

// All properties
className="transition-all duration-200"

// Smooth transforms
className="transition-transform duration-300"
```

### Hover Effects
```jsx
// Subtle scale
className="hover:scale-[1.02] transition-transform"

// Opacity fade
className="opacity-70 group-hover:opacity-100 transition-opacity"

// Background shift
className="hover:bg-gray-800/50 transition-colors"
```

### Loading States
```jsx
// Pulse animation
className="animate-pulse"

// Spin (for loaders)
className="animate-spin"

// Custom pulse dot
<span className="w-2 h-2 rounded-full bg-[#28EBCF] animate-pulse" />
```

---

## 7. Iconography

### Icon Sizes
| Context | Size | Tailwind |
|---------|------|----------|
| Inline with text | 16px | `w-4 h-4` |
| Button icon | 16-18px | `w-4 h-4` or `w-[18px] h-[18px]` |
| Card header | 20px | `w-5 h-5` |
| Empty state | 32-48px | `w-8 h-8` or `w-12 h-12` |

### Icon Library
Use **Lucide React** for consistency:
```jsx
import { TrendingUp, Search, Settings, ChevronDown } from 'lucide-react';
```

### Icon Colors
```jsx
// Primary accent
<Icon className="text-[#28EBCF]" />

// Muted
<Icon className="text-gray-400" />

// Interactive
<Icon className="text-gray-400 hover:text-white transition-colors" />
```

---

## 8. Quick Reference

### CSS Custom Properties (Optional)
```css
:root {
  --color-primary: #28EBCF;
  --color-primary-hover: #20D4B8;
  --color-bg-base: #0D0E10;
  --color-bg-surface: #1A1B1F;
  --color-bg-elevated: #22242A;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;
  --color-border-default: rgba(31, 41, 55, 0.5);
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.25rem;
}
```

### Common Patterns
```jsx
// Card with header
<div className="bg-[#1A1B1F] border border-gray-800/50 rounded-xl overflow-hidden">
  <div className="p-5 border-b border-gray-800/50">
    <h3 className="text-lg font-semibold text-white">Title</h3>
  </div>
  <div className="p-5">
    {/* Content */}
  </div>
</div>

// Section with title
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-white">Section Title</h2>
    <button className="text-sm text-[#28EBCF] hover:underline">View all</button>
  </div>
  {/* Cards */}
</div>

// Empty state
<div className="p-12 text-center">
  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-2xl mb-4">
    <Icon className="w-8 h-8 text-gray-600" />
  </div>
  <p className="text-gray-400 text-lg font-medium mb-2">No items found</p>
  <p className="text-gray-600 text-sm">Try adjusting your filters</p>
</div>
```

---

## 9. Checklist

When building new components, verify:

- [ ] Using correct background color (`#1A1B1F` for cards)
- [ ] Border opacity is subtle (`border-gray-800/50`)
- [ ] Border radius is consistent (`rounded-xl` for cards)
- [ ] Text hierarchy is clear (white > gray-400 > gray-500)
- [ ] Numbers use `font-mono tabular-nums`
- [ ] Interactive elements have hover states
- [ ] Transitions are smooth (`transition-colors` or `transition-all`)
- [ ] Spacing follows the scale (no arbitrary values)
- [ ] Icons are from Lucide and sized correctly
- [ ] Focus states are visible for accessibility
