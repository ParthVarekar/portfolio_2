// enhancements/tesseract.js — Interactive 4D Tesseract Projection

export function initHero3D() {
    const parent = document.querySelector('section:first-child');
    if (!parent) return;

    // Create container
    const heroCanvasContainer = document.createElement('div');
    heroCanvasContainer.id = 'hero-canvas';
    heroCanvasContainer.className = 'enhanced-hero';
    heroCanvasContainer.setAttribute('data-enhance', '3d-hero');
    
    // Fallback Image
    const poster = document.createElement('img');
    poster.src = 'assets/whisperflow-preview.png';
    poster.className = 'hero-poster-fallback';
    heroCanvasContainer.appendChild(poster);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    heroCanvasContainer.appendChild(canvas);

    // Performance Mode Toggle
    const prefToggle = document.createElement('button');
    prefToggle.className = 'font-mono text-[10px] text-gray-500 hover:text-white transition-colors absolute bottom-8 right-8 z-50';
    prefToggle.innerHTML = '[ 3D Hero : ON ]';
    parent.appendChild(prefToggle);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let is3dEnabled = true;
    let animationFrameId = null;
    let w = 0, h = 0, cx = 0, cy = 0, R = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        is3dEnabled = false;
        prefToggle.innerHTML = '[ 3D Hero : OFF ]';
    }

    // ── 4D geometry ───────────────────────────────────────────────────
    const verts = [];
    for (let i = 0; i < 16; i++) {
        verts.push({
            x: i & 1 ? 1 : -1,
            y: i & 2 ? 1 : -1,
            z: i & 4 ? 1 : -1,
            w: i & 8 ? 1 : -1,
        });
    }

    const edges = [];
    for (let i = 0; i < 16; i++) {
        for (let d = 0; d < 4; d++) {
            if ((i & (1 << d)) === 0) {
                edges.push([i, i | (1 << d)]);
            }
        }
    }

    const faces = [];
    const dims = [0, 1, 2, 3];
    for (let a = 0; a < 4; a++) {
        for (let b = a + 1; b < 4; b++) {
            const fixed = dims.filter((d) => d !== a && d !== b);
            for (let f0 = 0; f0 < 2; f0++) {
                for (let f1 = 0; f1 < 2; f1++) {
                    const abCombos = [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                    ];
                    const face = [0, 0, 0, 0];
                    let k = 0;
                    for (const [av, bv] of abCombos) {
                        let idx = 0;
                        for (let d = 0; d < 4; d++) {
                            let bit;
                            if (d === a) bit = av;
                            else if (d === b) bit = bv;
                            else if (d === fixed[0]) bit = f0;
                            else bit = f1;
                            idx |= bit << d;
                        }
                        face[k++] = idx;
                    }
                    faces.push(face);
                }
            }
        }
    }

    const grayPath = [];
    for (let i = 0; i < 16; i++) {
        grayPath.push(i ^ (i >> 1));
    }

    // ── animation state ───────────────────────────────────────────────
    const angles = { xw: 0, yw: 0, zw: 0, xy: 0, xz: 0, yz: 0 };
    let boostSmooth = 0;
    let pulseT = 0;
    let boost = false;

    const mouse = { x: 0, y: 0 };

    const proj2 = [];
    for (let i = 0; i < 16; i++) proj2.push({ sx: 0, sy: 0, z: 0, w: 0 });

    const DIST4 = 3.0;
    const FOCAL = 3.0;
    const SCALE3 = 1.3;

    const colorForW = (wAvg) => {
        const a = (wAvg + 1) / 2; // 0..1
        let r, g, b;
        if (a < 0.5) {
            const k = a * 2; // 0..1, violet → emerald
            r = 167 + (52 - 167) * k;
            g = 139 + (211 - 139) * k;
            b = 250 + (153 - 250) * k;
        } else {
            const k = (a - 0.5) * 2; // 0..1, emerald → cyan
            r = 52 + (34 - 52) * k;
            g = 211 + (211 - 211) * k;
            b = 153 + (238 - 153) * k;
        }
        return [r, g, b];
    };

    // ── resize ────────────────────────────────────────────────────────
    const resize = () => {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Responsive position offset (centered on mobile, offset on desktop)
        if (w < 768) {
            cx = w / 2;
            cy = h / 2;
            R = Math.min(w, h) * 0.35;
        } else {
            cx = w * 0.65; // offset to the right, matching original sphere
            cy = h / 2;
            R = Math.min(w, h) * 0.28;
        }
    };

    // ── input mouse triggers ──────────────────────────────────────────
    const onMove = (e) => {
        const rectWidth = window.innerWidth;
        const rectHeight = window.innerHeight;
        mouse.x = (e.clientX - rectWidth / 2) / rectWidth;
        mouse.y = (e.clientY - rectHeight / 2) / rectHeight;

        // Hover proximity detection to trigger boost state
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        boost = dist < R * 1.5;
    };

    // ── render loop ───────────────────────────────────────────────────
    const render = () => {
        if (!is3dEnabled) return;
        if (w === 0 || h === 0 || R === 0 || isNaN(R)) {
            animationFrameId = requestAnimationFrame(render);
            return;
        }
        const dt = 0.016;

        // smooth boost interpolation
        const targetBoost = boost ? 1 : 0;
        boostSmooth += (targetBoost - boostSmooth) * 0.05;

        // advance 4D angles
        const base = 0.28;
        const boostMul = 1 + boostSmooth * 1.8;
        angles.xw += (base * 1.0 + mouse.x * 0.35) * dt * boostMul;
        angles.yw += (base * 1.2 + mouse.y * 0.45) * dt * boostMul;
        angles.zw += base * 0.6 * dt * boostMul;
        angles.xy += base * 0.25 * dt * boostMul;
        angles.xz += base * 0.18 * dt * boostMul;
        angles.yz += base * 0.32 * dt * boostMul;

        // advance pulse position along Hamiltonian cycle
        const pulseSpeed = 1.8 + boostSmooth * 2.2;
        pulseT += pulseSpeed * dt;
        if (pulseT >= 16) pulseT -= 16;

        const cosXW = Math.cos(angles.xw), sinXW = Math.sin(angles.xw);
        const cosYW = Math.cos(angles.yw), sinYW = Math.sin(angles.yw);
        const cosZW = Math.cos(angles.zw), sinZW = Math.sin(angles.zw);
        const cosXY = Math.cos(angles.xy), sinXY = Math.sin(angles.xy);
        const cosXZ = Math.cos(angles.xz), sinXZ = Math.sin(angles.xz);
        const cosYZ = Math.cos(angles.yz), sinYZ = Math.sin(angles.yz);

        // project all 16 vertices
        for (let i = 0; i < 16; i++) {
            const v = verts[i];
            let nx = v.x, ny = v.y, nz = v.z, nw = v.w;
            let t1, t2;

            t1 = nx * cosXW - nw * sinXW; t2 = nx * sinXW + nw * cosXW; nx = t1; nw = t2;
            t1 = ny * cosYW - nw * sinYW; t2 = ny * sinYW + nw * cosYW; ny = t1; nw = t2;
            t1 = nz * cosZW - nw * sinZW; t2 = nz * sinZW + nw * cosZW; nz = t1; nw = t2;
            t1 = nx * cosXY - ny * sinXY; t2 = nx * sinXY + ny * cosXY; nx = t1; ny = t2;
            t1 = nx * cosXZ - nz * sinXZ; t2 = nx * sinXZ + nz * cosXZ; nx = t1; nz = t2;
            t1 = ny * cosYZ - nz * sinYZ; t2 = ny * sinYZ + nz * cosYZ; ny = t1; nz = t2;

            // 4D → 3D perspective
            const k = 1 / (DIST4 - nw);
            const p3x = nx * k;
            const p3y = ny * k;
            const p3z = nz * k;

            // 3D → 2D perspective
            const s = FOCAL / (FOCAL - p3z);
            proj2[i].sx = cx + p3x * R * SCALE3 * s;
            proj2[i].sy = cy + p3y * R * SCALE3 * s;
            proj2[i].z = p3z;
            proj2[i].w = nw;
        }

        ctx.clearRect(0, 0, w, h);

        // atmospheric halo
        const halo = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 2.0);
        halo.addColorStop(0, "rgba(34, 211, 238, 0.16)");
        halo.addColorStop(0.4, "rgba(52, 211, 153, 0.06)");
        halo.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = "lighter";

        // faint volumetric face fills
        const faceRender = faces
            .map((f) => ({
                f,
                z: (proj2[f[0]].z + proj2[f[1]].z + proj2[f[2]].z + proj2[f[3]].z) / 4,
                wAvg: (proj2[f[0]].w + proj2[f[1]].w + proj2[f[2]].w + proj2[f[3]].w) / 4,
            }))
            .sort((a, b) => a.z - b.z);

        for (const { f, z, wAvg } of faceRender) {
            const [r, g, b] = colorForW(wAvg);
            const d01 = Math.max(0, Math.min(1, (z + 1) / 2));
            const alpha = (0.012 + d01 * 0.035) * (1 + boostSmooth * 0.4);
            ctx.beginPath();
            ctx.moveTo(proj2[f[0]].sx, proj2[f[0]].sy);
            for (let k = 1; k < 4; k++) ctx.lineTo(proj2[f[k]].sx, proj2[f[k]].sy);
            ctx.closePath();
            ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
            ctx.fill();
        }

        // glowing edges
        const edgeRender = edges
            .map((e) => ({
                e,
                z: (proj2[e[0]].z + proj2[e[1]].z) / 2,
                wAvg: (proj2[e[0]].w + proj2[e[1]].w) / 2,
            }))
            .sort((a, b) => a.z - b.z);

        for (const { e, z, wAvg } of edgeRender) {
            const pa = proj2[e[0]];
            const pb = proj2[e[1]];
            const [r, g, b] = colorForW(wAvg);
            const d01 = Math.max(0, Math.min(1, (z + 1) / 2));
            const alpha = 0.18 + d01 * 0.55 + boostSmooth * 0.15;
            const lineW = 0.6 + d01 * 1.6 + boostSmooth * 0.4;

            ctx.beginPath();
            ctx.moveTo(pa.sx, pa.sy);
            ctx.lineTo(pb.sx, pb.sy);
            ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
            ctx.lineWidth = lineW;
            ctx.shadowColor = `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0.9)`;
            ctx.shadowBlur = 8 + d01 * 8 + boostSmooth * 6;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // comet pulse
        const segIdx = Math.floor(pulseT) % 16;
        const segProg = pulseT - Math.floor(pulseT);
        const va = grayPath[segIdx];
        const vb = grayPath[(segIdx + 1) % 16];
        const pa = proj2[va];
        const pb = proj2[vb];
        const px = pa.sx + (pb.sx - pa.sx) * segProg;
        const py = pa.sy + (pb.sy - pa.sy) * segProg;

        const tailLen = 5;
        for (let k = 0; k < tailLen; k++) {
            const si = (segIdx - k + 16) % 16;
            const va2 = grayPath[si];
            const vb2 = grayPath[(si + 1) % 16];
            const pa2 = proj2[va2];
            const pb2 = proj2[vb2];
            const fall = 1 - k / tailLen;
            const tailAlpha = fall * 0.45 * (0.6 + boostSmooth * 0.6);
            const tailW = fall * 3.2 + 0.4;
            ctx.beginPath();
            ctx.moveTo(pa2.sx, pa2.sy);
            ctx.lineTo(pb2.sx, pb2.sy);
            ctx.strokeStyle = `rgba(255, 255, 255, ${tailAlpha})`;
            ctx.lineWidth = tailW;
            ctx.shadowColor = "rgba(180, 250, 255, 0.95)";
            ctx.shadowBlur = 14;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.strokeStyle = `rgba(220, 250, 255, ${0.7 + boostSmooth * 0.3})`;
        ctx.lineWidth = 2.2 + boostSmooth * 0.6;
        ctx.shadowColor = "rgba(140, 240, 255, 1)";
        ctx.shadowBlur = 18;
        ctx.stroke();

        const headR = 4 + boostSmooth * 2;
        const headGrad = ctx.createRadialGradient(px, py, 0, px, py, headR * 3);
        headGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        headGrad.addColorStop(0.3, "rgba(180, 250, 255, 0.7)");
        headGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.beginPath();
        ctx.arc(px, py, headR * 3, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, headR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fill();
        ctx.shadowBlur = 0;

        // vertices
        const vertRender = proj2
            .map((p, idx) => ({ idx, z: p.z }))
            .sort((a, b) => a.z - b.z);

        for (const { idx } of vertRender) {
            const p = proj2[idx];
            const [r, g, b] = colorForW(p.w);
            const d01 = Math.max(0, Math.min(1, (p.z + 1) / 2));
            const size = (1.4 + d01 * 2.4) * (0.8 + boostSmooth * 0.4);
            const alpha = 0.5 + d01 * 0.5;

            const vgrad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, size * 3);
            vgrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            vgrad.addColorStop(0.3, `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha * 0.6})`);
            vgrad.addColorStop(1, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0)`);
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = vgrad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.sx, p.sy, size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }

        // central core glow
        const coreR = R * 0.4;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrad.addColorStop(0, `rgba(220, 255, 255, ${0.22 + boostSmooth * 0.2})`);
        coreGrad.addColorStop(0.4, `rgba(34, 211, 238, ${0.1 + boostSmooth * 0.1})`);
        coreGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";

        animationFrameId = requestAnimationFrame(render);
    };

    // ── Setup and event listeners ─────────────────────────────────────
    poster.style.display = 'none';
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    
    if (is3dEnabled) {
        render();
    } else {
        poster.style.display = 'block';
        canvas.style.display = 'none';
    }

    prefToggle.addEventListener('click', () => {
        is3dEnabled = !is3dEnabled;
        if (is3dEnabled) {
            prefToggle.innerHTML = '[ 3D Hero : ON ]';
            poster.style.display = 'none';
            canvas.style.display = 'block';
            render();
        } else {
            prefToggle.innerHTML = '[ 3D Hero : OFF ]';
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            canvas.style.display = 'none';
            poster.style.display = 'block';
        }
    });

    // Insert container
    parent.style.position = 'relative';
    parent.insertBefore(heroCanvasContainer, parent.firstChild);

    // Clean up function exposed if needed, though this resides inside index.js load lifecycle
    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMove);
    };
}
