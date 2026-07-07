// systems-visualizer.js — Interactive SVG flow diagram (LLM RAG pipeline)

function initSystemsVisualizer() {
    const overlay = document.getElementById('systems-overlay');
    if (!overlay) return;

    // Inject overlay HTML if not present
    if (!overlay.innerHTML.trim()) {
        overlay.innerHTML = `
            <div class="systems-viz-chrome">
                <div class="systems-viz-titlebar">
                    <span style="color:var(--accent); font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:2px;">
                        ◆ Systems Thinking // LLM RAG Pipeline
                    </span>
                    <button id="systems-close" class="systems-close-btn" aria-label="Close visualizer">&times;</button>
                </div>
                <div class="systems-viz-body">
                    <svg id="systems-svg" viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg"></svg>
                    <div id="systems-detail" class="systems-detail-panel"></div>
                </div>
            </div>
        `;
    }

    document.getElementById('systems-close')?.addEventListener('click', closeSystemsVisualizer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeSystemsVisualizer();
        }
    });
}

const NODES = [
    { id: 'user', x: 50, y: 230, w: 100, h: 40, label: 'User Query', color: '#43BF6D', detail: 'Natural language input from the React frontend. Sent as a POST to /query.' },
    { id: 'embed', x: 200, y: 130, w: 110, h: 40, label: 'Embedder', color: '#43BF6D', detail: 'Converts the query into a vector using tiktoken for token counting. ChromaDB handles embedding internally.' },
    { id: 'chunk', x: 200, y: 330, w: 110, h: 40, label: 'Chunker', color: '#FFBD2E', detail: 'Splits ingested documents into chunks for vector storage. Used during ingestion (file/URL/pasted text).' },
    { id: 'vectordb', x: 380, y: 130, w: 120, h: 40, label: 'ChromaDB', color: '#43BF6D', detail: 'Vector store. Cosine similarity search returns relevant chunks for the query.' },
    { id: 'sqlite', x: 380, y: 330, w: 110, h: 40, label: 'SQLite', color: '#FFBD2E', detail: 'Structured metadata store. Holds document records, conversation memory, and job tracking state.' },
    { id: 'prompt', x: 560, y: 230, w: 120, h: 40, label: 'Prompt Builder', color: '#43BF6D', detail: 'Assembles system prompt + retrieved context + user query. Routes to the configured LLM backend.' },
    { id: 'llm', x: 720, y: 230, w: 100, h: 40, label: 'Gemini / Ollama', color: '#FF5F56', detail: 'LLM backend. Gemini (cloud) or Ollama (local) — configurable. Streams tokens back via SSE.' },
    { id: 'response', x: 720, y: 370, w: 110, h: 40, label: 'SSE Response', color: '#43BF6D', detail: 'Streamed output via Server-Sent Events to the React frontend. Source attribution included.' },
    { id: 'writeback', x: 560, y: 370, w: 110, h: 40, label: 'Memory Write-back', color: '#FFBD2E', detail: 'After the stream ends, conversation memory + retrieved sources are persisted to SQLite. Decoupled from the live stream.' }
];

const EDGES = [
    { from: 'user', to: 'embed', label: 'encode' },
    { from: 'user', to: 'chunk', label: 'if new doc' },
    { from: 'chunk', to: 'vectordb', label: 'store' },
    { from: 'chunk', to: 'sqlite', label: 'metadata' },
    { from: 'embed', to: 'vectordb', label: 'query' },
    { from: 'vectordb', to: 'prompt', label: 'context' },
    { from: 'sqlite', to: 'prompt', label: 'history' },
    { from: 'prompt', to: 'llm', label: 'infer' },
    { from: 'llm', to: 'response', label: 'stream' },
    { from: 'response', to: 'writeback', label: 'after stream' },
    { from: 'writeback', to: 'sqlite', label: 'persist' }
];

function renderSVG() {
    const svg = document.getElementById('systems-svg');
    if (!svg) return;

    let html = `<defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#43BF6D" opacity="0.6"/>
        </marker>
        <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    </defs>`;

    // Edges
    EDGES.forEach(e => {
        const from = NODES.find(n => n.id === e.from);
        const to = NODES.find(n => n.id === e.to);
        const x1 = from.x + from.w;
        const y1 = from.y + from.h / 2;
        const x2 = to.x;
        const y2 = to.y + to.h / 2;
        const mx = (x1 + x2) / 2;

        html += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"
                    fill="none" stroke="#43BF6D" stroke-width="1.5" opacity="0.3"
                    marker-end="url(#arrowhead)" class="sys-edge"/>`;
        html += `<text x="${mx}" y="${(y1+y2)/2 - 6}" fill="#555" font-size="9"
                    font-family="var(--font-mono)" text-anchor="middle">${e.label}</text>`;
    });

    // Nodes
    NODES.forEach(n => {
        html += `<g class="sys-node" data-id="${n.id}" style="cursor:pointer;">
            <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="4"
                fill="rgba(2,2,2,0.8)" stroke="${n.color}" stroke-width="1.5" filter="url(#glow)"/>
            <text x="${n.x + n.w/2}" y="${n.y + n.h/2 + 4}" fill="#e6e6e6"
                font-size="11" font-family="var(--font-mono)" text-anchor="middle">${n.label}</text>
        </g>`;
    });

    svg.innerHTML = html;

    // Click handlers
    svg.querySelectorAll('.sys-node').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            const node = NODES.find(n => n.id === id);
            showNodeDetail(node);

            // Highlight
            svg.querySelectorAll('.sys-node rect').forEach(r => r.setAttribute('stroke-width', '1.5'));
            el.querySelector('rect').setAttribute('stroke-width', '3');
        });
    });
}

function showNodeDetail(node) {
    const panel = document.getElementById('systems-detail');
    if (!panel) return;
    panel.innerHTML = `
        <div style="border-left:3px solid ${node.color}; padding-left:12px;">
            <div style="color:${node.color}; font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                ◆ ${node.label}
            </div>
            <div style="color:#aaa; font-size:13px; line-height:1.6;">${node.detail}</div>
        </div>
    `;
    if (window.gsap) {
        gsap.fromTo(panel, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3 });
    }
}

function openSystemsVisualizer() {
    const overlay = document.getElementById('systems-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    renderSVG();
    // Auto-select first node
    setTimeout(() => showNodeDetail(NODES[0]), 200);
}

function closeSystemsVisualizer() {
    const overlay = document.getElementById('systems-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

window.openSystemsVisualizer = openSystemsVisualizer;
window.closeSystemsVisualizer = closeSystemsVisualizer;

document.addEventListener('DOMContentLoaded', initSystemsVisualizer);
