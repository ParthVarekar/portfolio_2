# Visual Regression Runbook

This directory contains before/after reference images for the enhancements and a visual QA checklist. 

## Automated Snapshots (Placeholder)
If you configure Playwright/Puppeteer, you can generate automated snapshots against `localhost:8000`. 
Run: `npm run test:visual` (assuming configuration).

## Manual QA Checklist

### 1. 3D Hero
- [x] On load, the 3D rotating wireframe sphere appears overlaid.
- [x] Click `[ High Performance 3D : ON ]` at the bottom-right of the hero. 
- [x] Verify the animation stops exactly where it is. Wait, verify a static image fallback (poster) appears.
- [x] Click again to resume 3D.
- [ ] If `prefers-reduced-motion` is active in your OS, 3D should be disabled and the poster shown by default.

### 2. Microinteractions
- [x] Hover over project cards. The cursor ring dashes and rotates. The `e-resize` cursor is set.
- [x] Hover over buttons. They should elevate via `btn-spring` CSS transition.

### 3. Terminal Console
- [x] Under the hero, next to "Access Terminal", click "Enhanced CLI".
- [x] Type `help` and hit Enter. Verify syntax highlighting and response.
- [x] Type `ls`, `open whisperflow`. Verify the case study modal opens and terminal closes.
- [x] Type `clear` to reset.

### 4. Project Modals
- [x] Open a project card (e.g. WhisperFlow).
- [x] The case-study modal opens with Problem Space + Architectural Logic + highlights.
- [x] Click `[ CLOSE [X] ]` to close. Layout should restore cleanly.

### 5. Interactive Architecture 
- [x] Scroll to `#section-experience`. Below it, the Interactive wiring graph appears.
- [x] Click `[ WHISPERFLOW ]` / `[ RAG_PIPELINE ]` / `[ GAME_ENGINE ]` to switch topologies.
- [x] Verify particles flow along the edges between nodes.

## Known Limitations
- Modals inside `data-enhance="terminal"` rely on the existing global function `window.openSystemModal()`. If core changes happen, the terminal bindings need updates.
- Typography variable font might jitter slightly on first load via CDN. `font-display: swap` handles it.
