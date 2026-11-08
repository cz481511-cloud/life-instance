/* 外送人生 — static data: origins, NPCs, city, endings */
(function (G) {
  const ART = 'assets/art/';
  G.BG = {
    day: ART + 'backgrounds/bg_taipei_street_day.png',
    night: ART + 'backgrounds/bg_taipei_street_rain_night.png',
    home: ART + 'backgrounds/bg_home_room.png',
  };
  G.ICON = (n) => ART + 'icons/icon_' + n + '.png';

  G.RENT = 2500;          // 每 7 天繳一次
  G.DAILY_FOOD = 150;     // 每日餐費
  G.RATING_BAN = 3.6;     // 低於此評分停權

  G.ORIGINS = [
    {
      id: 'student', name: '窮學生',
      desc: '大三，學貸壓身，報告永遠寫不完。體力好，錢很少。',
      money: 3200, stamina: 100, mood: 70,
    },
    {
      id: 'laidoff', name: '被裁員的上班族',
      desc: '在科技業做了十二年，公司一句「組織調整」就沒了。有點存款，但每天要匯家用。',
      money: 9000, stamina: 75, mood: 45, dailyCost: 300,
    },
    {
      id: 'musician', name: '追夢樂團主唱',
      desc: '樂團叫「凌晨三點半」，粉專 87 個讚。心情很好，戶頭很空。',
      money: 1800, stamina: 85, mood: 90,
    },
  ];

  G.NPC = {
    nurse: { name: '林怡萱', short: '怡萱', title: '夜班護理師', portrait: ART + 'portraits/npc_nurse.png' },
    crash: { name: '陳思遠', short: '思遠', title: '車禍的那個人', portrait: ART + 'portraits/npc_crash_person.png' },
    sys: { name: '熊喵外送', portrait: null },
  };

  /* 時段：clock 分鐘數 */
  G.SLOTS = [
    { id: 'breakfast', name: '早餐', from: 7 * 60, to: 10 * 60, mult: 0.9, orders: 0.9 },
    { id: 'lunch', name: '午餐尖峰', from: 10 * 60, to: 14 * 60, mult: 1.25, orders: 1.4 },
    { id: 'tea', name: '下午茶', from: 14 * 60, to: 17 * 60, mult: 0.95, orders: 0.9 },
    { id: 'dinner', name: '晚餐尖峰', from: 17 * 60, to: 21 * 60, mult: 1.3, orders: 1.5 },
    { id: 'night', name: '宵夜', from: 21 * 60, to: 26 * 60, mult: 1.15, orders: 1.0 },
  ];
  G.DAY_END = 26 * 60; // 凌晨 2:00 平台強制下線
  G.slotAt = (clock) => G.SLOTS.find((s) => clock >= s.from && clock < s.to) || G.SLOTS[G.SLOTS.length - 1];
  G.isNight = (clock) => clock >= 18 * 60 || clock < 6 * 60;

  G.WEATHER = {
    sun: { name: '晴', icon: '☀️', bonus: 0, risk: 1 },
    cloud: { name: '陰', icon: '☁️', bonus: 0, risk: 1 },
    rain: { name: '大雨', icon: '🌧️', bonus: 25, risk: 1.8 },
    typhoon: { name: '颱風', icon: '🌀', bonus: 70, risk: 3.2 },
  };

  /* 台北：店家（icon、時段偏好） */
  G.SHOPS = [
    { name: '阿嬤滷肉飯', icon: 'bento', slots: ['lunch', 'dinner'] },
    { name: '永和豆漿大王（不是那家）', icon: 'bento', slots: ['breakfast', 'night'] },
    { name: '晨間美而美', icon: 'bento', slots: ['breakfast'] },
    { name: '雙倍珍奶專賣', icon: 'tea', slots: ['lunch', 'tea', 'dinner'] },
    { name: '五十嵐…不對，五十藍', icon: 'tea', slots: ['tea', 'lunch'] },
    { name: '師大鹽酥雞', icon: 'chicken', slots: ['dinner', 'night'] },
    { name: '胖爺爺炸雞', icon: 'chicken', slots: ['night', 'dinner'] },
    { name: '巷口自助餐', icon: 'bento', slots: ['lunch', 'dinner'] },
    { name: '公館大腸包小腸', icon: 'chicken', slots: ['night', 'tea'] },
    { name: '健身便當 Gym Box', icon: 'bento', slots: ['lunch'] },
    { name: '深夜牛肉麵', icon: 'bento', slots: ['night'] },
    { name: '鬆餅與貓', icon: 'tea', slots: ['tea'] },
  ];

  G.DESTS = [
    { name: '大安區 老公寓 5 樓（無電梯）', type: 'walkup' },
    { name: '信義區 辦公大樓 32 樓', type: 'office' },
    { name: '中正區 大學宿舍', type: 'dorm' },
    { name: '萬華區 獨居阿公家', type: 'oldman' },
    { name: '西門町 網咖 B2', type: 'cafe' },
    { name: '內湖科技園區 警衛室', type: 'office' },
    { name: '中山區 豪宅大廳', type: 'luxury' },
    { name: '松山區 小套房', type: 'walkup' },
    { name: '士林 夜市旁巷子', type: 'alley' },
    { name: '仁愛紀念醫院 護理站', type: 'hospital' },
    { name: '北投 山上的墓園管理處', type: 'grave' },
  ];

  /* 結局 / 人生圖鑑 */
  G.ENDINGS = {
    bankrupt: { title: '破產回老家', kind: 'bad', text: '房東把你的行李放在樓梯間。你騎著那台老機車，一路騎回南部老家。媽媽什麼都沒問，只是煮了一大鍋滷肉。\n\n…其實也不錯。' },
    banned: { title: '帳號停權', kind: 'bad', text: '「親愛的騎士您好，由於您的服務評分低於標準，帳號已停權。」\n\n你盯著那封信，想起那杯被你灑掉一半的珍奶。演算法不會記得你淋過的雨。' },
    hurt: { title: '重傷退休', kind: 'bad', text: '第三次車禍之後，醫生說你的膝蓋不能再騎長途了。\n\n你把保溫箱擺在床邊當邊桌。偶爾聽到樓下機車經過，還是會下意識看一下手機。' },
    hero_dead: { title: '外送英雄（追授）', kind: 'bad', text: '新聞標題：「外送員勇奪凶刀 身負重傷」。\n\n平台發了一則感人的貼文，附上你的照片和品牌 logo。那則貼文的互動數，比你一整年送的單還多。' },
    nurse_love: { title: '凌晨三點的鹽酥雞', kind: 'love', text: '你們在醫院頂樓看著天色一點一點變亮。她說：「以後鹽酥雞，我跟你一起吃。」\n\n那天之後，你的宵夜單少了一張，但再也不是一個人。' },
    crash_love: { title: '從理賠到交往', kind: 'love', text: '保險公司的理賠單上，事故原因寫著「雙方均有過失」。\n\n思遠說：「那就各負一半責任吧——包括以後的人生。」你笑到差點撞到電線桿。' },
    hero: { title: '外送英雄', kind: 'good', text: '你上了新聞，平台頒了一張獎狀和一張 50 元折價券。\n\n路上開始有人認出你：「欸，你是那個用珍奶砸小偷的！」' },
    rich: { title: '人生第一桶金', kind: 'good', text: '存款突破十萬。你在便利商店買了一罐比較貴的咖啡，站在騎樓下慢慢喝完。\n\n這是你這個月第一次沒有在趕時間。' },
    week: { title: '撐過第一週', kind: 'good', text: '七天，四百多公里，無數次「我在樓下了」。你還活著，而且付得出房租。' },
  };
})(window.G);
