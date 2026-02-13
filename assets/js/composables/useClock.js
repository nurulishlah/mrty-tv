/**
 * useClock composable — Reactive clock and date display.
 * Updates every second via a single setInterval.
 */
// Vue globals (ref, onMounted, onUnmounted) provided by template setup script

function useClock(simulatedNow) {
    const hours = ref('--');
    const minutes = ref('--');
    const seconds = ref('--');
    const timeStr = ref('--:--');
    const dateStr = ref('');
    const dayName = ref('');

    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const MONTHS_ID = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let intervalId = null;

    function tick() {
        const now = (simulatedNow && simulatedNow.value) ? simulatedNow.value : new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        hours.value = h;
        minutes.value = m;
        seconds.value = s;
        timeStr.value = `${h}:${m}`;

        dayName.value = DAYS_ID[now.getDay()];
        dateStr.value = `${dayName.value}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
    }

    onMounted(() => {
        tick();
        intervalId = setInterval(tick, 1000);
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return { hours, minutes, seconds, timeStr, dateStr, dayName };
}
