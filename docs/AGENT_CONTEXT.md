# Liberty Cargo Movers — Build Conventions & API Surface

You are building a **feature module** for a Next.js 14 (App Router) + TypeScript + Tailwind + Firebase/Firestore logistics platform. The cross-cutting foundation already exists. **Reuse it — do not reinvent.** Read this fully before writing code.

## Hard rules
1. **Every page/component file you create starts with `"use client";`** (these modules use live Firestore hooks).
2. **Do NOT modify shared files**: `src/types/*`, `src/constants/*`, `src/lib/**`, `src/components/ui/*`, `src/components/layout/*`, `src/components/auth/*`, `nav.ts`. They are complete. Only CREATE files in your assigned route folders + your own `src/components/<module>/` folder.
3. If you genuinely need a Firestore read/write not already provided, build it locally with the generic helpers from `@/lib/db/firestore` (`create`, `update`, `getOne`, `getMany`, `subscribe`, `upsert`, `nextSequence`) + `COLLECTIONS` from `@/lib/db/collections`. Prefer existing repo functions.
4. Gate pages with `<RequirePermission permission="...">` from `@/components/auth/Guard`.
5. Use `useActor()` for the actor arg on repo writes, and `useToast()` for success/error feedback.
6. Mobile-first, clean, professional. Lists = `Table` + `SearchInput` + filter `Tabs`. Detail = `Card`s. Always handle loading/empty states.
7. Money via `formatMoney(n, currency)`. Dates via `formatDate`/`formatDateTime`/`fromNow`. Never hand-format.
8. Use `next/navigation` (`useRouter`, `useParams`, `Link` from `next/link`).
9. Keep it type-safe — no `any` unless unavoidable. Import domain types from `@/types`.

## UI components — `@/components/ui`
- `Button` props: `variant` = primary|secondary|outline|ghost|danger|success|gold; `size` = sm|md|lg|icon; `loading`.
- `Badge` `{tone}` (neutral|info|warning|success|danger|purple|gold); `StatusBadge` `{meta, fallback}` — pass a `*_STATUS_META[x]` entry.
- `Card`, `CardHeader` `{title, subtitle, action}`, `CardBody`, `CardFooter`.
- `Input`, `Textarea`, `Select`, `Label` `{required}`, `Field` `{label, required, hint, error, htmlFor}`, `Checkbox` `{label}`.
- `Table`, `THead`, `TH`, `TBody`, `TR` `{onClick}`, `TD`.
- `Modal` `{open, onClose, title, description, footer, size}`.
- `PageHeader` `{title, description, actions}`.
- `StatCard` `{label, value, icon, tone, hint, href}` — `icon` is a lucide-react name string e.g. "Package".
- `Spinner`, `LoadingState` `{label}`, `EmptyState` `{icon, title, description, action}`, `ErrorState` `{message}`, `InfoBanner` `{tone}`.
- `useToast()` → `{ toast(msg,tone), success(msg), error(msg) }`.
- `SearchInput` `{value, onChange, placeholder}`, `Tabs` `{tabs:[{key,label,count?}], active, onChange}`, `Avatar` `{name, src}`, `KeyValue` `{label, children}`.
- Icons: import directly from `lucide-react`.

## Auth — `@/lib/auth/AuthProvider`
- `useAuth()` → `{ user, role, can(permission), canAny([..]), signOut() }`. `user` is `AppUser` (`user.customerId`, `user.sealOffice`, `user.displayName`, `user.id`).
- `useActor()` → `{ uid, name, role }` — pass as the `actor` argument to every repo write.
- Helpers from `@/lib/auth/permissions`: `can`, `isLiberty`, `isSeal`, `isFinance`, `isCustomer`, `isSuperAdmin`. Permission strings (examples): `customers.create`, `shipments.create`, `shipments.status.update`, `shipments.lock`, `shipments.override_dispatch`, `intake.manage`, `invoices.generate`, `payments.record`, `payments.reconcile`, `rates.create`, `rates.approve`, `routes.create`, `routes.approve`, `manifests.create`, `manifests.approve`, `manifests.confirm`, `complaints.manage`, `settings.manage`, `users.manage`, `audit.view`, `reports.view`, `reports.export`, `commission.manage`.

