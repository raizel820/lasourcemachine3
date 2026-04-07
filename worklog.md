---
Task ID: 2-a
Agent: foundation-utils
Task: Create i18n translations, store, currency utils, types, helpers, constants

Work Log:
- Created src/lib/i18n.ts with comprehensive en/fr/ar translations covering: nav, hero, machines, services, projects, news, faq, about, contact, footer, cta, stats, admin, common
- Created src/lib/types.ts with TypeScript interfaces for all database models: Machine, Category, ProductionLine, NewsPost, Project, Service, Partner, FAQ, Lead, SiteSetting, Media
- Created src/lib/store.ts with Zustand persist middleware for locale/currency state with RTL support and document direction management
- Created src/lib/currency.ts with DZD/USD/EUR exchange rates, formatPrice with locale-aware formatting, convertPrice, and currency symbol/name helpers
- Created src/lib/helpers.ts with getLocalizedValue, getLocalizedArray, generateSlug, formatDate, truncateText, cn re-export, and Google Maps URL builders
- Created src/lib/constants.ts with company info, locale settings, currency settings, admin routes, pagination defaults, file upload limits, and SEO defaults

Stage Summary:
- All 6 foundation utility files created and lint-clean
- i18n covers all UI strings in 3 languages with real Arabic and French text
- Zustand store persists locale/currency in localStorage, manages RTL direction on <html>
- Type system covers all database models, filters, pagination, and form data
- Currency utils support DZD (base), USD, EUR with locale-appropriate formatting
- Helpers handle JSON translatable fields with fallback chain (requested → fr → en → ar)

---
## Task ID: 3
Agent: layout-components
Task: Create global layout components (Navbar, Footer, WhatsApp, etc.)

Work Log:
- Created src/components/shared/ThemeToggle.tsx – Sun/Moon toggle using next-themes useTheme, hydration-safe with useSyncExternalStore
- Created src/components/shared/LanguageSwitcher.tsx – Dropdown with flag emojis, uses Zustand store to set locale (EN/FR/AR)
- Created src/components/shared/CurrencySwitcher.tsx – Dropdown showing currency symbols, uses Zustand store to set currency (DZD/USD/EUR)
- Created src/components/shared/SectionHeader.tsx – Reusable section header with title, subtitle, blue underline accent, centered/left-aligned options
- Created src/components/shared/WhatsAppButton.tsx – Fixed floating button with pulse animation, links to company WhatsApp with pre-filled message, supports RTL positioning
- Created src/components/shared/RequestQuoteModal.tsx – Dialog form with Name/Email/Phone/Company/Message fields, POSTs to /api/contact, machine name pre-fill, sonner toast notifications
- Created src/components/layout/Navbar.tsx – Responsive navbar with: company logo/name, desktop nav links with "More" dropdown, language/currency/theme switchers, CTA button, top contact bar, sticky with backdrop blur, mobile Sheet menu with RTL support
- Created src/components/layout/Footer.tsx – 4-column footer: company info + social links, quick links, contact info, follow section; bottom copyright bar with year
- Wired all components into src/app/page.tsx with hero section, sample machine cards, and quote modal demo
- All lint errors resolved (useSyncExternalStore for hydration, Sheet key for route-change closing)

Stage Summary:
- All 8 global layout/shared components created and lint-clean
- Responsive design with mobile-first approach (Sheet for mobile nav, stacked footer columns)
- Full RTL support for Arabic locale (document direction, positioning, icon rotation)
- Lead capture modal integrated with form validation and API submission
- Navigation supports all 9 public routes with active link indicators
- Dev server compiles successfully with no errors

---
## Task ID: 10 - seed-data-creator
### Work Task
Create a comprehensive database seed file for the LA SOURCE MACHIEN Algerian industrial machinery company website, populating all models with realistic trilingual (EN/FR/AR) sample data.

### Work Summary
- Created `/home/z/my-project/prisma/seed.ts` with complete sample data for all 12 database models
- **Data seeded successfully** (verified with two consecutive runs for idempotency):
  - 1 Admin User (admin/admin123)
  - 5 Categories (CNC Machines, Press Machines, Lathes & Turning, Welding Equipment, Cutting & Shearing)
  - 12 Machines with full specs, descriptions (3 languages), images, prices in DZD, and 5 featured
  - 3 Production Lines with MachineProductionLine junction records linking machines
  - 4 News Posts with multi-paragraph content, excerpts, and published dates
  - 4 Projects with client info, location, and detailed content
  - 5 Services with Lucide icons and feature arrays (status: draft)
  - 6 Partners with logos and websites
  - 8 FAQs covering ordering, delivery, warranty, payment, installation, support, returns, spare parts
  - 10 Site Settings including company info, contact details, social links, working hours, and SEO meta
