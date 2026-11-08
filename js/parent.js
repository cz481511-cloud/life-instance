/* 外送人生 — 副本：爸媽篇 (raising a kid from 6 to 15; school incidents, parent fights, LINE parent-group drama) */
(function (G) {
  const $ = G.$, $$ = G.$$;
  const P = (G.Parent = {});
  const St = () => G.Stage;
  let s = null, busy = false;

  /* ---------- models ---------- */
  const M = {
    dad: 'character-male-d', mom: 'character-female-b',
    boy: 'character-male-e', girl: 'character-female-e',
    teacher: 'character-female-c', director: 'character-male-c',
    zhangDad: 'character-male-b', linMom: 'character-female-f', otherKid: 'character-male-f', azhe: 'character-male-a',
  };
  const meModel = () => (s.gender === 'm' ? M.dad : M.mom);
  const spouseModel = () => (s.gender === 'm' ? M.mom : M.dad);
  const kidModel = () => (s.kidGender === 'm' ? M.boy : M.girl);
  const kidH = () => [0, 1.15, 1.25, 1.35, 1.5, 1.62, 1.68][s.ch] || 1.4;
  const portrait = (model) => (G.Assets.ready ? G.Assets.portrait(model) : null);
  const ME = () => ({ name: s.name, portrait: portrait(meModel()) });
  const KID = () => ({ name: s.kidName, portrait: portrait(kidModel()) });
  const NPC = (name, model) => ({ name, portrait: portrait(model) });
  const callKid = () => (s.kidGender === 'm' ? '他' : '她');
  const meTitle = () => (s.gender === 'm' ? '爸爸' : '媽媽');
  const spouseTitle = () => (s.gender === 'm' ? '老婆' : '老公');

  G.STAT_LABELS = Object.assign(G.STAT_LABELS || {}, { bond: '親子', grades: '成績', conduct: '品行', stress: '壓力', rep: '家長圈名聲' });

  const JOBS = {
    delivery: { name: '外送員', desc: '時間彈性，可以接送小孩。收入看拚不拚。', pay: () => G.randi(5500, 9000) },
    office: { name: '上班族', desc: '收入穩定，但加班多，常常錯過孩子的事。', pay: () => 9000 },
    shop: { name: '開手搖飲店', desc: '自己當老闆，收入大起大落。', pay: () => G.randi(2000, 16000) },
  };
  const AGES = { 1: 6, 2: 8, 3: 10, 4: 12, 5: 14, 6: 15 };

  P.newState = function (cfg) {
    return {
      v: 1, instance: 'parent', name: cfg.name, gender: cfg.gender, kidName: cfg.kidName, kidGender: cfg.kidGender, job: cfg.job,
      day: 1, ch: 1, round: 0, phase: 'chapter', clock: 9 * 60, weather: 'sun',
      money: 30000, stress: 30, bond: 50, grades: 50, conduct: 50, rep: 0,
      stamina: 80, mood: 60, rating: 5, bike: 80, fame: 0, aff: {},
      flags: {}, chat: {}, reg: {}, log: [], seen: {}, today: { orders: 0, earned: 0, tips: 0, km: 0, spent: 0 }, stats: { orders: 0, earned: 0, km: 0, late: 0 },
    };
  };

  /* ---------- HUD ---------- */
  let deliveryStatsHtml = null;
  function hudParent() {
    const box = $('.stats');
    if (deliveryStatsHtml === null) deliveryStatsHtml = box.innerHTML;
    box.innerHTML = `
      <div class="stat"><span class="emo">💰</span><span>存款</span><b id="pp-money"></b></div>
      <div class="stat"><span class="emo">❤️</span><span>親子</span><div class="bar"><i id="pp-bond"></i></div></div>
      <div class="stat"><span class="emo">📚</span><span>成績</span><div class="bar"><i id="pp-grades"></i></div></div>
      <div class="stat"><span class="emo">😇</span><span>品行</span><div class="bar"><i id="pp-conduct"></i></div></div>
      <div class="stat"><span class="emo">😵</span><span>壓力</span><div class="bar"><i id="pp-stress"></i></div></div>
      <div class="stat small"><span class="emo">👥</span><span>家長圈</span><b id="pp-rep"></b><span class="sep">孩子</span><b id="pp-age"></b></div>`;
    document.querySelector('.app-logo').innerHTML = '👨‍👩‍👧 爸媽人生 <small>家長版</small>';
  }
  P.restoreHud = function () {
    if (deliveryStatsHtml !== null) { $('.stats').innerHTML = deliveryStatsHtml; deliveryStatsHtml = null; }
    document.querySelector('.app-logo').innerHTML = '🐼 熊喵外送 <small>騎士版</small>';
  };
  const color = (v, inv) => { const g = inv ? 100 - v : v; return g > 60 ? 'var(--green)' : g > 30 ? 'var(--gold)' : 'var(--red)'; };
  function bar(id, v, inv) { const el = $('#' + id); if (!el) return; el.style.width = G.clamp(v, 0, 100) + '%'; el.style.background = color(v, inv); }
  P.refresh = function () {
    if (!s) return;
    $('#st-day').textContent = `第 ${s.ch} 章`;
    $('#st-clock').textContent = JOBS[s.job].name;
    $('#st-weather').textContent = '';
    $('#st-rating').textContent = s.kidName + ' ' + AGES[s.ch] + ' 歲';
    const m = $('#pp-money'); if (m) { m.textContent = G.money(s.money); m.style.color = s.money < 0 ? '#ff7a7a' : '#fff'; }
    bar('pp-bond', s.bond); bar('pp-grades', s.grades); bar('pp-conduct', s.conduct); bar('pp-stress', s.stress, true);
    const r = $('#pp-rep'); if (r) r.textContent = (s.rep > 0 ? '+' : '') + s.rep;
    const a = $('#pp-age'); if (a) a.textContent = AGES[s.ch] + ' 歲';
    G.Chat.render();
  };
  function ap(eff) { const shown = G.apply(s, eff); clampAll(); P.refresh(); return shown; }
  function clampAll() { ['bond', 'grades', 'conduct', 'stress'].forEach((k) => (s[k] = G.clamp(s[k], 0, 100))); s.rep = G.clamp(s.rep, -50, 50); }

  /* ---------- dialog helpers ---------- */
  const say = (who, text, eff) => G.ui.dialog({ name: who ? who.name : '', portrait: who ? who.portrait : null, text, effects: eff ? ap(eff) : null });
  const ask = (who, text, choices) => G.ui.dialog({ name: who ? who.name : '', portrait: who ? who.portrait : null, text, choices });
  async function res(who, text, eff) { await say(who, text, eff); }

  /* helpers shared with parent_scenes.js */
  P._h = {
    get s() { return s; }, ap, say, ask, res, KID, ME, NPC, M, JOBS, AGES, portrait,
    meModel, kidModel, spouseModel, kidH, callKid, meTitle, spouseTitle,
  };

  /* stage helpers */
  function family(room, extra, opts) {
    const list = [
      { id: 'me', model: meModel(), x: -0.9, z: 0.9, rot: 0.35, height: 1.8 },
      { id: 'kid', model: kidModel(), x: 0.9, z: 1.2, rot: -0.35, height: kidH() },
    ].concat(extra || []);
    St().show(room, list, opts);
  }

  /* =====================================================
   * Start / load
   * ===================================================== */
  P.start = async function (cfg) {
    s = P.newState(cfg);
    G.getState = () => s;
    await enter();
    G.Chat.msg(s, 'spouse', `今天開始${s.kidName}就是小一生了耶😭\n你明天記得早點起來幫${callKid()}綁鞋帶`, { silent: true });
    chapter();
  };
  P.load = async function (st) {
    s = st;
    G.getState = () => s;
    await enter();
    if (s.phase === 'plan') planPanel();
    else chapter();
  };
  async function enter() {
    G.ui.screen('game');
    $('#world').classList.add('hidden'); $('#minimap').classList.add('hidden'); $('#hud-keys').classList.add('hidden');
    G.ui.scene({ cover: null, caption: '載入中⋯' });
    await G.Assets.load();
    St().init($('#stage'));
    hudParent();
    G.Chat.view = null; G.Chat.tab('work');
    P.refresh();
  }
  P.active = () => !!(s && s.instance === 'parent');
  P.exit = function () {
    if (!s) return;
    if (s.phase === 'plan' || s.phase === 'chapter') G.save.write('auto', s);
    s = null; busy = false;
    St().hide(); P.restoreHud();
    ['#world', '#minimap', '#hud-keys'].forEach((q) => $(q).classList.remove('hidden'));
  };

  /* =====================================================
   * Chapter flow: intro -> 3 planning rounds -> big event -> summary
   * ===================================================== */
  async function chapter() {
    busy = true;
    s.phase = 'chapter'; s.round = 0;
    G.save.write('auto', s);
    const C = CHAPTERS[s.ch];
    family('living', [{ id: 'sp', model: spouseModel(), x: -2.2, z: -0.6, rot: 0.6, height: 1.78 }], {});
    G.ui.scene({ cover: null, caption: `第 ${s.ch} 章・${C.title}` });
    St().act('kid', 'emote-yes');
    await say(null, `— 第 ${s.ch} 章　${C.title} —\n\n${s.kidName}，${AGES[s.ch]} 歲。`);
    if (C.intro) await C.intro();
    busy = false;
    planPanel();
  }

  function planPanel() {
    s.phase = 'plan';
    G.save.write('auto', s);
    family('living', [], {});
    St().act('kid', G.pick(['idle', 'sit', 'emote-yes']));
    const job = JOBS[s.job];
    G.ui.scene({ cover: null, caption: `第 ${s.ch} 章・這段日子（${s.round + 1}/3）` });
    const kidSchool = AGES[s.ch] >= 13 ? '國中' : '國小';
    const studyName = AGES[s.ch] >= 9 ? '補習班' : '安親班';
    G.ui.panel(`
      <h3>這段日子的重心？（${s.round + 1}/3）</h3>
      <p>選一個地方。每個地方都會發生需要你出面處理的事。家用固定支出 $4,000。</p>
      <div class="plan-grid">
        <button class="btn primary wide" data-act="a" data-arg="work">💼 拚命工作（${job.name}）<small>${s.job === 'delivery' ? '街頭跑單' : s.job === 'shop' ? '顧店' : '辦公室'}・錢↑ 壓力↑ 親子↓</small></button>
        <button class="btn" data-act="a" data-arg="school">🏫 每天接送上下學<small>${kidSchool}校門口・親子↑</small></button>
        <button class="btn" data-act="a" data-arg="study">📚 送去${studyName}<small>成績↑ 壓力↑</small></button>
        <button class="btn" data-act="a" data-arg="play">🎡 週末出去玩<small>公園／夜市・親子↑ 花錢</small></button>
        <button class="btn" data-act="a" data-arg="market">🛒 一起去全連採買<small>超市・品行↑</small></button>
        <button class="btn" data-act="a" data-arg="talk">🏠 在家陪伴<small>客廳・親子↑ 品行↑</small></button>
        <button class="btn ghost" data-act="a" data-arg="rest">😴 照顧自己<small>壓力↓↓ 親子↓</small></button>
      </div>
    `, { a: (arg) => { if (!busy) round(arg); } });
    P.refresh();
  }

  async function round(kind) {
    busy = true;
    if (G.ParentScenes && G.ParentScenes.has(kind)) {
      G.ui.panel(`<h3>⏳ 事情發生中⋯</h3><p>先處理眼前的狀況。</p>`, {});
      await G.ParentScenes.run(kind);
      if (kind !== 'rest' && G.chance(0.3)) await smallEvent();
      if (await checkFail()) return;
      s.round++;
      busy = false;
      if (s.round >= 3) return bigEvent();
      return planPanel();
    }
    const job = JOBS[s.job];
    const lines = {
      work: () => { const pay = job.pay() + (s.job === 'delivery' ? 0 : 0); ap({ money: pay - 5000, stress: 12, bond: -6, mood: -3 }); return `你這段時間每天工作到很晚。回家時${s.kidName}都睡了，桌上留著一張畫：「${meTitle()}加油」。\n收入 ${G.money(pay)}。`; },
      study: () => { ap({ money: -5000, grades: 9, bond: 2, stress: 8 }); return G.pick([`每天晚上八點是戰爭時間。「這題老師沒教！」「有，第 32 頁。」\n${s.kidName}的考卷終於出現了 90 分。`, `你重新學了一次分數的加減。發現自己也不會。`]); },
      play: () => { ap({ money: -6500, bond: 11, stress: -10, conduct: 2 }); return G.pick([`你們去了六福村。${s.kidName}在大怒神上面叫得比你還大聲。`, `你們去河濱公園騎腳踏車，${s.kidName}第一次不用輔助輪。你偷偷錄了影片。`, `動物園的貓熊在睡覺。${s.kidName}說：「跟${meTitle()}放假一樣。」`]); },
      talk: () => { ap({ money: -5000, bond: 8, conduct: 6, stress: 2 }); return G.pick([`睡前${s.kidName}突然問你：「${meTitle()}，你小時候也會被罵嗎？」你們聊到很晚。`, `你教${s.kidName}：「被欺負要說，欺負別人更不行。」${callKid()}很認真地點頭。`, `${s.kidName}跟你講了班上的八卦，誰喜歡誰、誰被老師罰站。你聽得比追劇還認真。`]); },
      rest: () => { ap({ money: -5000, stress: -20, bond: -2 }); return '你這段時間早點睡、偶爾去運動。鏡子裡的黑眼圈淡了一點。'; },
    };
    const anim = { work: 'idle', study: 'sit', play: 'emote-yes', talk: 'sit', rest: 'idle' };
    St().act('me', anim[kind]); St().act('kid', kind === 'play' ? 'jump' : anim[kind]);
    await say(null, lines[kind]());
    // small event
    if (G.chance(0.65)) await smallEvent();
    if (await checkFail()) return;
    s.round++;
    busy = false;
    if (s.round >= 3) return bigEvent();
    planPanel();
  }

  async function checkFail() {
    if (s.stress >= 100) { await ending('p_burnout'); return true; }
    if (s.money < -30000) { await ending('p_broke'); return true; }
    return false;
  }

  async function bigEvent() {
    busy = true;
    s.phase = 'event';
    await CHAPTERS[s.ch].event();
    if (await checkFail()) return;
    // summary
    s.ch++;
    busy = false;
    if (s.ch > 6) return finale();
    chapter();
  }

  /* =====================================================
   * Small events (LINE parent group drama, kid antics)
   * ===================================================== */
  const SMALL = [
    { min: 1, max: 3, run: async () => {
      G.Chat.burst(s, 'parents', [['林媽媽', '請問一下～是誰家小孩把我們家宥宥的橡皮擦帶回家了？那是日本帶回來的限量款喔😊'], ['陳爸爸', '（已讀）'], ['林媽媽', '沒有人要承認嗎？']]);
      const c = await ask(null, `家長群組炸了。你看了一眼${s.kidName}的鉛筆盒——裡面真的有一個你沒看過的恐龍橡皮擦。`, [{ text: '帶孩子去還，順便道歉' }, { text: '先問孩子怎麼來的' }, { text: '假裝沒看到' }]);
      if (c === 0) { G.Chat.me(s, 'parents', '不好意思，是我們家拿的，明天帶去還🙏'); await res(null, '林媽媽回了一個「OK」的貼圖。你覺得她在冷笑。', { rep: -3, conduct: 4 }); }
      else if (c === 1) { await res(KID(), `「是宥宥跟我換的！他拿走我的皮卡丘貼紙！」\n真相大白。你截圖給林媽媽，她收回了訊息。`, { bond: 5, rep: 2 }); }
      else await res(null, '三天後林媽媽在群組說：「找到了，在別人家。不點名了。」所有人都知道是誰。', { rep: -8, conduct: -3 });
    } },
    { min: 1, max: 6, run: async () => {
      G.Chat.burst(s, 'parents', [['蔡媽媽', '【團購】日本超人氣兒童益生菌🇯🇵 一盒 $1,280 買三送一，今晚 12 點截止喔～'], ['林媽媽', '+2'], ['陳爸爸', '+1']]);
      const c = await ask(null, '整個群組都在 +1。', [{ text: '+1（$1,280）' }, { text: '已讀不回' }]);
      if (c === 0) { G.Chat.me(s, 'parents', '+1'); await res(null, '益生菌到貨了。孩子吃了一口說：「好噁。」', { money: -1280, rep: 4 }); }
      else await res(null, '蔡媽媽私訊你：「你們家不買喔？」你把手機翻過去。', { rep: -2, stress: 3 });
    } },
    { min: 1, max: 6, run: async () => {
      G.Chat.msg(s, 'teacher', `${s.kidName}家長您好，提醒明天要交美勞作品「我的家人」，材料請家長協助準備，謝謝🙏\n（傳送時間：晚上 11:47）`);
      const c = await ask(null, '現在是晚上 11 點 47 分。家裡只有一卷膠帶和一個養樂多空瓶。', [{ text: '熬夜陪孩子做' }, { text: '自己做到凌晨三點' }, { text: '明天交一張白紙' }]);
      if (c === 0) await res(KID(), `你們用養樂多瓶做了一個「${meTitle()}騎機車」。歪歪的，但${s.kidName}很得意。`, { bond: 6, stress: 6 });
      else if (c === 1) await res(null, '你做了一個超精緻的家族模型。老師在聯絡簿寫：「家長很用心。」\n孩子說：「那又不是我做的。」', { grades: 3, bond: -3, stress: 10 });
      else await res(null, `${s.kidName}在白紙上畫了一個人在睡覺，說「這是${meTitle()}」。老師給了甲上。`, { bond: 2, rep: -2 });
    } },
    { min: 2, max: 5, run: async () => {
      const c = await ask(KID(), `「${meTitle()}，班上大家都有 Switch，只有我沒有。」`, [{ text: '買（$9,780）' }, { text: '「別人有不代表你要有。」' }, { text: '「考到前三名就買。」' }]);
      if (c === 0) await res(KID(), '「耶！！！」那天晚上你聽到房間傳來偷偷打電動的聲音。', { money: -9780, bond: 8, grades: -6 });
      else if (c === 1) await res(KID(), '「你都不懂！」房門用力關上。', { bond: -6, conduct: 3 });
      else await res(KID(), `${s.kidName}那個月每天讀書到十點。最後考了第五名。你們都很尷尬。`, { grades: 8, bond: -2 });
    } },
    { min: 1, max: 4, run: async () => {
      St().show('hospital', [{ id: 'kid', model: kidModel(), x: -1.6, z: -1.2, rot: 0, height: kidH(), anim: 'sit' }, { id: 'me', model: meModel(), x: 1.2, z: -0.2, rot: -1.4, height: 1.8, anim: 'sit' }], { night: true });
      await res(null, `凌晨兩點，${s.kidName}燒到 39.8 度。你抱著${callKid()}衝進急診室，拖鞋穿反了都沒發現。\n醫生說是流感，要住一晚。`, { money: -2500, stress: 10, bond: 6 });
      G.Chat.msg(s, 'spouse', '我明天請假顧，你去睡一下，你已經兩天沒睡了');
      family('living', [], {});
    } },
    { min: 2, max: 4, run: async () => {
      if (s.job !== 'delivery') return SMALL[3].run();
      await res(KID(), `${s.kidName}的作文〈我的${meTitle()}〉：\n「我的${meTitle()}是外送員。${meTitle()}每天騎很遠的車，下雨也要騎。有一次${meTitle()}說他送過一個阿公，阿公一個人吃飯。我以後要常常陪${meTitle()}吃飯。」\n\n老師給了甲上上。你在機車上看完，戴著安全帽哭了。`, { bond: 10, stress: -8 });
    } },
    { min: 3, max: 6, run: async () => {
      const c = await ask(KID(), `「${meTitle()}⋯⋯我們家很窮嗎？」\n「為什麼這樣問？」\n「同學說我們家住的是『老鼠公寓』。」`, [{ text: '「我們不有錢，但我們不窮。」' }, { text: '「誰說的？我去找他家長！」' }, { text: '「⋯⋯對不起。」' }]);
      if (c === 0) await res(KID(), `「什麼意思？」\n「意思是我們有彼此。」\n${s.kidName}翻了個白眼，但嘴角在笑。`, { bond: 8, conduct: 4 });
      else if (c === 1) await res(null, '你氣到在家長群組打了一大段話，最後還是刪掉了。', { stress: 8, rep: -1, bond: 3 });
      else await res(KID(), `${s.kidName}抱了你一下：「我只是問問而已啦。」`, { bond: 5, stress: 5 });
    } },
    { min: 1, max: 6, run: async () => {
      G.Chat.ask(s, 'spouse', `你最近是不是都不管${s.kidName}？聯絡簿三天沒簽了。`, [
        { text: '「我在拚錢耶！」', eff: { stress: 6, bond: -2 }, resp: '錢重要還是孩子重要？\n（已讀）' },
        { text: '「對不起，今晚我來簽，順便陪功課。」', eff: { stress: -3, bond: 3 }, resp: '好，那我今天去運動一下😮‍💨 謝謝。' },
      ]);
      await res(null, '手機震了一下。是你的另一半傳來的 LINE。（記得去手機的 LINE 分頁回覆）');
    } },
    { min: 2, max: 5, run: async () => {
      const c = await ask(null, '才藝班招生：要讓孩子學什麼？', [{ text: '鋼琴（$3,500/月）' }, { text: '跆拳道（$2,800/月）' }, { text: '讓孩子自己選' }]);
      if (c === 0) await res(null, '每天傍晚家裡都傳來〈小星星〉。鄰居的狗會跟著叫。', { money: -3500, grades: 3, stress: 3 });
      else if (c === 1) { s.flags.taekwondo = true; await res(null, `${s.kidName}拿到黃帶了，每天在客廳踢枕頭。`, { money: -2800, conduct: 3, bond: 3 }); }
      else await res(KID(), `「我想學街舞！」\n你看了一下學費，又看了一下孩子的眼睛。你們去報名了。`, { money: -3000, bond: 8 });
    } },
    { min: 4, max: 6, run: async () => {
      G.Chat.burst(s, 'parents', [['林媽媽', '畢旅費用每人 $8,800，我覺得很合理，大家沒意見吧？'], ['陳爸爸', '有點貴⋯'], ['林媽媽', '為了孩子的回憶，貴一點也是值得的❤️'], ['林媽媽', '還是有人家裡有困難？可以私訊我喔～']]);
      const c = await ask(null, '「可以私訊我喔～」那個波浪號讓你血壓上升。', [{ text: '在群組說：「我覺得可以再比價。」' }, { text: '默默付錢' }, { text: '私訊陳爸爸組成反對聯盟' }]);
      if (c === 0) await res(null, '群組安靜了十秒。然後有三個家長按了讚。林媽媽改口：「那我再問問看～」', { rep: 8, stress: 4 });
      else if (c === 1) await res(null, '你付了 $8,800。這個月的泡麵又要加量了。', { money: -8800, stress: 6 });
      else { s.flags.alliance = true; await res(null, '陳爸爸回：「兄弟，我等這天很久了。」你們開了一個新群組叫「理性家長」。', { rep: 5, stress: -3 }); }
    } },
    { min: 1, max: 6, run: async () => {
      await res(KID(), G.pick([`${s.kidName}拿回來一張獎狀：「整潔比賽第一名」。你把它貼在冰箱上，比貼你自己的還用力。`, `${s.kidName}在學校被選為糾察隊，每天戴著臂章在家裡巡邏，抓你吃宵夜。`, `${s.kidName}把你的手機桌布換成了自己的鬼臉。你一直沒換回來。`]), { bond: 4, conduct: 2, stress: -2 });
    } },
  ];
  async function smallEvent() {
    const extra = ((G.ParentScenes && G.ParentScenes.SMALL) || []).map((e) => ({ min: e.min, max: e.max, run: () => e.run(P._h) }));
    const pool = SMALL.concat(extra).filter((e) => s.ch >= e.min && s.ch <= e.max);
    await G.pick(pool).run();
    family('living', [], {});
  }

  /* =====================================================
   * Chapters
   * ===================================================== */
  const CHAPTERS = {
    1: {
      title: '小一新生',
      intro: async () => {
        G.Chat.burst(s, 'parents', [['王老師', `歡迎各位家長加入一年三班家長群😊`], ['林媽媽', '老師好～我是宥宥媽媽，有任何需要都可以找我喔❤️（家長會長）'], ['蔡媽媽', '大家好～我是做團購的，有需要的話⋯⋯']]);
        await say(null, `開學第一天。${s.kidName}抓著你的衣角不放，在校門口哭到整條街都聽到。\n\n「${meTitle()}不要走！」`);
        const c = await ask(ME(), '校門口的警衛伯伯在看你。', [{ text: '蹲下來抱抱，約好放學第一個來接' }, { text: '「勇敢一點！」然後轉身走掉' }, { text: '陪著進教室坐一整個早上' }]);
        if (c === 0) await res(KID(), `${s.kidName}吸著鼻涕點頭，走進校門前回頭揮了三次手。\n你放學提早半小時到。`, { bond: 8, stress: 3 });
        else if (c === 1) await res(null, `你走到轉角才敢回頭。${s.kidName}被老師牽進去了，還在哭。\n你在機車上坐了十分鐘才騎走。`, { bond: -3, conduct: 3 });
        else await res(null, '你在小朋友的椅子上坐了一個早上，膝蓋快廢了。其他家長都在看你。', { bond: 6, rep: -3, stress: 6 });
      },
      event: async () => {
        G.Chat.msg(s, 'teacher', `${s.kidName}家長您好，${s.kidName}今天在學校咬了同學，對方家長希望明天可以到學校談一下，麻煩您了🙏`);
        await say(null, '手機震了一下。是導師。\n\n「咬了同學」這四個字你看了三遍。');
        St().show('office', [
          { id: 'me', model: meModel(), x: -2.2, z: 1.2, rot: 0.4, height: 1.8 }, { id: 'kid', model: kidModel(), x: -1.4, z: 1.6, rot: 0.2, height: kidH() },
          { id: 'lin', model: M.linMom, x: 1.6, z: 1.0, rot: -0.6, height: 1.75 }, { id: 'ok', model: M.otherKid, x: 2.3, z: 1.5, rot: -0.4, height: kidH() },
          { id: 't', model: M.teacher, x: -0.4, z: -1.2, rot: 0, height: 1.72 },
        ]);
        G.ui.scene({ cover: null, caption: '一年三班・教室' });
        const LIN = NPC('林媽媽（家長會長）', M.linMom), T = NPC('王老師', M.teacher);
        St().act('lin', 'emote-no');
        await say(LIN, '「你看！宥宥的手臂上還有齒痕！我們家宥宥從小到大沒有被這樣對待過！」\n她把手機舉到你面前，裡面有 12 張不同角度的照片。');
        const c = await ask(ME(), `${s.kidName}低著頭，手指在絞衣角。`, [{ text: `蹲下來先問${s.kidName}：「發生什麼事了？」` }, { text: `「${s.kidName}，跟宥宥道歉。」` }, { text: '「小孩子玩一玩而已啦。」' }]);
        if (c === 0) {
          St().act('kid', 'emote-no');
          await say(KID(), '「⋯⋯他搶我的皮卡丘鉛筆盒，還說那是他的。我說還我，他就推我。」');
          s.flags.listened1 = true;
          const c2 = await ask(ME(), '林媽媽的臉色變了一下。', [{ text: '「咬人是不對的。但宥宥也要還東西。」' }, { text: '「所以是你們家先動手的？」' }]);
          if (c2 === 0) { St().act('t', 'emote-yes'); await res(T, '王老師鬆了一口氣：「那兩個小朋友互相道歉，好嗎？」\n兩個孩子握了握手。宥宥偷偷把鉛筆盒還回來了。', { bond: 10, conduct: 8, rep: 4 }); }
          else { St().act('lin', 'emote-no'); await res(LIN, '「你這是什麼態度！」\n那天晚上，家長群組多了一則沒有點名的長文：〈論家庭教育的重要〉。', { bond: 8, rep: -10, stress: 6 }); }
        } else if (c === 1) {
          await res(KID(), `${s.kidName}哭著說「對不起」，但回家的路上一句話都沒跟你說。\n後來你才從老師那裡知道，是宥宥先搶東西的。`, { conduct: 6, bond: -10, rep: 5 });
        } else {
          St().act('lin', 'emote-no');
          await res(LIN, '「玩一玩！？」林媽媽的聲音高了八度，「我要求轉班！還有醫藥費！」\n你賠了 $2,000 醫藥費。宥宥的手臂其實連皮都沒破。', { money: -2000, rep: -12, conduct: -5, stress: 8 });
        }
        G.Chat.burst(s, 'parents', [['林媽媽', '今天發生了一些事，希望大家都能好好教育自己的孩子喔～🙏'], ['陳爸爸', '（已讀）'], ['蔡媽媽', '😮']]);
      },
    },
    2: {
      title: '學務處',
      event: async () => {
        G.Chat.msg(s, 'teacher', `${s.kidName}家長您好，${s.kidName}今天下課時把同學張大雄推倒，對方流鼻血。學務主任請雙方家長下午四點到學務處，謝謝。`);
        await say(null, `下午三點半，你接到電話的時候正在${s.job === 'delivery' ? '送一份滷肉飯' : '開會'}。\n「推倒」、「流鼻血」、「學務處」。\n你${s.job === 'delivery' ? '把單轉給別人，' : ''}騎車衝去學校。`);
        // hallway: optional talk with kid
        St().show('classroom', [{ id: 'me', model: meModel(), x: 2.6, z: 1.6, rot: -1.2, height: 1.8 }, { id: 'kid', model: kidModel(), x: 1.2, z: 1.8, rot: 1.2, height: kidH(), anim: 'sit' }]);
        G.ui.scene({ cover: null, caption: '學務處外面的走廊' });
        const c0 = await ask(ME(), `${s.kidName}一個人坐在走廊，膝蓋上有擦傷。學務處的門還關著。`, [{ text: `先坐下來，問${s.kidName}發生了什麼` }, { text: '「你給我解釋清楚！」' }, { text: '直接進學務處' }]);
        if (c0 === 0) {
          St().act('kid', 'emote-no');
          await say(KID(), `「大雄一直說『${s.kidName}的${meTitle()}是${s.job === 'delivery' ? '外送仔' : s.job === 'shop' ? '賣飲料的' : '社畜'}』，還把我的便當倒在地上。我叫他不要說了，他就踢我。」\n「我只是推他一下⋯⋯他就流鼻血了。」`);
          s.flags.truth2 = true; ap({ bond: 8 });
        } else if (c0 === 1) {
          await res(KID(), `${s.kidName}縮了一下，什麼都不說了。`, { bond: -8 });
        }
        // office
        St().show('office', [
          { id: 'me', model: meModel(), x: -2.0, z: 1.2, rot: 0.6, height: 1.8 }, { id: 'kid', model: kidModel(), x: -2.9, z: 1.8, rot: 0.6, height: kidH() },
          { id: 'zhang', model: M.zhangDad, x: 0.9, z: 1.0, rot: -0.9, height: 1.95 }, { id: 'ok', model: M.otherKid, x: 1.9, z: 1.6, rot: -0.8, height: kidH() + 0.05 },
          { id: 'dir', model: M.director, x: -0.6, z: -1.6, rot: 0, height: 1.78, anim: 'sit' },
        ]);
        G.ui.scene({ cover: null, caption: '學務處' });
        const Z = NPC('張爸爸', M.zhangDad), D = NPC('學務主任', M.director);
        St().act('zhang', 'emote-no');
        await say(Z, `一個穿著背心、手臂有刺青的壯漢一拍桌子站起來：\n「你就是${s.kidName}的家長？你家小孩把我兒子打到流鼻血，你要怎麼處理！」`);
        await say(D, '「張爸爸，我們先坐下來好好談⋯⋯」\n主任的話被他直接打斷。');
        const opts = [{ text: '低頭道歉：「真的很抱歉。」' }, { text: '「是不是先聽聽兩個孩子怎麼說？」' }, { text: '「你兒子先霸凌我們家的！」', cls: 'angry' }];
        if (s.flags.truth2) opts[1] = { text: '冷靜說出大雄說的話和倒便當的事', cls: 'special' };
        const c = await ask(ME(), '張爸爸瞪著你，鼻孔在噴氣。', opts);
        if (c === 0) {
          await res(Z, '「道歉有用要警察幹嘛！」他戳了戳你的胸口，「醫藥費 $5,000，還有你們家小孩要在全班面前道歉！」', { stress: 8 });
          const c2 = await ask(ME(), `${s.kidName}在後面拉你的衣服，小聲說：「⋯⋯是大雄先的。」`, [{ text: '付錢，息事寧人' }, { text: '轉頭問孩子：「你說什麼？」' }]);
          if (c2 === 0) { await res(null, `你付了錢。走出學務處時，${s.kidName}放開了你的手。`, { money: -5000, bond: -12, conduct: -4 }); return after2(); }
          s.flags.truth2 = true;
        }
        if (c === 1 || s.flags.truth2) {
          if (s.flags.truth2) {
            St().act('dir', 'idle');
            await say(D, '主任聽完，臉色沉了下來：「張爸爸，大雄有說這些話嗎？」\n大雄低著頭不說話。');
          }
        }
        // escalation
        St().act('zhang', 'attack-melee-right', { once: true, restart: true });
        G.sfx.bad(); G.ui.fx('shake');
        await say(Z, `「你什麼意思！？說我兒子霸凌！？」\n張爸爸推了你一把，你撞到後面的鐵櫃，發出「哐」的一聲。\n${s.kidName}嚇得大哭。`);
        St().act('kid', 'emote-no');
        const c3 = await ask(ME(), '主任在旁邊大喊：「冷靜！冷靜！」\n你的拳頭握緊了。', [
          { text: '還手！', cls: 'angry' },
          { text: `擋在${s.kidName}前面，一步都不退` },
          { text: '深呼吸，拿出手機開始錄影' },
        ]);
        if (c3 === 0) {
          St().face('me', 'zhang'); St().face('zhang', 'me');
          await St().move('me', -0.6, 1.1, 0.6);
          const r = await St().fight({ you: 'me', foe: 'zhang', foeName: '張爸爸', hp: s.flags.taekwondo ? 4 : 3, foeHp: 3, speed: 1.1 });
          s.flags.fought = r;
          if (r === 'win') {
            G.album.unlock('p_fight');
            await res(null, `張爸爸倒在學務處的地上，壓壞了一盆盆栽。\n主任按下了警鈴。三分鐘後，兩位警察走了進來。\n\n${s.kidName}站在角落，看著你。你看不出${callKid()}是害怕，還是崇拜。`, { stress: 15, rep: -15, conduct: -6, bond: s.flags.truth2 ? 5 : -5 });
            await res(null, '隔天新聞：〈國小學務處家長互毆 現場一片狼藉〉。\n標題下面的留言有 2,000 則，一半罵你，一半說「打得好」。\n你被告傷害，最後和解賠了 $15,000。', { money: -15000, fame: 5 });
          } else {
            await res(null, `你被他一拳打倒在地上，眼鏡飛了出去。\n${s.kidName}衝過來抱住你，哭著喊「不要打我${meTitle()}！」\n大雄也哭了。整個學務處只剩下哭聲。`, { stress: 18, bond: 10, money: -3000 });
            await res(D, '警察來了。張爸爸被帶去做筆錄，學校後來對大雄進行了輔導。\n你的眼角縫了三針。', { rep: 5, conduct: 3 });
          }
        } else if (c3 === 1) {
          St().act('me', 'emote-no');
          await res(null, `你張開手擋在${s.kidName}前面，看著張爸爸的眼睛，一個字都沒說。\n他舉起的手停在半空中。主任和警衛衝了進來把他架開。\n\n回家的路上，${s.kidName}一直牽著你的手。`, { bond: 15, conduct: 8, rep: 6, stress: 8 });
          G.album.unlock('p_shield');
        } else {
          await res(null, '你舉起手機。張爸爸愣了一下：「你錄什麼錄！」\n但他沒有再動手。這段影片後來成了學校處理霸凌的關鍵證據。大雄被轉介輔導。', { conduct: 6, rep: 10, stress: 5, bond: 5 });
        }
        return after2();
        async function after2() {
          G.Chat.burst(s, 'parents', [['林媽媽', '聽說今天學務處很熱鬧？'], ['陳爸爸', '我私訊你'], ['蔡媽媽', '😱😱😱']]);
          if (s.flags.alliance || s.rep > 5) G.Chat.msg(s, 'parents', '兄弟我挺你。大雄在班上欺負人很久了。', { who: '陳爸爸' });
        }
      },
    },
    3: {
      title: '園遊會',
      event: async () => {
        G.Chat.burst(s, 'parents', [['王老師', '校慶園遊會每班要擺一個攤位，需要家長協助喔！'], ['林媽媽', '我建議賣手工餅乾，我可以負責❤️'], ['陳爸爸', `我覺得可以找${s.name}，聽說${s.job === 'shop' ? '開飲料店' : '很會處理事情'}`]]);
        St().show('classroom', [
          { id: 'me', model: meModel(), x: -1.4, z: 1.2, rot: 0.3, height: 1.8 }, { id: 'kid', model: kidModel(), x: -0.4, z: 1.6, rot: 0, height: kidH() },
          { id: 'lin', model: M.linMom, x: 1.8, z: 0.8, rot: -0.7, height: 1.75 },
        ]);
        G.ui.scene({ cover: null, caption: '校慶園遊會・三年三班攤位' });
        const LIN = NPC('林媽媽', M.linMom);
        const c = await ask(ME(), '你被推派負責班級攤位。要賣什麼？', [{ text: s.job === 'shop' ? '珍珠奶茶（自家店的配方）' : '珍珠奶茶', cls: 'special' }, { text: '跟林媽媽合作賣餅乾' }, { text: `讓${s.kidName}和同學決定` }]);
        if (c === 0) {
          await say(LIN, '林媽媽在隔壁擺了一攤「手工有機餅乾」，跟你們的珍奶正面對決。\n「我們家的是有機的喔～」她對著每個經過的家長說。');
          const c2 = await ask(ME(), '你們的攤位排隊排到操場。林媽媽的餅乾一盒都沒賣出去。', [{ text: '買一盒她的餅乾，配珍奶一起賣' }, { text: '大聲喊：「珍奶買一送一！」' }]);
          if (c2 === 0) await res(LIN, `「⋯⋯謝謝。」她愣了很久。\n那天收攤時，她第一次對你笑了。\n${s.kidName}說：「${meTitle()}，你好像在打大魔王。」`, { rep: 15, bond: 6, money: 2000 });
          else await res(null, '你們賺了 $8,000 班費，全班歡呼。林媽媽提早收攤了。', { rep: 5, bond: 6, stress: 4, money: 1000 });
        } else if (c === 1) {
          await res(LIN, '「你負責揉麵團就好，包裝我來。」\n你揉了三百個麵團。合照的時候，林媽媽站在最中間。', { rep: 8, stress: 10 });
        } else {
          await res(KID(), `${s.kidName}和同學決定開「鬼屋」。他們用紙箱和黑色垃圾袋把教室封起來，把校長嚇到喊出聲音。\n全校最紅的攤位。`, { bond: 12, conduct: 4, grades: -2 });
        }
      },
    },
    4: {
      title: '那張照片',
      event: async () => {
        const victim = s.conduct >= 45;
        family('living', [], { night: true });
        G.ui.scene({ cover: null, caption: '家裡・晚上十一點' });
        if (victim) {
          await say(null, `${s.kidName}這幾天放學都直接回房間，晚餐也不吃。\n今天晚上，你聽到房間裡有哭聲。`);
          await say(KID(), `你推門進去，${s.kidName}把手機藏到枕頭下面。\n你看到螢幕上是一張被 P 過的照片——${callKid()}的臉被接在一隻豬的身上，下面有兩百多則留言。`);
          const c = await ask(ME(), `「不要告訴老師⋯⋯他們會更過分。」`, [{ text: '抱住孩子，什麼都不說' }, { text: '截圖存證，明天一起去學校' }, { text: '「早就叫你不要玩 IG！」沒收手機', cls: 'angry' }]);
          if (c === 0) { await res(null, `${s.kidName}在你懷裡哭了半個小時。\n隔天，${callKid()}自己去找老師了。「因為我知道家裡有人挺我。」`, { bond: 15, conduct: 5, stress: 6 }); }
          else if (c === 1) { await res(null, '學校成立了霸凌調查小組，PO 圖的三個同學被記過、要寫悔過書。\n那個帳號被刪掉了。', { bond: 8, rep: 6, stress: 8 }); }
          else { await res(KID(), `「你根本不懂！」\n${s.kidName}把自己鎖在房間裡。那一個禮拜，你們沒有說過一句話。`, { bond: -18, stress: 10 }); }
        } else {
          G.Chat.msg(s, 'teacher', `${s.kidName}家長您好，有同學反映${s.kidName}在 IG 上 PO 了其他同學的醜照並帶頭留言，對方已經一週沒來上學了。請家長明天到校。`);
          await say(null, `你點開那個帳號。是${s.kidName}的。\n那張被 P 成豬的照片下面，第一則留言是${callKid()}寫的：「哈哈哈胖豬」。`);
          const c = await ask(ME(), `${s.kidName}站在門口，看著你的臉色。`, [{ text: `「為什麼要這樣做？」好好問` }, { text: '帶孩子去對方家裡道歉', cls: 'special' }, { text: '「大家都在玩，又不是只有你。」' }]);
          if (c === 0) await res(KID(), `${s.kidName}沉默很久：「⋯⋯因為如果我不笑他，下一個被笑的就是我。」\n你突然想起學務處那天。`, { bond: 6, conduct: 10 });
          else if (c === 1) await res(null, `對方的媽媽開門時眼睛是腫的。${s.kidName}鞠了九十度的躬，說了三次對不起。\n回家的路上${callKid()}說：「她媽媽跟${meTitle()}一樣，都會等小孩回家。」`, { conduct: 18, bond: 4, rep: 6 });
          else await res(null, '對方家長提告了。你請了律師，花了 $20,000。\n孩子學到的事是：有錢就能擺平。', { money: -20000, conduct: -15, rep: -15 });
        }
      },
    },
    5: {
      title: '凌晨的西門町',
      event: async () => {
        family('living', [], { night: true });
        St().show('living', [{ id: 'me', model: meModel(), x: 0, z: 1.2, rot: 0, height: 1.8 }], { night: true });
        G.ui.scene({ cover: null, caption: '凌晨一點' });
        await say(null, `凌晨一點。${s.kidName}還沒回家，手機關機。\n家長群組有人傳來一張照片：「這是不是你們家的？在西門町網咖。」`);
        G.Chat.msg(s, 'parents', '這是不是你們家的？剛剛在西門町網咖門口看到（照片）', { who: '陳爸爸' });
        const c = await ask(ME(), '你抓起機車鑰匙。', [{ text: '騎車去西門町！' }, { text: '報警' }]);
        if (c === 1) {
          await res(null, '警察半小時後在網咖找到人，把孩子載回家。\n孩子下警車的時候，看都沒看你一眼。', { bond: -10, conduct: 4, stress: 10 });
          return;
        }
        // drive in the 3D city
        await driveToNetcafe();
        St().show('netcafe', [
          { id: 'me', model: meModel(), x: 2.8, z: 1.8, rot: -2.2, height: 1.8 },
          { id: 'kid', model: kidModel(), x: -1.2, z: -0.6, rot: Math.PI, height: kidH(), anim: 'sit' },
          { id: 'azhe', model: M.azhe, x: 0.9, z: -0.6, rot: Math.PI, height: 1.7, anim: 'sit' },
        ], { night: true });
        G.ui.scene({ cover: null, caption: '西門町網咖 B2・37 號機旁邊' });
        const AZ = NPC('阿哲（網咖店員）', M.azhe);
        await say(null, `B2。螢幕的光照在${s.kidName}的臉上。${callKid()}旁邊坐著一個穿網咖制服的年輕人，正在教${callKid()}打遊戲。`);
        await say(AZ, `年輕人看到你，站起來：「你是${callKid()}的家長嗎？我叫阿哲，在這裡上大夜班。」\n「我看${callKid()}一個人坐到半夜，就陪${callKid()}聊了一下。我以前也是這樣，在 37 號機睡了一個禮拜。」\n「後來有一個外送員帶我去找社工。」`);
        const fightLine = s.flags.fought === 'win' ? `「你還不是在學校跟人打架！憑什麼管我！」` : `「你們都不懂我！」`;
        St().act('kid', 'emote-no');
        await say(KID(), `${s.kidName}看到你，臉一沉：\n${fightLine}`);
        const c2 = await ask(ME(), '整個 B2 都在看你們。', [{ text: '抓住手臂，直接拖回家', cls: 'angry' }, { text: '在旁邊坐下：「教我玩，打完這場就回家。」', cls: 'special' }, { text: `「我以前也覺得${meTitle()}不懂我。」` }]);
        if (c2 === 0) await res(null, `${s.kidName}被你拖上機車，一路上都沒說話。\n到家後${callKid()}說了一句：「我討厭你。」然後關上門。`, { bond: -15, conduct: 5, stress: 12 });
        else if (c2 === 1) {
          St().act('kid', 'emote-yes');
          await res(KID(), `${s.kidName}愣住了。然後很不甘願地把滑鼠推給你。\n你們打了一場。你很爛，被對面殺了 14 次。\n${s.kidName}笑到眼淚都出來了：「${meTitle()}你好爛喔。」\n凌晨三點，你們一起騎車回家。${callKid()}在後座抱著你的腰。`, { bond: 20, conduct: 6, stress: -5 });
        } else await res(KID(), `${s.kidName}沉默了很久：「⋯⋯那你後來怎麼辦？」\n「我後來發現，${meTitle()}只是不會說。」\n你們在網咖門口吃了一碗深夜牛肉麵，然後回家。`, { bond: 14, conduct: 8 });
        G.Chat.msg(s, 'parents', '找到了嗎？還好嗎？', { who: '陳爸爸' });
      },
    },
    6: {
      title: '會考',
      event: async () => {
        family('living', [], {});
        G.ui.scene({ cover: null, caption: '會考當天・早上六點半' });
        await say(null, `會考當天。你五點就起床了，煎了一顆荷包蛋——${s.kidName}小時候最喜歡的。\n${callKid()}吃了一口，說：「太鹹了。」然後全部吃完。`);
        const c = await ask(ME(), '騎車送考的路上，紅燈很長。', [{ text: '「考不好也沒關係。」' }, { text: '「加油，你可以的。」' }, { text: '什麼都不說，只是把安全帽幫他扣緊' }]);
        ap(c === 0 ? { bond: 5, stress: -5 } : c === 1 ? { grades: 3 } : { bond: 6 });
        const score = s.grades + G.randi(-8, 8);
        s.flags.score = score;
        await say(null, `成績公布那天。\n${s.kidName}的會考成績：${score >= 80 ? '5A++ 🎉' : score >= 60 ? '3A2B' : score >= 40 ? '1A4B' : '5C'}`);
      },
    },
  };

  /* =====================================================
   * Drive segment (reuse the delivery 3D city)
   * ===================================================== */
  function driveToNetcafe() {
    return new Promise(async (resolve) => {
      const W = G.World;
      St().hide();
      $('#world').classList.remove('hidden'); $('#minimap').classList.remove('hidden'); $('#hud-keys').classList.remove('hidden');
      if (!W.ready) W.init($('#world'), $('#minimap'));
      setTimeout(W.resize, 30);
      s.weather = 'rain';
      W.resetToHome(); W.setTime(25 * 60, 'rain');
      W.setTarget('西門町 網咖 B2');
      G.ui.hud('🏍️ 去西門町網咖找孩子', true);
      G.ui.scene({ cover: null, caption: '凌晨・下著雨' });
      G.ui.panel(`<h3>🏍️ 騎車去西門町</h3><p>跟著黃色箭頭騎過去。</p><button class="btn ghost" data-act="skip">⏩ 跳過騎車</button>`, { skip: done });
      P.onArrive = done;
      W.pause(false);
      let finished = false;
      function done() {
        if (finished) return; finished = true;
        P.onArrive = null;
        W.pause(true); W.setTarget(null); G.ui.hud(null, false);
        $('#world').classList.add('hidden'); $('#minimap').classList.add('hidden'); $('#hud-keys').classList.add('hidden');
        resolve();
      }
    });
  }

  /* =====================================================
   * Endings
   * ===================================================== */
  Object.assign(G.ENDINGS, {
    p_best: { title: '最好的朋友', kind: 'love', text: '畢業典禮上，孩子上台致詞時說：「我最想謝謝的人，是那個會陪我打電動、打得超爛的人。」\n全場都在笑。只有你在哭。' },
    p_scholar: { title: '第一志願', kind: 'good', text: '榜單上有孩子的名字。你在家長群組貼了紅榜截圖，然後馬上收回，假裝自己沒那麼得意。\n林媽媽按了一個讚。' },
    p_rebel: { title: '離家的孩子', kind: 'bad', text: '十五歲那年夏天，孩子留了一張紙條就搬去朋友家。\n你每天晚上還是會留一盞燈。有一天，手機跳出一則訊息：「我吃飽了。」\n這樣就夠了。' },
    p_normal: { title: '平凡的幸福', kind: 'good', text: '沒有第一志願，也沒有上新聞。\n只是某個普通的晚上，孩子突然說：「我們明天一起吃早餐好不好？」' },
    p_burnout: { title: '過勞', kind: 'bad', text: '你在等紅燈的時候昏倒了。醒來的時候在醫院，孩子坐在床邊幫你削蘋果，削得很醜。\n「你可以不要那麼累嗎？」' },
    p_broke: { title: '破產', kind: 'bad', text: '銀行的信一封一封寄來。你們搬到更小的房子。\n孩子說：「沒關係，房間小一點，我們比較近。」' },
    p_fight: { title: '學務處之王', kind: 'good', text: '（成就）你在學務處打贏了一場不該打的架。\n孩子後來說：「那天其實有點帥。但你以後不要再這樣了。」' },
    p_shield: { title: '人肉盾牌', kind: 'love', text: '（成就）你張開手擋在孩子前面，一步都沒有退。' },
  });

  async function finale() {
    busy = true;
    let id = 'p_normal';
    if (s.bond < 30) id = 'p_rebel';
    else if (s.bond >= 70 && s.conduct >= 55) id = 'p_best';
    else if ((s.flags.score || 0) >= 80) id = 'p_scholar';
    family('living', [{ id: 'sp', model: spouseModel(), x: -2.2, z: -0.6, rot: 0.6, height: 1.78 }], {});
    St().act('kid', 'emote-yes'); St().act('me', 'emote-yes');
    await ending(id, true);
  }

  async function ending(id, finished) {
    busy = true;
    G.album.unlock(id);
    const e = G.ENDINGS[id];
    if (e.kind === 'bad') G.sfx.bad(); else G.sfx.love();
    G.save.remove('auto');
    const stats = `<div class="sum"><div><span>孩子</span><span>${s.kidName}（${AGES[Math.min(s.ch, 6)]} 歲）</span></div><div><span>親子</span><span>${s.bond}</span></div><div><span>成績</span><span>${s.grades}</span></div><div><span>品行</span><span>${s.conduct}</span></div><div><span>家長圈名聲</span><span>${s.rep}</span></div><div><span>存款</span><span>${G.money(s.money)}</span></div></div>`;
    await G.ui.modal(finished ? '爸媽篇・完' : 'GAME OVER', `<div class="ending-title">${e.title}</div><p style="white-space:pre-line">${e.text}</p>${stats}`, [{ text: '回到標題', cls: 'primary', value: 'title' }]);
    busy = false;
    St().hide();
    P.restoreHud();
    $('#world').classList.remove('hidden'); $('#minimap').classList.remove('hidden'); $('#hud-keys').classList.remove('hidden');
    s = null;
    G.Game.toTitle();
  }
})(window.G);
