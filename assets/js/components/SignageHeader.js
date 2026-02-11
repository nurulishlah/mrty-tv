/**
 * SignageHeader component — Mosque info, clock, and date.
 */
const SignageHeader = {
    template: `
        <header class="signage-header">
            <div class="header-left">
                <div class="mosque-logo-wrap" v-if="logoUrl">
                    <img :src="logoUrl" alt="Logo" class="mosque-logo" />
                </div>
                <div class="mosque-info">
                    <h1 class="mosque-name">{{ siteName }}</h1>
                    <div class="mosque-slogan">{{ siteDesc }}</div>
                    <div class="mosque-address">{{ address }}</div>
                </div>
            </div>
            <div class="header-right">
                <div class="clock-display">
                    <span class="clock-hours">{{ clock.hours.value }}</span>
                    <span class="clock-separator" :class="{ blink: true }">:</span>
                    <span class="clock-minutes">{{ clock.minutes.value }}</span>
                </div>
                <div class="date-display">{{ clock.dateStr.value }}</div>
            </div>
        </header>
    `,
    props: {
        clock: { type: Object, required: true },
        siteName: { type: String, default: '' },
        siteDesc: { type: String, default: '' },
        address: { type: String, default: '' },
        logoUrl: { type: String, default: '' },
    }
};
