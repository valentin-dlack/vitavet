`docs/cursor/data-model.md`

---

# VitaVet — Data Model (MVP) • Cheat Sheet for Cursor

**Goal:** implement the *minimum viable* PostgreSQL data model that satisfies the MVP user stories.
**Scope:** NestJS API + React SPA, Railway PostgreSQL. Prisma ORM optional (planned).

---

## 1) Core domains & entities (MVP vs Post-MVP)

**MVP entities**

* **user** — account and auth base (email, password\_hash, is\_active).
* **clinic** — a practice (name, address, postcode).
* **user\_clinic\_role** — user’s role *in a clinic* (OWNER, VET, ASV, ADMIN\_CLINIC).
* **animal** — owned by a user; attached to a clinic.
* **appointment** — booking (animal, vet, starts\_at, ends\_at, status).
* **agenda\_block** — vet unavailability (vacation, training).
* **appointment\_type** *(optional MVP)* — label + default duration.
* **reminder\_rule** — generic rule, e.g. J-7 before appointment.
* **reminder\_instance** — concrete scheduled message for a user (send\_at, status).
* **notification\_log** — provider result (delivered/bounced/opened).

**Post-MVP entities**

* **medical\_note**, **document** (uploads),
* **service** + **clinic\_service** (search filters),
* **device\_token**, **notification\_pref**,
* **insurer**, **insurance\_transmission**,
* **gdpr\_request**, **audit\_log**.

> Cursor: start with MVP entities only. Add Post-MVP tables when the related US enters a sprint.

---

## 2) Keys, relations, must-have columns

* **PKs:** UUID across the board (`id uuid default gen_random_uuid()`), or Prisma `@id @default(uuid())`.
* **user**

  * `email` **unique**, `password_hash`, `first_name`, `last_name`, `is_active` (default true).
* **clinic**

  * `name`, `postcode`, `city` (+ optional `lat,lng`), `active` (default true).
* **user\_clinic\_role**

  * **PK** `(user_id, clinic_id, role)`; FKs to `user`, `clinic`; `role` ∈ {OWNER,VET,ASV,ADMIN\_CLINIC}.
* **animal**

  * `owner_id` → user(OWNER), `clinic_id` → clinic, `name`, optional `birthdate`.
* **appointment**

  * `clinic_id`, `animal_id`, `vet_user_id`, optional `type_id`,
  * `starts_at` (timestamptz), `ends_at` (timestamptz), `status` ∈ {PENDING,CONFIRMED,REJECTED,CANCELLED},
  * `created_by_user_id` (OWNER/ASV).
* **agenda\_block**

  * `vet_user_id`, `clinic_id`, `block_starts_at`, `block_ends_at`, `reason`.
* **reminder\_rule**

  * `scope` ∈ {APPOINTMENT}, `offset_days` (int), `channel_email` (bool), `channel_push` (bool), `active` (bool).
* **reminder\_instance**

  * `rule_id`, `user_id`, **nullable** `appointment_id`, `send_at`, `status` ∈ {SCHEDULED,SENT,FAILED,CANCELLED}, `payload` (jsonb).
* **notification\_log**

  * `instance_id`, `channel` ∈ {EMAIL,PUSH}, `delivery_status` ∈ {DELIVERED,BOUNCED,DROPPED}, `sent_at`, `opened_at` nullable.

---

## 3) Critical constraints & invariants (enforce in DB or service)

* **Clinic scoping (multi-tenant logical):**

  * Every **animal** and **appointment** must reference **clinic\_id**.
  * **Authorization guard:** a user acts **only** within clinics they have a role for.
  * *(Optional later)* PostgreSQL **RLS** on `clinic_id`.

* **Appointment overlap (per vet):**
  No overlapping appointments for the same `vet_user_id`.
  **DB level (recommended):** add an exclusion constraint using GiST:

  ```sql
  -- requires extension: CREATE EXTENSION IF NOT EXISTS btree_gist;
  ALTER TABLE appointment ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    vet_user_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  );
  ```

  **API rule:** `ends_at = starts_at + default_duration`.

* **Status transitions:**

  * `PENDING → CONFIRMED/REJECTED` (ASV/VET/Admin only).
  * Owner can `CANCELLED` their own booking (policy rules apply).

* **Agenda blocks in effect:**
  Disallow new appointments overlapping a vet’s `agenda_block`.

* **Reminders:**

  * J-7 before appointment: generate `reminder_instance(send_at=starts_at-7d)`.
  * Worker picks SCHEDULED instances and sends, creating `notification_log`.

---

## 4) Indexes (must-have for performance)

* `user(email)` **unique**.
* `clinic(postcode)`; optional geo index if you add coordinates.
* `animal(owner_id)`, `animal(clinic_id)`.
* `appointment(vet_user_id, starts_at)`, `appointment(clinic_id, starts_at desc)`, `appointment(animal_id)`.
* `agenda_block(vet_user_id, block_starts_at)`.
* `reminder_instance(send_at, status)`, `reminder_instance(user_id)`.