- All translatable fields stored as JSON strings with {en, fr, ar} keys
- Used `upsert` for models with unique fields (slug-based), `deleteMany + create` for models without unique fields (Service, Partner, FAQ)
- Lint passes cleanly with no errors

---
## Task ID: 8 - api-routes
### Work Task
Create all 18 API routes for the industrial machinery website covering machines, categories, production lines, news, projects, services, partners, FAQs, contact/leads, settings, upload, and auth.

### Work Summary
Created all 18 API route files using Next.js App Router route handlers:

**Public Routes:**
1. `GET /api/machines` - List machines with filters (category, type, search, featured, status), pagination, category relation
2. `GET /api/machines/[slug]` - Get single published machine with category and production lines
3. `GET /api/categories` - List all categories with machine counts
4. `GET /api/production-lines` - List published production lines with machines via junction table
5. `GET /api/production-lines/[slug]` - Get single published production line with machines
6. `GET /api/news` - List published news posts ordered by publishedAt desc
7. `GET /api/news/[slug]` - Get single published news post
8. `GET /api/projects` - List published projects
9. `GET /api/projects/[slug]` - Get single published project
10. `GET /api/services` - List all services
11. `GET /api/services/[id]` - Get single service by ID
12. `GET /api/partners` - List partners
13. `GET /api/faqs` - List FAQs
14. `POST /api/contact` - Submit contact form, creates Lead record

**Admin Routes (Bearer token auth):**
- `POST /api/machines`, `PUT /api/machines/[slug]`, `DELETE /api/machines/[slug]`
- `POST /api/production-lines`, `PUT /api/production-lines/[slug]`, `DELETE /api/production-lines/[slug]`
- `POST /api/news`, `PUT /api/news/[slug]`, `DELETE /api/news/[slug]`
- `POST /api/projects`, `PUT /api/projects/[slug]`, `DELETE /api/projects/[slug]`
- `POST /api/services`, `PUT /api/services/[id]`, `DELETE /api/services/[id]`
- `POST /api/partners`
- `GET /api/settings`, `PUT /api/settings`
- `GET /api/leads` (with pagination/status filter), `PUT /api/leads` (update status)
- `POST /api/upload` (placeholder returning file URL)
- `POST /api/auth` (admin login against AdminUser table)

**Key patterns:**
- Admin auth: `Authorization: Bearer admin-token` header check
- All routes use `import { db } from '@/lib/db'`
- Next.js 15 async params pattern: `{ params }: { params: Promise<{...}> }`
- Pagination: page/limit query params with total/pageTotal in response
- Proper error handling with try/catch and appropriate HTTP status codes
- Slug uniqueness checks on create/update
- Junction table cleanup on delete (machine-production lines)
- All lint checks pass cleanly

---
## Task ID: 9-b
Agent: admin-crud
Task: Build all admin CRUD pages (machines, news, projects, etc.)

Work Log:
- Created AdminMachinesPage.tsx with full CRUD: table view with image thumbnail, name, category, price, status, featured toggle, edit/delete actions; dialog form with language tabs (FR/EN/AR) for name, description, short description; category dropdown, machine type, capacity, price/currency, images (comma-separated URLs), cover image, featured switch, status select, order; search/filter; delete with AlertDialog confirmation
- Created AdminProductionLinesPage.tsx with similar multilingual form, machine checkbox selection, featured toggle, status/order
- Created AdminNewsPage.tsx with content editor, excerpt tabs, author field, published-at date picker, auto-slug from English title
- Created AdminProjectsPage.tsx with multilingual title/description/content, client, location, date, images, cover image, status
- Created AdminServicesPage.tsx with icon selector dropdown (42 Lucide icons), features (one per line per language), status/order
- Created AdminPartnersPage.tsx with logo preview, website link, order management
- Created AdminLeadsPage.tsx with status filter (all/new/contacted/qualified/closed), inline status change via Select, detail view dialog, status management
- Created AdminSettingsPage.tsx with sections: Company Information (name, description, phone, email, whatsapp, website, address), Social Media Links (Facebook, LinkedIn, Instagram, YouTube, Twitter), Working Hours, SEO & Meta (title, description, OG image), Integrations (Google Maps, Analytics, reCAPTCHA)
- Updated page.tsx router: replaced all AdminPlaceholder components with actual admin page components; removed Construction import
- All admin API calls include Authorization: Bearer admin-token header
- All pages use 'use client' directive, shadcn/ui components (Table, Dialog, AlertDialog, Tabs, Select, Badge, Switch, etc.), sonner toast notifications
- ESLint passes cleanly with no errors
- Dev server compiles successfully with Fast Refresh reload

