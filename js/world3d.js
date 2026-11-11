/* 外送人生 — 3D world (Three.js, procedural low-poly Taipei-ish city)
 * API:
 *   World.init(container, minimapCanvas)
 *   World.setTime(clock, weather)          lighting / rain
 *   World.setTarget(locName | null)        beacon + arrow + minimap dot
 *   World.locs                             { name: {x, z, label} }
 *   World.pause(bool)
 *   World.resetToHome()
 *   World.onArrive / onCrash / onBump / onTick   callbacks (set by game)
 *   World.doorHazard() -> Promise<'hit'|'dodge'>
 *   World.distToTarget()
 */
(function (G) {
  const W = (G.World = {});
  const N = 7, PITCH = 60, ROAD = 14, INSET = 4;
  const SIZE = N * PITCH;
  let renderer, scene, camera, clockT, container, mini, miniCtx;
  let sun, hemi, rainPts, arrow, beacon, beaconRing, homeMarker;
  const solids = [];        // {minX,maxX,minZ,maxZ}
  const cars = [];
  const nightOnly = [];     // emissive things shown at night
  const keys = {};
  let paused = true, target = null, arrivedLock = false, raining = false, maxSpeedMul = 1;
  let hazard = null;
  const P = { x: 0, z: 0, h: 0, v: 0, mesh: null, wheelF: null, wheelB: null, lean: 0 };
  W.locs = {};
  W.ready = false;

  /* ---------- seeded rng so the city is the same every time ---------- */
  let seed = 20261108;
  const srand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const spick = (a) => a[Math.floor(srand() * a.length)];

  const K = () => G.Assets && G.Assets.ready;
  const SHOPS3D = ['building-a', 'building-b', 'building-c', 'building-d', 'building-e', 'building-f', 'building-g', 'building-h', 'building-i', 'building-j', 'building-k', 'building-l', 'building-m', 'building-n'];
  const SKY = ['building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e'];
  const SUBURB = ['building-type-a', 'building-type-c', 'building-type-e', 'building-type-g', 'building-type-k', 'building-type-m'];
  const CARS3D = ['taxi', 'taxi', 'taxi', 'sedan', 'sedan', 'suv', 'van', 'hatchback-sports', 'sedan-sports', 'suv-luxury', 'delivery', 'truck', 'garbage-truck', 'police'];
  const PEOPLE = ['character-male-a', 'character-male-b', 'character-male-c', 'character-male-d', 'character-male-e', 'character-male-f', 'character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-female-f'];
  const peds = [];
  const mat = (color, opts) => new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opts || {}));
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  /* ---------- canvas textures for signboards ---------- */
  function signTexture(text, bg, fg) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 118);
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    let size = 64;
    x.font = `900 ${size}px "Microsoft JhengHei", "PingFang TC", sans-serif`;
    while (x.measureText(text).width > 470 && size > 24) { size -= 4; x.font = `900 ${size}px "Microsoft JhengHei", "PingFang TC", sans-serif`; }
    x.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  /* ---------- city ---------- */
  const PALETTE = [0xe8d5b5, 0xd9c6a5, 0xc9d6c3, 0xb8c9d9, 0xe0b8a8, 0xd5d0c8, 0xc4b59d, 0xf0e2c4, 0xa9b8a0, 0xd8a48f];
  const SIGN_BG = ['#c0392b', '#e67e22', '#1e8449', '#1f618d', '#7d3c98', '#b9770e', '#117a65', '#922b21'];

  function blockBounds(bx, bz) {
    const x0 = bx * PITCH + ROAD / 2, z0 = bz * PITCH + ROAD / 2;
    return { x0, z0, x1: x0 + PITCH - ROAD, z1: z0 + PITCH - ROAD };
  }

  function buildGround() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE + 400, SIZE + 400), mat(0x5d8a4e));
    ground.rotation.x = -Math.PI / 2; ground.position.set(SIZE / 2, -0.05, SIZE / 2); ground.receiveShadow = true;
    scene.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(SIZE + ROAD, SIZE + ROAD), mat(0x4a4a52));
    road.rotation.x = -Math.PI / 2; road.position.set(SIZE / 2, 0, SIZE / 2); road.receiveShadow = true;
    scene.add(road);
    // lane dashes
    const dashM = mat(0xf2f2f2);
    const dashG = new THREE.BoxGeometry(3, 0.05, 0.35);
    const dashes = new THREE.InstancedMesh(dashG, dashM, (N + 1) * N * 8 * 2);
    let k = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j < N; j++) {
        for (let d = 0; d < 8; d++) {
          const t = j * PITCH + ROAD / 2 + 3 + d * 6;
          q.setFromEuler(new THREE.Euler(0, 0, 0));
          m4.compose(new THREE.Vector3(t, 0.03, i * PITCH), q, sc); dashes.setMatrixAt(k++, m4);
          q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
          m4.compose(new THREE.Vector3(i * PITCH, 0.03, t), q, sc); dashes.setMatrixAt(k++, m4);
        }
      }
    }
    scene.add(dashes);
    // crosswalks at intersections
    const zebraG = new THREE.BoxGeometry(0.8, 0.05, 5);
    const zebras = new THREE.InstancedMesh(zebraG, dashM, (N + 1) * (N + 1) * 4 * 5);
    k = 0;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const cx = i * PITCH, cz = j * PITCH;
      for (let s = 0; s < 5; s++) {
        const o = -4 + s * 2;
        q.setFromEuler(new THREE.Euler(0, 0, 0));
        m4.compose(new THREE.Vector3(cx + o, 0.04, cz + ROAD / 2 + 2.5 - 0.1), q, sc); zebras.setMatrixAt(k++, m4);
        m4.compose(new THREE.Vector3(cx + o, 0.04, cz - ROAD / 2 - 2.5 + 0.1), q, sc); zebras.setMatrixAt(k++, m4);
        q.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
        m4.compose(new THREE.Vector3(cx + ROAD / 2 + 2.5, 0.04, cz + o), q, sc); zebras.setMatrixAt(k++, m4);
        m4.compose(new THREE.Vector3(cx - ROAD / 2 - 2.5, 0.04, cz + o), q, sc); zebras.setMatrixAt(k++, m4);
      }
    }
    zebras.count = k;
    scene.add(zebras);
  }

  function buildBlock(bx, bz, special) {
    const b = blockBounds(bx, bz);
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    // sidewalk
    const side = box(w, 0.3, d, mat(0xc9c2b4));
    side.position.set(b.x0 + w / 2, 0.15, b.z0 + d / 2); side.receiveShadow = true;
    scene.add(side);
    const ix0 = b.x0 + INSET, iz0 = b.z0 + INSET, ix1 = b.x1 - INSET, iz1 = b.z1 - INSET;
    solids.push({ minX: ix0, maxX: ix1, minZ: iz0, maxZ: iz1 });

    if (special === 'park') {
      const grass = box(ix1 - ix0, 0.4, iz1 - iz0, mat(0x6fae5a));
      grass.position.set((ix0 + ix1) / 2, 0.2, (iz0 + iz1) / 2); scene.add(grass);
      for (let t = 0; t < 10; t++) tree(ix0 + 3 + srand() * (ix1 - ix0 - 6), iz0 + 3 + srand() * (iz1 - iz0 - 6), 1.4);
      return;
    }
    if (special === 'tower') { taipei101((ix0 + ix1) / 2, (iz0 + iz1) / 2); return; }

    // 2x2 lots
    const hw = (ix1 - ix0) / 2, hd = (iz1 - iz0) / 2;
    if (K()) {
      const downtown = bx >= 4 && bz <= 2;
      const suburb = special === 'suburb';
      for (let lx = 0; lx < 2; lx++) for (let lz = 0; lz < 2; lz++) {
        const cx = ix0 + hw * lx + hw / 2, cz = iz0 + hd * lz + hd / 2;
        let model;
        if (suburb) model = spick(SUBURB);
        else if (downtown && srand() < 0.55) model = spick(SKY);
        else model = spick(SHOPS3D);
        const rot = lz === 0 ? Math.PI : 0; // face the nearer east-west street
        const o = G.Assets.place(model, { width: hw - 1.0, depth: hd - 1.0, x: cx, z: cz, rot });
        if (o) scene.add(o);
        if (!suburb && srand() < 0.35 && G.Assets.has('detail-awning')) {
          const aw = G.Assets.place('detail-awning', { width: hw * 0.55, x: cx, z: cz + (lz === 0 ? -1 : 1) * (hd / 2 - 0.2), rot });
          if (aw) { aw.position.y = 0; scene.add(aw); }
        }
      }
      for (let t = 0; t < 2; t++) tree(b.x0 + 2, b.z0 + 6 + srand() * (d - 12), 1);
      lamp(b.x1 - 1.5, b.z0 + d / 2);
      for (let t = 0; t < 3; t++) parkedScooter(b.x0 + 6 + srand() * (w - 12), b.z1 - 2.2);
      if (srand() < 0.3 && G.Assets.has('dumpster')) { const du = G.Assets.place('dumpster', { length: 3, x: b.x1 - 2.2, z: b.z0 + 6, rot: Math.PI / 2 }); if (du) scene.add(du); }
      return;
    }
    for (let lx = 0; lx < 2; lx++) for (let lz = 0; lz < 2; lz++) {
      const h = 8 + Math.floor(srand() * 7) * 4 + (srand() < 0.15 ? 20 : 0);
      const bw = hw - 1.2, bd = hd - 1.2;
      const cx = ix0 + hw * lx + hw / 2, cz = iz0 + hd * lz + hd / 2;
      const color = spick(PALETTE);
      const bld = box(bw, h, bd, mat(color));
      bld.position.set(cx, h / 2, cz);
      scene.add(bld);
      // roof details
      const roof = box(bw * 0.3, 1.6, bd * 0.3, mat(0x9aa0a6));
      roof.position.set(cx + (srand() - 0.5) * bw * 0.4, h + 0.8, cz + (srand() - 0.5) * bd * 0.4); scene.add(roof);
      // ground-floor arcade (騎樓) darker band
      const arcade = box(bw + 0.4, 3.2, bd + 0.4, mat(0x6b5b4b));
      arcade.position.set(cx, 1.6, cz); scene.add(arcade);
      // windows: lit at night
      const floors = Math.floor((h - 4) / 4);
      const winM = new THREE.MeshBasicMaterial({ color: srand() < 0.5 ? 0xffe28a : 0xbfe3ff });
      for (let f = 0; f < floors; f++) {
        if (srand() < 0.35) continue;
        const y = 5.5 + f * 4;
        const faces = [[0, bd / 2 + 0.05, 0], [0, -bd / 2 - 0.05, Math.PI], [bw / 2 + 0.05, 0, Math.PI / 2], [-bw / 2 - 0.05, 0, -Math.PI / 2]];
        const fc = faces[Math.floor(srand() * 4)];
        const win = new THREE.Mesh(new THREE.PlaneGeometry((fc[2] === 0 || fc[2] === Math.PI ? bw : bd) * 0.7, 1.4), winM);
        win.position.set(cx + fc[0], y, cz + fc[1]); win.rotation.y = fc[2];
        win.visible = false; nightOnly.push(win); scene.add(win);
      }
      // AC units for flavor
      if (srand() < 0.6) {
        const ac = box(1.4, 0.9, 0.7, mat(0xeeeeee));
        ac.position.set(cx + (srand() - 0.5) * bw * 0.6, 5 + srand() * (h - 7), cz + bd / 2 + 0.4); scene.add(ac);
      }
    }
    // trees & lamps on sidewalk
    for (let t = 0; t < 2; t++) tree(b.x0 + 2, b.z0 + 6 + srand() * (d - 12), 1);
    lamp(b.x1 - 1.5, b.z0 + d / 2);
    // parked scooters
    for (let t = 0; t < 3; t++) parkedScooter(b.x0 + 6 + srand() * (w - 12), b.z1 - 2.2);
  }

  function tree(x, z, s) {
    if (K()) {
      const t = G.Assets.place(srand() < 0.5 ? 'tree-large' : 'tree-small', { height: 6 * s * (0.8 + srand() * 0.4), x, z, rot: srand() * 6 });
      if (t) { t.position.y = 0.3; scene.add(t); return; }
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 2.4 * s, 6), mat(0x7a5230));
    trunk.position.set(x, 1.2 * s + 0.3, z); scene.add(trunk);
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * s, 0), mat(0x3f8f3a));
    top.position.set(x, 3.3 * s + 0.3, z); scene.add(top);
  }
  function lamp(x, z) {
    if (K()) {
      const l = G.Assets.place('light-square', { height: 7, x, z, rot: -Math.PI / 2 });
      if (l) {
        l.position.y = 0.3; scene.add(l);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: 0x555555 }));
        glow.position.set(x + 2.2, 6.9, z); glow.userData.lamp = true; nightOnly.push(glow); scene.add(glow);
        return;
      }
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 6), mat(0x3d3d45));
    pole.position.set(x, 3.3, z); scene.add(pole);
    const head = box(0.9, 0.3, 0.5, new THREE.MeshBasicMaterial({ color: 0x555555 }));
    head.position.set(x - 0.3, 6.3, z); scene.add(head);
    head.userData.lamp = true; nightOnly.push(head);
  }
  function parkedScooter(x, z) {
    const g = new THREE.Group();
    const c = spick([0xd64541, 0x3d7dd8, 0xeeeeee, 0x222222, 0xf0c419]);
    const body = box(0.6, 0.7, 1.7, mat(c)); body.position.y = 0.7; g.add(body);
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8), mat(0x222222));
    w1.rotation.z = Math.PI / 2; w1.position.set(0, 0.35, 0.65); g.add(w1);
    const w2 = w1.clone(); w2.position.z = -0.65; g.add(w2);
    g.position.set(x, 0.3, z); g.rotation.y = Math.PI / 2 + (srand() - 0.5) * 0.3;
    scene.add(g);
  }
  function taipei101(x, z) {
    const m = mat(0x5f8c8a);
    let y = 0, w = 16;
    const base = box(w, 22, w, m); base.position.set(x, 11, z); scene.add(base); y = 22;
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.42, 9, 4), m);
      seg.rotation.y = Math.PI / 4; seg.position.set(x, y + 4.5, z); scene.add(seg); y += 9; w *= 0.97;
    }
    const top = box(5, 10, 5, m); top.position.set(x, y + 5, z); scene.add(top);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 22, 6), mat(0xbbbbbb));
    spire.position.set(x, y + 21, z); scene.add(spire);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
    glow.position.set(x, y + 32, z); scene.add(glow);
  }

  /* place a named location: signboard on the building facing a road + marker pos on sidewalk */
  function placeLoc(name, label, bx, bz, sideIdx, bgColor, kind) {
    const b = blockBounds(bx, bz);
    const midX = (b.x0 + b.x1) / 2, midZ = (b.z0 + b.z1) / 2;
    const off = (srand() - 0.5) * 14;
    let mx, mz, sx, sz, ry;
    // sides: 0 south(-z) 1 north(+z) 2 west(-x) 3 east(+x)
    if (sideIdx === 0) { mx = midX + off; mz = b.z0 + 1.6; sx = mx; sz = b.z0 + INSET + 0.05; ry = Math.PI; }
    else if (sideIdx === 1) { mx = midX + off; mz = b.z1 - 1.6; sx = mx; sz = b.z1 - INSET - 0.05; ry = 0; }
    else if (sideIdx === 2) { mx = b.x0 + 1.6; mz = midZ + off; sx = b.x0 + INSET + 0.05; sz = mz; ry = -Math.PI / 2; }
    else { mx = b.x1 - 1.6; mz = midZ + off; sx = b.x1 - INSET - 0.05; sz = mz; ry = Math.PI / 2; }
    // signboards stick out a bit so they read from the road
    const tex = signTexture(label, bgColor, '#fff8e7');
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), new THREE.MeshBasicMaterial({ map: tex }));
    const nx = Math.sin(ry), nz = Math.cos(ry);
    sign.position.set(sx + nx * 0.4, 4.6, sz + nz * 0.4); sign.rotation.y = ry;
    scene.add(sign);
    W.locs[name] = { x: mx, z: mz, label, kind };
  }

  /* ---------- player scooter ---------- */
  function buildPlayer() {
    const g = new THREE.Group();
    const teal = mat(0x17a3a0), dark = mat(0x222428), skin = mat(0xe8b88a);
    const body = box(0.8, 0.8, 2.2, teal); body.position.set(0, 0.85, 0); g.add(body);
    const floor = box(0.7, 0.2, 1.0, dark); floor.position.set(0, 0.5, 0.2); g.add(floor);
    const front = box(0.7, 1.3, 0.4, teal); front.position.set(0, 1.2, 1.0); front.rotation.x = -0.25; g.add(front);
    const bar = box(1.3, 0.12, 0.12, dark); bar.position.set(0, 1.95, 1.0); g.add(bar);
    const light = box(0.4, 0.25, 0.1, new THREE.MeshBasicMaterial({ color: 0xfff6c0 })); light.position.set(0, 1.55, 1.25); g.add(light);
    const seat = box(0.7, 0.25, 1.0, dark); seat.position.set(0, 1.35, -0.45); g.add(seat);
    const crate = box(1.0, 0.9, 0.9, teal); crate.position.set(0, 1.85, -1.15); g.add(crate);
    const crateTop = box(1.05, 0.1, 0.95, mat(0x0d6f6d)); crateTop.position.set(0, 2.33, -1.15); g.add(crateTop);
    const logo = box(0.02, 0.4, 0.4, new THREE.MeshBasicMaterial({ color: 0xe8417b })); logo.position.set(0.51, 1.9, -1.15); g.add(logo);
    const logo2 = logo.clone(); logo2.position.x = -0.51; g.add(logo2);
    const wheelG = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10);
    P.wheelF = new THREE.Mesh(wheelG, dark); P.wheelF.rotation.z = Math.PI / 2; P.wheelF.position.set(0, 0.45, 0.95); g.add(P.wheelF);
    P.wheelB = new THREE.Mesh(wheelG, dark); P.wheelB.rotation.z = Math.PI / 2; P.wheelB.position.set(0, 0.45, -0.85); g.add(P.wheelB);
    // rider: Kenney mini character in the "drive" pose, wearing a teal helmet
    if (K()) {
      const model = G.getState && G.getState() && G.getState().gender === 'f' ? 'character-female-b' : 'character-male-a';
      const rider = G.Assets.place(model, { height: 2.4, x: 0, z: -0.2 });
      if (rider) {
        rider.position.y = 0.45;
        g.add(rider);
        G.Assets.animate(rider, 'drive');
        P.rider = rider;
        g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        scene.add(g); P.mesh = g;
        return;
      }
    }
    const torso = box(0.75, 1.0, 0.5, teal); torso.position.set(0, 2.0, -0.2); torso.rotation.x = 0.2; g.add(torso);
    const legs = box(0.7, 0.35, 0.9, mat(0x2b2b38)); legs.position.set(0, 1.55, 0.2); g.add(legs);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 8, 6), skin); head.position.set(0, 2.75, -0.05); g.add(head);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.8), teal); helmet.position.set(0, 2.82, -0.08); g.add(helmet);
    const armL = box(0.18, 0.18, 0.9, teal); armL.position.set(0.38, 2.05, 0.45); armL.rotation.x = 0.35; g.add(armL);
    const armR = armL.clone(); armR.position.x = -0.38; g.add(armR);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    P.mesh = g;
  }

  /* ---------- NPC cars ---------- */
  const CAR_COLORS = [0xf4d03f, 0xf4d03f, 0xffffff, 0x2e4053, 0xc0392b, 0x5dade2, 0x95a5a6, 0x1e8449];
  function makeCar(color) {
    const g = new THREE.Group();
    const body = box(2.2, 1.0, 4.4, mat(color)); body.position.y = 0.8; g.add(body);
    const cab = box(1.9, 0.8, 2.3, mat(0xdde8f0)); cab.position.set(0, 1.65, -0.2); g.add(cab);
    const roof = box(1.95, 0.12, 2.0, mat(color)); roof.position.set(0, 2.1, -0.2); g.add(roof);
    const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 8), wm = mat(0x1b1b1b);
    [[1.05, 1.4], [-1.05, 1.4], [1.05, -1.4], [-1.05, -1.4]].forEach((p) => {
      const w = new THREE.Mesh(wg, wm); w.rotation.z = Math.PI / 2; w.position.set(p[0], 0.42, p[1]); g.add(w);
    });
    const hl = box(1.6, 0.25, 0.1, new THREE.MeshBasicMaterial({ color: 0xfffbe0 })); hl.position.set(0, 0.9, 2.21); g.add(hl);
    const tl = box(1.6, 0.25, 0.1, new THREE.MeshBasicMaterial({ color: 0xff3b3b })); tl.position.set(0, 0.9, -2.21); g.add(tl);
    if (color === 0xf4d03f) { const taxi = box(0.8, 0.3, 0.4, mat(0xffffff)); taxi.position.set(0, 2.3, -0.2); g.add(taxi); }
    return g;
  }
  function makeCar3D() {
    if (!K()) return makeCar(spick(CAR_COLORS));
    const o = G.Assets.place(spick(CARS3D), { length: 4.8 });
    return o || makeCar(spick(CAR_COLORS));
  }
  function spawnCars(n) {
    for (let i = 0; i < n; i++) {
      const alongX = i % 2 === 0;
      const road = Math.floor(srand() * (N + 1));
      const dir = srand() < 0.5 ? 1 : -1;
      const lane = road * PITCH + (alongX ? dir : -dir) * 3.2; // drive on the right
      const mesh = makeCar3D();
      const c = { alongX, dir, lane, t: srand() * SIZE, speed: 9 + srand() * 7, cur: 0, mesh };
      c.cur = c.speed;
      mesh.rotation.y = alongX ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      scene.add(mesh);
      cars.push(c);
    }
  }
  /* ---------- pedestrians & street furniture (Kenney) ---------- */
  function spawnPeds(n) {
    for (let i = 0; i < n; i++) {
      const bx = Math.floor(srand() * N), bz = Math.floor(srand() * N);
      const b = blockBounds(bx, bz);
      const alongX = srand() < 0.5;
      const side = srand() < 0.5 ? 0 : 1;
      const line = alongX ? (side ? b.z1 - 1.8 : b.z0 + 1.8) : (side ? b.x1 - 1.8 : b.x0 + 1.8);
      const a = alongX ? b.x0 + 2 : b.z0 + 2, z = alongX ? b.x1 - 2 : b.z1 - 2;
      const o = G.Assets.place(spick(PEOPLE), { height: 1.75 + srand() * 0.2 });
      if (!o) continue;
      o.position.y = 0.3;
      scene.add(o);
      G.Assets.animate(o, 'walk');
      peds.push({ o, alongX, line, a, z, t: a + srand() * (z - a), dir: srand() < 0.5 ? 1 : -1, speed: 1.2 + srand() * 0.8 });
    }
  }
  function updatePeds(dt) {
    for (const p of peds) {
      p.t += p.dir * p.speed * dt;
      if (p.t > p.z) { p.t = p.z; p.dir = -1; } else if (p.t < p.a) { p.t = p.a; p.dir = 1; }
      if (p.alongX) { p.o.position.x = p.t; p.o.position.z = p.line; p.o.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { p.o.position.z = p.t; p.o.position.x = p.line; p.o.rotation.y = p.dir > 0 ? 0 : Math.PI; }
    }
  }
  function trafficLights() {
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      if ((i + j) % 2) continue;
      const t = G.Assets.place('traffic-light', { height: 7, x: i * PITCH + ROAD / 2 + 1.2, z: j * PITCH + ROAD / 2 + 1.2, rot: Math.PI });
      if (t) { t.position.y = 0.3; scene.add(t); }
    }
  }

  function carPos(c) { return c.alongX ? { x: c.t, z: c.lane } : { x: c.lane, z: c.t }; }

  /* ---------- markers ---------- */
  function buildMarkers() {
    beacon = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 40, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
    beacon.visible = false; scene.add(beacon);
    beaconRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 24), new THREE.MeshBasicMaterial({ color: 0xffd34d, side: THREE.DoubleSide }));
    beaconRing.rotation.x = -Math.PI / 2; beaconRing.visible = false; scene.add(beaconRing);
    arrow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 4), new THREE.MeshBasicMaterial({ color: 0xffd34d }));
    arrow.geometry.rotateX(Math.PI / 2);
    arrow.visible = false; scene.add(arrow);
  }

  /* ---------- rain ---------- */
  function buildRain() {
    const n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 120; pos[i * 3 + 1] = Math.random() * 50; pos[i * 3 + 2] = (Math.random() - 0.5) * 120; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rainPts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xaac8ff, size: 0.25, transparent: true, opacity: 0.7 }));
    rainPts.visible = false; scene.add(rainPts);
  }

  /* ---------- init ---------- */
  W.init = function (el, miniCanvas) {
    if (W.ready) return;
    if (!window.THREE) { el.innerHTML = '<div style="color:#fff;padding:20px">⚠ 3D 引擎載入失敗（需要網路連線載入 Three.js）。</div>'; return; }
    container = el; mini = miniCanvas; miniCtx = mini.getContext('2d');
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!window.__TRAILER });
    renderer.setPixelRatio(window.__TRAILER ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, 1, 0.5, 900);
    hemi = new THREE.HemisphereLight(0xdfefff, 0x6d6a5a, 0.8); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2d6, 1.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 320;
    sun.shadow.bias = -0.0005;
    scene.add(sun); scene.add(sun.target);

    buildGround();
    // special blocks
    const specials = { '3,3': 'park', '6,0': 'tower', '1,5': 'suburb', '0,5': 'suburb', '1,6': 'suburb', '0,6': 'suburb', '2,6': 'suburb' };
    for (let bx = 0; bx < N; bx++) for (let bz = 0; bz < N; bz++) buildBlock(bx, bz, specials[bx + ',' + bz]);
    // named locations (fixed layout)
    const used = new Set(['3,3', '6,0']);
    const freeBlock = () => { let k; do { k = Math.floor(srand() * N) + ',' + Math.floor(srand() * N); } while (used.has(k)); used.add(k); return k.split(',').map(Number); };
    const home = [1, 5]; used.add('1,5');
    placeLoc('home', '我家・雅房出租', home[0], home[1], 1, '#5d6d7e', 'home');
    const all = [].concat(G.SHOPS.map((s) => ({ n: s.name, k: 'shop' })), G.DESTS.map((d) => ({ n: d.name, k: 'dest' })));
    all.forEach((L, i) => {
      const [bx, bz] = freeBlock();
      const label = L.k === 'shop' ? L.n : L.n.includes('醫院') ? '仁愛紀念醫院' : L.n.replace(/^\S+\s/, '');
      placeLoc(L.n, label, bx, bz, Math.floor(srand() * 4), SIGN_BG[i % SIGN_BG.length], L.k);
    });

    buildPlayer();
    buildMarkers();
    buildRain();
    spawnCars(34);
    if (K()) { spawnPeds(36); trafficLights(); }
    W.resetToHome();

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) && !paused) e.preventDefault();
      keys[k] = true;
    });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    window.addEventListener('resize', resize);
    resize();
    clockT = performance.now();
    W.ready = true;
    requestAnimationFrame(loop);
  };
  W.touch = (k, on) => { keys[k] = on; };

  function resize() {
    if (!renderer) return;
    const w = container.clientWidth || 800, h = container.clientHeight || 500;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  W.resize = resize;

  W.resetToHome = function () {
    const h = W.locs.home;
    P.x = h.x; P.z = h.z; P.h = Math.PI / 2; P.v = 0; // on the sidewalk in front of home, facing along the street
    // snap camera
    if (camera) camera.position.set(P.x, 8, P.z + 10);
  };

  /** trailer helpers: place the scooter, read city size */
  W.setPlayer = (x, z, h, v) => {
    P.x = x; P.z = z; P.h = h; P.v = v || 0;
    if (camera) camera.position.set(x - Math.sin(h) * 8.5, 5.8, z - Math.cos(h) * 8.5); // snap the chase camera too
  };
  W.grid = { N, PITCH, ROAD, SIZE };
  W.pause = (b) => { paused = b; if (b) for (const k in keys) keys[k] = false; };
  W.isPaused = () => paused;

  W.setTime = function (clock, weather) {
    if (!scene) return;
    const night = clock >= 18.5 * 60 || clock < 6 * 60;
    const dusk = !night && clock >= 16.5 * 60;
    raining = weather === 'rain' || weather === 'typhoon';
    let sky = 0x9fd3f5, fog = 0xcfe6f5;
    if (dusk) { sky = 0xf3b27a; fog = 0xf1c9a0; }
    if (night) { sky = 0x141633; fog = 0x1c1f3d; }
    if (raining && !night) { sky = 0x7d8794; fog = 0x8d96a1; }
    if (weather === 'typhoon') { sky = night ? 0x0d0f1c : 0x5a6270; fog = sky; }
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(fog, raining ? 40 : 90, raining ? 170 : 330);
    sun.intensity = night ? 0.15 : raining ? 0.45 : dusk ? 0.7 : 0.95;
    sun.color.set(dusk ? 0xffb070 : 0xfff2d6);
    hemi.intensity = night ? 0.35 : raining ? 0.6 : 0.75;
    renderer.toneMappingExposure = night ? 1.25 : 1.05;
    nightOnly.forEach((o) => {
      o.visible = night || (o.userData.lamp ? false : raining && Math.random() < 0.3);
      if (o.userData.lamp) { o.visible = true; o.material.color.set(night ? 0xffe9a8 : 0x555555); }
    });
    rainPts.visible = raining;
    maxSpeedMul = weather === 'typhoon' ? 0.7 : raining ? 0.85 : 1;
  };
  W.setSpeedMul = (m) => { W.extraMul = m; };

  W.setTarget = function (name) {
    target = name ? W.locs[name] : null;
    arrivedLock = false;
    beacon.visible = beaconRing.visible = arrow.visible = !!target;
    if (target) { beacon.position.set(target.x, 20, target.z); beaconRing.position.set(target.x, 0.1, target.z); }
  };
  W.distToTarget = () => (target ? Math.hypot(target.x - P.x, target.z - P.z) : 0);
  W.distBetween = (a, b) => { const A = W.locs[a], B = W.locs[b]; return Math.hypot(A.x - B.x, A.z - B.z) + Math.abs(A.x - B.x) * 0.2 + Math.abs(A.z - B.z) * 0.2; };
  W.speed = () => P.v;
  W.pos = () => ({ x: P.x, z: P.z, h: P.h, v: P.v });
  /** dev helper: jump next to a location (used by tools/autotest.js) */
  W.debugTeleport = (name) => { const L = W.locs[name]; if (L) { P.x = L.x + 3; P.z = L.z + 3; P.v = 0; } };

  /* ---------- scripted hazard: a parked car door opens in front of you ---------- */
  W.doorHazard = function () {
    return new Promise((resolve) => {
      // snap heading to nearest axis
      const fx = Math.sin(P.h), fz = Math.cos(P.h);
      const alongX = Math.abs(fx) > Math.abs(fz);
      const dir = alongX ? Math.sign(fx) : Math.sign(fz);
      let ax = P.x, az = P.z;
      if (alongX) { az = Math.round(P.z / PITCH) * PITCH; ax = P.x + dir * 38; }
      else { ax = Math.round(P.x / PITCH) * PITCH; az = P.z + dir * 38; }
      // park on the right-hand edge of the road
      const side = 4.6;
      if (alongX) az += dir * side; else ax += -dir * side;
      const car = makeCar(0xf5f5f5);
      car.rotation.y = alongX ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      car.position.set(ax, 0, az);
      const door = box(0.15, 1.0, 1.4, mat(0xf5f5f5));
      const hinge = new THREE.Group();
      hinge.position.set(1.1, 0.85, 0.9); // driver side (car's left, local +x) faces the lane
      door.position.set(0, 0, -0.7);
      hinge.add(door); car.add(hinge);
      scene.add(car);
      hazard = { car, hinge, alongX, dir, ax, az, open: 0, t: 0, resolve, done: false };
    });
  };
  function updateHazard(dt) {
    const H = hazard; if (!H || H.done) return;
    H.t += dt;
    const along = H.alongX ? (P.x - H.ax) * H.dir : (P.z - H.az) * H.dir; // negative = before the car
    const dist = Math.hypot(P.x - H.ax, P.z - H.az);
    if (dist < 17 && H.open < 1) H.open = Math.min(1, H.open + dt * 4.5);
    H.hinge.rotation.y = -H.open * 1.25;
    // door + car collision (approx boxes in world)
    const lat = H.alongX ? (P.z - H.az) * -H.dir : (P.x - H.ax) * H.dir; // + = toward lane center
    const hitCar = Math.abs(along) < 2.6 && Math.abs(lat) < 1.6;
    const hitDoor = H.open > 0.4 && along > -1.6 && along < 1.6 && lat > 0.8 && lat < 2.9;
    if (hitCar || hitDoor) { H.done = true; P.v = 0; H.resolve('hit'); setTimeout(clearHazard, 4000); return; }
    if (along > 6 || H.t > 14) { H.done = true; H.resolve('dodge'); setTimeout(clearHazard, 4000); }
  }
  function clearHazard() { if (hazard) { scene.remove(hazard.car); hazard = null; } }

  /* ---------- main loop ---------- */
  let bumpCool = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - clockT) / 1000); clockT = now;
    if (window.__OFFLINE) return; // trailer renders frames manually via W.frame
    // the interior stage updates the shared animation mixers itself when it's showing
    frameW(dt, !!(G.Stage && G.Stage.isVisible && G.Stage.isVisible()));
  }
  /** advance the world by dt and render one frame (also used by the offline trailer renderer) */
  W.frame = (dt, skipAssets) => frameW(dt, skipAssets);
  let animT = 0; // seconds of animated time (drives the beacon/arrow bobbing; works for live and offline frames)
  function frameW(dt, skipAssets) {
    animT += dt;
    const now = animT * 1000;
    if (!paused) step(dt);
    updateCars(dt);
    if (peds.length) updatePeds(dt);
    if (G.Assets && !skipAssets) G.Assets.update(dt);
    updateCamera(dt);
    // shadow camera follows the scooter
    sun.position.set(P.x + 60, 120, P.z + 25);
    sun.target.position.set(P.x, 0, P.z);
    if (rainPts.visible) {
      const a = rainPts.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) - dt * 45; if (y < 0) y += 50; a.setY(i, y);
      }
      a.needsUpdate = true;
      rainPts.position.set(P.x, 0, P.z);
    }
    if (target) {
      beaconRing.rotation.z += dt;
      beacon.material.opacity = 0.2 + Math.sin(now / 300) * 0.08;
      arrow.position.set(P.x, 4.2 + Math.sin(now / 250) * 0.2, P.z);
      arrow.lookAt(target.x, 4.2, target.z);
    }
    renderer.render(scene, camera);
    drawMini();
  }

  function step(dt) {
    const up = keys['w'] || keys['arrowup'], down = keys['s'] || keys['arrowdown'];
    const left = keys['a'] || keys['arrowleft'], right = keys['d'] || keys['arrowright'];
    const brake = keys[' '];
    const maxV = 24 * maxSpeedMul * (W.extraMul || 1);
    if (up) P.v += 16 * dt;
    else if (down) P.v -= (P.v > 0 ? 30 : 8) * dt;
    else P.v *= 1 - 1.1 * dt;
    if (brake) P.v *= 1 - 4 * dt;
    P.v = G.clamp(P.v, -6, maxV);
    if (Math.abs(P.v) < 0.05 && !up && !down) P.v = 0;
    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    const turn = 2.3 * G.clamp(P.v / 8, -1, 1);
    P.h += steer * turn * dt;
    P.lean += ((steer * Math.min(1, Math.abs(P.v) / 15)) * 0.35 - P.lean) * Math.min(1, dt * 8);

    let nx = P.x + Math.sin(P.h) * P.v * dt;
    let nz = P.z + Math.cos(P.h) * P.v * dt;
    // world bounds
    nx = G.clamp(nx, -ROAD / 2 + 1, SIZE + ROAD / 2 - 1);
    nz = G.clamp(nz, -ROAD / 2 + 1, SIZE + ROAD / 2 - 1);
    // building collision
    const R = 1.1;
    bumpCool -= dt;
    for (const s of solids) {
      if (nx > s.minX - R && nx < s.maxX + R && nz > s.minZ - R && nz < s.maxZ + R) {
        const pen = [nx - (s.minX - R), (s.maxX + R) - nx, nz - (s.minZ - R), (s.maxZ + R) - nz];
        const m = Math.min.apply(null, pen), i = pen.indexOf(m);
        if (i === 0) nx = s.minX - R; else if (i === 1) nx = s.maxX + R; else if (i === 2) nz = s.minZ - R; else nz = s.maxZ + R;
        const impact = Math.abs(P.v);
        P.v *= -0.25;
        if (bumpCool <= 0) { bumpCool = 0.8; if (W.onBump) W.onBump('wall', impact); }
      }
    }
    // car collision
    for (const c of cars) {
      const p = carPos(c);
      const hw = c.alongX ? 2.4 : 1.2, hd = c.alongX ? 1.2 : 2.4;
      if (Math.abs(nx - p.x) < hw + 0.8 && Math.abs(nz - p.z) < hd + 0.8) {
        // relative velocity between scooter and car
        const pvx = Math.sin(P.h) * P.v, pvz = Math.cos(P.h) * P.v;
        const cvx = c.alongX ? c.dir * c.cur : 0, cvz = c.alongX ? 0 : c.dir * c.cur;
        const impact = Math.hypot(pvx - cvx, pvz - cvz);
        // push the scooter away from car center
        const dx = nx - p.x, dz = nz - p.z, L = Math.hypot(dx, dz) || 1;
        nx = p.x + (dx / L) * (Math.max(hw, hd) + 1.2);
        nz = p.z + (dz / L) * (Math.max(hw, hd) + 1.2);
        P.v *= -0.2;
        c.cur = 0;
        if (bumpCool <= 0) {
          bumpCool = 1.2;
          if (impact > 17 && W.onCrash) W.onCrash('car', impact);
          else if (W.onBump) W.onBump('car', impact);
        }
      }
    }
    P.x = nx; P.z = nz;
    P.mesh.position.set(P.x, 0.3, P.z);
    P.mesh.rotation.set(0, P.h, 0);
    P.mesh.rotateZ(-P.lean);
    P.wheelF.rotation.x += P.v * dt; P.wheelB.rotation.x += P.v * dt;

    updateHazard(dt);
    if (W.onTick) W.onTick(dt);
    if (target && !arrivedLock && Math.hypot(target.x - P.x, target.z - P.z) < 6.5) {
      arrivedLock = true;
      P.v *= 0.2;
      if (W.onArrive) W.onArrive();
    }
  }

  function updateCars(dt) {
    for (const c of cars) {
      const p = carPos(c);
      // slow down if the scooter is right in front in the same lane
      let want = c.speed;
      const ahead = c.alongX ? (P.x - p.x) * c.dir : (P.z - p.z) * c.dir;
      const lat = c.alongX ? Math.abs(P.z - p.z) : Math.abs(P.x - p.x);
      if (ahead > 0 && ahead < 10 && lat < 2.2) want = 0;
      if (hazard && !hazard.done) {
        const ha = c.alongX ? (hazard.ax - p.x) * c.dir : (hazard.az - p.z) * c.dir;
        const hl = c.alongX ? Math.abs(hazard.az - p.z) : Math.abs(hazard.ax - p.x);
        if (ha > 0 && ha < 12 && hl < 2.5) want = 0;
      }
      c.cur += (want - c.cur) * Math.min(1, dt * (want < c.cur ? 5 : 1.2));
      c.t += c.dir * c.cur * dt;
      if (c.t > SIZE + 30) c.t = -30; if (c.t < -30) c.t = SIZE + 30;
      const q = carPos(c);
      c.mesh.position.set(q.x, 0, q.z);
    }
  }

  const camPos = new THREE.Vector3(), look = new THREE.Vector3();
  function updateCamera(dt) {
    if (!camera) return;
    if (W.cine) { W.cine(camera, P, dt); return; } // scripted camera (trailer)
    const fx = Math.sin(P.h), fz = Math.cos(P.h);
    const back = 8.5 + Math.abs(P.v) * 0.12;
    camPos.set(P.x - fx * back, 5.8 + Math.abs(P.v) * 0.05, P.z - fz * back);
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 5));
    look.set(P.x + fx * 5, 1.6, P.z + fz * 5);
    camera.lookAt(look);
  }

  function drawMini() {
    if (!miniCtx) return;
    const c = miniCtx, S = mini.width, sc = S / (SIZE + ROAD * 2), o = ROAD;
    c.fillStyle = '#5d8a4e'; c.fillRect(0, 0, S, S);
    c.fillStyle = '#4a4a52';
    for (let i = 0; i <= N; i++) {
      c.fillRect(0, (i * PITCH - ROAD / 2 + o) * sc, S, ROAD * sc);
      c.fillRect((i * PITCH - ROAD / 2 + o) * sc, 0, ROAD * sc, S);
    }
    c.fillStyle = '#d9cfbf';
    for (const s of solids) c.fillRect((s.minX + o) * sc, (s.minZ + o) * sc, (s.maxX - s.minX) * sc, (s.maxZ - s.minZ) * sc);
    const h = W.locs.home;
    if (h) { c.fillStyle = '#5dade2'; c.fillRect((h.x + o) * sc - 3, (h.z + o) * sc - 3, 6, 6); }
    if (target) {
      c.fillStyle = '#ffd34d'; c.strokeStyle = '#000'; c.lineWidth = 2;
      c.beginPath(); c.arc((target.x + o) * sc, (target.z + o) * sc, 5, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // player triangle
    c.save(); c.translate((P.x + o) * sc, (P.z + o) * sc); c.rotate(-P.h + Math.PI);
    c.fillStyle = '#e8417b'; c.beginPath(); c.moveTo(0, -6); c.lineTo(4.5, 5); c.lineTo(-4.5, 5); c.closePath(); c.fill();
    c.restore();
  }
})(window.G);
