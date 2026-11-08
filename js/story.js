/* 外送人生 — scripted story: crash, hero events, romance lines, main plot */
(function (G) {
  const S = (G.STORY = {});
  const npc = (k) => G.NPC[k];

  /** Talk helper: shows one line with an NPC (or the player if k === 'me'). */
  async function talk(s, k, text, choices, effects) {
    let name = '', portrait = null;
    if (k === 'me') { name = s.name; portrait = G.portrait(s); }
    else if (k && npc(k)) { name = npc(k).name; portrait = npc(k).portrait; }
    else if (k && typeof k === 'object') { name = k.name; portrait = k.portrait; }
    return G.ui.dialog({ name, portrait, text, choices, effects });
  }
  async function result(s, text, eff, k) {
    const shown = G.apply(s, eff);
    await talk(s, k || null, text, null, shown);
  }
  S.talk = talk;
  S.result = result;

  /* =====================================================
   * 開門殺：遇見思遠（3D 場景觸發）
   * outcome: 'hit' 撞上車門 / 'dodge' 閃過
   * ===================================================== */
  S.siyuanDoor = async function (s, outcome) {
    if (outcome === 'dodge') {
      G.sfx.bad();
      await talk(s, null, '一台停在路邊的白色轎車，車門突然打開——\n\n你猛地一偏，車門擦過你的保溫箱，發出「鏗」的一聲。差一點點。\n\n駕駛座跳下來一個戴眼鏡的男人，臉色比你還白。');
      await talk(s, 'crash', '「對、對不起！！你有沒有怎樣？我沒看後照鏡⋯⋯我叫陳思遠。」\n他的手在發抖，手上還握著車鑰匙。');
      const c = await talk(s, 'me', '你的心臟還在狂跳。', [
        { text: '「你開車門不看的喔！？」', cls: 'angry' },
        { text: '「沒事，下次小心點。」' },
        { text: '「⋯⋯你要不要先坐下？你看起來比我還慘。」' },
      ]);
      const aff = [3, 8, 14][c];
      await result(s, ['他一直鞠躬道歉，硬是塞了他的名片給你：「如果餐有問題，我賠。」', '「謝謝你⋯⋯真的。」他堅持要加你的 LINE，說如果之後發現哪裡受傷一定要告訴他。', '他愣了一下，然後真的蹲在路邊。「⋯⋯你人好好。」他加了你的 LINE，說要請你喝咖啡賠罪。'][c], { aff: { crash: aff }, mood: 3 }, 'crash');
      s.flags.crash_met = true; s.flags.crash_stage = 1; s.flags.crash_met_day = s.day;
      setTimeout(() => G.Chat.ask(s, 'crash', '我是陳思遠，剛剛⋯⋯真的很抱歉。\n你送完那單了嗎？有沒有被客人罵？', [
        { text: '「準時送到了，放心。」', eff: { aff: { crash: 5 } }, flags: { crash_stage: 2, crash_chat1: true }, resp: '太好了⋯⋯我今天一整天都在想這件事。\n改天真的讓我請你喝咖啡。' },
        { text: '「你下次開門前看一下後照鏡就好。」', eff: { aff: { crash: 3 } }, flags: { crash_stage: 2, crash_chat1: true }, resp: '我已經在方向盤上貼便利貼了：「看後照鏡！！」\n（傳了一張照片）' },
      ]), 2500);
      return { delay: 6 };
    }
    // ---- 撞上了 ----
    G.sfx.crash(); G.ui.fx('shake');
    s.crashes++;
    G.addLog(s, '被開門殺');
    await talk(s, null, '一台停在路邊的白色轎車，駕駛座車門突然打開。\n\n你根本來不及煞車。\n\n「砰——」\n\n世界轉了一圈，你躺在柏油路上，看著天空。保溫箱裡的珍奶在路面上慢慢流成一條小河。');
      await talk(s, 'crash', '「你、你還好嗎！？對不起對不起，我沒看後照鏡⋯⋯我叫陳思遠，我、我叫救護車了！」\n\n他的眼鏡歪了一邊，手上還握著車鑰匙，看起來比你還慌。');
      const c = await talk(s, 'me', '你的膝蓋很痛，手肘在流血。你該說什麼？', [
        { text: '「你開車門不看的喔！？」（大吵）', cls: 'angry' },
        { text: '「先拍照，等警察來。」（冷靜處理）' },
        { text: '「我⋯⋯我沒事啦。餐灑了比較慘。」（逞強）' },
      ]);
      if (c === 0) {
        await result(s, '你們在路邊吵了十分鐘，直到救護車來。思遠一直鞠躬道歉，路人都在錄影。\n「我會負責的⋯⋯真的。」', { mood: 5, aff: { crash: 2 } }, 'crash');
      } else if (c === 1) {
        await result(s, '你冷靜地拍下現場、記下車牌。思遠在旁邊看著你：「你好冷靜⋯⋯是常遇到嗎？」\n「⋯⋯這是第一次被開門殺。」', { aff: { crash: 8 } }, 'crash');
      } else {
        await result(s, '「你在流血耶！還說沒事！」思遠脫下自己的外套壓住你的手肘。他的白襯衫沾到了血和珍奶。', { mood: 3, aff: { crash: 12 } }, 'crash');
      }
      await talk(s, 'crash', '「這是我的 LINE，醫藥費、機車修理費我都會負責。真的很對不起。」\n\n救護車的門關上前，你看到他還站在原地，手裡拿著你掉在地上的安全帽。');
      s.flags.crash_met = true;
      s.flags.crash_hit = true;
      s.flags.crash_stage = 1;
      s.flags.crash_met_day = s.day;
      await result(s, '診斷：膝蓋擦傷、手肘撕裂傷，要住院觀察 2 天。\n這一單當然送不到了。平台：「訂單異常，請聯繫客服。」', { stamina: -40, bike: -30, mood: -15 });
      return { lost: true, hospital: 2, noRating: true };
  };

  /* =====================================================
   * 一般車禍（3D 中高速撞到車）
   * ===================================================== */
  S.crash = async function (s) {
    G.sfx.crash();
    G.ui.fx('shake'); G.ui.fx('flash');
    s.crashes++;
    G.addLog(s, '發生車禍');
    if (s.flags.charm && !s.flags.charm_used) {
      s.flags.charm_used = true;
      await result(s, '你撞上了車，整個人飛了出去——\n\n然後落在一堆回收紙箱上。毫髮無傷。\n口袋裡小芸給的平安符，繩子斷了。', { mood: -5, bike: -10 });
      return { spill: true };
    }
    // ---- 車禍 ----
    const severe = s.day > 2 && G.chance(s.crashes >= 4 ? 0.6 : 0.25);
    if (s.crashes >= 4 && severe) {
      await talk(s, null, '又一次。這次是一台闖紅燈的貨車。\n\n你醒來的時候在加護病房，醫生的表情很嚴肅。');
      return { end: 'hurt' };
    }
    const lines = [
      '一台計程車突然切進你的車道。你緊急煞車，人往前飛了出去。',
      '你為了閃一隻突然衝出來的貓，整台車撞上了路邊的變電箱。',
      '下坡的時候煞車突然沒力，你只能把車往人行道上的盆栽倒。',
    ];
    if (severe) {
      await result(s, G.pick(lines) + '\n\n骨折，住院 3 天。醫藥費和機車維修費加起來 $4,200。', { money: -4200, stamina: -50, bike: -35, mood: -20 });
      return { lost: true, hospital: 3, noRating: true };
    }
    await result(s, G.pick(lines) + '\n\n還好只是擦傷。你在路邊坐了很久，最後自己去診所包紮，$450。', { money: -450, stamina: -20, bike: -15, mood: -12 });
    return { lost: true, noRating: true };
  };

  /* =====================================================
   * 隱藏劇情：英雄事件
   * ===================================================== */
  S.heroCheck = function (s, ctx) {
    const list = [];
    if (!s.flags.hero_knife && s.day >= 3 && ctx.slot.id === 'night') list.push({ fn: S.heroKnife, p: 0.05 });
    if (!s.flags.hero_thief && s.day >= 2) list.push({ fn: S.heroThief, p: 0.03 });
    for (const h of list) if (G.chance(h.p)) return h.fn;
    return null;
  };

  S.heroKnife = async function (s, ctx) {
    s.flags.hero_knife = true;
    G.sfx.siren();
    G.ui.fx('shake');
    await talk(s, null, '深夜的捷運站出口，突然傳來尖叫。\n\n一個男人揮著水果刀，人群四散。一位抱著小孩的媽媽跌坐在地上，刀子離她只有幾步。\n\n你的機車還在發動。保溫箱裡是一份還熱著的鹽酥雞。');
    const c = await talk(s, 'me', '你的心跳快到耳朵都聽得到。', [
      { text: '衝上去奪刀', cls: 'special' },
      { text: '拿下安全帽當盾牌擋在媽媽前面', cls: 'special' },
      { text: '大喊報警，疏散路人' },
      { text: '假裝沒看到，繼續送單' },
    ]);
    G.album.unlock('hero_seen');
    if (c === 0) {
      const roll = Math.random() + (s.stamina > 60 ? 0.15 : 0) - (s.stamina < 25 ? 0.2 : 0);
      if (roll > 0.55) {
        G.sfx.hero();
        await result(s, '你從側面撲上去，抓住他的手腕往地上撞。刀子滑了出去。\n路人一擁而上壓住他。警察趕到時，你的手還在發抖。\n\n隔天新聞：「外送員徒手奪刀 救下母子」。', { fame: 30, mood: 25, money: 10000, rating: 0.3, aff: { nurse: 10, crash: 10 } });
        await talk(s, null, '平台頒發「見義勇為獎金」$10,000，並在官方粉專發文表揚。\n不過，你那單還是超時了。');
        await talk(s, { name: '客人評論', portrait: null }, '「我不管你救了誰，我的鹽酥雞冷了。」⭐');
        G.apply(s, { rating: -0.1 });
        s.flags.hero_done = true;
        G.album.unlock('hero');
        return { lost: true, noRating: true, unlockEnding: 'hero' };
      } else if (roll > 0.15) {
        await result(s, '你抓住了他的手，但刀子劃過你的手臂。血流得比你想像中多。\n路人趁機制伏了他。你在救護車上聽到有人說：「那個外送員好勇敢。」', { fame: 20, mood: 10, money: -1500, stamina: -50, aff: { nurse: 8, crash: 8 } });
        s.flags.hero_done = true;
        G.album.unlock('hero');
        return { lost: true, hospital: 3, noRating: true, unlockEnding: 'hero' };
      } else {
        return { end: 'hero_dead' };
      }
    } else if (c === 1) {
      G.sfx.hero();
      await result(s, '你把安全帽舉在前面，擋在那對母子前面。\n刀子「鏗」一聲砍在安全帽上。男人愣住的那一秒，旁邊的路人把他撲倒了。\n\n那頂安全帽上留下了一道深深的刀痕。你決定一輩子不換。', { fame: 22, mood: 20, money: 5000, stamina: -15, aff: { nurse: 8, crash: 8 } });
      s.flags.hero_done = true;
      G.album.unlock('hero');
      return { lost: true, noRating: true, unlockEnding: 'hero' };
    } else if (c === 2) {
      await result(s, '你大聲喊所有人往另一邊跑，一邊打 110。三分鐘後警察趕到，壓制了那個男人。\n沒有人受傷。新聞裡沒有你的名字，但那位媽媽在離開前對你點了點頭。', { fame: 5, mood: 12 }, null);
      return { delay: 15 };
    }
    await result(s, '你催了油門，從人群旁邊騎過去。\n後照鏡裡，你看到有人衝上去了。\n\n那天晚上你睡不著。', { mood: -25, flags: { guilt: true } });
    return {};
  };

  S.heroThief = async function (s, ctx) {
    s.flags.hero_thief = true;
    G.sfx.siren();
    await talk(s, null, '「搶劫啊——！」\n\n一個戴口罩的男人抓著女用包包往你這邊狂奔，後面一個胖胖的警察邊跑邊喘：「攔、攔住他——！」\n\n他離你只剩十公尺。');
    const c = await talk(s, 'me', '你手上只有機車和一杯全糖珍奶。', [
      { text: '機車橫過去擋住巷口', cls: 'special' },
      { text: '把手上的珍奶丟過去', cls: 'special' },
      { text: '騎車跟在後面幫警察追' },
      { text: '先送完這單再說' },
    ]);
    G.album.unlock('hero_seen');
    if (c === 0) {
      if (G.chance(0.7)) {
        G.sfx.hero();
        await result(s, '小偷來不及煞車，整個人翻過你的機車，摔進路邊的資源回收桶。\n胖警察終於趕到，喘著氣說：「謝⋯⋯謝謝⋯⋯你⋯⋯可以⋯⋯不要走⋯⋯做個筆錄⋯⋯」', { fame: 15, mood: 15, bike: -10, money: 3000 });
        G.album.unlock('hero');
        s.flags.hero_done = true;
        return { delay: 25, unlockEnding: 'hero' };
      }
      await result(s, '他撞上你的機車，你們兩個一起倒在地上。他爬起來繼續跑，但包包掉了。\n你的機車照後鏡斷了，但失主拿回了包包，一直跟你道謝。', { fame: 8, mood: 8, bike: -18, stamina: -10 });
      return { delay: 15 };
    } else if (c === 1) {
      if (G.chance(0.6)) {
        G.sfx.hero();
        await result(s, '珍奶在空中劃出一道完美的弧線，正中他的後腦。粉圓灑了一地，他踩到粉圓滑倒了。\n\n有人把這段拍下來上傳，標題叫「珍奶之神」。三小時破百萬觀看。', { fame: 25, mood: 25, rating: -0.05, money: 2000 });
        await talk(s, { name: '客人評論', portrait: null }, '「我的珍奶呢？」⭐');
        G.album.unlock('hero');
        s.flags.hero_done = true;
        return { lost: true, noRating: true, unlockEnding: 'hero' };
      }
      await result(s, '珍奶砸在他旁邊的牆上，爆成一朵奶茶色的花。他回頭看了你一眼，跑得更快了。\n你損失了一杯珍奶，和一點尊嚴。', { mood: -5 });
      return { lost: true, noRating: true };
    } else if (c === 2) {
      await result(s, '你騎車跟在後面，一路幫警察報位置。三條巷子後，小偷被前面趕來的警車包夾。\n胖警察拍拍你的肩：「年輕人，有前途。要不要考警察？」', { fame: 6, mood: 10, stamina: -8 });
      return { delay: 18 };
    }
    await result(s, '你騎走了。身後傳來警察的哨音。\n你告訴自己：這不是你的工作。', { mood: -8 });
    return {};
  };

  /* =====================================================
   * 愛情線：夜班護理師 林怡萱
   * 透過「宵夜時段 → 仁愛紀念醫院 護理站」的劇情單推進
   * ===================================================== */
  S.nurseCan = function (s) {
    if (s.flags.nurse_done_today === s.day) return false;
    const st = s.flags.nurse_stage || 0;
    if (st === 0) return true;
    if (st === 1) return s.aff.nurse >= 8;
    if (st === 2) return s.aff.nurse >= 20;
    if (st === 3) return s.aff.nurse >= 40 && (s.ch || 0) >= 8;
    return false;
  };
  S.nurseNote = function (s) {
    const notes = ['備註：麻煩放護理站，謝謝', '備註：辛苦了，雞排不要切', '備註：今天也麻煩你了', '備註：送到之後，可以等我五分鐘嗎？'];
    return notes[Math.min(s.flags.nurse_stage || 0, 3)];
  };

  S.nurseArrive = async function (s, ctx) {
    const st = s.flags.nurse_stage || 0;
    s.flags.nurse_last = s.day;
    s.flags.nurse_done_today = s.day;
    if (st === 0) {
      await talk(s, null, `凌晨的醫院很安靜，只有儀器的嗶嗶聲。護理站的燈是整層樓唯一亮著的地方。`);
      await talk(s, 'nurse', '「啊，鹽酥雞！謝謝你⋯⋯這麼晚還要跑。」\n\n她的眼睛下面有很深的黑眼圈，識別證上寫著「林怡萱」。她接過袋子的時候，很小聲地說：「這是我今天第一餐。」');
      const c = await talk(s, 'me', '現在是凌晨一點。', [
        { text: '「第一餐？那要多吃一點。」' },
        { text: '「你們也辛苦了。」' },
        { text: '「祝您用餐愉快。」（專業模式）' },
      ]);
      if (c === 0) await result(s, '她愣了一下，然後笑了：「你是第一個這樣說的外送員。」', { aff: { nurse: 8 }, mood: 6 }, 'nurse');
      else if (c === 1) await result(s, '「⋯⋯嗯。我們都辛苦了。」她對你點點頭，轉身回到病房。', { aff: { nurse: 6 }, mood: 4 }, 'nurse');
      else await result(s, '「謝謝。」她禮貌地笑了笑。你覺得好像錯過了什麼。', { aff: { nurse: 2 } }, 'nurse');
      s.flags.nurse_stage = 1;
      return { tip: 30 };
    }
    if (st === 1) {
      await talk(s, 'nurse', `「又是你！」她從護理站探出頭。「我就想說今天會不會是你送。」\n\n她從抽屜拿出一瓶運動飲料：「這給你，我們這裡多的。」`);
      const c = await talk(s, 'me', '她今天看起來比上次更累。', [
        { text: '「今天很忙嗎？」' },
        { text: '「下次幫你多加一份地瓜球。」' },
        { text: '把運動飲料推回去：「你比較需要。」' },
      ]);
      if (c === 0) await result(s, '「剛剛有一床病人走了。」她說得很平靜，「習慣了。」\n她低頭看著鹽酥雞，「⋯⋯其實沒有習慣。」\n\n你陪她在走廊站了三分鐘。誰都沒說話。', { aff: { nurse: 12 }, mood: -2 }, 'nurse');
      else if (c === 1) await result(s, '「地瓜球要加梅粉喔！」她終於笑了。「我叫怡萱。你呢？」\n「我叫' + s.name + '。」', { aff: { nurse: 10 }, mood: 8 }, 'nurse');
      else await result(s, '她看著你，然後把飲料塞進你的保溫箱：「我們這裡真的很多啦，笨蛋。」', { aff: { nurse: 9 }, stamina: 10 }, 'nurse');
      s.flags.nurse_stage = 2;
      return { tip: 50 };
    }
    if (st === 2) {
      await talk(s, null, '今天的訂單附了一張手寫紙條，用膠帶黏在袋子上——是她自己在 App 裡備註要店家寫的：\n\n「送餐的' + G.call(s) + '：最近下雨，騎車小心。—— 怡萱」');
      await talk(s, 'nurse', '「看到紙條了？」她有點不好意思。「我、我只是想說你每天都在外面跑⋯⋯」\n\n「對了，我下週一休假。你⋯⋯有在休假嗎？」');
      const c = await talk(s, 'me', '外送員沒有休假這種東西。但是——', [
        { text: '「我可以有。」', cls: 'special' },
        { text: '「要看單量⋯⋯」' },
      ]);
      if (c === 0) { G.sfx.love(); await result(s, '「那就說好了！」她轉身回護理站，你看到她的耳朵紅了。', { aff: { nurse: 18 }, mood: 15 }, 'nurse'); }
      else await result(s, '「也是⋯⋯」她笑了笑，「那等你有空。」\n你騎下坡的時候一直在想，你到底在說什麼。', { aff: { nurse: 6 }, mood: -4 }, 'nurse');
      s.flags.nurse_stage = 3;
      return { tip: 60 };
    }
    // stage 3: 告白
    G.sfx.love();
    await talk(s, 'nurse', '「你可以等我五分鐘嗎？我快交班了。」\n\n五分鐘後，她換下制服，拉著你上了醫院頂樓。天空從深藍色慢慢變成淡紫色。');
    await talk(s, 'nurse', '「我每天凌晨三點都在想，今天的鹽酥雞會不會是你送的。」\n「這樣是不是很奇怪？」');
    const c = await talk(s, 'me', '天快亮了。', [
      { text: '「我每天都會搶醫院的單。」', cls: 'special' },
      { text: '「⋯⋯我們只是外送員和客人吧。」' },
    ]);
    if (c === 0) {
      await result(s, '她笑出聲音，眼淚卻掉下來。「笨蛋。」', { aff: { nurse: 30 }, mood: 30 }, 'nurse');
      s.flags.nurse_stage = 4;
      return { unlockEnding: 'nurse_love', tip: 100 };
    }
    await result(s, '「⋯⋯嗯，也是。」她轉過身去看日出。你們一起站到天全亮，然後各自下樓。', { aff: { nurse: -20 }, mood: -15 }, 'nurse');
    s.flags.nurse_stage = 5; // 錯過了
    return {};
  };

  /** 住院時的護理師劇情 */
  S.nurseHospital = async function (s) {
    if (!s.flags.nurse_stage || s.flags.nurse_hosp) return;
    s.flags.nurse_hosp = true;
    await talk(s, 'nurse', `「⋯⋯${s.name}？」\n\n你睜開眼睛，看到一張熟悉的臉，只是這次她站在病床旁邊，手上拿著點滴。\n「你怎麼會在這裡！？你是不是又騎很快！？」`);
    const c = await talk(s, 'me', '她的表情很生氣，但手在發抖。', [
      { text: '「這次換你送餐給我了。」' },
      { text: '「對不起，讓你擔心了。」' },
    ]);
    if (c === 0) await result(s, '「⋯⋯笨蛋。」她別過頭，但那天晚上，她帶了一份鹽酥雞到你的病床邊。', { aff: { nurse: 15 }, mood: 15 }, 'nurse');
    else await result(s, '她沉默了很久：「⋯⋯答應我，以後騎慢一點。」', { aff: { nurse: 12 }, mood: 10 }, 'nurse');
  };

  /* =====================================================
   * 愛情線：車禍的那個人 陳思遠
   * 主要透過早上的 LINE 訊息、午餐劇情單推進
   * ===================================================== */
  S.crashMorning = async function (s) {
    const st = s.flags.crash_stage || 0;
    if (!st || st >= 4) return false;
    if (s.day <= (s.flags.crash_last || 0)) return false;
    if (st === 2 && s.aff.crash >= 10 && s.day >= s.flags.crash_met_day + 3) {
      s.flags.crash_last = s.day;
      const hit = s.flags.crash_hit;
      await talk(s, null, hit ? '你們約在保險公司樓下的咖啡廳簽和解書。思遠提早二十分鐘到，桌上已經擺好了兩杯咖啡。'
        : '思遠堅持要請你喝咖啡「賠罪」。你們約在信義區的咖啡廳，他提早二十分鐘到，桌上已經擺好了兩杯咖啡。');
      await talk(s, 'crash', '「我不知道你喝什麼，所以點了美式跟拿鐵。」\n他推了推眼鏡，「我在信義區當工程師，每天都叫外送，但從來沒想過送餐的人是什麼樣子。」\n「那天之後，我每次拿到外送都會說謝謝。」');
      const comp = hit ? 6000 : 0;
      const c = await talk(s, 'me', hit ? '和解書上寫著：「雙方同意⋯⋯」' : '他看起來很緊張，咖啡一口都還沒喝。', [
        { text: '「那你現在知道了，我們都很帥。」' },
        { text: '「其實你也不用一直道歉。」' },
        { text: '喝完咖啡就走，不多聊' },
      ]);
      if (c === 0) await result(s, '思遠噗一聲笑出來，咖啡差點噴出來。「⋯⋯對，很帥。」他小聲說。', { aff: { crash: 15 }, mood: 10, money: comp }, 'crash');
      else if (c === 1) await result(s, '「⋯⋯那我可以不是用『肇事者』的身分，再約你喝咖啡嗎？」', { aff: { crash: 18 }, mood: 8, money: comp }, 'crash');
      else await result(s, hit ? '你簽完名就走了。和解金 $6,000 入帳。思遠在後面喊：「騎車小心！」' : '你喝完就走了。思遠在後面喊：「騎車小心！」', { aff: { crash: 2 }, money: comp }, 'crash');
      s.flags.crash_stage = 3;
      return true;
    }
    return false;
  };

  S.crashCan = function (s) {
    return s.flags.crash_stage === 3 && s.aff.crash >= 30 && s.day > (s.flags.crash_last || 0) && s.flags.crash_done_today !== s.day;
  };
  S.crashArrive = async function (s) {
    s.flags.crash_last = s.day;
    s.flags.crash_done_today = s.day;
    G.sfx.love();
    await talk(s, 'crash', '你到了 32 樓，思遠已經在大廳等了。管理員伯伯對你使了個眼色。\n\n「我點了兩個，一個給你。你中午一定又沒吃。」\n「然後⋯⋯那個，我想問你一件事。」');
    await talk(s, 'crash', '「我們認識是因為我開車門撞到你。」\n「這是我人生做過最糟的事。」\n「但也是⋯⋯最好的事。」\n\n「下次不是理賠，是約會。可以嗎？」');
    const c = await talk(s, 'me', '大廳的人都在假裝沒在看。', [
      { text: '「這次換你負全責了。」', cls: 'special' },
      { text: '「⋯⋯我還要送下一單。」' },
    ]);
    if (c === 0) {
      await result(s, '思遠的臉紅到耳根。管理員伯伯在旁邊默默鼓掌。', { aff: { crash: 30 }, mood: 30 }, 'crash');
      s.flags.crash_stage = 4;
      return { unlockEnding: 'crash_love', tip: 200 };
    }
    await result(s, '「啊，對，對不起。」他把便當塞給你，「那⋯⋯騎車小心。」\n你在電梯裡打開便當，裡面放了一張寫著「加油」的便利貼。', { aff: { crash: -10 }, mood: -5, stamina: 15 }, 'crash');
    s.flags.crash_stage = 5;
    return { tip: 50 };
  };

  S.crashHospital = async function (s) {
    if (!s.flags.crash_met || s.flags.crash_visit || s.flags.crash_met_day === s.day) return;
    s.flags.crash_visit = true;
    await talk(s, 'crash', '病房門被敲了兩下。思遠探頭進來，手上提著一大袋水果。\n「我、我看到你的 IG 限動⋯⋯又住院了？」\n「這次不是我撞的喔！」');
    await result(s, '他削了一顆蘋果，切成兔子的形狀。削得很醜。', { aff: { crash: 12 }, mood: 12, stamina: 5 }, 'crash');
  };

  /* =====================================================
   * 主線
   * ===================================================== */
  S.mainMorning = async function (s) {
    if (s.flags.protest && !s.flags.protest_done) {
      s.flags.protest_done = true;
      await talk(s, null, '上午十點，平台總部樓下聚集了上百台機車。大家按著喇叭，聲音大到整條街都在震。\n\n有記者把麥克風遞到你面前：「請問你為什麼來參加？」');
      const c = await talk(s, 'me', '鏡頭對著你。', [
        { text: '「因為我們不是演算法裡的一個數字。」' },
        { text: '「⋯⋯我只是想付得出房租。」' },
      ]);
      if (c === 0) await result(s, '這段訪問被剪進晚間新聞。外送群組有人把你的截圖設成頭貼。', { fame: 8, mood: 15 });
      else await result(s, '這句話被做成了新聞標題。很多人轉發，留言說：「我也是。」', { fame: 6, mood: 10 });
      await talk(s, null, '傍晚，平台發出新公告：「運費調整暫緩實施。」\n\n不知道是不是因為你們。但你寧願相信是。');
      s.flags.pay_cut = false;
      s.flags.pay_cut_reverted = true;
      return true;
    }
    return false;
  };
})(window.G);
