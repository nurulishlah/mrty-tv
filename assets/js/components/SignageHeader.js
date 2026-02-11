/**
 * SignageHeader component — Mosque info, clock, and date.
 */
const SignageHeader = {
    template: `
        <header class="signage-header">
            <div class="mosque-info">
                <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="mosque-logo" />
                <div class="mosque-text">
                    <div class="mosque-name">{{ siteName }}</div>
                    <div class="mosque-slogan" v-if="siteDesc">{{ siteDesc }}</div>
                    <div class="mosque-address" v-if="address">{{ address }}</div>
                </div>
            </div>
            <div class="clock-widget">
                <div class="time-now">{{ clock.hours.value }}:{{ clock.minutes.value }}</div>
                <div class="date-now">{{ clock.dateStr.value }}</div>
            </div>
        </header>
    `,
    props: ['clock', 'siteName', 'siteDesc', 'address', 'logoUrl']
};
