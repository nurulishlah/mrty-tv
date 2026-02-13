/**
 * useRunningText composable
 * Fetches dynamic running text items (static + posts) from the API.
 */
function useRunningText(settingsUrl) {
    const items = ref([]); // Array of { type, text, icon }
    const isLoading = ref(true);
    const error = ref(null);

    // Fetch data from API
    async function fetchRunningText() {
        isLoading.value = true;
        try {
            // Construct API URL (assuming settingsUrl base path)
            // settingsUrl is usually like '.../mrty-tv/v1'
            // We need to fetch from '.../mrty-tv/v1/running-text'
            const apiUrl = settingsUrl.replace(/\/+$/, '') + '/running-text';

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch running text');

            const data = await response.json();
            items.value = data;
        } catch (err) {
            console.error('[useRunningText] Error:', err);
            error.value = err.message;
            // Fallback: If fetch fails, try to use static text from global settings as backup
            if (window.mrtyTvSettings && window.mrtyTvSettings.runningText) {
                items.value = [{
                    type: 'static',
                    text: window.mrtyTvSettings.runningText,
                    icon: 'icofont-info-circle'
                }];
            }
        } finally {
            isLoading.value = false;
        }
    }

    // Initial fetch
    onMounted(() => {
        fetchRunningText();
        // Refresh every 5 minutes
        setInterval(fetchRunningText, 5 * 60 * 1000);
    });

    return { items, isLoading, error, fetchRunningText };
}