Stage Summary:
- All 8 admin CRUD pages complete and functional
- Multilingual forms with FR/EN/AR language tabs throughout
- Full CRUD operations with API integration (create, read, update, delete)
- Table views with sorting, search, and status filtering
- Dialog-based forms with ScrollArea for long forms
- AlertDialog confirmations for destructive actions
- Consistent pattern: items[], loading, error, editItem, showForm state management
Task ID: 9-a
Agent: admin-foundation
Task: Build admin panel foundation (auth, layout, sidebar, dashboard)

Work Log:
- Updated src/lib/store.ts to add admin auth state: isAdmin, adminToken, setAdminAuth, persisted to localStorage
- Created src/components/admin/AdminSidebar.tsx – Collapsible shadcn Sidebar with 9 nav items (Dashboard, Machines, Production Lines, News, Projects, Services, Partners, Leads, Settings), Back to Website, and Logout buttons. Uses lucide-react icons. Active state highlighting. Icon-only compact mode.
- Created src/components/admin/AdminLayout.tsx – Layout wrapper using SidebarProvider/SidebarInset with top bar (breadcrumb + admin avatar), routes to AdminLogin when not authenticated
- Created src/components/admin/AdminLogin.tsx – Clean login form with username/password, show/hide password toggle, submits to POST /api/auth, calls setAdminAuth on success, toast notifications for errors, blue-themed centered card design
- Created src/components/pages/admin/AdminDashboardPage.tsx – Dashboard with 5 stat cards (Machines, Production Lines, News, Projects, Leads), recent leads table (last 5), and quick actions panel. Fetches from public API endpoints and /api/leads with auth token.
- Updated src/app/page.tsx to route all admin- prefixed pages through AdminLayout, with placeholder components for unimplemented admin sections
- Updated src/components/layout/Footer.tsx to add subtle "Admin" link in the footer bottom bar
- Lint passes cleanly with zero errors
- Dev server compiles successfully

Stage Summary:
- Admin panel foundation complete
- Login/auth flow working with /api/auth (credentials: admin/admin123)
- Collapsible sidebar navigation with all 9 admin sections
- Dashboard shows key metrics (machines, production lines, news, projects, leads counts) and recent leads table
- Admin auth state persisted to localStorage via Zustand store
- Placeholder pages for all admin sections not yet implemented

---
Task ID: 12
Agent: admin-routes
Task: Convert admin panel to real Next.js routes at /eurl/lasource

Work Log:
- Created /app/eurl/lasource/layout.tsx with no-index metadata (server component, no Navbar/Footer)
- Created /app/eurl/lasource/page.tsx (redirect to /eurl/lasource/dashboard)
- Created AdminAuthGuard component for auth checking (wraps children with AdminLayout when authenticated, shows AdminLogin otherwise)
- Created 9 route page files: dashboard, machines, production-lines, news, projects, services, partners, leads, settings
- Rewrote AdminSidebar to use next/link with asChild prop and usePathname for active state
- Rewrote AdminLayout to use usePathname for breadcrumbs (PATH_TITLES mapping instead of PAGE_TITLES)
- Updated AdminLogin to redirect to /eurl/lasource/dashboard after successful login via router.push
- Updated AdminDashboardPage to use router.push instead of setCurrentPage for all navigation (stat cards, quick actions, view all leads)
- Cleaned up page.tsx: removed all admin imports (AdminLayout, AdminDashboardPage, etc.), removed isAdminPage check, kept only public SPA routing
- Updated Footer admin link from setCurrentPage('admin') button to real <a href="/eurl/lasource"> tag
- Verified no other admin CRUD pages used setCurrentPage (only AdminDashboardPage did)
- Lint passes cleanly with zero errors
- Dev server compiles successfully

Stage Summary:
- Admin panel now accessible at /eurl/lasource/dashboard with real Next.js routes
- Each admin section has its own URL (e.g., /eurl/lasource/machines, /eurl/lasource/news)
- Uses real Next.js routing with Link components and usePathname for active state
- Auth guard protects all admin routes client-side via AdminAuthGuard component
- Public SPA at / is clean and separate with no admin-related code
- Login redirects to dashboard; logout redirects to home page

---
Task ID: 13
Agent: main-agent
Task: Fix all data persistence and live data issues across the website

