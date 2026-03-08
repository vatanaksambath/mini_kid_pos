export interface ChangelogEntry {
  version: string
  date: string
  label?: 'new' | 'fix' | 'improvement'
  changes: { type: 'new' | 'fix' | 'improvement'; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.6.0',
    date: '2026-03-08',
    changes: [
      { type: 'new',         text: 'Changelog panel added to profile dropdown with expandable version history' },
      { type: 'new',         text: 'Receipt settings: QR and Logo images now have full-size preview lightbox' },
      { type: 'improvement', text: 'Product variant settings (categories, sizes, colors, etc.) now cached in memory — modal opens instantly after first load' },
      { type: 'fix',         text: 'Moved themeColor from metadata to viewport export (Next.js 14+ compliance)' },
      { type: 'fix',         text: 'Fixed missing DialogTitle/aria-describedby accessibility warnings on lightbox dialogs' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-03-08',
    changes: [
      { type: 'improvement', text: 'Stock date column in inventory table now displays in dd-mm-yyyy format' },
      { type: 'fix',         text: 'Product edit/clone modal: variant dropdowns no longer flash empty before settings load (skeleton loader added)' },
      { type: 'new',         text: 'Dashboard refresh button added — manually re-fetches all stats with spinning animation' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-03-05',
    changes: [
      { type: 'improvement', text: 'Inventory images now fade in individually on load (skeleton placeholders, async decoding)' },
      { type: 'fix',         text: 'Color variant dropdown default fixed to "None" using Radix sentinel pattern' },
      { type: 'fix',         text: 'POS current sale table height constrained to viewport, no longer overflows' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-03-04',
    changes: [
      { type: 'fix',         text: 'Clone icon now visible in inventory table action column' },
      { type: 'improvement', text: 'Color column in variant table defaults to "None" instead of black (#000000)' },
      { type: 'fix',         text: 'Navigation menu lag between views resolved' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-03-01',
    changes: [
      { type: 'fix',         text: 'Transaction datetimes now display in local timezone (Supabase UTC timestamps correctly parsed)' },
      { type: 'improvement', text: 'Receipt generation uses local time for date/time display' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-27',
    changes: [
      { type: 'new',         text: 'Product images stored in Supabase Storage instead of base64 database columns' },
      { type: 'improvement', text: 'Image upload resizes and compresses before storage' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-23',
    changes: [
      { type: 'new', text: 'Initial release — POS, Inventory, Customers, Transactions, Reports, Settings' },
      { type: 'new', text: 'Dark/Light mode with next-themes' },
      { type: 'new', text: 'JWT authentication with HttpOnly cookies' },
      { type: 'new', text: 'Matrix inventory: product variants by size & color with per-store stock levels' },
      { type: 'new', text: 'QR/barcode scanning for POS checkout' },
      { type: 'new', text: 'Loyalty points & CRM customer module' },
      { type: 'new', text: 'Receipt printing with customizable template' },
    ],
  },
]
