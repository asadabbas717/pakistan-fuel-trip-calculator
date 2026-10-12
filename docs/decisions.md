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

Context: Public geocoding/routing servers are unsuitable as an unrestricted app infrastructure. Decision: configurable HTTPS endpoints, explicit search caching/throttling, and documented provider policy limits. Alternative: invent a server or claim client throttling solves aggregate limits. Consequence: public release requires an approved provider and device/CORS verification. Web uses a clear map-unavailable message because react-native-webview does not implement a browser map.
