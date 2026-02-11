/**
 * usePrayerEngine composable — Reactive prayer engine state machine.
 *
 * States: NORMAL → APPROACHING → ADZAN → IQAMAH → SHOLAT → NORMAL
 * Sunrise exception: APPROACHING → NORMAL (skips adzan/iqamah/sholat)
 */
// Vue globals (ref, reactive, computed, watch, onMounted, onUnmounted, provide) provided by template setup script

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DISPLAY_NAMES = {
    Fajr: 'Subuh', Sunrise: 'Terbit', Dhuhr: 'Dzuhur',
    Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya'
};
const ICON_MAP = {
    Fajr: 'icofont-night', Sunrise: 'icofont-hill-sunny', Dhuhr: 'icofont-full-sunny',
    Asr: 'icofont-hill-sunny', Maghrib: 'icofont-sun-set', Isha: 'icofont-full-night'
};

const ENGINE_STATES = {
    NORMAL: 'NORMAL',
    APPROACHING: 'APPROACHING',
    ADZAN: 'ADZAN',
    IQAMAH: 'IQAMAH',
    SHOLAT: 'SHOLAT',
};

function usePrayerEngine(settings) {
    // --- Reactive State ---
    const state = ref(ENGINE_STATES.NORMAL);
    const currentPrayer = ref(null);
    const nextPrayer = ref(null);
    const countdown = ref('--:--:--');
    const countdownLabel = ref('');
    const prayerTimes = reactive({});
    const timesLoaded = ref(false);
    const stateEndTime = ref(null);        // Timestamp when current state expires
    const lastCalculatedDate = ref(null);

    let intervalId = null;

    // --- Config (reactive, will update when settings change) ---
    const config = computed(() => ({
        approachingMins: parseInt(settings.value.approaching_mins) || 10,
        adzanDuration: parseInt(settings.value.adzan_duration) || 2,
        iqamahDuration: parseInt(settings.value.iqamah_duration) || 10,
        sholatDuration: parseInt(settings.value.sholat_duration) || 15,
        adjustments: {
            Fajr: parseInt(settings.value.adj_fajr) || 0,
            Sunrise: parseInt(settings.value.adj_sunrise) || 0,
            Dhuhr: parseInt(settings.value.adj_dhuhr) || 0,
            Asr: parseInt(settings.value.adj_asr) || 0,
            Maghrib: parseInt(settings.value.adj_maghrib) || 0,
            Isha: parseInt(settings.value.adj_isha) || 0,
        }
    }));

    // --- Display data ---
    const prayerList = computed(() => {
        return PRAYER_NAMES.map(name => ({
            key: name,
            name: DISPLAY_NAMES[name],
            icon: ICON_MAP[name],
            time: prayerTimes[name] || '--:--',
            isNext: nextPrayer.value === name,
            isCurrent: currentPrayer.value === name,
        }));
    });

    // --- Prayer time calculation ---
    function fetchAndCalculate() {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        // Skip if already calculated for today
        if (lastCalculatedDate.value === dateKey && timesLoaded.value) return;

        const cityId = settings.value.city_id;
        if (!cityId || isNaN(Number(cityId))) {
            console.warn('[PrayerEngine] Invalid city_id, using fallback coords');
            calculateWithCoords(-6.6253, 106.8210); // Bogor fallback
            return;
        }

        const apiUrl = `https://idsholat.net/wp-json/wp/v2/posts/${encodeURIComponent(cityId)}`;
        fetch(apiUrl)
            .then(r => r.json())
            .then(data => {
                const content = data.content?.rendered || '';
                const latMatch = content.match(/Latitude:\s*([-\d.]+)/);
                const lngMatch = content.match(/Longitude:\s*([-\d.]+)/);
                if (latMatch && lngMatch) {
                    calculateWithCoords(parseFloat(latMatch[1]), parseFloat(lngMatch[1]));
                } else {
                    calculateWithCoords(-6.6253, 106.8210);
                }
            })
            .catch(() => {
                calculateWithCoords(-6.6253, 106.8210);
            });
    }

    function calculateWithCoords(lat, lng) {
        if (typeof PrayTimes === 'undefined') {
            console.error('[PrayerEngine] PrayTimes library not loaded');
            return;
        }

        const pt = new PrayTimes('Kemenag');
        pt.adjust({ fajr: 20, isha: 18, highLats: 'AngleBased' });

        const today = new Date();
        const times = pt.getTimes(today, [lat, lng], 7, 'auto', '24h');
        const adj = config.value.adjustments;

        PRAYER_NAMES.forEach(name => {
            const raw = times[name.toLowerCase()] || times[name];
            if (raw) {
                prayerTimes[name] = applyAdjustment(raw, adj[name] || 0);
            }
        });

        timesLoaded.value = true;
        lastCalculatedDate.value = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    }

    function applyAdjustment(timeStr, adjMinutes) {
        if (!adjMinutes || !timeStr) return timeStr;
        const [h, m] = timeStr.split(':').map(Number);
        const total = h * 60 + m + adjMinutes;
        const newH = Math.floor(((total % 1440) + 1440) % 1440 / 60);
        const newM = ((total % 60) + 60) % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    }

    // --- Time utilities ---
    function timeToMinutes(timeStr) {
        if (!timeStr || timeStr === '--:--') return -1;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function nowMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    }

    function formatCountdown(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // --- State machine logic ---
    function findNextPrayer() {
        const now = nowMinutes();
        for (const name of PRAYER_NAMES) {
            const t = timeToMinutes(prayerTimes[name]);
            if (t > now) return name;
        }
        // After last prayer, next is tomorrow's Fajr
        return PRAYER_NAMES[0];
    }

    function engineTick() {
        if (!timesLoaded.value) return;

        const now = new Date();
        const nowMins = nowMinutes();
        const currentState = state.value;

        // Check for new day
        const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (lastCalculatedDate.value !== dateKey) {
            fetchAndCalculate();
            return;
        }

        // --- TIMED STATES: Check if state has expired ---
        if (currentState !== ENGINE_STATES.NORMAL && currentState !== ENGINE_STATES.APPROACHING) {
            if (stateEndTime.value && Date.now() >= stateEndTime.value) {
                transitionFromTimedState(currentState);
                return;
            }

            // Update countdown for timed states
            if (stateEndTime.value) {
                const remainingSecs = Math.max(0, Math.floor((stateEndTime.value - Date.now()) / 1000));
                countdown.value = formatCountdown(remainingSecs);
            }
            return;
        }

        // --- NORMAL / APPROACHING: Check prayer proximity ---
        const next = findNextPrayer();
        nextPrayer.value = next;

        const nextTime = timeToMinutes(prayerTimes[next]);
        let diffMins;

        if (next === 'Fajr' && nowMins > timeToMinutes(prayerTimes['Isha'])) {
            // After Isha, counting to tomorrow's Fajr
            diffMins = (1440 - nowMins) + nextTime;
        } else {
            diffMins = nextTime - nowMins;
        }

        const diffSecs = Math.max(0, Math.floor(diffMins * 60));
        const approachThreshold = config.value.approachingMins;

        if (currentState === ENGINE_STATES.NORMAL) {
            countdownLabel.value = `Menuju ${DISPLAY_NAMES[next]}`;
            countdown.value = formatCountdown(diffSecs);

            if (diffMins <= approachThreshold && diffMins > 0) {
                // Enter APPROACHING
                state.value = ENGINE_STATES.APPROACHING;
                currentPrayer.value = next;
                countdownLabel.value = `Menuju Waktu Sholat ${DISPLAY_NAMES[next]}`;
            } else if (diffMins <= 0 && diffMins > -1) {
                // Prayer time reached, enter ADZAN (or skip for sunrise)
                enterAdzanOrSkip(next);
            }
        } else if (currentState === ENGINE_STATES.APPROACHING) {
            countdownLabel.value = `Menuju Waktu Sholat ${DISPLAY_NAMES[next]}`;
            countdown.value = formatCountdown(diffSecs);

            if (diffMins <= 0) {
                enterAdzanOrSkip(next);
            }
        }
    }

    function enterAdzanOrSkip(prayer) {
        currentPrayer.value = prayer;

        if (prayer === 'Sunrise') {
            // Sunrise: skip adzan/iqamah/sholat, go back to NORMAL
            state.value = ENGINE_STATES.NORMAL;
            return;
        }

        state.value = ENGINE_STATES.ADZAN;
        stateEndTime.value = Date.now() + config.value.adzanDuration * 60 * 1000;
        countdownLabel.value = `Adzan ${DISPLAY_NAMES[prayer]}`;
        playBeep();
    }

    function transitionFromTimedState(currentState) {
        const prayer = currentPrayer.value;

        if (currentState === ENGINE_STATES.ADZAN) {
            state.value = ENGINE_STATES.IQAMAH;
            stateEndTime.value = Date.now() + config.value.iqamahDuration * 60 * 1000;
            countdownLabel.value = `Iqamah ${DISPLAY_NAMES[prayer]}`;
        } else if (currentState === ENGINE_STATES.IQAMAH) {
            state.value = ENGINE_STATES.SHOLAT;
            stateEndTime.value = Date.now() + config.value.sholatDuration * 60 * 1000;
            countdownLabel.value = `Sholat ${DISPLAY_NAMES[prayer]} Sedang Berlangsung`;
        } else if (currentState === ENGINE_STATES.SHOLAT) {
            state.value = ENGINE_STATES.NORMAL;
            stateEndTime.value = null;
            currentPrayer.value = null;
        }
    }

    // --- Audio ---
    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
            setTimeout(() => ctx.close(), 500);
        } catch (e) {
            // Audio not available
        }
    }

    // --- Lifecycle ---
    onMounted(() => {
        fetchAndCalculate();
        intervalId = setInterval(engineTick, 1000);
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    // Watch for settings changes and recalculate
    watch(() => settings.value, () => {
        lastCalculatedDate.value = null; // Force recalculation
        fetchAndCalculate();
    }, { deep: true });

    return {
        state,
        currentPrayer,
        nextPrayer,
        countdown,
        countdownLabel,
        prayerList,
        timesLoaded,
        config,
        ENGINE_STATES,
        DISPLAY_NAMES,
    };
}
