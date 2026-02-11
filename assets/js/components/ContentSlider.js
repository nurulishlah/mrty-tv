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
                        <iframe
                            :src="embedUrl(slider.currentSlide.value.src)"
                            frameborder="0"
                            allow="autoplay; encrypted-media"
                            allowfullscreen
                        ></iframe>
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
