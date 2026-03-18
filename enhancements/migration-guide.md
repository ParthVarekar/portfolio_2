# Migration / Rollback Guide

## Upgrading the Enhancements Payload
Since all hooks are based on `.enhanced` scoped CSS and data attributes `data-enhance=""`, moving from plain JS to a framework later is straightforward:
1. Wrap the DOM target nodes with React Portals.
2. Port GSAP to framer-motion or stick to GSAP via `useGSAP()`.
3. Separate the bundled modules using Vite or Webpack if you move to a module-bundler paradigm. 
   - Right now, since they use native ES modules (`<script type="module">`), browsers handle the dependency tree perfectly well.

## Complete Removal (Rollback)

If the enhancements degrade performance, you can instantly sever them from the production site in two ways:

**Option A (Code removal):**
1. Delete the lines in `<head>` adding `typography.css` and `enhancements.css`.
2. Delete the `<script type="module" src="enhancements/index.js"></script>` at the bottom.
3. Remove `<div data-enhance="terminal" aria-hidden="true" id="enhanced-terminal-modal"></div>`

**Option B (Git Rebase/Revert):**
A revert commit named `revert-enhancements` is provided. If you apply it, every tracked file returns to its baseline state.
```bash
git checkout main
# Merge or cherry-pick the revert commit:
git cherry-pick revert-enhancements
```
