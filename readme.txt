=== MRTY TV ===
Contributors: muhamadishlah
Tags: digital-signage, mosque, prayer-times, vue
Requires at least: 5.9
Tested up to: 6.7
Stable tag: 1.1.0
Requires PHP: 7.4
License: GPLv2 or later

Vue 3 digital signage display for Masjid Raya Taman Yasmin.

== Description ==

MRTY TV is a reactive digital signage plugin built with Vue 3.
It displays prayer times, image/video/campaign slides, and a prayer
engine state machine — all updating in real-time without page reloads.

Forked from WM Digital Signage with a complete frontend rewrite.

== Features ==

* Vue 3 reactive UI — settings changes update instantly, no page reload
* 5-state prayer engine: NORMAL → APPROACHING → ADZAN → IQAMAH → SHOLAT
* Content slider with image, video, and campaign support
* Per-prayer time adjustments (+/- 30 minutes)
* Cached content hash polling for performance
* Server-side rendered loading skeleton
* REST API endpoints for slides and settings

== Changelog ==

= 1.1.0 =
* Feature: Added Dynamic Running Text (fetches latest posts from Pengumuman, Agenda, etc.)
* Feature: Added Manual Coordinates setting for Prayer Times (no API dependency)
* Feature: Added Slider Limits (limit quantity of Slides, Videos, Campaigns)
* Fix: Standardized Campaign data in slider (Target, Collected, QRIS)

= 1.0.0 =
* Initial release — Vue 3 fork of WM Digital Signage v1.4.0
