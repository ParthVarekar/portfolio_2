// telemetry.js
export function initTelemetryConfig() {
    const headerRow = document.querySelector('#section-projects h2');
    if (!headerRow) return;

    const toggle = document.createElement('div');
    toggle.className = 'flex items-center gap-2 mt-4';
    toggle.innerHTML = `
        <span class="font-mono text-xs text-gray-500 uppercase">Live Telemetry (Mock)</span>
        <button id="global-telemetry-toggle" class="border border-white/20 px-3 py-1 font-mono text-[10px] hover:bg-white hover:text-black transition-colors">
            [ OFF ]
        </button>
    `;

    headerRow.parentNode.insertBefore(toggle, headerRow.nextSibling);

    const btn = document.getElementById('global-telemetry-toggle');
    let isOn = false;

    btn.addEventListener('click', () => {
        isOn = !isOn;
        btn.innerHTML = isOn ? '[ ON ]' : '[ OFF ]';
        btn.style.background = isOn ? 'var(--color-accent-primary)' : 'transparent';
        btn.style.color = isOn ? '#000' : '#fff';

        // Add telemetry badges to project cards
        document.querySelectorAll('.glass-panel').forEach(card => {
            const content = card.querySelector('.glass-content');
            let badge = card.querySelector('.telemetry-badge');
            
            if (isOn) {
                if(!badge) {
                    badge = document.createElement('div');
                    badge.className = 'telemetry-badge font-mono text-[10px] bg-red-900/40 text-red-400 p-1 rounded mt-2';
                    if(content) content.querySelector('div').appendChild(badge);
                }
                const ping = setInterval(() => {
                    const lat = Math.floor(Math.random() * 50) + 10;
                    const err = (Math.random() * 2).toFixed(2);
                    if(badge) badge.innerText = `Latency: ${lat}ms | Err: ${err}%`;
                }, 1000);
                badge.dataset.pingId = ping;
                badge.style.display = 'block';
            } else {
                if(badge) {
                    clearInterval(parseInt(badge.dataset.pingId));
                    badge.style.display = 'none';
                }
            }
        });
    });
}
