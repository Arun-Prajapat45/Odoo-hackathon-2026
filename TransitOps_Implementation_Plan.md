# TransitOps — System Design & Implementation Plan
### Smart Transport Operations Platform — 8‑Hour Hackathon Build

---

## 0. TL;DR — What we're building and how

A **role-based fleet operations web app** with 4 roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst), covering Vehicles → Drivers → Trips → Maintenance → Fuel/Expenses → Analytics, with **automatic status transitions** driven by a small state machine, not scattered if/else logic.

**Core engineering insight for an 8-hour build:** almost every "mandatory business rule" in the spec (section 4) is really just **two state machines** (Vehicle status, Driver status) plus **guard conditions** checked before a trip/maintenance transition. If you design those two state machines properly on paper first, 80% of your "business logic" becomes one shared service function instead of 10 different validations copy-pasted across screens. Do this first — before writing any UI.

---

## 1. Tech Stack Decision (optimized for speed, not scale)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + Vite + TypeScript + Tailwind + shadcn/ui** | Fast scaffolding, good component reuse across 8 screens, matches the Excalidraw mockup styling easily |
| State/data fetching | **React Query (TanStack Query)** | Auto caching/refetch after mutations (e.g., dispatch a trip → dashboard KPIs refresh) |
| Backend | **Node.js + Express (or Fastify) + TypeScript** | Fast to write, one language across stack, easy to reason about with your team |
| DB | **PostgreSQL** (via Supabase or plain Postgres + Prisma) | Relational integrity matters here (unique reg no., FK constraints, enum statuses) — don't use Mongo for this |
| ORM | **Prisma** | Fastest way to get migrations + type-safe queries in a hackathon |
| Auth | **JWT (access token) + bcrypt password hashing**, roles embedded in JWT claims | Simple, no need for full OAuth in 8 hrs |
| Charts | **Recharts** | Quick KPI/analytics visuals |
| CSV export | **papaparse / json2csv** on frontend or backend | Mandatory deliverable, trivial to add |
| Deployment | **Vercel (frontend) + Railway/Render (backend+DB)**, or all-in-one on Railway | Zero-config deploys, good for demo day |

**If your team is 2 people or less and time is tighter:** collapse this into a single **Next.js (App Router) + Prisma + Postgres** monolith with API routes. Cuts your deployment and CORS setup entirely. I'd actually recommend this by default for an 8-hour clock — one repo, one deploy, one server to keep alive during demo.

---

## 2. Data Model (ER Design)

```
User(id, name, email, password_hash, role, created_at)
   role ∈ {FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, FINANCIAL_ANALYST}

Vehicle(id, reg_no [UNIQUE], name_model, type, max_capacity_kg,
        odometer, acquisition_cost, status, region, created_at)
   status ∈ {AVAILABLE, ON_TRIP, IN_SHOP, RETIRED}

Driver(id, name, license_no, license_category, license_expiry,
       contact_number, safety_score, status, created_at)
   status ∈ {AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED}

Trip(id, trip_code, source, destination, vehicle_id (FK), driver_id (FK),
     cargo_weight_kg, planned_distance_km, status,
     dispatched_at, completed_at, final_odometer, fuel_consumed_l,
     created_by (FK User), created_at)
   status ∈ {DRAFT, DISPATCHED, COMPLETED, CANCELLED}

MaintenanceLog(id, vehicle_id (FK), service_type, cost, service_date,
               status, created_at)
   status ∈ {ACTIVE, CLOSED}   -- ACTIVE = vehicle in shop; CLOSED = done

FuelLog(id, vehicle_id (FK), trip_id (FK, nullable), date, liters, cost, created_at)

Expense(id, trip_id (FK, nullable), vehicle_id (FK), category, amount,
        date, linked_maintenance_id (FK, nullable), created_at)
   category ∈ {TOLL, MISC, MAINTENANCE}   -- MAINTENANCE rows auto-created from MaintenanceLog
```

**Key relational rules to enforce at the DB level (not just app level):**
- `Vehicle.reg_no` → `UNIQUE` constraint.
- `Trip.vehicle_id`, `Trip.driver_id` → FK constraints, `ON DELETE RESTRICT`.
- Add a partial/check constraint or app-level guard: a vehicle/driver can only be referenced by **one non-terminal Trip** at a time (DRAFT/DISPATCHED). Easiest to enforce in app logic via the state machine (below), not a DB constraint, since "non-terminal" is a computed condition.

---

## 3. The Two State Machines (build this first, on a whiteboard)

