/* 外送人生 — 3D asset loader for Kenney CC0 kits (GLB), with cloning, fitting, animation and portrait snapshots */
(function (G) {
  const A = (G.Assets = { ready: false, cache: {}, mixers: [] });
  const BASE = 'assets/3d/';

  /* models used by the game, by kit */
  A.LIST = {
    'city-kit-commercial': ['building-a', 'building-b', 'building-c', 'building-d', 'building-e', 'building-f', 'building-g', 'building-h', 'building-i', 'building-j', 'building-k', 'building-l', 'building-m', 'building-n', 'building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e', 'detail-awning', 'detail-parasol-a', 'detail-parasol-b', 'detail-awning-wide', 'low-detail-building-a', 'low-detail-building-c', 'low-detail-building-e', 'low-detail-building-g', 'low-detail-building-wide-a'],
    'city-kit-suburban': ['building-type-a', 'building-type-c', 'building-type-e', 'building-type-g', 'building-type-k', 'building-type-m', 'tree-large', 'tree-small', 'planter', 'fence', 'fence-1x3', 'fence-low'],
    'city-kit-roads': ['light-square', 'light-curved', 'traffic-light', 'construction-cone', 'dumpster', 'road-sign-stop', 'electricity-pole'],
    'car-kit': ['taxi', 'sedan', 'suv', 'van', 'police', 'ambulance', 'delivery', 'truck', 'garbage-truck', 'hatchback-sports', 'sedan-sports', 'suv-luxury'],
    'mini-characters': ['character-male-a', 'character-male-b', 'character-male-c', 'character-male-d', 'character-male-e', 'character-male-f', 'character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-female-e', 'character-female-f', 'character-worker'],
    'furniture-kit': ['loungeSofa', 'tableCoffee', 'televisionModern', 'cabinetTelevision', 'rugRectangle', 'pottedPlant', 'bookcaseOpen', 'lampRoundFloor', 'desk', 'chairDesk', 'chair', 'table', 'kitchenFridge', 'kitchenCabinet', 'bedSingle', 'computerScreen', 'laptop', 'books', 'plantSmall1', 'bench', 'trashcan', 'wall', 'wallWindow', 'wallDoorway', 'floorFull', 'coatRackStanding', 'sideTable', 'radio', 'kitchenBar', 'kitchenBarEnd', 'stoolBar', 'kitchenFridgeLarge', 'kitchenBlender', 'kitchenCoffeeMachine', 'tableRound', 'cardboardBoxClosed', 'benchCushion'],
    'food-kit': ['cup-tea', 'soda', 'burger', 'pizza', 'cake-birthday', 'bag', 'fries-empty', 'bowl-soup', 'watermelon', 'ice-cream', 'skewer', 'corn-dog', 'apple', 'banana', 'carton', 'soda-can', 'dim-sum', 'chinese', 'frappe', 'popsicle', 'cup-coffee', 'bread', 'fish', 'pot-stew', 'bowl-broth', 'rice-ball'],
  };

  A.load = function (onProgress) {
    if (A._promise) return A._promise;
    if (!window.THREE || !THREE.GLTFLoader) return (A._promise = Promise.resolve(false));
    const loader = new THREE.GLTFLoader();
    const jobs = [];
    for (const kit in A.LIST) for (const name of A.LIST[kit]) jobs.push({ kit, name });
    let done = 0;
    A._promise = Promise.all(jobs.map((j) => new Promise((res) => {
      loader.load(BASE + j.kit + '/' + j.name + '.glb', (gltf) => {
        const root = gltf.scene;
        root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const box = new THREE.Box3().setFromObject(root);
        A.cache[j.name] = { scene: root, anims: gltf.animations || [], box, size: box.getSize(new THREE.Vector3()) };
        done++; if (onProgress) onProgress(done / jobs.length);
        res();
      }, undefined, () => { done++; if (onProgress) onProgress(done / jobs.length); console.warn('model failed', j.name); res(); });
    }))).then(() => { A.ready = true; return true; });
    return A._promise;
  };
  A.has = (name) => !!A.cache[name];

  /** Clone a model. Skinned characters are deep-cloned with SkeletonUtils. */
  A.clone = function (name) {
    const c = A.cache[name];
    if (!c) return null;
    const skinned = c.anims.length > 0;
    const obj = skinned && THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(c.scene) : c.scene.clone(true);
    obj.userData.model = name;
    return obj;
  };

  /**
   * Clone + scale + place. opts: { width, depth, height, length, x, y, z, rot }
   * width/depth: fit footprint (uniform scale), height: fit height, length: fit longest horizontal side
   */
  A.place = function (name, opts) {
    const c = A.cache[name];
    if (!c) return null;
    const o = A.clone(name);
    const sx = c.size.x || 1, sy = c.size.y || 1, sz = c.size.z || 1;
    let s = opts.scale || 1;
    if (opts.width && opts.depth) s = Math.min(opts.width / sx, opts.depth / sz);
    else if (opts.width) s = opts.width / sx;
    else if (opts.height) s = opts.height / sy;
    else if (opts.length) s = opts.length / Math.max(sx, sz);
    o.scale.setScalar(s);
    // center footprint on (x, z) and put the base on the ground
    const cx = (c.box.min.x + c.box.max.x) / 2, cz = (c.box.min.z + c.box.max.z) / 2;
    const inner = new THREE.Group();
    o.position.set(-cx * s, -c.box.min.y * s, -cz * s);
    inner.add(o);
    inner.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    inner.rotation.y = opts.rot || 0;
    inner.userData.model = name;
    inner.userData.inner = o;
    inner.userData.scale = s;
    return inner;
  };

  /** Play an animation clip on a placed/cloned character. Returns {mixer, play(name)} */
  A.animate = function (obj, clip, opts) {
    const inner = obj.userData.inner || obj;
    const c = A.cache[inner.userData.model || obj.userData.model];
    if (!c || !c.anims.length) return null;
    let ctl = obj.userData.anim;
    if (!ctl) {
      const mixer = new THREE.AnimationMixer(inner);
      ctl = obj.userData.anim = { mixer, current: null, name: null };
      A.mixers.push(mixer);
    }
    A.play(obj, clip, opts);
    return ctl;
  };
  A.play = function (obj, clip, opts) {
    opts = opts || {};
    const ctl = obj.userData.anim;
    const inner = obj.userData.inner || obj;
    const c = A.cache[inner.userData.model || obj.userData.model];
    if (!ctl || !c) return;
    if (ctl.name === clip && !opts.restart) return;
    const ac = c.anims.find((a) => a.name === clip);
    if (!ac) return;
    const action = ctl.mixer.clipAction(ac);
    action.reset();
    action.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat);
    action.clampWhenFinished = !!opts.once;
    action.timeScale = opts.speed || 1;
    if (ctl.current && ctl.current !== action) { action.crossFadeFrom(ctl.current, 0.2, false); }
    action.play();
    ctl.current = action; ctl.name = clip;
  };
  A.update = function (dt) { for (const m of A.mixers) m.update(dt); };
  A.dispose = function (obj) {
    const ctl = obj && obj.userData.anim;
    if (ctl) { const i = A.mixers.indexOf(ctl.mixer); if (i >= 0) A.mixers.splice(i, 1); }
  };

  /* ---------- character portraits (rendered once, cached as dataURL) ---------- */
  let pr = null;
  const portraitCache = {};
  A.portrait = function (name, bg) {
    const key = name + '|' + (bg || '');
    if (portraitCache[key]) return portraitCache[key];
    if (!A.cache[name]) return null;
    if (!pr) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.outputEncoding = THREE.sRGBEncoding;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
      const d = new THREE.DirectionalLight(0xffffff, 0.9); d.position.set(1, 2, 3); scene.add(d);
      const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
      pr = { renderer, scene, cam };
    }
    pr.scene.background = new THREE.Color(bg || '#f4efe6');
    const o = A.place(name, { height: 1.8 });
    pr.scene.add(o);
    // pose: idle first frame
    const c = A.cache[name];
    const idle = c.anims.find((a) => a.name === 'idle');
    let mixer = null;
    if (idle) { mixer = new THREE.AnimationMixer(o.userData.inner); mixer.clipAction(idle).play(); mixer.update(0.3); }
    pr.cam.position.set(0, 1.45, 3.1);
    pr.cam.lookAt(0, 1.25, 0);
    pr.renderer.render(pr.scene, pr.cam);
    const url = pr.renderer.domElement.toDataURL('image/png');
    pr.scene.remove(o);
    portraitCache[key] = url;
    return url;
  };
})(window.G);
