// workspace/components/SystemMap.js
// Interactive Skill Constellation — an SVG night-sky map of Parth's skills.
// Stars = technologies, grouped into constellations (AI Systems, Backend, Frontend, Tools).
// Click a star → highlight which projects use it + show details.
// Hover → twinkle intensifies. Mouse parallax for depth.

// ── Data: skills grouped into constellations ──
const PROJECTS = {
    whisperflow: { name: 'WhisperFlow', color: '#00F0FF' },
    studyos: { name: 'StudyOS', color: '#00F0FF' },
    nexusai: { name: 'Nexus-AI', color: '#00F0FF' },
    secondbrain: { name: "2'nd_Brain", color: '#B547E6' },
    agentsafety: { name: 'Agent Safety Net', color: '#FF0055' },
    shortsintel: { name: 'Shorts Intel OS', color: '#FFBD2E' }
};

const CONSTELLATIONS = [
    {
        id: 'ai',
        name: 'AI Systems',
        color: '#00F0FF',
        cx: 200, cy: 130,
        stars: [
            { id: 'whispercpp', label: 'whisper.cpp', x: 120, y: 90, size: 4, projects: ['whisperflow'], detail: 'Compiled C++ STT binary. Driven via subprocess in WhisperFlow — zero pip dependencies.' },
            { id: 'llamacpp', label: 'llama.cpp', x: 180, y: 60, size: 5, projects: ['whisperflow', 'studyos'], detail: 'Local LLM HTTP server (llama-server). Used in WhisperFlow for reasoning + StudyOS for answer evaluation (Gemma 4).' },
            { id: 'pyodide', label: 'Pyodide / WASM', x: 250, y: 100, size: 4, projects: ['nexusai'], detail: 'Real CPython compiled to WebAssembly. Runs player code in Nexus-AI inside a Web Worker with 10s timeout guard.' },
            { id: 'chromadb', label: 'ChromaDB', x: 160, y: 160, size: 3.5, projects: ['secondbrain'], detail: 'Vector store in 2\'nd_Brain. Cosine similarity search over embedded document chunks.' },
            { id: 'faiss', label: 'FAISS', x: 240, y: 170, size: 3, projects: ['shortsintel'], detail: 'Vector similarity search in Shorts Intelligence OS. Pattern learning across analysis runs.' },
            { id: 'nim', label: 'NVIDIA NIM', x: 290, y: 140, size: 3.5, projects: ['shortsintel'], detail: 'Optional high-value LLM reasoning in Shorts Intel OS. Paced scheduler + exponential backoff + response cache.' }
        ],
        lines: [['whispercpp','llamacpp'], ['llamacpp','pyodide'], ['pyodide','chromadb'], ['chromadb','faiss'], ['faiss','nim'], ['llamacpp','chromadb']]
    },
    {
        id: 'backend',
        name: 'Backend',
        color: '#43BF6D',
        cx: 500, cy: 130,
        stars: [
            { id: 'python', label: 'Python', x: 440, y: 90, size: 5, projects: ['whisperflow', 'nexusai', 'secondbrain', 'shortsintel'], detail: 'Primary language across 4 projects. WhisperFlow orchestrator, Nexus-AI (via Pyodide), 2\'nd_Brain backend, Shorts Intel OS pipeline.' },
            { id: 'fastapi', label: 'FastAPI', x: 520, y: 70, size: 4, projects: ['secondbrain', 'shortsintel'], detail: 'Backend framework for 2\'nd_Brain and Shorts Intelligence OS. SSE streaming, async endpoints, background jobs.' },
            { id: 'sqlite', label: 'SQLite', x: 560, y: 120, size: 4, projects: ['studyos', 'secondbrain', 'shortsintel'], detail: 'Local-first persistence in 3 projects — StudyOS (Prisma), 2\'nd_Brain (metadata + memory), Shorts Intel OS (patterns + NIM cache).' },
            { id: 'prisma', label: 'Prisma', x: 470, y: 160, size: 3.5, projects: ['studyos'], detail: 'ORM for StudyOS. 13 models: Goal, Subject, Topic, TestAttempt, StudySession, Note, Document, ChatSession, etc.' },
            { id: 'playwright', label: 'Playwright', x: 550, y: 170, size: 3, projects: ['secondbrain'], detail: 'Stealth web scraper in 2\'nd_Brain. playwright-stealth bypasses bot detection on JS-heavy pages.' }
        ],
        lines: [['python','fastapi'], ['fastapi','sqlite'], ['python','prisma'], ['prisma','sqlite'], ['python','playwright'], ['playwright','fastapi']]
    },
    {
        id: 'frontend',
        name: 'Frontend',
        color: '#FF0055',
        cx: 200, cy: 340,
        stars: [
            { id: 'typescript', label: 'TypeScript', x: 120, y: 320, size: 4, projects: ['studyos', 'agentsafety'], detail: 'Used in StudyOS (Next.js) and Agent Safety Net (Chrome extension). Type-safe full-stack.' },
            { id: 'nextjs', label: 'Next.js 16', x: 200, y: 300, size: 4.5, projects: ['studyos'], detail: 'Full-stack framework for StudyOS. App Router, API routes, PWA service worker, TanStack Query + Zustand.' },
            { id: 'canvas', label: 'Canvas API', x: 270, y: 330, size: 3.5, projects: ['nexusai'], detail: 'Custom zero-dependency Canvas engine in Nexus-AI. 60 FPS fixed timestep, camera lerping, AABB collision.' },
            { id: 'codemirror', label: 'CodeMirror 6', x: 160, y: 380, size: 3, projects: ['nexusai'], detail: 'Code editor in Nexus-AI. Player writes Python, CodeMirror provides syntax highlighting + editing.' },
            { id: 'react', label: 'React 19', x: 250, y: 380, size: 3.5, projects: ['studyos', 'agentsafety', 'secondbrain'], detail: 'UI framework for StudyOS, Agent Safety Net popup, and 2\'nd_Brain frontend (Vite).' }
        ],
        lines: [['typescript','nextjs'], ['nextjs','canvas'], ['canvas','codemirror'], ['codemirror','react'], ['react','typescript'], ['nextjs','react']]
    },
    {
        id: 'platform',
        name: 'Platform & Tools',
        color: '#FFBD2E',
        cx: 500, cy: 340,
        stars: [
            { id: 'chromemv3', label: 'Chrome MV3', x: 430, y: 310, size: 4, projects: ['agentsafety'], detail: 'Manifest V3 extension in Agent Safety Net. MAIN world script injection to monkey-patch fetch/XHR.' },
            { id: 'pwa', label: 'PWA / SW', x: 520, y: 300, size: 3.5, projects: ['studyos'], detail: 'Progressive Web App in StudyOS. Custom service worker for full offline support — data never leaves the machine.' },
            { id: 'gsap', label: 'GSAP', x: 570, y: 340, size: 3, projects: [], detail: 'Animation library used across this portfolio site (scroll triggers, hero animations, modal transitions).' },
            { id: 'tailwind', label: 'Tailwind CSS', x: 450, y: 380, size: 3.5, projects: ['studyos', 'agentsafety'], detail: 'Utility-first CSS in StudyOS and Agent Safety Net. Tailwind 4 in StudyOS, Tailwind + shadcn/ui in Agent Safety Net.' },
            { id: 'tiktoken', label: 'tiktoken', x: 540, y: 380, size: 3, projects: ['secondbrain'], detail: 'Token counting in 2\'nd_Brain. Used for chunking documents and managing LLM context windows.' }
        ],
        lines: [['chromemv3','pwa'], ['pwa','gsap'], ['gsap','tailwind'], ['tailwind','chromemv3'], ['pwa','tiktoken'], ['tailwind','tiktoken']]
    }
];

