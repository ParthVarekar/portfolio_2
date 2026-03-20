// sound/terminal-classic.js — jQuery Terminal adapter for Classic View (index.html)

let currentCwd = '~';

function initTerminalClassic() {
    if (typeof $ === 'undefined' || typeof $.fn.terminal === 'undefined') {
        setTimeout(initTerminalClassic, 500);
        return;
    }

    const termEl = document.getElementById('terminal');
    if (!termEl) return;

    // Remove existing inner HTML nodes since jQuery terminal overrides them
    termEl.innerHTML = '';

    const term = $(termEl).terminal(function(command, term) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const knownCommands = new Set([
            'help', 'about', 'projects', 'open', 'skills', 'contact', 'play', 'github', 'linkedin', 'resume', 'clear'
        ]);
        const isKnown = cmd && knownCommands.has(cmd);

        switch (cmd) {
            case 'help':
                term.echo(`[[;#00F0FF;]COMMANDS:]
  about           View identity & focus
  projects        List deployed systems
  open [id]       Access deep case study (reboxed | spendly | gym | spatial)
  skills          View tech topology
  contact         Display routing details
  play [game]     Launch mini-game (hex)
  github          Authenticate remote repo
  linkedin        Open professional network
  resume          Fetch CV file
  clear           Flush terminal output`);
                break;

            case 'about':
                term.echo(`[[;#00F0FF;]PARTH VAREKAR // MUMBAI]
  > AI Systems & Full-Stack Engineering
  > Designing complete architectures, from local LLM pipelines to high-performance React interfaces.`);
                break;

            case 'projects':
                term.echo(`[[;#00F0FF;]DEPLOYED.NODES:]
  [ [[;#00F0FF;]reboxed] ] : Escrow Based Second Hand Marketplace
  [ [[;#00F0FF;]spendly] ] : Personal Finance Engine
  [ [[;#00F0FF;]gym] ]     : Body Tracking & Overload App
  [ [[;#00F0FF;]spatial] ] : WebGL Education System
  
  > Type 'open reboxed' to trigger telemetry.`);
                break;

            case 'open': {
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: open <project_id>]');
                    break;
                }
                const target = args[0].toLowerCase();
                const validModals = ['reboxed', 'spendly', 'gym', 'spatial'];
                if (validModals.includes(target)) {
                    if (window.openSystemModal) {
                        window.openSystemModal(`modal-${target}`);
                        term.echo(`[[;#00F0FF;]Accessing Node: ${target.toUpperCase()}...]`);
                    } else {
                        term.echo('[[;#FF5F56;]ERR: Modal system not available.]');
                    }
                } else if (['motion', 'fintech'].includes(target)) {
                    term.echo(`[[;#FF5F56;]Node '${target}' is classified LITE. Deep telemetry not available via terminal.]`);
                } else {
                    term.echo('[[;#FF5F56;]Syntax Error: Invalid node ID. Type "projects".]');
                }
                break;
            }

            case 'skills':
                term.echo('[[;#00F0FF;]Routing to /topology...]');
                const expSec = document.getElementById('section-experience');
                if (expSec) expSec.scrollIntoView({ behavior: 'smooth' });
                break;

            case 'contact':
                term.echo(`[[;#00F0FF;]CONTACT.VECTORS:]
  → Email: parthvarekar27@gmail.com
  → Phone: +91 7400082627
  → Location: Mumbai, India`);
                break;

            case 'github':
                window.open('https://github.com/ParthVarekar', '_blank');
                term.echo('[[;#00F0FF;]Establishing connection to remote repository...]');
                break;

            case 'linkedin':
                window.open('https://www.linkedin.com/in/parth-varekar-601432344/', '_blank');
                term.echo('[[;#00F0FF;]Opening professional network...]');
                break;

            case 'resume':
                term.echo('[[;#FF5F56;]ERR: Document currently under revision. Contact directly for copy.]');
                break;

            case 'play':
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: play <hex>]');
                    break;
                }
                if (window.launchGame) {
                    window.launchGame(args[0]);
                    term.echo(`[[;#00F0FF;]→ Launching ${args[0]}...]`);
                } else {
                    term.echo('[[;#FF5F56;]ERR: Game launcher not loaded.]');
                }
                break;

            case 'clear':
                term.clear();
                break;

            case '':
                break;

            default:
                term.echo(`[[;#FF5F56;]Command not found: ${cmd}.] Type [[;#00F0FF;]help] for available commands.`);
        }

        if (cmd && window.PortfolioSound) {
            if (isKnown) window.PortfolioSound.playTerminalSuccess();
            else window.PortfolioSound.playTerminalError();
        }
    }, {
        greetings: `[[;#00F0FF;]╔══════════════════════════════════════════╗
║  PARTH VAREKAR — CLASSIC TERMINAL v1.0   ║
║  Type 'help' to begin.                   ║
╚══════════════════════════════════════════╝]`,
        prompt: function() { return `[[;#00F0FF;]guest@parth.dev] [[;#888;]$] `; },
        name: 'classic_term',
        height: '100%',
        completion: ['help', 'about', 'projects', 'open', 'skills', 'contact', 'play', 'github', 'linkedin', 'resume', 'clear'],
        checkArity: false,
        processArguments: false
    });

    console.log('[Terminal Classic] Initialized');
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initTerminalClassic, 400);
});
