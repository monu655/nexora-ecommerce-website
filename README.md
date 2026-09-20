# NEXORA

A production-style e-commerce platform for a premium audio, wearables and desk-gear retailer — a customer storefront and an internal operations dashboard, backed by a single REST API.

Built as a MERN monorepo: React 18 + Vite + Tailwind on the front end, Express + MongoDB behind a versioned REST API with JWT auth.

---

## Contents

- [Business use case](#business-use-case)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Database schema](#database-schema)
- [API documentation](#api-documentation)
- [Environment variables](#environment-variables)
- [Local setup](#local-setup)
- [Demo build](#demo-build)
- [Deployment](#deployment)
- [Demo credentials](#demo-credentials)
- [Screenshots](#screenshots)

---

## Business use case

Nexora Retail sells its own range of audio, wearable and desk products direct to customers across India. The business needs two things from one system:

1. **A storefront** that converts — fast catalogue browsing, honest stock signals, saved carts and wishlists, a short checkout, and order tracking that reduces "where is my order" support tickets.
2. **An operations console** the team actually runs the day on — revenue and order trends, category performance, stock alerts before items sell out, and a fulfilment queue where orders move through a controlled status flow.

Both surfaces read and write through the same API, so a stock change made by an operator is reflected on the storefront immediately, and an order placed by a customer appears in the fulfilment queue without a sync step.

Commercial rules are defined once, server-side (`server/src/config/constants.js`): free shipping above ₹4,999, a flat ₹149 otherwise, and 18% GST. The client displays those totals; the server recomputes them at checkout so a tampered cart cannot change what is charged.

---

## Features

### Storefront

| Area | Detail |
|---|---|
| Home | Featured range, category entry points, delivery and warranty signals. The hero card shows the featured product's photograph |
| Catalogue | Server-side search, category and price filters, rating and in-stock filters, six sort orders, pagination — all URL-driven so a filtered view is shareable. Six categories: Audio, Wearables, Keyboards, Gaming, Laptop Accessories and Mobile Accessories |
| Product detail | Product photography, highlights, full specification table, verified-purchase reviews with a rating distribution, related products. **Add to cart** or **Buy now**, which adds the item and goes straight to checkout |
| Reviews | One review per customer per product, automatically flagged as a verified purchase when the customer has an eligible order |
| Cart | Guest cart persisted locally and merged into the account on sign-in, per-line quantity control, live totals, stock ceilings enforced server-side |
| Wishlist | Toggle from any product card or detail page, move to cart |
| Checkout | Saved-address picker, new address inline, payment method selection, order summary that matches the server's calculation |
| Orders | Order history with status filter, order detail with a fulfilment progress bar, event timeline, and self-service cancellation before dispatch |
| Profile | Personal details, password change, full address book with a single enforced default |
| Footer and help pages | Contact details, newsletter box, accepted payment methods, social links, and eight help pages — About, Contact, Shipping & delivery, Returns & refunds, Warranty, FAQs, Privacy policy and Terms of service — that open in a popup from the footer, with no page reload |

Notes on the footer and help pages:

- The contact form opens the visitor's email app with the message filled in. It does not save the message anywhere, because the API has no message endpoint.
- The newsletter box validates the email address but is not connected to a backend yet.
- The Privacy policy and Terms of service are plain starter text, not legal advice. Have them reviewed before a real launch.
- Contact details (email, phone, address) are placeholders defined in one `CONTACT` block at the top of `client/src/components/shop/Footer.jsx`. Replace them with real business details.
- The social icons are inline SVGs, so the footer does not depend on which version of `lucide-react` is installed (newer versions removed the brand icons).

### Admin console

| Area | Detail |
|---|---|
| Dashboard | Total revenue, orders, customers and products with period-over-period deltas; revenue/orders over time (7/30/90 days); order status mix; sales by category; top-selling products; recent orders; low-stock alert |
| Products | Searchable, filterable table across active and retired items; create, edit, stock adjustment, soft delete and restore |
| Orders | Filter by status, search by order number or customer, and a detail view whose controls only offer legal next statuses |
| Customers | Lifetime value, order count and last order date per account, with the ability to deactivate or reactivate an account |
| Settings | Admin profile, password rotation, and the commercial rules applied at checkout |

### Applied throughout

Loading skeletons, empty states, retryable error states, confirmation dialogs before destructive actions, toast notifications, form validation with field-level messages, pagination, a 404 page, and a route-level error boundary. No raw server or stack-trace text ever reaches the user.

---

## Tech stack

**Front end** — React 18, Vite, React Router 6, TanStack Query (server state), Zustand (session, cart and toast state, persisted), Axios, Tailwind CSS, lucide-react.

**Back end** — Node.js, Express 4, MongoDB with Mongoose 8, JWT (access + refresh), bcrypt, Zod validation, Helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize, compression, morgan.

**Infrastructure** — MongoDB Atlas, Render (API), Vercel (web).

Charts are hand-built SVG components rather than a charting dependency: it keeps the bundle small and lets the visuals follow the same design tokens as the rest of the interface.

---

## Architecture

```
React (Vite)                      Express API                    MongoDB
───────────                       ───────────                    ───────
pages / layouts                   routes      → validation (Zod)  User
  │                                 │                             Product
components (ui, shop, admin)      controllers → HTTP shape        Order
  │                                 │                             Cart
hooks + Zustand stores            services    → business rules    Wishlist
  │                                 │                             Review
services (Axios)  ──REST/JWT──►   models      → persistence
```

- **Routes** declare paths, attach middleware and validate input; they contain no logic.
- **Controllers** translate between HTTP and the domain, and return one response envelope.
- **Services** own the rules that must not be duplicated: pricing, stock checks, the order state machine, analytics aggregation.
- **Middleware** covers authentication, admin authorisation, validation and centralised error translation.

Every response has the same shape:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "total": 24 } }
```

Errors use the same envelope with `success: false` and a message written for a customer. Mongoose validation, cast and duplicate-key errors are translated before they leave the server.

**Order state machine** — `pending → confirmed → packed → shipped → delivered`, with `cancelled` reachable up to `packed`. Transitions are validated server-side; cancelling returns stock to the catalogue and marks the payment refunded. The admin UI derives its buttons from the same map, so an illegal transition is never offered.

---

## Folder structure

```
nexora/
├── server/
│   ├── src/
│   │   ├── config/        env loading, db connection, business constants
│   │   ├── controllers/   auth, user, product, cart, wishlist, order, review, admin
│   │   ├── middleware/    auth, validate, error handling
│   │   ├── models/        User, Product, Order, Cart, Wishlist, Review
│   │   ├── routes/        route definitions + Zod schemas
│   │   ├── services/      product, order, analytics
│   │   ├── seed/          catalogue, people, seed runner
│   │   ├── utils/         ApiError, apiResponse, asyncHandler, token, pricing
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/           demo dataset export, addAccessoryProducts, addProductImages
│   └── .env.example
└── client/
    ├── public/
    │   └── images/
    │       └── products/  optional local product photos, named after the product slug
    ├── src/
    │   ├── components/    ui/ (Button, Field, Modal, Toast, States…), shop/ (ProductCard,
    │   │                  ProductVisual, Footer…), admin/
    │   ├── pages/         shop/, admin/
    │   ├── layouts/       ShopLayout, AdminLayout
    │   ├── hooks/         useCart
    │   ├── services/      axios instance + API modules
    │   ├── store/         auth, cart, toast (Zustand)
    │   ├── lib/           formatting, query client, class helper
    │   └── demo/          static-demo transport (not used against a live API)
    ├── vercel.json
    └── .env.example
```

---

## Database schema

**User** — `name`, `email` (unique), `password` (bcrypt, cost 12, never selected by default), `phone`, `role` (`customer` | `admin`), `isActive`, `avatarColor`, `addresses[]` (embedded: label, fullName, phone, line1, line2, city, state, pincode, isDefault), `lastLoginAt`, timestamps. A pre-save hook hashes the password and enforces a single default address.

**Product** — `sku` (unique), `name`, `slug` (unique, derived), `tagline`, `description`, `highlights[]`, `category`, `brand`, `price`, `compareAtPrice`, `cost`, `stock`, `lowStockThreshold`, `rating`, `reviewCount`, `unitsSold`, `specs` (Map), `tags[]`, `colorway`, `images[]` (photo URLs), `isFeatured`, `isActive`. Text index on name/description/tags; virtuals for `stockStatus` and `discountPercent`.

**Order** — `orderNumber` (unique), `user` → User, `items[]` (product ref **plus** denormalised name, sku, category and price so a receipt stays accurate if the catalogue changes), `shippingAddress`, `pricing` (subtotal, discount, tax, shipping, total), `paymentMethod`, `paymentStatus`, `status`, `timeline[]`, `placedAt`, `deliveredAt`, `cancelledAt`. Indexed on `placedAt` and `user + placedAt`.

**Cart** — `user` (unique) → User, `items[]` (product ref + quantity). One cart per account; guest carts live in localStorage until sign-in.

**Wishlist** — `user` (unique) → User, `products[]` → Product.

**Review** — `product` → Product, `user` → User, `authorName`, `rating` (1–5), `title`, `body`, `isVerifiedPurchase`. Compound unique index on `product + user`; a post-save hook recomputes the product's average rating and review count.

---

## API documentation

Base path: `/api/v1`. Authenticated requests send `Authorization: Bearer <accessToken>`.

### Auth

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account |
| POST | `/auth/login` | Public | Customer sign-in |
| POST | `/auth/admin/login` | Public | Staff sign-in (rejects non-admins) |
| POST | `/auth/refresh` | Public | Exchange a refresh token |
| GET | `/auth/me` | Auth | Current session user |
| POST | `/auth/logout` | Auth | Clear the session cookie |

### Catalogue

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products` | Public | List with `search`, `category`, `minPrice`, `maxPrice`, `rating`, `inStock`, `featured`, `sort`, `page`, `limit` |
| GET | `/products/facets` | Public | Category counts and price range for the filter panel |
| GET | `/products/:idOrSlug` | Public | Product detail + related items |
| GET | `/products/:id/reviews` | Public | Reviews with star distribution |
| POST | `/products/:id/reviews` | Auth | Post a review (one per customer) |
| DELETE | `/products/:id/reviews/:reviewId` | Auth | Delete own review |

### Cart, wishlist, orders

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/cart` | Auth | Cart with recalculated totals |
| POST | `/cart/items` | Auth | Add an item (stock-checked) |
| PATCH | `/cart/items/:productId` | Auth | Change quantity |
| DELETE | `/cart/items/:productId` | Auth | Remove an item |
| DELETE | `/cart` | Auth | Empty the cart |
| POST | `/cart/merge` | Auth | Merge a guest cart after sign-in |
| GET | `/wishlist` | Auth | Saved products |
| POST | `/wishlist/toggle` | Auth | Add or remove |
| DELETE | `/wishlist/:productId` | Auth | Remove |
| POST | `/orders/checkout` | Auth | Place an order (re-checks stock, decrements it, clears the cart) |
| GET | `/orders` | Auth | Order history, paginated |
| GET | `/orders/:id` | Auth | Order detail |
| POST | `/orders/:id/cancel` | Auth | Cancel before dispatch |

### Account

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| PATCH | `/users/profile` | Auth | Update name and phone |
| POST | `/users/change-password` | Auth | Change password |
| GET/POST | `/users/addresses` | Auth | List / add an address |
| PATCH/DELETE | `/users/addresses/:id` | Auth | Update / remove an address |

### Admin (all require `role: admin`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/analytics/dashboard` | Summary KPIs, revenue series, categories, top products, status mix, recent orders |
| GET | `/admin/analytics/revenue?range=30` | Daily revenue and order counts, zero-filled |
| GET | `/admin/products` | Catalogue including retired items |
| POST | `/admin/products` | Create |
| PATCH | `/admin/products/:id` | Update |
| PATCH | `/admin/products/:id/stock` | Adjust stock and low-stock threshold |
| DELETE | `/admin/products/:id` | Retire (soft delete) |
| POST | `/admin/products/:id/restore` | Restore |
| GET | `/admin/orders` | Fulfilment queue, filter by status, search |
| GET | `/admin/orders/:id` | Order detail |
| PATCH | `/admin/orders/:id/status` | Advance or cancel, validated against the state machine |
| GET | `/admin/customers` | Accounts with lifetime value and order counts |
| PATCH | `/admin/customers/:id/status` | Deactivate or reactivate |

`GET /api/v1/health` returns service uptime for platform health checks.

---

## Environment variables

**server/.env**

| Variable | Notes |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | Defaults to 5000 |
| `MONGODB_URI` | Local or Atlas connection string — **required** |
| `JWT_SECRET` | Long random string — **required** |
| `JWT_EXPIRES_IN` | Access token lifetime, default `7d` |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Default `30d` |
| `CLIENT_ORIGINS` | Comma-separated CORS allow-list |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Used only by the seed script |
| `SEED_CUSTOMER_EMAIL` / `SEED_CUSTOMER_PASSWORD` | Used only by the seed script |

**client/.env**

| Variable | Notes |
|---|---|
| `VITE_API_URL` | API base URL including `/api/v1` |
| `VITE_APP_NAME` | Display name |

The server fails fast at boot if `MONGODB_URI` or `JWT_SECRET` is missing, rather than starting in a broken state. No secret is ever read by the client.

---

## Local setup

Requires Node 18+ and MongoDB (local or an Atlas cluster).

```bash
# API
cd server
cp .env.example .env          # set MONGODB_URI and JWT_SECRET
npm install
npm run seed:fresh            # 24 products, 15 customers, ~90 days of orders
npm run dev                   # http://localhost:5000

# Web
cd ../client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api` to port 5000, so the two run side by side without CORS configuration.

### Extra catalogue: laptop and mobile accessories

The seed creates 24 products. Eight more products for the **Laptop Accessories** and **Mobile Accessories** categories are added by two small standalone scripts in `server/scripts/`. They connect with the `MONGODB_URI` from `server/.env`, and both are safe to run more than once.

```bash
cd server

# 1. Add the 8 products (preview first, then really add)
node scripts/addAccessoryProducts.v2.mjs --dry
node scripts/addAccessoryProducts.v2.mjs

# 2. Attach product photos to them
node scripts/addProductImages.mjs --dry
node scripts/addProductImages.mjs
```

| Script | What it does |
|---|---|
| `addAccessoryProducts.v2.mjs` | Inserts the 8 products, matched by slug so nothing is duplicated and existing products are never changed. It detects the products collection itself and copes with a differently named connection variable. `--dry` previews without writing |
| `addProductImages.mjs` | Sets the `images` field of those 8 products, using the same format as your existing products. Photo links are listed in a `REMOTE_URLS` block at the top of the file. It can also pick up local files from `client/public/images/products/`. `--dry` previews without writing |

If you re-seed the database, run both scripts again afterwards. The static demo build uses its own exported dataset, so it does not include these eight products.

### Product imagery

Each catalogue entry carries real product photography (`images[]`, served from the Unsplash CDN, free for commercial use). `ProductVisual` renders the photo and falls back to a generated, brand-coloured SVG keyed to the product's category and colourway if an image fails to load — so the grid never shows a broken tile, and a new product with no photo yet still looks deliberate.

To use your own photos instead, save them in `client/public/images/products/`, named exactly like the product slug (for example `nexora-aero-laptop-stand.jpg`; add `-2`, `-3` for extra photos), and run `addProductImages.mjs`.

Photos of products such as chargers and power banks can show another company's brand name. Check each photo on the storefront and swap any that do not suit the Nexora brand.

## Demo build

`npm run build:demo` in `client/` produces `dist/nexora-demo.html` — the entire application as one portable HTML file. It runs the same components, routes and services; only the Axios transport is swapped for an in-memory implementation of the same REST contract, seeded with the same dataset. Useful for review links and offline walkthroughs. Note that a sandboxed review host may block third-party images, in which case the generated fallback visuals appear instead of the photos; a normal deployment shows the photography. Point `VITE_API_URL` at a running server and that transport is never loaded.

---

## Deployment

**Database — MongoDB Atlas**
1. Create a free M0 cluster and a database user.
2. Allow access from anywhere (`0.0.0.0/0`) or from Render's egress addresses.
3. Copy the connection string into `MONGODB_URI`.

**API — Render**
1. New → Web Service, connect the repository, root directory `server`.
2. Build `npm install`, start `npm start`, health check path `/api/v1/health`.
3. Add every variable from `server/.env.example`, with `CLIENT_ORIGINS` set to the Vercel URL.
4. Run `npm run seed` once from the Render shell to populate the catalogue, then run the accessory scripts from the section above if you want the extra categories populated.

**Web — Vercel**
1. New Project, root directory `client`, framework Vite.
2. Build `npm run build`, output `dist`.
3. Set `VITE_API_URL` to `https://<your-api>.onrender.com/api/v1`.
4. `vercel.json` already rewrites all paths to `index.html` for client-side routing.

---

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@nexora.store` | `Nexora@2025` |
| Customer | `riya.mehta@example.com` | `Customer@2025` |

All other seeded customers use `Customer@2025`. The admin console is at `/admin`.

---

## Screenshots

| | |
|---|---|
| **Home** — `docs/screenshots/home.png` | **Catalogue with filters** — `docs/screenshots/products.png` |
| **Product detail** — `docs/screenshots/product-detail.png` | **Cart and checkout** — `docs/screenshots/checkout.png` |
| **Admin dashboard** — `docs/screenshots/dashboard.png` | **Product management** — `docs/screenshots/admin-products.png` |
| **Fulfilment queue** — `docs/screenshots/admin-orders.png` | **Customers** — `docs/screenshots/admin-customers.png` |

---

© Nexora Retail Pvt. Ltd. Demo data is fictional.