// Flatten all stars for lookup
const ALL_STARS = {};
CONSTELLATIONS.forEach(c => c.stars.forEach(s => { ALL_STARS[s.id] = { ...s, constellation: c.id, constellationColor: c.color }; }));

// ── Render the SVG ──
export function getArchitectureSVG() {
    let html = `<div style="padding:20px; height:100%; box-sizing:border-box; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
                <div style="font-family:var(--font-mono); font-size:16px; color:#fff; font-weight:600;">✦ Skill Constellation</div>
                <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); margin-top:2px;">Click a star to see which projects use it. ${CONSTELLATIONS.length} constellations · ${Object.keys(ALL_STARS).length} skills.</div>
            </div>
            <div style="display:flex; gap:10px; font-family:var(--font-mono); font-size:10px; flex-wrap:wrap;">
                ${CONSTELLATIONS.map(c => `<span style="color:${c.color};">● ${c.name}</span>`).join('')}
            </div>
        </div>

        <svg id="constellation-svg" viewBox="0 0 690 460" style="width:100%; flex:1; min-height:0; background:radial-gradient(ellipse at center, #0a0a1a 0%, #020208 100%); border:1px solid rgba(255,255,255,0.05); border-radius:4px;" preserveAspectRatio="xMidYMid meet">`;

    // Background twinkling stars (decorative)
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 690, y = Math.random() * 460, r = Math.random() * 0.8 + 0.2;
        const opacity = Math.random() * 0.4 + 0.1;
        html += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${opacity}"><animate attributeName="opacity" values="${opacity};${opacity * 0.3};${opacity}" dur="${2 + Math.random() * 3}s" repeatCount="indefinite"/></circle>`;
    }

    // Constellation lines (drawn first, behind stars)
    CONSTELLATIONS.forEach(c => {
        c.lines.forEach(([from, to]) => {
            const s1 = c.stars.find(s => s.id === from);
            const s2 = c.stars.find(s => s.id === to);
            if (!s1 || !s2) return;
            html += `<line class="const-line" data-const="${c.id}"
                        x1="${s1.x}" y1="${s1.y}" x2="${s2.x}" y2="${s2.y}"
                        stroke="${c.color}" stroke-width="0.8" opacity="0.2" stroke-dasharray="2,2"/>`;
        });
    });

    // Constellation labels
    CONSTELLATIONS.forEach(c => {
        html += `<text x="${c.cx}" y="${c.cy}" fill="${c.color}" font-size="9"
                    font-family="var(--font-mono)" text-anchor="middle" opacity="0.4"
                    style="text-transform:uppercase; letter-spacing:2px; font-weight:600;">${c.name}</text>`;
    });

    // Stars
    CONSTELLATIONS.forEach(c => {
        c.stars.forEach(s => {
            const projectCount = s.projects.length;
            const starSize = s.size + (projectCount * 0.5); // bigger if used in more projects
            html += `<g class="const-star" data-id="${s.id}" data-const="${c.id}" style="cursor:pointer;">
                <circle cx="${s.x}" cy="${s.y}" r="${starSize + 6}" fill="${c.color}" opacity="0.08"/>
                <circle cx="${s.x}" cy="${s.y}" r="${starSize + 2}" fill="${c.color}" opacity="0.2">
                    <animate attributeName="opacity" values="0.15;0.35;0.15" dur="${2 + Math.random() * 2}s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${s.x}" cy="${s.y}" r="${starSize}" fill="${c.color}" opacity="0.9">
                    <animate attributeName="r" values="${starSize};${starSize * 1.15};${starSize}" dur="${3 + Math.random() * 2}s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${s.x}" cy="${s.y}" r="1" fill="#fff"/>
                <text x="${s.x}" y="${s.y + starSize + 12}" fill="#aaa" font-size="8"
                    font-family="var(--font-mono)" text-anchor="middle" style="pointer-events:none;">${s.label}</text>
                ${projectCount > 0 ? `<text x="${s.x}" y="${s.y - starSize - 6}" fill="${c.color}" font-size="7"
                    font-family="var(--font-mono)" text-anchor="middle" opacity="0.6" style="pointer-events:none;">${projectCount} project${projectCount > 1 ? 's' : ''}</text>` : ''}
            </g>`;
        });
    });

    html += `</svg>

        <div id="constellation-detail" style="font-family:var(--font-mono); font-size:12px; color:#aaa; padding:12px 14px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:4px; min-height:60px; line-height:1.6;">
            <span style="color:var(--text-muted);">✦ Click a star to explore which projects use that skill.</span>
        </div>
    </div>`;
    return html;
}

