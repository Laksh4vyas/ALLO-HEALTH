# AlloStock — Inventory Reservation System

> A production-grade inventory reservation system built for the Allo Health take-home exercise.  
> Built with **Next.js 15**, **TypeScript**, **Prisma**, **PostgreSQL**, **TailwindCSS**, and **React Query**.

---
## Live - https://allo-health-laksh.vercel.app/
## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, or local)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd allo-health-inventory
npm install
```

### 2. Environment Variables

Copy the example file and fill in your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@host:5432/dbname?sslmode=require"
CRON_SECRET="generate-a-random-secret-here"
```

**Recommended free PostgreSQL providers:**
- [Neon](https://neon.tech) — serverless Postgres with free tier
- [Supabase](https://supabase.com) — Postgres with REST & realtime

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- 3 warehouses (Mumbai, Delhi, Bangalore)
- 8 products (MacBook Pro, iPhone, AirPods, PS5, etc.)
- 24 inventory records distributed across warehouses

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/route.ts          # GET /api/products
│   │   ├── warehouses/route.ts        # GET /api/warehouses
│   │   ├── reservations/
│   │   │   ├── route.ts               # POST /api/reservations
│   │   │   └── [id]/
│   │   │       ├── route.ts           # GET /api/reservations/[id]
│   │   │       ├── confirm/route.ts   # POST /api/reservations/[id]/confirm
│   │   │       └── release/route.ts   # POST /api/reservations/[id]/release
│   │   └── cron/
│   │       └── release-expired/route.ts
│   ├── checkout/[reservationId]/page.tsx
│   ├── warehouses/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/navbar.tsx
│   ├── products/
│   │   ├── product-card.tsx
│   │   ├── product-card-skeleton.tsx
│   │   └── reserve-dialog.tsx
│   └── providers/query-provider.tsx
├── hooks/
│   ├── use-products.ts
│   └── use-reservation.ts
└── lib/
    ├── api-client.ts
    ├── api-response.ts
    ├── prisma.ts
    ├── services/
    │   ├── product.service.ts
    │   ├── reservation.service.ts
    │   └── warehouse.service.ts
    └── validators/
        └── reservation.ts
prisma/
├── schema.prisma
└── seed.ts
vercel.json                            # Cron job config
```

---

## 🔌 API Reference

### `GET /api/products`
Returns all products with inventory per warehouse.

```json
{
  "success": true,
  "data": [{
    "id": "...",
    "name": "MacBook Pro 16\"",
    "warehouses": [{
      "warehouseId": "...",
      "warehouseName": "Mumbai Warehouse",
      "totalQuantity": 15,
      "reservedQuantity": 2,
      "available": 13
    }],
    "totalAvailable": 35
  }]
}
```

### `GET /api/warehouses`
Returns all warehouses.

### `POST /api/reservations`
Creates a reservation with row-level locking.

**Request:**
```json
{ "productId": "...", "warehouseId": "...", "quantity": 2 }
```

**Response (201):**
```json
{ "success": true, "data": { "reservationId": "...", "expiresAt": "..." } }
```

**Errors:**
- `409` — Insufficient stock
- `422` — Validation error

**Idempotency:** Pass `Idempotency-Key: <uuid>` header to safely retry.

### `GET /api/reservations/[id]`
Returns reservation details including product image, warehouse location, and status.

### `POST /api/reservations/[id]/confirm`
Confirms the reservation:
- `totalQuantity -= quantity` (permanent stock deduction)
- `reservedQuantity -= quantity`
- Status → `CONFIRMED`

**Errors:**
- `410` — Reservation expired
- `409` — Already released

### `POST /api/reservations/[id]/release`
Releases the reservation:
- `reservedQuantity -= quantity` (stock returned)
- Status → `RELEASED`

---

## ⚙️ Concurrency Strategy

This is the core safety guarantee of the system.

### Problem

Two concurrent HTTP requests attempt to reserve the last available unit simultaneously:
- Request A reads: `available = 1`
- Request B reads: `available = 1`
- Both proceed and reserve — **overselling occurs**

### Solution: `SELECT ... FOR UPDATE`

We use PostgreSQL's **row-level exclusive locking** inside a serialized transaction.

```sql
-- Inside a Prisma $transaction:
SELECT id, total_quantity, reserved_quantity
FROM "Inventory"
WHERE product_id = $1 AND warehouse_id = $2
FOR UPDATE;
```

**How it works:**

1. Both requests enter the transaction and attempt the `SELECT FOR UPDATE`
2. PostgreSQL grants the lock to **Request A** first
3. **Request B blocks** (waits) until Request A's transaction commits
4. Request A checks stock (available = 1), reserves it, increments `reservedQuantity`, and commits
5. **Request B now gets the lock** and reads the updated row (`available = 0`)
6. Request B sees insufficient stock and returns **HTTP 409**

This ensures exactly one request succeeds — **no overselling possible**.

### Implementation

See `src/lib/services/reservation.service.ts`:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Exclusive row lock
  const inventories = await tx.$queryRaw`
    SELECT id, total_quantity, reserved_quantity
    FROM "Inventory"
    WHERE product_id = ${input.productId}
      AND warehouse_id = ${input.warehouseId}
    FOR UPDATE
  `;

  const available = inventory.total_quantity - inventory.reserved_quantity;

  if (available < input.quantity) {
    throw new InsufficientStockError(...);  // → HTTP 409
  }

  // Atomic increment
  await tx.$executeRaw`
    UPDATE "Inventory"
    SET reserved_quantity = reserved_quantity + ${input.quantity}
    WHERE id = ${inventory.id}
  `;

  return tx.reservation.create({ ... });
});
```

> **Why not Prisma's `update` with `increment`?**  
> `prisma.inventory.update({ data: { reservedQuantity: { increment: n } } })` would work for the update itself, but we still need to **read-then-check** the available quantity before updating. The `SELECT FOR UPDATE` lock is required to safely serialize that read-then-write pattern.

---

## ⏱️ Reservation Expiry Strategy

Reservations expire after **10 minutes** if not confirmed.

### Vercel Cron Job

`vercel.json` configures a cron job running every minute:

```json
{
  "crons": [{
    "path": "/api/cron/release-expired",
    "schedule": "* * * * *"
  }]
}
```

The endpoint `/api/cron/release-expired`:
1. Finds all `PENDING` reservations where `expiresAt < now()`
2. For each: atomically releases `reservedQuantity` and sets status to `RELEASED`
3. Protected by `Authorization: Bearer <CRON_SECRET>` in production

### Setting up CRON_SECRET on Vercel

```bash
# In Vercel project settings → Environment Variables
CRON_SECRET=your-secret-value-here
```

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with cron requests.

---

## ✨ Idempotency

The system supports idempotency for:
- `POST /api/reservations`
- `POST /api/reservations/[id]/confirm`

**Usage:**
```http
POST /api/reservations
Idempotency-Key: unique-uuid-per-request
Content-Type: application/json

{ "productId": "...", "warehouseId": "...", "quantity": 1 }
```

If the same key is reused, the **original response is returned** without repeating side effects. Keys are stored in the `IdempotencyKey` table with a `(key, endpoint)` unique constraint.

---

## 🚢 Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL` — your Neon/Supabase connection string
   - `CRON_SECRET` — a random secret string
4. Deploy

After deployment, run migrations:
```bash
npx prisma migrate deploy
npm run seed
```

---

## ⚖️ Trade-offs

| Decision | Rationale |
|----------|-----------|
| Raw SQL for locking | Prisma ORM doesn't expose `SELECT FOR UPDATE` natively; `$queryRaw` gives full control |
| `$transaction` for atomicity | All inventory checks and updates happen in a single DB transaction |
| 10-minute reservation window | Balances UX (enough time to complete checkout) with inventory availability |
| Cron-based expiry | Simpler than event-driven; acceptable for 1-minute granularity. Can be upgraded to pg_cron or a queue |
| Tailwind v4 | Latest version; uses CSS `@import` instead of `tailwind.config.js` |
| Sonner over Radix Toast | Better DX, simpler API for toast notifications |

---

## 🔮 Future Improvements

- **Distributed locking with Redis** — Use Upstash Redis for cross-region lock safety
- **WebSocket / SSE** — Push stock updates to clients in real-time
- **Payment gateway integration** — Connect to Stripe for real payment flow
- **Reservation queue** — Let users queue for out-of-stock items
- **Analytics dashboard** — Track reservation conversion rates
- **Multi-currency pricing** — Add price fields to products
- **Rate limiting** — Prevent abuse with Upstash Ratelimit
- **E2E tests** — Playwright tests for checkout flow
- **Concurrency tests** — Artillery load tests to verify locking behavior

---

## 🧪 Testing Concurrency Manually

You can simulate a race condition using curl:

```bash
# Run both requests simultaneously
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"<id>","warehouseId":"<id>","quantity":1}' &

curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"<id>","warehouseId":"<id>","quantity":1}' &

wait
```

One request should return `201` and the other `409`.

---

## 📄 License

MIT
