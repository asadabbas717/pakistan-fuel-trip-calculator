# Architecture

FuelTrip PK is a small, client-only Expo SDK 57 application. There is no backend, database, authentication, or cloud synchronization.

```text
App render boundary -> React Navigation -> Screens -> Components
                                          |-> Calculator -> numeric invariants
                                          |-> Routing / Geocoding -> HTTP client -> HTTPS providers
                                          |-> Prices / Vehicles / History -> appStorage
                                                                            |-> localStorage (web)
                                                                            |-> Expo legacy files (native)
```

Screens own interaction state, prompts, navigation, and permission handling. They do not perform provider fetches. Cost calculations use full route precision and round only the displayed result to two decimals. Route choice sorts full distances before rounding. A return estimate doubles distance without a second routing request.

Existing collections keep their keys: FUEL_TRIP_PK_PRICES, FUEL_TRIP_PK_VEHICLES, FUEL_TRIP_PK_HISTORY. Native files remain in documentDirectory/fuel-trip-storage/<key>.json. Reads validate records at the collection boundary. Corrupt data rejects and is preserved rather than reset automatically.

Collection mutations share an in-process queue so full-backup restore cannot interleave with price, history, vehicle or preference mutations. Adapter operations use one queue; multi-key restores journal old values before writing and recover them after failure or on startup. Browser writes are synchronous localStorage operations. Native writes complete a temporary file, retain the previous main file as a .bak copy, then replace the main file. If the main file is absent, reads use .bak. This mitigates replacement interruption; it is not a database transaction or a guarantee against every OS/filesystem failure. A corrupt main JSON file is not silently replaced with its backup. Clear history removes the main, temporary, and backup files.

Queues do not coordinate multiple browser tabs or processes. Native filesystem and device lifecycle behaviors require device verification. HTTP requests abort after 15 seconds including JSON decoding. Automatic place suggestions share a bounded 50-query cache and request queue. Obsolete location results are ignored by request generation when text, selection, or component lifetime changes.

Manual trips use route.source = "manual", name-only places, an empty coordinate array and null travel time. Existing online trip records remain valid. The manual service uses the same pure calculator and never calls providers. History backup version 1 wraps the existing record array; restore validates the whole envelope and all records before one serialized collection write. Legacy text is bounded to 2 million characters and 25 distinct trip IDs. Full app backups version 2 also validate vehicles, prices and preferences; file imports are bounded to 2 MB. Merge preserves current duplicate records and settings. Restore journals old collection values before a batch write.

File-transfer ownership: Android DocumentPicker keeps the provider URI and the app copies it into scoped cache before reading. Print returns base64 bytes so PDFs never depend on cross-scope file copies. Shared files remain in the owned export cache for receiving apps; best-effort cleanup only targets owned paths and never masks operation outcomes.

Map initialization uses bundled, pinned Leaflet JS/CSS and canvas paths/circle markers; only tiles require external requests. Simplified route geometry reduces preview payload while cost/duration use the provider's separate numeric fields. Native map feedback receives initialization/tile events, times out after 12 seconds and supports explicit retry. Map source construction is memoized independently of loading state.
