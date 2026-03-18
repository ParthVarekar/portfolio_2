// microinteractions.js
export function initMicrointeractions() {
    // Buttons with GSAP spring hover
    const btns = document.querySelectorAll('button:not(.t-btn)');
    btns.forEach(b => b.classList.add('btn-spring'));

    // Dynamic cursors based on data attributes
    const cursorRing = document.querySelector('.cursor-ring');
    const nodes = document.querySelectorAll('.glass-panel');

    nodes.forEach(node => {
        // Assume interactive stuff gives a 'play' cursor
        node.setAttribute('data-cursor', 'play');
        
        node.addEventListener('mouseenter', () => {
            document.body.setAttribute('data-cursor-state', node.getAttribute('data-cursor'));
            if(window.gsap && cursorRing) {
                gsap.to(cursorRing, { 
                    borderColor: 'var(--color-accent-secondary)', 
                    borderStyle: 'dashed', 
                    rotation: 180, 
                    duration: 0.5 
                });
            }
        });
        
        node.addEventListener('mouseleave', () => {
            document.body.removeAttribute('data-cursor-state');
            if(window.gsap && cursorRing) {
                gsap.to(cursorRing, { 
                    borderColor: 'var(--color-accent-primary)', 
                    borderStyle: 'solid', 
                    rotation: 0, 
                    duration: 0.5 
                });
            }
        });
    });
}
