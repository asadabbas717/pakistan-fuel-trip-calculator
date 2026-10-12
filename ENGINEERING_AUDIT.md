# Engineering Audit

Audit date: 12 October 2026. Baseline: commit `23d7590`. Scope: all tracked application source, configuration, assets inventory, lockfile, documentation and available Git history. Scores are engineering judgments relative to this small client-only calculator, not certifications.

## Executive Summary

The baseline had a sensible small screens/services/storage structure and working-looking core flows, but no automated tests or CI. Persistence routinely swallowed failures and returned success, domain validation accepted non-finite numbers, and provider payloads were trusted. Those are more consequential than formatting. The repository was a prototype/student-level implementation with polished portfolio prose.

The original audit retained Expo SDK 54, JavaScript, React Navigation, the screen design, and existing valid user-data formats. A later owner-authorized migration now targets SDK 57; see the migration section below. They add explicit persistence failures, serialized updates, native recovery copies, domain/provider validation, bounded network requests, location selection regressions, meaningful tests, reproducible quality checks, and accurate documentation. The final assessment is **portfolio quality with substantially stronger engineering controls**. Unresolved dependency advisories, provider policy/capacity concerns, and missing device verification prevent a production-grade rating.

## Original Score

| Category              | Score |
| --------------------- | ----: |
| Architecture          |     6 |
| Code Quality          |     5 |
| SOLID / Design        |     6 |
| Domain Modeling       |     4 |
| Security              |     4 |
| Reliability           |     3 |
| Testing               |     0 |
| Database/Persistence  |     3 |
| Performance           |     6 |
| Configuration         |     3 |
| Dependencies          |     4 |
| Logging/Observability |     2 |
| UI/UX Robustness      |     4 |
| Accessibility         |     3 |
| Documentation         |     4 |
| Developer Experience  |     3 |
| CI/CD                 |     0 |
| Deployment/Release    |     2 |
| Repository Hygiene    |     7 |
| Overall               |   3.6 |

Database schema, authentication, server API authorization, transactions involving payments, migrations and cloud synchronization are N/A. Persistence remains relevant because the app saves settings and routes locally. Concurrency is relevant to asynchronous collection updates and search; relational query optimization is not.

## Major Problems Found

- **P1: false persistence success and data-loss risk.** `appStorage` caught write failures and used temporary memory while returning success. Vehicle/trip/price operations also swallowed failures. A restart could lose apparently saved data. Removed this behavior and added failure-path regression tests. This is high priority for this app; no evidence establishes a catastrophic P0 incident.
- **P1: concurrent lost updates.** History and vehicle saves independently read then rewrote collections. Added collection queues and adapter queues, including failure recovery and clear/save ordering tests.
- **P1: invalid domain arithmetic.** The original calculator returned `{distanceKm: Infinity, fuelNeeded: Infinity, totalCost: Infinity}` for infinite distance; this was directly reproduced from the baseline source. Added finite positive input, boolean flag and overflow validation, with tests. Negative input sanitization could turn a negative price/average into a positive one; input now preserves signs for validation.
- **P1: untrusted coordinates and route shapes.** The original route and map code assumed valid geometry and interpolated origin/destination directly into script. Validation now rejects invalid ranges and nonnumeric values before URL construction or map interpolation. This mitigates the unsafe interpolation boundary; no remotely exploitable attack was demonstrated.
- **P1: dependency security findings.** The first locked install reported 46 advisories (13 moderate, 31 high, 2 critical). Compatible fixes removed the critical findings in the recorded final scan. Unresolved advisories remain; see the Security Review.
- **P2: indefinite provider requests.** Geocoding and routing had no timeout or error contract validation. Requests now abort after 15 seconds, with HTTP errors, response validation and cleanup tests. There are no automatic retries to amplify provider load.
- **P2: stale selection and async results.** Location text did not reflect external current-location selection, and editing text left old coordinates selected. Added value synchronization, selection invalidation and stale-result rejection with component regression tests.
- **P2: corrupt data silently treated as missing.** Invalid collections could become defaults/empty history and subsequently be overwritten. Reads now reject malformed records, preserve stored bytes, and surface failures. Repair/export tooling remains debt.
- **P2: public-service deployment assumptions.** Per-client request controls cannot enforce Nominatim's aggregate usage requirements. Added explicit search caching/throttling, HTTPS endpoint configuration, and documented the need for an approved production provider.
- **P2: unsupported web map and broad native navigation.** Browser WebView mapping was not a supported implementation. Web now states map preview availability clearly; native map top-level navigation is restricted. Route/cost calculation remains available on web.
- **P2: missing quality gate and inaccurate product copy.** No tests, lint, formatting gate or export verification existed. The fuel-price screen contained an implementation-specific "Android Fix Applied" claim and suggested permissive input handling. Copy now describes actual input requirements and example prices.

