// workspace/components/SystemMap.js

export function getArchitectureSVG() {
    return `
    <div class="architecture-visualizer" style="display:grid; grid-template-columns: 1fr 300px; height: 100%; min-height: 500px;">
        <div class="arch-svg-container" style="padding: 24px; position:relative;">
            <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" opacity="0.6"/>
                    </marker>
                    <filter id="neonGlow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                
                <!-- Edges -->
                <path d="M 150 150 C 300 150, 200 300, 400 300" fill="none" class="arch-edge" stroke-width="2" marker-end="url(#arrow)"/>
                <path d="M 150 450 C 300 450, 200 300, 400 300" fill="none" class="arch-edge" stroke-width="2" marker-end="url(#arrow)"/>
                <path d="M 400 300 C 550 300, 500 150, 650 150" fill="none" class="arch-edge" stroke-width="2" marker-end="url(#arrow)"/>
                <path d="M 400 300 C 550 300, 500 450, 650 450" fill="none" class="arch-edge" stroke-width="2" marker-end="url(#arrow)"/>
                <path d="M 650 150 C 750 150, 700 300, 650 450" fill="none" class="arch-edge" stroke-dasharray="5,5" stroke-width="1.5" marker-end="url(#arrow)"/>

                <!-- Nodes -->
                <g class="arch-node" data-node="fastapi" tabindex="0" role="button" aria-label="FastAPI Gateway" transform="translate(150, 150)">
                    <circle r="36" fill="var(--bg-elevated)" class="arch-circle" filter="url(#neonGlow)"/>
                    <text y="5" text-anchor="middle" fill="#fff" font-family="var(--font-mono)" font-size="12">FastAPI</text>
                </g>
                <g class="arch-node" data-node="whisper" tabindex="0" role="button" aria-label="Whisper STT" transform="translate(150, 450)">
                    <circle r="36" fill="var(--bg-elevated)" class="arch-circle" filter="url(#neonGlow)"/>
                    <text y="5" text-anchor="middle" fill="#fff" font-family="var(--font-mono)" font-size="12">Whisper</text>
                </g>
                <g class="arch-node" data-node="redis" tabindex="0" role="button" aria-label="Redis Pub/Sub" transform="translate(400, 300)">
                    <circle r="42" fill="var(--bg-elevated)" class="arch-circle" filter="url(#neonGlow)"/>
                    <text y="5" text-anchor="middle" fill="#fff" font-family="var(--font-mono)" font-size="12">Redis</text>
                </g>
                <g class="arch-node" data-node="llm" tabindex="0" role="button" aria-label="Local LLM Inference" transform="translate(650, 150)">
                    <circle r="48" fill="var(--bg-elevated)" class="arch-circle" filter="url(#neonGlow)"/>
                    <text y="-5" text-anchor="middle" fill="#fff" font-family="var(--font-mono)" font-size="14">Mistral-7B</text>
                    <text y="15" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="10">llama.cpp</text>
                </g>
                <g class="arch-node" data-node="postgres" tabindex="0" role="button" aria-label="PostgreSQL Ledger" transform="translate(650, 450)">
                    <circle r="42" fill="var(--bg-elevated)" class="arch-circle" filter="url(#neonGlow)"/>
                    <text y="-5" text-anchor="middle" fill="#fff" font-family="var(--font-mono)" font-size="12">PostgreSQL</text>
                    <text y="15" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="10">pg_vector</text>
                </g>
            </svg>
        </div>
        <div class="arch-details-panel bento-card" style="border-radius:0; border-top:none; border-right:none; border-bottom:none; margin:0;">
            <div class="bento-card-label">Node Details</div>
            <div id="arch-detail-content" style="margin-top:24px;">
                <div style="color:var(--text-muted); font-family:var(--font-mono); font-size:12px;">
                    > Select a node in the visualizer to view implementation specs.
                </div>
            </div>
        </div>
    </div>
    `;
}

export const NodeSpecs = {
    fastapi: {
        title: "FastAPI Gateway",
        subtitle: "Async HTTP & WebSockets",
        specs: ["Python 3.11", "Uvicorn worker pool", "Pydantic validation"],
        notes: "Handles high-concurrency client connections. Uses Starlette's background tasks for non-blocking telemetry logging. P95 latency: ~14ms."
    },
    whisper: {
        title: "Whisper STT",
        subtitle: "Audio Processing Pipeline",
        specs: ["OpenAI Whisper (tiny-en)", "ffmpeg buffer", "VAD filtering"],
        notes: "Local voice processing. Chunks audio streams into 3s buffers, runs Voice Activity Detection (VAD) to skip silence, and performs inference on CPU. Accuracy: ~92%."
    },
    redis: {
        title: "Redis Pub/Sub",
        subtitle: "State PubSub & Queue",
        specs: ["Redis 7.0", "In-memory cache", "Event Bus"],
        notes: "The central nervous system. Routes LLM generation streams back to FastAPI WebSockets. Also handles rate limiting (token bucket) for API endpoints."
    },
    llm: {
        title: "Mistral-7B Inference",
        subtitle: "Local Agentic Engine",
        specs: ["GGUF Q4_K_M", "llama.cpp backend", "GPU Offload: 35 layers"],
        notes: "The reasoning core. Operates within a 4096 context window. Instruct format highly tuned to output JSON schemas for the frontend to consume directly."
    },
    postgres: {
        title: "PostgreSQL Config",
        subtitle: "pg_vector + Immutable Ledger",
        specs: ["Postgres 15", "pg_vector extension", "Serializable Isolation"],
        notes: "Stores conversation histories and embeddings for RAG retrieval limit: top-k=5 using HNSW indexing. Uses advisory locks for atomic critical-path transactions."
    }
};

export function bindArchitectureInteraction() {
    const nodes = document.querySelectorAll('.arch-node');
    const panel = document.getElementById('arch-detail-content');
    if (!nodes.length || !panel) return;

    nodes.forEach(node => {
        node.addEventListener('click', () => {
            const id = node.getAttribute('data-node');
            const data = NodeSpecs[id];
            if (!data) return;

            // Reset active states
            nodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');

            // Render details
            panel.innerHTML = `
                <div class="fade-in-up">
                    <div style="font-size:18px; font-weight:600; color:#fff; margin-bottom:4px;">${data.title}</div>
                    <div style="font-family:var(--font-mono); font-size:11px; color:var(--accent); margin-bottom:16px;">// ${data.subtitle}</div>
                    
                    <div style="margin-bottom:16px;">
                        ${data.specs.map(s => `<span class="bento-tag" style="margin-right:6px; margin-bottom:6px;">${s}</span>`).join('')}
                    </div>

                    <div style="color:#ccc; font-size:13px; line-height:1.6;">
                        ${data.notes}
                    </div>
                </div>
            `;
        });
        
        // Keyboard accessibility
        node.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                node.click();
            }
        });
    });
}
