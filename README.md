# Brew Go PWA

Mobile-first, installable, offline-aware coffee ordering app. React + Vite + `vite-plugin-pwa` (Workbox).
It talks only to the Brew Go REST API (`/api/v1`) and contains **no backend code and no secret keys**.

## Run it

```bash
npm install
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:3000/api/v1
npm run dev                   # development (the service worker is OFF in dev)
npm run build && npm run preview   # production build WITH the service worker (use this to test the PWA)
```

Start the API first (see the API README: `npm start`). Demo login: `maya.santos@email.com` / `Password123`.

To pay with real Maya sandbox: run the API with `PAYMENT_PROVIDER=maya` (default when you copy its `.env.example`), add something to the cart, choose **Maya / E-wallet** or **Card** at checkout, and use Maya's sandbox test wallet or cards listed in the API README.

## Where each requirement lives

| Finals requirement | Where |
|---|---|
| Semantic HTML + responsive CSS tokens | `index.html`, `src/index.css` (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, CSS variables, grid/flex) |
| Reusable components | `src/components/` (`ProductCard`, `BottomNav`, `OfflineBanner`, `SkeletonLoader`, `BottomSheet`, `QuantityStepper`, `ReloadPrompt`...) |
| Props + `useState` | `QuantityStepper`, `ProductDetail` (options, quantity), filter sheet in `Products` |
| `useEffect` + cleanup | `hooks/useFetch.js`, `hooks/usePagedList.js` (AbortController), `hooks/useOnlineStatus.js`, polling in `Orders`/`OrderDetail`, cart sync in `CartContext` |
| Conditional rendering + lists + keys | skeletons, `EmptyState`, `ErrorAlert`, product/order lists with stable `key` |
| Context | `AuthContext` (token + role), `CartContext` (optimistic updates synced with `/cart`), `NetworkStatusContext`, `FavoritesContext`, `ToastContext` |
| Controlled forms + validation | `Login`, `Register`, `Checkout`, `Contact`, coupon box, `AiAssistant`, search (debounced), `utils/validators.js` |
| Routing (react-router-dom) | `src/App.jsx`: `/`, `/products`, `/products/:id`, `/ai-assistant`, `/cart`, `/checkout`, `/payment/success`, `/payment/cancelled`, `/orders`, `/orders/:id`, `/login`, `/register`, plus `/rewards`, `/profile`, `/favorites`, `/notifications`, `/contact` and a 404. `ProtectedRoute` guards customer pages. |
| `/admin/*` | **Not built** (optional in the brief). Staff actions are available through the API (Postman collection). |
| API envelope + error codes | `src/api/client.js` (parses `{success,data,meta}` / `{success:false,error,requestId}`; 401 -> login), `utils/errors.js` (codes -> friendly messages) |
| Idempotent checkout | `pages/Checkout.jsx` + `utils/idempotency.js` (new `Idempotency-Key` per attempt, button disabled while in flight) |
| Truthful payment return pages | `pages/PaymentResult.jsx` (asks the API to verify with Maya, then shows the order's real status; never marks paid itself) |
| Grounded AI UI | `pages/AiAssistant.jsx` ("AI-Assisted" label, 200-char limit, no `dangerouslySetInnerHTML`, 503 -> keyword-search fallback) |
| Manifest + icons | `vite.config.js` (name, short_name, `display: standalone`, `orientation: portrait`, theme/background colors, 192 + 512 PNG, 512 is `any maskable`), `public/icons/` |
| App shell precache | Workbox `globPatterns` in `vite.config.js` |
| Runtime caching | `StaleWhileRevalidate` for `/api/v1/products|categories|branches`, `CacheFirst` for product images, `NetworkOnly` for auth/checkout/payments/cart/orders/users/webhooks and every POST/PATCH/PUT/DELETE; only status `0` and `200` are cached |
| Offline UX | `OfflineBanner` (persistent while `navigator.onLine` is false); saved menu browsable; cart viewable from a local copy; Checkout, Login, Register, AI, Add to cart disabled with messages |
| Update prompt | `ReloadPrompt` (`registerType: 'prompt'`) |
| Lazy routes | `React.lazy` for every page in `App.jsx` |
| SPA rewrites | `vercel.json`, `public/_redirects` (Netlify) |

## Design notes

- **Public menu GETs go out without the login token** (`auth:false`), so the service worker can cache them safely: a cached response can never leak one customer's data to another. Favorites are loaded separately (`FavoritesContext`).
- The cart copy in `localStorage` is **only for viewing offline**. Totals always come from the server.
- System font stack (no web fonts): faster first paint and nothing extra to cache offline.
- Pickup "QR": the app shows the big pickup code (e.g. `BG-8921`). No QR library was added.

## Deploy (Vercel or Netlify, HTTPS)

1. Set `VITE_API_BASE_URL` to your **HTTPS** API URL (for example `https://brewgo-api.example.com/api/v1`).
2. On the API: set `FRONTEND_URL` and `CORS_ORIGINS` to your deployed app URL (otherwise the browser blocks requests and Maya sends customers back to localhost).
3. Build command `npm run build`, output folder `dist`. The SPA rewrite files are already included, so `/products/1` and `/payment/success` never 404.

## Before your defense (things only you can do)

- [ ] Run **Lighthouse** (Chrome DevTools, Mobile preset) on the live URL and screenshot all five scores: Performance >= 75, Accessibility >= 85, Best Practices >= 85, SEO >= 80, PWA installable. I could not run Lighthouse or a real browser while building this, so no scores are claimed here. If Performance is low, the usual fixes are real compressed product photos and checking that the API is not slow to wake up.
- [ ] Check the four viewports in DevTools (360x800, 390x844, 412x915, 800x600) for horizontal scrolling.
- [ ] DevTools > Application: manifest has no warnings, service worker is activated, `menu-api-cache` and `product-images` fill up, then tick **Offline** and reload.
- [ ] Do one full sandbox payment (Maya wallet + a card) and one cash order.
- [ ] Be ready to explain: why `-D` for `vite-plugin-pwa`, precache vs runtime cache, why mutations are `NetworkOnly`, what the Idempotency-Key prevents, and why the payment return page asks the server instead of trusting the URL.
