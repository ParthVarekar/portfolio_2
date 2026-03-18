// terminal.js
export function initTerminalEnhanced() {
    const hook = document.querySelector('[data-enhance="terminal"]');
    if (!hook) return;

    // Build DOM structure
    hook.innerHTML = `
        <div class="terminal-modal-overlay" id="enhanced-cli" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Enhanced Developer CLI">
            <div class="terminal-window">
                <div class="terminal-header">
                    <div class="terminal-controls">
                        <button class="t-btn close" aria-label="Close Terminal"></button>
                        <button class="t-btn min"></button>
                        <button class="t-btn max"></button>
                    </div>
                    <span>parth-sys-repl</span>
                </div>
                <div class="terminal-body" id="enhanced-output" aria-live="polite">
                    <div style="color:var(--color-accent-primary);">[SYSTEM] Enhanced Sandbox REPL v1.0. Type 'help' to begin.</div>
                </div>
                <div class="terminal-input-line">
                    <span>$</span>
                    <input type="text" id="enhanced-cmd-input" autocomplete="off" aria-label="Terminal Input Line">
                </div>
            </div>
        </div>
        <button id="trigger-enhanced-cli" class="interactive group relative px-4 py-2 mt-4 bg-white text-black font-bold uppercase tracking-wider text-xs overflow-hidden" aria-haspopup="dialog" aria-controls="enhanced-cli" style="display:none;">
            <span class="relative z-10">Enhanced CLI</span>
        </button>
    `;

    // Try to append a button next to the existing trigger, or just show the button we appended.
    const existingButton = document.querySelector('button[onclick*="section-terminal"]');
    const trigger = document.getElementById('trigger-enhanced-cli');
    if (existingButton && existingButton.parentNode) {
        existingButton.parentNode.appendChild(trigger);
        trigger.style.display = 'inline-block';
        trigger.style.marginLeft = '1rem';
    }

    const modal = document.getElementById('enhanced-cli');
    const closeBtn = modal.querySelector('.close');
    const input = document.getElementById('enhanced-cmd-input');
    const output = document.getElementById('enhanced-output');

    let previousFocus = null;

    trigger.addEventListener('click', () => {
        previousFocus = document.activeElement;
        modal.classList.add('active');
        hook.setAttribute('aria-hidden', 'false');
        input.focus();
    });

    closeBtn.addEventListener('click', closeTerminal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTerminal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeTerminal();
        }
    });

    function closeTerminal() {
        modal.classList.remove('active');
        hook.setAttribute('aria-hidden', 'true');
        if (previousFocus) previousFocus.focus();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim();
            if(!cmd) return;
            printOutput(`$ ${cmd}`, '#fff');
            processCommand(cmd);
            input.value = '';
        }
    });

    function printOutput(html, color = '#e6e6e6') {
        const line = document.createElement('div');
        line.style.color = color;
        line.innerHTML = html;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    function processCommand(cmdStr) {
        const parts = cmdStr.split(' ');
        const base = parts[0].toLowerCase();
        
        switch (base) {
            case 'help':
                printOutput(`
                    COMMANDS:<br>
                    ls         : list system modules<br>
                    open [id]  : open case study modal<br>
                    replay [id]: load playground demo iframe<br>
                    doc [id]   : show architecture docs<br>
                    metrics [id]: sample performance data<br>
                    eval       : (sandboxed) evaluate code<br>
                    clear      : clear terminal
                `, 'var(--color-accent-primary)');
                break;
            case 'ls':
                printOutput(`
                    modules/<br>
                    &nbsp;&nbsp;reboxed/<br>
                    &nbsp;&nbsp;spendly/<br>
                    &nbsp;&nbsp;gym/<br>
                    &nbsp;&nbsp;spatial/
                `);
                break;
            case 'open':
                if (parts[1]) {
                    const modalId = `modal-${parts[1]}`;
                    if(document.getElementById(modalId)) {
                        printOutput(`Opening ${parts[1]} GUI...`, 'var(--color-accent-primary)');
                        // close enhanced terminal so user can see modal
                        closeTerminal();
                        if(window.openSystemModal) window.openSystemModal(modalId);
                    } else {
                        printOutput(`ERR: Node '${parts[1]}' not found.`, '#ff5f56');
                    }
                } else {
                    printOutput(`Usage: open [project_name]`, '#ffbd2e');
                }
                break;
            case 'replay':
                if (parts[1]) {
                    const toggle = document.querySelector(`.play-toggle[data-project="${parts[1]}"]`);
                    if(toggle) {
                        printOutput(`Replaying timeline for ${parts[1]}...`, 'var(--color-accent-primary)');
                        closeTerminal();
                        toggle.click(); // Reveal iframe
                        toggle.scrollIntoView({behavior: 'smooth'});
                    } else {
                        printOutput(`ERR: No timeline available.`, '#ffbd2e');
                    }
                }
                break;
            case 'metrics':
                printOutput(`Fetching telemetry for ${parts[1] || 'all'}...<br>
                Requests/min: ${Math.floor(Math.random()*1000)}<br>
                Latency: ${Math.floor(Math.random()*50)+10}ms<br>
                Error Rate: 0.${Math.floor(Math.random()*9)}%`, 'var(--color-accent-primary)');
                break;
            case 'doc':
                closeTerminal();
                printOutput(`Opening architecture details...`);
                // Assume doc acts similarly to viewing architecture map
                const map = document.querySelector('.architecture-container');
                if (map) map.scrollIntoView({behavior: 'smooth'});
                break;
            case 'clear':
                output.innerHTML = '';
                printOutput('[SYSTEM] Terminal cleared.', 'var(--color-accent-primary)');
                break;
            case 'eval':
                // sandboxed eval snippet execution: limit what can be done.
                if (localStorage.getItem('ENABLE_EVAL') === 'true') {
                    const codeToRun = parts.slice(1).join(' ');
                    try {
                        const sandbox = document.createElement('iframe');
                        sandbox.style.display = 'none';
                        sandbox.sandbox = "allow-scripts"; // Only scripts, no DOM access parent
                        document.body.appendChild(sandbox);
                        const result = sandbox.contentWindow.eval(codeToRun);
                        printOutput(`< Result: ${result}`, '#33ff33');
                        document.body.removeChild(sandbox);
                    } catch(e) {
                        printOutput(`Error: ${e.message}`, '#ff5f56');
                    }
                } else {
                    printOutput(`EVAL DISABLED by default. Run 'localStorage.setItem("ENABLE_EVAL", "true")' locally to enable.`, '#ff5f56');
                }
                break;
            default:
                printOutput(`Command not found: ${base}. Type 'help'.`, '#ffbd2e');
        }
    }
}
