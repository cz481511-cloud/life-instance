/* 外送人生 — 3D interior stage (rooms built from Kenney furniture + animated mini characters) and the fight minigame */
(function (G) {
  const S = (G.Stage = { ready: false });
  let renderer, scene, camera, container, roomGroup, t0, visible = false;
  const actors = {};
  const FS = 2.4; // furniture scale (kit units -> meters)
  let camBase = null, sway = 0, hemi = null, keyLight = null;

  S.init = function (el) {
    if (S.ready) return;
    container = el;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    hemi = new THREE.HemisphereLight(0xfff6ea, 0x8a7f73, 0.85);
    scene.add(hemi);
    const key = (keyLight = new THREE.DirectionalLight(0xfff0d8, 1.0));
    key.position.set(-4, 9, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10;
    scene.add(key);
    window.addEventListener('resize', resize);
    t0 = performance.now();
    S.ready = true;
    requestAnimationFrame(loop);
  };
  function resize() {
    if (!renderer || !container.clientWidth) return;
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    // keep a minimum horizontal field of view so narrow windows don't crop the scene
    const hfov = 64 * Math.PI / 180;
    camera.fov = Math.max(40, (2 * Math.atan(Math.tan(hfov / 2) / camera.aspect) * 180) / Math.PI);
    camera.updateProjectionMatrix();
  }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    if (!visible) return;
    if (G.Assets) G.Assets.update(dt);
    if (camBase) {
      sway += dt * 0.25;
      camera.position.set(camBase.pos[0] + Math.sin(sway) * 0.35, camBase.pos[1], camBase.pos[2] + Math.cos(sway * 0.8) * 0.15);
      camera.lookAt(camBase.look[0], camBase.look[1], camBase.look[2]);
    }
    for (const id in actors) { const a = actors[id]; if (a.tween) a.tween(dt); }
    renderer.render(scene, camera);
  }

  /* ---------- room building ---------- */
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  function put(group, name, x, z, rot, scale) {
    const o = G.Assets.place(name, { scale: scale || FS, x, z, rot: rot || 0 });
    if (o) group.add(o);
    return o;
  }
  function shell(g, floorC, wallC, w, d) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), mat(floorC));
    floor.position.y = -0.1; floor.receiveShadow = true; g.add(floor);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, 4.2, 0.2), mat(wallC));
    back.position.set(0, 2.1, -d / 2); back.receiveShadow = true; g.add(back);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, d), mat(wallC));
    left.position.set(-w / 2, 2.1, 0); left.receiveShadow = true; g.add(left);
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 0.25), mat(0xffffff));
    base.position.set(0, 0.12, -d / 2 + 0.15); g.add(base);
  }
  function windowOn(g, x, y, w, h, d, night) {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: night ? 0x1d2550 : 0xbfe4ff }));
    glass.position.set(x, y, -d / 2 + 0.11); g.add(glass);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.12, 0.12), mat(0xffffff));
    frame.position.set(x, y - h / 2, -d / 2 + 0.16); g.add(frame);
    const f2 = frame.clone(); f2.position.y = y + h / 2; g.add(f2);
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.1), mat(0xffffff)); mid.position.set(x, y, -d / 2 + 0.16); g.add(mid);
  }
  function poster(g, x, y, d, text, bg) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 320;
    const k = c.getContext('2d'); k.fillStyle = bg || '#fff'; k.fillRect(0, 0, 256, 320);
    k.fillStyle = '#222'; k.font = '900 44px "Noto Sans TC","Microsoft JhengHei",sans-serif'; k.textAlign = 'center';
    text.split('\n').forEach((l, i) => k.fillText(l, 128, 90 + i * 64));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    m.position.set(x, y, -d / 2 + 0.12); g.add(m);
  }

  /* ---------- extra helpers for outdoor / shop scenes ---------- */
  function box(g, w, h, d, c, x, y, z, rot, emissive) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), emissive ? new THREE.MeshBasicMaterial({ color: c }) : mat(c));
    m.position.set(x, y, z); if (rot) m.rotation.y = rot; m.castShadow = !emissive; m.receiveShadow = true; g.add(m); return m;
  }
  function putH(g, name, x, z, rot, height, y) { const o = G.Assets.place(name, { height, x, z, rot: rot || 0, y: y || 0 }); if (o) g.add(o); return o; }
  function putL(g, name, x, z, rot, length, y) { const o = G.Assets.place(name, { length, x, z, rot: rot || 0, y: y || 0 }); if (o) g.add(o); return o; }
  const topOf = (o) => (o ? new THREE.Box3().setFromObject(o).max.y : 0);
  /** canvas sign: label(g, text, {x,y,z,w,h,bg,fg,rot,size}) */
  function label(g, text, o) {
    const W = 512, H = Math.round(512 * (o.h / o.w));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const k = c.getContext('2d'); k.fillStyle = o.bg || '#fff'; k.fillRect(0, 0, W, H);
    if (o.border) { k.strokeStyle = o.border; k.lineWidth = 14; k.strokeRect(7, 7, W - 14, H - 14); }
    const lines = text.split('\n');
    const fs = o.size || Math.min(H / (lines.length + 0.6), (W * 0.9) / Math.max(...lines.map((l) => l.length)));
    k.fillStyle = o.fg || '#222'; k.font = `900 ${fs}px "Noto Sans TC","Microsoft JhengHei",sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle';
    lines.forEach((l, i) => k.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.15));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    m.position.set(o.x, o.y, o.z); m.rotation.y = o.rot || 0; g.add(m); return m;
  }
  function ground(g, c, w, d, y) { const m = box(g, w, 0.2, d, c, 0, (y || 0) - 0.1, 0); return m; }
  function skyline(g, z, night) {
    const names = ['low-detail-building-a', 'low-detail-building-c', 'low-detail-building-e', 'low-detail-building-g', 'low-detail-building-wide-a'];
    z -= 4;
    for (let i = 0; i < 9; i++) putH(g, names[i % names.length], -20 + i * 5, z - (i % 2) * 2, 0, 5 + ((i * 7) % 5));
    if (night) for (let i = 0; i < 18; i++) box(g, 0.3, 0.3, 0.05, Math.random() < 0.5 ? 0xffe9a8 : 0xfff3d0, -13 + Math.random() * 26, 1.5 + Math.random() * 6, z + 2.4, 0, true);
  }
  function stringLights(g, x0, x1, y, z) {
    const cols = [0xff5a5a, 0xffd25a, 0x6ad1ff, 0x9cff7a, 0xff8ae0];
    for (let x = x0, i = 0; x <= x1; x += 0.55, i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: cols[i % cols.length] })); b.position.set(x, y - Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 0.35, z); g.add(b); }
  }
  function shelf(g, x, z, rot, w) {
    w = w || 2.6;
    const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = rot || 0; g.add(grp);
    box(grp, w, 1.9, 0.55, 0xd9dde2, 0, 0.95, 0);
    const cols = [0xff6b6b, 0xffc145, 0x4ecdc4, 0x5a8dee, 0xf78fb3, 0x7bd389, 0xffffff, 0xe17055];
    for (let r = 0; r < 4; r++) {
      box(grp, w + 0.04, 0.05, 0.6, 0xb5bcc4, 0, 0.25 + r * 0.45, 0.02);
      for (let i = 0; i < Math.floor(w / 0.26); i++) { const h = 0.18 + Math.random() * 0.16; box(grp, 0.2, h, 0.25, cols[(i * 3 + r * 5) % cols.length], -w / 2 + 0.18 + i * 0.26, 0.28 + r * 0.45 + h / 2, 0.16); }
    }
    return grp;
  }
  function stall(g, x, z, name, roof, items) {
    box(g, 2.8, 1.0, 1.1, 0xe9e2d3, x, 0.5, z); box(g, 2.9, 0.06, 1.2, 0xbfb6a3, x, 1.03, z);
    [-1.35, 1.35].forEach((dx) => box(g, 0.08, 2.6, 0.08, 0x777777, x + dx, 1.3, z - 0.5));
    box(g, 3.1, 0.12, 1.9, roof, x, 2.62, z + 0.1);
    label(g, name, { x, y: 2.95, z: z + 0.6, w: 2.4, h: 0.55, bg: '#fff8e1', fg: '#c0392b', border: '#c0392b' });
    (items || []).forEach((it, i) => putH(g, it, x - 0.9 + i * 0.6, z + 0.15, Math.random() * 3, 0.28, 1.06));
    const l = new THREE.PointLight(0xffc27a, 0.9, 5.5); l.position.set(x, 2.2, z + 0.8); g.add(l);
  }

  const ROOMS = {
    /* ---------- outdoor & shops (爸媽篇 應對場景) ---------- */
    schoolgate: { outdoor: true, cam: { pos: [3.0, 3.6, 9.6], look: [0, 1.1, 0] }, bg: 0xbfe3ff, build(g, night, o) {
      ground(g, 0x60646b, 34, 26); box(g, 34, 0.16, 4.2, 0xd3c9b8, 0, 0.08, 0.6);
      for (let i = -16; i < 17; i += 2) box(g, 1.0, 0.02, 0.15, 0xffffff, i, 0.01, 4.6, 0, true);
      box(g, 34, 0.02, 0.12, 0xd63b3b, 0, 0.17, 2.68, 0, true); // red curb
      [-1, 1].forEach((sd) => { box(g, 12, 1.5, 0.4, 0xf2e6cf, sd * 8.2, 0.75, -1.6); box(g, 12, 0.14, 0.5, 0xb84a3a, sd * 8.2, 1.55, -1.6); box(g, 0.6, 2.8, 0.6, 0xe8d8b8, sd * 2.1, 1.4, -1.6); });
      box(g, 4.8, 0.5, 0.5, 0xe8d8b8, 0, 2.95, -1.6);
      label(g, o.sign || '臺北市立幸福國民小學', { x: 0, y: 2.95, z: -1.33, w: 4.4, h: 0.42, bg: '#7a2b20', fg: '#ffe9a8' });
      box(g, 20, 6.5, 4, 0xf0dcbc, 0, 3.25, -9); box(g, 20.2, 0.3, 4.2, 0xb84a3a, 0, 6.55, -9);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) box(g, 1.2, 0.9, 0.05, night ? 0xffe39a : 0x8fb6d8, -8 + c * 2, 1.4 + r * 1.9, -6.98, 0, night);
      label(g, '品德・健康・快樂', { x: 0, y: 6.0, z: -6.95, w: 4, h: 0.6, bg: '#f0dcbc', fg: '#7a2b20' });
      putH(g, 'tree-large', -4.5, -3.8, 0, 4.6); putH(g, 'tree-large', 4.8, -4.2, 1, 5); putH(g, 'tree-small', -7.5, -3.2, 2, 3.2);
      putH(g, 'light-square', -4.6, 2.2, Math.PI / 2, 4.2); putH(g, 'electricity-pole', 9.5, -0.2, 0, 6);
      putL(g, 'sedan', -6.0, 3.7, Math.PI / 2, 4.2); putL(g, 'taxi', 8.0, 4.3, -Math.PI / 2, 4.3);
      skyline(g, -15, night);
    } },
    park: { outdoor: true, cam: { pos: [3.2, 3.8, 9.8], look: [0, 1.0, 0] }, bg: 0xc6e9ff, build(g, night) {
      ground(g, 0x86c162, 36, 28); box(g, 36, 0.04, 2.4, 0xd9c7a2, 0, 0.02, 2.8);
      box(g, 7, 0.06, 5, 0xe0b98a, 3.4, 0.03, -1.6); // sand
      // slide
      const sx = 3.6, sz = -2.0;
      [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([dx, dz]) => box(g, 0.12, 1.8, 0.12, 0xf2c14e, sx + dx, 0.9, sz + dz));
      box(g, 1.4, 0.12, 1.4, 0x3d8bd8, sx, 1.8, sz); box(g, 1.5, 0.6, 0.06, 0xe74c3c, sx, 2.15, sz - 0.7);
      const sl = box(g, 0.9, 0.08, 2.6, 0xe74c3c, sx + 1.7, 0.95, sz); sl.rotation.z = 0; sl.rotation.x = 0; sl.position.set(sx, 0.95, sz + 1.75); sl.rotation.x = 0.68;
      for (let i = 0; i < 5; i++) box(g, 0.9, 0.06, 0.12, 0xf2c14e, sx, 0.3 + i * 0.33, sz - 0.75);
      // swings
      box(g, 3, 0.12, 0.12, 0x3d8bd8, -4, 2.3, -2.4); [-1.5, 1.5].forEach((dx) => box(g, 0.12, 2.3, 0.12, 0x3d8bd8, -4 + dx, 1.15, -2.4));
      [-0.6, 0.6].forEach((dx) => { box(g, 0.04, 1.6, 0.04, 0x555555, -4 + dx - 0.2, 1.5, -2.4); box(g, 0.04, 1.6, 0.04, 0x555555, -4 + dx + 0.2, 1.5, -2.4); box(g, 0.5, 0.06, 0.25, 0x2c3e50, -4 + dx, 0.7, -2.4); });
      put(g, 'bench', -1.2, -0.8, 0); put(g, 'bench', 6.5, 1.4, -Math.PI / 2);
      [[-7, -5], [-2, -6], [7.5, -4.5], [10, -1], [-9.5, -1], [-4.5, -8], [1.5, -9], [5, -8], [-11, -6], [11, -7]].forEach(([x, z], i) => putH(g, i % 2 ? 'tree-small' : 'tree-large', x, z, i, i % 2 ? 3.4 : 5));
      putH(g, 'light-curved', -6.2, 2.0, Math.PI / 2, 4.4); putH(g, 'trashcan', 5.4, 2.0, 0, 0.9);
      skyline(g, -16, night);
    } },
    nightmarket: { outdoor: true, night: true, nightBg: 0x1b1d33, cam: { pos: [3.0, 3.4, 9.0], look: [0, 1.2, 0] }, bg: 0x1b1d33, build(g, night, o) {
      ground(g, 0x3b3c45, 34, 24);
      stall(g, -4.2, -2.6, '大腸包小腸', 0xd63031, ['corn-dog', 'skewer', 'skewer']);
      stall(g, -0.6, -2.9, '超大雞排', 0xe17055, ['fries-empty', 'chinese', 'bag']);
      stall(g, 3.4, -2.6, '撈金魚', 0x0984e3, []);
      const tank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.9), new THREE.MeshLambertMaterial({ color: 0x5ec8ff, transparent: true, opacity: 0.75 })); tank.position.set(3.4, 1.2, -2.5); g.add(tank);
      for (let i = 0; i < 9; i++) box(g, 0.12, 0.05, 0.06, 0xff8c1a, 2.4 + Math.random() * 2, 1.3, -2.85 + Math.random() * 0.7, Math.random() * 3, true);
      stall(g, 7.4, -2.2, '射氣球', 0x6c5ce7, ['soda-can', 'popsicle']);
      stall(g, -8.2, -2.2, '臭豆腐', 0x00b894, ['pot-stew', 'bowl-broth']);
      stringLights(g, -10, 10, 3.6, -0.4); stringLights(g, -10, 10, 3.9, 1.6);
      [[-5, 4], [5, 4]].forEach(([x, z]) => { const l = new THREE.PointLight(0xffd59a, 0.7, 9); l.position.set(x, 3.5, z); g.add(l); });
      label(g, o.sign || '饒河夜市', { x: 0, y: 5.4, z: -4.5, w: 5, h: 1.0, bg: '#c0392b', fg: '#fff3c4', border: '#ffd25a' });
      skyline(g, -14, true);
    } },
    market: { cam: { pos: [3.0, 3.4, 8.0], look: [0, 1.1, 0] }, bg: 0xe8dfcf, build(g, night) {
      shell(g, 0xb8bfc6, 0xf3ead8, 12, 8);
      for (let i = -5; i <= 5; i += 1.2) box(g, 0.04, 0.01, 8, 0x9aa3ab, i, 0.005, 0);
      box(g, 12, 0.7, 0.1, 0xd6302b, 0, 3.75, -3.88);
      label(g, '全連福利中心　實在真便宜', { x: 0, y: 3.75, z: -3.8, w: 7.5, h: 0.6, bg: '#d6302b', fg: '#fff' });
      shelf(g, -3.4, -3.4, 0, 3.4); shelf(g, 0.4, -3.4, 0, 3.4); shelf(g, -4.0, -0.6, 0, 2.4);
      putH(g, 'kitchenFridgeLarge', -5.6, 0.8, Math.PI / 2, 2.2); putH(g, 'kitchenFridgeLarge', -5.6, 2.2, Math.PI / 2, 2.2);
      put(g, 'kitchenBar', 3.6, 0.0, -Math.PI / 2); put(g, 'kitchenBarEnd', 3.6, -1.2, -Math.PI / 2);
      box(g, 0.5, 0.35, 0.4, 0x2d3436, 3.5, 1.15, 0.0);
      label(g, '結帳', { x: 3.6, y: 2.6, z: 0, w: 1.2, h: 0.5, bg: '#ffc145', fg: '#222', rot: -Math.PI / 2 });
      [['watermelon', 1.6], ['apple', 1.9], ['banana', 2.2]].forEach(([n, x]) => putH(g, n, x, -1.0, 0, 0.35, 0.8));
      box(g, 2.2, 0.8, 1.0, 0x8d6e63, 2.0, 0.4, -1.0);
      label(g, '特價\n$39', { x: -0.6, y: 2.4, z: -3.85, w: 0.9, h: 0.9, bg: '#ffeb3b', fg: '#d6302b' });
    } },
    cram: { cam: { pos: [3.5, 3.8, 8.5], look: [0, 1.0, -0.5] }, bg: 0xeef0f5, build(g, night, o) {
      shell(g, 0xb9bec7, 0xf2f3f7, 11, 8); windowOn(g, 3.0, 2.4, 3.2, 1.6, 8, night);
      const board = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 0.1), mat(0xfafafa)); board.position.set(-1.8, 2.3, -3.85); g.add(board);
      label(g, o.board || '模擬考倒數 30 天', { x: -1.8, y: 2.3, z: -3.79, w: 4.2, h: 1.5, bg: '#fafafa', fg: '#1e3799' });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { put(g, 'desk', -3.4 + c * 2.2, -0.2 + r * 1.9, 0, 1.9); put(g, 'chair', -2.8 + c * 2.2, 0.8 + r * 1.9, Math.PI, 1.9); }
      label(g, o.sign || '明星補習班\n上榜 100%', { x: 3.2, y: 3.45, z: -3.84, w: 2.6, h: 0.95, bg: '#ff3d3d', fg: '#fff' });
      label(g, '恭喜\n王小明\n建中', { x: -4.6, y: 2.4, z: -3.84, w: 0.9, h: 1.6, bg: '#d63031', fg: '#ffe39a' });
    } },
    drinkshop: { cam: { pos: [2.8, 3.3, 7.6], look: [0, 1.1, 0] }, bg: 0xfff6e8, build(g, night, o) {
      shell(g, 0xd7c2a3, 0xfff1dc, 10, 7);
      [-2.2, -1.0, 0.2, 1.4].forEach((x, i) => put(g, i === 3 ? 'kitchenBarEnd' : 'kitchenBar', x, -1.0, Math.PI));
      putH(g, 'kitchenBlender', -2.0, -1.0, 0, 0.45, 1.05); putH(g, 'kitchenCoffeeMachine', -0.6, -1.0, 0, 0.5, 1.05);
      ['frappe', 'cup-tea', 'frappe', 'cup-tea'].forEach((n, i) => putH(g, n, 0.4 + i * 0.3, -0.9, 0, 0.3, 1.05));
      putH(g, 'kitchenFridgeLarge', -4.4, -2.4, Math.PI / 2, 2.2);
      label(g, o.sign || '茶の物語', { x: 0, y: 3.5, z: -3.38, w: 4, h: 0.8, bg: '#3e2723', fg: '#ffe0b2' });
      label(g, '珍珠奶茶　55\n多多綠　　50\n楊枝甘露　70\n冬瓜檸檬　45', { x: 0.2, y: 2.2, z: -3.38, w: 3.2, h: 1.6, bg: '#fff8e1', fg: '#5d4037' });
      put(g, 'stoolBar', 2.6, 1.6, 0); put(g, 'pottedPlant', 4.1, -2.8, 0);
    } },
    street: { outdoor: true, cam: { pos: [3.0, 3.4, 9.4], look: [0, 1.1, 0] }, bg: 0xbfe3ff, build(g, night) {
      ground(g, 0x5d6168, 36, 26); box(g, 36, 0.16, 4.4, 0xc9bfae, 0, 0.08, -0.6);
      for (let i = -16; i < 17; i += 2) box(g, 1.0, 0.02, 0.15, 0xffffff, i, 0.01, 4.4, 0, true);
      const shops = [['自助餐', '#2e86de'], ['早餐店', '#e67e22'], ['7-ELEVEM', '#27ae60'], ['鹽酥雞', '#c0392b'], ['藥局', '#16a085']];
      shops.forEach(([n, c], i) => {
        const x = -10 + i * 5;
        box(g, 4.8, 7, 3, [0xe8d9c4, 0xd8e0e6, 0xf1e1cf, 0xe0d2c0, 0xd9e7dc][i], x, 3.5, -4.6);
        box(g, 4.0, 2.3, 0.06, night ? 0xffe8b0 : 0x9fc3dc, x, 1.3, -3.08, 0, night);
        label(g, n, { x, y: 2.85, z: -3.05, w: 3.8, h: 0.6, bg: c, fg: '#fff' });
        for (let f = 0; f < 2; f++) box(g, 3.6, 1.0, 0.06, 0xa9b7c2, x, 4.4 + f * 1.6, -3.08);
      });
      putH(g, 'light-square', -6, 1.4, Math.PI / 2, 4.2); putH(g, 'electricity-pole', 9.5, -2.4, 0, 6);
      putL(g, 'delivery', -3.5, 4.6, Math.PI / 2, 4.6); putL(g, 'taxi', 7.0, 3.8, -Math.PI / 2, 4.3);
      skyline(g, -14, night);
    } },
    workoffice: { cam: { pos: [2.6, 3.3, 7.4], look: [0, 1.1, 0] }, bg: 0xe9eef2, build(g, night) {
      shell(g, 0x9aa5b1, 0xe7eef3, 10, 7); windowOn(g, 2.6, 2.4, 2.6, 1.4, 7, night);
      [-3.2, -0.8].forEach((x) => { put(g, 'desk', x, -1.8, 0); put(g, 'computerScreen', x + 0.2, -2.1, 0); put(g, 'chairDesk', x + 0.4, -0.9, Math.PI); });
      put(g, 'kitchenCoffeeMachine', 4.1, -2.6, 0); put(g, 'pottedPlant', 4.2, 1.2, 0);
      label(g, '本季 KPI\n達成率 38%', { x: -2.2, y: 2.7, z: -3.38, w: 1.8, h: 1.1, bg: '#ffffff', fg: '#c0392b' });
      label(g, '準時下班\n是一種罪', { x: 0.6, y: 2.7, z: -3.38, w: 1.6, h: 1.1, bg: '#fff3e0', fg: '#333' });
    } },
    police: { cam: { pos: [2.8, 3.3, 7.4], look: [0, 1.1, 0] }, bg: 0xe3ebf5, build(g, night) {
      shell(g, 0xc5ccd6, 0xe9eef6, 10, 7); windowOn(g, 2.6, 2.4, 2.6, 1.4, 7, night);
      box(g, 5, 1.05, 0.9, 0x34495e, -1.2, 0.52, -1.6); box(g, 5.1, 0.08, 1.0, 0xbdc3c7, -1.2, 1.09, -1.6);
      put(g, 'computerScreen', -2.2, -1.7, Math.PI); put(g, 'chair', 0.8, 0.6, Math.PI); put(g, 'chair', -0.4, 0.6, Math.PI);
      label(g, '臺北市政府警察局\n幸福派出所', { x: -1.2, y: 3.2, z: -3.38, w: 3.6, h: 1.0, bg: '#1e3799', fg: '#fff' });
      label(g, '為民服務', { x: -1.2, y: 1.85, z: -3.38, w: 1.8, h: 0.5, bg: '#fff', fg: '#1e3799' });
    } },
    restaurant: { cam: { pos: [3.0, 3.6, 7.8], look: [0, 1.0, 0] }, bg: 0xfbe9e2, build(g, night) {
      shell(g, 0x8d5a3b, 0xf8e1d4, 10, 7);
      const t = putH(g, 'tableRound', 0, -0.9, 0, 0.85); const ty = topOf(t) || 0.85;
      box(g, 1.2, 0.04, 1.2, 0xc0392b, 0, ty + 0.02, -0.9);
      [['dim-sum', -0.4, -1.1], ['chinese', 0.35, -0.7], ['bowl-soup', 0, -1.3], ['rice-ball', -0.2, -0.5], ['fish', 0.5, -1.2]].forEach(([n, x, z]) => putH(g, n, x, z, Math.random() * 3, 0.22, ty + 0.04));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; put(g, 'chair', Math.sin(a) * 1.6, -0.9 + Math.cos(a) * 1.6, a + Math.PI); }
      label(g, '福', { x: -3, y: 2.6, z: -3.38, w: 1.1, h: 1.1, bg: '#c0392b', fg: '#ffd700', rot: 0 });
      label(g, '阿嬤八十大壽', { x: 1.2, y: 3.2, z: -3.38, w: 3.4, h: 0.7, bg: '#c0392b', fg: '#ffd700' });
    } },
    living: { cam: { pos: [3.2, 3.4, 7.6], look: [0, 1.0, 0] }, bg: 0xf3e6d4, build(g, night) {
      shell(g, 0xc89f72, 0xf1e3cf, 10, 7); windowOn(g, 2.2, 2.3, 2.4, 1.5, 7, night);
      put(g, 'rugRectangle', -0.6, 0.6, 0); put(g, 'loungeSofa', -1.2, -1.9, 0); put(g, 'tableCoffee', -0.9, 0.2, 0);
      put(g, 'cabinetTelevision', -4.4, 0.6, Math.PI / 2); put(g, 'televisionModern', -4.4, 0.6, Math.PI / 2);
      put(g, 'bookcaseOpen', -4.6, -2.6, Math.PI / 2); put(g, 'pottedPlant', 3.9, -2.8, 0); put(g, 'lampRoundFloor', 1.2, -2.8, 0);
      put(g, 'kitchenFridge', 4.2, 0.2, -Math.PI / 2); poster(g, -2.8, 2.6, 7, '家和\n萬事興', '#ffeedd');
    } },
    office: { cam: { pos: [2.6, 3.3, 7.4], look: [0, 1.1, 0] }, bg: 0xe9eef2, build(g, night) {
      shell(g, 0xb9c2c9, 0xe7eef3, 10, 7); windowOn(g, 2.6, 2.4, 2.6, 1.4, 7, night);
      put(g, 'desk', -1.6, -1.6, 0); put(g, 'chairDesk', -0.7, -2.4, 0); put(g, 'computerScreen', -0.9, -1.9, 0);
      put(g, 'bookcaseOpen', -4.6, -1.4, Math.PI / 2); put(g, 'books', -4.3, -1.2, Math.PI / 2); put(g, 'pottedPlant', 4.0, -2.8, 0);
      put(g, 'chair', -2.2, 1.1, Math.PI); put(g, 'chair', 0.6, 1.1, Math.PI); put(g, 'coatRackStanding', 4.2, 1.0, 0);
      poster(g, -2.5, 2.7, 7, '學務處\n品德第一', '#e8f3ff'); poster(g, 0.2, 2.7, 7, '校園\n零霸凌', '#fff3e0');
    } },
    classroom: { cam: { pos: [3.5, 3.8, 8.5], look: [0, 1.0, -0.5] }, bg: 0xeef3e9, build(g, night) {
      shell(g, 0xc6a77d, 0xeef1e6, 11, 8); windowOn(g, 3.0, 2.4, 3.2, 1.6, 8, night);
      const board = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 0.1), mat(0x2f5d3a)); board.position.set(-1.8, 2.3, -3.85); g.add(board);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { put(g, 'desk', -3.4 + c * 2.2, -0.2 + r * 1.9, 0, 1.9); put(g, 'chair', -2.8 + c * 2.2, 0.8 + r * 1.9, Math.PI, 1.9); }
      put(g, 'desk', -2.4, -3.0, 0); put(g, 'pottedPlant', 4.5, -3.4, 0);
    } },
    netcafe: { cam: { pos: [3.0, 3.2, 7.4], look: [0, 1.1, 0] }, bg: 0x1d1b2e, build(g) {
      shell(g, 0x2b2a3a, 0x3a2f5a, 10, 7);
      for (let c = 0; c < 4; c++) { put(g, 'desk', -4.0 + c * 2.1, -2.2, 0, 2.0); put(g, 'computerScreen', -3.5 + c * 2.1, -2.5, 0, 2.0); put(g, 'chairDesk', -3.3 + c * 2.1, -1.0, Math.PI, 2.0); }
      poster(g, 2.8, 2.7, 7, '包夜\n$150', '#ff3d81');
      const neon = new THREE.PointLight(0xff3d81, 1.2, 12); neon.position.set(2, 3, 0); g.add(neon);
    } },
    hospital: { cam: { pos: [2.8, 3.2, 7.2], look: [0, 1.0, 0] }, bg: 0xeaf4f6, build(g, night) {
      shell(g, 0xdfe7ea, 0xf3f8f9, 10, 7); windowOn(g, 2.2, 2.4, 2.4, 1.4, 7, night);
      put(g, 'bedSingle', -1.6, -1.5, 0); put(g, 'sideTable', 0.4, -2.6, 0); put(g, 'chair', 1.2, -0.2, -Math.PI / 2); put(g, 'pottedPlant', 4.0, -2.8, 0);
      poster(g, -3.4, 2.7, 7, '請保持\n安靜', '#e0f7ff');
    } },
  };

  /**
   * Show a room with actors.
   * actors: [{ id, model, x, z, rot, anim, height }]
   */
  S.show = function (room, list, opts) {
    opts = opts || {};
    if (!S.ready) return;
    S.clearActors();
    if (roomGroup) scene.remove(roomGroup);
    roomGroup = new THREE.Group();
    const R = ROOMS[room] || ROOMS.living;
    const night = !!(opts.night || R.night);
    R.build(roomGroup, night, opts);
    scene.add(roomGroup);
    scene.background = new THREE.Color(night ? (R.nightBg || 0x2a2f45) : R.bg);
    if (hemi) { hemi.intensity = night ? (R.outdoor ? 0.42 : 0.6) : R.outdoor ? 0.7 : 0.85; keyLight.intensity = night ? 0.35 : R.outdoor ? 0.95 : 1.0; }
    scene.fog = R.outdoor ? new THREE.Fog(scene.background.getHex(), 18, 40) : null;
    camBase = R.cam; sway = 0;
    (list || []).forEach((a) => S.add(a));
    container.classList.remove('hidden');
    visible = true;
    resize();
  };
  S.add = function (a) {
    const o = G.Assets.place(a.model, { height: a.height || 1.75, x: a.x || 0, z: a.z || 0, rot: a.rot || 0 });
    if (!o) return null;
    scene.add(o);
    G.Assets.animate(o, a.anim || 'idle');
    actors[a.id] = { o, home: { x: a.x || 0, z: a.z || 0, rot: a.rot || 0 } };
    return o;
  };
  S.act = function (id, anim, opts) { const a = actors[id]; if (a) G.Assets.play(a.o, anim, opts); };
  S.face = function (id, otherId) {
    const a = actors[id], b = actors[otherId]; if (!a || !b) return;
    a.o.rotation.y = Math.atan2(b.o.position.x - a.o.position.x, b.o.position.z - a.o.position.z);
  };
  /** walk an actor to x,z over `dur` seconds */
  S.move = function (id, x, z, dur) {
    const a = actors[id]; if (!a) return Promise.resolve();
    const sx = a.o.position.x, sz = a.o.position.z; let t = 0;
    a.o.rotation.y = Math.atan2(x - sx, z - sz);
    G.Assets.play(a.o, 'walk');
    return new Promise((res) => {
      let finished = false;
      const finish = () => { if (finished) return; finished = true; a.tween = null; a.o.position.x = x; a.o.position.z = z; G.Assets.play(a.o, 'idle'); res(); };
      a.tween = (dt) => {
        t += dt / dur;
        const k = Math.min(1, t);
        a.o.position.x = sx + (x - sx) * k; a.o.position.z = sz + (z - sz) * k;
        if (k >= 1) finish();
      };
      setTimeout(finish, dur * 1000 + 400); // never block the story if frames are throttled
    });
  };
  S.clearActors = function () {
    for (const id in actors) { G.Assets.dispose(actors[id].o); scene.remove(actors[id].o); delete actors[id]; }
  };
  S.hide = function () { visible = false; if (container) container.classList.add('hidden'); S.clearActors(); };
  S.isVisible = () => visible;

  /* =====================================================
   * Fight minigame (timing bar). Returns Promise<'win'|'lose'>
   * opts: { you, foe, foeName, hp, speed }
   * ===================================================== */
  S.fight = function (opts) {
    return new Promise((resolve) => {
      const ui = document.querySelector('#fight');
      const youHp = { v: opts.hp || 3, max: opts.hp || 3 }, foeHp = { v: opts.foeHp || 3, max: opts.foeHp || 3 };
      ui.innerHTML = `
        <div class="f-top"><div class="f-side"><b>你</b><div class="f-hp"><i id="f-you"></i></div></div>
          <div class="f-vs">VS</div>
          <div class="f-side"><b>${opts.foeName || '對方'}</b><div class="f-hp foe"><i id="f-foe"></i></div></div></div>
        <div class="f-msg" id="f-msg">游標進到紅色區域時，按【空白鍵】或點按鈕出手！</div>
        <div class="f-bar"><div class="f-zone" id="f-zone"></div><div class="f-cur" id="f-cur"></div></div>
        <button class="btn primary" id="f-btn">出手！</button>`;
      ui.classList.remove('hidden');
      const cur = ui.querySelector('#f-cur'), zone = ui.querySelector('#f-zone'), msg = ui.querySelector('#f-msg');
      let pos = 0, dir = 1, speed = opts.speed || 1.1, zoneL = 0.4, zoneW = 0.2, live = true, lock = false;
      const setZone = () => { zoneW = Math.max(0.09, 0.22 - (youHp.max - youHp.v) * 0.02 - (foeHp.max - foeHp.v) * 0.03); zoneL = 0.1 + Math.random() * (0.8 - zoneW); zone.style.left = zoneL * 100 + '%'; zone.style.width = zoneW * 100 + '%'; };
      const hp = () => { ui.querySelector('#f-you').style.width = (youHp.v / youHp.max) * 100 + '%'; ui.querySelector('#f-foe').style.width = (foeHp.v / foeHp.max) * 100 + '%'; };
      setZone(); hp();
      let last = performance.now();
      const tick = (now) => {
        if (!live) return;
        const dt = (now - last) / 1000; last = now;
        if (!lock) { pos += dir * speed * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } }
        cur.style.left = pos * 100 + '%';
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const strike = async () => {
        if (lock || !live) return;
        lock = true;
        const hit = pos >= zoneL && pos <= zoneL + zoneW;
        if (hit) {
          S.act(opts.you, G.pick(['attack-melee-right', 'attack-melee-left', 'attack-kick-right']), { once: true, restart: true });
          G.sfx.crash(); G.ui.fx('shake');
          setTimeout(() => S.act(opts.foe, 'emote-no', { once: true, restart: true }), 250);
          foeHp.v--; msg.textContent = G.pick(['正中下巴！', '一記漂亮的勾拳！', '你踢中了他的小腿！', '他踉蹌了一下！']);
        } else {
          S.act(opts.foe, G.pick(['attack-melee-right', 'attack-kick-left']), { once: true, restart: true });
          G.sfx.bad();
          setTimeout(() => S.act(opts.you, 'emote-no', { once: true, restart: true }), 250);
          youHp.v--; msg.textContent = G.pick(['你被打中了！', '他的拳頭比你想像的重⋯', '你眼冒金星！']);
        }
        hp();
        await G.sleep(900);
        if (foeHp.v <= 0 || youHp.v <= 0) {
          live = false;
          const win = foeHp.v <= 0;
          S.act(win ? opts.foe : opts.you, 'die', { once: true, restart: true });
          S.act(win ? opts.you : opts.foe, 'emote-yes', { once: true, restart: true });
          msg.textContent = win ? '對方倒地了。' : '你倒在地上，天花板在旋轉。';
          await G.sleep(1400);
          ui.classList.add('hidden');
          document.removeEventListener('keydown', key);
          resolve(win ? 'win' : 'lose');
          return;
        }
        S.act(opts.you, 'idle'); S.act(opts.foe, 'idle');
        speed += 0.18; setZone(); lock = false;
      };
      const key = (e) => { if (e.code === 'Space') { e.preventDefault(); strike(); } };
      document.addEventListener('keydown', key);
      ui.querySelector('#f-btn').onclick = strike;
    });
  };

  /* =====================================================
   * Reflex minigame: wait for 「現在！」 then press Space / button in time.
   * opts: { title, text, btn, window(sec), tries } -> Promise<'win'|'lose'>
   * ===================================================== */
  S.reflex = function (opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const ui = document.querySelector('#fight');
      const win = opts.window || 0.7;
      ui.innerHTML = `
        <div class="f-title">${opts.title || '反應！'}</div>
        <div class="f-msg">${opts.text || '看到「現在！」就按【空白鍵】或按鈕。太早按會失敗。'}</div>
        <div class="f-go" id="f-go">準備⋯</div>
        <div class="f-bar"><div class="f-time" id="f-time"></div></div>
        <button class="btn primary" id="f-btn">${opts.btn || '行動！'}</button>`;
      ui.classList.remove('hidden');
      const go = ui.querySelector('#f-go'), tbar = ui.querySelector('#f-time');
      let state = 'wait', t0 = 0, done = false;
      const finish = (ok, text) => {
        if (done) return; done = true; state = 'end';
        go.textContent = text; go.className = 'f-go ' + (ok ? 'ok' : 'bad');
        if (ok) G.sfx.hero(); else G.sfx.bad();
        document.removeEventListener('keydown', key);
        setTimeout(() => { ui.classList.add('hidden'); resolve(ok ? 'win' : 'lose'); }, 1100);
      };
      const delay = 1100 + Math.random() * 1900;
      const timer = setTimeout(() => {
        if (done) return;
        state = 'go'; t0 = performance.now(); go.textContent = opts.now || '現在！'; go.className = 'f-go now';
        const tick = () => { if (state !== 'go') return; const k = (performance.now() - t0) / 1000 / win; tbar.style.width = Math.max(0, 100 - k * 100) + '%'; if (k >= 1) finish(false, opts.slow || '太慢了⋯'); else requestAnimationFrame(tick); };
        tick();
        setTimeout(() => { if (state === 'go') finish(false, opts.slow || '太慢了⋯'); }, win * 1000 + 50);
      }, delay);
      const press = () => {
        if (state === 'wait') { clearTimeout(timer); finish(false, opts.early || '太早了！'); }
        else if (state === 'go') finish(true, opts.ok || '成功！');
      };
      const key = (e) => { if (e.code === 'Space') { e.preventDefault(); press(); } };
      document.addEventListener('keydown', key);
      ui.querySelector('#f-btn').onclick = press;
    });
  };
})(window.G);
