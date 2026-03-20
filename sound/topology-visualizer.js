// sound/topology-visualizer.js — Interactive Architecture Traffic Visualizer

(function () {
    const canvas = document.getElementById('topo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale canvas safely
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 300);

    // --- 1. Topologies Datasets ---
    const designs = {
        reboxed: {
            nodes: [
                { id: 'client', x: 120, y: 200, label: 'CLIENT', color: '#00F0FF' },
                { id: 'apigw', x: 280, y: 200, label: 'API GW', color: '#FF0055' },
                { id: 'app', x: 480, y: 130, label: 'FASTAPI', color: '#FF0055' },
                { id: 'redis', x: 480, y: 270, label: 'REDIS', color: '#FFBD2E' },
                { id: 'postgres', x: 680, y: 130, label: 'POSTGRES', color: '#27C93F' },
                { id: 'escrow', x: 680, y: 270, label: 'ESCROW', color: '#FFBD2E' }
            ],
            mobileNodes: [
                { id: 'client', x: 180, y: 40, label: 'CLIENT', color: '#00F0FF' },
                { id: 'apigw', x: 180, y: 110, label: 'API GW', color: '#FF0055' },
                { id: 'app', x: 110, y: 200, label: 'FASTAPI', color: '#FF0055' },
                { id: 'redis', x: 250, y: 200, label: 'REDIS', color: '#FFBD2E' },
                { id: 'postgres', x: 110, y: 290, label: 'POSTGRES', color: '#27C93F' },
                { id: 'escrow', x: 250, y: 290, label: 'ESCROW', color: '#FFBD2E' }
            ],
            edges: [
                { from: 'client', to: 'apigw', speed: 0.006 },
                { from: 'apigw', to: 'app', speed: 0.008 },
                { from: 'apigw', to: 'redis', speed: 0.009 },
                { from: 'app', to: 'postgres', speed: 0.007 },
                { from: 'redis', to: 'app', speed: 0.012 },
                { from: 'app', to: 'escrow', speed: 0.005 }
            ]
        },
        ai: {
            nodes: [
                { id: 'user', x: 120, y: 200, label: 'USER', color: '#00F0FF' },
                { id: 'ctrl', x: 300, y: 200, label: 'CONTROLLER', color: '#FF0055' },
                { id: 'embed', x: 480, y: 130, label: 'EMBEDDINGS', color: '#B547E6' },
                { id: 'vector', x: 480, y: 270, label: 'VECTOR DB', color: '#27C93F' },
                { id: 'llm', x: 680, y: 200, label: 'LOCAL LLM', color: '#00F0FF' }
            ],
            mobileNodes: [
                { id: 'user', x: 180, y: 40, label: 'USER', color: '#00F0FF' },
                { id: 'ctrl', x: 180, y: 110, label: 'CONTROLLER', color: '#FF0055' },
                { id: 'embed', x: 110, y: 200, label: 'EMBEDDINGS', color: '#B547E6' },
                { id: 'vector', x: 250, y: 200, label: 'VECTOR DB', color: '#27C93F' },
                { id: 'llm', x: 180, y: 290, label: 'LOCAL LLM', color: '#00F0FF' }
            ],
            edges: [
                { from: 'user', to: 'ctrl', speed: 0.006 },
                { from: 'ctrl', to: 'embed', speed: 0.008 },
                { from: 'embed', to: 'vector', speed: 0.008 },
                { from: 'vector', to: 'llm', speed: 0.009 },
                { from: 'llm', to: 'ctrl', speed: 0.005 }
            ]
        },
        game: {
            nodes: [
                { id: 'input', x: 180, y: 200, label: 'INPUT', color: '#00F0FF' },
                { id: 'state', x: 380, y: 200, label: 'STATE', color: '#FF0055' },
                { id: 'canvas', x: 580, y: 130, label: 'CANVAS', color: '#FFBD2E' },
                { id: 'audio', x: 580, y: 270, label: 'AUDIO', color: '#27C93F' }
            ],
            mobileNodes: [
                { id: 'input', x: 180, y: 50, label: 'INPUT', color: '#00F0FF' },
                { id: 'state', x: 180, y: 150, label: 'STATE', color: '#FF0055' },
                { id: 'canvas', x: 110, y: 260, label: 'CANVAS', color: '#FFBD2E' },
                { id: 'audio', x: 250, y: 260, label: 'AUDIO', color: '#27C93F' }
            ],
            edges: [
                { from: 'input', to: 'state', speed: 0.012 },
                { from: 'state', to: 'canvas', speed: 0.015 },
                { from: 'state', to: 'audio', speed: 0.01 }
            ]
        }
    };

    let currentType = 'reboxed';
    let particles = [];

    function getNodes(layout) {
        return (window.innerWidth < 768 && layout.mobileNodes) ? layout.mobileNodes : layout.nodes;
    }

    window.switchTopology = function (type) {
        if (!designs[type]) return;
        currentType = type;
        particles = []; // Flush old coordinates

        // Update button UI state setup
        document.querySelectorAll('.topo-btn').forEach(btn => {
            btn.classList.remove('active', 'border-accent', 'text-accent');
            btn.classList.add('border-white/20', 'text-gray-400');
        });
        const activeBtn = document.getElementById(`btn-topo-${type}`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-accent', 'text-accent');
            activeBtn.classList.remove('border-white/20', 'text-gray-400');
        }
    };

    // --- 2. Particle spawner loop ---
    function spawnParticles() {
        const layout = designs[currentType];
        const nodes = getNodes(layout);
        if (Math.random() < 0.15) { // Spawn rate
            const edge = layout.edges[Math.floor(Math.random() * layout.edges.length)];
            const fromNode = nodes.find(n => n.id === edge.from);
            if (!fromNode) return;
            particles.push({
                edge: edge,
                progress: 0,
                speed: edge.speed * (0.8 + Math.random() * 0.4),
                color: fromNode.color
            });
        }
    }

    // --- 3. Animation frame ---
    function animate() {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        const layout = designs[currentType];
        const nodes = getNodes(layout);

        // Draw Edges
        ctx.lineWidth = 1.2;
        layout.edges.forEach(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        });

        // Update & Draw Particles
        spawnParticles();
        ctx.shadowBlur = 4;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const from = nodes.find(n => n.id === p.edge.from);
            const to = nodes.find(n => n.id === p.edge.to);
            if (!from || !to) continue;

            p.progress += p.speed;
            if (p.progress >= 1) {
                particles.splice(i, 1);
                continue;
            }

            const x = from.x + (to.x - from.x) * p.progress;
            const y = from.y + (to.y - from.y) * p.progress;

            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0; // reset

        // Draw Nodes
        nodes.forEach(node => {
            // Box
            ctx.fillStyle = '#0a0a0a';
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.5;
            const w = 90, h = 34; // slightly slimmer for mobile compatibility
            ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
            ctx.strokeRect(node.x - w / 2, node.y - h / 2, w, h);

            // Shadow glow
            ctx.strokeStyle = `rgba(255, 255, 255, 0.02)`;
            ctx.lineWidth = 4;
            ctx.strokeRect(node.x - w / 2 - 2, node.y - h / 2 - 2, w + 4, h + 4);

            // label
            ctx.font = 'bold 9px "Fira Code", monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);
        });

        requestAnimationFrame(animate);
    }

    animate();
    resize();
})();
