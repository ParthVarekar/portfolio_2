// sound/mobile-controls.js — Simulates keyboard events for touch screen D-Pad

(function() {
    function bindTouchControls() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnShoot = document.getElementById('btn-shoot');

        if (!btnLeft) return;

        function dispatch(type, key) {
            const e = new KeyboardEvent(type, { 
                key: key, 
                bubbles: true, 
                cancelable: true 
            });
            document.dispatchEvent(e);
        }

        // Action handles - mapped to keys hex-invaders natively reads
        btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); dispatch('keydown', 'ArrowLeft'); });
        btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); dispatch('keyup', 'ArrowLeft'); });
        
        btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); dispatch('keydown', 'ArrowRight'); });
        btnRight.addEventListener('touchend', (e) => { e.preventDefault(); dispatch('keyup', 'ArrowRight'); });

        btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); dispatch('keydown', ' '); });
        btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); dispatch('keyup', ' '); });
    }

    // Attempt trigger on DOM frame load
    document.addEventListener('DOMContentLoaded', bindTouchControls);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        bindTouchControls();
    }
})();