### 3.1 Vehicle Status State Machine
```
AVAILABLE ──(trip dispatched)──▶ ON_TRIP ──(trip completed/cancelled)──▶ AVAILABLE
AVAILABLE ──(maintenance record created, status=ACTIVE)──▶ IN_SHOP
IN_SHOP ──(maintenance closed)──▶ AVAILABLE   [unless explicitly RETIRED]
AVAILABLE / IN_SHOP ──(manual action)──▶ RETIRED   [terminal, dispatcher can never select]
```

### 3.2 Driver Status State Machine
```
AVAILABLE ──(trip dispatched)──▶ ON_TRIP ──(trip completed/cancelled)──▶ AVAILABLE
AVAILABLE ──(manual toggle)──▶ OFF_DUTY ──▶ AVAILABLE
ANY ──(license expired OR safety officer suspends)──▶ SUSPENDED
```

### 3.3 Trip Status State Machine
```
DRAFT ──(dispatch: passes all guard checks)──▶ DISPATCHED
DISPATCHED ──(complete: enter odometer + fuel)──▶ COMPLETED
DRAFT/DISPATCHED ──(cancel)──▶ CANCELLED
```

### 3.4 Guard Conditions (checked ONLY at the moment of "Dispatch")
Write this as **one function**: `canDispatch(trip): { ok: boolean, reason?: string }`

1. `vehicle.status === AVAILABLE` (not ON_TRIP, IN_SHOP, or RETIRED)
2. `driver.status === AVAILABLE` (not ON_TRIP, OFF_DUTY, or SUSPENDED)
3. `driver.license_expiry >= today`
4. `trip.cargo_weight_kg <= vehicle.max_capacity_kg`

If all pass → in a **single DB transaction**:
- `trip.status = DISPATCHED`, set `dispatched_at`
- `vehicle.status = ON_TRIP`
- `driver.status = ON_TRIP`

This transactionality matters — if you update trip/vehicle/driver in 3 separate calls and one fails, you get corrupted state. Use `prisma.$transaction([...])`.

### 3.5 Trip Completion Side Effects (also one transaction)
On "Complete Trip":
1. Require `final_odometer` and `fuel_consumed_l` as input.
2. `vehicle.odometer = final_odometer`
3. Create `FuelLog` row (vehicle_id, trip_id, liters=fuel_consumed_l, cost=<input or estimated>, date=today)
4. `trip.status = COMPLETED`, set `completed_at`
5. `vehicle.status = AVAILABLE`
6. `driver.status = AVAILABLE`

### 3.6 Maintenance Side Effects
- Create MaintenanceLog with `status = ACTIVE` → trigger: `vehicle.status = IN_SHOP`
- Close MaintenanceLog (`status = CLOSED`) → trigger: if `vehicle.status !== RETIRED`, set `vehicle.status = AVAILABLE`
- On MaintenanceLog creation, also auto-create an `Expense` row with `category = MAINTENANCE`, `amount = cost`, `linked_maintenance_id` (this is what powers "Total Operational Cost = Fuel + Maintenance" in Reports without extra manual entry).

**Build this logic as a `services/` layer** (`tripService.ts`, `vehicleService.ts`, `maintenanceService.ts`) — never put transition logic inline in route handlers. This is the single highest-leverage decision for finishing on time, because your 4 different UI screens (Trips, Fleet, Maintenance, Dashboard) all just call these services and stay dumb.

---

## 4. RBAC Design

Keep it dead simple: a static permission map, checked via middleware.

