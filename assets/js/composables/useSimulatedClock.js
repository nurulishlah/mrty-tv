/**
 * useSimulatedClock composable
 *
 * Handles time simulation for testing purposes.
 * - Checks URL params: ?sim_time=HH:mm & ?sim_date=YYYY-MM-DD
 * - If present, calculates an offset from real time and maintains a "simulated now".
 */
// Vue globals provided by template

function useSimulatedClock() {
    const isSimulated = ref(false);
    const timeOffset = ref(0); // Difference between simulated time and real time in ms
    const simulatedNow = ref(new Date());

    // Parse URL params on init
    const params = new URLSearchParams(window.location.search);
    const simTime = params.get('sim_time'); // HH:mm
    const simDate = params.get('sim_date'); // YYYY-MM-DD

    if (simTime) {
        isSimulated.value = true;
        console.warn(`[SimulatedClock] Simulation Active: Time=${simTime}, Date=${simDate || 'Today'}`);

        const now = new Date();
        const target = new Date();

        if (simDate) {
            const [y, m, d] = simDate.split('-').map(Number);
            target.setFullYear(y, m - 1, d);
        }

        const [h, min] = simTime.split(':').map(Number);
        target.setHours(h, min, 0, 0);

        // Calculate offset: Target Time - Real Time
        timeOffset.value = target.getTime() - now.getTime();
        simulatedNow.value = target;
    }

    function tick() {
        if (!isSimulated.value) {
            simulatedNow.value = new Date();
            return;
        }
        // Apply offset to current real time to get simulated time (keeps ticking)
        simulatedNow.value = new Date(Date.now() + timeOffset.value);
    }

    // Tick independently to ensure we always have a value
    let intervalId = setInterval(tick, 1000);

    onUnmounted(() => {
        clearInterval(intervalId);
    });

    return {
        isSimulated,
        now: simulatedNow
    };
}
