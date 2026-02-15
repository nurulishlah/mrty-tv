=== MRTY TV ===
Contributors: muhamadishlah
Tags: digital-signage, mosque, prayer-times, vue
Requires at least: 5.9
Tested up to: 6.7
Stable tag: 1.3.3
Requires PHP: 7.4
License: GPLv2 or later

Vue 3 digital signage display for Masjid Raya Taman Yasmin.

== Description ==

MRTY TV is a reactive digital signage plugin built with Vue 3.
It displays prayer times, image/video/campaign slides, and a prayer
engine state machine — all updating in real-time without page reloads.

**New in 1.2.0:**
* **Modular Prayer Engine**: Set different Iqamah durations for each prayer.
* **Friday Support**: Special handling for Jumu'ah (Friday Dhuhr).
* **Simulation Mode**: Test prayer transitions with `?sim_time=HH:mm`.

Forked from WM Digital Signage with a complete frontend rewrite.

== Features ==

* Vue 3 reactive UI — settings changes update instantly, no page reload
* 5-state prayer engine: NORMAL → APPROACHING → ADZAN → IQAMAH → SHOLAT
* Content slider with image, video, and campaign support
* Per-prayer time adjustments (+/- 30 minutes)
* **[NEW]** Modular Prayer Engine: Set different Iqamah durations for each prayer
* **[NEW]** Friday Jumu'ah Support: Special duration and label for Friday Dhuhr
* **[NEW]** Simulation Mode: Test prayer transitions with `?sim_time=HH:mm`
* Cached content hash polling for performance
* Server-side rendered loading skeleton
* REST API endpoints for slides and settings

== Changelog ==

= 1.3.3 =
* Fix: Prayer overlay now correctly restores active state (Adzan/Iqamah/Sholat) on page refresh

= 1.3.2 =
* Feature: Improved Video Slider to play full video duration (YouTube & MP4)
* Feature: Optimized slide transitions with image preloading
* Fix: Fallback timeout for video slides to prevent stalling

= 1.3.1 =
* Fix: Correctly fetch Agenda items by mapping to 'event' post type

= 1.3.0 =
* Feature: Added Configurable Running Text Limits for all CPTs (Pengumuman, Agenda, etc.)
* Fix: Improved icon rendering by switching to Material Symbols
* Fix: Preserved content within shortcodes while stripping tags
* Perf: Re-enabled content hash caching for better performance

= 1.2.1 =
* Fix: Prevent Prayer Engine state reset on content auto-refresh

= 1.2.0 =
* Feature: Modular Prayer Engine (Per-prayer Iqamah durations)
* Feature: Friday Jumu'ah Support (Special duration & label)
* Feature: Simulation Mode (Test with `?sim_time=HH:mm`)
* Fix: Prevent skipping Adzan when approaching state ends exactly on the minute

= 1.1.0 =
* Feature: Added Dynamic Running Text (fetches latest posts from Pengumuman, Agenda, etc.)
* Feature: Added Manual Coordinates setting for Prayer Times (no API dependency)
* Feature: Added Slider Limits (limit quantity of Slides, Videos, Campaigns)
* Fix: Standardized Campaign data in slider (Target, Collected, QRIS)

= 1.0.0 =
* Initial release — Vue 3 fork of WM Digital Signage v1.4.0
