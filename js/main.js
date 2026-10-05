/* Boot, camera rail, chapter-by-chapter travel, day/night, auto-tour, UI.
   URL flags: ?auto[=dwell seconds] (hands-free tour), ?clean (no UI), ?t=1 (start at night), ?p=0.4 (start along the walk). */
(function (BL) {
  'use strict';
  const T = THREE, $ = s => document.querySelector(s), { clamp, damp } = BL;
  const q = new URLSearchParams(location.search);
  const AUTO = q.has('auto'), AUTO_DWELL = Number(q.get('auto')) || 3.2, NIGHT_CHAPTER = 5;
  document.body.classList.toggle('clean', q.has('clean'));
  document.body.classList.toggle('auto', AUTO);

  /* ---- camera rail: p (0..1) -> position + look-at ---- */
  const KF = [
    { p: 0.00, pos: [0, 13, 56],     look: [0, 3.5, 0] },
    { p: 0.08, pos: [0.4, 3.4, 40],  look: [-1.5, 4, 24] },
    { p: 0.17, pos: [1.2, 2.8, 31],  look: [-3.2, 5, 20] },
    { p: 0.29, pos: [-1.2, 2.8, 15], look: [3.2, 5, 4] },
    { p: 0.38, pos: [0, 3, -2],      look: [-6, 4.5, -14] },
    { p: 0.48, pos: [6, 3.6, -12],   look: [-11.5, 4.5, -17] },
    { p: 0.58, pos: [-5, 3.8, -21],  look: [11.5, 4.5, -15] },
    { p: 0.70, pos: [1, 2.6, -27],   look: [-3.4, 5.2, -35] },
    { p: 0.81, pos: [-1, 2.5, -33],  look: [3.4, 5.2, -40] },
    { p: 1.00, pos: [0.4, 2.0, -43], look: [3, 14, -58] }
  ];
  const mkCurve = k => new T.CatmullRomCurve3(KF.map(f => new T.Vector3(...f[k])), false, 'centripetal');
  const posCurve = mkCurve('pos'), lookCurve = mkCurve('look');
  function curveT(p) {
    for (let i = 0; i < KF.length - 1; i++) if (p <= KF[i + 1].p) return (i + (p - KF[i].p) / (KF[i + 1].p - KF[i].p)) / (KF.length - 1);
    return 1;
  }

  /* ---- chapters: hero, six murals, outro. The page snaps from one to the next. ---- */
  const STOPS = [0, 0.17, 0.29, 0.48, 0.58, 0.70, 0.81, 1.0];
  const CH = [{ mode: 'hero' }, ...BL.murals.map(m => ({ mode: 'mural', m })), { mode: 'outro' }];
  const LAST = CH.length - 1;
  const easeIO = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

  /* ---- text: split into words/letters so lines can slide up out of a mask ---- */
  function splitInto(el, text, letters, start) {
    el.textContent = '';
    (letters ? [...text] : text.split(' ')).forEach((s, i) => {
      const w = document.createElement('span'), n = document.createElement('span');
      w.className = 'w'; n.className = 'wi'; n.style.setProperty('--i', (start || 0) + i); n.textContent = s;
      w.appendChild(n); el.appendChild(w); if (!letters) el.appendChild(document.createTextNode(' '));
    });
  }

  let uiTimer = 0;
  function showChapter(i, delayMs) {
    const c = CH[i], hero = $('#hero'), card = $('#chapter'), outro = $('#outro');
    document.querySelectorAll('#progress i').forEach((d, k) => d.classList.toggle('on', k === i));
    card.classList.remove('in'); if (c.mode !== 'hero') hero.classList.remove('in'); if (c.mode !== 'outro') outro.classList.remove('in');
    document.body.dataset.mode = c.mode; clearTimeout(uiTimer);
    uiTimer = setTimeout(() => {
      if (c.mode === 'hero') hero.classList.add('in');
      else if (c.mode === 'outro') outro.classList.add('in');
      else {
        $('#ch-kicker').textContent = `Mural ${String(i).padStart(2, '0')} / 06`;
        splitInto($('#ch-title'), c.m.title);
        $('#ch-meta').textContent = `${c.m.artist} · ${c.m.year} · ${c.m.w} × ${c.m.h} m`; $('#ch-line').textContent = c.m.line;
        void card.offsetWidth; card.classList.add('in');
      }
    }, delayMs);
  }

  const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  const setCount = n => { $('#count').textContent = String(Math.round(n)).padStart(2, '0'); $('#bar').style.transform = `scaleX(${n / 100})`; };

  async function boot() {
    const t0 = performance.now(); setCount(4); await nextFrame();
    const canvas = $('#gl');
    const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    let dpr = Math.min(devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    const scene = new T.Scene(); scene.fog = new T.Fog('#e8dcc6', 60, 380);
    const camera = new T.PerspectiveCamera(40, 1, 0.5, 1800);

    const sky = BL.createSky(); scene.add(sky.mesh);
    const hills = BL.createHills(); scene.add(hills.group);
    const hemi = new T.HemisphereLight('#bfdcff', '#d2b08c', 1); scene.add(hemi);
    const key = new T.DirectionalLight('#fff2da', 3); key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
    Object.assign(key.shadow.camera, { left: -72, right: 72, top: 72, bottom: -72, near: 10, far: 560 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.05; scene.add(key, key.target);
    setCount(18); await nextFrame();

    const town = BL.buildTown(scene); setCount(50); await nextFrame();
    const props = BL.buildProps(scene, town); setCount(70); await nextFrame();

    /* ---- time of day ---- */
    const tod = BL.createTimeOfDay({ scene, renderer, sky, hemi, key, lamps: props.lamps, hills, town, props });
    let todNow = clamp(Number(q.get('t')) || 0, 0, 1), todFrom = todNow, todTo = todNow, todU = 1, todDirty = true;
    const TOD_SECONDS = 3.2, pill = $('#tod');
    function goNight(on) { todFrom = todNow; todTo = on ? 1 : 0; todU = 0; pill.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    pill.addEventListener('click', () => goNight(todTo < 0.5));
    pill.setAttribute('aria-pressed', todNow > 0.5 ? 'true' : 'false');

    /* ---- chapter travel ---- */
    let idx = 0, p = 0, tween = null, dwellT = 0;
    const startP = q.has('p') ? clamp(Number(q.get('p')) || 0, 0, 1) : 0;
    if (startP > 0) { p = startP; STOPS.forEach((s, i) => { if (Math.abs(s - p) < Math.abs(STOPS[idx] - p)) idx = i; }); }
    function goTo(i, dur) {
      i = clamp(i, 0, LAST); if (i === idx && !tween) return;
      const to = STOPS[i]; dur = dur || 1.5 + Math.abs(to - p) * 5;
      tween = { from: p, to, t: 0, dur, dir: i > idx ? 1 : -1 }; idx = i; dwellT = 0; showChapter(i, dur * 480);
    }
    const step = d => goTo(idx + d);
    $('#replay').addEventListener('click', () => goTo(0, 3.6));

    /* input: wheel / swipe / keys move exactly one chapter */
    let lastWheel = 0, quiet = false;
    addEventListener('wheel', e => {
      if (AUTO) return; const now = performance.now();
      if (tween) { lastWheel = now; return; }
      if (quiet) { if (now - lastWheel > 170) quiet = false; else { lastWheel = now; return; } }
      lastWheel = now; if (Math.abs(e.deltaY) < 5) return;
      quiet = true; step(e.deltaY > 0 ? 1 : -1);
    }, { passive: true });
    let touchY = 0;
    addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchend', e => { const dy = touchY - e.changedTouches[0].clientY; if (!AUTO && !tween && Math.abs(dy) > 38) step(dy > 0 ? 1 : -1); }, { passive: true });
    addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'n' || k === 'N') goNight(todTo < 0.5);
      else if (AUTO) return;
      else if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); step(1); }
      else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); step(-1); }
      else if (k === 'Home') goTo(0); else if (k === 'End') goTo(LAST);
    });
    CH.forEach((_, i) => { const d = document.createElement('i'); d.addEventListener('click', () => !AUTO && goTo(i)); $('#progress').appendChild(d); });
    splitInto($('#hero h1 span'), 'Borgo', true, 0); splitInto($('#hero h1 em'), 'Lume', true, 5);

    /* ---- murals paint in the first time the camera gets close ---- */
    const rev = town.murals.map(() => ({ t: -1 }));
    const PAINT_SECONDS = 2.6;
    function updateReveals(dt, travelU) {
      town.murals.forEach((m, i) => {                       // mural i belongs to chapter i + 1; paint starts once the camera is more than half-way there
        const s = rev[i];
        if (s.t < 0 && ready && i + 1 <= idx && (!tween || travelU > 0.5 || i + 1 < idx)) s.t = 0;
        if (s.t >= 0 && s.t < PAINT_SECONDS) { s.t += dt; m.reveal.value = 1 - Math.pow(1 - clamp(s.t / PAINT_SECONDS, 0, 1), 3); }
      });
    }
    const resetReveals = () => town.murals.forEach((m, i) => { rev[i].t = -1; m.reveal.value = 0; });
    if (startP > 0) town.murals.forEach((m, i) => { rev[i].t = PAINT_SECONDS; m.reveal.value = 1; });

    function resize() {
      const w = innerWidth, h = innerHeight, a = w / h;
      renderer.setSize(w, h, false); camera.aspect = a;
      camera.userData.fov = a >= 1 ? 38 : Math.min(70, 38 + (1 / a - 1) * 34); camera.fov = camera.userData.fov; camera.updateProjectionMatrix();
    }
    addEventListener('resize', resize); resize();

    tod.set(todNow); camera.position.set(0, 13, 56); renderer.compile(scene, camera);
    renderer.render(scene, camera); setCount(88); await nextFrame();
    await Promise.race([Promise.all(BL.artLoads), new Promise(r => setTimeout(r, 5000))]);
    renderer.render(scene, camera); setCount(100);

    let ready = false, introT = startP > 0 ? 1 : 0, nightFired = false;
    setTimeout(() => { ready = true; document.body.classList.add('ready'); showChapter(idx, startP > 0 ? 350 : 1500); }, Math.max(0, 1500 - (performance.now() - t0)));

    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });

    /* adaptive resolution: drop the pixel ratio if frames run long */
    let slow = 0;
    const adapt = dt => {
      slow = dt > 0.024 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 40 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); slow = 0; }
    };

    const look = new T.Vector3(), pos = new T.Vector3(), right = new T.Vector3(1, 0, 0);
    let last = performance.now(), time = 0, fovExtra = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt; adapt(dt);

      /* travel / dwell */
      let u = 0;
      if (tween) {
        tween.t += dt; u = clamp(tween.t / tween.dur, 0, 1); p = tween.from + (tween.to - tween.from) * easeIO(u);
        if (u >= 1) { p = tween.to; tween = null; }
      } else if (ready) {
        dwellT += dt;
        if (idx < LAST) p += dt * 0.0022 * Math.exp(-dwellT * 0.5);         // slow push-in while holding
        if (AUTO) {
          if (idx === NIGHT_CHAPTER && !nightFired && dwellT > 1) { nightFired = true; goNight(true); }
          const hold = AUTO_DWELL + (idx === 0 ? 1.8 : idx === LAST ? 1.4 : 0);
          if (dwellT > hold) {
            if (idx === LAST) { nightFired = false; goNight(false); resetReveals(); goTo(0, 3.4); } else goTo(idx + 1);
          }
        }
      }

      if (todU < 1) { todU = Math.min(1, todU + dt / TOD_SECONDS); todNow = todFrom + (todTo - todFrom) * easeIO(todU); todDirty = true; }
      if (todDirty) { tod.set(todNow); todDirty = false; }

      /* camera */
      const t = curveT(clamp(p, 0, 1));
      posCurve.getPoint(t, pos); lookCurve.getPoint(t, look);
      if (ready && introT < 1) introT = Math.min(1, introT + dt / 3.8);
      const ie = 1 - Math.pow(1 - introT, 3), fromAbove = 1 - ie;
      pos.y += fromAbove * 9; pos.z += fromAbove * 18;
      mouse.sx = damp(mouse.sx, mouse.x, 3, dt); mouse.sy = damp(mouse.sy, mouse.y, 3, dt);
      pos.addScaledVector(right, mouse.sx * 0.35 + Math.sin(time * 0.35) * 0.06); pos.y += -mouse.sy * 0.18 + Math.sin(time * 0.6) * 0.03;
      look.addScaledVector(right, mouse.sx * 0.9); look.y += -mouse.sy * 0.5;
      camera.position.copy(pos); camera.lookAt(look);
      if (tween) camera.rotateZ(Math.sin(u * Math.PI) * 0.018 * tween.dir);
      const extra = (tween ? Math.sin(u * Math.PI) * 4 : 0) + fromAbove * 14;       // gentle dolly-zoom while travelling + opening swoop
      if (Math.abs(extra - fovExtra) > 0.01) { fovExtra = extra; camera.fov = camera.userData.fov + extra; camera.updateProjectionMatrix(); }

      sky.mesh.position.copy(pos); sky.uniforms.uTime.value = time;
      updateReveals(dt, u);
      props.update(time, renderer.domElement.height / (2 * Math.tan(camera.fov * Math.PI / 360)));
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
    window.__bl = { goTo, step, goNight, camera, scene, renderer, town, get idx() { return idx; }, get p() { return p; }, setP: v => { tween = null; p = v; } };
  }

  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve()).then(boot);
})(window.BL = window.BL || {});