### Uncontrolled-generation signals

The 398-line storage module duplicated legacy/new filesystem paths, loaded the same module twice, swallowed broad failures, and ultimately reported volatile memory as durable success. This was complexity without a reliable contract, and was replaced with one deliberate SDK-compatible adapter. Happy-path-only calculation/provider logic and the absence of tests weakened confidence in the portfolio claims. Product UI contained implementation commentary. These are concrete quality signals; they do not establish who or what authored the code. Useful components and existing module boundaries were retained.

## Changes Implemented

- Centralized finite numeric, geographic and endpoint invariants in small utilities.
- Preserved full route precision for sorting/calculation; rounded only output estimates.
- Added one timeout-bound HTTP helper and provider payload checks.
- Added bounded geocoding cache and per-instance request serialization; explicit search remains explicit.
- Simplified storage to browser localStorage or `expo-file-system/legacy`, preserving keys and filenames. Added temporary writes, previous-file native recovery copies and per-key serialization.
- Serialized collection mutations, generated distinct record IDs, validated reads/writes, and preserved malformed collections rather than silently resetting them.
- Kept successful estimates available when history saving fails, with a visible warning.
- Prevented duplicate calculation/profile/price submissions; handled price reset/share failures; confirmed destructive profile/history/price actions.
- Added control labels/roles/selection states, corrected external location synchronization, and added a render error boundary without logging route details.
- Added test/lint/format/export scripts, locked compatible development tools, CI with read-only repository permissions, and a real security gate.
- Removed unused `expo-status-bar`; refreshed the lockfile within the existing stack. Removed `CLAUDE.md` and `.claude/settings.json` at the owner's explicit request after verifying they only configured Claude tooling. `AGENTS.md` remains applicable Expo guidance.
- Rewrote README and added concise architecture, decisions, testing, security and deployment documentation. Ignored test caches and added cross-platform text normalization.

## Architecture

```text
App boundary -> Navigation -> Screens -> UI components
                              |-> Calculator -> domain validators
                              |-> Routing / Geocoding -> HTTP -> HTTPS providers
                              |-> Prices / Vehicles / History -> appStorage
                                                                  |-> localStorage
                                                                  |-> Expo legacy files
```

Provider and persistence details remain out of reusable UI controls except the location-search control's explicit geocoding service dependency. No repository/service hierarchy, backend, database, interfaces, or class conversions were added for appearance. See [architecture](docs/architecture.md) and [current decisions](docs/decisions.md).

## Critical Workflows

| Workflow                                  | Protection and verification                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| One-way and return estimate               | Pure calculator tests: arithmetic, precision, finite inputs, overflow and return flag                                           |
| Origin/destination search                 | Input validation, explicit submission, cache/throttle; provider and component tests                                             |
| Edit selection / current-location display | Selection cleared on editing, external value synchronized; component tests                                                      |
| Current location permission               | Existing foreground permission/error path retained; actual GPS/permission dialogs require device testing                        |
| Route alternatives and failures           | Full-distance sorting, geographic validation, shape checks, HTTP/timeout tests                                                  |
| Configure/reset fuel prices               | Finite positive prices, durable writes, error propagation, reset-failure tests; destructive-action confirmation                 |
| Save/delete vehicle profiles              | Collection validation and serialization; concurrent-write and failure tests; delete confirmation                                |
| Save/reopen/clear history                 | Last-25 retention, unique IDs, corruption validation, serialized clear/save tests; UI catches failures                          |
| Persistence failure/restart recovery      | Adapter tests cover quota/denial, temporary-write failure and backup reads; OS restart/crash guarantees unverified              |
| Render/share result and map               | Numeric map boundary, restricted native navigation, share error prompt, render boundary; native Share/WebView need device tests |
| Install/build/release                     | Clean locked install, lint/format/tests, SDK version check and bundle exports; signing/deployment remain unconfigured           |

## Testing Strategy

