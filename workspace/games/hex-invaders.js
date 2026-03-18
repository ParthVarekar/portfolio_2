// games/hex-invaders.js — Canvas Shooter: Shoot the alien matching the hex code

export function startHexInvaders(canvas, onScore, onGameOver) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    let score = 0;
    let lives = 3;
    let level = 1;
    let aliens = [];
    let bullets = [];
    let player = { x: W / 2, w: 40, h: 20, speed: 6 };
    let targetColor = '';
    let gameActive = true;
    let animId = null;
    let keys = {};
    let spawnTimer = 0;
    let spawnRate = 120; // frames between spawns

    // Generate random hex color
    function randColor() {
        const letters = '0123456789ABCDEF';
        let c = '#';
        for (let i = 0; i < 6; i++) c += letters[Math.floor(Math.random() * 16)];
        return c;
    }

    // Pick a new target
    function newTarget() {
        if (aliens.length > 0) {
            targetColor = aliens[Math.floor(Math.random() * aliens.length)].color;
        } else {
            targetColor = randColor();
        }
    }

    // Spawn an alien
    function spawnAlien() {
        const color = Math.random() < 0.3 ? targetColor : randColor();
        aliens.push({
            x: Math.random() * (W - 40) + 20,
            y: -30,
            w: 36,
            h: 28,
            color: color,
            speed: 0.5 + level * 0.15 + Math.random() * 0.3
        });
    }

    // Input
    function onKeyDown(e) { keys[e.key] = true; }
    function onKeyUp(e) { keys[e.key] = false; }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Shoot
    function shoot() {
        bullets.push({
            x: player.x,
            y: H - 40,
            speed: 7
        });
    }

    // Update
    function update() {
        // Player movement
        if (keys['ArrowLeft'] || keys['a']) player.x = Math.max(player.w / 2, player.x - player.speed);
        if (keys['ArrowRight'] || keys['d']) player.x = Math.min(W - player.w / 2, player.x + player.speed);
        if (keys[' '] || keys['ArrowUp']) {
            if (!keys._shot) {
                shoot();
                keys._shot = true;
            }
        } else {
            keys._shot = false;
        }

        // Bullets
        bullets.forEach(b => b.y -= b.speed);
        bullets = bullets.filter(b => b.y > -10);

        // Aliens
        aliens.forEach(a => a.y += a.speed);

        // Collision: bullets vs aliens
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = aliens.length - 1; j >= 0; j--) {
                const a = aliens[j];
                const b = bullets[i];
                if (b && Math.abs(b.x - a.x) < a.w / 2 + 4 && Math.abs(b.y - a.y) < a.h / 2 + 4) {
                    if (a.color === targetColor) {
                        score += 10 * level;
                        onScore(score);
                        aliens.splice(j, 1);
                        bullets.splice(i, 1);
                        newTarget();
                    } else {
                        // Wrong color penalty
                        score = Math.max(0, score - 5);
                        onScore(score);
                        bullets.splice(i, 1);
                        // Flash screen
                    }
                    break;
                }
            }
        }

        // Aliens reaching bottom
        for (let j = aliens.length - 1; j >= 0; j--) {
            if (aliens[j].y > H) {
                aliens.splice(j, 1);
                lives--;
                if (lives <= 0) {
                    gameActive = false;
                    onGameOver(score);
                }
            }
        }

        // Spawn
        spawnTimer++;
        if (spawnTimer >= spawnRate) {
            spawnAlien();
            spawnTimer = 0;
            if (aliens.length > 0 && !aliens.some(a => a.color === targetColor)) {
                newTarget();
            }
        }

        // Level up
        if (score > level * 50) {
            level++;
            spawnRate = Math.max(40, spawnRate - 10);
        }
    }

    // Draw
    function draw() {
        // Background
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(67, 191, 109, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Target HUD
        ctx.fillStyle = targetColor;
        ctx.fillRect(W / 2 - 80, 10, 160, 30);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SHOOT: ${targetColor}`, W / 2, 30);

        // Lives
        ctx.fillStyle = '#FF5F56';
        ctx.textAlign = 'left';
        ctx.font = '12px "Fira Code", monospace';
        ctx.fillText(`♥ ${lives}`, 10, 25);

        // Level
        ctx.fillStyle = '#43BF6D';
        ctx.textAlign = 'right';
        ctx.fillText(`LVL ${level}`, W - 10, 25);

        // Aliens
        aliens.forEach(a => {
            ctx.fillStyle = a.color;
            // Draw alien shape
            ctx.beginPath();
            ctx.moveTo(a.x - a.w / 2, a.y + a.h / 2);
            ctx.lineTo(a.x, a.y - a.h / 2);
            ctx.lineTo(a.x + a.w / 2, a.y + a.h / 2);
            ctx.closePath();
            ctx.fill();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(a.color, a.x, a.y + a.h / 2 + 12);
        });

        // Bullets
        ctx.fillStyle = '#43BF6D';
        bullets.forEach(b => {
            ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        });

        // Player
        ctx.fillStyle = '#43BF6D';
        ctx.fillRect(player.x - player.w / 2, H - 30, player.w, player.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x - 2, H - 36, 4, 6);

        // Game over overlay
        if (!gameActive) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FF5F56';
            ctx.font = 'bold 28px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
            ctx.fillStyle = '#888';
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 15);
            ctx.fillText('Press ENTER to restart', W / 2, H / 2 + 40);
        }
    }

    // Game loop
    function loop() {
        if (gameActive) update();
        draw();
        animId = requestAnimationFrame(loop);
    }

    // Restart handler
    function onRestartKey(e) {
        if (e.key === 'Enter' && !gameActive) {
            score = 0; lives = 3; level = 1; aliens = []; bullets = [];
            spawnTimer = 0; spawnRate = 120; gameActive = true;
            onScore(0);
            newTarget();
        }
    }
    document.addEventListener('keydown', onRestartKey);

    // Start
    spawnAlien();
    spawnAlien();
    spawnAlien();
    newTarget();
    loop();

    // Cleanup function
    return function cleanup() {
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('keydown', onRestartKey);
    };
}