Work Log:
- **Fixed useSiteSettings hook** — Rewrote with reactive subscriber pattern for cache invalidation. When admin saves settings, `invalidateSettingsCache()` increments a global version counter, notifies all subscriber callbacks, and each hook instance re-fetches automatically. WhatsApp button, Navbar, Footer, Contact page all update in real-time after settings change.
- **Fixed AdminNewsPage** — Changed validation from requiring English title to requiring at least ONE language title (EN, FR, or AR). Fixed slug generation to use first available title. Ensured empty language fields default to empty strings in JSON output instead of undefined.
- **Fixed HomePage** — Changed machines API URL from `isFeatured=true` to `featured=true` to match API parameter name. Replaced hardcoded stats `{15, 500, 200, 10}` with `site.stats` from `useSiteSettings()`. Replaced 6 fake machine placeholder cards, 5 fake service icons, 8 fake partner cards, and 3 fake news cards with proper trilingual empty state messages.
- **Fixed ServicesPage** — Removed `DEFAULT_SERVICES` hardcoded array (5 full service objects with trilingual content). Removed `displayServices` fallback pattern. Simplified rendering to always use API data format. Added proper empty state with trilingual "No services available" message.
- **Fixed FAQPage** — Removed `DEFAULT_FAQS` hardcoded array (6 full Q&A objects). Removed `displayFaqs` fallback pattern. Simplified rendering to always use API format. Added proper empty state with trilingual "No FAQs available" message.
- **Fixed NewsPage** — Replaced 3 fake news placeholder cards with proper empty state.
- **Fixed ProjectsPage** — Replaced 3 fake project placeholder cards with proper empty state.
- **Fixed ProductionLinesPage** — Replaced 3 fake production line placeholder cards with proper empty state.
- **Fixed AboutPage** — Imported `useSiteSettings` and replaced hardcoded stats `'15+'`, `'500+'`, `'200+'`, `'10+'` with `site.stats.years+`, `.machines+`, `.clients+`, `.countries+` from live settings.
- **Enhanced AdminSettingsPage** — Added Homepage Statistics section with 4 numeric fields: Years Experience, Machines Sold, Clients, Countries. Added default values (15, 500, 200, 10).

Stage Summary:
- All 8 bugs/issues fixed and verified with zero lint errors
- All public pages now exclusively use live data from API/database
- Zero hardcoded mock/placeholder data remaining in any public page
- Settings changes in admin propagate immediately to all components via reactive cache invalidation
- News creation now works with any language title (not just English)
- Admin can configure homepage stats from the settings page

---
Task ID: 14
Agent: main-agent
Task: Fix admin panel showing 0 machines (and similar status=all bugs across all API routes)

Work Log:
- **Root cause identified**: Admin pages send `?status=all` to API routes to fetch both draft and published items. But 4 API routes were NOT handling `status=all` as a special keyword — they treated it as a literal status value, returning 0 results since no item has status='all'.
- **Fixed Machines API** (`/api/machines/route.ts`): Changed `const where = { status }` to conditionally omit status filter when `status === 'all'`. This was the primary bug causing 0 machines in admin (13 machines exist but all had status != 'all').
- **Fixed Production Lines API** (`/api/production-lines/route.ts`): Was hardcoded to `const where = { status: 'published' }` with no query param support. Added `statusParam` from query with same `status=all` handling pattern.
- **Fixed Projects API** (`/api/projects/route.ts`): Same issue as production lines — hardcoded published-only. Added `statusParam` from query with `status=all` handling.
- **Fixed Services API** (`/api/services/route.ts`): Had NO status filtering at all (returned everything including drafts). Added `statusParam` from query defaulting to 'published', with `status=all` to skip filter. Also fixed AdminServicesPage to send `?status=all` in its fetch call.
- **Verified remaining APIs**: FAQs, Partners, Categories (no status field needed), Leads (correct optional filter), Contact (POST only), Settings (upsert pattern), Auth — all correct.
- **Verified WhatsApp button**: Uses `useSiteSettings()` hook which fetches from `/api/settings` with reactive cache invalidation. Admin settings save calls `invalidateSettingsCache()`. Working correctly.
- All 4 API fixes verified with curl tests returning correct counts (machines: 12, production-lines: 3, projects: 4, services: 5).

Stage Summary:
- Fixed 4 API routes with `status=all` filtering bugs (machines, production-lines, projects, services)
- Admin machines page now correctly shows all 12 machines instead of 0
- Admin production lines, projects, and services pages also fixed
- Public pages continue to show only published items (default status='published')
- Lint passes cleanly, dev server compiles successfully

---
Task ID: 15
Agent: main-agent
Task: Fix homepage not fetching data from admin panel settings

Work Log:
- **Root cause identified**: Two interconnected issues preventing homepage from using admin settings:
  1. **Settings key format mismatch**: The seed script stored data in JSON format (`company_description: {"en":"...","fr":"...","ar":"..."}`) but the `useSiteSettings` hook only read separate keys (`company_description_fr`, `company_description_en`, `company_description_ar`) which were all empty — so it always fell back to hardcoded COMPANY constants.
  2. **Homepage hero used i18n translations**: The hero section title and subtitle came from `getTranslations(locale)` (hardcoded i18n file) instead of from `useSiteSettings()` admin data.
