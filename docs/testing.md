# Testing

Run npm ci, then npm run check. Jest uses the SDK-compatible jest-expo preset and a repository-local ignored cache. ESLint catches undefined and unused bindings and understands JSX. Prettier checks consistent formatting. These checks do not provide full type analysis.

Behavioral tests cover one-way/return estimates, rounding without intermediate truncation, invalid and overflow input, concurrent collection saves, failed writes and recovery, history retention and deletion, corrupt data preservation, fuel-price validation, browser quota/access denial, native temporary-write failure and backup reads, provider response shape, coordinate order, route sorting, HTTP errors, request timeout cleanup, and HTTPS configuration.

Persistence collection tests fake only the storage boundary; adapter tests exercise actual adapter orchestration against fake localStorage/filesystem boundaries. Provider tests exercise actual parsing using deterministic HTTP fakes. These do not establish native OS guarantees or live service reliability.

Manual release workflows: deny/grant foreground location; edit a selected place and select another result; change input during a pending search; save/restart/reopen prices and profiles; calculate both trip modes; reopen/delete history with confirmation; simulate storage/full-disk failure; share/cancel/share failure; exercise native map attribution and links; use TalkBack/VoiceOver, keyboard navigation, large text and narrow screens; verify provider outage and CORS.

No emulator/device E2E automation, signed-build verification, performance benchmark, or accessibility certification is claimed. Export checks compile the web and native bundles but do not execute device UI or filesystem code.

Follow-up tests cover the actual manual Home-screen workflow (no routing/GPS calls), one-way/return manual estimates, invalid distances, source-specific history validation, mixed online/manual backup round trips, invalid/duplicate/oversized backup rejection, restore write failures and restore/save ordering. A history backup is text for user-managed storage; native share-sheet behavior still needs device testing.

The npm run check gate also runs a separate Node compatibility test against the actual Expo SDK 54 PostCSS worker. It validates the narrow security override with a temporary local CSS project, not a mock of the transformer.
