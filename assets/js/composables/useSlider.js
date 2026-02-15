/**
 * useSlider composable — Reactive slide rotation.
 * Pauses during prayer states (ADZAN, IQAMAH, SHOLAT).
 */

function useSlider(engineState) {

    const slides = ref([]);
    const currentIndex = ref(0);
    const isLoading = ref(true);
    const isPaused = ref(false);

    const DURATIONS = { image: 8000, video: 30000, campaign: 20000 };

    let timerId = null;

    const currentSlide = computed(() => slides.value[currentIndex.value] || null);

    function advance() {
        if (slides.value.length === 0) return;
        currentIndex.value = (currentIndex.value + 1) % slides.value.length;
        scheduleNext();
    }

    function scheduleNext() {
        clearTimeout(timerId);
        if (isPaused.value || slides.value.length === 0) return;
        const slide = currentSlide.value;

        // If video, set a very long fallback (5 mins) and wait for manual advance
        // Otherwise use standard duration
        const isVideo = slide?.type === 'video';
        const duration = isVideo ? 300000 : (DURATIONS[slide?.type] || DURATIONS.image);

        timerId = setTimeout(advance, duration);
    }

    function next() {
        advance();
    }

    function jump(index) {
        if (index >= 0 && index < slides.value.length) {
            currentIndex.value = index;
            scheduleNext();
        }
    }

    function pause() {
        isPaused.value = true;
        clearTimeout(timerId);
    }

    function resume() {
        isPaused.value = false;
        scheduleNext();
    }

    async function fetchSlides() {
        try {
            const url = (window.mrtyTvSettings?.restUrl || '/wp-json/mrty-tv/v1') + '/slides';
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
                slides.value = await response.json();
            }
        } catch (e) {
            console.warn('[Slider] Failed to fetch slides:', e.message);
        } finally {
            isLoading.value = false;
        }
    }

    // Pause/resume based on engine state
    watch(engineState, (newState) => {
        const pauseStates = ['ADZAN', 'IQAMAH', 'SHOLAT'];
        if (pauseStates.includes(newState)) {
            pause();
        } else if (isPaused.value) {
            resume();
        }
    });

    onMounted(() => {
        fetchSlides().then(() => scheduleNext());
    });

    onUnmounted(() => {
        clearTimeout(timerId);
    });

    return { slides, currentSlide, currentIndex, isLoading, isPaused, fetchSlides, next, jump };
}
