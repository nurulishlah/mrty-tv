/**
 * PrayerSidebar component — Prayer times list and countdown.
 */
const PrayerSidebar = {
    template: `
        <aside class="signage-jadwal">
            <div class="prayer-list">
                <div
                    v-for="prayer in engine.prayerList.value"
                    :key="prayer.key"
                    class="prayer-item"
                    :class="{ 'is-next': prayer.isNext, 'is-current': prayer.isCurrent, 'active': prayer.isNext || prayer.isCurrent }"
                >
                    <div class="prayer-label">
                        <i class="prayer-icon" :class="prayer.icon"></i>
                        <span class="prayer-name">{{ prayer.name }}</span>
                    </div>
                    <span class="prayer-time">{{ prayer.time }}</span>
                </div>
            </div>

            <div class="countdown-box">
                <div class="next-prayer-label">{{ engine.countdownLabel.value }}</div>
                <div class="countdown-timer">{{ engine.countdown.value }}</div>
            </div>
        </aside>
    `,
    props: {
        engine: { type: Object, required: true },
    }
};
