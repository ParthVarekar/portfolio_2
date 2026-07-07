# Change Log

All modifications strictly adhere to a non-destructive philosophy. No original `.html` logic was removed.

### Modifications to `index.html`
1. **HEAD Section**: Added `<link>` for `typography.css` and `enhancements.css`.
2. **BODY Section**: Appended `enhanced` and `enhanced-typography` classes dynamically via JS.
3. **Hero Title**: Appended `hero-title` class to target the specific variable font override without affecting default fonts elsewhere.
4. **Terminal Hook**: Injected `<div data-enhance="terminal" aria-hidden="true" id="enhanced-terminal-modal"></div>` before `</body>`.
5. **Script Hook**: Added `<script type="module" src="enhancements/index.js"></script>` to cleanly boot the enhancement logic.

### Injected via DOM Manipulation (JS)
- **3D Hero**: Prepended `<div id="hero-canvas">` to the first `<section>`.
- **Microinteractions**: Hooked `.btn-spring` to buttons, overlaid custom cursors on `.glass-panel` items.
- **Interactive Map**: Injected `<section class="architecture-container">` after `#section-experience`.
- **Hero 3D**: Optional spinning icosahedron toggle in the hero section.
