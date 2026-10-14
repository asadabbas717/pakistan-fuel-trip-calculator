# Release-readiness review — 15 October 2026

Scope: current app source, dependency lockfile, native preview generation, free-service architecture, existing automated tests, and the owner's reported phone tests. This is not a production-release approval.

## Completed in this pass

- Added a dedicated 24 dp bottom gap between Clear History and the backup card. Row-level delete buttons keep their existing compact spacing.
- Prepared isolated Android preview configuration, a local native-project generator, and an Expo EAS APK profile. The ordinary Expo Go and web configurations remain unchanged apart from the shared project linkage and permission hardening.
- Generated the native preview successfully. Verified the application ID, release variant's debug signing, resize keyboard mode, transparent system bars, and disabled navigation-bar contrast enforcement in the generated project.
- Blocked unnecessary system-overlay and broad external-storage permissions. Foreground location permissions remain; document import/export uses the system picker and app-owned files.
- Preserved the no-paid-runtime-services requirement. Build services are optional; cloud builds must stay within the verified free allowance.
- Corrected obsolete backup documentation: current backups include trips, vehicles, prices and preferences, and use a file picker rather than pasted JSON.

## Dependency findings

Registry scans on this date reported **63 affected package entries** (49 high, 14 moderate, no critical). With `--omit=dev`, npm still reports **41 entries** (27 high, 14 moderate). These counts include dependency chains, not 63 independent vulnerabilities. Expo's CLI/configuration tools also occur in the production dependency graph; `--omit=dev` does not establish APK runtime reachability.

| Root advisory                                                                          | Installed/published latest checked         | Decision                                                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| [braces recursion DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)              | 3.0.3                                      | No published patched version found; retain security gate and track upstream.           |
| [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | 1.4.0                                      | No published patched version found; review build/signing tool exposure.                |
| [sprintf-js precision DoS](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)          | 1.1.3                                      | No published patched version found; do not accept untrusted format strings in tooling. |
| [uuid output buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq)         | 7.0.3 installed under xcode; latest 14.0.3 | A major transitive replacement needs compatibility review; do not force it globally.   |

No direct imports of these packages were found in app source. That narrows the review but does not certify that none can enter a bundle transitively. Keep the existing CI high-severity audit gate; do not suppress findings or run `npm audit fix --force`. Its suggested Expo/RN downgrades would conflict with SDK 57.

## Gates before public distribution

1. Finish the APK build and test that actual artifact. JavaScript exports and native prebuild alone do not satisfy this gate. See [build instructions](android-preview.md).
2. Complete the device matrix below, including permission changes and cold starts.
3. Resolve or explicitly review dependency exposure and compatible remediations. Quality checks can pass while the dependency security gate remains red.
4. Review Photon, OSRM and OpenStreetMap tile policies/capacity for the intended audience. Per-device throttling is not a fleet-wide quota. Keep the offline manual-distance fallback. No paid provider is required.
5. Finish the app icon/splash, permanent application identity, private production signing, privacy notice/contact and store declarations. No store submission has been configured.

## Native build issue found by EAS

The first cloud build reached Android resource linking and failed because the splash theme referenced `@drawable/splashscreen_logo` while the plugin had no image configured. JavaScript exports did not detect this native resource error. The config now explicitly references the existing `assets/splash-icon.png`; preview preparation checks the generated drawable, and a regression test validates the configured PNG. These are existing template assets, not final brand artwork. Expo Doctor also requested the compatible SDK 57 patch, so the app remains on SDK 57 while updating its patch version.

## Device acceptance matrix

| Check                                                                        | Evidence/status                                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| PDF/image/text reports, Drive restore, swapped Maps endpoints                | Owner reported successful phone tests in Expo Go; repeat in APK.                                        |
| Refreshed UI, keyboard visibility, light/dark themes and system bars         | Owner reported good phone results except the Clear History gap fixed here; repeat in APK.               |
| Clear History: Cancel, Android Back, Delete, then export/import              | Automated cancellation/duplicate-action tests exist; verify final spacing on phone.                     |
| Denied GPS, revoked permission, location lookup failure                      | Complete on APK; current location failure must leave manual mode usable.                                |
| Offline cold start, stale prices, failed refresh, manual override            | Automated coverage exists; verify readable saved-price status and no loss of manual values on APK.      |
| Fast edits during slow search, invalid route, server timeout                 | Deterministic tests exist; repeat with poor connectivity on APK.                                        |
| Corrupt/oversized backup, cancelled picker, failed restore, restart recovery | Automated coverage exists; repeat against the system picker without risking the only copy of real data. |
| Large text, narrow phone, TalkBack, Urdu names, Reduce Motion, Back          | Finish on APK. Preserve entered values and ensure controls remain visible and reachable.                |

## Privacy findings to carry into the release notice

History contains location labels and coordinates; app storage and exported JSON are not encrypted. Clear/delete affects app records, not previously exported files. The Android template currently allows OS-managed app backups; do not claim that data can never enter a device/cloud backup. Search sends entered queries to Photon; routing sends selected coordinates to OSRM; map tiles disclose the viewed area to OpenStreetMap; opening directions hands endpoints to the chosen map application. Sharing/Drive destinations are selected by the user. Price refresh reads a public GitHub-hosted feed. No account, advertising SDK or custom analytics service is implemented by the app.

Publish a reviewed, reachable privacy notice and contact before release. Do not equate no developer-operated backend with no network data sharing.
