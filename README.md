# FuelTrip PK

React Native / Expo application for estimating fuel cost for trips in Pakistan. Select origin and destination, configure a vehicle's km/litre and a fuel price, and estimate one-way or return travel costs.

## Features and scope

- Manual one-way distance entry works offline, without GPS or any API/service.
- Optional explicit place search in Pakistan, current foreground location, and free OSRM driving routes.
- Shortest of the alternatives returned by OSRM (not a guarantee of the globally shortest route).
- Manually configured petrol/diesel prices; bundled values are **examples, not current prices**.
- Vehicle profiles and the latest 25 trip results stored on the device.
- Export history as private JSON text and restore a validated backup, with replacement confirmation.
- Native map preview with OpenStreetMap attribution and native result sharing.
- Browser calculation and storage; browser map preview is intentionally unavailable.

This is an estimate, not navigation, a payment calculation, or a source of official fuel prices. Return trips double the outbound distance; reverse-route differences, tolls, traffic, and vehicle conditions are not modeled.

## Requirements and setup

Use Node 22 LTS (SDK minimum: 20.19) and npm. Android/iOS device testing requires a compatible Expo Go or development build.

```sh
npm ci
npm start
# or npm run android / npm run ios / npm run web
```

Optional: copy .env.example to .env and set EXPO_PUBLIC_GEOCODING_URL and EXPO_PUBLIC_ROUTING_URL to approved HTTPS provider endpoints with compatible Nominatim and OSRM response contracts. These values are embedded in the bundle: **never include credentials or secrets**. Restart Expo after changes. No server, database, account, or API secret is required.

**Free-service requirement:** No paid API, subscription, billing account or API key is required. Manual-distance calculations, profiles and history work on-device. Online features use optional free public endpoints; they are not unlimited.

Public endpoints are demonstration defaults with no availability guarantee. Public Nominatim has a strict usage policy, including an aggregate one-request-per-second limit and no autocomplete. The client uses explicit search, caching, and per-instance throttling, which cannot enforce limits across a distributed app. Choose an approved provider or a controlled proxy before a public release. Browser identification and CORS also require provider review.

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

Screens orchestrate user actions. Calculator logic is pure; services isolate provider HTTP requests; collection storage validates records and serializes updates; appStorage implements browser localStorage and SDK 54 legacy filesystem access. Existing storage keys and filenames remain compatible.

- src/screens: calculation, result, fuel prices, vehicles, history
- src/components: reusable controls, native map, render failure boundary
- src/services: calculation, prices, geocoding, routing, bounded HTTP requests
- src/storage: durable adapter and serialized collection operations
- src/utils: invariants, formatting, constants, confirmation and configuration
- tests: calculation, persistence, provider, configuration and UI regressions
- .github/workflows/quality.yml: reproducible installation and quality gate

Stored routes contain precise location information. Storage is unencrypted and not cloud synchronized. Failed writes surface errors; corrupt collections are preserved and are not silently replaced with defaults. History failure does not discard a successfully calculated estimate.

## Engineering documentation

[Audit](ENGINEERING_AUDIT.md) · [Architecture](docs/architecture.md) · [Decisions](docs/decisions.md) · [Testing](docs/testing.md) · [Security](docs/security.md) · [Deployment](docs/deployment.md)

Developed by Asad Abbas.

## History backup and restore

Open History and choose Export History Backup. On mobile, save or share the complete JSON text through your device; on web, copy the JSON shown in the backup field into a private text file. To restore, paste the full text and choose Restore History Backup, then confirm replacement. Only history is included: fuel prices and vehicle profiles remain unchanged. Invalid, oversized, unknown-version and duplicate-ID backups are rejected before writing. Keep backups private because they contain route labels and, for online trips, coordinates.
