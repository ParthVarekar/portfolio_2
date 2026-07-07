// games/binary-blitz.js — Multiple-choice decimal→binary conversion quiz.
// Tests a real developer skill. 10s per question, 3 lives, increasing difficulty.

export function startBinaryBlitz(canvas, onScore, onGameOver) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    let score = 0;
    let lives = 3;
    let questionNum = 0;
    let timeLeft = 10;
    let currentAnswer = '';
    let options = [];
    let correctIndex = -1;
    let selectedIndex = -1;
    let phase = 'question'; // question | feedback | gameover
    let feedbackTimer = 0;
    let lastTick = performance.now();
    let rafId;
    let gameOver = false;

    // Click regions (4 option boxes)
    const optionBoxes = [];

    function generateQuestion() {
        questionNum++;
        const difficulty = Math.min(8, 3 + Math.floor(questionNum / 3)); // 3 to 8 bits
        const max = Math.pow(2, difficulty) - 1;
        const decimal = Math.floor(Math.random() * max) + 1;
        // Pad to at least 4 bits so we have enough bits to flip for wrong answers.
        currentAnswer = decimal.toString(2).padStart(4, '0');

        // Generate 3 wrong options by flipping random bits.
        // With a max iteration cap to prevent any theoretical infinite loop.
        const wrong = new Set();
        let attempts = 0;
        while (wrong.size < 3 && attempts < 100) {
            attempts++;
            let wrongBits = currentAnswer.split('');
            const flipCount = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < flipCount; i++) {
                const idx = Math.floor(Math.random() * wrongBits.length);
                wrongBits[idx] = wrongBits[idx] === '0' ? '1' : '0';
            }
            const wrongAns = wrongBits.join('');
            // Strip leading zeros for display, but keep as a valid binary string
            const wrongVal = parseInt(wrongAns, 2);
            if (wrongAns !== currentAnswer && wrongVal > 0) {
                wrong.add(wrongAns.replace(/^0+/, '') || '0');
            }
        }
        // Fallback: if we still don't have 3 wrong answers, generate random nearby numbers
        while (wrong.size < 3) {
            const delta = (Math.floor(Math.random() * 10) + 1) * (Math.random() < 0.5 ? -1 : 1);
            const wrongVal = Math.max(1, decimal + delta);
            if (wrongVal !== decimal) {
                wrong.add(wrongVal.toString(2));
            }
        }
        // Strip leading zeros from the correct answer for display
        currentAnswer = currentAnswer.replace(/^0+/, '') || '0';

        // Shuffle options
        const allOptions = [currentAnswer, ...wrong];
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }
        options = allOptions;
        correctIndex = options.indexOf(currentAnswer);
        selectedIndex = -1;
        timeLeft = 10;
        phase = 'question';
    }

    function render() {
        // Background
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, W, H);

        // Grid background
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Header
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 14px "Fira Code", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 16, 26);
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${'●'.repeat(lives)}${'○'.repeat(3 - lives)}`, W - 16, 26);

        // Timer bar
        const barW = (timeLeft / 10) * (W - 32);
        ctx.fillStyle = timeLeft < 3 ? '#FF0055' : '#00F0FF';
        ctx.fillRect(16, 36, barW, 3);

        if (phase === 'gameover') {
            ctx.fillStyle = '#FF0055';
            ctx.font = 'bold 28px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
            ctx.fillStyle = '#aaa';
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 10);
            ctx.fillStyle = '#666';
            ctx.font = '11px "Fira Code", monospace';
            ctx.fillText('Click or press Enter to restart', W / 2, H / 2 + 40);
            return;
        }

        // Question
        const decimal = parseInt(currentAnswer, 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONVERT TO BINARY:', W / 2, 70);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 36px "Fira Code", monospace';
        ctx.fillText(`${decimal}`, W / 2, 108);

        // Options (2x2 grid)
        optionBoxes.length = 0;
        const boxW = 180, boxH = 50, gap = 12;
        const startX = (W - boxW * 2 - gap) / 2;
        const startY = 130;
        for (let i = 0; i < 4; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            const x = startX + col * (boxW + gap);
            const y = startY + row * (boxH + gap);
            optionBoxes.push({ x, y, w: boxW, h: boxH, index: i });

            // Box
            let color = '#333';
            if (phase === 'feedback') {
                if (i === correctIndex) color = '#27C93F';
                else if (i === selectedIndex) color = '#FF0055';
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, boxW, boxH);
            ctx.strokeRect(x, y, boxW, boxH);

            // Option text
            ctx.fillStyle = phase === 'feedback' && i === correctIndex ? '#27C93F' :
                           phase === 'feedback' && i === selectedIndex ? '#FF0055' : '#ccc';
            ctx.font = 'bold 18px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(options[i], x + boxW / 2, y + boxH / 2 + 6);

            // Letter label
            ctx.fillStyle = '#666';
            ctx.font = '10px "Fira Code", monospace';
            ctx.fillText(String.fromCharCode(65 + i), x + 12, y + 16);
        }

        // Feedback message
        if (phase === 'feedback') {
            ctx.font = 'bold 14px "Fira Code", monospace';
            ctx.textAlign = 'center';
            if (selectedIndex === correctIndex) {
                ctx.fillStyle = '#27C93F';
                ctx.fillText('✓ CORRECT!', W / 2, H - 16);
            } else {
                ctx.fillStyle = '#FF0055';
                ctx.fillText('✗ WRONG!', W / 2, H - 16);
            }
        }
    }

    function tick(now) {
        const dt = (now - lastTick) / 1000;
        lastTick = now;

        if (phase === 'question') {
            timeLeft -= dt;
            if (timeLeft <= 0) {
                // Time's up — wrong
                phase = 'feedback';
                selectedIndex = -1;
                feedbackTimer = 1.2;
                lives--;
                if (lives <= 0) { gameOver = true; }
            }
        } else if (phase === 'feedback') {
            feedbackTimer -= dt;
            if (feedbackTimer <= 0) {
                if (gameOver) {
                    phase = 'gameover';
                    onGameOver(score);
                } else {
                    generateQuestion();
                }
            }
        }

        render();
        if (phase !== 'gameover') {
            rafId = requestAnimationFrame(tick);
        } else {
            render(); // final render
        }
    }

    function selectOption(index) {
        if (phase !== 'question') return;
        selectedIndex = index;
        phase = 'feedback';
        feedbackTimer = 1.0;
        if (index === correctIndex) {
            score += 10 + Math.floor(timeLeft * 2);
            onScore(score);
        } else {
            lives--;
            if (lives <= 0) { gameOver = true; }
        }
    }

    function onClick(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (phase === 'gameover') {
            // Restart
            score = 0; lives = 3; questionNum = 0; gameOver = false;
            generateQuestion();
            lastTick = performance.now();
            rafId = requestAnimationFrame(tick);
            return;
        }

        if (phase !== 'question') return;

        for (const box of optionBoxes) {
            if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
                selectOption(box.index);
                break;
            }
        }
    }

    function onKey(e) {
        if (phase === 'gameover' && e.key === 'Enter') {
            score = 0; lives = 3; questionNum = 0; gameOver = false;
            generateQuestion();
            lastTick = performance.now();
            rafId = requestAnimationFrame(tick);
            return;
        }
        if (phase !== 'question') return;
        const keyMap = { 'a': 0, 'A': 0, 'b': 1, 'B': 1, 'c': 2, 'C': 2, 'd': 3, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        if (e.key in keyMap) {
            e.preventDefault();
            selectOption(keyMap[e.key]);
        }
    }

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        onClick({ clientX: touch.clientX, clientY: touch.clientY });
    });
    document.addEventListener('keydown', onKey);

    generateQuestion();
    lastTick = performance.now();
    rafId = requestAnimationFrame(tick);

    return function cleanup() {
        cancelAnimationFrame(rafId);
        canvas.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKey);
    };
}