Unit tests protect calculation, configuration, parsing and invariants. Integration-level tests exercise real collection operations against fake persistence, actual adapter orchestration against fake filesystem/browser interfaces, and actual provider parsing against deterministic HTTP responses. Component tests exercise actual React hooks and selection/search callbacks with host controls substituted; they do not claim native layout fidelity. Tests protect behavior rather than a coverage target.

No device/emulator E2E, signed-build tests, live-provider contract suite, benchmark or accessibility certification was performed. Device QA is documented in [testing](docs/testing.md). The original non-finite calculator bug was characterized directly against `HEAD` before verifying the new regression tests.

### Executed checks

- `npm ci --ignore-scripts --no-audit`: passed from the final lockfile (1196 packages). A temporary lockfile mismatch during tool installation was corrected before this successful clean install.
- `npm run check`: passed; ESLint and Prettier passed, with **45 tests across 9 suites**, plus the real SDK CSS-worker check after the follow-up. This includes a short-route regression where legitimate rounded-zero fuel estimates remain saveable.
- `npx expo install --check`: passed against online SDK metadata. An earlier sandbox run used offline metadata and was not treated as equivalent online verification.
- `npm run build:web`: passed for the final source (539 modules).
- `npm run build:native`: passed for the final source, with Android and iOS Hermes exports. An initial sandbox attempt failed because Hermes could not write its temporary bytecode file; rerunning with filesystem access succeeded.
- `git diff --check` and source cleanup search: passed; no TODO/FIXME/HACK/XXX/debug console.log markers remained in application/tests. Tool-generated editing scripts were removed.
- `npm audit --json` and `npm audit --omit=dev --json`: executed and returned nonzero because unresolved vulnerabilities remain. They are **not passing security checks**. Snapshots and counts are below.

An initial component-test run timed out while loading native test controls. Lightweight host controls now exercise the actual component hooks/callbacks deterministically; no behavioral assertion was removed. Device/native-control rendering is explicitly outside this test's claim. GitHub-hosted CI has not been executed here; its constituent commands were run locally, and its security gate currently fails by design on the recorded unresolved findings.

## Security Review

No real secrets were identified in the tracked source/configuration inspected. This is not a forensic guarantee about all history or ignored files. Git history was reviewed without rewriting it; it consists of an initial implementation and several README/hygiene commits. No authentication, SQL or payment subsystem exists.

Security improvements include strict numeric/geographic boundaries, fixed storage key validation, HTTPS-only public configuration without embedded credentials, native map navigation restrictions, visible storage/network errors, compatible dependency fixes, and CI dependency scanning. See [security](docs/security.md).

Recorded scan snapshots: [all dependencies](docs/dependency-audit.json), [without dev dependencies](docs/dependency-audit-production.json). The all-dependency scan reported **58 findings (45 high, 13 moderate, 0 critical)** after adding test tooling and completing the SDK 57 migration. The production-dependency scan reported **36 (23 high, 13 moderate, 0 critical)**. Counts include propagated transitive findings; they are not distinct exploitable application flaws. Expo/RN declare build tooling as dependencies, so `--omit=dev` does not establish runtime reachability.

Current root advisories include braces pattern recursion, node-forge signature validation, sprintf-js precision denial of service and uuid buffer bounds. SDK 57 removes the previously reported image-size root from the recorded scan. Automatic suggested resolutions include incompatible Expo/RN/Jest version changes, and some roots have no patched version in the scanned range. No blanket major upgrade or speculative override was applied. The CI high-severity audit gate is intentionally unresolved rather than suppressed. Release requires a supported-stack migration/triage with compatibility verification, not simply accepting raw severity counts.

## Data Integrity

Valid existing storage keys, filenames and JSON record shapes are retained. Writes report success only after the selected persistent backend completes. Failed operations reject; invalid existing collections block mutations instead of being replaced. Collection queues protect in-instance read-modify-write sequences; adapter queues protect native temporary paths. The native previous-file backup mitigates the iOS legacy replacement gap and is used when the main file is missing. It does not make a filesystem a transactional database, coordinate tabs, repair malformed primary JSON automatically, or guarantee recovery from every crash. Browser quota/private-mode denial and native full-disk failures are explicit.

Trip geometry and numeric fields are validated, but persisted estimates remain historical snapshots, not cryptographically authenticated records. Money is a rounded estimate using JavaScript floating point; it is not suitable for accounting/payment settlement. Precise location history and native recovery copies are unencrypted. Clear history removes the associated backup and temporary files.

