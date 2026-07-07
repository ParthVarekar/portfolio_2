// games/launcher.js — Game selection and lifecycle management

let activeCleanup = null;

async function launchGame(gameId) {
    const overlay = document.getElementById('game-overlay');
    const canvas = document.getElementById('game-canvas');
    const titleEl = document.getElementById('game-title');
    const scoreEl = document.getElementById('game-score');
    const closeBtn = document.getElementById('game-close');

    if (!overlay || !canvas) return;

    // Cleanup previous game
    if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
    }

    // Reset canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreEl.textContent = 'Score: 0';

    // Show overlay
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    function onScore(s) {
        scoreEl.textContent = `Score: ${s}`;
    }

    function onGameOver(s) {
        scoreEl.textContent = `GAME OVER — Final: ${s}`;
    }

    try {
        if (gameId === 'hex') {
            titleEl.textContent = 'Hex Invaders';
            const { startHexInvaders } = await import('./hex-invaders.js');
            activeCleanup = startHexInvaders(canvas, onScore, onGameOver);
        } else if (gameId === 'kern') {
            titleEl.textContent = 'Kern Type';
            const { startKernType } = await import('./kern-type.js');
            activeCleanup = startKernType(canvas, onScore, onGameOver);
        } else if (gameId === 'binary') {
            titleEl.textContent = 'Binary Blitz';
            const { startBinaryBlitz } = await import('./binary-blitz.js');
            activeCleanup = startBinaryBlitz(canvas, onScore, onGameOver);
        } else if (gameId === 'dodge') {
            titleEl.textContent = 'Data Dodge';
            const { startDataDodge } = await import('./data-dodge.js');
            activeCleanup = startDataDodge(canvas, onScore, onGameOver);
        } else {
            titleEl.textContent = 'Unknown Game';
            ctx.fillStyle = '#FF5F56';
            ctx.font = '16px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Game '${gameId}' not found.`, canvas.width / 2, canvas.height / 2);
        }
    } catch (e) {
        console.error('[Games] Launch error:', e);
        ctx.fillStyle = '#FF5F56';
        ctx.font = '14px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Error loading game: ${e.message}`, canvas.width / 2, canvas.height / 2);
    }
}

function closeGame() {
    const overlay = document.getElementById('game-overlay');
    if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
    }
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

// Global access
window.launchGame = launchGame;

// Close button
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('game-close');
    if (closeBtn) closeBtn.addEventListener('click', closeGame);

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('game-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeGame();
            }
        }
    });
});
