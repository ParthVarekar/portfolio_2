// sound/haptics.js — Mobile Vibration Feedback Layer

(function() {
    if (!("vibrate" in navigator)) return; // No haptics support

    // Setup global click listener to match sound cues
    document.addEventListener('pointerdown', (e) => {
        const target = e.target;
        
        // Interactive element (links, buttons, interactive class)
        const isInteractive = target.closest('a, button, .interactive, .cursor-pointer');
        
        if (isInteractive) {
            // Loud click counterpart -> heavier vibration
            navigator.vibrate([40]);
        } else {
            // Empty space click counterpart -> subtle tick
            navigator.vibrate([15]);
        }
    });
})();
