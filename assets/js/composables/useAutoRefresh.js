/**
 * useAutoRefresh composable — Poll content hash and reactively update settings.
 * Instead of reloading the page, fetches new settings from REST API.
 */

function useAutoRefresh(settings) {
    const { ref, onMounted, onUnmounted } = Vue;

    const POLL_INTERVAL = 30000;
    const FETCH_TIMEOUT = 5000;

    let currentHash = null;
    let intervalId = null;

    const lastRefresh = ref(null);

    async function fetchWithTimeout(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    }

    async function checkForUpdates() {
        try {
            const baseUrl = window.mrtyTvSettings?.restUrl || '/wp-json/mrty-tv/v1';

            // 1. Check content hash
            const hashResponse = await fetchWithTimeout(`${baseUrl}/content-hash`);
            if (!hashResponse.ok) return;
            const hashData = await hashResponse.json();

            if (currentHash === null) {
                currentHash = hashData.hash;
                return;
            }

            if (hashData.hash === currentHash) return;

            // 2. Hash changed — fetch new settings reactively
            console.log('[AutoRefresh] Content changed, updating settings...');
            currentHash = hashData.hash;

            const settingsResponse = await fetchWithTimeout(`${baseUrl}/settings`);
            if (settingsResponse.ok) {
                const newSettings = await settingsResponse.json();
                // Update the reactive settings object
                Object.assign(settings.value, newSettings);
                lastRefresh.value = new Date().toISOString();
                console.log('[AutoRefresh] Settings updated reactively');
            }
        } catch (err) {
            console.warn('[AutoRefresh] Poll failed:', err.message);
        }
    }

    onMounted(() => {
        // Initial hash capture after 2 seconds
        setTimeout(checkForUpdates, 2000);
        intervalId = setInterval(checkForUpdates, POLL_INTERVAL);
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return { lastRefresh };
}