## Repositories (all client-safe; hooks return `{ data, loading, error }`)
- `@/lib/db/repositories/customers`: `useCustomers()`, `useCustomer(id)`, `getCustomer(id)`, `createCustomer(data: NewCustomer, actor)`, `updateCustomer(id, partial, actor)`.
- `@/lib/db/repositories/shipments`: `useShipments()`, `useCustomerShipments(cid)`, `useSealShipments(office?)`, `getShipment(id)`, `createShipment(data: NewShipment, actor) → {id, trackingNumber}`, `updateShipment(id, partial, actor)`, `changeShipmentStatus(id, next, actor, settings, {note?,location?}) → {ok, reason?}`, `lockShipment(id, actor)`, `overrideDispatch(id, reason, actor)`.
- `@/lib/db/repositories/rateCards`: `useRateCards()`, `createRateCard(data: NewRateCard, actor)`, `submitRateCard(id, actor)`, `approveRateCard(id, actor)`, `rejectRateCard(id, reason, actor)`, `updateRateCard(id, partial, actor, note?)`, `getActiveRateCards()`.
- `@/lib/db/repositories/invoices`: `useInvoices()`, `useCustomerInvoices(cid)`, `getInvoice(id)`, `generateInvoice(shipment, settings, actor, {customer?, route?, rateCards?, paymentInstructions?}) → id`, `applyPaymentToInvoice(invoiceId, amount, actor)`.
- `@/lib/db/repositories/payments`: `usePayments()`, `useCustomerPayments(cid)`, `recordPayment(data: NewPayment, actor) → id`, `setReconciliationStatus(id, status, actor)`.
- `@/lib/db/repositories/manifests`: `useManifests()`, `getManifest(id)`, `createManifest(data: NewManifest, actor) → id`, `setManifestPackages(id, packages, actor)`, `libertyApproveManifest(id, actor)`, `sealConfirmManifest(id, actor)`, `dispatchManifest(id, actor)`, `shipmentToManifestPackage(shipment)`.
- `@/lib/db/repositories/routes`: `useRoutes()`, `getRoutes()`, `createRoute(data: NewRoute, actor)`, `updateRoute(id, partial, actor)`, `sealConfirmRoute(id, actor)`, `libertyApproveRoute(id, actor)`, `setRouteStatus(id, status, actor)`.
- `@/lib/db/repositories/complaints`: `useComplaints()`, `useCustomerComplaints(cid)`, `createComplaint(data: NewComplaint, actor)`, `updateComplaint(id, partial, actor)`, `resolveComplaint(id, notes, actor)`.
- `@/lib/db/repositories/notifications`: `useNotifications()`, `useUserNotifications(uid)`, `logNotification(data)`, `markNotificationRead(id)`.
- `@/lib/db/repositories/auditLogs`: `useAuditLogs(max?)`.
- `@/lib/db/repositories/users`: `useUsers()`, `setUserActive(id, active, actor)`. (User CREATION is via `POST /api/users` with a Bearer ID token — see Settings/Users module.)
- `@/lib/db/repositories/settings`: `usePlatformSettings() → {settings, loading}`, `savePlatformSettings(partial, actor)`, `getPlatformSettings()`, `usePilotTracker() → {pilot}`, `savePilotTracker(partial, actor)`, `getPilotTracker()`.

The `New*` input types are exported from each repo (e.g. `import { createCustomer, type NewCustomer } from ".../customers"`). They omit auto-generated fields (ids, codes, timestamps, status defaults).