```ts
const PERMISSIONS = {
  FLEET_MANAGER:     ['fleet:write', 'maintenance:write', 'drivers:read', 'trips:read'],
  DISPATCHER:        ['trips:write', 'fleet:read', 'drivers:read'],
  SAFETY_OFFICER:    ['drivers:write', 'fleet:read'],
  FINANCIAL_ANALYST: ['fuel:read', 'expenses:read', 'analytics:read', 'fleet:read'],
};
```
- JWT payload: `{ userId, role, exp }`
- Express middleware: `requirePermission('trips:write')` checked per route.
- Frontend: hide/disable nav items and buttons based on role from the decoded JWT/user context — but **never rely on frontend hiding alone**; the backend middleware is the real enforcement (matches your mockup's "Screen 0: Authentication" + role-scoped nav in "Screen 8: Settings & RBAC").

---

## 5. API Surface (REST, versionless is fine for a hackathon)

```
POST   /auth/login
GET    /auth/me

GET    /dashboard/kpis                 -- active/available/in-shop vehicles, active/pending trips, drivers on duty, utilization %
GET    /dashboard?type=&status=&region= -- filtered views

GET    /vehicles          POST /vehicles          PATCH /vehicles/:id
GET    /drivers           POST /drivers           PATCH /drivers/:id
PATCH  /drivers/:id/status   -- toggle Available/OffDuty/Suspended

GET    /trips             POST /trips (create DRAFT)
POST   /trips/:id/dispatch
POST   /trips/:id/complete   { final_odometer, fuel_consumed_l, fuel_cost }
POST   /trips/:id/cancel

GET    /maintenance       POST /maintenance
POST   /maintenance/:id/close

GET    /fuel-logs         POST /fuel-logs
GET    /expenses          POST /expenses

GET    /analytics/fuel-efficiency
GET    /analytics/utilization
GET    /analytics/cost
GET    /analytics/roi
GET    /analytics/export.csv
```

**Validation library:** use `zod` for request body validation — pairs well with Prisma types and saves you from writing manual `if (!req.body.x)` everywhere.

---

## 6. Frontend Screen Plan (maps 1:1 to your Excalidraw mockup)

| # | Screen | Key components |
|---|---|---|
| 0 | Login | Email/password form, role auto-detected from account (not user-selected — role selection in your mockup is likely just for demo/testing seed accounts) |
| 1 | Dashboard | KPI cards, filters (type/status/region), Recent Trips table |
| 2 | Vehicle Registry | Table + filters + "Add Vehicle" modal, status badges |
| 3 | Drivers & Safety | Table + license expiry/suspended badges, toggle status buttons |
| 4 | Trip Dispatcher | Create Trip form (with **live capacity-check validation** — disable Dispatch button + show inline error like your mockup's red error box), Live Board of trip cards by status |
| 5 | Maintenance | Log Service Record form, Service Log table, status toggle buttons |
| 6 | Fuel & Expenses | Fuel log table + form, Expense table + form, auto-computed Total Operational Cost banner |
| 7 | Reports & Analytics | KPI cards (fuel efficiency, utilization, op cost, ROI), bar chart (top costliest vehicles), Export CSV button |
| 8 | Settings & RBAC | General settings form, RBAC matrix table (mostly read-only display for demo) |

**Shared components to build once, reuse everywhere:** `<Sidebar>`, `<Topbar searchBar userMenu>`, `<StatusBadge status>`, `<DataTable columns rows>`, `<KpiCard>`, `<Modal>`, `<FormField>`. Build these in Hour 1–2 and every subsequent screen is 70% assembly.

---

## 7. Hour-by-Hour Plan (8-hour window)

> Adjust start time to your actual clock — this is checkpoint-based. If you tell me your current time I'll convert this to literal clock times targeting a 4 PM demo.

### Block 1 (Hours 0–1): Setup & Schema
- Init monorepo (or Next.js app), install deps, connect Postgres.
- Write full Prisma schema (Section 2) and run first migration.
- Seed script: 1 user per role, 5 vehicles (mixed statuses), 5 drivers (include 1 expired license, 1 suspended), 3 sample trips, 2 maintenance logs, a few fuel/expense rows. **Seed data is critical** — it makes every screen demoable within minutes instead of you manually clicking forms all day.
- Set up JWT auth (login endpoint, hash check, token issue).

### Block 2 (Hours 1–2): Backend core services
- Build `tripService`, `vehicleService`, `maintenanceService` per Section 3 (the state machines). Write these as pure functions with unit-testable guard logic — even 3–4 quick manual test calls via Postman/Thunder Client here save hours of UI-debugging later.
- Build all CRUD routes for Vehicles, Drivers.
- Build RBAC middleware and wire it onto routes.

### Block 3 (Hours 2–3): Trip + Maintenance + Fuel/Expense routes
- `/trips` CRUD + dispatch/complete/cancel endpoints using the transactional service functions.
- `/maintenance` create/close endpoints (with auto vehicle status + auto Expense row).
- `/fuel-logs`, `/expenses` CRUD.
- `/dashboard/kpis` aggregate query.

### Block 4 (Hours 3–4): Frontend shell + Auth + Dashboard
- Scaffold React app, Tailwind theme (match mockup: dark sidebar, amber accent, status badge colors — green=Available, blue=OnTrip/Dispatched, orange=InShop/Draft, red=Retired/Cancelled/Suspended, gray=OffDuty).
- Build shared components (Sidebar, Topbar, DataTable, StatusBadge, KpiCard).
- Login page + auth context + protected routes + role-based nav visibility.
- Dashboard page wired to `/dashboard/kpis`.

### Block 5 (Hours 4–5): Vehicles + Drivers screens
- Vehicle Registry: table, filters, Add Vehicle modal (validate unique reg no. — surface backend 409 error nicely).
- Drivers: table, Add Driver modal, status toggle buttons, visually flag expired license (red "EXPIRED" tag like your mockup).

### Block 6 (Hours 5–6): Trip Dispatcher (the core demo scene)
- Create Trip form: source, destination, vehicle dropdown (**only fetch AVAILABLE vehicles**), driver dropdown (**only AVAILABLE, non-expired, non-suspended drivers**), cargo weight, distance.
- Live capacity check: as soon as vehicle + cargo weight are both set, compare client-side and show the red warning box + disable Dispatch button if exceeded (mirrors your mockup exactly) — but **also re-validate server-side** on the dispatch call, never trust the client check alone.
- Live Board: trip cards grouped/colored by status, with Complete/Cancel actions.
- This is your money screen for the demo — the "Van-05 / 450kg ≤ 500kg → dispatch succeeds" flow from your spec's Example Workflow (Section 5) should work end-to-end here.

### Block 7 (Hours 6–6:45): Maintenance + Fuel/Expenses screens
- Maintenance: Log Service Record form, Service Log table, Save → auto flips vehicle to In Shop (verify by flipping back to Fleet screen and seeing status change).
- Fuel & Expenses: Log Fuel form, Add Expense form, auto-computed Total Operational Cost banner at bottom.

### Block 8 (Hours 6:45–7:30): Reports & Analytics + Settings
- Analytics endpoints → KPI cards + bar chart (Recharts) for Top Costliest Vehicles.
- ROI calc: `(Revenue - (Maintenance + Fuel)) / AcquisitionCost` — **you'll need a `Revenue` field somewhere** (not explicitly in your entity list). Fastest fix: add a `revenue` field on `Trip` (flat per-trip revenue entered at completion, or a simple per-km rate config in Settings) so ROI isn't a fake hardcoded number in the demo.
- CSV export button (papaparse, generate from currently loaded table data — simplest reliable approach for a hackathon deadline).
- Settings/RBAC screen: General settings form (depot name, currency, distance unit) + read-only RBAC matrix table (can be a static table with the permission map from Section 4 — doesn't need live editing to satisfy the mockup).

### Block 9 (Hours 7:30–8): Polish, bug bash, deploy, demo script
- Fix obvious UI breaks, add loading/empty states, toasts for success/error on mutations.
- Deploy (Vercel/Railway) — do this earlier than last-minute if possible; **redeploy at least once by hour 6** so you're not debugging a cold deploy at 3:55 PM.
- Write a 2-minute demo script following the Example Workflow in your spec (Section 5) — it's literally already scripted for you: register vehicle → register driver → create trip → dispatch (capacity check passes) → complete trip → log maintenance (status flips) → show updated Reports.
- Prep 1–2 backup screenshots/recording in case of live-demo failure.

---

## 8. Cut List (if you're running behind)

Drop in this order — each is safe to cut without breaking the core story:

1. Dark mode, drag-and-drop, document uploads (already marked bonus/optional in spec).
2. PDF export (optional per spec — keep CSV only).
3. Email reminders for expiring licenses (optional per spec).
4. Region filter (keep type + status filters only).
5. RBAC matrix editing (keep it read-only/static).
6. Fine-grained Recharts styling — a single bar chart is enough.

**Never cut:** the vehicle/driver state machine + dispatch capacity-check guard. That's the crux of the problem statement and what a judge will actually test by clicking through your Example Workflow.

---

## 9. Common Pitfalls to Avoid

- **Don't** validate cargo capacity only in the frontend — judges/testers can hit your API directly.
- **Don't** update vehicle/trip/driver status in separate un-transactioned calls — you'll get a vehicle stuck "ON_TRIP" forever if one write fails.
- **Don't** let dropdowns for "select vehicle/driver" query *all* records — filter server-side to AVAILABLE only, or you'll double-book resources.
- **Don't** forget the closed-maintenance edge case: if vehicle was RETIRED before maintenance closes, don't silently flip it back to AVAILABLE.
- **Do** seed realistic demo data early — an empty app is unconvincing and wastes demo time clicking through forms.

---

## 10. Immediate Next Steps (right now)

1. Confirm tech stack with your team (recommend: Next.js + Prisma + Postgres + Tailwind monolith for speed).
2. Create the repo, run `npx create-next-app` / `npm create vite`, connect DB.
3. Paste the Prisma schema from Section 2 and run your first migration — this de-risks the rest of the day since every screen depends on it.
4. Assign owners: e.g., one person on Auth+RBAC+Dashboard, one on Trips+Maintenance, one on Fuel/Expenses+Analytics, if team size allows parallelization once the schema and shared components exist.

If you tell me your current time, your team size, and your chosen stack, I can generate the actual Prisma schema file, the seed script, and the Trip/Vehicle service functions ready to paste in.
