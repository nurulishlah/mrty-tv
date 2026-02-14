/**
 * RunningText Component
 * Displays a scrolling marquee of text items with icons.
 */
const RunningText = {
    props: ['items'], // Expecting array of { type, text, icon }
    template: `
        <div class="signage-footer">
            <div class="running-text-container">
                <div class="running-text">
                    <span v-if="!items || items.length === 0">Loading...</span>
                    
                    <span v-for="(item, index) in items" :key="index" class="running-item">
                        <i v-if="item.icon" class="running-icon material-symbols-outlined">{{ item.icon }}</i>
                        {{ item.text }}
                    </span>

                    <!-- Duplicate for seamless loop (optional/simple check) -->
                     <span class="separator"> &nbsp;&bull;&nbsp; </span>
                    <span v-for="(item, index) in items" :key="'dup-' + index" class="running-item">
                        <i v-if="item.icon" class="running-icon material-symbols-outlined">{{ item.icon }}</i>
                        {{ item.text }}
                    </span>
                </div>
            </div>
        </div>
    `,
    styles: `
        /* Add some specific styles for items if needed, mostly inherited from signage.css */
        .running-item {
            display: inline-flex;
            align-items: center;
            margin-right: 10px;
        }
        .separator {
            margin: 0 10px;
            color: var(--clr-accent);
            opacity: 0.7;
        }
    `
};
