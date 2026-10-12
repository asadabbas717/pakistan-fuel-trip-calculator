# Testing

Run npm ci, then npm run check. Jest uses the SDK-compatible jest-expo preset and a repository-local ignored cache. ESLint catches undefined and unused bindings and understands JSX. Prettier checks consistent formatting. These checks do not provide full type analysis.

Behavioral tests cover one-way/return estimates, rounding without intermediate truncation, invalid and overflow input, concurrent collection saves, failed writes and recovery, history retention and deletion, corrupt data preservation, fuel-price validation, browser quota/access denial, native temporary-write failure and backup reads, provider response shape, coordinate order, route sorting, HTTP errors, request timeout cleanup, and HTTPS configuration.

Persistence collection tests fake only the storage boundary; adapter tests exercise actual adapter orchestration against fake localStorage/filesystem boundaries. Provider tests exercise actual parsing using deterministic HTTP fakes. These do not establish native OS guarantees or live service reliability.

Manual release workflows: deny/grant foreground location; edit a selected place and select another result; change input during a pending search; save/restart/reopen prices and profiles; calculate both trip modes; reopen/delete history with confirmation; simulate storage/full-disk failure; share/cancel/share failure; exercise native map attribution and links; use TalkBack/VoiceOver, keyboard navigation, large text and narrow screens; verify provider outage and CORS.

No emulator/device E2E automation, signed-build verification, performance benchmark, or accessibility certification is claimed. Export checks compile the web and native bundles but do not execute device UI or filesystem code.

Follow-up tests cover the actual manual Home-screen workflow (no routing/GPS calls), one-way/return manual estimates, invalid distances, source-specific history validation, mixed online/manual backup round trips, invalid/duplicate/oversized backup rejection, restore write failures and restore/save ordering. A history backup is text for user-managed storage; native share-sheet behavior still needs device testing.

The npm run check gate also runs a separate Node compatibility test against the installed Expo SDK PostCSS worker. It validates the narrow security override with a temporary local CSS project, not a mock of the transformer.

SDK 57 upgrade validation includes Expo Doctor (21 checks) and Expo’s online package compatibility check. Jest uses the separate @react-native/jest-preset required by React Native 0.86. tests/setup.js supplies an explicit fetch fake for tests; no live provider request or physical native fetch bridge is claimed. Generated .expo/dist directories are excluded from module discovery.

Appearance and autocomplete coverage verifies system dark mode, palette persistence, startup races, save failures, 48-pixel bottom and landscape side insets, automatic debounce, minimum query length, cancelled/stale responses, selection without repeat requests, and Photon parsing/caching. Browser verification used a 390×844 viewport in dark ocean and light terracotta themes, live Karachi suggestions, and a manual trip result. Native exports compile successfully; Android navigation-button/gesture modes, keyboard and large-font layouts still need physical-device verification.