// ── Interaction ──
export function bindArchitectureInteraction() {
    const svg = document.getElementById('constellation-svg');
    const detail = document.getElementById('constellation-detail');
    if (!svg || !detail) return;

    const allStars = svg.querySelectorAll('.const-star');
    const allLines = svg.querySelectorAll('.const-line');

    function reset() {
        allStars.forEach(g => {
            g.style.opacity = '1';
            const circles = g.querySelectorAll('circle');
            circles.forEach(c => c.style.filter = 'none');
        });
        allLines.forEach(l => { l.style.opacity = '0.2'; l.style.strokeWidth = '0.8'; });
        detail.innerHTML = '<span style="color:var(--text-muted);">✦ Click a star to explore which projects use that skill.</span>';
    }

    function highlight(starId) {
        const star = ALL_STARS[starId];
        if (!star) return;
        const connectedProjectIds = new Set(star.projects);
        const connectedConstellation = star.constellation;

        // Dim all stars
        allStars.forEach(g => {
            const id = g.dataset.id;
            const s = ALL_STARS[id];
            if (id === starId) {
                g.style.opacity = '1';
                const circles = g.querySelectorAll('circle');
                circles.forEach(c => c.style.filter = 'drop-shadow(0 0 8px ' + star.constellationColor + ')');
            } else if (s && s.projects.some(p => star.projects.includes(p))) {
                // Star shares a project with the selected one
                g.style.opacity = '0.8';
            } else if (s && s.constellation === connectedConstellation) {
                g.style.opacity = '0.5';
            } else {
                g.style.opacity = '0.15';
            }
        });

        // Highlight lines in same constellation
        allLines.forEach(l => {
            if (l.dataset.const === connectedConstellation) {
                l.style.opacity = '0.5';
                l.style.strokeWidth = '1.2';
            } else {
                l.style.opacity = '0.05';
            }
        });

        // Build detail panel
        const projectBadges = star.projects.length > 0
            ? star.projects.map(pid => {
                  const p = PROJECTS[pid];
                  return p ? `<span style="display:inline-block; background:${p.color}22; color:${p.color}; border:1px solid ${p.color}55; padding:2px 8px; border-radius:3px; font-size:11px; margin:2px 4px 2px 0;">${p.name}</span>` : '';
              }).join('')
            : '<span style="color:var(--text-muted);">used in this portfolio site</span>';

        detail.innerHTML = `
            <div style="margin-bottom:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="color:${star.constellationColor}; font-weight:700; font-size:14px;">✦ ${star.label}</span>
                <span style="color:var(--text-muted); font-size:10px; text-transform:uppercase; letter-spacing:1px;">${star.constellation}</span>
            </div>
            <div style="color:#bbb; margin-bottom:8px;">${star.detail}</div>
            <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Used in ${star.projects.length} project${star.projects.length !== 1 ? 's' : ''}:</div>
            <div>${projectBadges}</div>`;
    }

    allStars.forEach(g => {
        g.addEventListener('click', (e) => {
            e.stopPropagation();
            highlight(g.dataset.id);
        });
    });

    svg.addEventListener('click', (e) => { if (e.target === svg) reset(); });

    // Mouse parallax (subtle depth effect)
    let parallaxRaf;
    svg.addEventListener('mousemove', (e) => {
        if (parallaxRaf) return;
        parallaxRaf = requestAnimationFrame(() => {
            const rect = svg.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width - 0.5;
            const my = (e.clientY - rect.top) / rect.height - 0.5;
            svg.style.transform = `perspective(800px) rotateY(${mx * 3}deg) rotateX(${-my * 3}deg)`;
            parallaxRaf = null;
        });
    });
    svg.addEventListener('mouseleave', () => { svg.style.transform = ''; });
}

export const NodeSpecs = ALL_STARS;
