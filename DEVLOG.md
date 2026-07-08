# Development Log

## Recent Fixes
- Fix mobile layout — workspace button, game D-pad, tab close, arrow keys
- Fix workspace button hidden on mobile (remove hidden class, add mobile sizing)
- Fix Data Dodge right arrow key (use capture phase + stopPropagation)
- Fix mobile game D-pad off-screen (remove absolute positioning, use normal flow)
- Fix mobile game close button not visible (move inside overlay)
- Make game overlay scrollable on mobile (overflow-y: auto)
- Fix workspace tab close button invisible on mobile (always show opacity 0.6)
- Fix mobile sidebar toggle button overlapping tabs (add 96px left padding to mobile tabbar so tabs start to the right of the toggle button)
