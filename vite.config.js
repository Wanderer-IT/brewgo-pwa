import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.png", "icons/apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Brew Go",
        short_name: "Brew Go",
        description: "Order ahead, reorder your favorites and earn rewards with Brew Go coffee.",
        lang: "en",
        categories: ["food", "shopping"],
        theme_color: "#5b2f1a",
        background_color: "#fbf3de",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Never cache anything that changes data. Explicit NetworkOnly rules, one per mutating method.
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/"), handler: "NetworkOnly", method: "POST" },
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/"), handler: "NetworkOnly", method: "PATCH" },
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/"), handler: "NetworkOnly", method: "PUT" },
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/v1/"), handler: "NetworkOnly", method: "DELETE" },

          {
            urlPattern: ({ url }) => /^\/api\/v1\/(auth|checkout|webhooks|payments|cart|orders|users|rewards|favorites|notifications|ai|contact|home)/.test(url.pathname),
            handler: "NetworkOnly",
          },
          // Public menu data: show the cached copy immediately, refresh it in the background.
          {
            urlPattern: ({ url, request }) => request.method === "GET" && /^\/api\/v1\/(products|categories|branches)/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "menu-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24 hours
              cacheableResponse: { statuses: [0, 200] }, // never store 4xx/5xx
            },
          },
          // Product photos barely change: cache first.
          {
            urlPattern: ({ url, request }) => request.destination === "image" && (url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/")),
            handler: "CacheFirst",
            options: {
              cacheName: "product-images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: { target: "es2020" },
});
