/**
 * ContentSlider component — Image, video, and campaign slides with transitions.
 */
const ContentSlider = {
    template: `
        <div class="signage-slider">
            <transition name="fade" mode="out-in">
                <div v-if="slider.currentSlide.value" :key="slider.currentIndex.value" class="slide-wrapper">

                    <!-- Image Slide -->
                    <div v-if="slider.currentSlide.value.type === 'image'" class="slide slide-image">
                        <img :src="slider.currentSlide.value.src" :alt="slider.currentSlide.value.alt" />
                    </div>

                    <!-- Video Slide -->
                    <div v-else-if="slider.currentSlide.value.type === 'video'" class="slide slide-video">
                        <iframe
                            :src="embedUrl(slider.currentSlide.value.src)"
                            frameborder="0"
                            allow="autoplay; encrypted-media"
                            allowfullscreen
                        ></iframe>
                    </div>

                    <!-- Campaign Slide -->
                    <div v-else-if="slider.currentSlide.value.type === 'campaign'" class="slide slide-campaign">
                        <div class="campaign-content" :style="campaignBg(slider.currentSlide.value.image)">
                            <div class="campaign-overlay">
                                <h2 class="campaign-title">{{ slider.currentSlide.value.title }}</h2>
                                <div class="campaign-progress-wrap">
                                    <div class="campaign-progress-bar">
                                        <div class="campaign-progress-fill" :style="{ width: slider.currentSlide.value.progress + '%' }"></div>
                                    </div>
                                    <span class="campaign-progress-text">{{ slider.currentSlide.value.progress }}%</span>
                                </div>
                                <div class="campaign-amounts">
                                    <div class="campaign-collected">Terkumpul: {{ formatCurrency(slider.currentSlide.value.collected) }}</div>
                                    <div class="campaign-target">Target: {{ formatCurrency(slider.currentSlide.value.target) }}</div>
                                </div>
                                <div v-if="slider.currentSlide.value.qris" class="campaign-qris">
                                    <img :src="slider.currentSlide.value.qris" alt="QRIS" class="qris-image" />
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
    methods: {
        embedUrl(url) {
            if (!url) return '';
            // Convert youtube watch URL to embed
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            if (ytMatch) {
                return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&controls=0`;
            }
            return url;
        },
        formatCurrency(val) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
        },
        campaignBg(imageUrl) {
            if (!imageUrl) return {};
            return { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${imageUrl})` };
        }
    }
};