## Remaining Technical Debt

- Native device tests for persistence overwrite/recovery, permission dialogs, GPS, map and sharing.
- Approved geocoding/routing capacity and identification policy for public release; per-client throttling is insufficient for aggregate usage.
- Upstream fixes and advisory reachability review for the remaining toolchain roots; the SDK migration is complete, but the current audit gate remains red.
- Profile/price backup and corruption-diagnosis tooling, plus optional multi-tab write coordination if web usage expands. History export/restore is now available.
- Full accessibility QA and improved inline error/loading/empty states across every screen; labels alone are not certification.
- Error telemetry and complete lifecycle cancellation for GPS/route operations if the product needs stronger operational support.
- Native map asset bundling/integrity controls and browser map implementation if those become requirements.
- Full static typing is not introduced; meaningful linting and boundary tests mitigate but do not eliminate this limitation.

## Remaining Risks

Demo providers can deny requests, change responses, fail CORS, or be unavailable. Public deployment may violate provider terms without additional infrastructure. Native backup behavior is orchestration-tested, not device crash-tested. Multiple browser tabs can still overwrite collections. Unencrypted routes and remotely loaded map scripts remain privacy/supply-chain concerns. Bundled prices are examples and route/return calculations omit traffic, tolls and reverse-route differences. A clean bundle export does not establish runtime, store-signing, or release readiness.

## Final Score

| Category              | Score |
| --------------------- | ----: |
| Architecture          |     7 |
| Code Quality          |     7 |
| SOLID / Design        |     7 |
| Domain Modeling       |     7 |
| Security              |     5 |
| Reliability           |     7 |
| Testing               |     7 |
| Database/Persistence  |     6 |
| Performance           |     6 |
| Configuration         |     7 |
| Dependencies          |     5 |
| Logging/Observability |     4 |
| UI/UX Robustness      |     6 |
| Accessibility         |     5 |
| Documentation         |     8 |
| Developer Experience  |     8 |
| CI/CD                 |     7 |
| Deployment/Release    |     4 |
| Repository Hygiene    |     8 |
| Overall               |   6.4 |

Overall is the rounded unweighted category mean. No 10/10 claim is warranted. The category is **portfolio quality**, with production release blocked by the documented security/provider/device-verification gaps.

## Recommended Next Steps

1. Review upstream fixes for remaining SDK/toolchain advisories and verify their reachability. The SDK 57 migration is now completed; device verification remains.
2. Select approved provider infrastructure, identification, CORS and aggregate rate control before public distribution.
3. Run documented native restart/failure, permission, map/share and accessibility workflows; add device E2E for the main calculation path.
4. Extend the tested history backup workflow to profiles/prices only with a deliberate cross-collection restore strategy; preserve user data and validate native sharing.

## Deliberately Unchanged

The app's language, framework, navigation, small UI/component architecture and non-payment estimate arithmetic were retained. No cloud sync, account system, SQL database, microservices, manufactured abstractions, automated official fuel-price feed, or signed release configuration was invented. No Git history was rewritten and no deployment was performed. The initial audit changes were committed and pushed as b9b4cbe at the owner’s request; subsequent changes are tracked in the follow-up below.

## Free-service follow-up — 12 October 2026

The owner authorized commit/push and the recommendations, with the requirement that no paid API/service is needed to run the app. The audit baseline was pushed as b9b4cbe. This follow-up adds:

- Manual one-way distance entry, with optional place labels and the existing one-way/return calculator. It makes no routing, geocoding, map or GPS request. The source is explicit, with no invented coordinates or travel-time estimate. Existing online records remain readable without migration. Online features remain optional free public services subject to capacity/policy limits.
- A versioned history-only JSON text backup via native sharing or browser copy, and confirmed restoration. All records, version/kind, duplicate IDs and bounds (25 trips, 2 million text characters) are checked before one serialized collection write. Malformed backups leave current history untouched. Profiles and prices are not overwritten. Backup text contains location information and must be saved privately.
- Additional accessible button roles/labels for quick actions, location results and vehicle choices. This improves semantics but is not device accessibility certification.
- A narrowly scoped override of Expo Metro’s PostCSS dependency from its pinned 8.4 line to **8.5.23**, retaining SDK 54 and the public PostCSS 8 API. The actual SDK CSS worker contract is exercised in a separate Node test; it processes a temporary CSS project and preserves the output. Full web/native exports are also checked. No image-size major override was imposed because Metro consumes its v1 default-export API. No paid dependency, cloud account, billing configuration or API key was added.

