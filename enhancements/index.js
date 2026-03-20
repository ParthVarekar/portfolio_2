// index.js
import { initTerminalEnhanced } from './terminal.js';
import { initPlaygrounds } from './playground.js';
import { initArchitectureMap } from './architecture.js';
import { initHero3D } from './hero3d.js';
import { initMicrointeractions } from './microinteractions.js';
import { initReproducibilityPanel } from './reproducibility.js';
import { initTelemetryConfig } from './telemetry.js';

// Wait for the main site bootstrap then apply enhancements
window.addEventListener('load', () => {
    console.log('--- ENHANCEMENT LAYER ACTIVATED ---');
    // Enable enhanced classes to trigger CSS overriding
    document.body.classList.add('enhanced');
    document.body.classList.add('enhanced-typography');

    // Defer initialization to avoid blocking critical render path
    setTimeout(() => {
        try {
            initMicrointeractions();
            // initTerminalEnhanced(); // Disabled for classic view
            initPlaygrounds();
            // initArchitectureMap(); // Disabled for classic view
            initHero3D();
            // initReproducibilityPanel(); // Disabled for classic view
            initTelemetryConfig();
        } catch (e) {
            console.error('Enhancement initialization error:', e);
        }
    }, 500);
});
