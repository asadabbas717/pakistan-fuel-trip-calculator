# SafarWise

React Native / Expo application for estimating fuel cost for trips in Pakistan. Select origin and destination, configure a vehicle's km/litre and a fuel price, and estimate one-way or return travel costs.

## Features and scope

- Manual one-way distance entry works offline, without GPS or any API/service.
- Automatic place suggestions, readable foreground GPS addresses and free OSRM driving routes.
- Shortest of the alternatives returned by OSRM (not a guarantee of the globally shortest route).
- Automatic dated PSO benchmark prices with offline cache and manual pump-price overrides. Bundled fallback values remain **examples, not current prices**.
- Default vehicle and remembered fuel choice, recent destinations, route swapping, repeat trips and searchable history with individual deletion. Latest 25 trips are retained.
- Export a private JSON backup file containing trips, vehicles, prices and preferences; preview and merge or replace a validated backup. Legacy history files are accepted.
- Native map preview, directions handoff, share-card images, PDFs and text exports.
- Browser calculation and storage; browser map preview is intentionally unavailable.

This is an estimate, not navigation, a payment calculation, or a source of official fuel prices. Return trips double the outbound distance; reverse-route differences, tolls, traffic, and vehicle conditions are not modeled.

## Requirements and setup

Use Node.js 22.13 or newer and npm. This project targets Expo SDK 57 and React Native 0.86. Use Expo Go for SDK 57 or a matching development build. Minimum platform versions are Android 7 and iOS 16.4. Later Expo Go SDK releases will need a future project upgrade; an SDK upgrade does not guarantee support for every device.

```sh
npm ci
npm start
# or npm run android / npm run ios / npm run web
```

Optional: copy .env.example to .env and set EXPO_PUBLIC_GEOCODING_URL and EXPO_PUBLIC_ROUTING_URL to approved HTTPS provider endpoints with compatible Photon GeoJSON and OSRM response contracts. These values are embedded in the bundle: **never include credentials or secrets**. Restart Expo after changes. No server, database, account, or API secret is required.

**Free-service requirement:** No paid API, subscription, billing account or API key is required. Manual-distance calculations, profiles and history work on-device. Online features use optional free public endpoints; they are not unlimited.

Public endpoints are demonstration defaults with no availability guarantee. Photon supports search-as-you-type. Suggestions appear after a 750 ms typing pause (minimum three characters), with caching, cancellation and serialized requests at least 1.1 seconds apart per app instance. The public demo permits reasonable usage, can throttle heavy use and has no uptime guarantee. Choose an approved provider or a controlled proxy before a public release. Browser identification and CORS also require provider review.

## Development and verification

```sh
npm run check          # lint, formatting, behavioral tests
npm run format        # apply formatting
npx expo install --check
npm run build:web
npm run build:native  # Android and iOS JavaScript/assets export
npm audit
```

Exports are bundle checks, not signed APK/IPA builds. CI runs these checks and a high-severity dependency security gate. Known unresolved advisories currently prevent a clean security gate; see ENGINEERING_AUDIT.md. No deployment or store submission is configured.

## Architecture and structure

Screens orchestrate user actions. Calculator logic is pure; services isolate provider HTTP requests; collection storage validates records and serializes updates; appStorage implements browser localStorage and SDK 57 legacy filesystem access. Existing storage keys and filenames remain compatible.

- src/screens: calculation, result, fuel prices, vehicles, history
- src/components: reusable controls, native map, render failure boundary
- src/services: calculation, prices, geocoding, routing, bounded HTTP requests
- src/storage: durable adapter and serialized collection operations
- src/utils: invariants, formatting, constants, confirmation and configuration
- tests: calculation, persistence, provider, configuration and UI regressions
- .github/workflows/quality.yml: reproducible installation and quality gate

Stored routes contain precise location information. Storage is unencrypted and not cloud synchronized. Failed writes surface errors; corrupt collections are preserved and are not silently replaced with defaults. History failure does not discard a successfully calculated estimate.

## Engineering documentation

[Audit](ENGINEERING_AUDIT.md) · [Architecture](docs/architecture.md) · [Decisions](docs/decisions.md) · [Testing](docs/testing.md) · [Security](docs/security.md) · [Deployment](docs/deployment.md) · [Android preview APK](docs/android-preview.md) · [Release readiness](docs/release-readiness.md)

Developed by Asad Abbas.

## History backup and restore

Open **History → Export backup file** to save/share a JSON file containing trips, vehicles, prices and preferences. To restore, choose **Choose backup file**, review the validated contents, select **Merge** or **Replace**, then confirm. Legacy history-only backups remain supported. Invalid, oversized, unknown-version and duplicate-ID backups are rejected before writing. Keep backup files private because they contain locations. Restored appearance/default trip preferences may require restarting the app.

## Appearance and location suggestions

Open **Theme** in the header to choose Forest & mint, Ocean & lavender, or Terracotta & sand, with Light, Dark, or Automatic device mode. Preferences stay on your device. Subtle entrance animations respect Reduce Motion. Screens include bottom and landscape side safe-area spacing so system navigation controls do not cover actions.

Type a starting point or destination and choose an automatic suggestion; there are no location search buttons. Calculation remains an explicit action after choosing locations and vehicle settings. Existing custom geocoding configuration must use a Photon-compatible endpoint; replace old Nominatim URLs using `.env.example` and restart Expo. Photon and routing require internet; manual distance remains fully offline and requires no paid service.

## Expo Go file handling and map previews

Native PDF exports request PDF bytes from Expo Print and write them into this project's own cache before sharing. Android backup selection retains the provider content URI and copies it into project-owned import storage before size checks and JSON parsing. Cleanup is restricted to owned paths and cannot replace a successful operation or its original error. The original Drive document is preserved.

Google Maps handoff includes both selected endpoints, including reversed trips. Manual trips require both place names before opening directions. Map previews embed the pinned Leaflet 1.9.4 JavaScript/CSS locally, use simplified OSRM overview geometry, and show loading, timeout and retry feedback. OpenStreetMap tiles still require internet; no tiles are bulk downloaded or stored for offline use. Library source and its BSD license are in src/vendor; regenerate from the official leaflet@1.9.4 npm package using scripts/bundle-map-assets.cjs and then run Prettier.
