# Current engineering decisions

These are decisions introduced during the October 2026 audit, not reconstructed historical intent.

## Keep the framework and small module boundaries

Context: The existing screens/services/storage split fits a client-only calculator. Decision: retain Expo SDK 54, JavaScript, navigation, and UI. Alternative: rewrite or introduce class-based domain/repository layers. Those add migration risk without a concrete benefit. Consequence: small shared validators and HTTP helper enforce real boundaries; static checking is linting rather than full TypeScript analysis.

## Fail explicitly when persistence fails

Context: Memory fallback returned success despite device/browser write failures. Decision: remove fallback and propagate errors to callers; preserve existing keys and JSON shapes. Alternative: silently use defaults or ephemeral storage. Consequence: users see failures, and corrupt data is retained; there is no automatic corruption-repair UI yet.

## Serialize updates and retain native replacement backup

Context: Concurrent collection reads can overwrite one another; SDK 54 iOS legacy move deletes the destination before moving. Decision: in-process queues, temporary writes, and a previous-file backup. Alternative: SQLite or a new storage dependency. The existing scope does not require relational queries or a schema migration. Consequence: low migration cost, but no multi-tab transaction guarantee and no device-verified crash-consistency claim.

## Validate numeric and external data before use

Context: Infinity and malformed geometry could reach cost and map interpolation. Decision: finite domain validation, range-checked locations, strict numeric route payloads, and timeout-bound HTTP. Alternative: trust UI controls/providers. Consequence: malformed responses become visible failures; estimate arithmetic remains JavaScript floating point, appropriate to a non-payment estimate.

## Preserve demo defaults and expose deployment limitations

Context: Public geocoding/routing servers are unsuitable as an unrestricted app infrastructure. Decision: configurable HTTPS endpoints, Photon autocomplete with caching, cancellation and throttling, and documented provider policy limits. Alternative: invent a server or claim client throttling solves aggregate limits. Consequence: public release requires an approved provider and device/CORS verification. Web uses a clear map-unavailable message because react-native-webview does not implement a browser map.

## Free operation and recovery follow-up

Context: The owner requires no paid API/service, and public endpoints can fail or rate-limit. Decision: retain optional online routing and add a user-entered distance workflow that performs no provider/GPS request. Manual records explicitly identify their source and contain no invented coordinates or travel time. Trade-off: distance accuracy is the user’s responsibility; this is estimation, not offline navigation.

History backup uses bounded, versioned JSON text through existing sharing/copy controls, not a new cloud service. Only one collection is restored after full validation; a multi-collection restore was avoided because the current storage has no cross-key transaction. Existing profiles/prices are not modified.

## Narrow PostCSS security override

Expo Metro pins PostCSS to 8.4 while patched releases are in 8.5. The same-major override is scoped to @expo/metro-config, with a real SDK CSS-worker contract check and all-platform exports. A blanket framework upgrade or image-size v2 override was rejected because the latter changes the default-export API Metro uses. Unpatched upstream roots remain reported rather than suppressed. No dependency/licensing choice introduces a paid runtime service.

## Upgrade to SDK 57 for Expo Go compatibility

The owner requested SDK 57 after the SDK 54 project failed to open in their SDK 57 Expo Go. Migration is staged through the intervening SDK versions and runtime/test versions are aligned using Expo’s bundled compatibility map. Storage keeps its legacy API import, supported by SDK 57, to preserve existing keys/filenames and avoid an unrelated data migration. Historical SDK 54 decisions above describe the original audit; the current framework target is SDK 57. React Native becomes 0.86 and the minimum Node version becomes 22.13. Android 7+ and iOS 16.4+ are minimums, not a promise of compatibility with all devices or future Expo Go versions. The free-service constraint remains unchanged.

SDK 57 migration details: the obsolete splash configuration became the expo-splash-screen plugin with the same settings. Expo Doctor is part of CI. The test-only optional react-server-dom-webpack peer is pinned to its compatible 19.1.9 branch, allowed by Jest Expo’s peer contract; the app has no server-component feature. The old PostCSS override is no longer needed, and the SDK CSS-worker compatibility test now resolves the current toolchain layout. Unit tests replace the new lazy native fetch bridge at the HTTP boundary instead of suppressing native teardown warnings.
