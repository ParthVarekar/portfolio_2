// games/data-dodge.js — Cyberpunk dodge game.
// You're a data packet moving left/right. Dodge incoming obstacles (viruses/firewalls).
// Speed increases over time. Uses left/right D-pad on mobile.

export function startDataDodge(canvas, onScore, onGameOver) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let score = 0;
    let gameOver = false;
    let rafId;
    let lastTick = performance.now();
    let spawnTimer = 0;
    let speed = 2;
    let elapsed = 0;

    // Player
    const player = { x: W / 2, y: H - 40, w: 24, h: 24, speed: 5 };
    let targetX = player.x;

    // Obstacles
    const obstacles = [];
    // Particles (trail)
    const particles = [];

    const keys = { left: false, right: false };

    function spawnObstacle() {
        const types = [
            { color: '#FF0055', label: 'VIRUS', w: 30, h: 20 },
            { color: '#FFBD2E', label: 'WALL', w: 60, h: 16 },
            { color: '#B547E6', label: 'FIRE', w: 20, h: 30 }
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        obstacles.push({
            x: Math.random() * (W - t.w),
            y: -t.h,
            w: t.w, h: t.h,
            color: t.color,
            label: t.label,
            vy: speed + Math.random() * 1.5
        });
    }

    function update(dt) {
        elapsed += dt;
        speed = 2 + elapsed * 0.05; // gradually faster

        // Move player toward target (smooth)
        const dx = targetX - player.x;
        player.x += dx * 0.2;
        player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

        // Keyboard
        if (keys.left) targetX -= player.speed * 1.5;
        if (keys.right) targetX += player.speed * 1.5;
        targetX = Math.max(player.w / 2, Math.min(W - player.w / 2, targetX));

        // Trail particles
        if (Math.random() < 0.5) {
            particles.push({ x: player.x + (Math.random() - 0.5) * 10, y: player.y + 10, life: 0.5, vy: 1 });
        }
        particles.forEach((p, i) => {
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        });

        // Spawn obstacles
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnObstacle();
            spawnTimer = Math.max(0.3, 1.2 - elapsed * 0.01);
        }

        // Move obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.y += o.vy;

            // Collision (AABB)
            if (player.x - player.w / 2 < o.x + o.w &&
                player.x + player.w / 2 > o.x &&
                player.y - player.h / 2 < o.y + o.h &&
                player.y + player.h / 2 > o.y) {
                gameOver = true;
                onGameOver(score);
                return;
            }

            // Off screen
            if (o.y > H) {
                obstacles.splice(i, 1);
                score += 1;
                onScore(score);
            }
        }
    }

    function render() {
        // Background
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, W, H);

        // Scrolling grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
        ctx.lineWidth = 1;
        const gridOffset = (elapsed * 30) % 30;
        for (let y = -30 + gridOffset; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }

        // Score
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 14px "Fira Code", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 16, 26);
        ctx.textAlign = 'right';
        ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, W - 16, 26);

        // Trail particles
        particles.forEach(p => {
            ctx.fillStyle = `rgba(0, 240, 255, ${p.life * 0.6})`;
            ctx.fillRect(p.x - 1, p.y, 2, 2);
        });

        // Obstacles
        obstacles.forEach(o => {
            ctx.fillStyle = o.color + '33';
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = o.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(o.x, o.y, o.w, o.h);
            ctx.fillStyle = o.color;
            ctx.font = '8px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 3);
        });

        // Player (data packet)
        const px = player.x, py = player.y;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00F0FF';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.fillRect(px - 10, py - 10, 20, 20);
        ctx.strokeRect(px - 10, py - 10, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DATA', px, py + 3);

        if (gameOver) {
            ctx.fillStyle = 'rgba(2, 2, 8, 0.8)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FF0055';
            ctx.font = 'bold 28px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CONNECTION LOST', W / 2, H / 2 - 10);
            ctx.fillStyle = '#aaa';
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(`Packets delivered: ${score}`, W / 2, H / 2 + 18);
            ctx.fillStyle = '#666';
            ctx.font = '11px "Fira Code", monospace';
            ctx.fillText('Click or press Enter to restart', W / 2, H / 2 + 44);
        }
    }

    function tick(now) {
        const dt = Math.min(0.05, (now - lastTick) / 1000);
        lastTick = now;

        if (!gameOver) {
            update(dt);
        }
        render();

        if (!gameOver) {
            rafId = requestAnimationFrame(tick);
        }
    }

    function restart() {
        score = 0; gameOver = false; elapsed = 0; speed = 2;
        obstacles.length = 0; particles.length = 0;
        spawnTimer = 0;
        player.x = W / 2; targetX = W / 2;
        onScore(0);
        lastTick = performance.now();
        rafId = requestAnimationFrame(tick);
    }

    function onClick(e) {
        if (gameOver) { restart(); return; }
        // Click to move
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        targetX = x;
    }

    function onTouch(e) {
        e.preventDefault();
        if (gameOver) { restart(); return; }
        const touch = e.touches[0] || e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        targetX = (touch.clientX - rect.left) * scaleX;
    }

    function onKey(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); e.stopPropagation(); return; }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); e.stopPropagation(); return; }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { targetX = player.x; }
        if (gameOver && e.key === 'Enter') { restart(); }
    }

    function onKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    }

    // Mobile D-pad support
    function setupDPad() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnShoot = document.getElementById('btn-shoot');
        const handlers = [];

        function bind(el, onDown, onUp) {
            if (!el) return;
            const down = (e) => { e.preventDefault(); onDown(); };
            const up = (e) => { e.preventDefault(); if (onUp) onUp(); };
            el.addEventListener('touchstart', down, { passive: false });
            el.addEventListener('touchend', up, { passive: false });
            el.addEventListener('mousedown', down);
            el.addEventListener('mouseup', up);
            el.addEventListener('mouseleave', up);
            handlers.push({ el, down, up });
        }

        bind(btnLeft, () => keys.left = true, () => keys.left = false);
        bind(btnRight, () => keys.right = true, () => keys.right = false);
        bind(btnShoot, () => { if (gameOver) restart(); });

        return () => handlers.forEach(({ el, down, up }) => {
            el.removeEventListener('touchstart', down);
            el.removeEventListener('touchend', up);
            el.removeEventListener('mousedown', down);
            el.removeEventListener('mouseup', up);
            el.removeEventListener('mouseleave', up);
        });
    }

    const cleanupDPad = setupDPad();

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);

    lastTick = performance.now();
    rafId = requestAnimationFrame(tick);

    return function cleanup() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('click', onClick);
        canvas.removeEventListener('touchmove', onTouch);
        canvas.removeEventListener('touchstart', onTouch);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('keyup', onKeyUp, true);
        cleanupDPad();
    };
}
