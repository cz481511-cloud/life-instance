/* 外送人生 — game flow (3D): title, create, chapter days, orders driven in 3D, chat, settlement, endings */
(function (G) {
  const $ = G.$, $$ = G.$$;
  const W = G.World;
  let s = null;
  let busy = false;
  const Game = (G.Game = {});
  G.getState = () => s;
  const CLOCK_RATE = 1; // game minutes per real second while riding

  /* runtime (not saved) */
  let cur = null;        // current order runtime
  let lastLightSlot = -1;

  /* =====================================================
   * HUD
   * ===================================================== */
  function barColor(v) { return v > 60 ? 'var(--green)' : v > 30 ? 'var(--gold)' : 'var(--red)'; }
  function setBar(id, v) { const el = $('#' + id); el.style.width = G.clamp(v, 0, 100) + '%'; el.style.background = barColor(v); }
  Game.refresh = function () {
    if (!s || (G.Parent && G.Parent.active()) || !$('#st-money')) return;
    const w = G.WEATHER[s.weather];
    $('#st-day').textContent = '第 ' + s.day + ' 天';
    $('#st-clock').textContent = G.fmtClock(s.clock);
    $('#st-weather').textContent = w.icon + ' ' + w.name;
    $('#st-money').textContent = G.money(s.money);
    $('#st-money').style.color = s.money < 0 ? '#ff7a7a' : '#fff';
    $('#st-rating').textContent = '★ ' + s.rating.toFixed(2);
    $('#st-fame').textContent = s.fame;
    const left = 7 - (((s.day - 1) % 7) + 1);
    $('#st-rent').textContent = s.rentOwed ? '欠租!' : left === 0 ? '今晚' : left + ' 天後';
    setBar('bar-stamina', s.stamina); setBar('bar-mood', s.mood); setBar('bar-bike', s.bike);
    $('#btn-mute').textContent = G.muted ? '靜音' : '音效';
    G.Chat.render();
  };

  function cover(where, caption) {
    if (where === 'home') G.ui.scene({ cover: G.BG.home, tint: G.isNight(s.clock) ? 'rgba(10,10,40,.35)' : 'transparent', caption });
    else if (where === 'hospital') G.ui.scene({ cover: G.BG.home, tint: 'rgba(200,230,255,.5)', caption });
    else G.ui.scene({ cover: null, caption });
  }
  function light() { W.setTime(s.clock, s.weather); lastLightSlot = Math.floor(s.clock / 30); }

  /** pause world while an async story runs */
  async function story(fn) {
    W.pause(true);
    const r = await fn();
    Game.refresh();
    return r || {};
  }

  /* =====================================================
   * Title / create
   * ===================================================== */
  function initTitle() {
    W.pause(true);
    if (G.Stage) G.Stage.hide();
    G.ui.screen('title');
    $('#btn-continue').disabled = !G.save.read('auto');
  }
  Game.toTitle = initTitle;

  /* ---------- life instance (副本) select ---------- */
  function initInstances() {
    G.ui.screen('instance');
  }
  function initParentCreate() {
    G.ui.screen('pcreate');
    $$('#screen-pcreate .pick').forEach((p) => {
      p.onclick = () => { G.sfx.click(); const grp = p.dataset.group; $$(`#screen-pcreate .pick[data-group="${grp}"]`).forEach((x) => x.classList.toggle('sel', x === p)); };
    });
    $$('#screen-pcreate .origin').forEach((b) => {
      b.onclick = () => { G.sfx.click(); $$('#screen-pcreate .origin').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); };
    });
    // character previews rendered from the 3D models
    G.Assets.load().then(() => {
      const map = { 'pc-dad': 'character-male-d', 'pc-mom': 'character-female-b', 'pc-boy': 'character-male-e', 'pc-girl': 'character-female-e' };
      for (const id in map) { const img = $('#' + id); if (img) img.src = G.Assets.portrait(map[id]); }
    });
  }
  function startParent() {
    const sel = (grp) => ($(`#screen-pcreate .pick.sel[data-group="${grp}"]`) || {}).dataset || {};
    const gender = sel('me').v || 'm', kidGender = sel('kid').v || 'm';
    const job = ($('#screen-pcreate .origin.sel') || {}).dataset ? $('#screen-pcreate .origin.sel').dataset.job : 'delivery';
    s = null; cur = null;
    G.Parent.start({
      name: G.cleanName($('#pc-name').value, gender === 'm' ? '阿明' : '小美'),
      gender, kidGender, job,
      kidName: G.cleanName($('#pc-kid').value, kidGender === 'm' ? '小宇' : '小晴'),
    });
  }
  let pickGender = 'm', pickOrigin = 'student';
  function initCreate() {
    G.ui.screen('create');
    const list = $('#origin-list');
    list.innerHTML = '';
    G.ORIGINS.forEach((o) => {
      const b = document.createElement('button');
      b.className = 'origin' + (o.id === pickOrigin ? ' sel' : '');
      b.innerHTML = `<b>${o.name}</b>　起始存款 ${G.money(o.money)}<small>${o.desc}</small>`;
      b.onclick = () => { G.sfx.click(); pickOrigin = o.id; $$('#origin-list .origin').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); };
      list.appendChild(b);
    });
    $$('#screen-create .pick').forEach((p) => {
      p.classList.toggle('sel', p.dataset.gender === pickGender);
      p.onclick = () => { G.sfx.click(); pickGender = p.dataset.gender; $$('#screen-create .pick').forEach((x) => x.classList.toggle('sel', x === p)); };
    });
  }
  async function enterGame() {
    G.ui.screen('game');
    G.getState = () => s;
    if (G.Parent) G.Parent.restoreHud();
    if (G.Stage) G.Stage.hide();
    ['#world', '#minimap', '#hud-keys'].forEach((q) => $(q).classList.remove('hidden'));
    if (!W.ready) {
      G.ui.scene({ cover: null, caption: '載入 3D 素材中⋯' });
      await G.Assets.load();
      W.init($('#world'), $('#minimap'));
    }
    setTimeout(W.resize, 30);
    G.Chat.view = null; G.Chat.tab('work');
  }
  async function startNew() {
    const name = G.cleanName($('#in-name').value, pickGender === 'm' ? '阿明' : '小美');
    s = G.newState(name, pickGender, pickOrigin);
    s.ch = 1;
    s.instance = 'delivery';
    await enterGame();
    Game.refresh();
    intro();
  }

  async function intro() {
    busy = true;
    s.clock = 9 * 60;
    if (W.ready) { W.resetToHome(); light(); }
    cover('home', '台北・租屋處');
    const lines = {
      student: '學貸、房租、還有下週要交的期中報告。\n你在學校後門買了一台二手機車，下載了「熊喵外送」。',
      laidoff: '收到資遣通知的那天，你在公司樓下抽了三根菸。\n家裡還不知道。你每天還是穿著襯衫出門，然後在公園廁所換上外送外套。',
      musician: '樂團的練團室租金欠了兩個月。\n鼓手說：「去跑外送啦，時間自由，還可以寫歌。」你信了。',
    };
    await G.ui.say('', null, '台北，早上九點。\n\n' + lines[s.origin]);
    await G.ui.say(s.name, G.portrait(s), `「好，今天開始，我就是外送${G.call(s)}了。」\n\n房租每 7 天要繳 ${G.money(G.RENT)}。付不出來，就要搬回老家。`);
    await G.ui.say('熊喵外送', null, '【新手教學】\n・鍵盤 W/↑ 油門、S/↓ 煞車、A D/← → 轉向、空白鍵急煞。\n・跟著頭上的黃色箭頭和右上角小地圖，騎到黃色光柱就是目的地。\n・先到店家取餐，再送到客人那裡。送餐有時間限制。\n・撞牆會把餐撞灑，高速撞車會出車禍。\n・每一張單的客人都有故事。手機的 LINE 分頁也要常看。');
    busy = false;
    startDay();
  }

  /* =====================================================
   * Day loop
   * ===================================================== */
  function rollWeather() {
    const r = Math.random();
    if (s.day >= 5 && r < 0.04) return 'typhoon';
    if (r < 0.28) return 'rain';
    if (r < 0.5) return 'cloud';
    return 'sun';
  }
  const chapter = () => (s.ch <= 10 ? G.CHAPTERS[s.ch] : null);

  async function startDay() {
    busy = true;
    s.phase = 'morning';
    s.clock = 9 * 60;
    cur = null; s.curSpec = null; s.queue = []; s.rested = false;
    const ch = chapter();
    s.weather = (ch && ch.weather) || rollWeather();
    s.today = { orders: 0, earned: 0, tips: 0, km: 0, spent: 0, notes: [] };
    if (W.ready) { W.resetToHome(); W.setTarget(null); light(); }
    G.ui.hud(null, false);
    Game.refresh();
    G.save.write('auto', s);

    if (s.hospital > 0) { busy = false; return hospitalDay(); }
    cover('home', `第 ${s.day} 天・早上 ${G.WEATHER[s.weather].icon}`);
    if (ch) await G.ui.say('', null, `— ${ch.title} —`);

    let did = await G.STORY.mainMorning(s);
    if (ch && ch.morning) { await ch.morning(s); did = true; }
    if (await G.STORY.crashMorning(s)) did = true;
    if (!did && !ch && G.chance(0.3)) {
      const ev = pickEvent('morning', {});
      if (ev) await runEvent(ev, {});
    }
    Game.refresh();
    busy = false;
    morningPanel();
  }

  function buildQueue() {
    const ch = chapter();
    const specs = ch ? ch.orders : G.genEndlessDay(s);
    return specs.map((sp) => {
      if (sp.when && !sp.when(s)) return sp.alt ? Object.assign({}, sp.alt) : { time: sp.time, generic: true };
      const o = Object.assign({}, sp); delete o.when; delete o.alt; return o;
    });
  }

  function morningPanel() {
    s.phase = 'morning';
    cover('home', `第 ${s.day} 天・早上 ${G.WEATHER[s.weather].icon}`);
    const repair = Math.round((100 - s.bike) * 12);
    const ch = chapter();
    const n = buildQueue().length;
    G.ui.panel(`
      <h3>${ch ? ch.title : '第 ' + s.day + ' 天'}</h3>
      <p>天氣：${G.WEATHER[s.weather].icon} ${G.WEATHER[s.weather].name}${G.WEATHER[s.weather].bonus ? `（每單加成 +$${G.WEATHER[s.weather].bonus}）` : ''}<br>今天預計有 ${n} 張單。</p>
      ${G.Chat.hasPending(s) ? '<p>💬 LINE 有訊息在等你回覆。</p>' : ''}
      <button class="btn primary" data-act="go">🛵 上線接單</button>
      <button class="btn ghost" data-act="repair" ${s.bike >= 95 || s.money < repair ? 'disabled' : ''}>🔧 保養機車（${G.money(repair)}）</button>
      ${ch ? '' : '<button class="btn ghost" data-act="rest">😴 今天休息（體力、心情大回復）</button>'}
    `, {
      go: goOnline,
      repair: async () => {
        if (busy) return; busy = true;
        const eff = G.apply(s, { money: -repair, bike: 100 });
        G.sfx.coin(); Game.refresh();
        await G.ui.say('機車行師傅', null, '「機油換了、煞車皮換了、輪胎打氣了。你這台車再不保養，下次就是在路上解體。」', eff);
        busy = false; morningPanel();
      },
      rest: async () => {
        if (busy) return; busy = true;
        await G.ui.say(s.name, G.portrait(s), '你決定今天不跑了。睡到中午，泡了一碗加蛋的泡麵，看了三集韓劇。', G.apply(s, { stamina: 50, mood: 25 }));
        s.rested = true; busy = false; endDay();
      },
    });
  }

  function goOnline() {
    if (busy) return;
    s.phase = 'online';
    s.queue = buildQueue();
    s.rested = false;
    G.addLog(s, '上線接單');
    G.sfx.engine();
    cover('street', '');
    nextOrder();
  }

  /* =====================================================
   * Orders
   * ===================================================== */
  const destByName = (n) => G.DESTS.find((d) => d.name === n) || { name: n, type: 'walkup' };
  const shopByName = (n) => G.SHOPS.find((x) => x.name === n) || { name: n, icon: 'bento' };

  function buildOrder(sp) {
    const o = { spec: sp, time: sp.time, route: sp.route || null };
    if (sp.cust) {
      const R = G.REGULARS[sp.cust];
      o.shop = R.shop; o.dest = destByName(R.dest); o.note = R.note; o.custName = R.name; o.avatar = R.avatar; o.regular = true;
    } else if (sp.story === 'nurse') {
      o.shop = '師大鹽酥雞'; o.dest = destByName('仁愛紀念醫院 護理站'); o.note = G.STORY.nurseNote(s); o.custName = '林小姐（護理站）'; o.avatar = '🏥';
    } else if (sp.story === 'crash') {
      o.shop = '健身便當 Gym Box'; o.dest = destByName('信義區 辦公大樓 32 樓'); o.note = '備註：兩個便當，其中一個請外送員本人收下 :)'; o.custName = '陳先生'; o.avatar = '👓';
    } else if (sp.special) {
      o.shop = sp.shop; o.dest = destByName(sp.dest); o.custName = '客人'; o.avatar = '🙂';
    } else {
      const night = sp.time >= 21 * 60;
      const shops = G.SHOPS;
      o.shop = G.pick(shops).name;
      const dests = G.DESTS.filter((d) => d.type !== 'hospital' && (d.type !== 'grave' || night) && d.type !== 'oldman');
      o.dest = G.pick(dests);
      o.custName = G.pick(['王先生', '陳小姐', '李同學', '張太太', '黃先生', '吳小姐', '匿名客人']); o.avatar = G.pick(['🙂', '😐', '🤓', '😴', '🧑‍💻', '👵']);
      o.generic = true;
    }
    o.icon = shopByName(o.shop).icon;
    const d = W.ready ? W.distBetween(o.shop, o.dest.name) : 220;
    o.km = Math.round(d / 10) / 10;
    const peak = (sp.time >= 11 * 60 && sp.time < 13.5 * 60) || (sp.time >= 17 * 60 && sp.time < 20 * 60);
    let pay = 70 + o.km * 30 + (peak ? 25 : 0) + G.WEATHER[s.weather].bonus - (s.flags.pay_cut ? 10 : 0);
    if (o.dest.type === 'grave') pay += 60;
    o.pay = Math.round(pay);
    o.limit = Math.round(d / 11 + 18);
    return o;
  }

  function nextOrder() {
    cur = null;
    W.setTarget(null);
    G.ui.hud(null, false);
    if (!s.queue.length) return shiftDone();
    const sp = s.queue.shift();
    s.curSpec = sp;
    const o = buildOrder(sp);
    if (s.clock < o.time) s.clock = o.time;
    light();
    Game.refresh();
    W.pause(true);
    G.sfx.order();
    const tags = [];
    if (o.regular) tags.push('<span class="story">★ 熟客</span>');
    if (sp.story) tags.push('<span class="story">♥ 特別的客人</span>');
    if (G.WEATHER[s.weather].bonus) tags.push(`<span class="hot">${G.WEATHER[s.weather].name}加成</span>`);
    if (s.flags.pay_cut) tags.push('<span class="risk">運費調降 -$10</span>');
    if (o.dest.type === 'grave') tags.push('<span class="risk">偏遠・沒路燈</span>');
    G.Chat.tab('work');
    G.ui.panel(`
      <h3>📲 新訂單・${G.fmtClock(s.clock)}</h3>
      <div class="order">
        <div class="o-head"><img src="${G.ICON(o.icon)}" alt=""><span>${o.shop}</span><span class="o-pay">$${o.pay}</span></div>
        <div class="cust"><div class="avatar">${o.avatar}</div><span>${o.custName}</span></div>
        <div class="o-info">📍 ${o.dest.name}<br>🛵 ${o.km} km ・ ⏱ 取餐後 ${o.limit} 分鐘內送達${o.note ? '<br>📝 ' + o.note : ''}</div>
        <div class="o-tags">${tags.join('')}</div>
        <button class="btn primary" data-act="take">接單，出發取餐</button>
        ${o.generic ? '<button class="btn ghost" data-act="skip">拒單（評分 -0.05）</button>' : ''}
      </div>
      <p>剩下 ${s.queue.length} 張單。</p>
    `, {
      take: () => { if (!busy) accept(o); },
      skip: () => { if (busy) return; G.apply(s, { rating: -0.05 }); G.ui.toast('已拒單，評分 -0.05'); nextOrder(); },
    });
  }

  function accept(o) {
    cur = o;
    o.phase = 'toShop';
    o.ctx = { order: o, route: { id: G.pick(['main', 'alley']) }, slot: G.slotAt(s.clock) };
    o.spill = false; o.hadEvent = false; o.res = { delay: 0, tip: 0, noRating: false, unlock: [] };
    G.addLog(s, `接單：${o.shop} → ${o.dest.name}`);
    W.setTarget(o.shop);
    G.ui.hud('🍱 取餐：' + o.shop, true);
    G.ui.panel(`<h3>🛵 前往取餐</h3><p>${o.shop}</p><p>跟著黃色箭頭騎過去。</p><p class="tiny">${o.note || ''}</p>`, {});
    W.pause(false);
  }

  function merge(o, r) {
    if (!r) return;
    o.res.delay += r.delay || 0;
    o.res.tip += r.tip || 0;
    o.spill = o.spill || !!r.spill;
    if (r.noRating) o.res.noRating = true;
    if (r.lost) o.res.lost = true;
    if (r.hospital) o.res.hospital = Math.max(o.res.hospital || 0, r.hospital);
    if (r.unlockEnding) o.res.unlock.push(r.unlockEnding);
    if (r.end) o.res.end = r.end;
  }

  /* ---------- world callbacks ---------- */
  W.onTick = function (dt) {
    if (!s || s.phase !== 'online' && s.phase !== 'home') return;
    s.clock += dt * CLOCK_RATE;
    if (Math.floor(s.clock / 30) !== lastLightSlot) light();
    $('#st-clock').textContent = G.fmtClock(s.clock);
    const d = W.distToTarget();
    $('#hud-dist').textContent = Math.round(d * 10) + ' m';
    $('#hud-speed').textContent = Math.round(Math.abs(W.speed()) * 2.2) + ' km/h';
    const t = $('#hud-timer');
    if (cur && cur.phase === 'toDest') {
      const left = cur.deadline - s.clock;
      t.textContent = left >= 0 ? '剩 ' + Math.ceil(left) + ' 分' : '超時 ' + Math.ceil(-left) + ' 分';
      t.classList.toggle('late', left < 0);
      t.classList.remove('hidden');
      // mid-route story trigger
      if (!cur.routeFired) {
        const traveled = 1 - d / cur.legDist;
        if (Math.abs(W.speed()) > 6) cur.driveTime = (cur.driveTime || 0) + dt;
        if (cur.route === 'door' && Math.abs(W.speed()) > 6 && ((traveled > 0.1 && cur.driveTime > 1.5) || cur.driveTime > 5)) fireRoute();
        else if (cur.route !== 'door' && traveled > 0.45) fireRoute();
      }
    } else {
      t.textContent = s.phase === 'home' ? '回家中' : '取餐中';
      t.classList.remove('late');
    }
  };

  W.onArrive = function () {
    if (G.Parent && G.Parent.active()) { if (G.Parent.onArrive) G.Parent.onArrive(); return; }
    if (!s) return;
    if (busy) { setTimeout(() => W.onArrive(), 400); return; } // a story is running; retry when it ends
    if (s.phase === 'home') return arriveHome();
    if (!cur) return;
    if (cur.phase === 'toShop') pickup();
    else if (cur.phase === 'toDest') arrive();
  };

  W.onBump = function (kind, impact) {
    if (!cur) return;
    if (kind === 'wall' && impact > 11) {
      G.sfx.bad(); G.ui.fx('shake');
      G.apply(s, { bike: -2 });
      if (cur.phase === 'toDest' && !cur.spill) { cur.spill = true; G.ui.toast('砰！撞到牆，餐灑出來了⋯⋯'); }
      else G.ui.toast('砰！小心騎！');
      Game.refresh();
    } else if (kind === 'car') {
      G.sfx.bad(); G.ui.toast('叭叭——！差點撞到車');
    }
  };

  W.onCrash = async function (kind, impact) {
    if (busy || !cur) return;
    busy = true;
    const o = cur;
    const r = await story(() => G.STORY.crash(s));
    merge(o, r);
    busy = false;
    if (o.res.end) return ending(o.res.end);
    if (o.res.lost) return orderLost(o);
    W.pause(false);
  };

  async function fireRoute() {
    const o = cur;
    o.routeFired = true;
    if (busy) return;
    busy = true;
    let r = null;
    if (o.route === 'door') {
      const outcome = await W.doorHazard();
      r = await story(() => G.STORY.siyuanDoor(s, outcome));
    } else if (o.route === 'thief') {
      r = await story(() => G.STORY.heroThief(s, o.ctx));
    } else if (o.route === 'knife') {
      r = await story(() => G.STORY.heroKnife(s, o.ctx));
    } else if (o.generic && G.chance(0.35)) {
      const ev = pickEvent('route', o.ctx);
      if (ev) { o.hadEvent = true; r = await story(() => runEvent(ev, o.ctx)); if (r.crash === 'minor') { G.sfx.crash(); G.ui.fx('shake'); } }
    }
    if (r) merge(o, r);
    busy = false;
    if (o.res.end) return ending(o.res.end);
    if (o.res.lost) return orderLost(o);
    if (o.res.unlock.length) { const u = o.res.unlock.splice(0); await unlockEndings(u); }
    if (cur === o) W.pause(false);
  }

  async function pickup() {
    busy = true;
    const o = cur;
    W.pause(true);
    G.sfx.coin();
    if (o.spec.pickup && o.spec.special) { merge(o, await G.SPECIAL[o.spec.special](s)); o.hadEvent = true; }
    else if (o.generic && G.chance(0.3)) {
      const ev = pickEvent('pickup', o.ctx);
      if (ev) { o.hadEvent = true; merge(o, await runEvent(ev, o.ctx)); }
    } else G.ui.toast('取餐完成！' + o.shop);
    Game.refresh();
    busy = false;
    if (o.res.lost) return orderLost(o);
    o.phase = 'toDest';
    o.deadline = s.clock + o.limit + o.res.delay;
    o.res.delay = 0;
    o.legDist = Math.max(30, Math.hypot(W.locs[o.dest.name].x - W.locs[o.shop].x, W.locs[o.dest.name].z - W.locs[o.shop].z));
    W.setTarget(o.dest.name);
    G.ui.hud('📦 送達：' + o.dest.name, true);
    G.ui.panel(`<h3>📦 配送中</h3><p>${o.shop}<br>→ ${o.dest.name}</p><p>客人：${o.avatar} ${o.custName}</p><p class="tiny">${o.note || ''}</p>`, {});
    W.pause(false);
  }

  async function arrive() {
    busy = true;
    const o = cur;
    W.pause(true);
    const sp = o.spec;
    let r = null;
    if (sp.cust) {
      const reg = (s.reg[sp.cust] = s.reg[sp.cust] || { visits: 0, rel: 0 });
      const R = G.REGULARS[sp.cust];
      const fn = R.visits[reg.visits] || R.repeat;
      r = await fn(s);
      reg.visits++;
    } else if (sp.story === 'nurse') r = await G.STORY.nurseArrive(s, o.ctx);
    else if (sp.story === 'crash') r = await G.STORY.crashArrive(s, o.ctx);
    else if (sp.special && !sp.pickup) r = await G.SPECIAL[sp.special](s);
    else if (!o.hadEvent || G.chance(0.4)) {
      const ev = pickEvent('arrive', o.ctx);
      if (ev) r = await runEvent(ev, o.ctx);
    }
    merge(o, r);
    busy = false;
    if (o.res.end) return ending(o.res.end);
    if (o.res.lost) return orderLost(o);
    finishOrder(o);
  }

  async function finishOrder(o) {
    busy = true;
    const arriveClock = s.clock;
    s.clock += o.res.delay;
    const late = arriveClock > o.deadline;
    const lateBy = Math.round(arriveClock - o.deadline);
    let stars = 5;
    if (o.spill) stars = G.pick([2, 3]);
    else if (late) stars = lateBy > o.limit * 0.4 ? 2 : 3;
    else if (G.chance(0.12)) stars = 4;
    let tip = o.res.tip;
    if (!late && !o.spill && G.chance(0.2 + s.fame / 200 + (s.weather === 'rain' || s.weather === 'typhoon' ? 0.15 : 0))) tip += G.randi(2, 6) * 10;
    const eff = { money: o.pay + tip, stamina: -(s.weather === 'typhoon' ? 15 : s.weather === 'rain' ? 12 : 9), bike: -Math.round(o.km * 1.2), mood: stars >= 5 ? 2 : stars <= 2 ? -5 : -1 };
    if (!o.res.noRating) eff.rating = (stars - s.rating) * 0.07;
    const shown = G.apply(s, eff);
    s.today.orders++; s.today.earned += o.pay + tip; s.today.tips += tip; s.today.km += o.km;
    s.stats.orders++; s.stats.earned += o.pay + tip; s.stats.km += o.km;
    if (late) s.stats.late++;
    G.addLog(s, `完成：${o.shop} → ${o.custName}（$${o.pay}${tip ? ' + 小費 $' + tip : ''}${o.res.noRating ? '' : '，' + '★'.repeat(stars)}）`);
    G.sfx.coin();
    Game.refresh();
    const head = late ? `⏰ 超時 ${lateBy} 分鐘送達。` : '✅ 準時送達！';
    const starTxt = o.res.noRating ? '' : `\n客人評價：${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}${o.spill ? '（餐灑了）' : ''}`;
    await G.ui.dialog({ name: '熊喵外送', text: `${head}\n收入 $${o.pay}${tip ? `，小費 $${tip} 🎉` : ''}${starTxt}`, effects: shown });
    busy = false;
    await unlockEndings(o.res.unlock);
    if (s.rating < G.RATING_BAN && s.stats.orders >= 6) return ending('banned');
    nextOrder();
  }

  async function orderLost(o) {
    G.addLog(s, '訂單未完成');
    W.setTarget(null);
    G.ui.hud(null, false);
    cur = null;
    await unlockEndings(o.res.unlock);
    if (o.res.hospital) {
      s.hospital = o.res.hospital;
      s.queue = [];
      return endDay();
    }
    nextOrder();
  }

  function shiftDone() {
    s.phase = 'online';
    W.pause(true);
    G.ui.panel(`
      <h3>🌙 今天的單跑完了</h3>
      <p>今天完成 ${s.today.orders} 單，收入 ${G.money(s.today.earned)}。</p>
      <button class="btn primary" data-act="ride">🛵 騎車回家</button>
      <button class="btn ghost" data-act="tele">⏩ 直接回家（跳過）</button>
    `, {
      ride: () => {
        s.phase = 'home'; W.setTarget('home'); G.ui.hud('🏠 回家', true);
        G.ui.panel('<h3>🏠 回家中</h3><p>跟著箭頭騎回家。</p><button class="btn ghost" data-act="tele">⏩ 直接回家（跳過）</button>', { tele: () => endDay() });
        W.pause(false);
      },
      tele: () => endDay(),
    });
  }
  function arriveHome() { W.pause(true); G.ui.hud(null, false); W.setTarget(null); endDay(); }

  /* =====================================================
   * Events
   * ===================================================== */
  function weightOf(e, ctx) {
    if (e.once && s.seen[e.id]) return 0;
    if (e.cond && !e.cond(s, ctx)) return 0;
    try { return typeof e.weight === 'function' ? e.weight(s, ctx) : e.weight; } catch (err) { return 0; }
  }
  function pickEvent(phase, ctx) {
    return G.weighted(G.EVENTS.filter((e) => e.phase === phase), (e) => weightOf(e, ctx));
  }
  async function runEvent(e, ctx) {
    s.seen[e.id] = true;
    const text = typeof e.text === 'function' ? e.text(s, ctx) : e.text;
    const who = e.who || { name: '', portrait: null };
    const choices = e.choices.filter((c) => !c.cond || c.cond(s, ctx));
    const i = await G.ui.dialog({ name: who.name, portrait: who.portrait, text, choices: choices.map((c) => ({ text: c.text, cls: c.cls })) });
    const r = choices[i].go(s, ctx) || {};
    const shown = G.apply(s, r.eff);
    if (r.flags) G.apply(s, { flags: r.flags });
    if (shown.some((x) => !x.good)) G.sfx.bad();
    Game.refresh();
    await G.ui.dialog({ name: who.name, portrait: who.portrait, text: r.text, effects: shown });
    return r;
  }
  Game.runEventById = (id) => runEvent(G.EVENTS.find((e) => e.id === id), {});

  /* =====================================================
   * Hospital
   * ===================================================== */
  async function hospitalDay() {
    busy = true;
    s.phase = 'hospital';
    W.pause(true);
    cover('hospital', '仁愛紀念醫院・病房');
    await G.ui.say('', null, `你躺在病床上，看著天花板的水漬。今天不能跑單。\n住院費、部分負擔：$800。（還要住 ${s.hospital} 天）`, G.apply(s, { money: -800, stamina: 35, mood: -3 }));
    await G.STORY.nurseHospital(s);
    if (s.hospital === 1) await G.STORY.crashHospital(s);
    if (!s.flags.nurse_hosp && !s.flags.crash_visit) {
      G.Chat.burst(s, 'group', [['老王', '新人還好嗎？'], ['阿凱', '躺好躺好 單我們幫你跑（並沒有）'], ['小林', '早日康復🙏']]);
    }
    s.hospital--;
    Game.refresh();
    busy = false;
    endDay(true);
  }

  /* =====================================================
   * End of day
   * ===================================================== */
  async function endDay(fromHospital) {
    if (busy) return;
    busy = true;
    W.pause(true);
    W.setTarget(null);
    G.ui.hud(null, false);
    cur = null;
    const worked = !fromHospital && !s.rested;
    if (s.clock < 20 * 60) s.clock = 20 * 60;
    s.phase = 'evening';
    cover(fromHospital ? 'hospital' : 'home', `第 ${s.day} 天・晚上`);
    G.sfx.night();

    // chapter night beat
    const ch = chapter();
    if (worked && ch && ch.night) await ch.night(s);
    if (worked && s.ch <= 10) s.ch++;
    else if (worked) s.ch++;

    const o = G.ORIGINS.find((x) => x.id === s.origin);
    const rows = [];
    let net = s.today.earned;
    rows.push(['今日收入（' + s.today.orders + ' 單）', s.today.earned]);
    if (s.today.tips) rows.push(['　其中小費', s.today.tips]);
    if (!fromHospital) { G.apply(s, { money: -G.DAILY_FOOD }); rows.push(['餐費', -G.DAILY_FOOD]); net -= G.DAILY_FOOD; }
    if (o.dailyCost) { G.apply(s, { money: -o.dailyCost }); rows.push(['匯回家用', -o.dailyCost]); net -= o.dailyCost; }
    const fuel = Math.round(s.today.km * 6);
    if (fuel) { G.apply(s, { money: -fuel }); rows.push(['油錢', -fuel]); net -= fuel; }

    let rentMsg = '';
    if (s.day % 7 === 0 && !s.rentOwed) {
      if (s.money >= G.RENT) { G.apply(s, { money: -G.RENT }); rows.push(['房租', -G.RENT]); net -= G.RENT; rentMsg = '房租繳清了。又活過一週。'; }
      else { s.rentOwed = G.RENT; s.rentDeadline = s.day + 3; rentMsg = `房租付不出來⋯⋯房東太太說：「最多再等你三天喔。」（第 ${s.rentDeadline} 天前要繳）`; G.Chat.msg(s, 'landlord', '房租最多再等你三天喔～\n樓上說你的機車很吵，但我幫你擋掉了。'); }
    } else if (s.rentOwed) {
      if (s.money >= s.rentOwed) { G.apply(s, { money: -s.rentOwed }); rows.push(['補繳房租', -s.rentOwed]); net -= s.rentOwed; s.rentOwed = 0; rentMsg = '你把欠的房租補上了。'; }
      else if (s.day >= s.rentDeadline) { busy = false; return ending('bankrupt'); }
      else rentMsg = `還欠房租 ${G.money(s.rentOwed)}，第 ${s.rentDeadline} 天前要繳。`;
    }
    const moodDelta = s.today.earned > 800 ? 5 : s.today.earned > 300 ? 1 : fromHospital ? 0 : -3;
    G.apply(s, { stamina: fromHospital ? 10 : 60, mood: moodDelta });
    s.phase = 'night';
    Game.refresh();
    G.save.write('auto', s);

    G.ui.panel(`<h3>🌙 今日結算</h3>
      <div class="sum">${rows.map((r) => `<div><span>${r[0]}</span><span>${r[1] >= 0 ? '+' : ''}${G.money(r[1])}</span></div>`).join('')}
      <div class="total"><span>今日淨收入</span><span>${G.money(net)}</span></div>
      <div><span>目前存款</span><span>${G.money(s.money)}</span></div></div>
      ${rentMsg ? `<p>🏠 ${rentMsg}</p>` : ''}
      ${G.Chat.hasPending(s) ? '<p>💬 LINE 有訊息在等你回覆，睡前看一下吧。</p>' : ''}
      <button class="btn primary" data-act="sleep">😴 睡覺，迎接第 ${s.day + 1} 天</button>`, { sleep: sleepNext });
    busy = false;
  }

  async function sleepNext() {
    if (busy) return;
    busy = true;
    if (s.day >= 7) await unlockEndings(['week']);
    if (s.money >= 100000) await unlockEndings(['rich']);
    if (s.rating < G.RATING_BAN && s.stats.orders >= 6) { busy = false; return ending('banned'); }
    s.day++;
    busy = false;
    startDay();
  }

  /* =====================================================
   * Endings
   * ===================================================== */
  async function unlockEndings(ids) {
    for (const id of ids || []) {
      if (s.flags['end_' + id]) continue;
      s.flags['end_' + id] = true;
      G.album.unlock(id);
      const e = G.ENDINGS[id];
      if (e.kind === 'love') G.sfx.love(); else G.sfx.hero();
      await G.ui.modal('🏆 達成結局：' + e.title,
        `<div class="ending-title">${e.title}</div><p style="white-space:pre-line">${e.text}</p><p class="tiny">已記錄到「人生圖鑑」。無盡模式：你可以繼續跑單。</p>`,
        [{ text: '繼續跑單', cls: 'primary', value: 'go' }]);
    }
  }
  async function ending(id) {
    busy = true;
    W.pause(true); W.setTarget(null); G.ui.hud(null, false);
    G.album.unlock(id);
    const e = G.ENDINGS[id];
    G.sfx.bad();
    G.save.remove('auto');
    const stats = `<div class="sum"><div><span>存活天數</span><span>${s.day} 天</span></div><div><span>總送單</span><span>${s.stats.orders} 單</span></div><div><span>總里程</span><span>${s.stats.km.toFixed(1)} km</span></div><div><span>總收入</span><span>${G.money(s.stats.earned)}</span></div><div><span>名氣</span><span>${s.fame}</span></div></div>`;
    const v = await G.ui.modal('GAME OVER', `<div class="ending-title">${e.title}</div><p style="white-space:pre-line">${e.text}</p>${stats}`,
      [{ text: '讀取存檔', value: 'load' }, { text: '回到標題', cls: 'primary', value: 'title' }]);
    busy = false;
    if (v === 'load') return openLoad();
    initTitle();
  }

  /* =====================================================
   * Menus
   * ===================================================== */
  function slotHtml(mode) {
    return [1, 2, 3].map((i) => {
      const d = G.save.read(i);
      const info = d ? `<b>存檔 ${i}</b>　${d.meta.name}・第 ${d.meta.day} 天・${G.money(d.meta.money)}<br><small>${d.meta.at}</small>` : `<b>存檔 ${i}</b>　（空）`;
      return `<div class="slot"><div>${info}</div><button class="btn primary" data-slot="${i}" ${mode === 'load' && !d ? 'disabled' : ''}>${mode === 'save' ? '存到這裡' : '讀取'}</button></div>`;
    }).join('');
  }
  function bindSlots(fn) { $$('#modal-body [data-slot]').forEach((b) => (b.onclick = () => { G.sfx.click(); fn(+b.dataset.slot); })); }
  function openSave() {
    const st = G.getState && G.getState();
    if (!st || busy) return;
    if (cur) { G.ui.toast('送單中不能存檔，先把這單送完吧'); return; }
    G.ui.modal('存檔', slotHtml('save'), [{ text: '關閉' }]);
    bindSlots((i) => { G.save.write(i, st); G.ui.closeModal(); G.ui.toast('已存到存檔 ' + i); });
  }
  function openLoad() {
    G.ui.modal('讀取存檔', slotHtml('load'), [{ text: '關閉' }]).then(() => { if (!s || !$('#screen-game').classList.contains('active')) initTitle(); });
    bindSlots((i) => { const d = G.save.read(i); if (d) { G.ui.closeModal(); loadState(d.s); } });
  }
  async function loadState(st) {
    s = st;
    s.ch = s.ch || 1; s.chat = s.chat || {}; s.reg = s.reg || {}; s.queue = s.queue || [];
    busy = false; cur = null;
    if (s.instance === 'parent') { const ps = s; s = null; G.Parent.load(ps); return; }
    await enterGame();
    $('#dialog').classList.add('hidden');
    if (W.ready) { W.resetToHome(); W.setTarget(null); light(); }
    Game.refresh();
    if (s.phase === 'online') { if (s.curSpec) s.queue.unshift(s.curSpec); cover('street', ''); nextOrder(); }
    else if (s.phase === 'morning') morningPanel();
    else if (s.phase === 'night' || s.phase === 'evening') sleepNext();
    else startDay();
  }
  function openAlbum() {
    const a = G.album.get();
    const keys = Object.keys(G.ENDINGS);
    const html = `<p>已解鎖 ${keys.filter((k) => a[k]).length} / ${keys.length}</p>` + keys.map((k) => {
      const e = G.ENDINGS[k];
      return a[k] ? `<div class="album-item"><b>${e.kind === 'love' ? '♥ ' : e.kind === 'bad' ? '✝ ' : '★ '}${e.title}</b><small>${a[k]} 解鎖</small></div>`
        : '<div class="album-item locked"><b>？？？</b><small>尚未解鎖</small></div>';
    }).join('') + `<p class="tiny">隱藏劇情：${a.hero_seen ? '你已經遇過「那種事」了。' : '據說深夜騎車時，偶爾會遇到需要英雄的時刻⋯⋯'}</p>`;
    G.ui.modal('人生圖鑑', html, [{ text: '關閉' }]);
  }
  function openLog() {
    if (!s) return;
    G.ui.modal('配送紀錄', s.log.length ? s.log.slice(0, 60).map((l) => `<div class="log-line">${l}</div>`).join('') : '還沒有紀錄。', [{ text: '關閉' }]);
  }
  async function openMenu() {
    if (G.Parent && G.Parent.active()) {
      const v = await G.ui.modal('選單', '<p>爸媽篇進行中。回到標題會自動存檔（從本章的「這段日子」繼續）。</p>', [{ text: '人生圖鑑', value: 'album' }, { text: '回到標題', value: 'title' }, { text: '關閉', cls: 'primary', value: null }]);
      if (v === 'album') openAlbum();
      if (v === 'title') { G.Parent.exit(); initTitle(); }
      return;
    }
    if (!s) return;
    const wasPaused = W.isPaused(); W.pause(true);
    const regs = Object.keys(G.REGULARS).filter((k) => s.reg[k]).map((k) => `${G.REGULARS[k].avatar} ${G.REGULARS[k].name}（${s.reg[k].visits} 次）`).join('、') || '還沒有';
    const v = await G.ui.modal('選單', `<p>${s.name}（${G.ORIGINS.find((o) => o.id === s.origin).name}）・${s.ch <= 10 ? '第 ' + s.ch + ' 章' : '無盡模式'}<br>總送單 ${s.stats.orders}・總里程 ${s.stats.km.toFixed(1)} km・超時 ${s.stats.late} 次</p>
      <p>熟客：${regs}</p>
      <p>♥ 怡萱 ${s.flags.nurse_stage ? s.aff.nurse : '？？'}　♥ 思遠 ${s.flags.crash_met ? s.aff.crash : '？？'}</p>`,
      [{ text: '人生圖鑑', value: 'album' }, { text: '回到標題', value: 'title' }, { text: '關閉', cls: 'primary', value: null }]);
    if (v === 'album') openAlbum();
    if (v === 'title') { if (!cur) G.save.write('auto', s); initTitle(); return; }
    if (!wasPaused && !busy) W.pause(false);
  }

  /* =====================================================
   * Wiring
   * ===================================================== */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-action]');
    if (!b) return;
    G.sfx.click();
    const a = b.dataset.action;
    if (a === 'new') initInstances();
    else if (a === 'inst-delivery') initCreate();
    else if (a === 'inst-parent') initParentCreate();
    else if (a === 'pstart') startParent();
    else if (a === 'back') initTitle();
    else if (a === 'back-inst') initInstances();
    else if (a === 'start') startNew();
    else if (a === 'continue') { const d = G.save.read('auto'); if (d) loadState(d.s); }
    else if (a === 'load') openLoad();
    else if (a === 'album') openAlbum();
    else if (a === 'save') openSave();
    else if (a === 'log') openLog();
    else if (a === 'mute') { G.toggleMute(); Game.refresh(); }
    else if (a === 'menu') openMenu();
  });
  $$('#touch [data-k]').forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); W.touch(k, true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => b.addEventListener(t, () => W.touch(k, false)));
  });

  G.debug = { get state() { return s; }, set: (k, v) => { s[k] = v; Game.refresh(); }, get cur() { return cur; } };
  initTitle();
})(window.G);
