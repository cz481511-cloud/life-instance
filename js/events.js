/* 外送人生 — random events (data-driven)
 * phase: 'pickup' 取餐 / 'route' 路上 / 'arrive' 送達 / 'morning' 早上在家
 * weight: number | (s, ctx) => number
 * cond:   (s, ctx) => bool
 * choices[].go(s, ctx) => { text, eff, delay, lost, spill, hospital, crash, end, who }
 */
(function (G) {
  const R = (text, eff, extra) => Object.assign({ text, eff }, extra || {});
  const night = (ctx) => ctx.slot && ctx.slot.id === 'night';
  const rainy = (s) => s.weather === 'rain' || s.weather === 'typhoon';

  G.EVENTS = [
    /* ================= 取餐 ================= */
    {
      id: 'slow_kitchen', phase: 'pickup', weight: 10,
      text: (s, c) => `${c.order.shop} 的老闆頭也不抬：「等一下喔，前面還有 23 張單。」\n櫃台上堆滿了寫著各家平台名字的袋子。`,
      choices: [
        { text: '乖乖等', go: () => R('你等了 18 分鐘，滑完了三輪限時動態。', { mood: -4 }, { delay: 18 }) },
        { text: '「老闆，這單快超時了，拜託！」', go: () => G.chance(0.5)
            ? R('老闆看你一眼，默默把你的單往前移。人情味還在。', { mood: 3 }, { delay: 6 })
            : R('「每個人都快超時啦！」老闆吼回來。你等得更久了。', { mood: -8 }, { delay: 22 }) },
        { text: '取消這單（評分會掉）', go: () => R('你按下取消。平台跳出警告：「頻繁取消將影響您的派單權重。」', { rating: -0.08, mood: -3 }, { lost: true }) },
      ],
    },
    {
      id: 'twenty_drinks', phase: 'pickup', weight: (s, c) => (c.order.icon === 'tea' ? 8 : 0),
      text: () => '店員推出兩個大提袋：「20 杯，全糖去冰、半糖少冰、微糖微冰、無糖正常冰⋯⋯分很清楚了喔！」\n你的機車掛勾只有一個。',
      choices: [
        { text: '用腳夾著騎（危險）', go: () => G.chance(0.4)
            ? R('過彎時一袋整個翻倒，你的褲子現在是全糖去冰。', { mood: -10, rating: -0.1 }, { spill: true })
            : R('你用驚人的核心肌群撐到了目的地。你覺得自己可以去考特技執照。', { stamina: -8, mood: 5 }) },
        { text: '跟店家借紙箱綁在腳踏板', go: () => R('店員很熱心幫你綁好，還送你一杯做錯的冬瓜茶。', { mood: 6, stamina: 2 }, { delay: 6 }) },
      ],
    },
    {
      id: 'wrong_bag', phase: 'pickup', weight: 5,
      text: (s, c) => `你騎到一半才發現，${c.order.shop} 給你的袋子上寫的是別人的名字。`,
      choices: [
        { text: '騎回去換', go: () => R('來回多花了 12 分鐘。店員連說三次不好意思，塞給你一包薯條。', { mood: 2 }, { delay: 12 }) },
        { text: '算了，反正都是食物', go: () => R('客人打開袋子：「我點的是素食便當，為什麼裡面有豬腳？」', { rating: -0.15, mood: -6 }) },
      ],
    },

    /* ================= 路上 ================= */
    {
      id: 'red_light', phase: 'route', weight: 12,
      text: () => '你遇到一個 150 秒的紅燈。左右沒車。時間條在跳。',
      choices: [
        { text: '等', go: () => R('你等完了紅燈，順便喝了一口水。人生就是在等紅燈。', { stamina: 2 }, { delay: 3 }) },
        { text: '闖過去', cls: 'angry', go: () => G.chance(0.3)
            ? R('路口那台黑色車突然閃起紅藍燈。罰單：$1,800。', { money: -1800, mood: -15 }, { delay: 8 })
            : R('你像風一樣闖了過去。良心痛了一下下。', { mood: -1 }, { delay: -3 }) },
      ],
    },
    {
      id: 'dog_chase', phase: 'route', weight: (s, c) => (c.route.id === 'alley' ? 10 : 3),
      text: () => '小巷子裡衝出三隻狗，帶頭那隻的眼神跟你前主管很像。',
      choices: [
        { text: '催油門逃走', go: () => G.chance(0.7)
            ? R('你成功甩開牠們。腎上腺素讓你精神一振。', { stamina: 3, mood: -2 }, { delay: -2 })
            : R('你逃走了，但湯灑出來一半。', { mood: -6 }, { spill: true }) },
        { text: '丟一塊炸雞給牠們（客人的）', go: () => R('狗安靜了。客人收到少一塊的炸雞，給了你兩顆星。', { rating: -0.12, mood: 4 }) },
        { text: '停下來跟牠們講道理', go: () => R('你蹲下來說：「我也是為了生活。」帶頭的狗聞了聞你，掉頭走了。\n你覺得自己被理解了。', { mood: 8 }, { delay: 5 }) },
      ],
    },
    {
      id: 'gps_lost', phase: 'route', weight: 8,
      text: () => '導航：「請在前方 200 公尺迴轉。」\n導航：「請在前方 200 公尺迴轉。」\n導航：「請在前方⋯⋯」你已經繞第三圈了。',
      choices: [
        { text: '相信導航', go: () => R('導航把你帶進了一條死巷，巷底有一隻貓在看你。', { mood: -6 }, { delay: 10 }) },
        { text: '問路邊的阿伯', go: () => R('阿伯指路很清楚，最後還問你要不要買他的芭樂。', { mood: 4 }, { delay: 4 }) },
      ],
    },
    {
      id: 'rain_slip', phase: 'route', weight: (s) => (rainy(s) ? 14 : 0),
      text: () => '雨大到雨衣根本沒用，你的鞋子裡已經可以養魚。前面路口有一攤油漬。',
      choices: [
        { text: '慢慢騎過去', go: () => R('你安全通過，但又多晚了幾分鐘。', { stamina: -4 }, { delay: 5 }) },
        { text: '不減速', cls: 'angry', go: () => G.chance(0.35)
            ? R('輪胎一滑，你連人帶車滑行了三公尺。', { stamina: -15, bike: -12, mood: -12 }, { spill: true, crash: 'minor' })
            : R('你帥氣地穿過水花，濺了路邊的西裝男一身。他對你比了個手勢。', { mood: 2 }, { delay: -2 }) },
      ],
    },
    {
      id: 'police_check', phase: 'route', weight: (s, c) => (c.route.id === 'wrong' ? 16 : 3),
      who: { name: '交通警察', portrait: null },
      text: (s, c) => (c.route.id === 'wrong' ? '你逆向騎到一半，前方警察舉起了指揮棒。「先生小姐，靠邊。」' : '前方臨檢，警察示意你停車。「駕照行照拿出來。」'),
      choices: [
        { text: '乖乖配合', go: (s, c) => (c.route.id === 'wrong'
            ? R('逆向行駛，罰單 $900。警察還提醒你：「外送很辛苦，但命比較重要。」', { money: -900, mood: -10 }, { delay: 10 })
            : R('證件齊全。警察說：「辛苦了，騎慢點。」', { mood: 2 }, { delay: 6 })) },
        { text: '「我的雞排快冷了！」', go: () => R('警察看了一眼你的保溫箱：「⋯⋯去吧去吧。」\n你不確定這算不算一種公權力的溫柔。', { mood: 5 }, { delay: 2 }) },
      ],
    },
    {
      id: 'breakdown', phase: 'route', weight: (s) => (s.bike < 35 ? 18 : 1),
      text: () => '機車發出「咳、咳、噗——」的聲音，然後安靜了。',
      choices: [
        { text: '牽去最近的機車行', go: () => R('師傅說：「你這台是不是很久沒保養？」修理費 $650。', { money: -650, bike: 25, mood: -8 }, { delay: 25 }) },
        { text: '用力踹它', cls: 'angry', go: () => G.chance(0.5)
            ? R('奇蹟般地發動了。台灣機車的韌性跟你一樣。', { bike: 3, mood: 4 }, { delay: 3 })
            : R('它沒動，你的腳很痛。最後還是牽去機車行。', { money: -650, bike: 25, stamina: -6, mood: -12 }, { delay: 30 }) },
      ],
    },
    {
      id: 'pothole', phase: 'route', weight: 6,
      text: () => '你沒看到那個坑洞。整台車彈起來，保溫箱發出「砰」的一聲。',
      choices: [
        { text: '停下來檢查餐點', go: () => R('湯灑了一點點，你用衛生紙擦乾淨。應該⋯⋯沒人會發現。', { bike: -4 }, { delay: 3 }) },
        { text: '不管了繼續騎', go: () => (G.chance(0.5) ? R('一切正常。', { bike: -5 }) : R('客人收到一碗「乾拌」牛肉麵。', { bike: -5, rating: -0.1 }, { spill: true })) },
      ],
    },
    {
      id: 'grandma_ask', phase: 'route', weight: 4,
      who: { name: '路邊阿嬤', portrait: null },
      text: () => '等紅燈時，一位阿嬤拉住你：「少年仔，龍山寺要往哪走？」',
      choices: [
        { text: '仔細告訴她', go: () => R('阿嬤從口袋拿出一顆橘子塞給你。這顆橘子是今天最甜的東西。', { mood: 8, stamina: 3 }, { delay: 3 }) },
        { text: '「歹勢，我在趕！」', go: () => R('你騎走了。後照鏡裡阿嬤還站在原地。', { mood: -5 }) },
      ],
    },
    {
      id: 'rival_lane', phase: 'route', weight: 5,
      who: { name: '粉紅色外套的同行', portrait: null },
      text: () => '一台掛著「優怕食」保溫箱的機車從你旁邊鑽過去，騎士回頭對你挑了一下眉。',
      choices: [
        { text: '加速追上去', go: () => G.chance(0.6)
            ? R('你在下一個紅燈追上了他。你們同時看了對方一眼，然後都笑了。', { mood: 6, stamina: -5 }, { delay: -3 })
            : R('你追過頭了，錯過了該轉的路口。', { mood: -5 }, { delay: 6 }) },
        { text: '算了，人生不是比賽', go: () => R('你維持原速。他在下一個路口被警察攔下來了。', { mood: 5 }) },
      ],
    },

    /* ================= 送達 ================= */
    {
      id: 'no_answer', phase: 'arrive', weight: 10,
      text: () => '你到了。打電話給客人，響了十聲，沒人接。\n平台規定要等 8 分鐘才能放在門口。',
      choices: [
        { text: '繼續打', go: () => R('第七通客人終於接了：「啊我在洗澡。」', { mood: -6 }, { delay: 8 }) },
        { text: '等 8 分鐘後放門口拍照', go: () => R('你拍了一張構圖完美的照片。說不定可以參加攝影比賽。', { mood: -2 }, { delay: 8 }) },
      ],
    },
    {
      id: 'guard_block', phase: 'arrive', weight: (s, c) => (['office', 'luxury'].includes(c.order.dest.type) ? 14 : 0),
      who: { name: '大樓管理員', portrait: null },
      text: () => '管理員伯伯攔住你：「外送不能上樓，請客人下來拿。」\n客人在電話裡：「我在開會，你送上來啦，32 樓。」',
      choices: [
        { text: '在大廳等客人下來', go: () => R('客人 15 分鐘後下來，臉很臭，好像遲到的是你。', { mood: -8, rating: -0.05 }, { delay: 15 }) },
        { text: '跟管理員聊天套交情', go: () => G.chance(0.55)
            ? R('你們聊到他當兵的故事。他揮揮手：「去吧，快去快回。」', { mood: 6 }, { delay: 6 })
            : R('他聽完你的故事，還是說不行。但他給了你一顆喉糖。', { mood: 1 }, { delay: 12 }) },
      ],
    },
    {
      id: 'telepathy', phase: 'arrive', weight: 5, once: true,
      text: () => '訂單備註：「不要按電鈴，不要打電話，不要敲門。請用心電感應通知我。」',
      choices: [
        { text: '站在門口用力想「我到了」', go: () => G.chance(0.5)
            ? R('門開了。客人說：「我收到了。」\n你不知道這世界怎麼了。', { mood: 10, money: 50 })
            : R('五分鐘後什麼都沒發生。你把餐放門口，傳了一則「已送達（用想的）」。', { mood: -3 }, { delay: 5 }) },
        { text: '直接按電鈴', go: () => R('客人開門，眼神充滿失望：「你沒有感應到嗎？」一顆星。', { rating: -0.15, mood: -4 }) },
      ],
    },
    {
      id: 'not_at_door', phase: 'arrive', weight: 8,
      text: () => '客人傳訊息：「我在門口了，你在哪？」\n你也在門口。門口沒有人。',
      choices: [
        { text: '傳照片給客人', go: () => R('原來客人在「隔壁棟」的門口。你們隔著一條巷子對望。', { mood: -4 }, { delay: 5 }) },
        { text: '大喊客人的名字', go: () => R('全巷子的人都探出頭來。客人從某一扇窗戶害羞地揮手。', { mood: 3 }, { delay: 3 }) },
      ],
    },
    {
      id: 'walkup', phase: 'arrive', weight: (s, c) => (c.order.dest.type === 'walkup' ? 14 : 0),
      text: () => '五樓，沒電梯，樓梯間的燈是壞的。客人：「麻煩送上來喔～」',
      choices: [
        { text: '爬！', go: () => R('你喘著氣到了五樓。客人說：「辛苦了！」然後關門。沒有小費。', { stamina: -10 }, { delay: 4 }) },
        { text: '「能不能下來拿呢？」', go: () => G.chance(0.5)
            ? R('客人穿著拖鞋下來，還塞給你 $30 小費：「下雨辛苦了。」', { money: 30, mood: 6 })
            : R('客人：「不能，你們不就是要送到家嗎？」你還是爬了。', { stamina: -10, mood: -6 }, { delay: 6 }) },
      ],
    },
    {
      id: 'grave', phase: 'arrive', weight: (s, c) => (c.order.dest.type === 'grave' ? 30 : 0),
      text: (s) => `晚上 ${G.fmtClock(s.clock)}，導航帶你騎上一條沒有路燈的山路。目的地是⋯⋯墓園管理處。\n訂單備註：「放在第三排第七個就可以了，謝謝。」`,
      choices: [
        { text: '照著備註放', go: () => R('你放下便當，雙手合十。回到車上時，手機跳出 $200 小費通知。付款人欄位是空白的。', { money: 200, mood: -10 }) },
        { text: '打電話給客人確認', go: () => R('接電話的是管理處的大叔：「喔那是我啦，我在第三排第七個那邊巡邏。」\n你鬆了一口氣，然後覺得自己很蠢。', { mood: 5 }, { delay: 3 }) },
      ],
    },
    {
      id: 'old_man', phase: 'arrive', weight: (s, c) => (c.order.dest.type === 'oldman' ? 20 : 0),
      who: { name: '獨居阿公', portrait: null },
      text: () => '阿公開門時穿著整齊的襯衫，好像在等客人。「少年仔，要不要進來喝杯茶？我一個人吃飯很無聊。」',
      choices: [
        { text: '坐下來陪他聊十分鐘', go: () => R('阿公講了他年輕時在碼頭工作的故事。臨走時他說：「明天還是你送喔。」', { mood: 12, rating: 0.05 }, { delay: 10, flags: { oldman_friend: true } }) },
        { text: '「歹勢阿公，我還有單。」', go: () => R('阿公說：「好好好，去忙。」門關上前，你看到餐桌上只有一副碗筷。', { mood: -6 }) },
      ],
    },
    {
      id: 'underwear', phase: 'arrive', weight: 4,
      text: () => '門一開，客人只穿了一條印著海綿寶寶的內褲，非常自在地接過餐點。',
      choices: [
        { text: '保持專業微笑', go: () => R('「祝您用餐愉快。」你的專業連自己都感動。', { mood: 2, rating: 0.03 }) },
        { text: '忍不住笑出來', go: () => R('客人也笑了：「很可愛吧？」他給了你 $50 小費。', { money: 50, mood: 6 }) },
      ],
    },
    {
      id: 'kind_tip', phase: 'arrive', weight: (s) => (rainy(s) ? 10 : 4),
      who: { name: '客人', portrait: null },
      text: (s) => `開門的是一位阿姨，看到你全身濕透：「哎唷${G.call(s)}，這給你。」\n她塞給你一罐熱的麥香跟 $100。`,
      choices: [
        { text: '「謝謝阿姨！」', go: () => R('今天的你，被溫柔接住了一下。', { money: 100, mood: 14, stamina: 4 }) },
      ],
    },
    {
      id: 'weather_review', phase: 'arrive', weight: (s) => (rainy(s) ? 7 : 0),
      text: () => '客人收餐時一臉不爽：「怎麼這麼久？」\n你身後的雨下得像有人在倒水。',
      choices: [
        { text: '「不好意思，雨很大。」', go: () => R('客人：「下雨不是理由。」一顆星，評論：「外送員態度差」。', { rating: -0.12, mood: -10 }) },
        { text: '默默把滴水的安全帽脫下來', go: () => R('客人看著你濕透的頭髮，沉默了兩秒：「⋯⋯辛苦了。」', { mood: 3 }) },
        { text: '「那下次你自己去買。」', cls: 'angry', cond: (s) => s.mood < 35, go: () => R('門被甩上了。你知道這一顆星躲不掉，但你覺得很爽。', { rating: -0.2, mood: 12 }) },
      ],
    },
    {
      id: 'ex_colleague', phase: 'arrive', weight: (s) => (s.origin === 'laidoff' ? 8 : 0), once: true,
      who: { name: '前同事 Kevin', portrait: null },
      text: () => '內湖科技園區。來拿餐的人是你以前的同事 Kevin，他手上還掛著你曾經也有的那張識別證。\n「欸？你⋯⋯？」',
      choices: [
        { text: '「好久不見！我現在創業中。」', go: () => R('「⋯⋯外送也是創業嗎？」你們尷尬地笑了。他點了你的五星，還多給了 $200。', { money: 200, mood: -6 }) },
        { text: '「祝您用餐愉快。」轉身就走', go: () => R('你走得很快。電梯門關上的那一刻，你把安全帽面罩拉了下來。', { mood: -12 }) },
      ],
    },
    {
      id: 'professor', phase: 'arrive', weight: (s) => (s.origin === 'student' ? 8 : 0), once: true,
      who: { name: '王教授', portrait: null },
      text: () => '你按了門鈴，開門的是你這學期微積分的教授。\n「你⋯⋯不是坐最後一排那個？期中報告呢？」',
      choices: [
        { text: '「老師，報告我送來了。」遞上便當', go: () => R('教授愣了一下，然後大笑：「延一週。下次別用便當賄賂我。」', { mood: 10, flags: { prof_ok: true } }) },
        { text: '「老師你認錯人了。」', go: () => R('「你的機車貼紙跟你書包上的一樣。」\n你的平時成績可能保不住了。', { mood: -10 }) },
      ],
    },
    {
      id: 'fan', phase: 'arrive', weight: (s) => (s.origin === 'musician' ? 8 : 0), once: true,
      text: () => '客人盯著你看了很久：「欸，你是不是『凌晨三點半』的主唱？我有去過你們在河岸留言的演出！」',
      choices: [
        { text: '當場清唱一段', go: () => R('客人錄了影片傳上網。隔天粉專多了 40 個讚。總共 127 個。', { mood: 15, fame: 3 }) },
        { text: '「你認錯了。」（其實好開心）', go: () => R('你下樓的時候偷偷笑了。原來真的有人記得。', { mood: 10 }) },
      ],
    },

    /* ================= 早上在家 ================= */
    {
      id: 'mom_call', phase: 'morning', weight: 6,
      who: { name: '媽媽（電話）', portrait: null },
      text: () => '「有沒有好好吃飯？」\n「有啦。」你看著桌上那三個泡麵碗。\n「你那個工作很危險，騎車要小心喔。」',
      choices: [
        { text: '「放心啦，我騎很慢。」', go: () => R('媽媽說了二十分鐘才掛電話，最後還是匯了 $1,000 給你。', { money: 1000, mood: 8 }) },
        { text: '「我在忙，晚點打給你。」', go: () => R('你掛掉電話。晚點，通常就是不會打。', { mood: -5 }) },
      ],
    },
    {
      id: 'landlord', phase: 'morning', weight: (s) => ((s.day % 7) >= 5 ? 10 : 0),
      who: { name: '房東太太', portrait: null },
      text: () => '門縫底下塞進一張紙條：「房租週日要繳喔～ 順便，樓上說你的機車太晚回來很吵。」',
      choices: [
        { text: '好的好的', go: () => R('你把紙條貼在冰箱上，旁邊是上個月的紙條。', { mood: -3 }) },
      ],
    },
    {
      id: 'platform_notice', phase: 'morning', weight: 0, // 由主線在第 6 天觸發
      who: { name: '熊喵外送 官方公告', portrait: null },
      text: () => '【系統公告】親愛的騎士夥伴，為了提供更優質的服務，即日起「基本運費」將進行「優化調整」。\n（翻譯：每單少 $10。）\n\n外送員群組瞬間炸了。',
      choices: [
        { text: '在群組罵髒話', go: () => R('群組有 200 則訊息，其中 180 則是髒話。你覺得自己不孤單。', { mood: 4, flags: { pay_cut: true } }) },
        { text: '參加明天的騎士抗議', go: () => R('你報名了抗議。雖然不知道有沒有用，但總比什麼都不做好。', { mood: 8, fame: 2, flags: { pay_cut: true, protest: true } }) },
        { text: '默默接受', go: () => R('你把公告滑掉。生活還是要繼續。', { mood: -8, flags: { pay_cut: true } }) },
      ],
    },
  ];
})(window.G);
