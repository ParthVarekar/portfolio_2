/* sound/sound.js
   Portfolio sound system integration.
   - Background music: <audio> element (looped, starts after user interaction)
   - SFX: single shared AudioContext + global SFX gain bus
   - Triggers:
       cursor move -> woosh
       click -> click + ting (interactive) / soft click (empty)
       scroll -> paper friction sound
       navigation -> digital pulse sound
   - External entrypoints (called from existing portfolio logic):
       playTerminalSuccess()
       playTerminalError()
       playGameLaser()
       playGameExplosion()
*/

(function () {
  'use strict';

  const SOUND = {
    playTerminalSuccess,
    playTerminalError,
    playGameLaser,
    playGameExplosion
  };

  // Expose globally so existing page/game/terminal code can call into it.
  window.PortfolioSound = SOUND;

  // ----------------------------
  // Paths + UI references
  // ----------------------------
  function getSoundBaseUrl() {
    // document.currentScript is reliable for classic scripts; this file is loaded via <script src="sound/sound.js" ...>
    const el = document.currentScript;
    if (el && el.src) {
      const idx = el.src.lastIndexOf('/');
      return idx === -1 ? '' : el.src.slice(0, idx + 1);
    }
    return 'sound/';
  }

  const SOUND_BASE_URL = getSoundBaseUrl();
  const BG_SRC = SOUND_BASE_URL + 'final_bg.mp3';

  const SETTINGS_BAR_ID = 'sound-settings';
  const BG_VOL_ID = 'bgVol';
  const SFX_VOL_ID = 'sfxVol';

  // ----------------------------
  // Background Music (<audio>)
  // ----------------------------
  let bgAudio = null;
  let bgVolume = 0.3;
  let bgStarted = false;

  function initBgAudio() {
    if (bgAudio) return;
    bgAudio = document.createElement('audio');
    bgAudio.id = 'bgAudio';
    bgAudio.loop = true;
    bgAudio.preload = 'auto';
    bgAudio.src = BG_SRC;
    bgAudio.volume = bgVolume;
    bgAudio.style.display = 'none';
    // Append so browsers that require DOM presence still load safely.
    (document.body || document.documentElement).appendChild(bgAudio);
  }

  function startBgIfNeeded() {
    if (!bgAudio) initBgAudio();
    if (bgStarted) return;
    bgStarted = true;
    // start after a user gesture; failures are non-fatal
    bgAudio.play().catch(() => {});
  }

  // ----------------------------
  // Shared WebAudio for SFX
  // ----------------------------
  let ac = null;
  let sfxMasterGain = null;
  let sfxCompressor = null;
  let sfxVolume = 0.6;

  function getAC() {
    if (ac) return ac;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    return ac;
  }

  function ensureSfxGraph() {
    const ctx = getAC();
    if (sfxMasterGain && sfxCompressor) return;

    sfxMasterGain = ctx.createGain();
    sfxMasterGain.gain.value = sfxVolume;

    // Hardening against transient overlaps (click/ting/laser/etc.).
    try {
      sfxCompressor = ctx.createDynamicsCompressor();
      sfxCompressor.threshold.value = -22;
      sfxCompressor.knee.value = 30;
      sfxCompressor.ratio.value = 10;
      sfxCompressor.attack.value = 0.003;
      sfxCompressor.release.value = 0.18;

      sfxMasterGain.connect(sfxCompressor);
      sfxCompressor.connect(ctx.destination);
    } catch (e) {
      // Fallback: connect directly if dynamics compressor is not supported.
      sfxCompressor = null;
      sfxMasterGain.connect(ctx.destination);
    }
  }

  let audioStarted = false;
  function ensureStarted() {
    if (audioStarted) return;
    audioStarted = true;

    initBgAudio();
    startBgIfNeeded();

    const ctx = getAC();
    ensureSfxGraph();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    // Initialize some long-lived nodes lazily after the first user gesture.
    initWoosh();
    // Scroll is initialized on first wheel event (to avoid starting noise buffers needlessly).
    initExplosionBuffer();
  }

  function isSfxMuted() {
    return !sfxMasterGain || sfxVolume <= 0.0001;
  }

  // Start only after user interaction (browser autoplay policy).
  window.addEventListener('pointerdown', ensureStarted, { once: true, passive: true });
  window.addEventListener('keydown', ensureStarted, { once: true });
  window.addEventListener('touchstart', ensureStarted, { once: true, passive: true });
  window.addEventListener('wheel', ensureStarted, { once: true, passive: true });

  // ----------------------------
  // Settings bar
  // ----------------------------
  function bindSettings() {
    const bgVolEl = document.getElementById(BG_VOL_ID);
    const sfxVolEl = document.getElementById(SFX_VOL_ID);
    if (bgVolEl) {
      bgVolume = clamp01(parseFloat(bgVolEl.value));
      bgVolEl.addEventListener('input', () => {
        bgVolume = clamp01(parseFloat(bgVolEl.value));
        if (bgAudio) bgAudio.volume = bgVolume;
      });
    }

    if (sfxVolEl) {
      sfxVolume = clamp01(parseFloat(sfxVolEl.value));
      sfxVolEl.addEventListener('input', () => {
        sfxVolume = clamp01(parseFloat(sfxVolEl.value));
        if (sfxMasterGain) sfxMasterGain.gain.value = sfxVolume;
      });
    }
  }

  function clamp01(n) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSettings, { once: true });
  } else {
    bindSettings();
  }

  // ----------------------------
  // Settings toggle (button -> shows sliders)
  // ----------------------------
  function toggleSoundPanel() {
    const panel = document.getElementById('sound-settings-panel');
    if (!panel) return;
    ensureStarted();
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';
    panel.dataset.open = isOpen ? 'false' : 'true';
  }
  // Expose globally so the onclick attribute can call it directly.
  window.toggleSoundPanel = toggleSoundPanel;

  function bindSettingsToggle() {
    const root = document.getElementById(SETTINGS_BAR_ID);
    const btn = document.getElementById('sound-settings-btn');
    const panel = document.getElementById('sound-settings-panel');
    if (!root || !btn || !panel) return;

    // Ensure panel starts hidden.
    panel.style.display = 'none';

    // Wire up the button via onclick attribute as a fallback for event interception.
    btn.setAttribute('onclick', 'event.stopPropagation(); window.toggleSoundPanel();');

    // Also attach via addEventListener for good measure.
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSoundPanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSettingsToggle, { once: true });
  } else {
    bindSettingsToggle();
  }

  // ----------------------------
  // SFX 1 — CURSOR WOOSH (cursor move -> woosh)
  // ----------------------------
  const WOOSH_MAX_GAIN = 0.88;
  const WOOSH_MAX_VEL = 2800; // px/sec
  const WOOSH_FREQ_MIN = 280;
  const WOOSH_FREQ_MAX = 2400;
  const WOOSH_FILTER_Q = 1.2;
  const WOOSH_REVERB_WET = 0.22;
  const WOOSH_SILENCE_MS = 110;

  let wooshReady = false;
  let wooshSrc = null;
  let wooshFilter = null;
  let wooshGain = null;
  let wooshPanner = null;
  let wooshConvolver = null;
  let wooshWetGain = null;

  function buildNoiseBuffer(ctx, secs) {
    const len = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function buildIRBuffer(ctx, secs, decay) {
    const len = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function initWoosh() {
    if (wooshReady) return;
    const ctx = getAC();
    ensureSfxGraph();

    wooshFilter = ctx.createBiquadFilter();
    wooshFilter.type = 'bandpass';
    wooshFilter.frequency.value = WOOSH_FREQ_MIN;
    wooshFilter.Q.value = WOOSH_FILTER_Q;

    wooshGain = ctx.createGain();
    wooshGain.gain.value = 0; // driven by cursor velocity

    wooshPanner = ctx.createStereoPanner();
    wooshPanner.pan.value = 0;

    wooshConvolver = ctx.createConvolver();
    wooshConvolver.buffer = buildIRBuffer(ctx, 0.45, 3.5);

    wooshWetGain = ctx.createGain();
    wooshWetGain.gain.value = WOOSH_REVERB_WET;

    wooshSrc = ctx.createBufferSource();
    wooshSrc.buffer = buildNoiseBuffer(ctx, 4);
    wooshSrc.loop = true;

    wooshSrc.connect(wooshFilter);
    wooshFilter.connect(wooshGain);
    wooshGain.connect(wooshPanner);

    // Dry path
    wooshPanner.connect(sfxMasterGain);

    // Wet path
    wooshPanner.connect(wooshConvolver);
    wooshConvolver.connect(wooshWetGain);
    wooshWetGain.connect(sfxMasterGain);

    wooshSrc.start();
    wooshReady = true;

    startWooshLoop();
  }

  let mx = 0, my = 0;
  let prevMx = 0, prevMy = 0;
  let lastMoveTs = 0;
  let lastVelocity = 0;
  let smGain = 0;
  let smFreq = 400;
  let smPan = 0;
  let wooshLoopRunning = false;
  let wooshRafId = null;

  function startWooshLoop() {
    if (wooshLoopRunning) return;
    wooshLoopRunning = true;

    const step = () => {
      if (!wooshLoopRunning) return;
      wooshRafId = null;

      const ctx = ac; // ac created in ensureStarted/initWoosh
      const nowPerf = performance.now();
      const sinceMove = nowPerf - lastMoveTs;
      const v = sinceMove > 500 ? 0 : lastVelocity;
      const norm = Math.min(v / WOOSH_MAX_VEL, 1);

      const targetGain = sinceMove <= WOOSH_SILENCE_MS
        ? (norm < 0.005 ? 0 : Math.pow(norm, 0.65) * WOOSH_MAX_GAIN)
        : 0;

      const gAlpha = targetGain > smGain ? 0.13 : 0.055;
      smGain = smGain + (targetGain - smGain) * gAlpha;

      const tFreq = WOOSH_FREQ_MIN + (WOOSH_FREQ_MAX - WOOSH_FREQ_MIN) * Math.pow(norm, 0.55);
      smFreq = smFreq + (tFreq - smFreq) * 0.07;

      const pan = ((mx / Math.max(1, window.innerWidth)) * 2 - 1) * 0.88;
      smPan = smPan + (pan - smPan) * 0.04;

      if (wooshReady && ctx && sfxMasterGain) {
        const t = ctx.currentTime;
        const TC = 0.035;
        wooshGain.gain.setTargetAtTime(isSfxMuted() ? 0 : smGain, t, TC);
        wooshFilter.frequency.setTargetAtTime(Math.max(120, smFreq), t, TC * 1.2);
        wooshPanner.pan.setTargetAtTime(smPan, t, TC * 2);
      }

      // Stop RAF when the sound is fully faded out to keep CPU low.
      if (targetGain === 0 && smGain < 0.002) {
        wooshLoopRunning = false;
        return;
      }

      wooshRafId = requestAnimationFrame(step);
    };

    wooshRafId = requestAnimationFrame(step);
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    const now = performance.now();
    if (!lastMoveTs) lastMoveTs = now;

    const dt = Math.max(8, now - lastMoveTs);
    const dx = mx - prevMx;
    const dy = my - prevMy;
    const dist = Math.hypot(dx, dy);
    lastVelocity = (dist / (dt / 1000));

    prevMx = mx;
    prevMy = my;
    lastMoveTs = now;

    if (audioStarted && wooshReady) startWooshLoop();
  }, { passive: true });

  // ----------------------------
  // SFX 2 — CLICK + TING / SOFT CLICK (click mapping)
  // ----------------------------
  const CLICK_DEDUP_SEC = 0.060;
  let lastPointerDownT = -999;
  let noiseBufClick = null;

  const CLICK_INTERACTIVE_GAIN = 0.85;
  const CLICK_EMPTY_GAIN = 0.55;
  const CLICK_TING_GAIN = 0.06;
  const CLICK_INTERACTIVE_HZ = 1480;
  const CLICK_EMPTY_HZ = 734;
  const CLICK_TING_HZ = 2100;
  const CLICK_TING_DELAY_MS = 20;

  const ITAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

  function getClickNoiseBuf() {
    if (noiseBufClick) return noiseBufClick;
    const ctx = getAC();
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBufClick = buf;
    return noiseBufClick;
  }

  function isInteractive(el) {
    if (!el) return false;
    if (typeof el.closest === 'function' && el.closest('#' + SETTINGS_BAR_ID)) {
      // Keep the settings bar quiet (sliders should not spam SFX).
      return false;
    }

    let n = el;
    while (n) {
      if (ITAGS.has(n.tagName)) return true;
      if (n.getAttribute && n.getAttribute('role') === 'button') return true;
      try {
        if (window.getComputedStyle(n).cursor === 'pointer') return true;
      } catch (_e) {}
      n = n.parentElement;
    }
    return false;
  }

  function shouldPulse(el) {
    if (!el || typeof el.closest !== 'function') return false;
    if (el.closest('#' + SETTINGS_BAR_ID)) return false;

    if (el.closest('nav')) {
      const a = el.closest('a[href]');
      return !!a;
    }
    if (el.closest('a[href]')) return true;

    // Project cards / CTA blocks are divs with onclick handlers in this portfolio.
    if (el.closest('[onclick]')) return true;
    return false;
  }

  function playClickInteractive() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = getClickNoiseBuf();

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = CLICK_INTERACTIVE_HZ;
    bp.Q.value = 3.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(CLICK_INTERACTIVE_GAIN, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    src.connect(bp);
    bp.connect(g);
    g.connect(sfxMasterGain);

    src.start(now);
    src.stop(now + 0.06);

    // Ting on a short delay after press.
    setTimeout(() => {
      if (isSfxMuted()) return;
      const c2 = getAC();
      const t = c2.currentTime;
      const osc = c2.createOscillator();
      const tg = c2.createGain();
      osc.type = 'sine';
      osc.frequency.value = CLICK_TING_HZ;
      tg.gain.setValueAtTime(0, t);
      tg.gain.linearRampToValueAtTime(CLICK_TING_GAIN, t + 0.007);
      tg.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(tg);
      tg.connect(sfxMasterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }, CLICK_TING_DELAY_MS);
  }

  function playClickEmpty() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = getClickNoiseBuf();

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = CLICK_EMPTY_HZ;
    bp.Q.value = 1.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(CLICK_EMPTY_GAIN, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    src.connect(bp);
    bp.connect(g);
    g.connect(sfxMasterGain);

    src.start(now);
    src.stop(now + 0.05);
  }

  window.addEventListener('pointerdown', (e) => {
    // Ensure audio is allowed.
    ensureStarted();

    // Keep the settings UI silent (and prevent it from firing click/ting/pulse).
    if (e && e.target && typeof e.target.closest === 'function') {
      if (e.target.closest('#' + SETTINGS_BAR_ID)) return;
    }
    if (!ac || !sfxMasterGain) return;

    const ctx = getAC();
    const now = ctx.currentTime;
    if (now - lastPointerDownT < CLICK_DEDUP_SEC) return;
    lastPointerDownT = now;

    const inter = isInteractive(e.target);
    if (inter) playClickInteractive();
    else playClickEmpty();

    // Navigation pulse (separate from click).
    if (shouldPulse(e.target)) playDigitalPulse();
  }, { capture: true, passive: true });

  // ----------------------------
  // SFX 3 — PAPER FRICTION (scroll -> friction sound)
  // ----------------------------
  const SCROLL_MAX_GAIN = 0.22;
  const SCROLL_MAX_VEL = 80;
  const SCROLL_FRICTION = 0.92;
  const SCROLL_INPUT_ALPHA = 0.20;
  const SCROLL_STOP_THR = 0.08;
  const SCROLL_INPUT_SCALE = 2.2;
  const SCROLL_BASE_FREQ_A = 850;
  const SCROLL_MAX_FREQ_A = 1400;
  const SCROLL_BASE_FREQ_B = 1750;
  const SCROLL_MAX_FREQ_B = 2800;
  const SCROLL_FILTER_Q_A = 1.4;
  const SCROLL_FILTER_Q_B = 2.2;

  let scrollReady = false;
  let scrollSrcA = null;
  let scrollSrcB = null;
  let fA = null, fB = null, gA = null, gB = null, mGain = null;
  let scrollPan = null;

  let inertialVel = 0;
  let rawInputVel = 0;
  let hasInput = false;
  let scrollDir = 0;

  let smMG = 0;
  let smFA = SCROLL_BASE_FREQ_A;
  let smFB = SCROLL_BASE_FREQ_B;
  let smGA = 0.6;
  let smGB = 0.4;
  let smPan = 0;

  // Random texture modulation (keeps it from sounding static).
  const MOD_ALPHA = 0.022;
  const MOD_RANGE_F = 120;
  const MOD_RANGE_B = 0.12;
  let modFA = 0;
  let modFB = 0;
  let modBal = 0;

  function initScrollNodes() {
    if (scrollReady) return;
    const ctx = getAC();
    ensureSfxGraph();

    const bufA = buildNoiseBuffer(ctx, 4);
    const bufB = buildNoiseBuffer(ctx, 4);

    function makeSrc(buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = Math.random() * 3;
      src.loopEnd = buf.duration;
      return src;
    }

    scrollSrcA = makeSrc(bufA);
    scrollSrcB = makeSrc(bufB);

    fA = ctx.createBiquadFilter();
    fA.type = 'bandpass';
    fA.frequency.value = SCROLL_BASE_FREQ_A;
    fA.Q.value = SCROLL_FILTER_Q_A;

    fB = ctx.createBiquadFilter();
    fB.type = 'bandpass';
    fB.frequency.value = SCROLL_BASE_FREQ_B;
    fB.Q.value = SCROLL_FILTER_Q_B;

    gA = ctx.createGain();
    gA.gain.value = 0.6;

    gB = ctx.createGain();
    gB.gain.value = 0.4;

    mGain = ctx.createGain();
    mGain.gain.value = 0;

    scrollPan = ctx.createStereoPanner();
    scrollPan.pan.value = 0;

    scrollSrcA.connect(fA);
    fA.connect(gA);
    gA.connect(mGain);

    scrollSrcB.connect(fB);
    fB.connect(gB);
    gB.connect(mGain);

    mGain.connect(scrollPan);
    scrollPan.connect(sfxMasterGain);

    scrollSrcA.start();
    scrollSrcB.start();

    scrollReady = true;
    startScrollLoop();
  }

  let scrollLoopRunning = false;
  function startScrollLoop() {
    if (scrollLoopRunning) return;
    scrollLoopRunning = true;

    const step = () => {
      if (!scrollLoopRunning) return;
      const ctx = ac;
      if (!ctx) return;

      if (hasInput) {
        inertialVel = inertialVel * (1 - SCROLL_INPUT_ALPHA) + rawInputVel * SCROLL_INPUT_ALPHA;
        rawInputVel = 0;
        hasInput = false;
      } else {
        inertialVel *= SCROLL_FRICTION;
        if (inertialVel < SCROLL_STOP_THR) {
          inertialVel = 0;
          scrollDir = 0;
        }
      }

      const norm = Math.min(inertialVel / SCROLL_MAX_VEL, 1);

      // Texture modulation
      modFA = modFA * (1 - MOD_ALPHA) + (Math.random() - 0.5) * 2 * MOD_ALPHA;
      modFB = modFB * (1 - MOD_ALPHA) + (Math.random() - 0.5) * 2 * MOD_ALPHA;
      modBal = modBal * (1 - MOD_ALPHA) + (Math.random() - 0.5) * 2 * MOD_ALPHA;

      const tg = Math.pow(norm, 0.65) * SCROLL_MAX_GAIN;
      const tFA = SCROLL_BASE_FREQ_A + (SCROLL_MAX_FREQ_A - SCROLL_BASE_FREQ_A) * Math.pow(norm, 0.7) + modFA * MOD_RANGE_F;
      const tFB = SCROLL_BASE_FREQ_B + (SCROLL_MAX_FREQ_B - SCROLL_BASE_FREQ_B) * Math.pow(norm, 0.55) + modFB * MOD_RANGE_F;
      const tGA = 0.60 + modBal * MOD_RANGE_B;
      const tGB = 0.40 - modBal * MOD_RANGE_B;
      const tP = scrollDir * 0.15 * norm;

      const ga = tg > smMG ? 0.10 : 0.05;
      smMG = smMG + (tg - smMG) * ga;
      smFA = smFA + (tFA - smFA) * 0.07;
      smFB = smFB + (tFB - smFB) * 0.07;
      smGA = smGA + (tGA - smGA) * 0.07;
      smGB = smGB + (tGB - smGB) * 0.07;
      smPan = smPan + (tP - smPan) * 0.035;

      const TC = 0.04;
      const t = ctx.currentTime;
      if (!isSfxMuted()) {
        mGain.gain.setTargetAtTime(smMG, t, TC);
        fA.frequency.setTargetAtTime(Math.max(200, smFA), t, TC * 1.5);
        fB.frequency.setTargetAtTime(Math.max(400, smFB), t, TC * 1.5);
        gA.gain.setTargetAtTime(Math.max(0.1, smGA), t, TC * 2);
        gB.gain.setTargetAtTime(Math.max(0.1, smGB), t, TC * 2);
        scrollPan.pan.setTargetAtTime(smPan, t, TC * 3);
      } else {
        mGain.gain.setTargetAtTime(0, t, 0.05);
      }

      // Auto-stop RAF when silent.
      if (!inertialVel && smMG < 0.002) {
        scrollLoopRunning = false;
        return;
      }
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  window.addEventListener('wheel', (e) => {
    if (!e || Math.abs(e.deltaY) < 0.5) return;
    ensureStarted();
    initScrollNodes();

    rawInputVel += Math.abs(e.deltaY) * SCROLL_INPUT_SCALE;
    scrollDir = e.deltaY > 0 ? 1 : -1;
    hasInput = true;
  }, { passive: true });

  function initExplosionBuffer() {
    // Lazy init placeholder: created after ensureStarted when ctx exists.
    if (explosionNoiseBuf) return;
    if (!ac) return;
    const ctx = getAC();
    const len = Math.floor(ctx.sampleRate * EXPL_DURATION);
    explosionNoiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = explosionNoiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  // ----------------------------
  // SFX 4 — DIGITAL PULSE (navigation -> pulse sound)
  // ----------------------------
  const PULSE_TONE1_HZ = 580;
  const PULSE_TONE2_HZ = 740;
  const PULSE_TONE1_GAIN = 0.14;
  const PULSE_TONE2_GAIN = 0.12;
  const PULSE_TONE2_DELAY = 0.055;
  const PULSE_DURATION = 0.07;

  function playDigitalPulse() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    function tone(freq, start, dur, vol) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.007);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(g);
      g.connect(sfxMasterGain);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    }

    tone(PULSE_TONE1_HZ, now, PULSE_DURATION, PULSE_TONE1_GAIN);
    tone(PULSE_TONE2_HZ, now + PULSE_TONE2_DELAY, PULSE_DURATION, PULSE_TONE2_GAIN);
  }

  // ----------------------------
  // Terminal sounds entrypoints
  // (terminal valid -> success, invalid -> error)
  // ----------------------------
  function playTerminalSuccess() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    // Two rising sines (success).
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    g.connect(sfxMasterGain);

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(420, now);
    o1.connect(g);
    o1.start(now);
    o1.stop(now + 0.16);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(680, now + 0.05);
    o2.connect(g);
    o2.start(now + 0.05);
    o2.stop(now + 0.18);
  }

  function playTerminalError() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    // Two falling beeps + a tiny bit of grit (error).
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.24, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    g.connect(sfxMasterGain);

    const o1 = ctx.createOscillator();
    o1.type = 'square';
    o1.frequency.setValueAtTime(660, now);
    o1.connect(g);
    o1.start(now);
    o1.stop(now + 0.18);

    const o2 = ctx.createOscillator();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(420, now + 0.04);
    o2.connect(g);
    o2.start(now + 0.04);
    o2.stop(now + 0.20);
  }

  // ----------------------------
  // Game sounds entrypoints
  // shoot -> laser, hit -> explosion
  // ----------------------------
  const LASER_GAIN = 0.28;
  const LASER_FREQ_START = 880;
  const LASER_FREQ_END = 220;
  const LASER_DURATION = 0.10;

  const EXPL_GAIN = 0.55;
  const EXPL_DURATION = 0.22;
  const EXPL_LP_START = 800;
  const EXPL_LP_END = 200;

  let explosionNoiseBuf = null;

  function playGameLaser() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(LASER_FREQ_START, now);
    osc.frequency.exponentialRampToValueAtTime(LASER_FREQ_END, now + 0.09);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(LASER_GAIN, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + LASER_DURATION);

    osc.connect(hp);
    hp.connect(gain);
    gain.connect(sfxMasterGain);

    osc.start(now);
    osc.stop(now + LASER_DURATION + 0.02);
  }

  function playGameExplosion() {
    if (isSfxMuted()) return;
    const ctx = getAC();
    const now = ctx.currentTime;

    if (!explosionNoiseBuf) initExplosionBuffer();

    const src = ctx.createBufferSource();
    src.buffer = explosionNoiseBuf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(EXPL_LP_START, now);
    lp.frequency.exponentialRampToValueAtTime(EXPL_LP_END, now + EXPL_DURATION);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(EXPL_GAIN, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + EXPL_DURATION);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(sfxMasterGain);

    src.start(now);
    src.stop(now + EXPL_DURATION);
  }
})();

