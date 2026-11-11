/* Dev-only: drive the game into a given screen for README screenshots.
 * Loaded by game.js only on localhost with ?shot=<name>. Used by tools/screenshots.ps1 (headless Chrome + DevTools Protocol). */
(function (G) {
  const name = new URLSearchParams(location.search).get('shot');
  const $ = (q) => document.querySelector(q);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  G.save.write = () => {}; // never touch saves
  async function waitFor(fn, ms) { const t = Date.now(); while (Date.now() - t < (ms || 20000)) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(50); } return null; }
  const click = async (q) => { const el = await waitFor(() => $(q)); if (el) el.click(); return el; };
  const dlgOpen = () => !$('#dialog').classList.contains('hidden');
  const choices = () => [...document.querySelectorAll('#dlg-choices button')].filter((b) => !b.disabled);
  /** answer dialogs (pick index i, or first) until `until()` is true */
  async function advance(until, pick, max) {
    for (let n = 0; n < (max || 60); n++) {
      if (until && until()) return true;
      if (dlgOpen()) { const c = choices(); if (c.length) { (c[Math.min(pick || 0, c.length - 1)]).click(); await sleep(150); continue; } }
      await sleep(120);
    }
    return until ? until() : true;
  }
  /** wait until a dialog shows choices (and its typing finished) */
  async function settleDialog() { await waitFor(() => dlgOpen() && choices().length); await sleep(900); }
  const done = () => { document.title = 'SHOT-READY'; window.__shotReady = true; };

  const SHOTS = {
    async title() { await sleep(1500); },
    async select() { await click('[data-action="new"]'); await sleep(800); },
    async ride() {
      await click('[data-action="new"]'); await click('[data-action="inst-delivery"]'); await click('[data-action="start"]');
      await advance(() => $('#panel [data-act="go"]'));
      $('#panel [data-act="go"]').click();
      await advance(() => $('#panel [data-act="take"]'));
      if (name === 'order') { await sleep(1200); return; }
      $('#panel [data-act="take"]').click();
      await advance(() => !dlgOpen() && G.World.ready && !G.World.isPaused(), 0, 40);
      G.World.setPlayer(4 * 60 - 2, 250, 0, 0); // middle of a main road, facing along it
      await sleep(1500); G.World.touch('w', true); await sleep(1900);
      G.World.pause(true); // freeze before the next intersection so cross traffic can't knock the scooter away
      await sleep(500);
    },
    async order() { await SHOTS.ride(); },
    async pcreate() { await click('[data-action="new"]'); await click('[data-action="inst-parent"]'); await sleep(2500); },
    async plan() {
      await click('[data-action="new"]'); await click('[data-action="inst-parent"]'); await sleep(1500); await click('[data-action="pstart"]');
      await advance(() => $('#panel [data-arg="school"]'));
      await sleep(1200);
    },
    async school() {
      await SHOTS.plan();
      const st = G.getState(); st.seen = st.seen || {};
      ['stranger', 'late', 'bully6', 'linmom', 'teen_far'].forEach((k) => (st.seen['pe_' + k] = 1)); // force the BMW scene
      $('#panel [data-arg="school"]').click();
      await waitFor(() => dlgOpen()); await advance(() => choices().length >= 3, 0, 20); await sleep(1600);
    },
    async night() {
      await SHOTS.plan();
      const st = G.getState(); st.seen = st.seen || {};
      ['lost', 'goldfish', 'balloon', 'teen_hide', 'slide', 'dog', 'bike', 'grandma', 'vape'].forEach((k) => (st.seen['pe_' + k] = 1));
      const pick = G.chance; G.chance = () => false; // play -> night market
      $('#panel [data-arg="play"]').click();
      await waitFor(() => dlgOpen()); G.chance = pick;
      await advance(() => choices().length >= 3, 0, 20); await sleep(1600);
    },
    async fight() {
      await SHOTS.plan();
      G.Stage.show('office', [
        { id: 'me', model: 'character-male-d', x: -0.6, z: 1.1, rot: 1.3, height: 1.8 }, { id: 'zhang', model: 'character-male-b', x: 0.6, z: 1.0, rot: -1.5, height: 1.95 },
        { id: 'kid', model: 'character-male-e', x: -2.0, z: 1.7, rot: 0.6, height: 1.35 }, { id: 'dir', model: 'character-male-c', x: -0.6, z: -1.6, rot: 0, height: 1.78, anim: 'sit' }]);
      G.ui.scene({ cover: null, caption: '學務處' });
      G.Stage.fight({ you: 'me', foe: 'zhang', foeName: '張爸爸', hp: 3, foeHp: 3, speed: 0.4 });
      await sleep(1800);
    },
  };

  (async function run() {
    await waitFor(() => $('#screen-title'));
    try { await (SHOTS[name] || SHOTS.title)(); } catch (e) { console.error('shot failed', e); window.__shotErr = String(e && e.stack || e); }
    done();
  })();
})(window.G);
