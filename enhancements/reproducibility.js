// reproducibility.js
export function initReproducibilityPanel() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const widget = document.createElement('div');
    widget.className = 'reproducibility-widget';
    widget.innerHTML = `
        <button id="close-repro-widget" style="background:transparent; border:none; color:var(--color-accent-secondary); float:right; cursor:pointer;" aria-label="Close widget">[x]</button>
        <h4>[ Reproducibility Proof ]</h4>
        <p>Artifact signature valid. Clone env:</p>
        <input type="text" readonly value="git clone https://github.com/ParthVarekar/portfolio.git" onclick="this.select();">
        <p style="margin-top:5px;">SHA256: 3a9f0e...b412 (Mock)</p>
        <a href="#" style="color:var(--color-accent-primary); font-size:11px; text-decoration:none;">Download Signed Checksum</a>
    `;

    document.body.appendChild(widget);

    document.getElementById('close-repro-widget').addEventListener('click', () => {
        widget.style.display = 'none';
    });
}
