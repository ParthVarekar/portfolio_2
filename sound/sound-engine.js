/**
 * sound-engine.js — Extracted from all_in_one_with_bg_music.html
 * Lean production version: click, scroll, woosh SFX + BG music
 * All SFX use Web Audio API. BG uses <audio> element.
 * Volume controlled via #bgVol and #sfxVol sliders.
 */
'use strict';
(function () {

  // ── SHARED AUDIO CONTEXT ────────────────────────────────
  let ac = null;
  let sfxGain = 0.6;  // SFX master volume (0–1), overridden by slider

  function getAC() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  // Ensure AudioContext starts on first user gesture
  function ensureAC() {
    getAC();
  }
  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(ev =>
    document.addEventListener(ev, ensureAC, { once: true, passive: true })
  );

  // ── BG MUSIC ─────────────────────────────────────────────
  let bgAudio = document.getElementById('bgAudio');
  if (!bgAudio) {
    bgAudio = document.createElement('audio');
    bgAudio.id = 'bgAudio';
    bgAudio.loop = true;
    document.body.appendChild(bgAudio);
  }

  // Determine base path for audio files
  const scripts = document.getElementsByTagName('script');
  let basePath = '';
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('sound-engine') !== -1) {
      basePath = scripts[i].src.replace(/[^/]*$/, '');
      break;
    }
  }
  if (!basePath) {
    // Fallback: try sound.js path
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('sound') !== -1 && scripts[i].src.indexOf('.js') !== -1) {
        basePath = scripts[i].src.replace(/[^/]*$/, '');
        break;
      }
    }
  }

  bgAudio.volume = 0.3;  // fallback, overridden by slider
  if (!bgAudio.src || bgAudio.src === '') {
    bgAudio.src = basePath + 'final_bg.mp3';
  }

  // Auto-play BG music on first interaction
  let bgStarted = false;
  function tryStartBG() {
    if (bgStarted) return;
    bgStarted = true;
    bgAudio.play().catch(function () { bgStarted = false; });
  }
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, tryStartBG, { once: false, passive: true })
  );

  // ── VOLUME SLIDERS ───────────────────────────────────────
  const bgSlider = document.getElementById('bgVol');
  const sfxSlider = document.getElementById('sfxVol');

  if (bgSlider) {
    bgAudio.volume = parseFloat(bgSlider.value);
    bgSlider.addEventListener('input', function (e) {
      bgAudio.volume = parseFloat(e.target.value);
      if (parseFloat(e.target.value) < 0.01) {
        bgAudio.pause();
      } else if (bgStarted && bgAudio.paused) {
        bgAudio.play().catch(function () {});
      }
    });
  }
  if (sfxSlider) {
    sfxGain = parseFloat(sfxSlider.value);
    sfxSlider.addEventListener('input', function (e) {
      sfxGain = parseFloat(e.target.value);
    });
  }


  // ── HELPERS ──────────────────────────────────────────────
  function buildNoise(ctx, secs) {
    var len = Math.floor(ctx.sampleRate * secs);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }


  // ═══════════════════════════════════════════════════════════
  //  SFX 1 — CLICK SOUND SYSTEM
  // ═══════════════════════════════════════════════════════════
  var CLICK_INTERACTIVE_GAIN = 3.40;
  var CLICK_EMPTY_GAIN = 2.20;
  var CLICK_TING_GAIN = 0.24;
  var CLICK_INTERACTIVE_HZ = 1480;
  var CLICK_EMPTY_HZ = 734;
  var CLICK_TING_HZ = 2100;
  var CLICK_TING_DELAY_MS = 20;
  var CLICK_DEDUP_SEC = 0.060;

  var clickNoiseBuf = null;
  function getClickNoise() {
    if (clickNoiseBuf) return clickNoiseBuf;
    var ctx = getAC(), len = Math.floor(ctx.sampleRate * 0.05);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    clickNoiseBuf = buf;
    return buf;
  }

  var clickSpam = {
    lastT: 0, fv: 1, gv: 1, rt: null,
    tick: function () {
      var dt = performance.now() - this.lastT; this.lastT = performance.now();
      if (dt < 300) {
        this.fv = 1 + (Math.random() - 0.5) * 0.16;
        this.gv = 1 + (Math.random() - 0.5) * 0.20;
      } else {
        clearTimeout(this.rt);
        var self = this;
        this.rt = setTimeout(function () { self.fv = 1; self.gv = 1; }, 600);
      }
    }
  };

  function playClickInteractive() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    var src = ctx.createBufferSource(); src.buffer = getClickNoise();
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = CLICK_INTERACTIVE_HZ * clickSpam.fv; bp.Q.value = 3.5;
    var g = ctx.createGain();
    g.gain.setValueAtTime(CLICK_INTERACTIVE_GAIN * clickSpam.gv * sfxGain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + 0.06);
    setTimeout(function () {
      var c2 = getAC(), t = c2.currentTime;
      var osc = c2.createOscillator(), tg = c2.createGain();
      osc.type = 'sine'; osc.frequency.value = CLICK_TING_HZ;
      tg.gain.setValueAtTime(0, t);
      tg.gain.linearRampToValueAtTime(CLICK_TING_GAIN * sfxGain, t + 0.007);
      tg.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(tg); tg.connect(c2.destination); osc.start(t); osc.stop(t + 0.12);
    }, CLICK_TING_DELAY_MS);
  }

  function playClickEmpty() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    var src = ctx.createBufferSource(); src.buffer = getClickNoise();
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = CLICK_EMPTY_HZ; bp.Q.value = 1.2;
    var g = ctx.createGain();
    g.gain.setValueAtTime(CLICK_EMPTY_GAIN * clickSpam.gv * sfxGain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + 0.05);
  }

  var ITAGS = { BUTTON: 1, A: 1, INPUT: 1, TEXTAREA: 1, SELECT: 1, LABEL: 1 };
  function isInteractive(el) {
    var n = el;
    while (n && n !== document.body) {
      if (n.tagName && ITAGS[n.tagName]) return true;
      if (n.getAttribute && n.getAttribute('role') === 'button') return true;
      try { if (window.getComputedStyle(n).cursor === 'pointer') return true; } catch (e) {}
      n = n.parentElement;
    }
    return false;
  }

  var lastClickMD = -999;
  document.addEventListener('mousedown', function (e) {
    var ctx = getAC(), now = ctx.currentTime;
    if (now - lastClickMD < CLICK_DEDUP_SEC) return;
    lastClickMD = now;
    clickSpam.tick();
    if (isInteractive(e.target)) playClickInteractive(); else playClickEmpty();
  }, true);


  // ═══════════════════════════════════════════════════════════
  //  SFX 2 — SCROLL PAPER SOUND
  // ═══════════════════════════════════════════════════════════
  var SCROLL_MAX_GAIN = 0.22;
  var SCROLL_MAX_VEL = 80;
  var SCROLL_FRICTION = 0.92;
  var SCROLL_INPUT_ALPHA = 0.20;
  var SCROLL_STOP_THR = 0.08;
  var SCROLL_INPUT_SCALE = 2.2;
  var SCROLL_BASE_FREQ_A = 850;
  var SCROLL_BASE_FREQ_B = 1750;
  var SCROLL_MAX_FREQ_A = 1400;
  var SCROLL_MAX_FREQ_B = 2800;

  var sFiltA, sFiltB, sGainA, sGainB, sMasterGain, sPanner;
  var scrollReady = false;

  function initScroll() {
    if (scrollReady) return;
    var ctx = getAC();
    var bufA = buildNoise(ctx, 4), bufB = buildNoise(ctx, 4);
    var srcA = ctx.createBufferSource(); srcA.buffer = bufA; srcA.loop = true;
    var srcB = ctx.createBufferSource(); srcB.buffer = bufB; srcB.loop = true;
    srcB.loopStart = Math.random() * 3; srcB.loopEnd = bufB.duration;

    sFiltA = ctx.createBiquadFilter(); sFiltA.type = 'bandpass'; sFiltA.frequency.value = SCROLL_BASE_FREQ_A; sFiltA.Q.value = 1.4;
    sFiltB = ctx.createBiquadFilter(); sFiltB.type = 'bandpass'; sFiltB.frequency.value = SCROLL_BASE_FREQ_B; sFiltB.Q.value = 2.2;
    sGainA = ctx.createGain(); sGainA.gain.value = 0.6;
    sGainB = ctx.createGain(); sGainB.gain.value = 0.4;
    sMasterGain = ctx.createGain(); sMasterGain.gain.value = 0;
    sPanner = ctx.createStereoPanner(); sPanner.pan.value = 0;

    srcA.connect(sFiltA); sFiltA.connect(sGainA); sGainA.connect(sMasterGain);
    srcB.connect(sFiltB); sFiltB.connect(sGainB); sGainB.connect(sMasterGain);
    sMasterGain.connect(sPanner); sPanner.connect(ctx.destination);
    srcA.start(); srcB.start();
    scrollReady = true;
  }

  var scrollInertia = 0, scrollRawInput = 0, scrollHasInput = false, scrollDir = 0;
  var scrollSmMG = 0, scrollSmFA = SCROLL_BASE_FREQ_A, scrollSmFB = SCROLL_BASE_FREQ_B;

  window.addEventListener('wheel', function (e) {
    initScroll();
    scrollRawInput += Math.abs(e.deltaY) * SCROLL_INPUT_SCALE;
    scrollDir = e.deltaY > 0 ? 1 : -1;
    scrollHasInput = true;
  }, { passive: true });

  function scrollLoop() {
    if (scrollReady) {
      if (scrollHasInput) {
        scrollInertia = scrollInertia * (1 - SCROLL_INPUT_ALPHA) + scrollRawInput * SCROLL_INPUT_ALPHA;
        scrollRawInput = 0; scrollHasInput = false;
      } else {
        scrollInertia *= SCROLL_FRICTION;
        if (scrollInertia < SCROLL_STOP_THR) { scrollInertia = 0; scrollDir = 0; }
      }

      var norm = Math.min(scrollInertia / SCROLL_MAX_VEL, 1);
      var tg = Math.pow(norm, 0.65) * SCROLL_MAX_GAIN;
      var tFA = SCROLL_BASE_FREQ_A + (SCROLL_MAX_FREQ_A - SCROLL_BASE_FREQ_A) * Math.pow(norm, 0.7);
      var tFB = SCROLL_BASE_FREQ_B + (SCROLL_MAX_FREQ_B - SCROLL_BASE_FREQ_B) * Math.pow(norm, 0.55);

      var ga = tg > scrollSmMG ? 0.10 : 0.05;
      scrollSmMG = scrollSmMG + (tg - scrollSmMG) * ga;
      scrollSmFA = scrollSmFA + (tFA - scrollSmFA) * 0.07;
      scrollSmFB = scrollSmFB + (tFB - scrollSmFB) * 0.07;

      if (sfxGain > 0.01) {
        var t = getAC().currentTime, TC = 0.04;
        sMasterGain.gain.setTargetAtTime(scrollSmMG * sfxGain, t, TC);
        sFiltA.frequency.setTargetAtTime(Math.max(200, scrollSmFA), t, TC * 1.5);
        sFiltB.frequency.setTargetAtTime(Math.max(400, scrollSmFB), t, TC * 1.5);
      } else if (sMasterGain) {
        sMasterGain.gain.setTargetAtTime(0, getAC().currentTime, 0.05);
      }
    }
    requestAnimationFrame(scrollLoop);
  }
  scrollLoop();


  // ═══════════════════════════════════════════════════════════
  //  SFX 3 — CURSOR WOOSH
  // ═══════════════════════════════════════════════════════════
  var WOOSH_MAX_GAIN = 0.44;
  var WOOSH_MAX_VEL = 2800;
  var WOOSH_FREQ_MIN = 280;
  var WOOSH_FREQ_MAX = 2400;
  var WOOSH_FILTER_Q = 1.2;
  var WOOSH_SILENCE_MS = 110;

  var wFilterNode, wGainNode, wPannerNode, wooshReady = false;

  function initWoosh() {
    if (wooshReady) return;
    var ctx = getAC();
    var src = ctx.createBufferSource();
    src.buffer = buildNoise(ctx, 4);
    src.loop = true;

    wFilterNode = ctx.createBiquadFilter();
    wFilterNode.type = 'bandpass';
    wFilterNode.frequency.value = WOOSH_FREQ_MIN;
    wFilterNode.Q.value = WOOSH_FILTER_Q;

    wGainNode = ctx.createGain();
    wGainNode.gain.value = 0;

    wPannerNode = ctx.createStereoPanner();
    wPannerNode.pan.value = 0;

    // Reverb
    var irLen = Math.floor(ctx.sampleRate * 0.45);
    var irBuf = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = irBuf.getChannelData(ch);
      for (var i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3.5);
    }
    var convolver = ctx.createConvolver(); convolver.buffer = irBuf;
    var wetGain = ctx.createGain(); wetGain.gain.value = 0.22;

    src.connect(wFilterNode);
    wFilterNode.connect(wGainNode);
    wGainNode.connect(wPannerNode);
    wPannerNode.connect(ctx.destination);
    wPannerNode.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);

    src.start();
    wooshReady = true;
  }

  var wMx = 0, wMy = 0, wPrevMx = 0, wPrevMy = 0;
  var wVelocity = 0, wSmGain = 0, wSmFreq = 400, wSmPan = 0;
  var wSilTimer = null;

  document.addEventListener('mousemove', function (e) {
    initWoosh();
    wMx = e.clientX; wMy = e.clientY;
    clearTimeout(wSilTimer);
    wSilTimer = setTimeout(function () {
      if (wGainNode) wGainNode.gain.setTargetAtTime(0, getAC().currentTime, 0.18);
      wSmGain = 0;
    }, WOOSH_SILENCE_MS);
  });

  function wooshLoop() {
    if (wooshReady) {
      var vx = (wMx - wPrevMx) * 60, vy = (wMy - wPrevMy) * 60;
      wVelocity = Math.sqrt(vx * vx + vy * vy);
      wPrevMx = wMx; wPrevMy = wMy;

      var norm = Math.min(wVelocity / WOOSH_MAX_VEL, 1);
      var targetGain = norm < 0.005 ? 0 : Math.pow(norm, 0.65) * WOOSH_MAX_GAIN;
      var gAlpha = targetGain > wSmGain ? 0.13 : 0.055;
      wSmGain = wSmGain + (targetGain - wSmGain) * gAlpha;
      wSmFreq = wSmFreq + (WOOSH_FREQ_MIN + (WOOSH_FREQ_MAX - WOOSH_FREQ_MIN) * Math.pow(norm, 0.55) - wSmFreq) * 0.07;
      wSmPan = wSmPan + (((wMx / window.innerWidth) * 2 - 1) * 0.88 - wSmPan) * 0.04;

      if (sfxGain > 0.01) {
        var t = getAC().currentTime, TC = 0.035;
        wGainNode.gain.setTargetAtTime(wSmGain * sfxGain, t, TC);
        wFilterNode.frequency.setTargetAtTime(wSmFreq, t, TC * 1.2);
        wPannerNode.pan.setTargetAtTime(wSmPan, t, TC * 2);
      } else {
        wGainNode.gain.setTargetAtTime(0, getAC().currentTime, 0.05);
      }
    }
    requestAnimationFrame(wooshLoop);
  }
  wooshLoop();


  // ═══════════════════════════════════════════════════════════
  //  SFX 4 — DIGITAL PULSE (navigation/link click)
  // ═══════════════════════════════════════════════════════════
  function playDigitalPulse() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    function tone(freq, start, dur, vol) {
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol * sfxGain, start + 0.007);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(g); g.connect(ctx.destination); osc.start(start); osc.stop(start + dur + 0.01);
    }
    tone(580, now, 0.07, 0.28);
    tone(740, now + 0.055, 0.07, 0.24);
  }

  // Wire pulse to all links
  document.addEventListener('click', function (e) {
    var n = e.target;
    while (n && n !== document.body) {
      if (n.tagName === 'A' || (n.getAttribute && n.getAttribute('role') === 'button')) {
        playDigitalPulse();
        return;
      }
      n = n.parentElement;
    }
  });


  // ═══════════════════════════════════════════════════════════
  //  SFX 5 — TERMINAL & GAME SOUNDS (Backward Compatibility)
  // ═══════════════════════════════════════════════════════════
  function playTerminalSuccess() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.44 * sfxGain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    g.connect(ctx.destination);

    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(420, now);
    o1.connect(g); o1.start(now); o1.stop(now + 0.16);

    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(680, now + 0.05);
    o2.connect(g); o2.start(now + 0.05); o2.stop(now + 0.18);
  }

  function playTerminalError() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.48 * sfxGain, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    g.connect(ctx.destination);

    var o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.setValueAtTime(660, now);
    o1.connect(g); o1.start(now); o1.stop(now + 0.18);

    var o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(420, now + 0.04);
    o2.connect(g); o2.start(now + 0.04); o2.stop(now + 0.20);
  }

  var explosionNoiseBuf = null;
  function playGameLaser() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    var osc = ctx.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(400, now);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.28 * sfxGain, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    osc.connect(hp); hp.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.12);
  }

  function playGameExplosion() {
    if (sfxGain < 0.01) return;
    var ctx = getAC(), now = ctx.currentTime;
    if (!explosionNoiseBuf) explosionNoiseBuf = buildNoise(ctx, 0.22);
    var src = ctx.createBufferSource(); src.buffer = explosionNoiseBuf;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, now); lp.frequency.exponentialRampToValueAtTime(200, now + 0.22);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.55 * sfxGain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + 0.22);
  }

  // ── EXPOSE PUBLIC API ────────────────────────────────────
  window.SoundEngine = {
    playClickInteractive: playClickInteractive,
    playClickEmpty: playClickEmpty,
    playDigitalPulse: playDigitalPulse,
    getAC: getAC
  };

  // Backward compatibility with old scripts
  window.PortfolioSound = {
    playTerminalSuccess: playTerminalSuccess,
    playTerminalError: playTerminalError,
    playGameLaser: playGameLaser,
    playGameExplosion: playGameExplosion
  };

})();