- **Fixed `useSiteSettings` hook** (`src/hooks/use-site-settings.ts`):
  - Added `parseJsonLocale()` helper that tries to parse a string as JSON and extract the locale value, falling back to plain string
  - Updated `companyName(locale)` — Priority: separate locale key > JSON field > COMPANY constant
  - Updated `description(locale)` — same 3-tier fallback chain
  - Updated `workingHours(locale)` — same 3-tier fallback chain
  - Added `seoTitle(locale)` and `seoDescription(locale)` with same pattern + `seoOgImage` property
  - Added `contact_phone` and `contact_email` as fallback keys for phone/email
- **Fixed HomePage** (`src/components/pages/HomePage.tsx`):
  - Hero `<h1>` now uses `site.companyName(locale)` instead of `t.hero.title`
  - Hero `<p>` now uses `site.description(locale)` instead of `t.hero.subtitle`
  - Removed unused `COMPANY` import
- **Verified all other pages**: Navbar, Footer, AboutPage, ContactPage all already use `useSiteSettings()` correctly

Stage Summary:
- Homepage now displays company name, description, stats, and all contact info from admin panel settings
- Settings changes in admin propagate immediately to homepage via reactive cache invalidation
- JSON-format seed data (from initial seeding) now properly parsed as fallback when separate locale keys are empty
- Both old format (JSON fields) and new format (separate locale keys) are supported
- Lint passes cleanly, dev server compiles with no errors

---
Task ID: 16
Agent: main-agent
Task: Fix homepage statistics and settings not updating when changed from admin panel

Work Log:
- **Root cause identified**: Three interconnected bugs preventing live updates:
  1. **`useSiteSettings` hook had an overly aggressive stale cache** — The old hook used module-level `cachedSettings` + `fetchedVersion` refs with a 5-minute stale timeout. When navigating from admin to homepage, the effect checked `fetchedVersion.current === settingsVersion && cachedSettings` and SKIPPED fetching because the cache looked fresh — even though the admin had changed the DB.
  2. **`useCountUp` animation never re-ran** — `hasAnimated.current` was set to `true` on first render and never reset. When the stats target changed (from settings update), the displayed `count` stayed at the old animated value.
  3. **Admin settings input fallbacks overrode DB values** — `value={settings.stats_years || '15'}` showed the default `'15'` instead of the actual DB value when the field was empty/falsy.
- **Completely rewrote `useSiteSettings` hook** (`src/hooks/use-site-settings.ts`):
  - Removed the complex `fetchedVersion`/`cacheTimestamp`/`STALE_MS` logic
  - Simplified to: always fetch on mount, cache for same-session reuse, re-fetch on invalidation
  - Added `visibilitychange` event listener — when browser tab becomes visible, re-fetches from API (catches cross-tab admin saves)
  - `invalidateSettingsCache()` now clears cache + bumps version + notifies all subscribers → every mounted hook re-fetches
  - Parse JSON locale fields for backward compatibility with seed data
- **Fixed `useCountUp` animation** (`src/components/pages/HomePage.tsx`):
  - Used `key={`${i}-${stat.value}`}` on StatCounter to force component remount when value changes
  - When value changes, React unmounts old StatCounter and creates fresh one with count=0, hasAnimated=false
  - Animation plays from scratch with correct new target value
- **Fixed admin settings stat inputs** (`AdminSettingsPage.tsx`):
  - Changed `value={settings.stats_years || '15'}` to `value={settings.stats_years}` so actual DB values are shown
  - The `placeholder` attribute already provides the hint for empty fields

Stage Summary:
- Homepage now ALWAYS fetches fresh settings from the database on every page load
- Stats animation resets and re-plays when values change (via key-based remounting)
- Cross-tab updates work: saving in admin tab, then switching to homepage tab triggers re-fetch via visibilitychange
- Admin settings inputs show actual DB values, not hardcoded defaults
- Lint passes cleanly, dev server compiles with no errors
---
Task ID: 1
Agent: Main Agent
Task: Add image upload system and company branding section to admin panel, update all entities to support file upload

