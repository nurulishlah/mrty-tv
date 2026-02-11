/**
 * PrayerOverlay component — Full-screen overlays for prayer states.
 * Shows APPROACHING countdown, ADZAN, IQAMAH countdown, and SHOLAT screens.
 */
const PrayerOverlay = {
    template: `
        <transition name="overlay-fade">
            <div v-if="visible" class="prayer-overlay" :class="overlayClass">

                <!-- APPROACHING -->
                <div v-if="engine.state.value === 'APPROACHING'" class="overlay-content approaching-content">
                    <div class="overlay-icon">🕌</div>
                    <h2 class="overlay-title">MENUJU WAKTU SHOLAT</h2>
                    <h1 class="overlay-prayer-name">{{ currentPrayerName }}</h1>
                    <div class="overlay-countdown">{{ engine.countdown.value }}</div>
                </div>

                <!-- ADZAN -->
                <div v-if="engine.state.value === 'ADZAN'" class="overlay-content adzan-content">
                    <div class="overlay-icon">📢</div>
                    <h1 class="overlay-title">ADZAN {{ currentPrayerName }}</h1>
                    <div class="overlay-subtitle">Hayya 'alash sholah</div>
                    <div class="overlay-countdown">{{ engine.countdown.value }}</div>
                </div>

                <!-- IQAMAH -->
                <div v-if="engine.state.value === 'IQAMAH'" class="overlay-content iqamah-content">
                    <div class="overlay-icon">⏳</div>
                    <h1 class="overlay-title">IQAMAH {{ currentPrayerName }}</h1>
                    <div class="overlay-subtitle">Luruskan dan rapatkan shof</div>
                    <div class="overlay-countdown">{{ engine.countdown.value }}</div>
                </div>

                <!-- SHOLAT -->
                <div v-if="engine.state.value === 'SHOLAT'" class="overlay-content sholat-content">
                    <h1 class="overlay-title">SHOLAT {{ currentPrayerName }}</h1>
                    <div class="overlay-subtitle">Sedang Berlangsung</div>
                </div>

            </div>
        </transition>
    `,
    props: {
        engine: { type: Object, required: true },
    },
    computed: {
        visible() {
            return ['APPROACHING', 'ADZAN', 'IQAMAH', 'SHOLAT'].includes(this.engine.state.value);
        },
        currentPrayerName() {
            const prayer = this.engine.currentPrayer.value;
            return this.engine.DISPLAY_NAMES[prayer] || prayer || '';
        },
        overlayClass() {
            return `prayer-overlay-${(this.engine.state.value || '').toLowerCase()}`;
        }
    }
};
