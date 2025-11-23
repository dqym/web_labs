# Figma Mockups Overview

The interface was planned with a desktop-first grid and responsive mobile variations. Use the following blueprint to recreate or refine the Figma file:

## Frames
1. **Desktop – Brokers** (1440×1024)
   - Left drawer width: 240px with navigation items (Brokers, Stocks, Market).
   - Content grid: broker form card (top) and brokers data table (full-width) with Material UI elevation 2.
2. **Desktop – Stocks** (1440×1024)
   - Two-column layout: stock checklist panel (420px) and history panel (remaining width) with Chart.js line graph + table.
3. **Desktop – Market** (1440×1024)
   - Settings form card (inputs in three columns) and ticker board card below with live price badges.
4. **Mobile – Combined** (390×844)
   - Collapsible app bar with hamburger menu, stacked cards, and bottom navigation shortcuts.

## Components
- App bar with title "Биржа брокера", login/logout button.
- Filled text fields, contained/outlined buttons, and switches using MUI default spacing (8pt grid).
- Token badges for ticker feed (Chip with success color). 

> **Note:** Create a new file in Figma named `Stock Exchange Simulator UI`. Reuse Material 3 color styles (#0057B7 primary, #00A676 secondary) and Auto Layout for cards. Attach exported PNGs or prototype links here once available.
