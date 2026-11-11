/* 人生副本 — 宣傳片：用遊戲本身的 3D 場景排鏡頭，合成字幕與配樂，並可錄成影片 */
window.__TRAILER = true;
(function (G) {
  const W = G.World, S = G.Stage;
  const OUT = document.getElementById('out'), ctx = OUT.getContext('2d');
  const OW = 1280, OH = 720;
  const status = document.getElementById('status');
  const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
  const URL_TEXT = 'cz481511-cloud.github.io/life-instance';

  const M = {
    dad: 'character-male-d', mom: 'character-female-b', boy: 'character-male-e', girl: 'character-female-e',
    zhang: 'character-male-b', lin: 'character-female-f', thief: 'character-worker', auntie: 'character-female-a',
    teacher: 'character-female-c', director: 'character-male-c', azhe: 'character-male-a', kidA: 'character-male-f',
  };

  /* =====================================================
   * Shots: { t0, t1, src:'world'|'stage', setup(), update(t, k) }
   * captions: { t0, t1, text, style }
   * ===================================================== */
  const TOWER = { x: 6.5 * 60, z: 0.5 * 60 };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k * k * (3 - 2 * k);
  let ridingKeys = false;
  function ride(on) { if (ridingKeys !== on) { W.touch('w', on); ridingKeys = on; } }

  const SHOTS = [
    { t0: 0, t1: 5.5, src: 'world', setup() { W.setTime(17 * 60 + 20, 'sun'); W.setPlayer(3 * 60, 60, 0, 0); ride(false); },
      cine: (cam, P, k) => { const a = lerp(-0.9, -0.2, ease(k)); const r = lerp(230, 175, ease(k)); cam.position.set(TOWER.x - 60 + Math.sin(a) * r, lerp(120, 82, ease(k)), TOWER.z + 60 + Math.cos(a) * r); cam.lookAt(TOWER.x - 20, 25, TOWER.z + 20); } },
    { t0: 5.5, t1: 10, src: 'world', setup() { W.setTime(19 * 60, 'rain'); W.setPlayer(3 * 60 - 2, 20, 0, 15); ride(true); },
      cine: (cam, P, k) => { cam.position.set(P.x + lerp(-3.2, -2.0, k), lerp(2.0, 1.6, k), P.z - lerp(5.5, 4.2, k)); cam.lookAt(P.x + 0.4, 1.3, P.z + 4); } },
    { t0: 10, t1: 14, src: 'world', setup() { W.setTime(22 * 60, 'sun'); ride(false); },
      cine: (cam, P, k) => { cam.position.set(TOWER.x - 200 + k * 30, 140 - k * 15, TOWER.z + 200 - k * 20); cam.lookAt(TOWER.x - 60, 10, TOWER.z + 60); } },
    { t0: 14, t1: 22.5, src: 'world', setup() { W.setTime(15 * 60, 'sun'); W.setPlayer(20, 4 * 60 + 2, Math.PI / 2, 12); ride(true); },
      update: (t) => { if (t > 19.4 && !SHOTS[3].rained) { SHOTS[3].rained = true; W.setTime(17 * 60 + 40, 'rain'); } },
      cine: (cam, P, k) => { const fx = Math.sin(P.h), fz = Math.cos(P.h); const back = lerp(9, 6.5, k); cam.position.set(P.x - fx * back + lerp(0, 2.5, k), lerp(6.5, 3.2, k), P.z - fz * back + 2); cam.lookAt(P.x + fx * 6, 1.6, P.z + fz * 6); } },

    /* ----- 爸媽篇 quick cuts ----- */
    { t0: 22.5, t1: 25, src: 'stage', setup() {
      S.show('schoolgate', [
        { id: 'me', model: M.mom, x: -1.1, z: 1.1, rot: 0.5, height: 1.8 }, { id: 'kid', model: M.girl, x: -0.2, z: 1.5, rot: 0.3, height: 1.3, anim: 'emote-yes' },
        { id: 'lin', model: M.lin, x: 1.6, z: 1.0, rot: -1.2, height: 1.75, anim: 'emote-no' }, { id: 'car', model: 'suv-luxury', x: 2.4, z: 3.8, rot: Math.PI / 2, height: 1.7 },
      ]); },
      cam: (k) => ({ pos: [lerp(4.5, 2.5, k), lerp(4.2, 2.8, k), lerp(11, 8.5, k)], look: [0, 1.1, 0.6] }) },
    { t0: 25, t1: 27.6, src: 'stage', setup() {
      S.show('office', [
        { id: 'me', model: M.dad, x: -1.2, z: 1.1, rot: 0.9, height: 1.8 }, { id: 'kid', model: M.boy, x: -2.2, z: 1.7, rot: 0.6, height: 1.35, anim: 'emote-no' },
        { id: 'zhang', model: M.zhang, x: 0.2, z: 1.0, rot: -1.4, height: 1.95 }, { id: 'dir', model: M.director, x: -0.6, z: -1.6, rot: 0, height: 1.78, anim: 'sit' },
      ]);
      at(900, () => S.act('zhang', 'attack-melee-right', { once: true, restart: true }));
      at(1150, () => S.act('me', 'emote-no', { once: true, restart: true })); },
      cam: (k) => ({ pos: [lerp(3.4, 2.6, k), lerp(2.8, 2.4, k), lerp(7.0, 6.0, k)], look: [-0.8, 1.2, 0.6] }) },
    { t0: 27.6, t1: 29.8, src: 'stage', setup() {
      S.show('office', [
        { id: 'me', model: M.dad, x: -0.7, z: 1.1, rot: 1.4, height: 1.8 }, { id: 'zhang', model: M.zhang, x: 0.5, z: 1.0, rot: -1.4, height: 1.95 },
        { id: 'kid', model: M.boy, x: -2.2, z: 1.7, rot: 0.6, height: 1.35 },
      ]);
      at(500, () => S.act('me', 'attack-kick-right', { once: true, restart: true }));
      at(800, () => S.act('zhang', 'die', { once: true, restart: true }));
      at(1300, () => S.act('kid', 'emote-yes', { once: true, restart: true })); },
      cam: (k) => ({ pos: [lerp(1.2, 0.4, k), lerp(2.0, 1.7, k), lerp(5.8, 5.0, k)], look: [-0.3, 1.0, 0.9] }) },
    { t0: 29.8, t1: 32.2, src: 'stage', setup() {
      S.show('nightmarket', [
        { id: 'me', model: M.mom, x: -0.6, z: 0.8, rot: 1.3, height: 1.8 }, { id: 'thief', model: M.thief, x: 0.7, z: 0.9, rot: -1.5, height: 1.78 },
        { id: 'kid', model: M.girl, x: -1.8, z: 1.4, rot: 0.8, height: 1.3, anim: 'emote-yes' },
      ]);
      at(600, () => S.act('me', 'attack-melee-right', { once: true, restart: true }));
      at(900, () => S.act('thief', 'die', { once: true, restart: true })); },
      cam: (k) => ({ pos: [lerp(1.8, 0.6, k), 2.0, lerp(6.2, 5.0, k)], look: [0, 1.2, 0.6] }) },
    { t0: 32.2, t1: 34.8, src: 'stage', setup() {
      S.show('market', [
        { id: 'kid', model: M.boy, x: 0.3, z: 0.9, rot: 0.4, height: 1.25, anim: 'die' }, { id: 'me', model: M.dad, x: -0.9, z: 1.3, rot: 0.6, height: 1.8, anim: 'emote-no' },
        { id: 'aun', model: M.auntie, x: 1.8, z: 0.6, rot: -1.2, height: 1.72 },
      ]); },
      cam: (k) => ({ pos: [lerp(3.6, 2.4, k), lerp(3.6, 2.6, k), lerp(7.5, 6.0, k)], look: [0, 0.8, 0.8] }) },
    { t0: 34.8, t1: 37.6, src: 'stage', setup() {
      S.show('netcafe', [
        { id: 'me', model: M.mom, x: -0.2, z: -0.6, rot: Math.PI, height: 1.8, anim: 'sit' }, { id: 'kid', model: M.girl, x: -1.3, z: -0.6, rot: Math.PI, height: 1.55, anim: 'sit' },
        { id: 'azhe', model: M.azhe, x: 1.6, z: 0.6, rot: -2.4, height: 1.7 },
      ], { night: true });
      at(1400, () => S.act('kid', 'emote-yes', { once: true, restart: true })); },
      cam: (k) => ({ pos: [lerp(-0.4, -0.8, k), lerp(2.6, 2.1, k), lerp(4.6, 3.4, k)], look: [-0.7, 1.0, -1.4] }) },

    /* ----- coming soon ----- */
    { t0: 37.6, t1: 41.6, src: 'stage', setup() {
      S.show('drinkshop', [{ id: 'me', model: M.dad, x: -0.6, z: -1.8, rot: 0.2, height: 1.8, anim: 'emote-yes' }, { id: 'cus', model: M.auntie, x: 1.6, z: 1.4, rot: Math.PI - 0.5, height: 1.72 }], { sign: '副本製作中' }); },
      cam: (k) => ({ pos: [lerp(3.2, 1.8, k), 3.0, lerp(7.8, 6.6, k)], look: [0, 1.2, 0] }) },

    /* ----- end card ----- */
    { t0: 41.6, t1: 47.5, src: 'world', setup() { S.hide(); W.setTime(22 * 60, 'sun'); W.setPlayer(4 * 60 - 2, 30, 0, 10); ride(true); },
      cine: (cam, P, k) => { cam.position.set(P.x + 14 - k * 6, 26 - k * 8, P.z - 18); cam.lookAt(P.x, 2, P.z + 20); } },
  ];
  const END = 47.5;
  const HITS = [25.9, 28.1, 30.4]; // punch / kick sound times (match the at() calls in the shots above)

  const CAPS = [
    { t0: 0.8, t1: 5.2, text: '每個人，都只有一次人生。' },
    { t0: 6.0, t1: 9.8, text: '如果人生，可以多打幾個副本呢？' },
    { t0: 10.0, t1: 14.0, style: 'title' },
    { t0: 14.2, t1: 22.4, style: 'chapter', text: '副本 01　外送員篇' },
    { t0: 15.0, t1: 17.6, text: '客人備註：「不要按電鈴，請用心電感應。」' },
    { t0: 17.8, t1: 19.4, text: '平台說：你已超時 3 分鐘。' },
    { t0: 19.6, t1: 22.4, text: '暴雨、車禍、還有一段愛情——每一單都有故事。' },
    { t0: 22.6, t1: 37.5, style: 'chapter', text: '副本 02　爸媽篇' },
    { t0: 23.0, t1: 24.9, text: '孩子在學校咬了同學。家長群組炸了。' },
    { t0: 25.1, t1: 27.5, text: '學務處。張爸爸推了你一把。' },
    { t0: 27.7, t1: 29.7, text: '要還手嗎？', big: true },
    { t0: 29.9, t1: 32.1, text: '夜市有扒手。這次換你追。' },
    { t0: 32.3, t1: 34.7, text: '全連。孩子躺在地上。全場都在看你。' },
    { t0: 34.9, t1: 37.5, text: '凌晨一點，西門町網咖。「教我玩，打完這場就回家。」' },
    { t0: 37.8, t1: 41.5, style: 'soon' },
    { t0: 41.8, t1: 47.5, style: 'end' },
  ];

  /* =====================================================
   * Music & sfx (WebAudio, routed to speakers + recorder)
   * ===================================================== */
  let AC = null, master = null, recDest = null;
  function audioInit() {
    if (AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.9;
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(AC.destination);
    recDest = AC.createMediaStreamDestination(); comp.connect(recDest);
  }
  function osc(type, f, t, dur, vol, opts) {
    opts = opts || {};
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    const a = opts.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (opts.release) { // sustained note: hold, then release (no per-note swell/fade)
      g.gain.setValueAtTime(vol, Math.max(t + a, t + dur - opts.release));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    } else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (opts.lp) { const f2 = AC.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = opts.lp; o.connect(f2); node = f2; }
    node.connect(g); g.connect(opts.out || master); o.start(t); o.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(t, dur, vol, hp, out) {
    if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 1000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || master); s.start(t); s.stop(t + dur + 0.05);
  }
  const SFX = {
    hit() { if (!AC) return; const t = AC.currentTime; noise(t, 0.12, 0.35, 800); osc('sine', 110, t, 0.22, 0.5, { slide: 55 }); },
  };
  const N2F = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function scheduleMusic(t0) {
    const bpm = 96, beat = 60 / bpm, bar = beat * 4;
    // Am - F - C - G  (root midi)
    const prog = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];
    const roots = [45, 41, 36, 43];
    // lead melody: one bar per chord, eighth notes, all notes inside C major / A minor (null = rest)
    const MEL = [
      [69, null, 72, 71, 69, null, 64, null],   // Am
      [65, null, 69, 72, 71, null, 69, null],   // F
      [67, null, 72, 74, 76, null, 74, 72],     // C
      [71, null, 67, null, 74, 72, 71, null],   // G
    ];
    const totalBars = Math.ceil(END / bar);
    for (let b = 0; b < totalBars; b++) {
      const tb = t0 + b * bar, c = prog[b % 4], r = roots[b % 4], time = b * bar;
      const out = time >= END - 4; // last bars: thin out
      // pad: warm sustained triangles (no swell per bar)
      c.forEach((n) => osc('triangle', N2F(n), tb, bar + 0.08, out ? 0.03 : 0.045, { attack: 0.25, release: 0.3, lp: 2200 }));
      if (time < 10) { // intro: gentle music-box arpeggio
        for (let i = 0; i < 8; i++) osc('sine', N2F(c[[0, 1, 2, 1][i % 4]] + 12), tb + i * beat / 2, 0.6, 0.06, { attack: 0.01 });
        continue;
      }
      if (out) continue;
      // bass: root / fifth, soft and round
      for (let i = 0; i < 4; i++) osc('triangle', N2F(r + (i === 3 ? 7 : 0)), tb + i * beat, beat * 0.9, 0.16, { attack: 0.01, release: 0.12, lp: 500 });
      // drums: light pop beat
      for (let i = 0; i < 4; i++) {
        const tt = tb + i * beat;
        if (i % 2 === 0) osc('sine', 100, tt, 0.22, 0.38, { slide: 45 }); // kick
        if (i % 2 === 1) noise(tt, 0.12, 0.12, 1800);                    // snare
        noise(tt + beat / 2, 0.035, 0.035, 8000);                         // hat
      }
      // lead melody from the 外送員篇 onwards
      if (time >= 12.5) MEL[b % 4].forEach((n, i) => { if (n) osc('triangle', N2F(n), tb + i * beat / 2, beat * 0.45, 0.07, { attack: 0.01, release: 0.15, lp: 3500 }); });
    }
    // fight hits (synced with the 爸媽篇 shots)
    HITS.forEach((h) => { noise(t0 + h, 0.12, 0.35, 800); osc('sine', 110, t0 + h, 0.22, 0.5, { slide: 55 }); });
    // title hit: soft low thump + cymbal-ish swell
    osc('sine', 70, t0 + 10, 1.4, 0.6, { slide: 40 }); noise(t0 + 10, 1.0, 0.08, 4000);
    // end chord (A minor add9 resolving)
    [57, 64, 69, 71, 72].forEach((n) => osc('triangle', N2F(n), t0 + 41.6, 5.6, 0.045, { attack: 0.05, release: 2.5, lp: 2500 }));
  }

  /* =====================================================
   * Compositor
   * ===================================================== */
  let tStart = 0, playing = false, curShot = -1, onDone = null;
  let offline = false, vt = 0, queue = [];
  const worldCanvas = () => document.querySelector('#world canvas');

  W.cine = (cam, P) => {
    const s = SHOTS[curShot];
    if (s && s.cine) { const k = G.clamp((now() - s.t0) / (s.t1 - s.t0), 0, 1); s.cine(cam, P, k); }
    else { cam.position.set(P.x - 8, 6, P.z - 8); cam.lookAt(P.x, 1, P.z); }
  };
  const now = () => (offline ? vt : playing ? (performance.now() - tStart) / 1000 : 0);
  /** run fn `ms` after now, on the trailer clock (works for live playback and offline rendering) */
  function at(ms, fn) { queue.push({ t: now() + ms / 1000, fn }); }
  function runQueue(t) { const due = queue.filter((q) => q.t <= t); queue = queue.filter((q) => q.t > t); due.forEach((q) => q.fn()); }

  function enterShot(i) {
    curShot = i;
    queue = [];
    const s = SHOTS[i];
    if (s.src === 'stage') { document.getElementById('stage').classList.remove('hidden'); }
    else { S.hide(); document.getElementById('stage').classList.add('hidden'); }
    if (s.setup) s.setup();
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!playing || offline) return;
    const t = now();
    if (t >= END) { finish(); return; }
    composite(t, advance(t));
  }
  /** shot logic for time t; returns the active shot */
  function advance(t) {
    let idx = SHOTS.findIndex((s) => t >= s.t0 && t < s.t1);
    if (idx < 0) idx = SHOTS.length - 1;
    if (idx !== curShot) enterShot(idx);
    runQueue(t);
    const s = SHOTS[idx];
    const k = G.clamp((t - s.t0) / (s.t1 - s.t0), 0, 1);
    if (s.update) s.update(t, k);
    if (s.cam) S.setCam(s.cam(k));
    return s;
  }
  function composite(t, s) {
    const k = G.clamp((t - s.t0) / (s.t1 - s.t0), 0, 1);
    const src = s.src === 'stage' ? S.canvas() : worldCanvas();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, OW, OH);
    if (src && src.width) ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, OW, OH);
    drawOverlays(t, s, k);
  }

  function vignette() {
    const g = ctx.createRadialGradient(OW / 2, OH / 2, OH * 0.35, OW / 2, OH / 2, OH * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, OW, OH);
  }
  function fadeIn(t, t0, d) { return G.clamp((t - t0) / d, 0, 1); }
  function caption(text, a, big) {
    ctx.save(); ctx.globalAlpha = a;
    const fs = big ? 64 : 38;
    ctx.font = `900 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    const y = big ? OH / 2 : OH - 92;
    ctx.fillStyle = 'rgba(8,8,18,0.62)';
    roundRect(OW / 2 - w / 2 - 26, y - fs * 0.85, w + 52, fs * 1.7, 14); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(text, OW / 2, y + 2);
    ctx.fillStyle = '#fff'; ctx.fillText(text, OW / 2, y + 2);
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function pill(text, a) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `900 30px ${FONT}`; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 44;
    const g = ctx.createLinearGradient(40, 0, 40 + w, 0); g.addColorStop(0, '#ff4f8b'); g.addColorStop(1, '#ff8a4f');
    ctx.fillStyle = g; roundRect(40, 36, w, 58, 29); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, 62, 66);
    ctx.restore();
  }
  function logo(cx, cy, scale, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(132 * scale)}px ${FONT}`;
    ctx.shadowColor = 'rgba(255,79,139,0.85)'; ctx.shadowBlur = 40 * scale;
    const g = ctx.createLinearGradient(cx - 300 * scale, 0, cx + 300 * scale, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ffd6e6'); g.addColorStop(1, '#ffe2c4');
    ctx.fillStyle = g; ctx.fillText('人生副本', cx, cy);
    ctx.shadowBlur = 0;
    ctx.font = `700 ${Math.round(26 * scale)}px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('L I F E   I N S T A N C E', cx, cy + 92 * scale);
    ctx.restore();
  }

  function drawOverlays(t, s, k) {
    vignette();
    for (const c of CAPS) {
      if (t < c.t0 || t > c.t1) continue;
      const a = Math.min(fadeIn(t, c.t0, 0.25), fadeIn(c.t1, t, 0.25));
      if (c.style === 'title') {
        ctx.fillStyle = `rgba(5,5,15,${0.55 * a})`; ctx.fillRect(0, 0, OW, OH);
        const sc = 0.9 + 0.1 * ease(G.clamp((t - c.t0) / 1.2, 0, 1));
        logo(OW / 2, OH / 2 - 30, sc, a);
        ctx.save(); ctx.globalAlpha = fadeIn(t, c.t0 + 1.0, 0.5) * a; ctx.font = `700 30px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.fillText('台灣味．黑色幽默．人生模擬', OW / 2, OH / 2 + 130); ctx.restore();
      } else if (c.style === 'chapter') pill(c.text, a);
      else if (c.style === 'soon') {
        ctx.fillStyle = `rgba(5,5,15,${0.6 * a})`; ctx.fillRect(0, 0, OW, OH);
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 46px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('更多人生副本　製作中', OW / 2, OH / 2 - 110);
        const items = ['🚕 計程車篇', '🏪 便利商店篇', '🧋 手搖飲創業篇', '📱 網紅篇'];
        items.forEach((it, i) => {
          const ia = fadeIn(t, c.t0 + 0.3 + i * 0.35, 0.3) * a;
          ctx.globalAlpha = ia;
          const x = OW / 2 + (i - 1.5) * 270, y = OH / 2 + 20;
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(x - 120, y - 46, 240, 92, 18); ctx.fill();
          ctx.strokeStyle = 'rgba(255,138,79,0.8)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = `900 30px ${FONT}`; ctx.fillText(it, x, y);
        });
        ctx.restore();
      } else if (c.style === 'end') {
        ctx.fillStyle = `rgba(5,5,15,${0.62 * a})`; ctx.fillRect(0, 0, OW, OH);
        logo(OW / 2, OH / 2 - 80, 0.95, a);
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = fadeIn(t, c.t0 + 0.8, 0.5) * a; ctx.font = `900 34px ${FONT}`; ctx.fillStyle = '#fff';
        ctx.fillText('免安裝・打開瀏覽器就能玩', OW / 2, OH / 2 + 60);
        ctx.globalAlpha = fadeIn(t, c.t0 + 1.4, 0.5) * a;
        ctx.font = `700 30px ${FONT}`; const w = ctx.measureText(URL_TEXT).width + 60;
        const g = ctx.createLinearGradient(OW / 2 - w / 2, 0, OW / 2 + w / 2, 0); g.addColorStop(0, '#ff4f8b'); g.addColorStop(1, '#ff8a4f');
        ctx.fillStyle = g; roundRect(OW / 2 - w / 2, OH / 2 + 104, w, 60, 30); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(URL_TEXT, OW / 2, OH / 2 + 135);
        ctx.restore();
      } else caption(c.text, a, c.big);
    }
    // cut flashes between shots
    const edge = Math.min(t - s.t0, s.t1 - t);
    if (edge < 0.18) { ctx.fillStyle = `rgba(0,0,0,${1 - edge / 0.18})`; ctx.fillRect(0, 0, OW, OH); }
    // global fade in / out
    const g = Math.max(1 - t / 0.8, (t - (END - 1.2)) / 1.2);
    if (g > 0) { ctx.fillStyle = `rgba(0,0,0,${G.clamp(g, 0, 1)})`; ctx.fillRect(0, 0, OW, OH); }
  }

  /* =====================================================
   * Play / record
   * ===================================================== */
  let recorder = null, chunks = [], recMime = '';
  function start(record) {
    audioInit();
    if (AC.state === 'suspended') AC.resume();
    SHOTS.forEach((s) => { s.rained = false; });
    curShot = -1;
    if (record) {
      const vs = OUT.captureStream(30);
      const stream = new MediaStream([...vs.getVideoTracks(), ...recDest.stream.getAudioTracks()]);
      const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
      recMime = types.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
      recorder = new MediaRecorder(stream, { mimeType: recMime, videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 192000 });
      chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.start(500);
    }
    tStart = performance.now() + 50;
    scheduleMusic(AC.currentTime + 0.05);
    playing = true;
    ui(false);
    status.textContent = record ? '錄製中⋯' : '播放中⋯';
  }
  function finish() {
    playing = false; ride(false);
    if (recorder) {
      const r = recorder; recorder = null;
      r.onstop = () => {
        const blob = new Blob(chunks, { type: recMime.split(';')[0] || 'video/webm' });
        window.__trailerBlob = blob;
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = '人生副本_宣傳片.' + ext; a.textContent = '⬇ 下載影片（' + (blob.size / 1048576).toFixed(1) + ' MB）';
        a.style.cssText = 'color:#fff;font-weight:900;margin-left:8px';
        status.textContent = '完成！'; status.appendChild(a);
        if (onDone) onDone(blob);
      };
      r.stop();
    } else status.textContent = '播放完畢';
    ui(true);
  }
  function ui(show) { document.getElementById('ui').classList.toggle('hidden', !show); }
  document.getElementById('play').onclick = () => start(false);
  document.getElementById('rec').onclick = () => start(true);
  /** automation hook: record and resolve with the blob */
  window.__recordTrailer = () => new Promise((res) => { onDone = res; start(true); });
  window.__playTrailer = () => start(false);
  /** debug: jump to time t (seconds) while playing */
  window.__seek = (t) => { tStart = performance.now() - t * 1000; curShot = -1; };

  /* =====================================================
   * Offline render: deterministic frame-by-frame (immune to tab throttling).
   * Frames are PUT to the local dev server (tools/serve.ps1) as JPEGs, audio as WAV.
   * ===================================================== */
  async function renderAudioWav() {
    const SR = 48000, len = Math.ceil((END + 0.5) * SR);
    const oac = new OfflineAudioContext(2, len, SR);
    const saved = { AC, master };
    AC = oac; noiseBuf = null;
    master = oac.createGain(); master.gain.value = 0.9;
    const comp = oac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(oac.destination);
    scheduleMusic(0.0);
    const buf = await oac.startRendering();
    AC = saved.AC; master = saved.master; noiseBuf = null;
    // 16-bit PCM WAV
    const ch = [buf.getChannelData(0), buf.getChannelData(1)], n = buf.length;
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, SR, true);
    out.setUint32(28, SR * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < 2; c++, o += 2) out.setInt16(o, Math.max(-1, Math.min(1, ch[c][i])) * 0x7fff, true);
    return new Blob([out.buffer], { type: 'audio/wav' });
  }
  const put = async (path, blob) => { const r = await fetch(path, { method: 'PUT', body: blob }); if (r.status !== 201) throw new Error('upload failed ' + path + ' ' + r.status); };
  window.__renderOffline = async function (fps) {
    fps = fps || 30;
    const dt = 1 / fps, total = Math.round(END * fps);
    window.__OFFLINE = true; offline = true; playing = true; ui(false);
    SHOTS.forEach((s) => { s.rained = false; }); curShot = -1; queue = []; ride(false);
    await put('/tools/out/audio.wav', await renderAudioWav());
    const t0 = performance.now();
    for (let f = 0; f < total; f++) {
      vt = f * dt;
      const s = advance(vt);
      G.Assets.update(dt);
      if (s.src === 'stage') S.frame(dt, true); else W.frame(dt, true);
      composite(vt, s);
      // toDataURL is synchronous (toBlob gets deferred ~1s per frame in a background pane)
      const b64 = OUT.toDataURL('image/jpeg', 0.93).split(',')[1], bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/jpeg' });
      await put('/tools/out/frames/f' + String(f).padStart(5, '0') + '.jpg', blob);
      if (f % 15 === 0) status.textContent = `算圖中 ${f}/${total}（${Math.round((performance.now() - t0) / 1000)} 秒）`;
      window.__renderProgress = f + 1;
    }
    offline = false; playing = false; window.__OFFLINE = false; ride(false);
    status.textContent = '算圖完成'; ui(true);
    return total;
  };

  /* ---------- boot ---------- */
  (async function boot() {
    await Promise.all([G.Assets.load((p) => { status.textContent = '載入 3D 素材 ' + Math.round(p * 100) + '%'; }), document.fonts ? document.fonts.load(`900 40px ${FONT}`).catch(() => {}) : 0]);
    W.init(document.getElementById('world'), document.getElementById('minimap'));
    W.pause(false);
    S.init(document.getElementById('stage'));
    // stage needs a visible container to size itself; keep it rendered but transparent
    status.textContent = '準備好了';
    document.getElementById('play').disabled = false; document.getElementById('rec').disabled = false;
    requestAnimationFrame(frame);
    // idle preview frame
    curShot = 0; SHOTS[0].setup();
    (function idle() { if (!playing) { const src = worldCanvas(); if (src && src.width) { ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, OW, OH); vignette(); logo(OW / 2, OH / 2, 0.8, 1); } requestAnimationFrame(idle); } })();
  })();
})(window.G);
