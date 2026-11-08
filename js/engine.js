/* 外送人生 — engine: state helpers, rng, audio, save, UI primitives */
window.G = window.G || {};

(function (G) {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  G.$ = $; G.$$ = $$;

  /* ---------------- random ---------------- */
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.randi = (a, b) => Math.floor(G.rand(a, b + 1));
  G.chance = (p) => Math.random() < p;
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.weighted = (items, wf) => {
    const ws = items.map(wf);
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- state ---------------- */
  G.newState = function (name, gender, originId) {
    const o = G.ORIGINS.find((x) => x.id === originId);
    return {
      v: 1,
      name, gender, origin: originId,
      day: 1, clock: 7 * 60, phase: 'morning',
      weather: 'sun',
      money: o.money, stamina: o.stamina, mood: o.mood,
      rating: 4.70, bike: 80, fame: 0,
      aff: { nurse: 0, crash: 0 },
      flags: {},
      hospital: 0, crashes: 0,
      payCut: 0,
      today: { orders: 0, earned: 0, tips: 0, km: 0, spent: 0, notes: [] },
      stats: { orders: 0, earned: 0, km: 0, late: 0 },
      log: [],
      seen: {},
      chat: {},          // threadId -> { msgs: [{from, text, who}], unread, replies: [...] | null }
      reg: {},           // regular customer id -> { visits, rel }
      queue: [],         // today's remaining orders (specs)
    };
  };
  G.call = (s) => (s.gender === 'm' ? '小哥' : '小姐');
  G.heShe = (s) => (s.gender === 'm' ? '他' : '她');
  G.portrait = (s) => (s.gender === 'm' ? 'assets/art/portraits/player_male.png' : 'assets/art/portraits/player_female.png');
  G.fmtClock = (m) => {
    const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };
  G.money = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();

  /** Apply an effect object to state; returns list of {label, delta, good} for display. */
  G.apply = function (s, eff) {
    if (!eff) return [];
    const out = [];
    const add = (key, label, delta, min, max, fmt) => {
      if (!delta) return;
      const before = s[key];
      s[key] = min === undefined ? before + delta : G.clamp(before + delta, min, max);
      const real = s[key] - before;
      if (Math.abs(real) < 0.005) return;
      out.push({ label, text: fmt ? fmt(real) : (real > 0 ? '+' : '') + Math.round(real), good: real > 0 });
    };
    if (eff.money) {
      add('money', '存款', eff.money, undefined, undefined, (d) => (d > 0 ? '+' : '-') + '$' + Math.abs(Math.round(d)));
      if (eff.money < 0) s.today.spent -= eff.money;
    }
    add('stamina', '體力', eff.stamina, 0, 100);
    add('mood', '心情', eff.mood, 0, 100);
    add('bike', '機車', eff.bike, 0, 100);
    add('fame', '名氣', eff.fame, 0, 999);
    add('rating', '評分', eff.rating, 1, 5, (d) => (d > 0 ? '+' : '') + d.toFixed(2));
    // extra stats used by other life instances (爸媽篇 etc.)
    const L = G.STAT_LABELS || {};
    for (const k in L) {
      if (!eff[k] || s[k] === undefined) continue;
      const before = s[k];
      s[k] = k === 'rep' ? G.clamp(before + eff[k], -50, 50) : G.clamp(before + eff[k], 0, 100);
      const d = s[k] - before;
      if (d) out.push({ label: L[k], text: (d > 0 ? '+' : '') + Math.round(d), good: k === 'stress' ? d < 0 : d > 0 });
    }
    if (eff.aff) {
      for (const k in eff.aff) {
        const before = s.aff[k] || 0;
        s.aff[k] = G.clamp(before + eff.aff[k], 0, 100);
        const d = s.aff[k] - before;
        if (d) out.push({ label: (G.NPC[k] ? G.NPC[k].short : k) + '好感', text: (d > 0 ? '♥+' : '♥') + d, good: d > 0 });
      }
    }
    if (eff.flags) for (const k in eff.flags) s.flags[k] = eff.flags[k];
    return out;
  };

  G.addLog = function (s, text) {
    s.log.unshift('第' + s.day + '天 ' + G.fmtClock(s.clock) + '｜' + text);
    if (s.log.length > 120) s.log.length = 120;
  };

  /* ---------------- audio (8-bit, WebAudio) ---------------- */
  let ac = null;
  G.muted = false;
  try { G.muted = localStorage.getItem('dl_muted') === '1'; } catch (e) {}
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'square', vol = 0.08, when = 0, slide = 0) {
    if (G.muted) return;
    const a = ctx(); if (!a) return;
    const t = a.currentTime + when;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.15) {
    if (G.muted) return;
    const a = ctx(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.createBufferSource(), g = a.createGain();
    g.gain.value = vol; src.buffer = buf; src.connect(g); g.connect(a.destination); src.start();
  }
  G.sfx = {
    click: () => tone(660, 0.05, 'square', 0.05),
    order: () => { tone(988, 0.08); tone(1319, 0.14, 'square', 0.08, 0.09); },
    coin: () => { tone(1047, 0.06); tone(1568, 0.16, 'square', 0.08, 0.06); },
    bad: () => { tone(330, 0.15, 'sawtooth', 0.07); tone(220, 0.25, 'sawtooth', 0.07, 0.14); },
    crash: () => { noise(0.6, 0.25); tone(120, 0.5, 'sawtooth', 0.1, 0, -80); },
    engine: () => { tone(70, 0.6, 'sawtooth', 0.05, 0, 40); },
    love: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, i * 0.1)); },
    hero: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.07, i * 0.09)); },
    siren: () => { for (let i = 0; i < 4; i++) { tone(700, 0.2, 'triangle', 0.06, i * 0.4, 300); tone(1000, 0.2, 'triangle', 0.06, i * 0.4 + 0.2, -300); } },
    night: () => { tone(392, 0.3, 'triangle', 0.06); tone(330, 0.5, 'triangle', 0.06, 0.25); },
  };
  G.toggleMute = function () {
    G.muted = !G.muted;
    try { localStorage.setItem('dl_muted', G.muted ? '1' : '0'); } catch (e) {}
  };

  /* ---------------- save ---------------- */
  const KEY = 'dl_save_';
  G.save = {
    write(slot, s) {
      try {
        const meta = { name: s.name, day: s.day, money: s.money, at: new Date().toLocaleString('zh-TW') };
        localStorage.setItem(KEY + slot, JSON.stringify({ meta, s }));
        return true;
      } catch (e) { return false; }
    },
    read(slot) {
      try {
        const raw = localStorage.getItem(KEY + slot);
        const d = raw ? JSON.parse(raw) : null;
        if (!d || typeof d !== 'object' || !d.s || typeof d.s !== 'object') return null;
        // names end up in innerHTML: re-sanitize anything loaded from storage
        ['name', 'kidName'].forEach((k) => { if (k in d.s) d.s[k] = G.cleanName(d.s[k], '無名氏'); });
        if (d.meta) d.meta.name = G.cleanName(d.meta.name, '無名氏');
        return d;
      } catch (e) { return null; }
    },
    remove(slot) { try { localStorage.removeItem(KEY + slot); } catch (e) {} },
  };
  /** player-entered names are shown via innerHTML: strip markup characters and cap length */
  G.cleanName = function (v, fallback) {
    const t = String(v == null ? '' : v).replace(/[<>&"'`\\\u0000-\u001f\u007f]/g, '').trim().slice(0, 12);
    return t || fallback || '';
  };
  G.album = {
    get() { try { return JSON.parse(localStorage.getItem('dl_album') || '{}'); } catch (e) { return {}; } },
    unlock(id) {
      const a = G.album.get();
      if (a[id]) return false;
      a[id] = new Date().toLocaleDateString('zh-TW');
      try { localStorage.setItem('dl_album', JSON.stringify(a)); } catch (e) {}
      return true;
    },
  };

  /* ---------------- UI primitives ---------------- */
  G.ui = {};
  G.ui.screen = function (id) {
    $$('.screen').forEach((el) => el.classList.toggle('active', el.id === 'screen-' + id));
  };

  G.ui.toast = function (text) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = text;
    $('#toast-wrap').appendChild(el);
    setTimeout(() => el.remove(), 2700);
  };

  function renderEffects(list) {
    const box = $('#dlg-effects');
    box.innerHTML = '';
    (list || []).forEach((e) => {
      const sp = document.createElement('span');
      sp.className = e.good ? 'up' : 'down';
      sp.textContent = e.label + ' ' + e.text;
      box.appendChild(sp);
    });
  }

  /**
   * Show the dialog. opts: {name, portrait, text, effects, choices:[{text, cls, disabled}]}
   * Resolves with the chosen index (or 0 for plain "繼續").
   */
  G.ui.dialog = function (opts) {
    return new Promise((resolve) => {
      const d = $('#dialog');
      d.classList.remove('hidden');
      const p = $('#dlg-portrait');
      if (opts.portrait) { p.src = opts.portrait; p.classList.remove('none'); } else { p.classList.add('none'); }
      $('#dlg-name').textContent = opts.name || '';
      $('#dlg-text').textContent = opts.text || '';
      renderEffects(opts.effects);
      const cbox = $('#dlg-choices');
      cbox.innerHTML = '';
      const choices = opts.choices && opts.choices.length ? opts.choices : [{ text: '繼續 ▶' }];
      choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'btn' + (c.cls ? ' ' + c.cls : '');
        b.textContent = c.text;
        if (c.disabled) b.disabled = true;
        b.onclick = () => {
          G.sfx.click();
          d.classList.add('hidden');
          resolve(i);
        };
        cbox.appendChild(b);
      });
    });
  };
  G.ui.say = (name, portrait, text, effects) => G.ui.dialog({ name, portrait, text, effects });

  /** Generic modal. actions: [{text, cls, value}] → resolves value */
  G.ui.modal = function (title, html, actions) {
    return new Promise((resolve) => {
      $('#modal').classList.remove('hidden');
      $('#modal-title').textContent = title;
      $('#modal-body').innerHTML = html;
      const box = $('#modal-actions');
      box.innerHTML = '';
      (actions || [{ text: '關閉', value: null }]).forEach((a) => {
        const b = document.createElement('button');
        b.className = 'btn' + (a.cls ? ' ' + a.cls : '');
        b.textContent = a.text;
        b.onclick = () => { G.sfx.click(); G.ui.closeModal(); resolve(a.value); };
        box.appendChild(b);
      });
      G.ui._modalResolve = resolve;
    });
  };
  G.ui.closeModal = () => $('#modal').classList.add('hidden');

  /** Phone panel: html string + map of button handlers by data-act */
  G.ui.panel = function (html, handlers) {
    const p = $('#panel');
    p.innerHTML = html;
    p.scrollTop = 0;
    p.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => {
        G.sfx.click();
        const h = handlers && handlers[b.dataset.act];
        if (h) h(b.dataset.arg);
      };
    });
  };

  /* scene */
  /** cover: 2D background image shown over the 3D world (home / hospital), or null for the 3D street */
  G.ui.scene = function ({ cover, tint, caption }) {
    const c = $('#scene-cover');
    if (cover) {
      c.style.backgroundImage = 'url(' + cover + ')';
      c.style.setProperty('--cover-tint', tint || 'transparent');
      c.classList.remove('hidden');
    } else c.classList.add('hidden');
    if (caption !== undefined) {
      const el = $('#scene-caption');
      el.textContent = caption;
      el.classList.toggle('hidden', !caption);
    }
  };
  G.ui.hud = function (obj, show) {
    $('#hud').classList.toggle('hidden', !show);
    if (obj !== undefined && obj !== null) $('#hud-obj').textContent = obj;
  };
  G.ui.fx = function (name) {
    const sc = $('#scene');
    sc.classList.remove(name);
    void sc.offsetWidth;
    sc.classList.add(name);
    setTimeout(() => sc.classList.remove(name), 700);
  };
})(window.G);
