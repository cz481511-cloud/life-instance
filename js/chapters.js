/* 外送人生 — chapters (day-by-day story), regular customers (熟客) with multi-visit arcs */
(function (G) {
  const T = (s, who, text, choices, eff) => G.STORY.talk(s, who, text, choices, eff);
  const RES = (s, text, eff, who) => G.STORY.result(s, text, eff, who);
  const Chat = () => G.Chat;
  const rel = (s, id, d) => { const r = (s.reg[id] = s.reg[id] || { visits: 0, rel: 0 }); if (d) r.rel += d; return r.rel; };

  /* =====================================================
   * 熟客
   * ===================================================== */
  const GP = { name: '林阿公', portrait: null };
  const ST = { name: '小芸', portrait: null };
  const GM = { name: '阿哲', portrait: null };
  const VV = { name: 'Vivian', portrait: null };

  G.REGULARS = {
    /* ---------- 獨居阿公 ---------- */
    grandpa: {
      name: '林阿公', avatar: '👴', shop: '阿嬤滷肉飯', dest: '萬華區 獨居阿公家', note: '備註：麻煩幫我按兩次電鈴，我耳朵不好',
      visits: [
        async (s) => {
          await T(s, GP, '老公寓一樓的門開了。阿公穿著燙得很平的襯衫，頭髮梳得整整齊齊，好像在等什麼重要的客人。\n\n「少年仔，辛苦了。要不要進來喝杯茶？我一個人吃飯很無聊。」');
          const c = await T(s, 'me', '屋子裡很乾淨，牆上掛著一張很舊的結婚照。', [{ text: '「好啊，喝一杯就走。」' }, { text: '「歹勢阿公，我還有單。」' }]);
          if (c === 0) { rel(s, 'grandpa', 2); await RES(s, '阿公倒了兩杯烏龍茶。他說他以前在基隆碼頭扛貨，扛了四十年。\n「我太太走了以後，這個家就很安靜。」\n\n臨走前他說：「明天，也是你送嗎？」', { mood: 10 }, GP); return { delay: 10, tip: 20 }; }
          rel(s, 'grandpa', -1);
          await RES(s, '「好好好，去忙。」\n門關上前，你瞥見餐桌上只擺了一副碗筷。', { mood: -5 }, GP);
          return {};
        },
        async (s) => {
          await T(s, GP, '「你來了！」阿公今天特別有精神，手上拿著一台很新的智慧型手機。\n「我女兒從美國寄來的，她說可以『賴』。可是我不會用⋯⋯」\n「你可以幫我拍一張我在吃滷肉飯的照片，傳給她嗎？」');
          const c = await T(s, 'me', '阿公把手機遞給你，螢幕還貼著出廠保護膜。', [{ text: '幫他拍照，順便教他怎麼傳', cls: 'special' }, { text: '幫他拍一張就好' }, { text: '「阿公，我真的趕時間⋯⋯」' }]);
          if (c === 0) {
            rel(s, 'grandpa', 3);
            await RES(s, '你教了他三次怎麼按「傳送」。第四次他自己傳成功了，笑得像小孩。\n「你比我女兒還有耐心。」', { mood: 12 }, GP);
            setTimeout(() => Chat().ask(s, 'grandpa_daughter', '你好，我是林阿公的女兒。爸爸說是外送員教他用 LINE 的，還把你的帳號給我了。\n我在美國很久沒看到他笑成這樣。謝謝你。', [
              { text: '「阿公人很好，不客氣！」', eff: { mood: 6 }, resp: '如果他有什麼狀況⋯⋯可以麻煩你告訴我嗎？我知道這樣很不好意思。' },
              { text: '「他一個人吃飯，好像很寂寞。」', eff: { mood: 3 }, resp: '⋯⋯我知道。我在想辦法請假回去。謝謝你跟我說。', flags: { gp_daughter_told: true } },
            ]), 1500);
            return { delay: 12, tip: 50 };
          }
          if (c === 1) { rel(s, 'grandpa', 1); await RES(s, '你拍了一張。阿公看了很久：「我拍起來好老喔。」然後很開心地收好手機。', { mood: 5 }, GP); return { delay: 4, tip: 20 }; }
          rel(s, 'grandpa', -2);
          await RES(s, '「喔，好，沒關係。」阿公把手機收回口袋，自己對著它研究了起來。', { mood: -6 }, GP);
          return {};
        },
        async (s) => {
          await T(s, null, '你按了兩次電鈴。沒有人應。\n再按兩次。還是沒有。\n\n電視的聲音從屋裡傳出來，開得很大聲。你從門邊的小窗戶往裡看——\n\n阿公倒在廚房地上，旁邊是一個摔破的碗。');
          G.sfx.bad(); G.ui.fx('shake');
          const c = await T(s, 'me', '他沒有在動。', [
            { text: '打破窗戶進去，同時打 119', cls: 'special' },
            { text: '打 119，在門外等救護車' },
            { text: '把餐放門口，打電話給平台客服' },
          ]);
          if (c === 0) {
            rel(s, 'grandpa', 5); s.flags.gp_saved = 'fast';
            await RES(s, '你用安全帽敲破窗戶，爬進去。阿公還有呼吸，手很冰。你照著 119 的指示讓他側躺，一直跟他說話。\n\n救護車來的時候，阿公睜開眼睛，第一句話是：\n「⋯⋯滷肉飯，不要浪費。」', { mood: 15, money: -300, fame: 3 }, null);
            await T(s, null, '醫生說是輕微中風，送得早，應該不會有後遺症。\n你在急診室外面坐了一個小時，平台一直跳「訂單逾時」的通知。');
            setTimeout(() => Chat().msg(s, 'grandpa_daughter', '醫院打給我了。他們說是外送員破窗救了我爸。\n我訂了明天的機票。\n我不知道要怎麼謝謝你。'), 1200);
            s.flags.gp_reward_day = s.day + 2;
            return { delay: 60, noRating: true };
          }
          if (c === 1) {
            rel(s, 'grandpa', 3); s.flags.gp_saved = 'slow';
            await RES(s, '救護車十二分鐘後到。消防員破門進去。\n醫生說再晚一點就危險了。阿公被推上車時，眼睛有微微睜開，好像認出了你。', { mood: 5 }, null);
            setTimeout(() => Chat().msg(s, 'grandpa_daughter', '醫院說是外送員報的警。謝謝你。我會趕回台灣。'), 1200);
            s.flags.gp_reward_day = s.day + 2;
            return { delay: 30, noRating: true };
          }
          s.flags.gp_saved = 'no';
          await RES(s, '客服說：「好的，我們會記錄。請問餐點已送達嗎？」\n你把滷肉飯放在門口，騎走了。\n\n那天晚上，你一直夢到那個摔破的碗。', { mood: -30, flags: { guilt: true } }, null);
          setTimeout(() => Chat().burst(s, 'group', [['老王', '欸萬華那邊有個阿公在家裡倒下，隔天才被鄰居發現'], ['阿凱', '⋯⋯'], ['阿凱', '我們每天送那麼多家，到底有誰會注意到這種事']]), 2000);
          return {};
        },
      ],
      repeat: async (s) => {
        if (s.flags.gp_saved === 'no') {
          await T(s, null, '門口貼著一張紙：「屋主住院中，請勿投遞。」\n你站在那裡很久。');
          return { lost: true, noRating: true };
        }
        const lines = ['「今天也是你！」阿公舉起手機：「我自己會傳貼圖了喔，你看。」\n他傳了一張「早安」給你。現在是晚上七點。',
          '阿公在門口曬太陽：「我女兒說下個月要帶孫子回來。你要來吃飯喔，我請你。」',
          '阿公塞了一袋自己種的地瓜葉給你：「少年人要吃菜。」'];
        await RES(s, G.pick(lines), { mood: 8 }, GP);
        return { tip: 30 };
      },
    },

    /* ---------- 考生小芸 ---------- */
    student: {
      name: '小芸', avatar: '📚', shop: '雙倍珍奶專賣', dest: '中正區 大學宿舍', note: '備註：全糖！今天也要活下去',
      visits: [
        async (s) => {
          await T(s, ST, '宿舍門口衝出一個頭髮亂翹、戴著大框眼鏡的女生，手上還拿著一疊單字卡。\n「謝謝謝謝！我已經三天沒出門了⋯⋯研究所考試剩兩週，我快死了。」\n\n她突然把單字卡塞給你：「可以幫我抽考一題嗎？拜託，一題就好！」');
          const c = await T(s, 'me', '卡片上寫著「Hermeneutics」。你完全看不懂。', [{ text: '認真唸出來考她', cls: 'special' }, { text: '「這個字我也不會，我們一起死吧。」' }, { text: '「同學，我還要送下一單。」' }]);
          if (c === 0) { rel(s, 'student', 2); await RES(s, '「詮⋯⋯詮釋學！」她答對了，在宿舍門口跳起來。\n「你是我的幸運外送員！我叫小芸，以後都給你送！」', { mood: 10 }, ST); return { delay: 4, tip: 30 }; }
          if (c === 1) { rel(s, 'student', 1); await RES(s, '她笑到蹲在地上：「好！一起死！」然後很認真地說謝謝。', { mood: 8 }, ST); return { tip: 20 }; }
          await RES(s, '「啊對不起對不起！」她鞠了一個九十度的躬，跑回宿舍。', { mood: -2 }, ST);
          return {};
        },
        async (s) => {
          await T(s, ST, '小芸下來拿珍奶的時候，眼睛是腫的。\n「模擬考⋯⋯考爆了。」她吸了一大口珍奶，「全糖也救不了我。」\n「我爸媽說考不上就回去考公務員。我是不是根本不適合讀書？」');
          const c = await T(s, 'me', '她盯著地上，等你說話。', [
            { text: '「我以前也覺得自己什麼都做不好。」（講自己的事）', cls: 'special' },
            { text: '「模擬考爆，正式考才會好。」' },
            { text: '「要不要乾脆跟我一起跑外送？」' },
          ]);
          if (c === 0) { rel(s, 'student', 3); await RES(s, '你跟她講了你為什麼會開始跑外送。她安靜地聽完，然後說：「⋯⋯你很厲害耶。」\n「好，我再拚兩週。」', { mood: 8 }, ST); return { delay: 8, tip: 40 }; }
          if (c === 1) { rel(s, 'student', 2); await RES(s, '「⋯⋯真的嗎？」\n「真的。」你其實不知道是不是真的。但她笑了。', { mood: 5 }, ST); return { tip: 20 }; }
          rel(s, 'student', -1);
          await RES(s, '她愣了兩秒，然後大笑：「不要！你們看起來超累！」\n至少她笑了。', { mood: 3 }, ST);
          return {};
        },
        async (s) => {
          await T(s, ST, '今天的訂單是：二十杯珍奶。\n小芸在宿舍門口跟五個同學一起等你：「明天就考試了！今晚通宵！讀書會！」\n\n她把一個紅色的平安符塞進你手裡：「這是我媽從龍山寺求的。我已經有一個了，這個給你。騎車要平安喔。」');
          const c = await T(s, 'me', '平安符上還有淡淡的香味。', [{ text: '「那你明天一定會考上。」', cls: 'special' }, { text: '「這應該你留著吧⋯⋯」' }]);
          if (c === 0) { rel(s, 'student', 2); s.flags.charm = true; await RES(s, '「嗯！」她用力點頭。五個同學一起對你喊「謝謝外送員！」，整棟宿舍都聽到了。\n（獲得：龍山寺平安符——車禍時可能會保佑你一次）', { mood: 15 }, ST); return { tip: 100 }; }
          s.flags.charm = true;
          await RES(s, '「我說給你就給你！」她硬塞進你的外套口袋。\n（獲得：龍山寺平安符）', { mood: 8 }, ST);
          return { tip: 60 };
        },
        async (s) => {
          const pass = rel(s, 'student') >= 4;
          if (pass) {
            G.sfx.hero();
            await T(s, ST, '訂單是一個小蛋糕，備註寫著：「蛋糕是給外送員的。」\n\n小芸衝下樓，手機螢幕舉到你面前——\n【榜單】正取第三名。\n\n「我考上了！！！你是第一個知道的！連我爸媽都還沒講！」');
            await RES(s, '你們在宿舍門口用塑膠叉子分吃那個蛋糕。她說等她研究所畢業，第一份薪水要請你吃大餐。', { mood: 25 }, ST);
            Chat().msg(s, 'student', '外送員！！！我把你寫進我的感謝名單了（雖然只有我自己看得到）\n以後還是要給你送喔！！🧋');
            return { tip: 150 };
          }
          await T(s, ST, '訂單是一杯無糖綠茶。這不像她。\n小芸下來的時候，笑得很勉強：「備取⋯⋯第十二名。應該是沒希望了。」');
          const c = await T(s, 'me', '她手上沒有單字卡了。', [{ text: '「備取也是有機會的。」' }, { text: '陪她坐在宿舍門口的階梯上，什麼都不說' }]);
          await RES(s, c === 0 ? '「嗯⋯⋯」她點點頭，「明年再來一次也可以。這次至少我拚過了。」' : '你們坐了十分鐘。她最後站起來：「謝謝你。我想明年再試一次。」', { mood: 5 }, ST);
          return { tip: 30 };
        },
      ],
      repeat: async (s) => {
        await RES(s, G.pick(['小芸傳了一張她研究室的照片給你：「我的新家！」', '小芸今天點了兩杯：「一杯是給你的，全糖喔！」', '小芸下來拿的時候在講電話，對你比了一個大大的讚。']), { mood: 6, stamina: 5 }, ST);
        return { tip: 20 };
      },
    },

    /* ---------- 逃家少年阿哲 ---------- */
    gamer: {
      name: '阿哲', avatar: '🎮', shop: '公館大腸包小腸', dest: '西門町 網咖 B2', note: '備註：B2 第 37 號機，不要打電話',
      visits: [
        async (s) => {
          await T(s, GM, '網咖 B2 很暗，只有螢幕的光。37 號機坐著一個看起來頂多十五歲的男生，穿著國中運動服外套。\n他從口袋掏出一把銅板，一個一個數：「⋯⋯八十五、九十。」\n訂單金額是 $105。');
          const c = await T(s, 'me', '他的手指停在空掉的口袋裡。', [{ text: '「差的我幫你出。」', cls: 'special' }, { text: '「還差 15 塊喔。」' }]);
          if (c === 0) { rel(s, 'gamer', 2); await RES(s, '他看了你一眼，很小聲地說：「⋯⋯謝謝。」\n你注意到他的書包塞在椅子下面，看起來好幾天沒拿出來過。', { money: -15, mood: 5 }, GM); return {}; }
          rel(s, 'gamer', -1);
          await RES(s, '他在每個口袋都翻了一遍，最後從襪子裡拿出一枚十元和一枚五元。\n「⋯⋯給你。」他把大腸包小腸抱得很緊。', { mood: -3 }, GM);
          return {};
        },
        async (s) => {
          await T(s, GM, '還是 37 號機。阿哲趴在鍵盤上睡著了，旁邊放著一個裝滿衣服的書包。\n你把他叫醒，他嚇了一跳。\n\n「⋯⋯你不要跟別人說我在這裡。拜託。」');
          const c = await T(s, 'me', '網咖的店員在櫃台看手機，完全沒注意這裡。', [
            { text: '「你幾天沒回家了？」', cls: 'special' },
            { text: '把自己的 LINE 給他：「有事打給我。」' },
            { text: '「我只是送餐的。」放下就走' },
          ]);
          if (c === 0) { rel(s, 'gamer', 2); await RES(s, '「⋯⋯五天。」他低著頭，「我爸喝醉會打人。我媽叫我忍。」\n「我不想忍了。」\n\n你不知道該說什麼。他吃了一口大腸包小腸，說：「這個很好吃。」', { mood: -5 }, GM); s.flags.gm_knows = true; return { delay: 8 }; }
          if (c === 1) { rel(s, 'gamer', 3); s.flags.gm_line = true; await RES(s, '他盯著你的 QR code 看了很久，最後掃了。\n「⋯⋯你很奇怪耶。」但他嘴角好像動了一下。', { mood: 4 }, GM); return { delay: 3 }; }
          rel(s, 'gamer', -1);
          await RES(s, '你放下餐點，轉身走了。\n電梯門關上前，你聽到他又把頭趴回鍵盤上。', { mood: -4 }, GM);
          return {};
        },
        async (s) => {
          await T(s, GM, '你手機上是群組裡那張尋人啟事。照片裡的男生穿著國中制服，比現在胖一點，笑得很開心。\n\n37 號機。阿哲看到你的表情，就知道了。\n「⋯⋯你看到了對不對。」');
          const c = await T(s, 'me', '他的手抓著書包背帶，隨時準備跑。', [
            { text: '「我陪你去找社工，不是回家。」', cls: 'special' },
            { text: '偷偷傳訊息給尋人啟事上的電話' },
            { text: '「我什麼都沒看到。」' },
          ]);
          if (c === 0) {
            rel(s, 'gamer', 3); s.flags.gm_end = 'social';
            await RES(s, '你送完這單，下班後帶他去了少年隊。社工阿姨聽完他說的話，表情變得很嚴肅，說會安排他先住在安置機構。\n\n阿哲進去前回頭看你：「你明天還會送大腸包小腸嗎？」\n「如果你點的話。」', { mood: 18, fame: 2 }, GM);
            setTimeout(() => Chat().burst(s, 'group', [['老王', '欸尋人啟事那個孩子找到了，說是一個外送員陪他去少年隊的'], ['阿凱', '我們這行也是有好人的嘛'], ['小林', '是誰啦 出來領獎']]), 1500);
            return { delay: 20 };
          }
          if (c === 1) {
            rel(s, 'gamer', -3); s.flags.gm_end = 'called';
            await RES(s, '二十分鐘後，一個中年男人衝進網咖，滿身酒味。阿哲看到他的那一瞬間，臉色變得慘白。\n他被拖走的時候，看了你一眼。\n\n你這輩子大概不會忘記那個眼神。', { mood: -25 }, GM);
            return { delay: 10 };
          }
          s.flags.gm_end = 'secret';
          await RES(s, '「⋯⋯謝謝。」他很小聲地說。\n隔天，37 號機空了。你不知道他去了哪裡。', { mood: -8 }, GM);
          return {};
        },
      ],
      repeat: async (s) => {
        if (s.flags.gm_end === 'social') { await RES(s, '訂單送到安置機構。阿哲穿著乾淨的衣服下來拿：「這裡的飯很難吃，所以我還是點了。」\n他把一張畫著機車的圖塞給你。', { mood: 12 }, GM); return { tip: 10 }; }
        await RES(s, '37 號機坐著一個陌生的大學生。你把餐交給他，在 B2 多站了一下。', { mood: -3 }, null);
        return {};
      },
    },

    /* ---------- 奧客貴婦 Vivian ---------- */
    lady: {
      name: 'Vivian', avatar: '💎', shop: '鬆餅與貓', dest: '中山區 豪宅大廳', note: '備註：袋子不能有任何皺摺，謝謝。',
      visits: [
        async (s) => {
          await T(s, VV, '豪宅大廳的大理石地板亮到可以照出你的狼狽。一位戴著墨鏡的女士讓你等了十二分鐘才下樓。\n她看了一眼袋子：「這裡有一個摺痕。你知道這袋鬆餅是要拍照的嗎？」');
          const c = await T(s, 'me', '袋子確實有一個很小很小的摺痕。', [{ text: '「真的很抱歉，下次會注意。」' }, { text: '「鬆餅是用吃的吧？」', cls: 'angry' }, { text: '當場用手把摺痕撫平' }]);
          if (c === 0) { rel(s, 'lady', 1); await RES(s, '「哼。」她拿走鬆餅，給了三顆星。', { mood: -6, rating: -0.05 }, VV); return { delay: 12 }; }
          if (c === 1) { rel(s, 'lady', 1); await RES(s, '她摘下墨鏡，看了你很久：「⋯⋯你倒是很敢講。」\n她給了一顆星。但轉身時，你好像看到她嘴角動了一下。', { mood: 6, rating: -0.15 }, VV); return { delay: 12 }; }
          rel(s, 'lady', 2);
          await RES(s, '你很認真地把袋子撫平。她挑了挑眉：「⋯⋯算了。」給了四顆星。', { mood: -2 }, VV);
          return { delay: 12 };
        },
        async (s) => {
          await T(s, VV, '「你來得正好。」Vivian 手上牽著一隻戴著珍珠項圈的博美。\n「我的狗『億萬』該散步了，但我腳痠。你幫我牽牠繞中庭一圈，這個給你。」\n她拿出一張千元鈔票。');
          const c = await T(s, 'me', '億萬對你齜牙。', [{ text: '接下千元，去遛狗', cls: 'special' }, { text: '「我是外送員，不是遛狗的。」' }]);
          if (c === 0) { rel(s, 'lady', 2); await RES(s, '億萬拖著你繞了中庭三圈，還在噴水池旁邊上了大號。\n回來時 Vivian 坐在大廳沙發上看著你們，表情有點奇怪——好像很久沒有人陪她的狗玩了。', { money: 1000, stamina: -10, mood: 2 }, VV); return { delay: 15 }; }
          rel(s, 'lady', 1);
          await RES(s, '「⋯⋯也是。」她把錢收回去。\n你走的時候，她蹲下來摸摸億萬：「又只剩我們了。」', { mood: 2 }, VV);
          return {};
        },
        async (s) => {
          await T(s, VV, '今天是一個六吋的蛋糕，上面寫著「Happy Birthday Vivian」。\n她自己下樓拿的，沒有戴墨鏡，看起來老了十歲。\n「我老公說今天在香港開會。去年也是。前年也是。」');
          const c = await T(s, 'me', '大廳很大，只有你們兩個人和一隻狗。', [{ text: '在大廳唱生日快樂歌', cls: 'special' }, { text: '「生日快樂。」然後離開' }]);
          if (c === 0) {
            rel(s, 'lady', 3); G.sfx.love();
            await RES(s, '你唱得很難聽。管理員伯伯也跟著拍手，億萬跟著汪汪叫。\nVivian 笑了，笑到眼淚都流出來。\n\n她塞給你一個紅包：「不准拒絕。這是今年最好的生日禮物。」', { money: 2000, mood: 20 }, VV);
            return { tip: 0 };
          }
          await RES(s, '「謝謝。」她抱著蛋糕走進電梯。電梯門關上的時候，她對你揮了揮手。', { mood: 2 }, VV);
          return { tip: 100 };
        },
      ],
      repeat: async (s) => {
        await RES(s, G.pick(['Vivian 下樓時戴著墨鏡，但對你說了聲「謝謝」。管理員伯伯說，這是他第一次聽到她說謝謝。', '億萬看到你就搖尾巴。Vivian：「牠只對你這樣。」', 'Vivian 今天點了兩份鬆餅，把一份推給你：「我吃不完。」']), { mood: 8 }, VV);
        return { tip: 80 };
      },
    },
  };

  /* =====================================================
   * 劇情客人 / 特殊單
   * ===================================================== */
  G.SPECIAL = {
    tutorial: async (s) => {
      await T(s, { name: '客人', portrait: null }, '門開了一條縫，一隻手伸出來接走便當。\n「謝。」\n門關上了。');
      await T(s, { name: '熊喵外送', portrait: null }, '【新手提示】完成第一單！\n・每張單都在限時內送到，評分才會好。\n・路上撞到東西，餐會灑；高速撞到車，會出車禍。\n・手機右邊的「LINE」分頁會收到訊息，記得看。');
      return {};
    },
    kai_pickup: async (s) => {
      const K = { name: '阿凱', portrait: null };
      await T(s, K, '店門口，一個穿粉紅色雨衣、背「優怕食」保溫箱的騎士正在跟老闆吵架。\n「我的單已經等四十分鐘了！」\n\n他回頭看到你：「新來的？熊喵的？」上下打量你，「你的雨衣是 7-11 買的那種吧，撐不過今天。」');
      const c = await T(s, 'me', '他的雨衣看起來很專業。', [{ text: '「那你的雨衣哪裡買的？」' }, { text: '「關你什麼事。」' }]);
      if (c === 0) { await RES(s, '「五金行，三百五，雙層。」他把店名打在你手機備忘錄裡。\n「我叫阿凱。下雨天別騎內線，水最深。」', { mood: 6, flags: { kai_friend: 1 } }, K); }
      else await RES(s, '「嘖，脾氣很大嘛。」他笑了，「我叫阿凱，以後常見面。」', { mood: 2, flags: { kai_friend: 0 } }, K);
      setTimeout(() => Chat().ask(s, 'kai', '欸新來的，我是阿凱。我把你加進騎士互助會了，有事群組喊。\n今天雨很大，你活著吧？', [
        { text: '「活著，鞋子裡可以養魚。」', eff: { mood: 4 }, resp: '哈哈 歡迎來到地獄。去五金行買雨鞋套，人生會好很多。' },
        { text: '「為什麼要加我？」', resp: '這行沒朋友很難活啦。你之後就知道。' },
      ]), 2500);
      return { delay: 8 };
    },
    kai_typhoon: async (s) => {
      const K = { name: '阿凱', portrait: null };
      G.sfx.siren();
      await T(s, null, '颱風天的士林夜市空無一人，招牌被吹得匡匡作響。\n巷子口躺著一台機車——粉紅色的優怕食保溫箱翻在水裡。\n\n阿凱坐在騎樓下，抱著右腳，臉色發白。「⋯⋯嘿。被你看到這麼遜的樣子。」');
      const c = await T(s, 'me', '他的腳踝腫得像麵包。你的單還在保溫箱裡。', [
        { text: '先載他去醫院，單晚點再說', cls: 'special' },
        { text: '幫他叫救護車，陪他等' },
        { text: '「你自己叫車，我單要超時了。」' },
      ]);
      if (c === 0) {
        await RES(s, '你讓他坐在後座，一路頂著風騎到急診。他在後面一直罵你騎太慢，又一直說謝謝。\n\n你的單超時了四十分鐘。', { mood: 15, stamina: -15, flags: { kai_friend: 3 } }, K);
        setTimeout(() => Chat().burst(s, 'group', [['阿凱', '各位 我今天在颱風天摔車'], ['阿凱', '是新來的那個熊喵把我載去醫院的'], ['阿凱', '我欠他一條命 以後誰敢搶他的單我就搶誰的單'], ['老王', '感人'], ['小林', '颱風天還出門的都是神經病']]), 1500);
        return { delay: 40 };
      }
      if (c === 1) { await RES(s, '救護車來之前，你們在騎樓下聊了二十分鐘。他說他跑外送是為了養他媽媽和弟弟。\n「謝啦，兄弟。」', { mood: 8, flags: { kai_friend: 2 } }, K); return { delay: 20 }; }
      await RES(s, '「⋯⋯也是。」他低頭撥電話。\n你騎走的時候，雨下得更大了。', { mood: -12, flags: { kai_friend: 0 } }, K);
      return {};
    },
  };

  /* =====================================================
   * 章節：每一天的劇本
   * orders: { time, cust | special | story | generic, route, when }
   * ===================================================== */
  const gen = (time, extra) => Object.assign({ time, generic: true }, extra || {});
  const nurse = (time) => ({ time: time || 21 * 60 + 30, story: 'nurse', when: (s) => G.STORY.nurseCan(s) });

  G.CHAPTERS = {
    1: {
      title: '第一章　新手上路', weather: 'sun',
      orders: [
        { time: 11 * 60 + 30, special: 'tutorial', shop: '巷口自助餐', dest: '松山區 小套房' },
        { time: 12 * 60 + 40, cust: 'grandpa' },
        { time: 15 * 60, cust: 'student' },
        gen(19 * 60),
      ],
      night: async (s) => {
        Chat().ask(s, 'mom', '有沒有好好吃飯？\n你那個工作很危險，騎車要小心喔。', [
          { text: '「有啦，今天吃了滷肉飯。」', eff: { mood: 5 }, resp: '那就好。我匯了一千塊給你，不要跟你爸說。', next: null },
          { text: '「放心啦，我騎很慢。」', eff: { mood: 3 }, resp: '騙人。你從小騎腳踏車就最快。' },
        ]);
        G.apply(s, { money: 1000 });
      },
    },
    2: {
      title: '第二章　雨天與同行', weather: 'rain',
      orders: [
        { time: 11 * 60, special: 'kai_pickup', shop: '師大鹽酥雞', dest: '大安區 老公寓 5 樓（無電梯）', pickup: true },
        { time: 13 * 60 + 30, cust: 'lady' },
        { time: 17 * 60, cust: 'gamer' },
        nurse(),
      ],
      night: async (s) => {
        Chat().burst(s, 'group', [['阿凱', '歡迎新人 @' + s.name], ['老王', '歡迎～ 這裡是熊喵騎士互助會'], ['小林', '群組規定：1.不准推銷 2.每天報平安 3.看到警察要喊'], ['老王', '今天大安區那邊淹水 大家小心']]);
      },
    },
    3: {
      title: '第三章　開門殺', weather: 'cloud',
      orders: [
        { time: 11 * 60, cust: 'grandpa' },
        gen(13 * 60, { route: 'door' }),
        { time: 16 * 60, cust: 'student' },
        nurse(),
      ],
      night: async (s) => {
        if (s.flags.crash_met && !s.flags.crash_chat1) {
          s.flags.crash_chat1 = true;
          Chat().ask(s, 'crash', '你好，我是陳思遠⋯⋯就是今天開車門的人。\n保險公司說要你提供診斷書跟修車估價單。\n還有⋯⋯你的傷還好嗎？我一直睡不著。', [
            { text: '「還活著。單據我晚點傳你。」', eff: { aff: { crash: 6 }, money: 3000 }, flags: { crash_stage: 2 }, resp: '好！！謝謝你！！我先匯 3000 給你墊醫藥費。（傳送了一張鞠躬的貼圖）' },
            { text: '「你睡不著？我膝蓋痛到睡不著欸。」', eff: { aff: { crash: 9 }, money: 3000, mood: 4 }, flags: { crash_stage: 2 }, resp: '對不起對不起對不起\n我先匯 3000，附註「膏藥錢」。\n明天我去買膏藥⋯⋯不對，我不知道你住哪，這樣好像怪怪的' },
            { text: '傳一張貼圖：熊貓比讚', eff: { aff: { crash: 12 }, money: 3000, mood: 6 }, flags: { crash_stage: 2 }, resp: '⋯⋯是熊喵外送的那隻熊貓嗎？\n（傳送了一張一樣的熊貓貼圖）\n我先匯 3000 給你。' },
          ]);
        }
      },
    },
    4: {
      title: '第四章　B2 的 37 號機', weather: null,
      orders: [
        gen(11 * 60 + 30),
        { time: 12 * 60 + 30, cust: 'gamer' },
        { time: 14 * 60 + 30, cust: 'lady' },
        nurse(),
      ],
      night: async (s) => {
        Chat().burst(s, 'group', [['小林', '今天有人在內湖被開門殺嗎 我看到新聞'], ['阿凱', '那不是我們的新人嗎'], ['老王', '保險要記得申請啊 不要被凹']]);
      },
    },
    5: {
      title: '第五章　平安符', weather: 'sun',
      orders: [
        gen(11 * 60),
        { time: 15 * 60, cust: 'student' },
        gen(18 * 60 + 30, { route: 'thief' }),
        nurse(),
      ],
    },
    6: {
      title: '第六章　運費調降', weather: null,
      morning: async (s) => {
        Chat().msg(s, 'platform', '【系統公告】親愛的騎士夥伴，為了提供更優質的服務，即日起「基本運費」將進行「優化調整」。');
        Chat().burst(s, 'group', [['小林', '優化調整 = 每單少十塊'], ['老王', '???'], ['阿凱', '我們這週三在總部樓下抗議 要來的+1'], ['老王', '+1'], ['小林', '+1 反正也是要被餓死']]);
        await G.Game.runEventById('platform_notice');
        Chat().burst(s, 'group', [['阿哲媽媽', '（轉傳）【尋人啟事】林哲宇，15歲，已失蹤一週，最後出現在西門町一帶。如有消息請聯絡 09xx-xxx-xxx'], ['老王', '大家跑西門町的幫忙注意一下']]);
      },
      orders: [
        gen(11 * 60),
        { time: 13 * 60, cust: 'lady' },
        { time: 17 * 60 + 30, cust: 'gamer' },
        nurse(),
      ],
    },
    7: {
      title: '第七章　兩次電鈴', weather: 'cloud',
      orders: [
        { time: 11 * 60 + 30, cust: 'grandpa' },
        { time: 15 * 60 + 30, cust: 'student' },
        gen(18 * 60),
        nurse(),
      ],
    },
    8: {
      title: '第八章　深夜的捷運站', weather: null,
      orders: [
        gen(12 * 60),
        { time: 14 * 60, cust: 'lady' },
        gen(21 * 60, { route: 'knife' }),
        nurse(22 * 60),
      ],
      night: async (s) => {
        if (s.flags.gp_reward_day && !s.flags.gp_rewarded) {
          s.flags.gp_rewarded = true;
          Chat().ask(s, 'grandpa_daughter', '我回台灣了，爸爸恢復得很好，一直說要請「那個少年仔」吃飯。\n我轉了一點心意給你，請一定要收下。', [
            { text: '「不用啦！阿公沒事就好。」', eff: { money: 3000, mood: 15 }, resp: '已經轉了，退不回來的 😊\n爸說他要親手滷一鍋肉給你。' },
            { text: '「謝謝，我會去看阿公的。」', eff: { money: 3000, mood: 18 }, resp: '他一定會很開心。他每天都在問你今天有沒有送他家的單。' },
          ]);
        }
      },
    },
    9: {
      title: '第九章　颱風天', weather: 'typhoon',
      morning: async (s) => {
        Chat().msg(s, 'platform', '【颱風加成】今日每單加成 +$70！請騎士注意安全（但我們還是會派單給你）。');
        Chat().burst(s, 'group', [['老王', '這種天氣還出門的都是勇者'], ['阿凱', '我要跑 我媽下週要開刀'], ['小林', '凱哥小心啊']]);
      },
      orders: [
        gen(12 * 60),
        { time: 19 * 60, special: 'kai_typhoon', shop: '深夜牛肉麵', dest: '士林 夜市旁巷子' },
        nurse(),
      ],
    },
    10: {
      title: '第十章　告白', weather: 'sun',
      orders: [
        { time: 12 * 60, story: 'crash', when: (s) => G.STORY.crashCan(s), alt: gen(12 * 60) },
        { time: 15 * 60, cust: 'grandpa' },
        gen(18 * 60),
        nurse(21 * 60 + 30),
      ],
      night: async (s) => {
        await T(s, null, '第一季　完\n\n台北的夜還很長，單還是會一直來。\n從明天開始是無盡模式：熟客、愛情線和隱藏劇情都還會繼續發生。');
        Chat().burst(s, 'group', [['阿凱', '撐過十天的新人 恭喜轉正'], ['老王', '🎉'], ['小林', '請客請客']]);
      },
    },
  };

  /** Endless days after the first season */
  G.genEndlessDay = function (s) {
    const orders = [];
    const regs = Object.keys(G.REGULARS).filter((k) => (s.reg[k] || {}).visits >= 1);
    const times = [11 * 60 + 30, 14 * 60, 18 * 60, 21 * 60 + 30];
    times.forEach((t, i) => {
      if (i === 3 && G.STORY.nurseCan(s)) return orders.push(nurse(t));
      if (i === 0 && G.STORY.crashCan(s)) return orders.push({ time: 12 * 60, story: 'crash' });
      if (regs.length && G.chance(0.45)) return orders.push({ time: t, cust: G.pick(regs) });
      const r = Math.random();
      orders.push(gen(t, { route: r < 0.04 && !s.flags.hero_knife && i >= 2 ? 'knife' : r < 0.08 && !s.flags.hero_thief ? 'thief' : null }));
    });
    return orders;
  };
})(window.G);
