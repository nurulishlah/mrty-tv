/**
 * ContentSlider component — Image, video, and campaign slides with transitions.
 */
const ContentSlider = {
    template: `
        <div class="signage-slider">
            <transition name="fade">
                <div v-if="slider.currentSlide.value" :key="slider.currentIndex.value" class="slide-wrapper">

                    <!-- Image Slide -->
                    <div v-if="slider.currentSlide.value.type === 'image'" class="slide slide-image">
                        <img :src="slider.currentSlide.value.src" :alt="slider.currentSlide.value.alt" />
                    </div>

                    <!-- Video Slide -->
                    <div v-else-if="slider.currentSlide.value.type === 'video'" class="slide slide-video">
                        <div v-if="isYoutube(slider.currentSlide.value.src)" :id="'yt-player-' + slider.currentSlide.value.id" class="yt-player-container"></div>
                        <video v-else :src="slider.currentSlide.value.src" autoplay muted @ended="onVideoEnded" class="native-video"></video>
                    </div>

                    <!-- Campaign Slide -->
                    <div v-else-if="slider.currentSlide.value.type === 'campaign'" class="slide slide-campaign" :style="{ backgroundImage: 'url(' + slider.currentSlide.value.image + ')', backgroundSize: 'cover', backgroundPosition: 'center' }">
                        <div class="campaign-slide-overlay"></div>
                        <div class="campaign-slide-content">
                            <!-- Header -->
                            <div class="campaign-header">
                                <h1 class="campaign-title">{{ slider.currentSlide.value.title }}</h1>
                            </div>

                            <!-- Body (2 Columns) -->
                            <div class="campaign-body">
                                <!-- Left: Progress -->
                                <div class="campaign-left">
                                    <div class="campaign-progress-section">
                                        <h2>Progres</h2>
                                        <div class="campaign-stats">
                                            <div class="campaign-stat">
                                                <span class="stat-label">Target</span>
                                                <span class="stat-value">{{ formatCurrency(slider.currentSlide.value.target) }}</span>
                                            </div>
                                            <div class="campaign-stat">
                                                <span class="stat-label">Terkumpul</span>
                                                <span class="stat-value collected">{{ formatCurrency(slider.currentSlide.value.collected) }}</span>
                                            </div>
                                        </div>
                                        <div class="campaign-progress-bar">
                                            <div class="progress-fill" :style="{ width: slider.currentSlide.value.progress + '%' }"></div>
                                        </div>
                                        <div class="campaign-progress-percent">{{ slider.currentSlide.value.progress }}%</div>
                                        <!-- Link optional if available -->
                                    </div>
                                </div>

                                <!-- Right: Donate Info -->
                                <div class="campaign-right">
                                    <div class="campaign-donate-section">
                                        <h2>Cara Donasi</h2>
                                        <div class="donate-columns">
                                            <div v-if="slider.currentSlide.value.qris" class="donate-col qris-col">
                                                <p class="donate-label">Scan QRIS</p>
                                                <img :src="slider.currentSlide.value.qris" alt="QRIS" class="qris-image" />
                                            </div>
                                            <div v-if="slider.currentSlide.value.bank_name && slider.currentSlide.value.account_number" class="donate-col bank-col">
                                                <p class="donate-label">Transfer Bank</p>
                                                <div class="bank-info">
                                                    <div class="bank-name">{{ slider.currentSlide.value.bank_name }}</div>
                                                    <div class="account-number">{{ slider.currentSlide.value.account_number }}</div>
                                                    <div class="account-holder">a.n {{ slider.currentSlide.value.account_holder }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </transition>

            <!-- Slide indicator dots -->
            <div class="slide-indicators" v-if="slider.slides.value.length > 1">
                <span
                    v-for="(s, i) in slider.slides.value"
                    :key="s.id"
                    class="slide-dot"
                    :class="{ active: i === slider.currentIndex.value }"
                ></span>
            </div>
        </div>
    `,
    props: {
        slider: { type: Object, required: true },
    },
    setup(props) {
        const player = ref(null);

        // Load YouTube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        const isYoutube = (url) => {
            return /youtube\.com\/watch\?v=|youtu\.be\//.test(url);
        };

        const getYoutubeId = (url) => {
            const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            return match ? match[1] : null;
        };

        const onPlayerStateChange = (event) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
                props.slider.next();
            }
        };

        const onVideoEnded = () => {
            props.slider.next();
        };

        // Preload next slide image to avoid white flash
        const preloadNext = (index) => {
            const slides = props.slider.slides.value;
            if (!slides || slides.length === 0) return;

            const nextIndex = (index + 1) % slides.length;
            const nextSlide = slides[nextIndex];

            if (nextSlide) {
                if (nextSlide.type === 'image' && nextSlide.src) {
                    const img = new Image();
                    img.src = nextSlide.src;
                } else if (nextSlide.type === 'campaign' && nextSlide.image) {
                    const img = new Image();
                    img.src = nextSlide.image;
                }
            }
        };

        // Watch for slide changes to preload next
        watch(() => props.slider.currentIndex.value, (newIndex) => {
            preloadNext(newIndex);
        }, { immediate: true });

        // Watch for slide changes to init player
        watch(() => props.slider.currentSlide.value, (newSlide) => {
            if (newSlide?.type === 'video' && isYoutube(newSlide.src)) {
                nextTick(() => {
                    const videoId = getYoutubeId(newSlide.src);
                    const containerId = 'yt-player-' + newSlide.id;

                    if (window.YT && window.YT.Player) {
                        player.value = new YT.Player(containerId, {
                            height: '100%',
                            width: '100%',
                            videoId: videoId,
                            playerVars: {
                                'autoplay': 1,
                                'controls': 0,
                                'rel': 0,
                                'fs': 0,
                            },
                            events: {
                                'onStateChange': onPlayerStateChange
                            }
                        });
                    } else {
                        // Retry if API not ready
                        const checkYT = setInterval(() => {
                            if (window.YT && window.YT.Player) {
                                clearInterval(checkYT);
                                player.value = new YT.Player(containerId, {
                                    height: '100%',
                                    width: '100%',
                                    videoId: videoId,
                                    playerVars: {
                                        'autoplay': 1,
                                        'controls': 0,
                                        'rel': 0,
                                        'fs': 0,
                                    },
                                    events: {
                                        'onStateChange': onPlayerStateChange
                                    }
                                });
                            }
                        }, 500);
                    }
                });
            }
        });

        return { isYoutube, onVideoEnded, embedUrl: (url) => url }; // embedUrl kept for fallback/legacy if needed
    }
};