Work Log:
- Created real file upload API at `/api/upload` that saves files to `public/uploads/` with folder organization
- Created reusable `ImageUpload` component (single image with upload/URL toggle and preview)
- Created reusable `ImageGalleryUpload` component (multi-image grid with reorder, upload, URL add, delete)
- Updated Admin Settings page: added Company Branding section with logo, favicon uploads; OG image now uses ImageUpload
- Updated Admin Machines page: gallery images use ImageGalleryUpload, cover uses ImageUpload, added PDF upload support
- Updated Admin Production Lines page: gallery and cover images now use upload components
- Updated Admin News page: cover image and additional images now use upload components
- Updated Admin Partners page: logo now uses ImageUpload with preview
- Updated Admin Services page: added service image field with ImageUpload component
- Updated Admin Projects page: gallery and cover images now use upload components
- Updated `useSiteSettings` hook: added `companyLogo`, `companyFavicon`, `instagram`, `youtube`, `twitter` accessors
- Updated Navbar (desktop + mobile): renders uploaded company logo when available, falls back to Factory icon
- Updated Footer: renders uploaded company logo when available, falls back to Factory icon
- Upload API supports DELETE for cleanup, subfolder organization, file validation (size, type)

Stage Summary:
- Full image upload system operational with `public/uploads/` storage
- All 6 entity types (machines, production lines, news, projects, services, partners) now support file upload
- Admin settings now has a Company Branding section for logo, favicon, and OG image uploads
- Navbar and Footer dynamically render the uploaded company logo
- Lint passes clean, dev server compiles successfully
- No breaking changes to existing URL-based image fields (backward compatible)
---
Task ID: 2
Agent: Main Agent
Task: Fix machine detail page to show specifications and PDF catalog download button

Work Log:
- Investigated MachineDetailPage.tsx: specs parsing logic was already present (lines 93-108) but admin form never populated specs data
- Investigated AdminMachinesPage.tsx: specs field existed in MachineItem interface but was NOT in FormData, not rendered in form, and not sent in handleSubmit
- Added specs editor to admin machine form with full FR/EN/AR key translations and value fields
- Added addSpec/removeSpec/updateSpec handlers for dynamic spec row management
- Created parseSpecs() function to parse both nested locale format {en:[{key,value}],...} and flat [{key,value}] formats
- Created buildSpecs() function to output specs in nested locale format for the detail page parser
- Added specs field to FormData interface and emptyForm defaults
- Added specs to handleSubmit body so it's saved to the API
- Added pdfUrl parsing when opening edit form (was already saving, just needed loading)
- Added PDF Catalog Download button to MachineDetailPage with FileDown icon and localized label (t.machines.downloadSpec)
- Button only shows when machine.pdfUrl is set
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Admin machines form now has a Specifications section with dynamic key-value pairs
- Each spec supports multilingual keys (EN/FR/AR) and a shared value
- Machine detail page now shows specs when available (pre-existing parser handles them)
- Machine detail page now shows a PDF Catalog Download button when pdfUrl is set
- Both issues resolved: specs display + PDF download button
---
Task ID: 3
Agent: Main Agent
Task: Add machine type, category, and capacity display to machine detail page

Work Log:
- Identified that `machineType`, `capacity`, and `category` fields exist in Prisma schema and are saved by admin form but were NOT rendered on the public machine detail page
- Category was shown as a small badge but machine type and capacity were completely absent
- Added i18n translations for `machineType`, `capacity`, `category`, `downloadCatalog`, and `noSpecs` in EN/FR/AR
- Updated MachineDetailPage.tsx with a new "Quick Info" section showing 3 info cards:
  - Machine Type (with Settings2 icon)
  - Capacity (with Gauge icon)
  - Category (with Tag icon)
- Quick info cards only render when the field has a value (conditional rendering)
- Each card has an icon, label, and value in a compact horizontal layout with primary color accent
- Enhanced PDF download button with larger size, ExternalLink icon, and "Download Catalog" translation
- Added "No specifications available" fallback message when specs array is empty
- Kept existing category badge at the top (quick info section provides more prominent display below)
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Machine detail page now prominently displays machine type, capacity, and category in a dedicated info section
- Each field shown in a styled card with icon and localized label
- PDF catalog download button enhanced with better styling and icon
- Specs section shows proper empty state message when no specs are configured
- All new translations added in EN, FR, and AR
---
Task ID: 4
Agent: Main Agent
Task: Build admin Categories CRUD page (add, edit, delete)

Work Log:
- Root cause: Categories had NO admin management at all — no admin page, no sidebar entry, no POST/PUT/DELETE API endpoints
- Added POST handler to `/api/categories/route.ts` for creating categories (admin auth, slug uniqueness check)
- Created `/api/categories/[id]/route.ts` with PUT (update) and DELETE handlers
- DELETE safely unlinks machines from category before deleting (sets categoryId to null)
- PUT checks slug uniqueness when slug changes
- Created `AdminCategoriesPage.tsx` component with full CRUD:
  - Table view with icon, multilingual name (FR+EN), slug badge, machine count, order, edit/delete actions
  - Search/filter input
  - Dialog form with FR/EN/AR language tabs for name, slug (auto-generated from English name), order, icon field
  - Delete confirmation with warning when machines are linked
