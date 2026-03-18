# Enhancements Layer

This folder contains a progressively enhanced layer for the portfolio site. 

## Installation
The enhancements are already linked in `portfolio.html`. To run locally:
1. Start any local web server in the root directory (e.g., `python -m http.server 8000` or `npx serve .`)
2. Open `localhost:8000` in your browser.

## Dependencies
- **Three.js** (Loaded natively or via CDN if missing): Used for the 3D Hero background.
- **GSAP** (Loaded from main site): Reused for micro-interactions and transitions.

## Feature Toggles
To enable `eval()` within the terminal sandbox:
1. Open your browser's DevTools console.
2. Run: `localStorage.setItem('ENABLE_EVAL', 'true')`
3. Reload page and type `eval 2+2` in the Enhanced CLI.

## Rollback Instructions
To remove all enhancements and restore the original site:
```bash
git checkout main
git revert <enhancement-commit-hash>
# Or simply remove the <script type="module" src="enhancements/index.js"></script> and CSS links from portfolio.html.
```
