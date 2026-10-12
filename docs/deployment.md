# Build and release

Use Node 22 LTS and npm ci from the committed lockfile. Set public provider endpoints before exporting. Run npm run check, npx expo install --check, npm run build:web, npm run build:native, and npm audit. dist is generated and ignored.

The CI pipeline runs clean installation, lint/format/tests, SDK compatibility validation, web/native exports, and a high-severity dependency audit. The audit is a real gate and currently has unresolved findings; do not describe the pipeline as fully green until these are resolved or formally reviewed.

Exports contain JavaScript and assets, not signed binaries. EAS credentials, store identifiers, app signing, hosting, OTA updates, and production service accounts are intentionally not fabricated. A maintainer must select provider capacity and terms, verify a development build on actual Android/iOS devices, configure signing and platform identifiers, and run accessibility/privacy checks before distribution. Validate native file replacement and recovery across restart and simulated storage failures.

For a web deployment, choose a static host supporting the exported bundle and review HTTPS, CORS, CSP and provider identification. The browser map remains unavailable. No hosting or release has been performed by this audit.

Rollback by rebuilding a previously verified commit with its lockfile and endpoint configuration. Existing storage keys/shapes were retained. No schema migration is required for valid existing records. Preserve device data before experimenting with releases: history now has a versioned JSON text export/restore workflow verified in regression tests. Profiles and prices are not included, and native sharing/OS backup behavior still requires device verification.

The app must remain usable without a paid API/service. Manual mode is the guaranteed on-device fallback; online demo endpoints require network access and remain capacity-limited. A public release must either meet their terms or use suitable free infrastructure; a paid provider is not a prerequisite.