- Created `/eurl/lasource/categories/page.tsx` route with AdminAuthGuard
- Added "Categories" nav item to AdminSidebar with Tag icon, positioned between Machines and Production Lines
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Full category management now available at /eurl/lasource/categories
- Categories CRUD: Create, Read, Update, Delete all functional
- Multilingual category names (FR/EN/AR) in admin form
- Machine count displayed per category
- Safe deletion with machine unlinking
- Slug auto-generation from English name on create
---
Task ID: 5
Agent: Main Agent
Task: Make exchange rates configurable from admin settings

Work Log:
- Rewrote `currency.ts` — replaced hardcoded `EXCHANGE_RATES` const with a mutable `currentRates` module variable
- Added `setExchangeRates(rates)` function to update rates at runtime
- Added `getExchangeRates()` function to read current rates (for display)
- Default rates still hardcoded as fallback: DZD=1, USD=0.0074, EUR=0.0068
- Updated `useSiteSettings` hook with `syncRates()` helper that reads `exchange_rate_usd` and `exchange_rate_eur` from settings data and calls `setExchangeRates()`
- Rates are synced in 3 places: initial fetch, cache-hit path, and tab visibility change
- Added "Currency & Exchange Rates" section to AdminSettingsPage with:
  - USD rate input (1 DZD = ? USD) with step 0.0001
  - EUR rate input (1 DZD = ? EUR) with step 0.0001
  - Live preview showing inverse calculation (e.g., "1 USD ≈ 135 DZD")
  - Explanatory text for admins
- Added default values to DEFAULT_SETTINGS: exchange_rate_usd='0.0074', exchange_rate_eur='0.0068'
- No changes needed in consumer components (MachineDetailPage, MachinesPage, HomePage) — they already use convertPrice/formatPrice which now reads from the live module variable
- Lint passes clean, dev server compiles successfully

Stage Summary:
- Exchange rates now configurable from admin panel Settings page
- Rates are stored in the database as site settings (exchange_rate_usd, exchange_rate_eur)
- All price conversions across the site automatically use the admin-configured rates
- Rates update in real-time after admin saves (via cache invalidation + re-fetch)
- Helpful UI shows the inverse rate (e.g., how many DZD per USD/EUR)
---
Task ID: 6
Agent: Main Agent
Task: Delete uploaded image/PDF files from disk when entities are deleted or images replaced

Work Log:
- Created `src/lib/file-cleanup.ts` utility with two functions:
  - `deleteUploadedFiles(urls)` — Accepts array of URLs (strings, null, or JSON arrays). Only deletes files under `/uploads/` (ignores external URLs). Handles JSON array parsing for gallery images. Silently catches errors so DB operations are never blocked.
  - `parseImageUrls(jsonStr)` — Helper to extract URLs from JSON array strings
- Updated DELETE handlers to delete files before removing DB records:
  - Machines: deletes gallery images (JSON array), cover image, PDF catalog
  - Production Lines: deletes gallery images, cover image
  - News: deletes cover image, gallery images
  - Projects: deletes cover image, gallery images
  - Services: deletes service image
  - Partners: added DELETE handler (was missing!), deletes logo
- Updated PUT handlers to delete old files when images are replaced:
  - Machines: cleans up old images, cover, PDF when they change
  - Production Lines: cleans up old images, cover
  - News: cleans up old cover, gallery images
  - Projects: cleans up old cover, gallery images
  - Services: cleans up old service image
  - Old files deleted in background (.catch(() => {})) to not block API response
- Updated Settings API: when company_logo, company_favicon, or seo_og_image change value, the old file is automatically deleted
- Lint passes clean, dev server compiles successfully

Stage Summary:
- All 6 entity types (machines, production lines, news, projects, services, partners) now clean up files on DELETE
- All 6 entity types now clean up old files when images are REPLACED via PUT
- Admin settings logo/favicon/OG image replacement also cleans up old files
- External URLs (not starting with /uploads/) are never touched — only self-hosted uploads are deleted
- File deletion errors are silently caught to prevent blocking database operations
---
Task ID: 7
Agent: main-agent
Task: Fix cover image not being used on machines, production lines, projects, services pages; verify image deletion on entity delete

