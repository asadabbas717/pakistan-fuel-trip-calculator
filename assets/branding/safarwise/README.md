# SafarWise brand artwork

Generated raster artwork for the SafarWise identity, integrated into the application header, home journey panel, launcher and native splash configuration.

- `app-icon.png`: full-bleed square icon featuring an S-shaped road, forward arrow and sun.
- `logo-light.png`: dark wordmark on transparency for light surfaces.
- `logo-dark.png`: ivory wordmark on a teal background for dark presentation panels.
- `journey-artwork.png`: Pakistan-inspired mountain road illustration for welcome screens, banners or promotional materials. Decorative artwork, not an actual route or map.

Suggested brand palette: midnight teal `#102E32`, mint `#80DFC1`, warm gold `#E8BE67`, ivory `#F2F7F5`.

Runtime assets are `launcher.png` (1024 square), `favicon.png` (64 square), `wordmark-light.png` and `wordmark-dark.png` (652 by 217), and `journey.jpg` (960 by 640, about 139 KB). Original PNG artwork remains available above. The header uses the transparent dark wordmark on light surfaces and the ivory wordmark on its own teal plate in dark mode, across all three palettes. The landscape sits below accessible live headings, never behind body text.

These are raster assets, not vector master files. The full-bleed launcher uses the standard Expo icon pipeline; it is not a transparent Android adaptive foreground. Native splash variants follow the device appearance; the in-app header follows the user's saved appearance. Launcher and splash changes require a new native build and device verification.

The displayed name is SafarWise (SafarWise Preview for testing). Existing EAS project, installation identifiers, persistent storage keys and backup format identifiers intentionally remain compatible with earlier versions. Existing backups still restore. Reports, new exported filenames and user-facing messages use SafarWise.
