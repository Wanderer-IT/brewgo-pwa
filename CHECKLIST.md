# Frontend <-> Express.js Contract & PWA Checklist: status

Legend: **[x]** done and checked (how is in brackets) | **[ ]** only you can do this (needs a real browser, phone or your live URL).
"UI test" = an automated test that renders the real pages against the running API (32 tests, run 8 times in a row, all green).
These tests are not included in the zip: they need extra packages (vitest, jsdom) that are outside the course material.

## A. API contract alignment

### A1. Envelope and error handling
- [x] One API client for `/api/v1` [`src/api/client.js` is the only file that calls `fetch`; checked by search]
- [x] Success envelope parsed in list views (pagination from `meta`) [`usePagedList`, UI tests: Menu, Orders]
- [x] Success envelope parsed in detail views [`useFetch`, UI tests: product detail, order detail]
- [x] Error envelope parsed into a typed `ApiError` (`code`, `message`, `details`, `requestId`) [`client.js`]
- [x] `requestId` shown for support [`ErrorAlert` prints "Reference: ..."; UI test 503]. Small toasts do not show it.
- [x] Non-JSON / network failures give a generic error [UI test: HTML 502 page -> "Request failed (502)" + Try again; offline -> "You're offline"]
- [x] 401 -> clear session, redirect to login, return URL kept [UI test: 401 on /orders -> login -> back on Orders]
- [x] 403 -> "not authorized" message, no redirect loop [UI test]. Note: the customer app never calls staff endpoints, so there is no dedicated 403 page; the message appears where the request was made. `ProtectedRoute role="admin"` shows a notice too.
- [x] 409 -> stock conflict / illegal order state with a prompt to refresh [UI tests: checkout shows "only 1 left" + "Review your cart" and refreshes the cart; cancelling an order in the wrong state shows the message and reloads the order]
- [x] 422 -> field-level errors on the inputs [UI test: register; login/contact/profile/checkout use the same mapping]
- [x] 422 COUPON_EXPIRED -> inline coupon error, checkout recoverable [UI test: error appears in the coupon box, Pay button stays enabled, retry succeeds]
- [x] 503 AI_UNAVAILABLE -> AI fallback [UI test]

### A2. Idempotency
- [x] `crypto.randomUUID()` per attempt [`utils/idempotency.js`, key looks like `bg-<uuid>`; UI test]
- [x] Sent in the `Idempotency-Key` header on the checkout POST [`api/endpoints.js`; UI test]
- [x] Button disabled while in flight [`Checkout.jsx`]
- [x] Same key for retries of the same attempt, new key when the order changes [UI test: retry after 503 reuses the key; switching payment method gets a new one]
- [x] Double-click creates one order [UI test: 1 request, +1 order. Server test: same key twice at once -> one order]

## B. Payment flow (Maya sandbox)

### B1. Checkout submission
- [x] `/checkout` posts shipping/pickup details **and the coupon code** to the backend [`Checkout.jsx`; UI test checks the request body]
- [x] Frontend never talks to Maya/PayMongo [search of `src/` and the built bundle: no Maya URLs or keys]
- [x] Redirect with `window.location.href = checkoutUrl` [`Checkout.jsx`; UI test]
- [x] Loading state during the redirect [button stays disabled and reads "Please wait..."]
- [x] 409/422/etc. shown inline without leaving the page [UI tests]

### B2. Return pages
- [x] `/payment/success` never marks an order as paid itself [`PaymentResult.jsx`]
- [x] `/payment/cancelled` never marks an order as cancelled/failed itself, and its wording never comes from URL parameters [UI test]
- [x] Both ask the API (`POST /orders/:id/reconcile`, then `GET /orders/:id`) [UI test]
- [x] Status comes only from the backend response [UI test]
- [x] Pending handled with polling (success page) and a "Check again" button [UI test]
- [x] Missing / invalid order id handled [UI test: no id -> message, unknown id -> "Order not found"]
- [x] Visiting `/payment/success` for an unpaid order shows "Confirming your payment", not "paid" [UI test]

