<?php
/**
 * MRTY TV — Signage View Template
 *
 * Minimal HTML shell that loads the Vue 3 app.
 * All dynamic content is rendered by Vue components.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

$settings = MRTY_TV::get_settings();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Signage - <?php bloginfo( 'name' ); ?></title>

    <!-- IcoFont icons -->
    <link rel="stylesheet" href="<?php echo esc_url( MRTY_TV_URL . 'assets/css/icofont.css' ); ?>">

    <!-- Google Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">

    <!-- Plugin styles -->
    <link rel="stylesheet" href="<?php echo esc_url( MRTY_TV_URL . 'assets/css/signage.css?v=' . MRTY_TV_VERSION ); ?>">
</head>
<body>

    <!-- Vue app mount point -->
    <div id="app">
        <!-- Server-side loading skeleton (visible until Vue mounts) -->
        <div class="signage-container">
            <header class="signage-header">
                <div class="header-left">
                    <?php
                    $logo_url = get_theme_mod( 'logo_masjid' );
                    if ( $logo_url ) : ?>
                        <div class="mosque-logo-wrap">
                            <img src="<?php echo esc_url( $logo_url ); ?>" alt="Logo" class="mosque-logo" />
                        </div>
                    <?php endif; ?>
                    <div class="mosque-info">
                        <h1 class="mosque-name"><?php bloginfo( 'name' ); ?></h1>
                        <div class="mosque-slogan"><?php echo esc_html( get_bloginfo( 'description' ) ); ?></div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="clock-display">--:--</div>
                    <div class="date-display">Memuat...</div>
                </div>
            </header>

            <div class="signage-body">
                <div class="signage-slider">
                    <div class="slide-wrapper" style="display:flex;align-items:center;justify-content:center;opacity:0.5;">
                        <p style="color:#94a3b8;font-size:1.2rem;">Memuat konten...</p>
                    </div>
                </div>
                <aside class="signage-jadwal">
                    <div class="prayer-list">
                        <?php
                        $prayer_items = array(
                            'Fajr'    => array( 'name' => 'Subuh',   'icon' => 'icofont-night' ),
                            'Sunrise' => array( 'name' => 'Terbit',  'icon' => 'icofont-hill-sunny' ),
                            'Dhuhr'   => array( 'name' => 'Dzuhur',  'icon' => 'icofont-full-sunny' ),
                            'Asr'     => array( 'name' => 'Ashar',   'icon' => 'icofont-hill-sunny' ),
                            'Maghrib' => array( 'name' => 'Maghrib', 'icon' => 'icofont-sun-set' ),
                            'Isha'    => array( 'name' => 'Isya',    'icon' => 'icofont-full-night' ),
                        );
                        foreach ( $prayer_items as $key => $item ) : ?>
                            <div class="prayer-item">
                                <div class="prayer-label">
                                    <i class="prayer-icon <?php echo esc_attr( $item['icon'] ); ?>"></i>
                                    <span class="prayer-name"><?php echo esc_html( $item['name'] ); ?></span>
                                </div>
                                <span class="prayer-time">--:--</span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <div class="countdown-box">
                        <div class="next-prayer-label">Memuat...</div>
                        <div class="countdown-timer">--:--:--</div>
                    </div>
                </aside>
            </div>
        </div>
    </div>

    <!-- Settings for Vue (passed from PHP) -->
    <script>
        <?php
        $custom_logo_id = get_theme_mod( 'custom_logo' );
        $logo_url = $custom_logo_id ? wp_get_attachment_image_url( $custom_logo_id, 'full' ) : '';
        ?>
        window.mrtyTvSettings = <?php echo wp_json_encode( array(
            'restUrl'          => esc_url_raw( rest_url( 'mrty-tv/v1' ) ),
            'siteName'         => get_bloginfo( 'name' ),
            'siteDesc'         => get_bloginfo( 'description' ),
            'address'          => get_theme_mod( 'alamat_masjid', '' ),
            'logoUrl'          => $logo_url,
            'runningText'      => wp_strip_all_tags( get_theme_mod( 'run_text', '' ) ),
            'city_id'          => absint( get_theme_mod( 'idsholat_id', '8' ) ),
            'latitude'         => $settings['latitude'],
            'longitude'        => $settings['longitude'],

            // Prayer engine settings
            'approaching_mins' => $settings['approaching_mins'],
            'adzan_duration'   => $settings['adzan_duration'],
            'iqamah_duration'  => $settings['iqamah_duration'],
            'sholat_duration'  => $settings['sholat_duration'],
            'adj_fajr'         => $settings['adj_fajr'],
            'adj_sunrise'      => $settings['adj_sunrise'],
            'adj_dhuhr'        => $settings['adj_dhuhr'],
            'adj_asr'          => $settings['adj_asr'],
            'adj_maghrib'      => $settings['adj_maghrib'],
            'adj_isha'         => $settings['adj_isha'],
        ) ); ?>;
    </script>

    <!-- Vue 3 production build -->
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/lib/vue.global.prod.js' ); ?>"></script>

    <!-- Vue globals (single destructure, shared by all files) -->
    <script>
        var { createApp, ref, reactive, computed, watch, watchEffect, onMounted, onUnmounted, provide, inject, nextTick } = Vue;
    </script>

    <!-- PrayTimes library -->
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/lib/PrayTimes.js' ); ?>"></script>

    <!-- Composables (order matters: dependencies first) -->
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/composables/useClock.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/composables/usePrayerEngine.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/composables/useSlider.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/composables/useAutoRefresh.js?v=' . MRTY_TV_VERSION ); ?>"></script>

    <!-- Components -->
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/components/SignageHeader.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/components/PrayerSidebar.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/components/ContentSlider.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/components/PrayerOverlay.js?v=' . MRTY_TV_VERSION ); ?>"></script>
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/components/RunningText.js?v=' . MRTY_TV_VERSION ); ?>"></script>

    <!-- App entry point (must be last) -->
    <script src="<?php echo esc_url( MRTY_TV_URL . 'assets/js/app.js?v=' . MRTY_TV_VERSION ); ?>"></script>

</body>
</html>
