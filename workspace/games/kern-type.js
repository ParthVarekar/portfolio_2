// games/kern-type.js — Drag letters to fix kerning spacing

export function startKernType(canvas, onScore, onGameOver) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const WORDS = [
        { text: 'TYPOGRAPHY', correct: [0, 68, 130, 198, 268, 330, 388, 452, 510, 560] },
        { text: 'KERNING', correct: [0, 62, 120, 182, 240, 296, 345] },
        { text: 'DESIGN', correct: [0, 60, 114, 168, 224, 270] },
        { text: 'SPACING', correct: [0, 58, 114, 164, 218, 272, 322] },
        { text: 'BRUTALISM', correct: [0, 60, 118, 180, 232, 280, 330, 386, 438] },
    ];

    let currentWordIndex = 0;
    let score = 0;
    let totalRounds = WORDS.length;
    let letters = [];
    let dragging = null;
    let dragOffsetX = 0;
    let gameActive = true;
    let showResult = false;
    let resultTimer = 0;
    let roundScore = 0;

    const FONT_SIZE = 48;
    const BASE_Y = H / 2;
    const FONT = `bold ${FONT_SIZE}px "Inter", "Outfit", sans-serif`;

    function setupWord() {
        const word = WORDS[currentWordIndex];
        letters = [];
        showResult = false;

        // Measure each character width
        ctx.font = FONT;
        const charWidths = [];
        for (const ch of word.text) {
            charWidths.push(ctx.measureText(ch).width);
        }

        // Place letters with intentionally bad spacing
        const totalCorrectWidth = word.correct[word.correct.length - 1] + charWidths[charWidths.length - 1];
        const startX = (W - totalCorrectWidth) / 2;

        for (let i = 0; i < word.text.length; i++) {
            const correctX = startX + word.correct[i];
            // Randomize position (except first and last which are anchored)
            const isAnchored = i === 0 || i === word.text.length - 1;
            const offset = isAnchored ? 0 : (Math.random() - 0.5) * 60;

            letters.push({
                char: word.text[i],
                x: correctX + offset,
                correctX: correctX,
                width: charWidths[i],
                anchored: isAnchored,
                index: i
            });
        }
    }

    // Calculate round score based on proximity to correct positions
    function calcRoundScore() {
        let totalError = 0;
        let count = 0;
        letters.forEach(l => {
            if (!l.anchored) {
                totalError += Math.abs(l.x - l.correctX);
                count++;
            }
        });
        if (count === 0) return 100;
        const avgError = totalError / count;
        // Max score 100, drops by 2 for each pixel of average error
        return Math.max(0, Math.round(100 - avgError * 2));
    }

    // Mouse handlers
    function getLetterAt(mx, my) {
        for (let i = letters.length - 1; i >= 0; i--) {
            const l = letters[i];
            if (!l.anchored && mx >= l.x - 5 && mx <= l.x + l.width + 5 && my >= BASE_Y - FONT_SIZE && my <= BASE_Y + 10) {
                return l;
            }
        }
        return null;
    }

    function onMouseDown(e) {
        if (!gameActive || showResult) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        const my = (e.clientY - rect.top) * (H / rect.height);
        const letter = getLetterAt(mx, my);
        if (letter) {
            dragging = letter;
            dragOffsetX = mx - letter.x;
            canvas.style.cursor = 'grabbing';
        }
    }

    function onMouseMove(e) {
        if (!dragging) {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            const my = (e.clientY - rect.top) * (H / rect.height);
            const letter = getLetterAt(mx, my);
            canvas.style.cursor = letter ? 'grab' : 'default';
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (W / rect.width);
        dragging.x = mx - dragOffsetX;
    }

    function onMouseUp() {
        if (dragging) {
            dragging = null;
            canvas.style.cursor = 'default';
        }
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);

    // Submit round
    function onKeyDown(e) {
        if (e.key === 'Enter') {
            if (showResult) {
                // Next word
                currentWordIndex++;
                if (currentWordIndex >= totalRounds) {
                    gameActive = false;
                    onGameOver(score);
                } else {
                    setupWord();
                }
            } else if (gameActive) {
                // Score this round
                roundScore = calcRoundScore();
                score += roundScore;
                onScore(score);
                showResult = true;
            }
        }
    }
    document.addEventListener('keydown', onKeyDown);

    // Draw
    function draw() {
        // Background
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, W, H);

        // Subtle guide line
        ctx.strokeStyle = 'rgba(67, 191, 109, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, BASE_Y + 5);
        ctx.lineTo(W, BASE_Y + 5);
        ctx.stroke();

        // HUD
        ctx.fillStyle = '#43BF6D';
        ctx.font = '12px "Fira Code", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Round ${currentWordIndex + 1}/${totalRounds}`, 10, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${score}`, W - 10, 25);

        // Instruction
        ctx.fillStyle = '#555';
        ctx.font = '12px "Fira Code", monospace';
        ctx.textAlign = 'center';
        if (!showResult) {
            ctx.fillText('Drag letters to fix spacing. Press ENTER to submit.', W / 2, H - 20);
        } else {
            ctx.fillText('Press ENTER for next word.', W / 2, H - 20);
        }

        // Letters
        ctx.font = FONT;
        ctx.textAlign = 'left';

        letters.forEach(l => {
            if (showResult) {
                // Show correct vs placed
                // Draw correct position ghost
                ctx.fillStyle = 'rgba(67, 191, 109, 0.2)';
                ctx.fillText(l.char, l.correctX, BASE_Y);

                // Draw actual position
                const error = Math.abs(l.x - l.correctX);
                if (l.anchored) {
                    ctx.fillStyle = '#43BF6D';
                } else if (error < 5) {
                    ctx.fillStyle = '#27C93F'; // Great
                } else if (error < 15) {
                    ctx.fillStyle = '#FFBD2E'; // OK
                } else {
                    ctx.fillStyle = '#FF5F56'; // Bad
                }
                ctx.fillText(l.char, l.x, BASE_Y);
            } else {
                // Normal mode
                ctx.fillStyle = l.anchored ? '#555' : (l === dragging ? '#43BF6D' : '#e6e6e6');
                ctx.fillText(l.char, l.x, BASE_Y);

                // Draggable indicator
                if (!l.anchored) {
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(l.x - 2, BASE_Y - FONT_SIZE + 5, l.width + 4, FONT_SIZE + 10);
                }
            }
        });

        // Round score overlay
        if (showResult) {
            ctx.fillStyle = roundScore >= 80 ? '#43BF6D' : roundScore >= 50 ? '#FFBD2E' : '#FF5F56';
            ctx.font = 'bold 24px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`+${roundScore} pts`, W / 2, H - 60);

            const grade = roundScore >= 90 ? 'PERFECT' : roundScore >= 70 ? 'GREAT' : roundScore >= 50 ? 'OK' : 'NEEDS WORK';
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(grade, W / 2, H - 40);
        }

        // Game Over
        if (!gameActive) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#43BF6D';
            ctx.font = 'bold 28px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('KERN TYPE COMPLETE', W / 2, H / 2 - 20);
            ctx.fillStyle = '#888';
            ctx.font = '14px "Fira Code", monospace';
            ctx.fillText(`Final Score: ${score} / ${totalRounds * 100}`, W / 2, H / 2 + 15);
        }
    }

    let animId;
    function loop() {
        draw();
        animId = requestAnimationFrame(loop);
    }

    setupWord();
    loop();

    // Cleanup
    return function cleanup() {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        document.removeEventListener('keydown', onKeyDown);
    };
}
