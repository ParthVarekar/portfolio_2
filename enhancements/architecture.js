// architecture.js
export function initArchitectureMap() {
    const experienceSection = document.getElementById('section-experience');
    if (!experienceSection) return;

    // Create container
    const mapContainer = document.createElement('section');
    mapContainer.className = 'architecture-container';
    mapContainer.innerHTML = `
        <div class="max-w-7xl mx-auto flex justify-between items-center mb-8">
            <h3 class="font-mono text-accent uppercase text-2xl">Architecture Wiring (Interactive)</h3>
            <button id="toggle-telemetry" class="border border-white/20 px-4 py-2 font-mono text-xs hover:bg-[var(--color-accent-primary)] hover:text-black transition-colors">
                [ Toggle Mock Telemetry ]
            </button>
        </div>
        <div class="max-w-7xl mx-auto relative architecture-svg-canvas">
            <!-- SVG Fallback directly inDOM, enhanced to be interactive -->
            <svg width="100%" height="400" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
                <!-- Edges -->
                <path class="svg-edge" d="M 200 200 Q 500 50 800 200" fill="none" stroke-width="2"/>
                <path class="svg-edge" d="M 200 200 Q 500 350 800 200" fill="none" stroke-width="2"/>
                <path class="svg-edge" d="M 500 200 L 800 200" fill="none" stroke-width="2"/>
                
                <!-- Client Node -->
                <g class="interactive node" transform="translate(150, 150)" cursor="pointer" data-snippet="function ClientInit() { fetch('/graphql'); }">
                    <rect x="0" y="0" width="100" height="100" fill="var(--color-bg-void)" stroke="var(--color-accent-primary)" stroke-width="2"/>
                    <text x="50" y="55" fill="#fff" font-family="monospace" font-size="14" text-anchor="middle">CLIENT</text>
                    <text class="telemetry-label" x="50" y="80" fill="var(--color-accent-primary)" font-family="monospace" font-size="10" text-anchor="middle" visibility="hidden">650 Req/s</text>
                </g>
                
                <!-- Gateway API Node -->
                <g class="interactive node" transform="translate(450, 150)" cursor="pointer" data-snippet="app.use(rateLimiter); app.use('/api', routes);">
                    <rect x="0" y="0" width="100" height="100" fill="var(--color-bg-void)" stroke="var(--color-accent-secondary)" stroke-width="2"/>
                    <text x="50" y="55" fill="#fff" font-family="monospace" font-size="14" text-anchor="middle">API GW</text>
                    <text class="telemetry-label" x="50" y="80" fill="var(--color-accent-primary)" font-family="monospace" font-size="10" text-anchor="middle" visibility="hidden">12ms Latency</text>
                </g>
                
                <!-- DB Node -->
                <g class="interactive node" transform="translate(750, 150)" cursor="pointer" data-snippet="SELECT * FROM transactions WHERE status='PENDING';">
                    <rect x="0" y="0" width="100" height="100" fill="var(--color-bg-void)" stroke="#27c93f" stroke-width="2"/>
                    <text x="50" y="55" fill="#fff" font-family="monospace" font-size="14" text-anchor="middle">POSTGRES</text>
                    <text class="telemetry-label" x="50" y="80" fill="var(--color-accent-primary)" font-family="monospace" font-size="10" text-anchor="middle" visibility="hidden">1.2ms Load</text>
                </g>
            </svg>
            <div id="snippet-toast" style="position:absolute; top:20px; right:20px; background:#111; border:1px solid #333; padding:15px; border-radius:4px; font-family:monospace; color:var(--color-accent-primary); display:none; max-width: 300px; z-index: 10;">
                <h4 style="color:#fff; margin:0 0 10px 0;">Node Inspect</h4>
                <code></code>
            </div>
        </div>
    `;

    experienceSection.after(mapContainer);

    let telemetryOn = false;
    let telemetryInterval;
    
    document.getElementById('toggle-telemetry').addEventListener('click', (e) => {
        telemetryOn = !telemetryOn;
        e.target.style.background = telemetryOn ? 'var(--color-accent-primary)' : 'transparent';
        e.target.style.color = telemetryOn ? '#000' : '#fff';
        
        const labels = document.querySelectorAll('.telemetry-label');
        labels.forEach(l => l.setAttribute('visibility', telemetryOn ? 'visible' : 'hidden'));
        
        const edges = document.querySelectorAll('.svg-edge');
        edges.forEach(e => e.classList.toggle('pulse', telemetryOn));

        if (telemetryOn) {
            telemetryInterval = setInterval(() => {
                labels[0].textContent = `${500 + Math.floor(Math.random()*200)} Req/s`;
                labels[1].textContent = `${10 + Math.floor(Math.random()*5)}ms Latency`;
                labels[2].textContent = `1.${Math.floor(Math.random()*9)}ms Load`;
            }, 1000);
        } else {
            clearInterval(telemetryInterval);
        }
    });

    // Snippets on node click
    const nodes = document.querySelectorAll('.node');
    const toast = document.getElementById('snippet-toast');
    let toastTimeout;
    
    nodes.forEach(n => {
        n.addEventListener('click', () => {
            const code = n.getAttribute('data-snippet');
            toast.querySelector('code').innerText = code;
            toast.style.display = 'block';
            
            // GSAP pulse
            if(window.gsap) {
                gsap.fromTo(n.querySelector('rect'), 
                    { scale: 1.1, transformOrigin: 'center center' }, 
                    { scale: 1, duration: 0.3, ease: 'bounce.out' }
                );
            }

            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        });
    });
}
