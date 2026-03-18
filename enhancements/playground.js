// playground.js
export function initPlaygrounds() {
    const cards = document.querySelectorAll('#section-projects .glass-panel');
    
    cards.forEach((card, index) => {
        // Prevent breaking existing onclick
        // Add a dedicated UI widget inside each card's content
        const content = card.querySelector('.glass-content');
        if (!content) return;
        
        const projectName = content.querySelector('h3').innerText.toLowerCase();
        
        const playgroundTrigger = document.createElement('button');
        playgroundTrigger.className = 'play-toggle text-[10px] bg-[var(--color-surface-translucent)] px-2 py-1 uppercase font-mono mt-4 hover:bg-[var(--color-accent-primary)] hover:text-black transition-colors z-20 relative';
        playgroundTrigger.innerText = '[ Sandbox / Replay ]';
        playgroundTrigger.setAttribute('data-project', projectName);
        
        // Wrap existing content to not break flex layout if needed
        content.appendChild(playgroundTrigger);
        
        // Create the sandbox container
        const sandbox = document.createElement('div');
        sandbox.className = 'playground-sandbox z-30';
        sandbox.innerHTML = `
            <div style="background:#222; padding:5px; font-family:monospace; font-size:10px; display:flex; justify-content:space-between;">
                <span>Mock Timeline // ${projectName.toUpperCase()}</span>
                <span style="display:flex; gap:10px;">
                    <a href="https://gist.github.com/ParthVarekar" target="_blank" style="color:var(--color-accent-primary);">[ Source ]</a>
                    <button class="close-sandbox pointer" style="color:#ff5f56; background:none; border:none; cursor:pointer;">[ x ]</button>
                </span>
            </div>
            <div style="padding:10px; background:#000; height:calc(100% - 25px); overflow:auto;">
                <div style="display:flex; flex-direction:column; gap:10px; height:100%; justify-content:center; align-items:center;">
                    <div style="color:var(--color-accent-primary); font-family:var(--font-mono); font-size:12px;">Timeline Simulation</div>
                    <div class="skeleton" style="width:80%; height:150px;"></div>
                    <input type="range" min="0" max="100" value="0" style="width:80%;">
                    <div style="color:#888; font-family:monospace; font-size:10px;">Commit #a4b2c9: UI Adjustments</div>
                </div>
            </div>
        `;
        
        // Append right after the card or below
        // Since cards are in a grid, appending inside isn't great. Let's make it a full width overlay or expand inside the card if there's space.
        // Or append to standard DOM and absolute position
        card.style.position = 'relative';
        content.appendChild(sandbox);
        
        playgroundTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); // don't trigger the modal
            if(sandbox.style.display === 'block') {
                sandbox.style.display = 'none';
            } else {
                sandbox.style.display = 'block';
                // Reset slider
                const slider = sandbox.querySelector('input[type="range"]');
                if(slider) slider.value = 0;
            }
        });
        
        const closeBtn = sandbox.querySelector('.close-sandbox');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sandbox.style.display = 'none';
        });
        
        // Stop propagation inside sandbox to avoid firing the card's open modal event
        sandbox.addEventListener('click', e => e.stopPropagation());
    });
}