Final follow-up verification: npm run check passes, including lint, formatting, 45 application tests in 9 Jest suites, and one SDK CSS-worker compatibility test. Lockfile validation passed with npm ci --dry-run --ignore-scripts --no-audit; the original full clean installation also passed before this one-package override. The non-breaking audit fix found no further compatible changes. After the PostCSS override, the refreshed reports contain 56 total / 34 without dev dependencies; PostCSS is no longer reported. The security gate still fails and remains visible. Web, Android and iOS exports and the online Expo compatibility check passed after the PostCSS override. Native permission/share-sheet, physical-device restart/crash and screen-reader QA remain unverified.

Upstream references: [PostCSS path handling advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849), [unpatched braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [unpatched node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), and [Nominatim usage limits](https://operations.osmfoundation.org/policies/nominatim/). The rating remains conservatively portfolio quality; added features do not remove the documented release gaps.

## SDK 57 migration — 13 October 2026

The owner requested an upgrade after Expo Go reported SDK 57 while the project targeted SDK 54. The final framework set is Expo 57.0.28, React Native 0.86.3, React/React DOM/test renderer 19.2.3, and Jest Expo 57.0.6 with the separate React Native Jest preset 0.86.3. Expo’s compatibility map aligned the native libraries. Node.js now requires 22.13 or newer; platform minimums are Android 7 and iOS 16.4. SDK compatibility means matching the installed Expo Go SDK, not automatic compatibility with every device or future Expo Go major release.

The migration passed through SDK 55 and 56, with all 45 behavioral tests passing on each aligned runtime set. Initial npm peer-resolution failures were caused by the stale installed graph and the optional React-server test peer selecting a patch above the SDK’s pinned React version. A clean SDK 55 resolution/install succeeded. The optional React-server peer is now pinned to 19.1.9, which satisfies Jest Expo’s declared allowed peer range and React 19.2.3, without declaring an unused server-rendering feature as an app dependency. No legacy-peer-deps or forced install was used. The final dependency tree and lockfile checks pass.

SDK 56’s lazy native fetch implementation needed an explicit HTTP fake in Jest setup to avoid initializing native logging during teardown. Actual HTTP/provider behavior tests retain their failure, timeout, parsing and coordinate assertions. Generated .expo/dist folders are excluded from test discovery. The original installed-package recovery directory was removed after the replacement was verified. The SDK 54 PostCSS override was removed because the current Expo toolchain accepts the patched PostCSS 8 line; its actual CSS-worker contract remains regression-tested using the package’s current layout.

Expo Doctor rejected the removed top-level splash field. It was migrated to the SDK-matched expo-splash-screen config plugin, preserving the existing contain/background settings. Doctor is now included in CI to catch future configuration migrations. Storage continues to use the documented SDK 57 legacy filesystem API, preserving storage keys, filenames and record/backup formats. AGENTS.md and current documentation now refer to SDK 57. No business logic or free-service workflow was removed, and no paid API/service or billing requirement was introduced.

Final checks: npm run check passes (45 tests in 9 suites plus the real Expo CSS-worker test), Expo Doctor passes 21/21 checks, expo install --check passes, npm ls --depth=0 reports a valid dependency set, and npm ci --dry-run validates the final lockfile. Web/Android/iOS exports pass with the final splash configuration, and the public manifest confirms sdkVersion 57.0.0. The original clean SDK 55 npm ci also passed; a full clean SDK 57 install has not been separately repeated locally. Physical-device GPS, share/map behavior, crash recovery and release splash appearance remain unverified.

Refreshed security reports contain 58 all-dependency findings / 36 without dev dependencies, with zero critical findings. Propagated counts are not unique application exploits. Remaining root packages are braces, node-forge, sprintf-js and uuid; the security audit is still nonzero and the CI security gate remains red. Upgrade diagnostics passing is not a claim that dependency security is clean.

References: [SDK 57 requirements](https://docs.expo.dev/versions/v57.0.0/), [incremental upgrade guidance](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [SDK 57 legacy filesystem](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem-legacy/), and [splash plugin configuration](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/).
