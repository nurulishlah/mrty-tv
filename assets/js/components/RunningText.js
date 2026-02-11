/**
 * RunningText component — Scrolling ticker at the bottom.
 */
const RunningText = {
    template: `
        <footer class="signage-footer" v-if="text">
            <div class="running-text-container">
                <div class="running-text" ref="ticker">
                    <span class="ticker-content">{{ text }}</span>
                    <span class="ticker-spacer">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    <span class="ticker-content">{{ text }}</span>
                </div>
            </div>
        </footer>
    `,
    props: {
        text: { type: String, default: '' },
    }
};