---

## 5) Minimal DDL (MVP core)

> Cursor: generate SQL migrations (or Prisma models) from this.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist;    -- for no-overlap constraint

CREATE TABLE "user" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text, last_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  postcode varchar(12) NOT NULL,
  city text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE user_clinic_role (
  user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('OWNER','VET','ASV','ADMIN_CLINIC')),
  PRIMARY KEY (user_id, clinic_id, role)
);

CREATE TABLE animal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES "user"(id),
  clinic_id uuid NOT NULL REFERENCES clinic(id),
  name text NOT NULL,
  birthdate date
);

CREATE TABLE appointment_type (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  duration_min int NOT NULL DEFAULT 30
);

CREATE TABLE appointment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinic(id),
  animal_id uuid NOT NULL REFERENCES animal(id),
  vet_user_id uuid NOT NULL REFERENCES "user"(id),
  type_id uuid REFERENCES appointment_type(id),
  status text NOT NULL CHECK (status IN ('PENDING','CONFIRMED','REJECTED','CANCELLED')),
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES "user"(id)
);

CREATE TABLE agenda_block (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinic(id),
  vet_user_id uuid NOT NULL REFERENCES "user"(id),
  block_starts_at timestamptz NOT NULL,
  block_ends_at   timestamptz NOT NULL,
  reason text
);

-- No overlap constraint for appointments per vet
ALTER TABLE appointment ADD CONSTRAINT no_overlap
EXCLUDE USING gist (vet_user_id WITH =, tstzrange(starts_at, ends_at) WITH &&);

CREATE TABLE reminder_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('APPOINTMENT')),
  offset_days int NOT NULL DEFAULT -7,
  channel_email boolean NOT NULL DEFAULT true,
  channel_push  boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE reminder_instance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES reminder_rule(id),
  user_id uuid NOT NULL REFERENCES "user"(id),
  appointment_id uuid REFERENCES appointment(id),
  send_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('SCHEDULED','SENT','FAILED','CANCELLED')),
  payload jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES reminder_instance(id),
  channel text NOT NULL CHECK (channel IN ('EMAIL','PUSH')),
  delivery_status text CHECK (delivery_status IN ('DELIVERED','BOUNCED','DROPPED')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  opened_at timestamptz
);
```

---

## 6) DTOs (minimum fields) & endpoints mapping

**Create appointment (US-03c)**

```ts
// POST /api/appointments
type CreateAppointmentDto = {
  clinicId: string;    // inferred from selection
  animalId: string;
  vetUserId: string;
  startsAt: string;    // ISO
  durationMin?: number; // fallback from appointment_type or clinic default
};
```

**Rules**

* Compute `endsAt = startsAt + duration`.
* Default `status = 'PENDING'` if created by OWNER; ASV/VET can CONFIRM.
* Enforce: no overlap, no agenda\_block overlap.

**Confirm appointment (US-06b)**

```ts
// PATCH /api/appointments/:id/status
{ status: 'CONFIRMED' | 'REJECTED' | 'CANCELLED' }
```

**Agenda day view (US-04a)**
`GET /api/agenda/me?range=day&date=2025-08-01` → list of `{ startsAt, endsAt, animal, status }`.

**Search clinics (US-02a)**
`GET /api/clinics?postcode=75011` → `{ id, name, city, postcode }[]`.

---

## 7) Seed data (for dev)

* One `clinic` + two vets + one ASV + one owner (with `user_clinic_role` rows).
* A couple of `animal` rows for the owner.
* One `appointment_type` (“Consultation 30m”).
* One `reminder_rule` (APPOINTMENT, offset −7d, email=true).

---

## 8) Must-pass checks (Definition of Done for data)

* Can create, confirm, cancel an appointment **without overlap**.
* Day/Week agenda queries return fast filters by `vet_user_id`.
* J-7 reminders generate `reminder_instance` rows; sending marks `notification_log`.
* All **FKs** and **CHECK** constraints present; indexes created.

---

## 9) Don’t overbuild (for MVP)

* No full blown CRM, no extensive `document` system yet.
* No species/breed dictionary unless needed (free text okay initially).
* Reminder scope = APPOINTMENT only (vaccines/treatments later).
* RLS is optional for MVP; start with explicit `clinic_id` checks in services.

---

## 10) Prisma tip (if/when you add it)

* Mirror tables 1:1; use `@relation` keys that follow FK names above.
* Add `@@index` for every index listed in §4.
* Generate client in the API: `pnpm dlx prisma generate`.
* Migration flow: `prisma migrate dev` (local) → `prisma migrate deploy` (Railway).

---

**This file is the single source of truth for the MVP data layer.**
Cursor: when implementing a story that touches data, **adhere to these tables, constraints, and DTOs** first; propose changes only if a story cannot be satisfied as-is.