## C. Grounded AI interface
- [x] Queries go only to the backend AI endpoint, no AI keys in the frontend [`aiApi`; bundle search]
- [x] Product cards come from the API's database records [`ProductCard` fed by `data.products`]
- [x] Prices and stock never come from AI text (the summary line is written by the server, cards show API fields) [`AiAssistant.jsx`, `aiService.js`]
- [x] Labeled "AI-Assisted" [UI test]
- [x] No `dangerouslySetInnerHTML` anywhere [search of `src/`]
- [x] All text rendered as plain text [React escaping; the server also never echoes the raw query]
- [x] `maxLength` 200 and a character counter [`AiAssistant.jsx`]
- [x] Empty / whitespace queries blocked [`ask()` trims and needs 3+ characters]
- [x] 503 -> friendly message + automatic keyword-search fallback labeled "Menu search" [UI test]
- [x] Loading, empty-results and error states [button text, "I couldn't find a match" message, `ErrorAlert`]
- [x] Offline disables the assistant with a message [UI tests: offline]

## D. PWA configuration

### D1. Manifest
- [x] name, short_name, description, `start_url: "/"`, `display: "standalone"`, `orientation: "portrait"`, theme_color, background_color [checked in the built `manifest.webmanifest`]
- [x] PNG icons 192x192 and 512x512 [`public/icons/`]
- [x] Maskable icon: the 512 icon is `purpose: "any maskable"` (as in the Lesson 10 guide), with the artwork inside the safe zone
- [x] Manifest linked in `index.html` [built file contains `<link rel="manifest">`]
- [ ] Detected in DevTools > Application > Manifest with no warnings, and no manifest warnings in Lighthouse

### D2. Service worker and caching
- [x] App shell precached (46 files, 421 KiB) [build output]
- [x] `GET /api/v1/products` (also categories, branches) -> StaleWhileRevalidate [`menu-api-cache`, 100 entries, 24 h, only status 0/200]
- [x] Product images -> CacheFirst [`product-images`, 80 entries, 30 days, only status 0/200]
- [x] Cache names, max entries and max age configured
- [x] `navigateFallback: /index.html` (deny-list for `/api/`)
- [x] Update flow: prompt (`ReloadPrompt`, `registerType: 'prompt'`)
- [x] Never cached: POST / PATCH / PUT / DELETE, `/checkout`, `/auth`, `/webhooks` (plus payments, cart, orders, users, rewards, favorites, notifications, ai, contact, home) [explicit NetworkOnly routes, inspected in the built `sw.js`]
- [ ] Confirm in DevTools > Application > Cache Storage that only `workbox-precache-*`, `menu-api-cache` and `product-images` exist

## E. Offline UX

### E1. Banner
- [x] Persistent, non-intrusive banner while `navigator.onLine` is false [`OfflineBanner`, sticky at the top of the app column]
- [x] Listens to `online` / `offline` events [`useOnlineStatus`]
- [x] Disappears when the connection returns [UI test]
- [x] `role="status"`, does not cover other UI [it sits in the page flow]

### E2. Offline behavior
- [ ] Previously browsed catalog items viewable offline [the rules are in place; confirm with DevTools > Network > Offline after browsing online once]
- [x] Cart viewable offline from a saved copy, including when the app is reopened offline [UI test: fresh start with no network shows the saved cart; the saved profile keeps you "logged in" for viewing]
- [x] Checkout, payment, AI assistant and login disabled with informative messages/tooltips [UI tests]. Add-to-cart, register and send-message are disabled too.
- [x] Failed offline fetches show a friendly state instead of crashing [menu pages say "You're offline and this part of the menu isn't saved on your phone yet"; account pages say they need a connection]

## F. Final verification (yours to run)
- [ ] Lighthouse PWA audit passes (installable)
- [ ] Installs on a phone (Android Chrome / iOS "Add to Home Screen")
- [ ] DevTools > Network > Offline test: catalog and cart load, blocked actions are disabled
- [x] Simulated 401, 403, 409, 422, 503 each show the right UI [UI tests above]
- [x] Double-submit test passes [UI test]
- [x] No secrets (AI keys, payment secret keys) in the frontend bundle [search of the built `dist/`]
