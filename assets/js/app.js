/**
 * MRTY TV — Vue 3 App Entry Point
 * 
 * Initializes the Vue app with composables and components.
 * Settings are passed from PHP via window.mrtyTvSettings.
 */
// Vue globals (createApp, ref, provide) provided by template setup script

const App = {
    template: `
        <div class="signage-container" :class="'state-' + engine.state.value.toLowerCase()">
            <signage-header
                :clock="clock"
                :site-name="siteInfo.name"
                :site-desc="siteInfo.description"
                :address="siteInfo.address"
                :logo-url="siteInfo.logoUrl"
            />

            <div class="signage-body">
                <content-slider :slider="slider" />
                <prayer-sidebar :engine="engine" />
            </div>

            <running-text :items="runningText.items.value" />

            <prayer-overlay :engine="engine" />
            
            <div v-if="isSimulated" style="position:fixed;bottom:10px;right:10px;background:red;color:white;padding:5px;z-index:9999;font-weight:bold;border-radius:4px;">
                SIMULATION MODE
            </div>
        </div>
    `,

    setup() {
        // Reactive settings from PHP — auto-refresh will mutate this
        const settings = ref(window.mrtyTvSettings || {});

        // Site info (static, from PHP)
        const siteInfo = {
            name: settings.value.siteName || '',
            description: settings.value.siteDesc || '',
            address: settings.value.address || '',
            logoUrl: settings.value.logoUrl || '',
            runningText: settings.value.runningText || '',
        };

        // Initialize composables
        const simulatedClock = useSimulatedClock();
        const clock = useClock(simulatedClock.now);
        const engine = usePrayerEngine(settings, simulatedClock.now);
        const slider = useSlider(engine.state);

        const autoRefresh = useAutoRefresh(settings);
        const runningText = useRunningText(settings.value.restUrl);

        // Watch for auto-refresh updates (triggered by content hash change)
        watch(() => autoRefresh.lastRefresh.value, () => {
            console.log('[App] Auto-refresh triggered content update');
            slider.fetchSlides();
            runningText.fetchRunningText();
        });

        return { clock, engine, slider, siteInfo, settings, runningText, isSimulated: simulatedClock.isSimulated };
    }
};

// Create and mount the Vue app
document.addEventListener('DOMContentLoaded', () => {
    const app = createApp(App);

    app.component('signage-header', SignageHeader);
    app.component('prayer-sidebar', PrayerSidebar);
    app.component('content-slider', ContentSlider);
    app.component('prayer-overlay', PrayerOverlay);
    app.component('running-text', RunningText);

    app.mount('#app');
});
