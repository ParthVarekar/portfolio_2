# Acceptance & Testing 

### Browser Console Scripts (Smoke Tests)
You can run these in Chrome DevTools to smoke test the implementation:

```js
// 1. Verify CSS applied
if(document.body.classList.contains('enhanced')) console.log("PASS: Enhancements booted.");

// 2. Playgrounds 
document.querySelector('.play-toggle').click();
if(document.querySelector('.playground-sandbox').style.display === 'block') console.log("PASS: Sandbox toggle works.");

// 3. Telemetry 
document.getElementById('global-telemetry-toggle').click();
setTimeout(() => {
    if(document.querySelector('.telemetry-badge').style.display === 'block') console.log("PASS: Telemetry mock injected.");
}, 500);

// 4. Terminal Eval Check
document.querySelector('#trigger-enhanced-cli').click();
localStorage.setItem('ENABLE_EVAL', 'true');
```

## Performance & Accessibility 
- **Lighthouse**: Target LCP under 2.5s. 3D hero is lazily added but doesn't block the main layout shift.
- **Keyboard Navigation**: `[data-enhance="terminal"]` is accessible via Tab. Modals trap focus natively when configured.
- **ARIA**: Enhanced CLI input provides hints and uses `aria-live="polite"` for system responses.
