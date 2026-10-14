# Build and release

Use Node.js 22.13 or newer and npm ci from the committed lockfile. Set public provider endpoints before exporting. Run npm run check, npx expo install --check, npx expo-doctor, npm run build:web, npm run build:native, and npm audit. dist is generated and ignored.

The CI pipeline runs clean installation, lint/format/tests, SDK compatibility validation, Android preview prebuild/resource checks, web/native exports, and a high-severity dependency audit. The audit is a real gate and currently has unresolved findings; do not describe the pipeline as fully green until these are resolved or formally reviewed.

Exports contain JavaScript and assets, not signed binaries. The isolated EAS preview APK profile is documented in [Android preview](android-preview.md). Production store identifiers, private release signing, hosting, OTA updates and service accounts still require maintainer decisions. A maintainer must select provider capacity and terms, verify a development build on actual Android/iOS devices, configure signing and platform identifiers, and run accessibility/privacy checks before distribution. Validate native file replacement and recovery across restart and simulated storage failures.

For a web deployment, choose a static host supporting the exported bundle and review HTTPS, CORS, CSP and provider identification. The browser map remains unavailable. No hosting or release has been performed by this audit.

Rollback by rebuilding a previously verified commit with its lockfile and endpoint configuration. Existing storage keys/shapes were retained. No schema migration is required for valid existing records. Preserve device data before experimenting with releases: the current file backup includes trips, profiles, prices and preferences, with validated merge/replace and rollback coverage. Export it from History before changing installed app identities. Repeat native sharing/OS backup checks in the APK.

The app must remain usable without a paid API/service. Manual mode is the guaranteed on-device fallback; online demo endpoints require network access and remain capacity-limited. A public release must either meet their terms or use suitable free infrastructure; a paid provider is not a prerequisite.

After pulling the SDK 57 upgrade, stop the old development server, run npm ci, then npx expo start --clear. Use Expo Go for SDK 57. A new signed development/production binary is needed if using a standalone native build; this audit exports JavaScript/assets only and does not perform store publication. Expo Go does not fully reproduce release splash appearance, which still requires release-device QA.
