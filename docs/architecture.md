# Architecture

FuelTrip PK is a small, client-only Expo SDK 54 application. There is no backend, database, authentication, or cloud synchronization.

```text
App render boundary -> React Navigation -> Screens -> Components
                                          |-> Calculator -> numeric invariants
                                          |-> Routing / Geocoding -> HTTP client -> HTTPS providers
                                          |-> Prices / Vehicles / History -> appStorage
                                                                            |-> localStorage (web)
                                                                            |-> Expo legacy files (native)
```

Screens own interaction state, prompts, navigation, and permission handling. They do not perform provider fetches. Cost calculations use full route precision and round only the displayed result to two decimals. Route choice sorts full distances before rounding. A return estimate doubles distance without a second routing request.

All collections keep their existing keys: FUEL_TRIP_PK_PRICES, FUEL_TRIP_PK_VEHICLES, FUEL_TRIP_PK_HISTORY. Native files remain in documentDirectory/fuel-trip-storage/<key>.json. Reads validate records at the collection boundary. Corrupt data rejects and is preserved rather than reset automatically.

Vehicle and history read-modify-write operations have independent in-process queues. Adapter operations are also queued by key. Browser writes are synchronous localStorage operations. Native writes complete a temporary file, retain the previous main file as a .bak copy, then replace the main file. If the main file is absent, reads use .bak. This mitigates replacement interruption; it is not a database transaction or a guarantee against every OS/filesystem failure. A corrupt main JSON file is not silently replaced with its backup. Clear history removes the main, temporary, and backup files.

Queues do not coordinate multiple browser tabs or processes. Native filesystem and device lifecycle behaviors require device verification. HTTP requests abort after 15 seconds including JSON decoding. Explicit place searches share a bounded 50-query cache and request queue. Obsolete location results are ignored by request generation when text, selection, or component lifetime changes.