## Business logic
- `@/lib/pricing/engine`: `calculatePricing(shipmentLike, ctx) → PricingResult` (`{ currency, lines, subtotal, serviceFee, total, commission, warnings, rateCardName, rateCardEffectiveDate }`). `selectActiveRateCard(cards, pricingType, routeCode?, country?)`. Use these for live price previews. `shipmentLike` = `{ pricingMode, items, weightLb, routeCode, destinationCountry, customerId, customerSource? }`. `ctx` = `{ itemRateCard, weightRateCard, route, settings }`.
- `@/lib/shipments/guards`: `checkDispatchReadiness(shipment, settings) → {ok, blockers[]}`, `canMoveToStatus(shipment, next, settings) → {ok, reason?}`.
- `@/lib/analytics/metrics`: `computeLibertyMetrics`, `computeSealMetrics`, `computeFinanceMetrics`, `countByStatus`.

## Utils & constants
- `@/lib/utils/format`: `formatMoney`, `formatNumber`, `formatWeight`, `round2`, `initials`, `titleCase`, `truncate`.
- `@/lib/utils/dates`: `formatDate`, `formatDateTime`, `fromNow`, `daysBetween`, `isWithinWindow`, `addMonths`.
- `@/lib/utils/ids`: `generateTrackingNumber`, `routeCode(origin,dest)`.
- `@/lib/firebase/storage`: `uploadFile(path, file) → url`, `uploadFiles(path, files) → url[]`, `deleteFileByUrl(url)`. Paths like `shipments/{id}/photos`, `complaints/{ticket}`.
- `@/lib/notifications/service`: `notify(event, target, ctx, opts?)` — fire customer notifications (in-app + email + SMS). `event` ∈ `package_received|invoice_generated|payment_confirmed|added_to_manifest|dispatched|in_transit|arrived|ready_for_pickup|out_for_delivery|delivered|delay_notice|complaint_update`. `target` = `{ userId?, name?, email?, phone? }`. `ctx` = `{ trackingNumber?, invoiceNumber?, amount?, manifestNumber?, ... }`.
- `@/constants/statuses`: `SHIPMENT_STATUS_META`, `SHIPMENT_STATUS_ORDER`, `ACTIVE_SHIPMENT_STATUSES`, `PAYMENT_STATUS_META`, `RATE_CARD_STATUS_META`, `MANIFEST_STATUS_META`, `ROUTE_STATUS_META`, `COMPLAINT_STATUS_META`, `COMPLAINT_TYPE_LABELS`, `CUSTOMER_TYPE_LABELS`, `CUSTOMER_SOURCE_LABELS`, `PRICING_TYPE_LABELS`, `ROUTE_DIRECTION_LABELS`, `PAYMENT_METHOD_LABELS`.
- `@/constants/seed-data`: `SEED_ITEM_RATES` (RateItem[]), `ITEM_CATEGORIES`, `SEED_ROUTES`, `PILOT_COUNTRIES`, `ORIGIN_COUNTRIES`.
- `@/constants/roles`: `ROLE_LABELS`, `ASSIGNABLE_STAFF_ROLES`, `ROLE_DESCRIPTIONS`.

## Domain types — `@/types`
`AppUser, Customer, Shipment, ShipmentItem, ShipmentStatus, RateCard, RateItem, Invoice, InvoiceLine, Payment, Manifest, ManifestPackage, CountryRoute, Complaint, NotificationRecord, AuditLogEntry, PlatformSettings, PilotTracker, CommissionBreakdown, CustomerType, CustomerSource, PricingType, RouteDirection, PaymentMethod, ComplaintType`. Read the file if unsure of a field name.

## Style cues
- Page padding/headers handled by the app shell; just render content. Start each page with `<PageHeader .../>`.
- Status pills everywhere via `StatusBadge`. Row click navigates to detail.
- Forms: `react-hook-form` is available, but simple controlled state is fine. Validate required fields; disable submit while saving.
- Tracking numbers / invoice numbers shown in `font-mono`.
- Always provide a "back" affordance on detail pages.

Build complete, working, production-quality pages. No TODOs or placeholders.
