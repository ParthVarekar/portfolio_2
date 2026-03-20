// terminal-bridge.js — jQuery Terminal CLI with IDE State Sync

let cwd = '~';

function initTerminalBridge() {
    if (typeof $ === 'undefined' || typeof $.fn.terminal === 'undefined') {
        console.warn('[Terminal] jQuery Terminal not loaded, retrying...');
        setTimeout(initTerminalBridge, 500);
        return;
    }

    const termEl = document.getElementById('terminal');
    if (!termEl) return;

    const term = $(termEl).terminal(function(command, term) {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const knownCommands = new Set([
            'help',
            'ls',
            'cd',
            'cat',
            'pwd',
            'projects',
            'skills',
            'contact',
            'about',
            'philosophy',
            'case',
            'system',
            'collab',
            'github',
            'linkedin',
            'play',
            'blog',
            'clear',
            'whoami',
            'neofetch',
            'sudo',
            'logs'
        ]);
        const isKnownCommand = !!cmd && knownCommands.has(cmd);

        switch (cmd) {
            case 'help':
                term.echo(`[[;#43BF6D;]COMMANDS:]
  ls              List directory contents
  cd [dir]        Change directory (syncs IDE sidebar)
  cat [file]      Open file in editor
  pwd             Print working directory
  projects        List deployed projects
  skills          Show tech stack
  contact         Display contact info
  about           System identity (glitch transition)
  philosophy      Print engineering principles
  case [id]       Open case study + wiring diagram
  system          Launch systems thinking visualizer
  collab          Initialize collaboration CTA
  github          Open GitHub profile
  linkedin        Open LinkedIn profile
  play [game]     Launch mini-game (hex | kern)
  blog            Show latest posts
  clear           Clear terminal
  help            Show this menu

  [[;#555;]Easter eggs: sudo, logs, neofetch, whoami]`);
                break;

            case 'ls': {
                const contents = window.listDirectory ? window.listDirectory(cwd) : null;
                if (contents) {
                    contents.forEach(item => {
                        const icon = item.type === 'dir' ? '📁' : '📄';
                        const color = item.type === 'dir' ? '#43BF6D' : '#888';
                        term.echo(`  ${icon} [[;${color};]${item.name}${item.type === 'dir' ? '/' : ''}]`);
                    });
                } else {
                    term.echo('[[;#FF5F56;]ERR: Cannot read directory.]');
                }
                break;
            }

            case 'cd': {
                if (!args[0]) {
                    cwd = '~';
                    updatePrompt(term);
                    break;
                }
                if (args[0] === '..') {
                    const parts = cwd.split('/');
                    parts.pop();
                    cwd = parts.join('/') || '~';
                    updatePrompt(term);
                    break;
                }

                const target = args[0].replace(/\/$/, '');
                const newPath = cwd === '~' ? target : `${cwd.replace('~/', '').replace('~', '')}/${target}`.replace(/^\//, '');

                // Check if path exists
                const check = window.listDirectory ? window.listDirectory(newPath) : null;
                if (check !== null) {
                    cwd = newPath === '' ? '~' : (newPath.startsWith('~') ? newPath : `~/${newPath}`);
                    updatePrompt(term);

                    // Sync IDE sidebar — highlight the folder
                    if (window.navigateToPath) {
                        window.navigateToPath(newPath);
                    }

                    term.echo(`[[;#43BF6D;]→ ${cwd}]`);
                } else {
                    term.echo(`[[;#FF5F56;]ERR: Directory '${target}' not found.]`);
                }
                break;
            }

            case 'cat': {
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: cat <filename>]');
                    break;
                }
                // Try to open the file in the IDE editor
                const cwdClean = cwd.replace('~/', '').replace('~', '');
                const filePath = cwdClean ? `${cwdClean}/${args[0]}` : args[0];
                if (window.navigateToPath) {
                    const ok = window.navigateToPath(filePath);
                    if (ok) {
                        term.echo(`[[;#43BF6D;]Opened ${args[0]} in editor ↑]`);
                    } else {
                        term.echo(`[[;#FF5F56;]ERR: File '${args[0]}' not found.]`);
                    }
                }
                break;
            }

            case 'pwd':
                term.echo(`[[;#43BF6D;]${cwd}]`);
                break;

            case 'projects': {
                const projects = window.AppState ? window.AppState.projectData : [];
                if (projects.length === 0) {
                    term.echo('[[;#FFBD2E;]No project data loaded.]');
                    break;
                }
                term.echo('[[;#43BF6D;]DEPLOYED.NODES:]');
                projects.forEach(p => {
                    const status = p.status === 'LIVE' ? '[[;#27C93F;]●]' : '[[;#FFBD2E;]○]';
                    term.echo(`  ${status} [[;#43BF6D;]${p.id}] — ${p.description.substring(0, 60)}...`);
                });
                term.echo('\n  Type [[;#43BF6D;]cd projects/<name>] to explore files.');
                break;
            }

            case 'skills':
                term.echo(`[[;#43BF6D;]SYSTEM.CAPABILITIES:]

  [[;#fff;]├── AI_VOICE_SYSTEMS]
     ├── Local LLMs & Prompt Engineering
     ├── Whisper (STT) & Edge TTS
     └── Data Extraction Pipelines

  [[;#fff;]├── BACKEND_INFRASTRUCTURE]
     ├── FastAPI, Python, PostgreSQL
     ├── WebSockets & Atomic Transactions
     └── Docker, GitHub Actions

  [[;#fff;]└── FRONTEND_UX]
     ├── React, TypeScript, Tailwind
     └── GSAP, Framer Motion, Three.js`);
                break;

            case 'contact':
                term.echo(`[[;#43BF6D;]CONTACT.VECTORS:]
  → Email: [[;#43BF6D;]parthvarekar27@gmail.com]
  → Phone: +91 7400082627
  → Location: Mumbai, India
  → GitHub: [[;#43BF6D;]github.com/ParthVarekar]
  → LinkedIn: [[;#43BF6D;]linkedin.com/in/parth-varekar-601432344]`);
                break;

            case 'github':
                window.open('https://github.com/ParthVarekar', '_blank');
                term.echo('[[;#43BF6D;]→ Opening GitHub...]');
                break;

            case 'linkedin':
                window.open('https://www.linkedin.com/in/parth-varekar-601432344/', '_blank');
                term.echo('[[;#43BF6D;]→ Opening LinkedIn...]');
                break;

            case 'play':
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: play <hex|kern>]');
                    break;
                }
                if (window.launchGame) {
                    window.launchGame(args[0]);
                    term.echo(`[[;#43BF6D;]→ Launching ${args[0]}...]`);
                } else {
                    term.echo('[[;#FF5F56;]ERR: Game launcher not loaded.]');
                }
                break;

            case 'blog':
                term.echo('[[;#43BF6D;]→ Scrolling to blog section...]');
                const blogSection = document.getElementById('bento-blog');
                if (blogSection) {
                    // Close editor, show dashboard, scroll
                    if (window.AppState) {
                        window.AppState.openTabs = [];
                        window.AppState.activeTab = null;
                    }
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('editor-pane').style.display = 'none';
                    document.getElementById('tabbar').innerHTML = '';
                    blogSection.scrollIntoView({ behavior: 'smooth' });
                }
                break;

            case 'about': {
                term.echo('[[;#43BF6D;]→ Loading System.Identity...]');
                // Glitch effect on bio card
                const bioGrid = document.getElementById('bento-bio');
                if (bioGrid) {
                    document.getElementById('dashboard').style.display = 'block';
                    document.getElementById('editor-pane').style.display = 'none';
                    document.getElementById('tabbar').innerHTML = '';
                    bioGrid.style.animation = 'none';
                    bioGrid.offsetHeight; // reflow
                    bioGrid.style.animation = 'glitch 0.3s ease-out';
                    bioGrid.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => bioGrid.style.animation = '', 500);
                }
                break;
            }

            case 'philosophy': {
                const phil = window.AppState ? window.AppState.philosophy : null;
                if (!phil) {
                    term.echo('[[;#FF5F56;]ERR: Philosophy data not loaded.]');
                    break;
                }
                term.echo('[[;#43BF6D;]ENGINEERING.PRINCIPLES:]');
                term.echo('');
                phil.principles.forEach((p, i) => {
                    setTimeout(() => {
                        term.echo(`  [[;#43BF6D;]${i + 1}.] [[;#aaa;]${p}]`);
                        if (i === phil.principles.length - 1) {
                            term.echo('');
                            term.echo(`[[;#555;]Decision style:] [[;#aaa;]${phil.decision_style.substring(0, 120)}...]`);
                        }
                    }, i * 400);
                });
                break;
            }

            case 'case': {
                if (!args[0]) {
                    term.echo('[[;#FFBD2E;]Usage: case <project_id> (e.g., case reboxed)]');
                    break;
                }
                const projectId = args[0];
                if (window.openCaseStudy) {
                    const ok = window.openCaseStudy(projectId);
                    if (ok) {
                        term.echo(`[[;#43BF6D;]→ Opening case study for ${projectId}...]`);
                        term.echo('[[;#43BF6D;]→ Infrastructure diagram loaded in second tab.]');
                    } else {
                        term.echo(`[[;#FF5F56;]ERR: No case study found for '${projectId}'. Try: reboxed, spendly, gym-tracker, spatial-learning]`);
                    }
                }
                break;
            }

            case 'system':
                if (window.openSystemsVisualizer) {
                    window.openSystemsVisualizer();
                    term.echo('[[;#43BF6D;]→ Launching Systems Thinking Visualizer...]');
                } else {
                    term.echo('[[;#FF5F56;]ERR: Systems Visualizer not loaded.]');
                }
                break;

            case 'collab':
                term.echo(`[[;#43BF6D;]╔══════════════════════════════════════════════╗
║  INITIALIZE COLLABORATION                    ║
║  Request system access for high-scale builds ║
╚══════════════════════════════════════════════╝]

  [[;#43BF6D;]→ Email:] parthvarekar27@gmail.com
  [[;#43BF6D;]→ GitHub:] github.com/ParthVarekar
  [[;#43BF6D;]→ LinkedIn:] linkedin.com/in/parth-varekar-601432344

  [[;#555;]Optimized for high-concurrency environments.]`);
                break;

            case 'sudo': {
                const isRoot = document.body.classList.contains('root-access');
                // GSAP glitch transition
                if (window.gsap) {
                    const workspace = document.querySelector('.workspace-shell');
                    gsap.to(workspace, {
                        duration: 0.1,
                        x: 2, y: -2,
                        repeat: 5,
                        yoyo: true,
                        onComplete: () => gsap.set(workspace, { x: 0, y: 0 })
                    });
                }
                
                if (!isRoot) {
                    term.echo('[[;#FF3366;]⚠ ROOT ACCESS GRANTED]');
                    term.echo('[[;#FF3366;]Switching to Admin Mode. Glitch transition active.]');
                    document.body.style.setProperty('--accent', '#FF3366');
                    document.body.classList.add('root-access');
                } else {
                    term.echo('[[;#43BF6D;]⚠ ROOT ACCESS REVOKED]');
                    term.echo('[[;#43BF6D;]Reverting to System User...]');
                    document.body.style.removeProperty('--accent');
                    document.body.classList.remove('root-access');
                }
                break;
            }

            case 'logs': {
                const logLines = [
                    '[[;#43BF6D;][BOOT]] Initializing career runtime...',
                    '[[;#555;][2021]] Loading Python fundamentals...',
                    '[[;#555;][2022]] Compiling Flask monoliths...',
                    '[[;#43BF6D;][2022]] React component architecture mounted.',
                    '[[;#555;][2023]] TypeScript strict mode enabled.',
                    '[[;#43BF6D;][2023]] PostgreSQL schemas deployed. Atomic transactions online.',
                    '[[;#FFBD2E;][2024]] WebSocket real-time layer initialized.',
                    '[[;#43BF6D;][2024]] Full-stack ownership achieved. DB → API → UI.',
                    '[[;#FFBD2E;][2025]] Local LLM pipeline compiled. Mistral-7B loaded.',
                    '[[;#43BF6D;][2025]] RAG architecture deployed. Vector store indexed.',
                    '[[;#FF5F56;][2025]] Multi-agent orchestration framework online.',
                    '[[;#43BF6D;][2026]] Voice interface (Whisper + Edge TTS) integrated.',
                    '[[;#43BF6D;][2026]] Agentic workflows operational. Tool-use chains active.',
                    '',
                    '[[;#43BF6D;]▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%]',
                    '[[;#43BF6D;]System ready. All nodes operational.]'
                ];
                logLines.forEach((line, i) => {
                    setTimeout(() => term.echo(line), i * 180);
                });
                break;
            }

            case 'whoami':
                term.echo(`[[;#43BF6D;]SYSTEM.IDENTITY // NARRATIVE:]
  
  [[;#fff;]2021-2022:] The Imperative Era. Building monolithic Flask apps and jQuery script-spaghetti. 
  Learning the foundational blocks of state and networking.
  
  [[;#fff;]2023-2024:] The Reactive Shift. Mastering Component-Driven Design and UI/UX engineering with 
  React/Next.js. Moving from "making it work" to "making it scale."
  
  [[;#fff;]2025-2026:] The Agentic Paradigm. Engineering AI Systems involving local LLM pipelines, 
  RAG architectures, and multi-agent orchestration. Operating at the intersection of UX and AGI.
  
  [[;#555;]Status: Active execution node.]`);
                break;

            case 'neofetch':
                const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#43BF6D';
                term.echo(`[[;${accent};]
      ___           ___           ___           ___     
     /\\  \\         /\\  \\         /\\  \\         /\\  \\    
    /::\\  \\       /::\\  \\       /::\\  \\       /::\\  \\   
   /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\  
  /::\\~\\:\\  \\   /::\\~\\:\\  \\   /::\\~\\:\\  \\   /::\\~\\:\\  \\ 
 /:/\\:\\ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/\\:\\ \\:\\__\\
 \\/__\\:\\/:/  / \\/__\\:\\/:/  / \\/__\\:\\/:/  / \\/__\\:\\/:/  /
      \\::/  /       \\::/  /       \\::/  /       \\::/  / 
      /:/  /        /:/  /        /:/  /        /:/  /  
     /:/  /        /:/  /        /:/  /        /:/  /   
     \\/__/         \\/__/         \\/__/         \\/__/    ]
  
  [[;#fff;]Parth Varekar] @ System.Workspace
  [[;#fff;]---------------------------------]
  [[;${accent};]OS:] Parth-OS v2.0 (Developer Edition)
  [[;${accent};]Shell:] SystemsThinking-Zsh v4.2
  [[;${accent};]Uptime:] 5 years (Full-Stack Runtime)
  [[;${accent};]Packages:] Mistral, React, GSAP, Postgres
  [[;${accent};]Resolution:] Fluid Pixel System active
  [[;${accent};]Palette:] [[;${accent};]●] [[;#888;]●] [[;#fff;]●] [[;#000;]●]`);
                break;

            case 'clear':
                term.clear();
                break;

            case '':
                break;

            default:
                term.echo(`[[;#FF5F56;]Command not found: ${cmd}.] Type [[;#43BF6D;]help] for available commands.`);
        }

        // Terminal sound mapping:
        // - recognized command -> success
        // - unknown command -> error
        if (cmd && window.PortfolioSound) {
            if (isKnownCommand) window.PortfolioSound.playTerminalSuccess();
            else window.PortfolioSound.playTerminalError();
        }
    }, {
        greetings: `[[;#43BF6D;]╔══════════════════════════════════════════╗
║  PARTH VAREKAR — WORKSPACE TERMINAL v2.0 ║
║  Type 'help' to begin.                   ║
╚══════════════════════════════════════════╝]`,
        prompt: function() { return `[[;#43BF6D;]${cwd}] [[;#888;]$] `; },
        name: 'workspace',
        height: '100%',
        onBlur: function() {
            document.getElementById('terminal-container')?.classList.remove('focused');
        },
        onFocus: function() {
            document.getElementById('terminal-container')?.classList.add('focused');
        },
        completion: ['help', 'ls', 'cd', 'cat', 'pwd', 'projects', 'skills', 'contact', 'about', 'philosophy', 'case', 'system', 'collab', 'github', 'linkedin', 'play', 'blog', 'clear', 'whoami', 'neofetch', 'sudo', 'logs'],
        checkArity: false,
        processArguments: false,
        keymap: {
            'CTRL+L': function(e, original) {
                this.clear();
            },
        }
    });

    function updatePrompt(term) {
        term.set_prompt(`[[;#43BF6D;]${cwd}] [[;#888;]$] `);
    }

    // Terminal resize handle
    const resizeHandle = document.getElementById('terminal-resize-handle');
    const termContainer = document.getElementById('terminal-container');
    if (resizeHandle && termContainer) {
        let isResizing = false;
        let startY, startH;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startH = termContainer.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const delta = startY - e.clientY;
            const newH = Math.min(Math.max(startH + delta, 100), window.innerHeight * 0.6);
            termContainer.style.height = newH + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    console.log('[Terminal] Bridge initialized');
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait a beat for jQuery Terminal to fully load
    setTimeout(initTerminalBridge, 300);
});
