/* 外送人生 — phone LINE chat: threads, unread badges, reply choices (all serializable for saves) */
(function (G) {
  const $ = G.$, $$ = G.$$;
  const C = (G.Chat = { view: null }); // view: null = list, or threadId

  G.THREADS = {
    group: { name: '熊喵騎士互助會（187）', avatar: '🛵' },
    kai: { name: '阿凱（優怕食）', avatar: '😎' },
    mom: { name: '媽媽', avatar: '👩' },
    landlord: { name: '房東太太', avatar: '🏠' },
    nurse: { name: '怡萱', avatar: 'img:assets/art/portraits/npc_nurse.png' },
    crash: { name: '陳思遠', avatar: 'img:assets/art/portraits/npc_crash_person.png' },
    student: { name: '小芸（台大熬夜仔）', avatar: '📚' },
    grandpa_daughter: { name: '林小姐（阿公的女兒）', avatar: '✈️' },
    platform: { name: '熊喵外送 官方', avatar: '🐼' },
    parents: { name: '三年三班家長群（32）', avatar: '👨‍👩‍👧' },
    teacher: { name: '王老師（導師）', avatar: '👩‍🏫' },
    spouse: { name: '另一半 ❤️', avatar: '💑' },
  };
  const avatarHtml = (a) => (a && a.startsWith('img:') ? `<img src="${a.slice(4)}" alt="">` : a || '🙂');

  function thread(s, tid) {
    if (!s.chat[tid]) s.chat[tid] = { msgs: [], unread: 0, replies: null, last: 0 };
    return s.chat[tid];
  }
  let seq = 0;

  /** Message from the other side. opts: {who, silent} */
  C.msg = function (s, tid, text, opts) {
    opts = opts || {};
    const t = thread(s, tid);
    t.msgs.push({ from: 'them', text, who: opts.who || null });
    t.last = ++seq + s.day * 10000;
    if (C.view !== tid || !C.isOpen()) {
      t.unread++;
      if (!opts.silent) {
        const name = opts.who || G.THREADS[tid].name;
        G.ui.toast('💬 ' + name + '：' + text.split('\n')[0].slice(0, 22));
        G.sfx.order();
      }
    }
    C.render();
  };
  C.me = function (s, tid, text) {
    const t = thread(s, tid);
    t.msgs.push({ from: 'me', text });
    C.render();
  };
  C.sys = function (s, tid, text) {
    thread(s, tid).msgs.push({ from: 'sys', text });
    C.render();
  };
  /**
   * Message + reply options.
   * replies: [{ text, eff, resp, respWho, flags, next: {text, replies} }]
   */
  C.ask = function (s, tid, text, replies, opts) {
    C.msg(s, tid, text, opts);
    thread(s, tid).replies = replies;
    C.render();
  };
  /** Several messages in a row (group chats). lines: [[who, text], ...] */
  C.burst = function (s, tid, lines) {
    lines.forEach((l, i) => C.msg(s, tid, l[1], { who: l[0], silent: i > 0 }));
  };

  C.unreadTotal = (s) => Object.values(s.chat).reduce((a, t) => a + t.unread, 0);
  C.hasPending = (s) => Object.values(s.chat).some((t) => t.replies && t.replies.length);
  C.isOpen = () => !$('#chat').classList.contains('hidden');

  C.reply = function (s, tid, i) {
    const t = thread(s, tid);
    const r = t.replies && t.replies[i];
    if (!r) return;
    t.replies = null;
    C.me(s, tid, r.text);
    const shown = G.apply(s, r.eff);
    if (r.flags) G.apply(s, { flags: r.flags });
    if (shown.length) G.ui.toast(shown.map((x) => x.label + ' ' + x.text).join('　'));
    if (G.Parent && G.Parent.active()) G.Parent.refresh(); else G.Game.refresh();
    if (r.resp) {
      setTimeout(() => {
        C.msg(s, tid, r.resp, { who: r.respWho, silent: true });
        if (r.next) { t.replies = r.next.replies || null; if (r.next.text) C.msg(s, tid, r.next.text, { silent: true }); }
        C.render();
      }, 600);
    }
  };

  C.render = function () {
    const s = G.getState && G.getState();
    if (!s) return;
    const total = C.unreadTotal(s);
    const badge = $('#chat-badge');
    badge.textContent = total;
    badge.classList.toggle('hidden', !total);
    if (!C.isOpen()) return;
    const box = $('#chat');
    if (!C.view) {
      const ids = Object.keys(s.chat).sort((a, b) => s.chat[b].last - s.chat[a].last);
      box.innerHTML = '<h3>聊天</h3>' + (ids.length ? ids.map((id) => {
        const t = s.chat[id], th = G.THREADS[id];
        const last = t.msgs[t.msgs.length - 1];
        return `<div class="thread-item" data-tid="${id}"><div class="avatar">${avatarHtml(th.avatar)}</div>
          <div class="ti-body"><div class="ti-name">${th.name}${t.replies ? ' ✏️' : ''}</div><div class="ti-last">${last ? last.text.split('\n')[0] : ''}</div></div>
          ${t.unread ? `<b class="badge">${t.unread}</b>` : ''}</div>`;
      }).join('') : '<p>還沒有訊息。</p>');
      box.querySelectorAll('[data-tid]').forEach((el) => (el.onclick = () => { G.sfx.click(); C.view = el.dataset.tid; C.render(); }));
      return;
    }
    const t = thread(s, C.view), th = G.THREADS[C.view];
    t.unread = 0;
    badge.textContent = C.unreadTotal(s);
    badge.classList.toggle('hidden', !C.unreadTotal(s));
    box.innerHTML = `<div class="chat-head"><button data-back>◀</button><div class="avatar">${avatarHtml(th.avatar)}</div><span>${th.name}</span></div>
      <div class="msgs">${t.msgs.map((m) => `<div class="msg ${m.from}">${m.who && m.from === 'them' ? `<span class="who">${m.who}</span>` : ''}${escapeHtml(m.text)}</div>`).join('')}</div>
      ${t.replies ? `<div class="replies">${t.replies.map((r, i) => `<button class="btn" data-r="${i}">${escapeHtml(r.text)}</button>`).join('')}</div>` : ''}`;
    box.scrollTop = box.scrollHeight;
    box.querySelector('[data-back]').onclick = () => { G.sfx.click(); C.view = null; C.render(); };
    box.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { G.sfx.click(); C.reply(s, C.view, +b.dataset.r); }));
  };
  function escapeHtml(x) { return String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  C.tab = function (name) {
    $$('.tab').forEach((t) => t.classList.toggle('sel', t.dataset.tab === name));
    $('#panel').classList.toggle('hidden', name !== 'work');
    $('#chat').classList.toggle('hidden', name !== 'chat');
    if (name === 'chat') C.render();
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (t) { G.sfx.click(); C.tab(t.dataset.tab); }
  });
})(window.G);
