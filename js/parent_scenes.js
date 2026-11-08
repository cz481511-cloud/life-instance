/* 人生副本 — 爸媽篇：地點場景與「應對」事件（校門口、公園、夜市、全連、補習班、工作、家裡、派出所、親戚聚餐） */
(function (G) {
  const PS = (G.ParentScenes = {});
  const St = () => G.Stage;
  const H = () => G.Parent._h;

  /* extra NPC models (re-used mini characters) */
  const X = {
    stranger: 'character-male-c', guard: 'character-worker', auntie: 'character-female-a', grandma: 'character-female-d',
    vendor: 'character-male-b', thief: 'character-worker', boss: 'character-male-c', richDad: 'character-male-a',
    kidA: 'character-male-f', kidB: 'character-female-d', kidC: 'character-male-a', cop: 'character-male-b', relative: 'character-female-a',
  };

  /** show a room with me + kid and extra actors */
  function stage(room, extra, opts) {
    const h = H();
    opts = opts || {};
    const list = [];
    if (!opts.noMe) list.push(Object.assign({ id: 'me', model: h.meModel(), x: -1.1, z: 1.1, rot: 0.45, height: 1.8 }, opts.me || {}));
    if (!opts.noKid) list.push(Object.assign({ id: 'kid', model: h.kidModel(), x: 0.0, z: 1.5, rot: 0.15, height: h.kidH() }, opts.kid || {}));
    St().show(room, list.concat(extra || []), opts);
    if (opts.caption) G.ui.scene({ cover: null, caption: opts.caption });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* =====================================================
   * Encounters by location. Each: { id, min, max, cond?, run(h) }
   * ===================================================== */
  const E = {};

  /* ---------- 🏫 校門口 ---------- */
  E.school = [
    { id: 'bmw', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('schoolgate', [
        { id: 'car', model: 'suv-luxury', x: 1.6, z: 3.6, rot: Math.PI / 2, height: 1.7 },
        { id: 'rich', model: X.richDad, x: 3.4, z: 2.6, rot: -1.2, height: 1.82 },
        { id: 'guard', model: X.guard, x: 0.6, z: 0.2, rot: 0.6, height: 1.75 },
      ], { caption: '放學時間・校門口' });
      St().act('rich', 'idle');
      await say(null, '放學時間，一台黑色休旅車直接停在校門口正中間，雙黃燈閃個不停。\n後面的機車全卡住了，喇叭聲此起彼落。\n警衛伯伯敲了兩次車窗，車主搖下來說：「我等一下就走啦！」');
      const c = await ask(ME(), `${s.kidName}拉著你的手：「${h.meTitle()}，他是不是違規？」`, [
        { text: '走過去：「先生，後面都卡住了，麻煩移一下。」' }, { text: '默默拍照，回家上網檢舉' }, { text: '帶孩子繞去側門' }]);
      if (c === 0) {
        await St().move('me', 2.4, 2.4, 1.2); St().face('rich', 'me');
        const R = NPC('休旅車家長', X.richDad);
        if (G.chance(0.5)) {
          St().act('rich', 'emote-no');
          await say(R, '「你誰啊？我繳的稅比你多，停一下會怎樣？」\n他下車了，比你高一個頭，手上戴著金錶。');
          const c2 = await ask(ME(), '後面的家長都在看。', [
            { text: '「孩子都在看，我們用講的就好。」' }, { text: '「繳稅多就可以停紅線？那我去叫警察。」', cls: 'angry' }]);
          if (c2 === 0) { St().act('rich', 'idle'); await res(R, '他愣了一下，回頭看到自己的兒子正躲在車窗後面看。\n他「嘖」了一聲，把車開走了。\n後面的機車騎士對你比了一個讚。', { rep: 6, conduct: 5, bond: 3 }); }
          else { St().act('rich', 'attack-melee-right', { once: true, restart: true }); G.ui.fx('shake'); await res(null, '他推了你一下：「叫啊！」\n警衛伯伯衝過來把你們隔開，派出所的警察十分鐘後到了，開了一張 $900 的罰單——給他。\n他離開前瞪著你：「我記住你了。」', { rep: 4, stress: 10, conduct: 3 }); s.flags.richEnemy = true; }
        } else {
          await res(R, '他尷尬地笑了一下：「好啦好啦，馬上走。」\n後面的家長有人小聲鼓掌。', { rep: 5, conduct: 4 });
        }
      } else if (c === 1) {
        await res(null, '你上傳了檢舉照片。一週後，家長群組裡蔡媽媽問：「是誰檢舉我老公的車？這麼沒人情味？」\n原來那是蔡董。', { rep: -5, conduct: 4, stress: 4 });
        G.Chat.burst(s, 'parents', [['蔡媽媽', '有人很閒去檢舉別人停車耶🙂 同一個學校的不能互相體諒一下嗎'], ['陳爸爸', '紅線本來就不能停吧'], ['蔡媽媽', '（已收回訊息）']]);
      } else {
        await res(KID(), `側門要多走十分鐘。${s.kidName}一路上問：「為什麼他可以停那裡？」\n你想了很久，說：「因為有些大人，小時候沒有人教。」`, { bond: 3, conduct: 3, stress: 2 });
      }
    } },
    { id: 'stranger', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('schoolgate', [{ id: 'str', model: X.stranger, x: 3.2, z: 0.4, rot: -1.4, height: 1.76 }], { caption: '放學・校門口', kid: { x: 1.6, z: 0.8, rot: 1.2 }, me: { x: -3.6, z: 1.6, rot: 0.9 } });
      await say(null, `你停好機車走過來，看到一個不認識的阿伯蹲在${s.kidName}面前，手上拿著一包糖果在跟${h.callKid()}說話。\n${s.kidName}伸出手——`);
      St().move('kid', 2.4, 0.6, 1.6);
      const c = await ask(ME(), '你的心跳到喉嚨。', [{ text: '衝過去把孩子拉回來！', cls: 'angry' }, { text: '大聲問：「請問您是哪位？」' }, { text: '先觀察一下' }]);
      const good = G.chance(0.6); // 60%: 其實是同學阿公
      const STR = NPC('阿伯', X.stranger);
      if (c === 0) {
        const r = await St().reflex({ title: '衝過去！', text: '看到「現在！」就按空白鍵，把孩子拉到身後。', btn: '拉回來！', ok: '拉到了！' });
        if (r === 'win') { await St().move('me', 1.9, 0.9, 0.5); St().move('kid', 0.6, 1.4, 0.5); }
        else { St().act('me', 'die', { once: true, restart: true }); await res(null, '你衝太快，在人行道上滑了一跤，整個人趴在地上。\n全校放學的小朋友都在看。', { stress: 6, rep: -2 }); }
        if (good) await res(STR, `「啊⋯⋯歹勢歹勢！我是宥宥的阿公啦，我看${h.callKid()}一個人在等，想說分${h.callKid()}吃糖。」\n你們兩個都很尷尬。${s.kidName}說：「${h.meTitle()}，你好丟臉。」\n但那天晚上，${h.callKid()}很認真地聽你講「不能拿陌生人的東西」。`, { bond: 4, conduct: 6, rep: -1 });
        else { St().act('str', 'walk'); await St().move('str', 9, 0.2, 1.2); await res(null, `阿伯看到你衝過來，轉身就走，越走越快，最後在轉角跑了起來。\n你報了警。警察說最近附近有通報可疑人士。\n${s.kidName}抱著你的腿一直沒放。`, { bond: 10, conduct: 6, stress: 8 }); }
      } else if (c === 1) {
        St().face('str', 'me');
        if (good) await res(STR, `「我是宥宥的阿公啦！」他笑著站起來，「你是${s.kidName}的${h.meTitle()}喔？你們家囝仔很有禮貌，都會說阿公好。」\n他也塞了一顆糖給你。`, { rep: 3, conduct: 4 });
        else { St().move('str', 9, 0.2, 1.4); await res(null, `阿伯沒有回答，把糖果塞回口袋就走了。\n你把${s.kidName}拉過來，${h.callKid()}問：「他是壞人嗎？」\n「我不知道。所以我們不拿。」`, { conduct: 8, bond: 4, stress: 5 }); }
      } else {
        if (good) await res(KID(), `${s.kidName}拿了糖，還說了「謝謝阿公」。原來是宥宥的阿公。\n但你心裡一直在想：如果不是呢？`, { stress: 6, conduct: -2 });
        else { St().act('str', 'walk'); await res(null, `阿伯牽起${s.kidName}的手要往外走——你這才衝過去。\n警衛伯伯也跑了過來。阿伯甩開手跑掉了。\n那天晚上你一夜沒睡，${s.kidName}也是。`, { stress: 16, bond: 4, conduct: 4 }); }
      }
    } },
    { id: 'late', min: 1, max: 4, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('schoolgate', [{ id: 'guard', model: X.guard, x: 1.2, z: 0.3, rot: 0.3, height: 1.75 }], { caption: '下午 5:10・校門口', kid: { x: 0.2, z: 0.4, rot: 0.3, anim: 'sit' }, me: { x: -6, z: 2.2, rot: 1.2 } });
      await say(null, `你遲到了四十分鐘。${s.job === 'delivery' ? '最後一單的客人一直不下樓。' : s.job === 'office' ? '主管五點整開了一個「很快」的會。' : '店裡突然來了二十杯的團購。'}\n校門口只剩下${s.kidName}一個人坐在台階上，警衛伯伯陪著${h.callKid()}。`);
      await St().move('me', -0.8, 1.2, 1.4);
      const c = await ask(KID(), `${s.kidName}抬頭看你，眼睛紅紅的，什麼都沒說。`, [
        { text: '蹲下來抱住：「對不起，是我不好。」' }, { text: '「我在工作啊，你不能體諒一下嗎？」', cls: 'angry' }, { text: '「走！我們去吃雞排。」' }]);
      const GU = NPC('警衛伯伯', X.guard);
      if (c === 0) { St().act('kid', 'emote-yes'); await res(KID(), `「我以為你不要我了。」\n「怎麼可能。」\n警衛伯伯在旁邊說：「${h.callKid()}一直說你一定會來。」`, { bond: 8, stress: 4 }); }
      else if (c === 1) { St().act('kid', 'emote-no'); await res(GU, `警衛伯伯咳了一聲：「囝仔等了四十分鐘，一直看門口喔。」\n${s.kidName}一路上都沒說話。`, { bond: -9, stress: 4 }); }
      else { await res(KID(), `${s.kidName}吸著鼻涕吃了一整塊雞排，最後說：「下次遲到要買兩塊。」\n你點頭，心想這個談判能力不知道像誰。`, { bond: 5, money: -90 }); }
      if (!s.flags.guardFriend) { s.flags.guardFriend = true; await say(GU, '離開前警衛伯伯跟你說：「以後晚到打給我，我陪囝仔等。」\n他給了你一張寫著電話的紙條。'); }
    } },
    { id: 'bully6', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      const kh = h.kidH() + 0.28;
      stage('schoolgate', [
        { id: 'b1', model: X.kidA, x: 1.4, z: 0.6, rot: -1.6, height: kh }, { id: 'b2', model: X.kidB, x: 0.6, z: -0.2, rot: -0.6, height: kh - 0.05 }, { id: 'b3', model: X.kidC, x: 0.8, z: 1.3, rot: -2.4, height: kh + 0.04 },
      ], { caption: '放學・圍牆邊', kid: { x: 0.0, z: 0.6, rot: 1.0 }, me: { x: -5.5, z: 2.0, rot: 1.1 } });
      St().act('b1', 'emote-no');
      await say(null, `你遠遠看到三個高年級把${s.kidName}圍在圍牆邊。\n其中一個伸手：「零用錢拿出來啊，不然明天你就知道。」\n${s.kidName}的手在發抖，伸進口袋。`);
      const c = await ask(ME(), '他們還沒看到你。', [{ text: '大吼：「你們在幹嘛！」衝過去', cls: 'angry' }, { text: '先去找警衛和導師' }, { text: '先不出面，看孩子怎麼處理', cls: 'special' }]);
      if (c === 0) {
        await St().move('me', -0.8, 1.4, 0.8);
        ['b1', 'b2', 'b3'].forEach((id, i) => St().move(id, 8 + i, -0.5 + i, 1.0));
        await res(null, `三個人一哄而散。你抱住${s.kidName}，${h.callKid()}才開始哭。\n隔天你去學校，學務處說會「加強宣導」。\n你在聯絡簿上寫了三頁。`, { bond: 8, stress: 8, rep: 2 });
      } else if (c === 1) {
        await res(NPC('導師', h.M.teacher), '你帶著警衛和導師回來時，他們已經拿到 $50 跑了。\n但因為有你通報，學校調了監視器，三個人隔天被叫到學務處，錢也還回來了。', { conduct: 5, rep: 5, stress: 5, bond: 2 });
      } else {
        if (s.flags.taekwondo || s.conduct >= 60) {
          St().act('kid', 'emote-no');
          await res(KID(), `${s.kidName}突然把手抽出來，大聲說：「我不要！我要告訴老師！」\n${s.flags.taekwondo ? '還擺出了跆拳道的架勢。' : ''}三個高年級愣住，罵了一句就走了。\n你走過去，${h.callKid()}看到你：「${h.meTitle()}你都看到了？」「看到了。你超帥。」`, { bond: 10, conduct: 10 });
        } else {
          await res(null, `${s.kidName}把 $50 交了出去。三個人笑著走了。\n你走過去，${h.callKid()}嚇了一跳，然後哭了：「你為什麼不幫我⋯⋯」`, { bond: -8, conduct: 2, stress: 6 });
          const c2 = await ask(ME(), '這一課要怎麼教？', [{ text: '「我在。下次大聲喊，我會衝過來。」' }, { text: '「明天開始學跆拳道。」' }]);
          if (c2 === 0) await res(KID(), `${s.kidName}點頭，抱著你的手臂走了一整條街。`, { bond: 7 });
          else { s.flags.taekwondo = true; await res(null, '你幫孩子報了跆拳道。第一堂課就被教練說「很有天分」——應該每個人都這樣說。', { money: -2800, conduct: 4 }); }
        }
      }
    } },
    { id: 'linmom', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('schoolgate', [{ id: 'lin', model: h.M.linMom, x: 1.6, z: 1.0, rot: -1.2, height: 1.75 }, { id: 'yo', model: X.kidA, x: 2.4, z: 1.4, rot: -1.2, height: h.kidH() }], { caption: '校門口・家長八卦區' });
      const LIN = NPC('林媽媽', h.M.linMom);
      St().act('lin', 'emote-yes');
      await say(LIN, `「欸～${s.kidName}${h.meTitle()}！好久不見～」\n「我們家宥宥這學期報了資優班、英檢、鋼琴檢定，好累喔～你們家${s.kidName}有在補什麼嗎？」`);
      const c = await ask(ME(), `${s.kidName}站在你旁邊，低著頭在踢地上的石頭。`, [
        { text: '「我們家的在學怎麼當一個快樂的人。」', cls: 'special' }, { text: '「我們也在考慮資優班耶。」（其實沒有）' }, { text: '「宥宥看起來好累，還好嗎？」' }]);
      if (c === 0) { St().act('lin', 'emote-no'); await res(LIN, `林媽媽的笑容卡住了一秒：「⋯⋯呵呵，也是啦，各家有各家的教法～」\n回家路上，${s.kidName}說：「${h.meTitle()}，你剛剛好像在打嘴砲。」「對。」`, { bond: 6, rep: -4, stress: -3 }); }
      else if (c === 1) { await res(LIN, '「真的嗎！那我介紹你我們的老師！一期只要 $24,000 喔～」\n她馬上把你拉進一個叫「資優菁英家長」的群組。', { rep: 4, stress: 6 }); G.Chat.burst(s, 'parents', [['林媽媽', `歡迎${s.name}加入菁英家長群❤️`], ['林媽媽', '【資優班報名表】下週截止喔～']]); }
      else { St().act('yo', 'emote-no'); await res(NPC('宥宥', X.kidA), `宥宥突然開口：「我想要跟${s.kidName}一樣放學可以去公園玩。」\n林媽媽臉紅了，拉著宥宥走掉。\n那天晚上，林媽媽私訊你：「⋯⋯謝謝你剛剛那樣問。」`, { rep: 6, conduct: 3 }); s.flags.linSoft = true; }
    } },
    { id: 'teen_far', min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('schoolgate', [{ id: 'f1', model: X.kidB, x: 1.6, z: 0.4, rot: -1, height: h.kidH() }, { id: 'f2', model: X.kidC, x: 2.4, z: 0.9, rot: -1.6, height: h.kidH() + 0.05 }], { caption: '國中校門口', sign: '臺北市立幸福國民中學', kid: { x: 0.9, z: 0.6, rot: 1.2 }, me: { x: -3.2, z: 2.2, rot: 0.9 } });
      await say(KID(), `${s.kidName}看到你，表情僵住了。${h.callKid()}跟同學說了什麼，然後走過來小聲說：\n「${h.meTitle()}⋯⋯你以後可以停遠一點嗎？停到轉角就好。」`);
      const c = await ask(ME(), '你的機車是今年剛換的。你一直覺得它很帥。', [{ text: '「好啊。」然後真的停到兩條街外' }, { text: '大聲喊：「寶貝！' + s.kidName + '！' + h.meTitle() + '來接你囉！」', cls: 'angry' }, { text: '「為什麼？」' }]);
      if (c === 0) await res(null, `從那天起你都停在兩條街外的全家門口。\n一個月後的某天，${s.kidName}自己走到校門口等你：「⋯⋯其實不用停那麼遠啦。」`, { bond: 8, stress: 2 });
      else if (c === 1) { St().act('f1', 'emote-yes'); await res(KID(), `全校都聽到了。${s.kidName}的同學笑到彎腰。\n${s.kidName}三天沒跟你說話。但你發現${h.callKid()}的 IG 限動是你的背影，配字「丟臉死了🙄」。`, { bond: -3, stress: -4 }); }
      else await res(KID(), `「⋯⋯因為同學會說『你這麼大還要人接喔』。」\n「那我改成『剛好路過』。」\n${s.kidName}笑了：「好爛的藉口。」`, { bond: 6, conduct: 2 });
    } },
  ];

  /* ---------- 🎡 公園 / 夜市 ---------- */
  E.park = [
    { id: 'slide', min: 1, max: 2, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('park', [{ id: 'hog', model: X.kidA, x: 3.6, z: -2.0, rot: 0.3, height: h.kidH() + 0.1 }, { id: 'hm', model: X.auntie, x: -1.2, z: -0.7, rot: 0, height: 1.72, anim: 'sit' }], { caption: '週末・河濱公園遊戲區', kid: { x: 2.4, z: 0.6, rot: -2.6 } });
      St().act('hog', 'emote-yes');
      await say(null, `一個小胖子霸佔溜滑梯頂端二十分鐘，誰上來就推誰。\n他媽媽坐在長椅上滑手機，偶爾抬頭說一句：「寶貝要分享喔～」然後繼續滑。\n${s.kidName}被推下來兩次了。`);
      const c = await ask(ME(), `${s.kidName}看著你，等你做點什麼。`, [{ text: '走去跟他媽媽說' }, { text: '直接走到溜滑梯下面，跟小胖子說話' }, { text: `「我們去玩鞦韆。」帶${s.kidName}離開` }]);
      const HM = NPC('滑手機的媽媽', X.auntie);
      if (c === 0) { St().face('me', 'hm'); await St().move('me', -0.4, 0.4, 1.0); await res(HM, '「小孩子玩一玩而已啊，你那麼計較幹嘛？」\n她頭都沒抬。\n你轉頭，發現她手機上開著的是一個育兒 Podcast：〈如何教孩子同理心〉。', { stress: 8, rep: -1 }); }
      else if (c === 1) {
        await St().move('me', 3.0, -0.4, 1.2);
        const c2 = await ask(NPC('小胖子', X.kidA), '「這是我的！我先來的！」', [{ text: '「那你當隊長，每個人溜一次換你。」', cls: 'special' }, { text: '「下來。現在。」用最低的聲音', cls: 'angry' }]);
        if (c2 === 0) { St().act('hog', 'emote-yes'); await res(null, `小胖子愣了一下，然後很有架勢地喊：「排隊！一個一個來！」\n十分鐘後他變成整個遊戲區最受歡迎的人。${s.kidName}說：「${h.meTitle()}你好會。」`, { bond: 8, conduct: 6 }); }
        else { St().act('hog', 'emote-no'); await res(HM, '小胖子哭著溜下來。他媽媽終於放下手機：「你兇我兒子幹嘛！我要拍下來！」\n你在別人的限時動態裡紅了一天。', { rep: -6, stress: 8, bond: 3 }); }
      } else await res(KID(), `${s.kidName}在鞦韆上盪得很高：「${h.meTitle()}，我不跟壞人搶。」\n你覺得這句話好像哪裡怪怪的，但很欣慰。`, { bond: 5, conduct: 3, stress: -4 });
    } },
    { id: 'dog', min: 1, max: 4, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('park', [{ id: 'own', model: X.vendor, x: 5.6, z: 0.8, rot: -1.4, height: 1.8 }], { caption: '公園步道', kid: { x: 1.2, z: 1.8, rot: 1.4 } });
      await say(null, `一隻沒繫繩的大黑狗突然從草叢衝出來，直直朝${s.kidName}跑過去！\n狗主人在遠處喊：「牠不會咬人啦——」`);
      const r = await St().reflex({ title: '擋住！', text: `衝到${s.kidName}前面！看到「現在！」按空白鍵。`, btn: '擋在前面！', ok: '擋住了！' });
      const OWN = NPC('狗主人', X.vendor);
      if (r === 'win') { await St().move('me', 0.6, 1.9, 0.4); St().act('me', 'emote-no'); await say(null, `你一步跨到${s.kidName}前面，張開手。大黑狗在你面前急煞，聞了聞你的褲子，打了一個噴嚏，跑走了。`); }
      else { St().act('kid', 'emote-no'); St().act('me', 'die', { once: true, restart: true }); await say(null, `你還沒跑到，大黑狗已經撲上${s.kidName}——舔了${h.callKid()}一臉口水。\n你在旁邊跌倒，褲子全是泥。`); ap(h, { stress: 6 }); }
      await St().move('own', 2.4, 1.2, 1.2);
      const c = await ask(OWN, '「齁，就說牠不會咬人。你們在緊張什麼？」', [{ text: '「公園規定要繫繩。」冷靜指著告示牌' }, { text: '「不會咬人？那你被咬過嗎！」', cls: 'angry' }, { text: `先問${s.kidName}：「有沒有怎樣？」` }]);
      if (c === 0) await res(OWN, '他看了告示牌一眼，嘟囔著把狗叫回來繫上繩子。\n「⋯⋯現在的人都很玻璃心。」', { conduct: 5, rep: 2 });
      else if (c === 1) { St().act('own', 'emote-no'); await res(null, '你們吵到公園管理員過來。狗主人被開了一張 $3,000 罰單。\n他離開前說：「你小孩以後一定很怕狗。」\n你轉頭，發現孩子正在跟另一隻柴犬玩。', { stress: 8, rep: 3 }); }
      else { St().act('kid', 'emote-yes'); await res(KID(), `「沒事啊！牠好可愛！${h.meTitle()}我們可以養狗嗎？」\n你看了一眼存款。「⋯⋯我們先養一盆仙人掌。」`, { bond: 6, stress: -2 }); }
    } },
    { id: 'bike', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('park', [], { caption: '河濱自行車道', kid: { x: 0.6, z: 2.4, rot: 1.57 }, me: { x: -0.4, z: 2.4, rot: 1.57 } });
      await say(null, `今天要拆掉輔助輪。你扶著腳踏車的後座跑，${s.kidName}大喊：「不要放手喔！不要放手喔！」`);
      const c = await ask(ME(), '你已經跑了三百公尺，喘到快死了。', [{ text: '偷偷放手' }, { text: '一直扶著，跑到天荒地老' }, { text: '「我放手了喔！」先講再放' }]);
      if (c === 0) {
        St().move('kid', 7, 2.6, 2.0);
        const fall = G.chance(0.45);
        if (fall) { await sleep(900); St().act('kid', 'die', { once: true, restart: true }); await res(KID(), `${s.kidName}自己騎了二十公尺，回頭發現你不在——然後摔進草叢。\n膝蓋流血，${h.callKid()}哭著喊：「你說不放手的！騙子！」\n回家路上${h.callKid()}又騎了一次，這次沒有摔。`, { bond: 2, conduct: 4, stress: 4 }); }
        else { await res(KID(), `${s.kidName}自己騎了一百公尺才發現你沒在後面，然後尖叫——但沒有停。\n「${h.meTitle()}！！我會騎了！！」\n你在後面錄影，手在抖。`, { bond: 10, stress: -6 }); }
      } else if (c === 1) { await res(null, '你扶著跑了兩公里，最後躺在草地上看天空。\n孩子還是不會騎，但你們都笑到不行。\n隔天你腰痛到請假。', { bond: 6, stress: 6, money: -1200 }); }
      else { St().move('kid', 6, 2.6, 2.4); await res(KID(), `「不要——好啦好啦——」\n${s.kidName}抖抖的騎走了，騎得歪歪的，但沒有摔。\n「${h.meTitle()}你有講耶！」${h.callKid()}好像覺得這件事很重要。`, { bond: 8, conduct: 4 }); }
    } },
    { id: 'grandma', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('park', [{ id: 'ama', model: X.grandma, x: 2.0, z: 1.0, rot: -1.6, height: 1.6 }], { caption: '公園・傍晚' });
      const A = NPC('路過的阿嬤', X.grandma);
      await say(A, `「哎唷，囝仔穿這樣會感冒啦！」\n一個你完全不認識的阿嬤走過來，開始脫自己的外套要給${s.kidName}穿。\n「你是怎麼當${h.meTitle()}的？手這麼冰！」`);
      const c = await ask(ME(), '現在是 27 度。', [{ text: '「謝謝阿嬤，我們等一下就回家了。」' }, { text: '「阿嬤，現在 27 度喔。」' }, { text: '收下外套，順便跟阿嬤聊天' }]);
      if (c === 0) await res(A, '阿嬤滿意地點頭，然後從包包裡拿出一顆橘子塞給孩子。\n「要多吃水果，你看你瘦得跟猴子一樣。」', { rep: 1, stress: -2 });
      else if (c === 1) await res(A, '「27 度也會感冒！我孫子就是這樣感冒的！」\n她跟你講了二十分鐘她孫子的病史。你知道了她孫子在新竹科學園區上班，月薪十二萬。', { stress: 6 });
      else { s.flags.ama = true; await res(A, `你們聊了一個小時。阿嬤一個人住，孫子很少回來。\n離開前她說：「下禮拜還來喔，我帶滷蛋給${s.kidName}。」\n後來你們每個禮拜都去。`, { bond: 6, conduct: 8, stress: -5 }); }
    } },
    { id: 'vape', min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('park', [{ id: 'f1', model: X.kidC, x: 3.4, z: -0.8, rot: -2.2, height: h.kidH() + 0.06 }, { id: 'f2', model: X.kidB, x: 2.6, z: -1.6, rot: -2.6, height: h.kidH() }],
        { caption: '晚上九點・公園角落', night: true, kid: { x: 2.2, z: -0.4, rot: -1.6 }, me: { x: -4.6, z: 2.2, rot: 1.0 } });
      await say(null, `你下班繞去公園想找${s.kidName}——${h.callKid()}說在同學家讀書。\n公園角落，${s.kidName}和兩個同學坐在溜滑梯下面，一陣水果味的白煙飄出來。\n其中一個人把電子菸遞給${s.kidName}。`);
      const c = await ask(ME(), `${s.kidName}還沒看到你。${h.callKid()}的手停在半空中。`, [
        { text: '走過去，當著同學的面把電子菸沒收', cls: 'angry' }, { text: `傳 LINE：「${h.meTitle()}在公園門口，要不要一起買宵夜？」`, cls: 'special' }, { text: '回家等，晚上再談' }]);
      if (c === 0) {
        await St().move('me', 1.4, 0.4, 1.4); St().act('kid', 'emote-no');
        await res(KID(), `「你跟蹤我！？」\n同學一哄而散。${s.kidName}站在原地，臉漲紅：「你讓我在大家面前很丟臉！」\n電子菸在你手裡，是芒果口味的。`, { bond: -10, conduct: 8, stress: 10 });
      } else if (c === 1) {
        await sleep(600); St().act('kid', 'idle');
        await res(KID(), `${s.kidName}低頭看了手機很久，把電子菸推回去，跟同學說了什麼就走了。\n五分鐘後${h.callKid()}出現在公園門口：「⋯⋯我要吃鹽酥雞。」\n你們誰都沒提那陣白煙。但回家路上${h.callKid()}說：「那個其實很難聞。」`, { bond: 8, conduct: 8 });
      } else {
        const c2 = await ask(KID(), `晚上十一點，${s.kidName}回家了，身上有芒果味。`, [{ text: '「我今天在公園看到你了。」' }, { text: '假裝什麼都不知道' }]);
        if (c2 === 0) await res(KID(), `${s.kidName}僵了很久：「⋯⋯我沒有吸。」\n「我相信你。但如果有一天你想試，先跟我說，我們一起查它會怎樣。」\n${h.callKid()}看著你，好像第一次發現你也是一個人。`, { bond: 6, conduct: 10 });
        else await res(null, '你什麼都沒說。一個月後，你在洗衣機裡發現了一支芒果口味的電子菸。', { conduct: -10, stress: 8 });
      }
    } },
  ];
  E.night = [
    { id: 'lost', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('nightmarket', [{ id: 'fish', model: X.vendor, x: 3.4, z: -1.4, rot: 0, height: 1.8 }], { caption: '週末夜市・人山人海' });
      await say(null, `你在雞排攤付錢，轉頭——${s.kidName}不見了。\n四周全是人，有人在喊「借過借過」，香腸攤的音響在放〈愛情恰恰〉。`);
      St().move('kid', 9, -0.5, 1.0);
      await sleep(700);
      const c = await ask(ME(), '你的血液全部衝到腦袋。', [{ text: '去服務台廣播' }, { text: `站上椅子大喊${s.kidName}的名字` }, { text: '冷靜想：孩子最可能去哪？', cls: 'special' }]);
      const V = NPC('撈金魚攤老闆', X.vendor);
      if (c === 0) { await res(null, `服務台的阿姨用夜市最大的音量廣播：「${s.kidName}小朋友，你的${h.meTitle()}在服務台等你——」\n十分鐘後，撈金魚攤的老闆把${h.callKid()}帶過來了，${h.callKid()}手上拿著一袋金魚。`, { stress: 10, bond: 2 }); }
      else if (c === 1) { St().act('me', 'emote-no'); await res(null, `你站上塑膠椅，用盡全力大喊。整條夜市安靜了兩秒。\n然後撈金魚攤那邊傳來一個小小的聲音：「我在這裡——」\n周圍的人開始鼓掌。你從椅子上下來的時候腳在抖。`, { stress: 8, bond: 6, rep: -1 }); }
      else { await res(ME(), `你想到${h.callKid()}剛剛一直盯著撈金魚的攤子看。\n你擠過去——${s.kidName}蹲在水池旁邊，看金魚看得出神，完全不知道自己走丟了。`, { bond: 6, stress: 3 }); }
      St().show('nightmarket', [{ id: 'me', model: h.meModel(), x: 2.2, z: -0.6, rot: 0.3, height: 1.8 }, { id: 'kid', model: h.kidModel(), x: 3.2, z: -1.2, rot: Math.PI, height: h.kidH(), anim: 'sit' }, { id: 'fish', model: X.vendor, x: 4.4, z: -1.6, rot: -0.6, height: 1.8 }]);
      const c2 = await ask(KID(), `「${h.meTitle()}你怎麼在發抖？」`, [{ text: '緊緊抱住，什麼都不說' }, { text: '「你知不知道我差點嚇死！」' }, { text: '教孩子：走丟了要站在原地，找穿制服的人' }]);
      if (c2 === 0) await res(null, `${s.kidName}被抱得有點喘不過氣，但沒有掙扎。`, { bond: 8 });
      else if (c2 === 1) await res(KID(), `${s.kidName}的眼淚掉下來：「對不起⋯⋯」\n回家的路上${h.callKid()}一直緊緊抓著你的衣角。`, { bond: -2, conduct: 4 });
      else await res(V, '老闆在旁邊點頭：「這個好，要教。我們夜市一個晚上會走丟五個。」\n他送了孩子一條金魚。', { conduct: 6, bond: 3 });
    } },
    { id: 'thief', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('nightmarket', [{ id: 'thief', model: X.thief, x: 0.6, z: 0.6, rot: 2.4, height: 1.78 }], { caption: '夜市・人潮最擠的路口' });
      await say(null, '人潮擠到你動不了。有人撞了你一下：「歹勢。」\n你下意識摸口袋——錢包不見了。\n那個戴帽子的男人正在往人群外面擠。');
      const c = await ask(ME(), `${s.kidName}也看到了：「${h.meTitle()}！是他！」`, [{ text: '追上去！', cls: 'angry' }, { text: '大喊：「抓小偷！！」' }, { text: '算了，抱緊孩子，錢再賺就有' }]);
      if (c === 0) {
        St().face('me', 'thief'); St().move('thief', 2.2, 1.6, 0.6); await St().move('me', 1.2, 1.4, 0.6); St().face('thief', 'me');
        const r = await St().fight({ you: 'me', foe: 'thief', foeName: '扒手', hp: s.flags.taekwondo ? 4 : 3, foeHp: 2, speed: 1.0 });
        if (r === 'win') { G.sfx.hero(); await res(null, `扒手倒在雞排攤前面，你的錢包從他外套掉出來——旁邊還有另外四個。\n夜市的攤販全部圍過來鼓掌，雞排攤老闆送你一塊雞排。\n${s.kidName}看著你，眼睛在發光。`, { bond: 10, fame: 2, rep: 6, stress: 4, conduct: 2 }); s.flags.nightHero = true; }
        else { await res(null, `他一個肘擊把你打退，鑽進人群不見了。\n你坐在地上，${s.kidName}蹲在你旁邊：「${h.meTitle()}你流鼻血了。」\n錢包裡有 $3,200，和孩子小時候的照片。`, { money: -3200, stress: 10, bond: 5 }); }
      } else if (c === 1) {
        St().move('thief', 6, 1.0, 0.9);
        if (G.chance(0.55)) await res(null, '雞排攤老闆聽到，抄起鍋鏟就衝出去，跟大腸包小腸的老闆一起把扒手壓在地上。\n夜市的團結，比任何保全都強。錢包回來了。', { rep: 4, bond: 4, conduct: 4 });
        else await res(null, '大家轉頭看你，沒有人動。扒手已經不見了。\n一個大叔拍拍你：「夜市就是這樣啦，自己要小心。」', { money: -3200, stress: 8 });
      } else await res(KID(), `你抱緊${s.kidName}，看著那頂帽子消失在人群裡。\n${s.kidName}說：「${h.meTitle()}，那是你的錢耶。」\n「你比較重要。」你說。心裡在算那 $3,200 可以付幾天的家用。`, { money: -3200, bond: 4, stress: 6 });
    } },
    { id: 'goldfish', min: 1, max: 4, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('nightmarket', [{ id: 'fish', model: X.vendor, x: 4.4, z: -1.6, rot: -0.6, height: 1.8 }], { caption: '撈金魚攤', kid: { x: 3.0, z: -1.2, rot: Math.PI, anim: 'sit' }, me: { x: 1.8, z: -0.4, rot: 0.5 } });
      await say(KID(), `「${h.meTitle()}！我要撈金魚！」\n老闆遞來一支紙網：「一支 $50，破了就沒有囉。」`);
      const c = await ask(ME(), '紙網薄得像衛生紙。', [{ text: '讓孩子自己撈' }, { text: '「看我的。」親自上場' }]);
      const r = await St().reflex({ title: '撈！', text: '金魚游到網子上方時——看到「現在！」按空白鍵。', btn: '撈！', ok: '撈到了！', slow: '紙網破了⋯', early: '紙網破了⋯' });
      if (r === 'win') {
        s.flags.goldfish = true;
        if (c === 0) await res(KID(), `${s.kidName}撈到了一隻橘色的金魚，高興到在攤位前跳。\n「牠叫『${h.meTitle()}』！」\n「⋯⋯為什麼？」「因為牠嘴巴一直張開。」`, { bond: 8, money: -50 });
        else await res(null, `你一網撈起三隻。老闆的臉色變了。\n${s.kidName}大喊：「${h.meTitle()}好厲害！」整條夜市都聽到了。\n這是你這個月最有成就感的一刻。`, { bond: 7, stress: -6, money: -50 });
      } else {
        const c2 = await ask(KID(), `紙網破了。${s.kidName}的嘴巴開始往下彎。`, [{ text: '再買一支（$50）' }, { text: '「輸了就是輸了。」' }, { text: '跟老闆買一隻（$100）' }]);
        if (c2 === 0) await res(null, '你買了七支。最後老闆看不下去，送了你們一隻。', { money: -350, bond: 5, stress: 3 });
        else if (c2 === 1) await res(KID(), `${s.kidName}吸了一下鼻子：「⋯⋯好。」\n走出夜市時${h.callKid()}說：「下次我會贏。」`, { conduct: 5, bond: -1 });
        else { s.flags.goldfish = true; await res(null, '你直接用買的。孩子很開心，但你總覺得哪裡怪怪的。', { money: -100, bond: 4, conduct: -2 }); }
      }
    } },
    { id: 'balloon', min: 2, max: 5, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('nightmarket', [{ id: 'boss', model: X.stranger, x: 7.4, z: -1.2, rot: -0.4, height: 1.76 }], { caption: '射氣球攤', kid: { x: 5.6, z: -0.2, rot: 0.6 }, me: { x: 4.4, z: 0.4, rot: 0.6 } });
      const B = NPC('射氣球老闆', X.stranger);
      await say(null, `${s.kidName}射破了 9 顆氣球，興奮地指著最上面那隻大熊：「我要那個！」`);
      await say(B, '老闆搖頭：「要 10 顆才有大熊喔，9 顆只能換這個。」\n他拿出一個鑰匙圈。上面的皮卡丘臉是歪的。');
      const c = await ask(ME(), '你剛剛明明看到老闆偷偷把一顆氣球換成沒充飽的。', [{ text: '「老闆，那顆氣球沒充氣吧？」' }, { text: '「我來。」親自射一輪（$100）' }, { text: '「鑰匙圈也很可愛啊。」' }]);
      if (c === 0) { St().act('boss', 'emote-no'); await res(B, '老闆看了你三秒，嘆了一口氣：「⋯⋯好啦，拿去拿去。」\n他把大熊塞給孩子，小聲跟你說：「你很會看喔。」', { bond: 6, conduct: 4 }); }
      else if (c === 1) {
        const r = await St().reflex({ title: '瞄準！', text: '準星對上氣球的瞬間——看到「現在！」按空白鍵。', btn: '射！', ok: '砰！全中！', window: 0.55 });
        if (r === 'win') await res(KID(), `你 10 發全中。老闆的臉綠了。\n${s.kidName}抱著跟${h.callKid()}一樣大的熊，走路都看不到前面。`, { money: -100, bond: 9, stress: -4 });
        else await res(null, '你只射中 3 顆。老闆很同情地給了你一個鑰匙圈。\n孩子說：「沒關係，我們一人一個。」', { money: -100, bond: 5 });
      } else await res(KID(), `${s.kidName}看了鑰匙圈很久：「⋯⋯它的臉是歪的。」\n「跟${h.meTitle()}一樣。」「哈哈哈對！」\n那個歪臉皮卡丘後來在${h.callKid()}的書包上掛了五年。`, { bond: 6 });
    } },
    { id: 'teen_hide', min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('nightmarket', [{ id: 'f1', model: X.kidB, x: 4.6, z: 0.2, rot: -1.6, height: h.kidH() }, { id: 'f2', model: X.kidC, x: 5.4, z: 0.8, rot: -2.0, height: h.kidH() + 0.05 }], { caption: '夜市・臭豆腐攤前' });
      await say(null, `你們在排臭豆腐時，${s.kidName}突然往你身後一躲。\n前面走來兩個${h.callKid()}的同學。\n${s.kidName}小聲說：「假裝不認識我。」`);
      const c = await ask(ME(), '同學越走越近。', [{ text: '配合演出：低頭滑手機，假裝路人' }, { text: '「嗨！你們是' + s.kidName + '的同學嗎？要不要一起吃？」', cls: 'special' }, { text: '「為什麼要假裝不認識我？」' }]);
      if (c === 0) await res(null, `同學走過去了。${s.kidName}鬆一口氣，然後說：「謝啦。」\n你們吃了一份大辣臭豆腐。${h.callKid()}說：「下次可以一起來，但我要戴口罩。」`, { bond: 6 });
      else if (c === 1) { St().act('f1', 'emote-yes'); await res(KID(), `「不用了啦阿姨／叔叔！」同學笑著跑走了。\n${s.kidName}三天沒跟你講話。\n但你從同學的限動裡看到：「${s.kidName}的${h.meTitle()}好熱情哈哈哈 好想要」`, { bond: -2, rep: 3 }); }
      else await res(KID(), `「⋯⋯因為我在學校說我們家去日本玩，沒有去夜市。」\n你們沉默了很久。\n「那我們今年去日本。」「不用啦！」「存錢就去。」`, { bond: 7, conduct: 4, stress: 4 });
    } },
  ];

  /* ---------- 🛒 全連 ---------- */
  E.market = [
    { id: 'tantrum', min: 1, max: 2, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('market', [{ id: 'aun', model: X.auntie, x: 2.4, z: 0.9, rot: -1.2, height: 1.72 }], { caption: '全連・玩具零食區', kid: { x: 0.4, z: 0.4, rot: 0, anim: 'die' } });
      St().act('kid', 'die', { once: true, restart: true });
      await say(null, `${s.kidName}想要一盒 $399 的扭蛋機玩具。你說不行。\n${h.callKid()}直接躺在走道上，開始大哭、踢腿、轉圈。\n整間全連的人都停下來看你。一個阿姨在旁邊搖頭。`);
      const c = await ask(ME(), '店員在廣播：「親愛的顧客，本週雞蛋特價⋯⋯」', [{ text: '蹲下來，等孩子哭完再講道理' }, { text: '買給他，快點結束' }, { text: '轉身走到下一排，假裝不認識' }, { text: '跟著一起躺下去哭', cls: 'special' }]);
      const AUN = NPC('旁邊的阿姨', X.auntie);
      if (c === 0) await res(null, `你蹲在旁邊等了八分鐘。${s.kidName}哭到沒力，自己坐起來了。\n「我知道你很想要。但我們說好今天只買一個零食。」\n${h.callKid()}抽噎著點頭，選了一包乖乖。`, { conduct: 8, bond: 4, stress: 6 });
      else if (c === 1) await res(AUN, `阿姨小聲說：「這樣以後每次都會躺喔。」\n她說對了。下次在家樂福，${s.kidName}躺得更熟練了。`, { money: -399, conduct: -8, bond: 2 });
      else if (c === 2) { St().act('kid', 'idle'); await res(KID(), `三十秒後，${s.kidName}發現沒有觀眾，自己爬起來追過來，抓住你的衣角：「${h.meTitle()}等我！」\n然後就忘了玩具的事。`, { conduct: 4, stress: 2 }); }
      else { St().act('me', 'die', { once: true, restart: true }); await res(AUN, `你躺下去，比${s.kidName}哭得更大聲：「我也想要——」\n${s.kidName}突然停了，一臉驚恐地看著你：「${h.meTitle()}你起來啦！好丟臉！」\n旁邊的阿姨笑到要扶貨架。這招有用，但你上了 Dcard。`, { bond: 6, conduct: 5, rep: -5, stress: -4 }); }
    } },
    { id: 'candy', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('market', [{ id: 'clerk', model: X.guard, x: 3.8, z: 0.8, rot: -1.6, height: 1.75 }], { caption: '全連・門口', kid: { x: 1.6, z: 1.6, rot: 0.6 }, me: { x: 0.6, z: 1.6, rot: 0.6 } });
      await say(null, `走出全連時，你發現${s.kidName}的口袋鼓鼓的。\n裡面是一包沒結帳的軟糖。`);
      const c = await ask(ME(), `${s.kidName}看到你的表情，小聲說：「⋯⋯我忘記了。」`, [{ text: '帶孩子回去，讓他自己跟店員說' }, { text: '幫他付錢就好' }, { text: '當場大罵', cls: 'angry' }]);
      if (c === 0) { await St().move('kid', 3.0, 1.2, 1.0); await res(NPC('店員', X.guard), `${s.kidName}把軟糖放在櫃台上，聲音小到聽不見：「對、對不起，我沒有付錢⋯⋯」\n店員蹲下來說：「謝謝你回來說。你很勇敢。」\n${h.callKid()}付了自己的零用錢 $25。`, { conduct: 12, bond: 3 }); }
      else if (c === 1) await res(null, '你默默去補了錢。孩子學到的是：被抓到的話，大人會處理。', { money: -25, conduct: -6 });
      else { St().act('kid', 'emote-no'); await res(KID(), `你在門口大罵，路人都在看。${s.kidName}哭到喘不過氣。\n軟糖後來沒有人吃。`, { conduct: 4, bond: -8, stress: 6 }); }
    } },
    { id: 'cut', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('market', [{ id: 'aun', model: X.grandma, x: 2.8, z: 0.4, rot: -1.6, height: 1.62 }], { caption: '全連・結帳排隊', me: { x: 1.4, z: 1.4, rot: 1.2 }, kid: { x: 0.6, z: 1.8, rot: 1.2 } });
      const A = NPC('推兩台推車的大嬸', X.grandma);
      await say(A, '你排了十五分鐘，終於輪到你。一個大嬸推著兩台滿出來的推車，直接卡進你前面。\n「我只有一樣啦，很快！」\n她的推車裡有 48 罐舒跑。');
      const c = await ask(ME(), `${s.kidName}抬頭看著你。`, [{ text: '「阿姨，我們排很久了，後面才是隊尾喔。」' }, { text: '「好啦，你先。」' }, { text: `讓${s.kidName}去說`, cls: 'special' }]);
      if (c === 0) { St().act('aun', 'emote-no'); await res(A, '「齁，年輕人這麼計較！」\n她罵罵咧咧地推去後面。後面排隊的人都在點頭。', { conduct: 5, stress: 4, rep: 1 }); }
      else if (c === 1) await res(KID(), `大嬸結帳結了十二分鐘，還用了三張折價券和兩次點數。\n${s.kidName}問：「為什麼她可以插隊？」你答不出來。`, { stress: 8, conduct: -3 });
      else {
        const brave = s.conduct >= 50;
        await St().move('kid', 2.2, 1.0, 0.8);
        if (brave) await res(KID(), `${s.kidName}抬起頭：「阿嬤，我們也排很久了，要排隊喔。」\n大嬸愣住，看看周圍，竟然紅著臉推去後面了。\n後面的人小聲說：「這小孩好棒。」${s.kidName}走回來，腳在抖，但很驕傲。`, { conduct: 10, bond: 6 });
        else await res(KID(), `${s.kidName}縮在你後面，搖頭：「我不敢⋯⋯」\n大嬸已經開始結帳了。`, { stress: 6, bond: 2 });
      }
    } },
    { id: 'sample', min: 1, max: 4, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('market', [{ id: 'aun', model: X.auntie, x: 2.0, z: -0.4, rot: -0.8, height: 1.72 }], { caption: '全連・試吃攤' });
      const A = NPC('試吃阿姨', X.auntie);
      await say(A, `${s.kidName}吃了第八塊試吃香腸。\n試吃阿姨的笑容越來越僵：「⋯⋯弟弟／妹妹很喜歡齁？要不要帶一包回家？一包 $189 喔。」`);
      const c = await ask(ME(), `${s.kidName}正在伸手拿第九塊。`, [{ text: '買一包（$189）' }, { text: '「我們再逛逛。」拉著孩子快走' }, { text: '自己也吃一塊，認真評論口味', cls: 'special' }]);
      if (c === 0) await res(A, '阿姨的笑容恢復了。回家後你發現那包香腸跟試吃的不是同一種。', { money: -189, rep: 1 });
      else if (c === 1) await res(KID(), `你們繞了一圈，${s.kidName}又自己繞回去試吃攤。\n你在冷凍櫃旁邊找到${h.callKid()}，嘴巴油油的。`, { stress: 3, conduct: -2 });
      else await res(A, '你說：「黑胡椒的比較好，但肉有點乾。」\n阿姨眼睛一亮：「對！我也跟公司講過！」\n你們聊了十分鐘，她偷偷塞了一包即期品給你。', { stress: -3, bond: 3, rep: 2 });
    } },
    { id: 'card', min: 2, max: 6, cond: (s) => s.money < 12000, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('market', [{ id: 'clerk', model: X.guard, x: 4.2, z: 0.2, rot: -1.6, height: 1.75 }], { caption: '全連・收銀台', me: { x: 3.0, z: 0.6, rot: 1.4 }, kid: { x: 2.2, z: 1.2, rot: 1.2 } });
      await say(NPC('店員', X.guard), '「不好意思，這張卡刷不過喔。要不要換一張？」\n後面排了八個人。你換了第二張卡。\n「⋯⋯這張也不行耶。」');
      const c = await ask(KID(), `${s.kidName}看看你，然後從書包裡拿出${h.callKid()}的小豬撲滿零錢包：「${h.meTitle()}，我有錢。」`, [{ text: '把幾樣東西放回去' }, { text: '收下孩子的錢，回家一定還' }, { text: '「不用！」轉身拿現金，不夠就全部不買' }]);
      if (c === 0) await res(null, `你把牛排、優格和${s.kidName}的布丁放回去。\n${h.callKid()}說：「沒關係，布丁很甜，吃多了會蛀牙。」\n回家路上你一直沒講話。`, { stress: 10, bond: 4 });
      else if (c === 1) { s.flags.owedKid = true; await res(KID(), `${s.kidName}很認真地數了 $137 給你，全是十元和五元。\n你在冰箱上貼了一張紙條：「欠${s.kidName} $137」。\n${h.callKid()}每天去看那張紙條，然後笑。`, { bond: 8, stress: 6, money: 137 }); }
      else await res(null, '你空手走出全連。晚餐是兩包泡麵加一顆蛋，你把蛋給了孩子。', { stress: 12, bond: -2 });
    } },
    { id: 'teen_shop', min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('market', [], { caption: '全連・生活用品區' });
      await say(KID(), `${s.kidName}拿起一瓶 $289 的${s.kidGender === 'm' ? '男生洗面乳' : '韓國防曬乳'}，看了很久，又放回去。\n然後拿了最便宜的那瓶 $69。`);
      const c = await ask(ME(), `${h.callKid()}最近每天照鏡子很久。`, [{ text: '把 $289 那瓶放進推車' }, { text: '什麼都不說' }, { text: '「你最近是不是有喜歡的人？」' }]);
      if (c === 0) await res(KID(), `${s.kidName}看了推車一眼，假裝沒看到。\n結帳時${h.callKid()}小聲說了一句「謝謝」，輕到幾乎聽不見。`, { money: -289, bond: 8 });
      else if (c === 1) await res(null, `${s.kidName}拿著 $69 那瓶去結帳了。你突然發現，${h.callKid()}已經開始會看價錢了。`, { bond: 1, conduct: 4, stress: 3 });
      else { St().act('kid', 'emote-no'); await res(KID(), `「沒有啦！你很煩！」\n${s.kidName}的耳朵紅到脖子。\n回家後你在${h.callKid()}的書桌上看到一張紙條，上面寫著一個名字，旁邊畫了一顆愛心，又用力塗掉。`, { bond: 2, stress: -2 }); s.flags.crush = true; }
    } },
  ];

  /* ---------- 📚 安親班 / 補習班 ---------- */
  E.study = [
    { id: 'sales', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('cram', [{ id: 'dir', model: X.boss, x: 1.4, z: 0.6, rot: -1.0, height: 1.78 }], { caption: '補習班・家長諮詢室', sign: h.AGES[s.ch] >= 9 ? '明星補習班\n上榜 100%' : '快樂安親班\n雙語・才藝', board: '別讓孩子\n輸在起跑點' });
      const D = NPC('補習班主任', X.boss);
      await say(D, `「${s.kidName}${h.meTitle()}，我跟你說實話。」主任把一疊考卷攤開。\n「${s.kidName}的數學，以現在的程度，上不了任何前三志願。」\n「但如果現在開始上我們的菁英衝刺班——一期三個月，$36,000，保證進步 20 分。」`);
      const c = await ask(ME(), `他指著牆上的紅榜。上面有一個人的名字出現了四次。`, [{ text: '報名（$36,000）' }, { text: '「進步 20 分，那如果沒有呢？」' }, { text: '「我先回去問孩子想不想上。」', cls: 'special' }]);
      if (c === 0) { s.flags.elite = true; await res(D, '主任笑得很開心，送了你一個印著補習班 logo 的保溫杯。\n孩子每週多了三天，每天到晚上九點半。', { money: -36000, grades: 14, stress: 8, bond: -6 }); }
      else if (c === 1) { St().act('dir', 'emote-no'); await res(D, '「⋯⋯那我們可以免費重讀一期。」\n「所以是保證可以重讀，不是保證進步？」\n主任沉默了，然後說：「我給你打八折。」', { stress: -2, rep: 1 }); const c2 = await ask(ME(), '八折，$28,800。', [{ text: '成交' }, { text: '還是不要' }]); if (c2 === 0) await res(null, '你覺得自己殺價成功。後來發現大家都是八折。', { money: -28800, grades: 12, stress: 6, bond: -4 }); }
      else await res(null, `你回家問了。${s.kidName}說：「我想要你陪我寫，不要去補習班。」\n你們約好每週三晚上是「數學之夜」，輸的人洗碗。`, { bond: 8, grades: 5, stress: 4 });
    } },
    { id: 'copy', min: 2, max: 5, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('cram', [], { caption: '補習班・下課後', kid: { x: -0.6, z: 0.8, rot: 0, anim: 'sit' }, me: { x: 1.2, z: 1.4, rot: -0.8 } });
      await say(null, `你來接${s.kidName}，順手翻了${h.callKid()}的作業。\n每一題都對。字跡很漂亮。漂亮到不像${h.callKid()}寫的。\n最後一頁的角落寫著：「抄完記得還我 —— 宥宥」`);
      const c = await ask(KID(), `${s.kidName}看到你的表情，臉白了。`, [{ text: '「這題你講給我聽。」' }, { text: '撕掉，叫他今晚重寫', cls: 'angry' }, { text: '「大家都這樣啦。」' }]);
      if (c === 0) await res(KID(), `${s.kidName}講了五分鐘，講不出來，最後哭了：「我就是不會嘛⋯⋯大家都會，只有我不會。」\n那天晚上你們從第一題重新開始。寫到十一點，${h.callKid()}終於自己算出來了。`, { grades: 8, bond: 6, conduct: 6, stress: 6 });
      else if (c === 1) { St().act('kid', 'emote-no'); await res(null, `你當場把作業撕了。${s.kidName}重寫到凌晨一點，邊寫邊哭。\n隔天老師在聯絡簿寫：「作業很認真，但有很多錯誤。」`, { conduct: 6, grades: 3, bond: -10, stress: 8 }); }
      else await res(null, '你闔上作業本。一學期後，月考數學 32 分。', { grades: -10, conduct: -6 });
    } },
    { id: 'dontknow', min: 3, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・晚上九點的餐桌', kid: { x: -0.4, z: 0.6, rot: 0.3, anim: 'sit' }, me: { x: 0.9, z: 1.0, rot: -0.6 } });
      await say(KID(), `「${h.meTitle()}，這題怎麼算？」\n題目：「甲乙兩人同時從A地出發⋯⋯」\n你看了三遍。你完全不會。`);
      const c = await ask(ME(), `${s.kidName}用期待的眼神看著你。`, [{ text: '假裝很懂，隨便講一個答案' }, { text: '「我也不會。我們一起查。」', cls: 'special' }, { text: '「去問老師，這是老師的工作。」' }]);
      if (c === 0) await res(KID(), `隔天${s.kidName}回家，把考卷丟在桌上：「老師說是錯的。你害我全班只有我錯。」\n「⋯⋯對不起。」「哼。」`, { bond: -5, grades: -3 });
      else if (c === 1) await res(KID(), `你們看 YouTube 教學看了一個小時，還畫了一張很醜的圖。\n最後是${s.kidName}先懂的。${h.callKid()}很得意地教你，教到你也懂了。\n「${h.meTitle()}你好笨喔。」「對啊，所以你要教我。」`, { bond: 8, grades: 7, conduct: 3 });
      else await res(KID(), `${s.kidName}默默把作業收起來。\n之後${h.callKid()}再也沒問過你功課。`, { bond: -6, stress: -3 });
    } },
    { id: 'sleep', min: 2, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('cram', [{ id: 't', model: h.M.teacher, x: -2.0, z: -2.4, rot: 0.3, height: 1.72 }], { caption: '補習班・晚上九點', kid: { x: -1.6, z: 0.2, rot: Math.PI, anim: 'sit' }, me: { x: 3.6, z: 2.2, rot: -1.6 } });
      await say(null, `你提早到補習班，從門口的玻璃看進去。\n${s.kidName}趴在桌上睡著了，口水流在講義上。\n台上的老師正在講第四十七個公式。`);
      const c = await ask(ME(), `${h.callKid()}這個月每天都補到九點半，回家還要寫學校作業到十二點。`, [{ text: '敲玻璃把孩子叫醒' }, { text: '讓孩子睡，下課再說' }, { text: '跟補習班說：下個月不上了' }]);
      if (c === 0) await res(KID(), `${s.kidName}嚇醒，看到你在門口，又看到老師在瞪${h.callKid()}。\n回家路上${h.callKid()}一句話都沒說。`, { grades: 2, bond: -4, stress: 3 });
      else if (c === 1) await res(KID(), `下課時你什麼都沒說，只是買了一杯熱可可給${h.callKid()}。\n${s.kidName}在機車後座又睡著了，頭靠在你背上。`, { bond: 6, stress: -2 });
      else await res(null, `補習班主任說：「現在退費只能退一半喔。」\n你退了。${s.kidName}那個月每天晚上九點就睡了，月考反而進步了 5 分。`, { money: 6000, bond: 8, grades: 2, stress: -6 });
    } },
  ];

  /* ---------- 💼 工作 ---------- */
  E.work_delivery = [
    { id: 'wd_lin', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('street', [{ id: 'lin', model: h.M.linMom, x: 1.6, z: -1.4, rot: -0.4, height: 1.75 }], { noKid: true, caption: '跑單中・大安區', me: { x: -0.4, z: 0.2, rot: 0.6 } });
      const LIN = NPC('林媽媽', h.M.linMom);
      await say(null, '「訂單：有機沙拉 ×2、冷壓果汁 ×2。備註：放門口不要按電鈴，寶寶在睡覺。」\n你送到門口——門剛好打開。');
      St().act('lin', 'emote-no');
      await say(LIN, `「⋯⋯欸？${s.kidName}${h.meTitle()}？」\n林媽媽穿著睡衣，手上拿著一片面膜。你們互看了三秒。`);
      const c = await ask(ME(), '你手上還提著她的冷壓果汁。', [{ text: '「您的餐點到囉～祝您用餐愉快！」專業微笑' }, { text: '「⋯⋯不要告訴家長群組好嗎？」' }, { text: '「林媽媽，這杯果汁 $180，你知道嗎？」', cls: 'angry' }]);
      if (c === 0) await res(LIN, '她愣了一下，給了你五星和 $50 小費，附註：「辛苦了。」\n隔天在校門口，她跟你點頭，第一次沒有說任何一句炫耀的話。', { money: 50, rep: 4 });
      else if (c === 1) await res(LIN, '「我、我才不會說呢！」\n當天晚上，家長群組沒有任何消息。但三個家長私訊你問「外送員收入怎麼樣」。', { rep: -2, stress: 4 });
      else await res(null, '她「砰」地關上門。你收到一星：「態度很差」。\n你在機車上笑了五分鐘，覺得很值得。', { stress: -6, rep: -4 });
    } },
    { id: 'wd_call', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('street', [], { noKid: true, caption: '跑單中・晚餐尖峰', me: { x: -0.4, z: 0.4, rot: 0.6 } });
      await say(null, `手上有三張單，平台在催：「預計送達時間已超過」。\n手機響了，是${s.kidName}。\n「${h.meTitle()}⋯⋯今天是我的班級演講比賽，我是第一名。你可以來看頒獎嗎？就是現在。」`);
      const c = await ask(ME(), '學校離這裡 12 分鐘。三張單的客人都在等。', [{ text: '把三張單轉給別人，衝去學校', cls: 'special' }, { text: '「送完這三單就去！」' }, { text: '「爸媽在工作，你乖。」' }]);
      if (c === 0) await res(KID(), `你到的時候剛好叫到${s.kidName}的名字。${h.callKid()}在台上找到你，笑到眼睛都不見了。\n那天你被扣了 $300 罰金和兩顆星。你一點都不在意。`, { bond: 12, money: -300, stress: -4 });
      else if (c === 1) await res(null, `你送完第三單衝到學校時，頒獎已經結束了。\n${s.kidName}一個人坐在台階上，獎狀摺在書包裡。\n「沒關係啦。」${h.callKid()}說。但你知道有關係。`, { money: 600, bond: -6, stress: 6 });
      else await res(null, `電話那頭安靜了很久。「⋯⋯好。」\n你送完單，在等紅燈的時候才發現，你連${h.callKid()}演講的題目都沒問。`, { money: 600, bond: -10, stress: 6 });
    } },
    { id: 'wd_ride', min: 3, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('street', [{ id: 'cus', model: X.grandma, x: 2.2, z: -1.6, rot: -0.6, height: 1.6 }], { caption: '暑假・帶孩子一起跑單', kid: { x: 0.6, z: 0.6, rot: 0.6 }, me: { x: -0.4, z: 0.4, rot: 0.6 } });
      await say(null, `暑假沒人顧孩子，你只好帶${h.callKid()}一起跑單。\n${s.kidName}負責拿餐、按電鈴、說「您的餐點到了」。\n這一單是一個獨居的阿嬤。`);
      St().act('cus', 'emote-yes');
      await say(NPC('阿嬤', X.grandma), `阿嬤看到${s.kidName}，眼睛亮了：「哎唷，這麼小就在幫忙喔？」\n她硬塞了 $100 和一顆蘋果給${s.kidName}。\n「下次還要再來喔，阿嬤一個人吃飯很無聊。」`);
      const c = await ask(KID(), `回到機車上，${s.kidName}說：「${h.meTitle()}，她好像很寂寞。」`, [{ text: '「那我們下次多陪她聊五分鐘。」' }, { text: '「我們也很忙啊。」' }, { text: '「那 $100 我們拿去買雞排。」' }]);
      if (c === 0) { s.flags.amaOrder = true; await res(null, `從那天起，每次接到阿嬤的單，你們都會多留五分鐘。\n${s.kidName}教阿嬤用 LINE。阿嬤每天傳早安圖給${h.callKid()}。`, { bond: 8, conduct: 10, money: 100 }); }
      else if (c === 1) await res(KID(), `${s.kidName}看著窗外不說話。\n你突然覺得，你也很寂寞。`, { money: 100, stress: 4 });
      else await res(KID(), `「好耶！」\n你們在路邊吃雞排，${s.kidName}說這是暑假最好的一天。`, { money: 0, bond: 6 });
    } },
  ];
  E.work_office = [
    { id: 'wo_ot', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('workoffice', [{ id: 'boss', model: X.boss, x: 1.2, z: 0.4, rot: -1.0, height: 1.78 }], { noKid: true, caption: '辦公室・下午 5:55', me: { x: -0.8, z: 0.9, rot: 0.6 } });
      const B = NPC('主管', X.boss);
      await say(B, `「欸，那個報告客戶說要改，今天要給喔。」\n五點五十五分。今天是${s.kidName}的學校音樂會，${h.callKid()}是第一排吹直笛的。七點開始。`);
      const c = await ask(ME(), '主管已經轉身走了。', [{ text: '「老闆，我今天有家庭因素，明天一早給你。」' }, { text: '默默加班，傳 LINE 說對不起' }, { text: '帶筆電去音樂會，邊看邊改', cls: 'special' }]);
      if (c === 0) { St().act('boss', 'emote-no'); await res(B, '主管停了三秒：「⋯⋯好啦。年終的時候我會記得的。」\n你在音樂會上看到孩子吹錯了三個音，但是全場最大聲。', { bond: 10, stress: 6, money: -2000 }); }
      else if (c === 1) { G.Chat.msg(s, 'spouse', `${s.kidName}一直在台上找你。\n（影片）`); await res(null, `你九點半才離開公司。另一半傳了一段影片給你。\n${s.kidName}吹完的時候，往觀眾席看了一圈。`, { bond: -10, money: 2000, stress: 8 }); }
      else await res(null, '你坐在最後一排，筆電的光照著你的臉。旁邊的家長一直瞪你。\n報告改完了，音樂會也看完了，但你什麼都記不起來。\n孩子說：「你有看到我嗎？」「有啊。」你說。', { bond: 2, stress: 10, money: 1000 });
    } },
    { id: 'wo_compare', min: 2, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('workoffice', [{ id: 'col', model: X.auntie, x: 1.0, z: 0.6, rot: -1.1, height: 1.72 }], { noKid: true, caption: '辦公室・茶水間', me: { x: -0.8, z: 0.9, rot: 0.6 } });
      const C = NPC('同事 Linda', X.auntie);
      await say(C, `「欸你家小孩讀哪？我兒子剛考上資優班～現在在學程式，說以後要去 Google。」\n她把手機舉到你面前，是她兒子拿獎盃的照片。第 14 張。`);
      const c = await ask(ME(), `你想到${s.kidName}昨天的考卷：數學 ${s.grades + 20 > 100 ? 98 : Math.max(30, s.grades + 20)} 分。`, [{ text: '「我家的在學怎麼不去 Google。」' }, { text: '拿出手機給她看孩子畫的你', cls: 'special' }, { text: '「好厲害喔。」然後回座位查資優班' }]);
      if (c === 0) await res(C, '她笑了一下，沒聽懂。你也沒解釋。', { stress: -3 });
      else if (c === 1) await res(C, `那是一張畫，上面是你騎機車，旁邊寫「我最愛的${h.meTitle()}」。\nLinda 看了很久：「⋯⋯我兒子已經不畫畫給我了。」\n她走出茶水間的時候，背影有點落寞。`, { bond: 4, stress: -6 });
      else { await res(null, '你查到半夜。資優班一期 $45,000，還要先考試。\n你突然覺得很累。', { stress: 10 }); }
    } },
  ];
  E.work_shop = [
    { id: 'ws_help', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('drinkshop', [{ id: 'cus', model: X.richDad, x: 2.6, z: 1.6, rot: -2.2, height: 1.82 }], { caption: '自己的手搖飲店・放學時間', sign: `${s.name}的茶`, kid: { x: -0.4, z: -1.7, rot: 0 }, me: { x: -1.6, z: -1.8, rot: 0.3 } });
      await say(null, `${s.kidName}放學後都會來店裡寫功課。今天${h.callKid()}說要幫忙搖飲料。\n第一個客人來了：「珍奶，半糖少冰，珍珠要 Q 一點。」`);
      const c = await ask(ME(), `${s.kidName}已經拿起搖杯，表情非常認真。`, [{ text: '讓孩子搖', cls: 'special' }, { text: '「你去寫功課，這我來。」' }]);
      const CUS = NPC('客人', X.richDad);
      if (c === 0) {
        const r = await St().reflex({ title: '搖！', text: '看到「現在！」按空白鍵，停在完美的那一刻。', btn: '停！', ok: '完美的一杯！', slow: '搖太久了⋯' });
        if (r === 'win') { St().act('cus', 'emote-yes'); await res(CUS, `客人喝了一口：「哇，這杯比平常好喝。」\n${s.kidName}驕傲到鼻孔朝天。從那天起${h.callKid()}的職稱是「首席搖杯師」，時薪一根棒棒糖。`, { bond: 9, money: 55, conduct: 3 }); }
        else { St().act('kid', 'emote-no'); await res(CUS, `蓋子沒蓋好，珍奶灑了客人一身。\n客人的白襯衫變成奶茶色。你賠了洗衣費 $500 和十杯免費券。\n${s.kidName}躲在櫃台後面哭。你摸摸${h.callKid()}的頭：「我第一次也灑過。」`, { money: -500, bond: 6, stress: 6 }); }
      } else await res(KID(), `${s.kidName}放下搖杯，回去寫功課。寫了兩行就趴在桌上看你做飲料。\n「${h.meTitle()}，你搖飲料的時候好帥。」`, { bond: 3, grades: 3, money: 55 });
    } },
    { id: 'ws_karen', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC } = h;
      stage('drinkshop', [{ id: 'lin', model: h.M.linMom, x: 1.2, z: 1.2, rot: Math.PI - 0.4, height: 1.75 }], { noKid: true, caption: '自己的手搖飲店', sign: `${s.name}的茶`, me: { x: -0.6, z: -1.8, rot: 0 } });
      const LIN = NPC('林媽媽', h.M.linMom);
      St().act('lin', 'emote-no');
      await say(LIN, `「老闆，我上禮拜幫家長會訂了 60 杯，你們的珍珠根本不 Q。」\n「我在群組問過了，大家都覺得不 Q。」\n她把手機給你看，群組裡只有她一個人說不 Q，其他人都只回了貼圖。`);
      const c = await ask(ME(), '店裡還有三個客人在排隊，都在看。', [{ text: '「下次訂我送 6 杯。」' }, { text: '「這是群組截圖，大家都只回貼圖喔。」' }, { text: `煮一鍋新的珍珠，請她現場試吃`, cls: 'special' }]);
      if (c === 0) await res(LIN, '她滿意地走了。下禮拜家長會又訂了 60 杯，她又說珍珠不 Q。', { money: -330, rep: 4, stress: 6 });
      else if (c === 1) { St().act('lin', 'emote-no'); await res(LIN, '林媽媽臉紅了：「⋯⋯你這是什麼態度！」\n排隊的客人裡有人「噗」了一聲。\n當晚你的 Google 評論多了一則一星：「老闆很兇」。', { rep: -8, stress: -2 }); }
      else await res(LIN, `你煮了一鍋新的，請她吃一口。她嚼了很久：「⋯⋯是蠻 Q 的。」\n「那上次可能是放太久了，下次我送過去的時候直接現煮。」\n她第一次跟你說謝謝。`, { rep: 8, money: -200, stress: 3 });
    } },
  ];

  /* ---------- 🏠 在家 ---------- */
  E.talk = [
    { id: 'baby', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・晚餐時間', kid: { x: -0.6, z: 0.4, rot: 0.3, anim: 'sit' }, me: { x: 0.9, z: 0.9, rot: -0.6, anim: 'sit' } });
      await say(KID(), `${s.kidName}突然放下筷子：\n「${h.meTitle()}，小孩是怎麼生出來的？」\n「宥宥說是從垃圾桶撿來的。」`);
      const c = await ask(ME(), '你的筷子掉了。', [{ text: '用繪本的方式認真解釋', cls: 'special' }, { text: '「是送子鳥送來的。」' }, { text: `「去問你${h.spouseTitle() === '老婆' ? '媽媽' : '爸爸'}。」` }]);
      if (c === 0) await res(KID(), `你畫了一張很爛的圖，講了十分鐘。\n${s.kidName}認真聽完，說：「喔。那我可以吃布丁嗎？」\n隔天${h.callKid()}去學校跟全班解釋了一次。老師打電話給你。`, { bond: 6, conduct: 4, rep: -3 });
      else if (c === 1) await res(KID(), `「那送子鳥住在哪裡？牠怎麼知道我們家地址？牠有用 Google Map 嗎？」\n你被追問了四十分鐘。`, { stress: 6, bond: 2 });
      else { await res(null, '你的另一半在廚房瞪了你一眼。那天晚上，你們兩個大人都很尷尬。', { stress: 3, bond: 1 }); }
    } },
    { id: 'broke_vase', min: 1, max: 3, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・你剛下班', kid: { x: 0.6, z: 0.2, rot: 0.4 }, me: { x: 3.2, z: 1.6, rot: -1.2 } });
      await say(null, `你一進門，地上是碎掉的電視螢幕。\n${s.kidName}站在旁邊，手上拿著 Switch 的手把，手把的帶子斷了。\n「是貓弄的。」${h.callKid()}說。\n你們家沒有養貓。`);
      const c = await ask(KID(), `${s.kidName}的下巴在發抖。`, [{ text: '「我們家沒有貓喔。」等孩子自己說' }, { text: '「你知道這台多少錢嗎！」', cls: 'angry' }, { text: '「有沒有受傷？」先檢查' }]);
      if (c === 0) await res(KID(), `沉默了很久。「⋯⋯是我啦。我在玩網球，太用力了。」\n「謝謝你說實話。電視我們一起想辦法。」\n${s.kidName}那個月每天幫忙洗碗，說要「賠電視」。`, { conduct: 12, bond: 5, money: -8000 });
      else if (c === 1) await res(KID(), `${s.kidName}哭著說「對不起」。\n後來你發現，之後${h.callKid()}打破任何東西都會先藏起來。`, { conduct: -6, bond: -8, money: -8000 });
      else await res(KID(), `${s.kidName}愣住，然後大哭：「我以為你會罵我⋯⋯」\n${h.callKid()}的手指被碎片劃了一小道。你幫${h.callKid()}貼 OK 繃，順便說：「下次玩網球要把帶子綁好。」`, { bond: 10, conduct: 6, money: -8000 });
    } },
    { id: 'cat', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・下雨的晚上', kid: { x: 2.4, z: 1.6, rot: -1.6 }, me: { x: -0.6, z: 0.6, rot: 0.8 } });
      await say(KID(), `${s.kidName}全身濕透地衝進門，懷裡抱著一個紙箱。\n紙箱裡有一隻很小的、在發抖的橘貓。\n「牠在垃圾車旁邊叫了一整天⋯⋯${h.meTitle()}，我們可以養牠嗎？」`);
      const c = await ask(ME(), `房東說不能養寵物。存款 ${G.money(s.money)}。`, [{ text: '「養！房東那邊我去說。」' }, { text: '「先帶去醫院，再幫牠找主人。」', cls: 'special' }, { text: '「不行，拿回去放。」' }]);
      if (c === 0) { s.flags.cat = true; await res(KID(), `你們幫牠取名叫「外送」。\n「為什麼？」「因為牠是雨天被送來的。」\n房東後來知道了，漲了你 $500 房租，但偷偷來看了貓三次。`, { bond: 12, money: -3000, stress: 2 }); }
      else if (c === 1) await res(null, `獸醫說牠很健康。你們在網路上 PO 了認養文，一週後一個大學生把牠帶走了。\n${s.kidName}哭了一個晚上，但收到大學生傳來的照片時笑了。`, { bond: 6, conduct: 10, money: -1500 });
      else await res(KID(), `${s.kidName}抱著紙箱站在門口很久，然後轉身出去了。\n一個小時後${h.callKid()}回來，眼睛很腫，說：「我放在便利商店門口了，店員說會幫牠找家。」`, { bond: -10, conduct: 2 });
    } },
    { id: 'door', min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・晚上十一點', night: true, noKid: true, me: { x: 0.4, z: 0.6, rot: -0.4 } });
      await say(null, `${s.kidName}的房門已經關了三天。只有吃飯時間會開。\n你在門外站了很久。房間裡傳來很小聲的音樂，和偶爾的哭聲。`);
      const c = await ask(ME(), '你舉起手，準備敲門。', [{ text: '敲門：「我在客廳，想聊天的話隨時出來。」' }, { text: '直接開門進去', cls: 'angry' }, { text: '在門縫塞一張紙條和一包乖乖', cls: 'special' }]);
      if (c === 0) await res(KID(), `沒有回應。你在客廳等到一點，正要放棄時，門開了。\n${s.kidName}坐到你旁邊，什麼都沒說，只是靠著你的肩膀看了一集很爛的綜藝節目。`, { bond: 10, stress: -2 });
      else if (c === 1) await res(KID(), `「出去！！你為什麼不敲門！」\n${s.kidName}把手機藏到身後。門用力關上，這次還上了鎖。`, { bond: -12, stress: 8 });
      else await res(null, `隔天早上，你的機車座墊上有一張紙條：\n「謝謝。我被喜歡的人拒絕了。不要問。乖乖很好吃。」`, { bond: 12, conduct: 3 });
    } },
    { id: 'chat', min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, KID } = h;
      stage('living', [], { caption: '家裡・睡前', night: true, kid: { x: -0.4, z: 0.4, rot: 0.3, anim: 'sit' }, me: { x: 0.9, z: 0.9, rot: -0.6, anim: 'sit' } });
      const c = await ask(KID(), `睡前，${s.kidName}突然問：「${h.meTitle()}，你小時候的夢想是什麼？」`, [{ text: '說實話：「想當歌手。」' }, { text: '「當一個好爸爸／好媽媽。」' }, { text: '「當有錢人。失敗了。」' }]);
      if (c === 0) await res(KID(), `「真的假的！唱一首！」\n你唱了一首〈小幸運〉，破音兩次。${s.kidName}笑到在床上打滾，然後說：「其實還不錯。」`, { bond: 9, stress: -4 });
      else if (c === 1) await res(KID(), `${s.kidName}翻了一個大白眼：「好噁。」\n但${h.callKid()}睡著前小聲說：「你有做到啦。」`, { bond: 7, conduct: 3 });
      else await res(KID(), `${s.kidName}大笑：「那我以後當有錢人養你！」\n「說好了喔。」「嗯！每天給你喝珍奶！」`, { bond: 7, stress: -3 });
    } },
  ];

  /* ---------- extra small events (use other locations) ---------- */
  PS.SMALL = [
    { min: 4, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      G.Chat.msg(s, 'parents', `${s.kidName}的家長嗎？這裡是幸福派出所，請您現在過來一趟。`, { who: '未知號碼' });
      stage('police', [{ id: 'cop', model: X.cop, x: -1.2, z: -0.7, rot: 0, height: 1.82, anim: 'sit' }, { id: 'clerk', model: X.guard, x: 2.4, z: 0.8, rot: -1.8, height: 1.75 }], { caption: '派出所・晚上十點', kid: { x: 0.6, z: 0.6, rot: Math.PI, anim: 'sit' }, me: { x: 3.4, z: 2.2, rot: -2.4 } });
      const COP = NPC('值班警員', X.cop), CL = NPC('超商店長', X.guard);
      await say(COP, `「家長你好。你的孩子在超商拿了一支 $89 的口紅／耳機沒結帳，店長報警了。」\n${s.kidName}坐在塑膠椅上，盯著自己的鞋子。`);
      await say(CL, '店長雙手抱胸：「這已經是這個月第三個了，我一定要提告，殺雞儆猴。」');
      const c = await ask(ME(), `${s.kidName}的手在發抖，一直不敢看你。`, [
        { text: '向店長深深鞠躬，請求給孩子一次機會', cls: 'special' }, { text: `先問${s.kidName}：「為什麼？」` }, { text: '「告啊！讓他學個教訓！」', cls: 'angry' }]);
      if (c === 0) { St().act('me', 'emote-no'); await res(CL, `你鞠躬鞠了很久。${s.kidName}看著你，突然也站起來，跟著鞠躬，哭著說「對不起」。\n店長嘆了一口氣：「⋯⋯好啦，撤告。但要來店裡幫忙整理貨架一週。」`, { conduct: 12, bond: 8, stress: 8 }); }
      else if (c === 1) {
        await res(KID(), `${s.kidName}沉默很久：「⋯⋯同學說不敢偷就不是朋友。他們在外面看。」\n警察在旁邊嘆氣：「每次都是這樣。」`, { bond: 6, stress: 6 });
        const c2 = await ask(ME(), '店長還在等你的回答。', [{ text: '賠償並請求和解' }, { text: '讓孩子自己去跟店長談' }]);
        if (c2 === 0) await res(CL, '你賠了 $2,000 和解金。店長收下，說：「不是錢的問題，你要教。」', { money: -2000, conduct: 6 });
        else await res(KID(), `${s.kidName}走到店長面前，講了很久，最後店長摸了摸${h.callKid()}的頭。\n回家路上${h.callKid()}說：「店長說他兒子以前也這樣。」`, { conduct: 12, bond: 4 });
      } else await res(COP, `警察愣了一下：「家長，他才 ${h.AGES[s.ch]} 歲，留了紀錄會跟著他喔。」\n最後店長也心軟了。但${s.kidName}那天晚上說：「你根本不在乎我。」`, { conduct: 4, bond: -14, stress: 10 });
    } },
    { min: 1, max: 6, run: async (h) => {
      const { s, say, ask, res, ME, NPC, KID } = h;
      stage('restaurant', [
        { id: 'aunt', model: X.relative, x: 1.4, z: 0.4, rot: -1.6, height: 1.7, anim: 'sit' }, { id: 'uncle', model: X.vendor, x: -0.8, z: -2.3, rot: 0.3, height: 1.8, anim: 'sit' },
        { id: 'ama', model: X.grandma, x: 0, z: -2.6, rot: 0, height: 1.58, anim: 'sit' },
      ], { caption: '阿嬤八十大壽・海鮮餐廳', kid: { x: -1.4, z: 0.6, rot: 2.2, anim: 'sit' }, me: { x: -0.4, z: 1.3, rot: Math.PI, anim: 'sit' } });
      const A = NPC('二姑', X.relative);
      St().act('aunt', 'emote-yes');
      await say(A, `「${s.kidName}現在幾名啊？我們家表哥上次全校第三名喔～」\n「${s.name}啊，你現在${h.JOBS[s.job].name === '外送員' ? '還在送外送喔？那個有勞保嗎？' : h.JOBS[s.job].name === '開手搖飲店' ? '飲料店賺得到錢喔？' : '還在那間公司喔？升經理了沒？'}」\n「什麼時候生第二胎？」`);
      const c = await ask(ME(), `一桌十二個人都在看你。${s.kidName}在桌子下面抓著你的手。`, [
        { text: '「二姑，你的龍蝦要冷掉了。」幫她夾一隻', cls: 'special' }, { text: '一一認真回答' }, { text: `「${s.kidName}不用跟任何人比。」` }]);
      if (c === 0) await res(A, '二姑被龍蝦堵住嘴。阿嬤在主位偷偷對你眨眼。\n那天的龍蝦，是你這輩子吃過最好吃的。', { stress: -4, rep: 2, bond: 3 });
      else if (c === 1) await res(null, '你回答了四十分鐘。最後一道甜湯上來時，你已經老了五歲。', { stress: 12, rep: 3 });
      else { St().act('aunt', 'emote-no'); await res(NPC('阿嬤', X.grandma), `整桌安靜了。阿嬤敲了敲桌子：「講得好。吃飯！」\n回家的路上，${s.kidName}說：「${h.meTitle()}，你剛剛好帥。」`, { bond: 10, rep: -3, conduct: 3 }); }
      if (G.chance(0.5)) await res(NPC('阿嬤', X.grandma), `散場時阿嬤偷偷塞了一個紅包給${s.kidName}：「不要給你${h.meTitle()}拿去花喔。」`, { money: 3600, bond: 2 });
    } },
  ];

  /* =====================================================
   * Location runner
   * ===================================================== */
  const BASE = {
    work: (h) => { const s = h.s; const pay = h.JOBS[s.job].pay() + 2000; h.ap({ money: pay - 4000, stress: 10, bond: -5 }); return pay; },
    school: (h) => h.ap({ money: -4000, bond: 4, stress: 3, conduct: 2 }),
    study: (h) => h.ap({ money: -5500, grades: 8, stress: 6 }),
    play: (h) => h.ap({ money: -5000, bond: 7, stress: -8 }),
    market: (h) => h.ap({ money: -4500, bond: 3, conduct: 2 }),
    talk: (h) => h.ap({ money: -4000, bond: 5, conduct: 4 }),
    rest: (h) => h.ap({ money: -4000, stress: -20, bond: -2 }),
  };
  function ap(h, eff) { h.ap(eff); }
  function poolFor(kind, s) {
    if (kind === 'work') return E['work_' + s.job] || E.work_delivery;
    if (kind === 'play') return G.chance(0.5) ? E.park : E.night;
    return E[kind];
  }
  function choose(pool, s) {
    const ok = pool.filter((e) => s.ch >= e.min && s.ch <= e.max && (!e.cond || e.cond(s)));
    const fresh = ok.filter((e) => !s.seen['pe_' + e.id]);
    const e = G.pick(fresh.length ? fresh : ok);
    if (e) s.seen['pe_' + e.id] = (s.seen['pe_' + e.id] || 0) + 1;
    return e;
  }

  PS.has = (kind) => !!BASE[kind];
  PS.run = async function (kind) {
    const h = H(), s = h.s;
    try {
      if (kind === 'rest') {
        BASE.rest(h);
        stage('park', [], { noKid: true, caption: '照顧自己・清晨的河濱', me: { x: 0, z: 2.2, rot: 1.57 } });
        St().move('me', 5, 2.4, 4);
        await h.say(null, G.pick(['你這段時間早點睡，每天早上去河濱慢跑。\n鏡子裡的黑眼圈淡了一點。', '你一個人去看了一場電影。看到一半睡著了。是這幾年睡最好的一覺。', '你把手機關靜音一整個週末。家長群組 287 則未讀，世界並沒有毀滅。']));
        return;
      }
      if (kind === 'work') {
        const pay = BASE.work(h);
        if (G.ui.toast) G.ui.toast(`這段時間收入 ${G.money(pay)}`);
      } else BASE[kind](h);
      const pool = poolFor(kind, s);
      const e = choose(pool || [], s) || choose(E.talk, s);
      if (e) await e.run(h);
    } catch (err) {
      console.error('scene error', err);
    } finally {
      const f = document.querySelector('#fight'); if (f) f.classList.add('hidden');
    }
  };
})(window.G);
