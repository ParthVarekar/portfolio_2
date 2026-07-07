// index.js — Enhancement layer entry point.
// NOTE: playground.js (fake "Sandbox / Replay" commit timelines) and telemetry.js
// (fake "Live Telemetry" random numbers) were removed — they added bogus UI that
// a recruiter would spot instantly. The remaining modules are real:
//   - microinteractions: subtle hover/focus polish
//   - hero3d: optional 3D hero toggle
import { initHero3D } from './hero3d.js';
import { initMicrointeractions } from './microinteractions.js';

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
            initHero3D();
        } catch (e) {
            console.error('Enhancement initialization error:', e);
        }
    }, 500);
});
