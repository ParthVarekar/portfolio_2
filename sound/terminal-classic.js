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
            'help', 'ls', 'cd', 'pwd', 'cat', 'about', 'projects', 'open', 'skills', 'contact', 'play', 'github', 'linkedin', 'resume', 'clear', 'neofetch'
        ]);
        const isKnown = cmd && knownCommands.has(cmd);

        switch (cmd) {
            case 'help':
                term.echo(`[[;#00F0FF;]COMMANDS:]
  ls        List directory contents
  cd [dir]  Change directory
  pwd       Print working directory
  cat [file] Open file contents
  about     View identity & focus
  projects  List deployed systems
  open [id] Access deep case study
  skills    View tech topology
  contact   Display routing details
  play [g]  Launch mini-game (hex | kern | binary | dodge)
  github    Authenticate remote repo
  linkedin  Open professional network
  resume    Fetch CV file
  clear     Flush terminal output
  
  [[;#444;]Easter eggs: neofetch]`);
                break;

            case 'ls':
                term.echo('  📁 [[;#00F0FF;]projects/]');
                term.echo('  📁 [[;#00F0FF;]skills/]');
                term.echo('  📄 [[;#888;]README.md]');
                break;

            case 'cd':
                if (!args[0] || args[0] === '~') { currentCwd = '~'; }
                else if (args[0] === '..') { currentCwd = '~'; }
                else if (['projects', 'skills'].includes(args[0].replace('/', '').toLowerCase())) { 
                    currentCwd = '~/' + args[0].replace('/', '').toLowerCase(); 
                } else {
                    term.echo(`[[;#FF5F56;]cd: no such directory: ${args[0]}]`);
                }
                break;

            case 'pwd':
                term.echo(currentCwd);
                break;

            case 'cat':
                if (args[0] === 'README.md') {
                    term.echo(`[[;#00F0FF;]PARTH VAREKAR // SYSTEM LOG]
> Role: B.Tech CE student + AI systems builder
> Location: Mumbai, India
> Status: Open to internships & collaborations
> Type 'help' to audit commands.`);
                } else {
                    term.echo(`[[;#FF5F56;]cat: ${args[0] || ''}: No such file]`);
                }
                break;

            case 'neofetch':
                term.echo(`[[;#00F0FF;]            ..              ]  [[;#00F0FF;]OS:] Browser (Chrome/Firefox/Safari)
[[;#00F0FF;]          .oo.              ]  [[;#00F0FF;]Shell:] jQuery Terminal
[[;#00F0FF;]        .ooooo.             ]  [[;#00F0FF;]Runtime:] Vanilla JS + GSAP
[[;#00F0FF;]      .ooooooo.            ]  [[;#00F0FF;]Stack:] whisper.cpp, llama.cpp, Next.js
[[;#00F0FF;]    .ooooooooo.           ]  [[;#00F0FF;]Status:] B.Tech CE student (2024-2028)
[[;#00F0FF;]  .ooooooooooo.          ]  [[;#00F0FF;]Location:] Mumbai, India
[[;#00F0FF;] .ooooooooooooo.        ]
[[;#00F0FF;]  .ooooooooooo.          ]`);
                break;

            case 'about':
                term.echo(`[[;#00F0FF;]PARTH VAREKAR // MUMBAI]
  > B.Tech Computer Engineering student (Mumbai University, 2024-2028)
  > Building local-first AI systems: speech pipelines, RAG, browser safety, games.
  > Data Science intern @ Imarticus Learning (A+ grade, 2026).`);
                break;

            case 'projects':
                term.echo(`[[;#00F0FF;]ACTIVE.NODES:]
  [ [[;#00F0FF;]whisperflow]         ] : Offline STT + LLM pipeline (whisper.cpp + llama.cpp)
  [ [[;#00F0FF;]studyos]             ] : Local-first GATE prep PWA (Next.js + Prisma)
  [ [[;#00F0FF;]nexus-ai]            ] : Educational coding game (Pyodide/WASM)
  [ [[;#00F0FF;]second-brain]        ] : Local RAG knowledge base (ChromaDB + SSE)
  [ [[;#00F0FF;]agent-safety-net]    ] : Chrome MV3 AI agent safety layer
  [ [[;#00F0FF;]shorts-intelligence] ] : Multi-agent YouTube Shorts analyzer
  
  > Type 'open whisperflow' to view the case study.`);
                break;

            case 'open': {
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: open <project_id>]');
                    break;
                }
                const target = args[0].toLowerCase();
                // Map short terminal IDs to full modal IDs.
                const modalMap = {
                    'whisperflow': 'modal-whisperflow',
                    'studyos':     'modal-studyos',
                    'nexus':       'modal-nexus-ai',
                    'nexus-ai':    'modal-nexus-ai',
                    'brain':       'modal-second-brain',
                    'second-brain':'modal-second-brain',
                    'safety':      'modal-agent-safety-net',
                    'agent-safety-net': 'modal-agent-safety-net',
                    'shorts':      'modal-shorts-intelligence',
                    'shorts-intelligence': 'modal-shorts-intelligence'
                };
                if (modalMap[target]) {
                    if (window.openSystemModal) {
                        window.openSystemModal(modalMap[target]);
                        term.echo(`[[;#00F0FF;]Accessing Node: ${target.toUpperCase()}...]`);
                        if (window.__portfolioLogCommand) window.__portfolioLogCommand('open ' + target);
                    } else {
                        term.echo('[[;#FF5F56;]ERR: Modal system not available.]');
                    }
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
                window.open('https://www.linkedin.com/in/parth-varekar-a90b412b1/', '_blank');
                term.echo('[[;#00F0FF;]Opening professional network...]');
                break;

            case 'resume':
                window.open('/portfolio/Resume_Parth_Varekar.pdf', '_blank');
                term.echo('[[;#00F0FF;]Accessing curriculum vitae...]');
                break;

            case 'play':
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: play <hex | kern | binary | dodge>]');
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
║  PARTH VAREKAR — CLASSIC TERMINAL          ║
║  Type 'help' to begin.                     ║
╚══════════════════════════════════════════╝]`,
        prompt: function() { return `[[;#00F0FF;]guest@parthvarekar.vercel.app] [[;#888;]$] `; },
        name: 'classic_term',
        height: '100%',
        completion: ['help', 'about', 'projects', 'open', 'skills', 'contact', 'play', 'github', 'linkedin', 'resume', 'clear', 'neofetch', 'whisperflow', 'studyos', 'nexus-ai', 'second-brain', 'agent-safety-net', 'shorts-intelligence'],
        checkArity: false,
        processArguments: false
    });

    console.log('[Terminal Classic] Initialized');
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initTerminalClassic, 400);
});
