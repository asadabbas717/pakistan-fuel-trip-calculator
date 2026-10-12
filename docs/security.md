# Security and privacy

The application has no accounts, password store, server-side permissions, SQL, or payment flow. Authentication, database injection, CSRF and backend rate limits are therefore not implemented features.

Location permission is requested only for foreground current-location use. Queries and endpoints are sent to the configured geocoder/router; native maps load Leaflet from unpkg and tiles from OpenStreetMap. Those services can receive IP addresses and route/view information. Trip history contains exact locations. Browser storage and app document files (including a previous-file recovery backup) are unencrypted. Do not store sensitive route history on a shared device. Clear History deletes history and its native recovery files; uninstall/browser data clearing removes local data, subject to OS backup behavior.

Only fixed application key names can reach storage paths. Provider coordinates must be finite and within geographic ranges before routing or interpolation into map HTML. The native map blocks top-level navigation away from its inline document; this does not restrict its necessary network subresources. Remote Leaflet supply-chain risk remains. Endpoint settings require HTTPS and exclude embedded credentials/query parameters. EXPO_PUBLIC values are public bundle content, never secret storage.

No real credentials were identified in the tracked source/configuration inspected. This is not a forensic guarantee that historical or ignored data contains none. Signing/environment files remain ignored. Claude-specific project configuration was removed at the owner's request.

Run npm audit and review root advisories rather than raw counts alone. Compatible automatic fixes were applied; unresolved SDK/toolchain advisories remain and must be reviewed before release. Do not apply audit --force blindly: suggested fixes include incompatible framework changes. CI's security gate intentionally fails on unresolved high-severity findings. The public Nominatim endpoint has aggregate usage and identification requirements that client-only throttling cannot satisfy at release scale.

References: [SDK 54 filesystem](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/) and [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/).

No paid service or API key is required. Manual-distance mode avoids all routing/geocoding and map requests. Optional public online endpoints retain policy/availability limits. History backup text is unencrypted and contains precise locations for online trips; save it privately. Restore validates the app/version/kind envelope, length, 25-record limit, all record fields and duplicate IDs before persistence. It replaces history only; it does not synchronize to a cloud account.