Work Log:
- Verified all DELETE API routes already call `deleteUploadedFiles()` from `@/lib/file-cleanup` for cleanup
- Verified settings API already handles old logo/favicon/ogImage cleanup on replacement
- Confirmed `file-cleanup.ts` properly handles JSON arrays and single URLs
- Identified root cause: Frontend pages ignored `coverImage` field and only used `images[0]` from gallery
- Added `getEntityCoverImage()` helper to `src/lib/helpers.ts` — priority: coverImage > image > images[0] > null
- Added `getEntityGallery()` helper to `src/lib/helpers.ts` — merges coverImage with gallery images, deduped
- Updated MachinesPage.tsx — uses `getEntityCoverImage()` for card thumbnails
- Updated MachineDetailPage.tsx — uses `getEntityGallery()` for main gallery (coverImage first), related machines use cover
- Updated ProductionLinesPage.tsx — uses `getEntityCoverImage()` for card thumbnails
- Updated ProductionLineDetailPage.tsx — uses `getEntityCoverImage()` for cover display, `getEntityGallery()` for included machines
- Updated ProjectsPage.tsx — uses `getEntityCoverImage()` for card thumbnails
- Updated ProjectDetailPage.tsx — uses `getEntityCoverImage()` for hero, `getEntityGallery()` for gallery grid, related projects use cover
- Updated ServicesPage.tsx — shows service.image when available, falls back to static icon
- Updated HomePage.tsx — featured machines now use `getEntityCoverImage()`
- Fixed JSX nesting issues in MachinesPage, ProductionLinesPage, ProjectsPage (Badge placement)
- Lint passes clean

Stage Summary:
- Cover images now properly display across all entity pages (machines, production lines, news, projects, services)
- Image deletion on entity delete was already implemented and verified working
- Settings logo/favicon/ogImage cleanup on replacement was already implemented and verified
- New utility functions `getEntityCoverImage()` and `getEntityGallery()` available for reuse
---
Task ID: 8
Agent: main-agent
Task: Add Gallery section to admin panel to manage all uploaded images

Work Log:
- Created `/api/gallery` API route with GET (list files), POST (upload), DELETE (delete) handlers
  - GET scans `public/uploads/` directories recursively, returns file metadata (url, size, type, folder, date)
  - Supports query params: folder, type, search filtering
  - Returns stats: total files, images, documents, total size
  - POST handles multi-file upload with folder selection
  - DELETE supports bulk deletion by URL array
- Created admin Gallery page at `/eurl/lasource/gallery/`
  - Grid view with thumbnails and hover actions (preview, copy URL, delete)
  - List view with sortable columns (file, folder, type, size, date)
  - Stats dashboard (total files, images, documents, total size)
  - Filter by folder, file type, and search query
  - Multi-select mode with select all, bulk delete
  - Image preview dialog with URL copy and delete
  - Delete confirmation dialog
  - Direct file upload with folder selection
  - Pagination (24 items per page)
  - Toggle between grid and list views (floating button)
  - Follows admin page pattern (AdminAuthGuard wrapper)
- Added Gallery entry to AdminSidebar with Image icon (between Partners and Leads)

Stage Summary:
- Full gallery management system built at `/eurl/lasource/gallery`
- API endpoint at `/api/gallery` handles listing, uploading, and deleting files
- All uploaded files across all folders visible and manageable from one place
- Supports multi-file operations (select, bulk delete, multi-upload)
---
Task ID: 9
Agent: main-agent
Task: Fix logo to circular shape + make gallery show all images from all entities

Work Log:
- Changed company logo from rounded-lg (square) to rounded-full (circle) in 3 locations:
  - Navbar desktop: h-10 w-10 rounded-full with p-1 for padding
  - Navbar mobile sheet: h-9 w-9 rounded-full with p-0.5
  - Footer: h-10 w-10 rounded-full with p-1 and hover scale
- Fallback icon containers also changed to rounded-full
- Completely rewrote /api/gallery API to collect images from ALL sources:
  - Disk scan of public/uploads/ (existing behavior)
  - Machine: coverImage + images[] + pdfUrl
  - ProductionLine: coverImage + images[]
  - NewsPost: coverImage + images[]
  - Project: coverImage + images[]
  - Service: image
  - Partner: logo
  - SiteSetting: company_logo, company_favicon, seo_og_image
- Each gallery item now has: source, sourceLabel, isExternal fields
- API returns sources list, sourceCounts in stats
- Sort: disk files first (by date desc), then DB entities (alphabetical)
- Deduplication: same URL won't appear twice even if referenced by multiple entities
- Updated Gallery UI with:
  - Source filter dropdown (All Sources, Machines, Production Lines, News, etc.)
  - Color-coded source badges on each card
  - External URL indicator badge (yellow Globe icon)
  - Source label shown under filename
  - Source column in list view instead of folder
  - Delete disabled for external URLs (only local /uploads/ files deletable)
  - Preview shows source badge and external indicator

Stage Summary:
- Company logo is now circular across navbar, mobile menu, and footer
- Gallery shows ALL images from every entity type + uploaded files + settings logos
- Source filtering allows viewing images per entity type
- External URLs clearly marked and protected from accidental deletion
