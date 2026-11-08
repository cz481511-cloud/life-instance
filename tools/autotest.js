/* Dev-only auto player for the 3D version. In the browser console:
 *   const t = document.createElement('script'); t.src = 'tools/autotest.js'; document.body.appendChild(t);
 *   await __run(originIndex, smart, steps)
 * It clicks through dialogs/panels and teleports the scooter to each target.
 */
window.__errs = [];
window.addEventListener('error', (e) => __errs.push(e.message));
window.addEventListener('unhandledrejection', (e) => __errs.push(String((e.reason && e.reason.stack) || e.reason)));

window.__auto = async function (steps, smart) {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < steps; i++) {
    await sl(30);
    const m = document.querySelector('#modal:not(.hidden) #modal-actions .btn');
    if (m) {
      const t = document.querySelector('#modal-title').textContent;
      if (t === 'GAME OVER') return { end: document.querySelector('.ending-title').textContent };
      m.click(); continue;
    }
    const cs = [...document.querySelectorAll('#dialog:not(.hidden) #dlg-choices .btn:not(:disabled)')];
    if (cs.length) {
      let b = cs[Math.floor(Math.random() * cs.length)];
      if (smart) b = cs.find((x) => x.classList.contains('special')) || cs[0];
      b.click(); continue;
    }
    // answer pending LINE replies
    const st = G.debug.state;
    for (const id in st.chat) if (st.chat[id].replies) { G.Chat.reply(st, id, smart ? 0 : Math.floor(Math.random() * st.chat[id].replies.length)); }
    const p = document.querySelector('#panel');
    const btn = p.querySelector('[data-act=take]') || p.querySelector('[data-act=go]') || p.querySelector('[data-act=sleep]') || p.querySelector('[data-act=ride]');
    if (btn) { btn.click(); continue; }
    const c = G.debug.cur;
    if (!G.World.isPaused()) {
      if (c && c.phase === 'toShop') G.World.debugTeleport(c.shop);
      else if (c && c.phase === 'toDest') {
        // drive a bit first so route events (door hazard) can trigger
        if (c.route === 'door' && !c.routeFired) { c.driveTime = 99; G.World.touch('arrowup', true); await sl(800); G.World.touch('arrowup', false); continue; }
        G.World.debugTeleport(c.dest.name);
      } else if (st.phase === 'home') G.World.debugTeleport('home');
      await sl(150);
    }
  }
  return { end: 'steps' };
};

window.__run = async function (origin, smart, steps) {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  G.ui.closeModal(); G.ui.screen('title');
  document.querySelector('[data-action=new]').click();
  document.querySelector('#in-name').value = 'T';
  document.querySelectorAll('.origin')[origin].click();
  document.querySelector('[data-action=start]').click();
  await sl(100);
  const r = await __auto(steps, smart);
  const st = G.debug.state;
  return {
    end: r.end, day: st.day, ch: st.ch, money: st.money, rating: +st.rating.toFixed(2),
    orders: st.stats.orders, perDay: Math.round(st.stats.earned / st.day),
    nurse: st.flags.nurse_stage, nurseAff: st.aff.nurse, crash: st.flags.crash_stage, crashAff: st.aff.crash,
    regs: JSON.stringify(st.reg), crashes: st.crashes, fame: st.fame, errs: __errs.slice(0, 3),
    endings: Object.keys(st.flags).filter((f) => f.startsWith('end_')),
  };
};
