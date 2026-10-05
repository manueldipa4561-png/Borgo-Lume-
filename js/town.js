/* The village: buildings, facades (instanced windows/shutters/doors), murals, church + campanile, ground. */
(function (BL) {
  'use strict';
  const T = THREE, TILE = 1.4;
  const { smoothstep } = BL;

  BL.LANE = 3.6;          // half-width of the main lane
  BL.PIAZZA = 11.5;       // half-width of the piazza
  BL.PIAZZA_Z = [-9, -23];

  const PLASTER = ['#e9c9a0', '#d99a6c', '#e8d2b4', '#cf8f78', '#e3b36b', '#c97a56', '#efe2c8', '#b9795f', '#dcb58f'];
  const ROOF = ['#b95c3c', '#c4683f', '#a8523a', '#b86a48', '#c0613a'];
  const SHUTTER = ['#5b7f63', '#4d6f8f', '#7a4b3a', '#8a9a6a', '#3f5f58', '#9a6b3c'];
  const DOOR = ['#3f5a46', '#2f4f6d', '#6b2d2d', '#4a3526', '#2b4a4f'];
  const BLOOM = ['#e8517b', '#f29bb5', '#f6f0e0', '#d8392f', '#f6b83a'];
  const WARMS = ['#ffc15e', '#ffc15e', '#ffc15e', '#ffc15e', '#ffd9a0', '#ffb347', '#ffb347', '#ffd9a0', '#ff9fb2', '#a8d8ff'];

  /* Murals "paint in" bottom-up with a noisy brush edge; uReveal 0 -> 1. Unpainted pixels are discarded, showing the plaster wall behind. */
  const REVEAL_PARS = `uniform float uReveal;
    float rvHash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
    float rvNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(rvHash(i), rvHash(i + vec2(1, 0)), f.x), mix(rvHash(i + vec2(0, 1)), rvHash(i + vec2(1, 1)), f.x), f.y); }`;
  const REVEAL_MAIN = `vec2 rvP = vMapUv * vec2(1.0, 1.55);
    float rvN = rvNoise(rvP * vec2(6.0, 4.0)) * 0.5 + rvNoise(rvP * vec2(24.0, 9.0)) * 0.3 + rvNoise(rvP * vec2(110.0, 2.5)) * 0.2;
    float rvM = vMapUv.y * 0.8 + rvN * 0.4, rvK = uReveal * 1.35;
    if (rvM >= rvK) discard;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.95, 0.82), smoothstep(rvK - 0.06, rvK, rvM) * 0.45);`;
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  /* ---------- geometry builders ---------- */
  function body(cx, y0, cz, sx, h, sz, color, bright, ao) {
    const g = new T.BoxGeometry(sx, h, sz), uv = g.attributes.uv, pos = g.attributes.position, n = pos.count;
    const dims = [[sz, h], [sz, h], [sx, sz], [sx, sz], [sx, h], [sx, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 4, uv.getY(i) * dims[f][1] / 4);
    }
    const c = new T.Color(color), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const s = (ao === false ? 1 : 0.72 + 0.28 * smoothstep(0, 2.6, pos.getY(i) + h / 2)) * bright;
      col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.translate(cx, y0 + h / 2, cz);
    return g;
  }

  function hipRoof(cx, y, cz, wx, wz, rise, color) {
    const a = wx / 2, b = wz / 2, r = Math.min(a, b), alongX = a >= b;
    const c1 = [-a, 0, -b], c2 = [a, 0, -b], c3 = [a, 0, b], c4 = [-a, 0, b];
    const rp1 = alongX ? [-(a - r), rise, 0] : [0, rise, -(b - r)];
    const rp2 = alongX ? [(a - r), rise, 0] : [0, rise, (b - r)];
    const faces = alongX
      ? [[c4, c3, rp2, rp1], [c2, c1, rp1, rp2], [c3, c2, rp2], [c1, c4, rp1]]
      : [[c3, c2, rp1, rp2], [c1, c4, rp2, rp1], [c4, c3, rp2], [c2, c1, rp1]];
    const P = [], N = [], U = [], C = [], col = new T.Color(color);
    faces.forEach(face => {
      const p0 = new T.Vector3(...face[0]), p1 = new T.Vector3(...face[1]), p2 = new T.Vector3(...face[2]);
      const nrm = new T.Vector3().crossVectors(p1.clone().sub(p0), p2.clone().sub(p0)).normalize();
      const e = p1.clone().sub(p0).normalize(), s = new T.Vector3().crossVectors(nrm, e);
      (face.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]).forEach(k => {
        const p = new T.Vector3(...face[k]), d = p.clone().sub(p0);
        P.push(p.x + cx, p.y + y, p.z + cz); N.push(nrm.x, nrm.y, nrm.z); U.push(d.dot(e) / TILE, d.dot(s) / TILE);
        C.push(col.r, col.g, col.b);
      });
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
    return g;
  }

  BL.archGeo = function (hw, hh) {
    const sh = new T.Shape();
    sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, hh - hw); sh.absarc(0, hh - hw, hw, 0, Math.PI, false); sh.lineTo(-hw, 0);
    const g = new T.ShapeGeometry(sh, 14), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const k = 0.62 + 0.38 * (pos.getY(i) / hh); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return g;
  };

  /* ---------- the build ---------- */
  BL.buildTown = function (scene) {
    const group = new T.Group(), r = BL.rng(2026);
    const plaster = BL.plasterTexture(), roofTex = BL.roofTexture();
    const bodyMat = new T.MeshStandardMaterial({ map: plaster, bumpMap: plaster, bumpScale: 2.4, vertexColors: true, roughness: 0.95 });
    const roofMat = new T.MeshStandardMaterial({ map: roofTex, bumpMap: roofTex, bumpScale: 1.8, vertexColors: true, roughness: 0.8, side: T.DoubleSide });
    const bodies = [], roofs = [], chimneys = [];
    const inst = { frame: [], glass: [], shutter: [], sill: [], door: [], doorFrame: [], pot: [], plant: [] };

    function addFacade(f) {
      const rotY = Math.atan2(f.nx, f.nz), tx = f.nz, tz = -f.nx;
      const at = (dx, y, dz) => [f.cx + tx * dx + f.nx * dz, y, f.cz + tz * dx + f.nz * dz];
      const floors = Math.max(2, Math.round(f.height / 3.15)), fh = f.height / floors;
      const nW = Math.max(1, Math.floor((f.width - 0.8) / 2.4)), step = f.width / nW;
      const doorCol = f.door ? Math.floor(r() * nW) : -1;
      for (let fl = 0; fl < floors; fl++) for (let i = 0; i < nW; i++) {
        const dx = (i + 0.5) * step - f.width / 2;
        if (fl === 0 && i === doorCol) {
          const k = f.big ? 1.9 : 1, p = at(dx, 0, 0.03), c = new T.Color(pick(r, DOOR));
          inst.doorFrame.push({ m: BL.mat(p[0], p[1], p[2] - 0.0, rotY, 1.35 * k, 1.07 * k, 1) });
          const q = at(dx, 0, 0.06);
          inst.door.push({ m: BL.mat(q[0], q[1], q[2], rotY, k, k, 1), c });
          [-1, 1].forEach(sgn => {
            const pp = at(dx + sgn * (1.05 * k + 0.1), 0.22, 0.4);
            inst.pot.push({ m: BL.mat(pp[0], pp[1], pp[2], 0) });
            inst.plant.push({ m: BL.mat(pp[0], pp[1] + 0.5, pp[2], 0, 1, 1.1, 1), c: new T.Color(r() < 0.5 ? '#3d8a4f' : pick(r, BLOOM)) });
          });
          continue;
        }
        if (fl > 0 && r() < 0.06) continue;
        const yb = fl * fh + (fl === 0 ? 1.0 : 0.85), p = at(dx, yb, 0.045), lit = r() < 0.72;
        inst.frame.push({ m: BL.mat(...at(dx, yb - 0.07, 0.02), rotY, 1.28, 1.08, 1) });
        inst.glass.push({ m: BL.mat(p[0], p[1], p[2], rotY), thr: lit ? 0.5 + r() * 0.42 : 9, pos: at(dx, yb + 0.8, 0.5), c: new T.Color(), warm: new T.Color(pick(r, WARMS)) });
        inst.sill.push({ m: BL.mat(...at(dx, yb - 0.1, 0.12), rotY) });
        if (r() < 0.62) {
          const sc = new T.Color(pick(r, SHUTTER));
          [-1, 1].forEach(sgn => inst.shutter.push({ m: BL.mat(...at(dx + sgn * 0.62, yb + 0.78, 0.06), rotY), c: sc }));
        }
        if (r() < 0.35) [-0.28, 0.28].forEach(o => inst.plant.push({ m: BL.mat(...at(dx + o, yb + 0.07, 0.2), 0, 1, 1, 1), c: new T.Color(pick(r, BLOOM)) }));
      }
    }

    function building(o) {   // o: cx, cz, sx (x extent), sz (z extent), h, color, faces:[{nx,nz,door,mural}]
      const bright = 0.94 + r() * 0.1, rise = Math.min(o.sx, o.sz) / 2 * 0.42 + 0.25;
      bodies.push(body(o.cx, 0, o.cz, o.sx, o.h, o.sz, o.color, bright));
      roofs.push(hipRoof(o.cx, o.h - 0.02, o.cz, o.sx + 0.7, o.sz + 0.7, rise, pick(r, ROOF)));
      if (r() < 0.45) {
        const chx = o.cx + (r() - 0.5) * o.sx * 0.4, chz = o.cz + (r() - 0.5) * o.sz * 0.4;
        bodies.push(body(chx, o.h - 0.3, chz, 0.8, rise + 1.9, 0.8, '#b98764', 0.95, false));
        chimneys.push([chx, o.h - 0.3 + rise + 1.9, chz]);
      }
      (o.faces || []).forEach(f => {
        const fx = o.cx + f.nx * o.sx / 2, fz = o.cz + f.nz * o.sz / 2, width = f.nx ? o.sz : o.sx;
        if (f.mural) { f.mural.place = { x: fx, z: fz, nx: f.nx, nz: f.nz }; return; }
        addFacade({ cx: fx, cz: fz, nx: f.nx, nz: f.nz, width, height: o.h, door: f.door !== false, big: f.big });
      });
    }

    /* A street row: fills z0 -> z1 with buildings, dropping murals at their exact slots. */
    function row(o) {
      let z = o.z0, first = true;
      const nx = o.side < 0 ? 1 : -1;
      while (z > o.z1 + 0.01) {
        const m = o.ms.find(q => Math.abs(q.z0 - z) < 0.01);
        let w, h, depth = 5.2 + r() * 0.5;
        if (m) { w = m.z0 - m.z1; h = m.spec.h; depth = o.mdepth || 8; }
        else {
          const nxt = o.ms.find(q => q.z0 < z - 0.01), room = z - (nxt ? nxt.z0 : o.z1);
          w = 5.4 + r() * 2.4; if (room - w < 3.4) w = room; w = Math.min(w, room);
          h = (r() < 0.35 ? 4 : 3) * 3.15 + 0.45;
        }
        const last = z - w <= o.z1 + 0.01, jit = m ? 0 : (r() - 0.5) * 0.4;
        const faces = [{ nx, nz: 0, mural: m || null }];
        if (first && o.faceStart) { depth = 8; faces.push({ nx: 0, nz: 1 }); }
        if (last && o.faceEnd) { depth = 8; faces.push({ nx: 0, nz: -1 }); }
        const xf = o.xf + jit;
        building({ cx: o.side * (xf + depth / 2), cz: z - w / 2, sx: depth, sz: w, h, color: m ? '#efe2c8' : pick(r, PLASTER), faces });
        z -= w; first = false;
      }
    }

    /* Rows of plain rooftops behind the street frontage. */
    function backRow(side, x0, z0, z1) {
      for (let z = z0; z > z1;) {
        const sz = 6 + r() * 4, sx = 7 + r() * 5;
        building({ cx: side * (x0 + sx / 2), cz: z - sz / 2, sx, sz, h: 8 + r() * 4, color: pick(r, PLASTER) });
        z -= sz;
      }
    }

    /* ---- placements ---- */
    const MP = [
      { id: 'sole', row: 'L1', z0: 24, z1: 18 }, { id: 'onde', row: 'R1', z0: 8, z1: 2 },
      { id: 'mosaico', row: 'L2', z0: -9, z1: -23 }, { id: 'giardino', row: 'R2', z0: -9, z1: -23 },
      { id: 'luna', row: 'L3', z0: -30, z1: -36 }, { id: 'occhio', row: 'R3', z0: -34, z1: -40 }
    ].map(p => ({ ...p, spec: BL.murals.find(s => s.id === p.id) }));
    const ms = k => MP.filter(p => p.row === k);
    const L = BL.LANE, PZ = BL.PIAZZA;

    row({ side: -1, z0: 46, z1: -9, xf: L, ms: ms('L1'), faceEnd: true });
    row({ side: 1, z0: 46, z1: -9, xf: L, ms: ms('R1'), faceEnd: true });
    row({ side: -1, z0: -9, z1: -23, xf: PZ, ms: ms('L2'), mdepth: 9 });
    row({ side: 1, z0: -9, z1: -23, xf: PZ, ms: ms('R2'), mdepth: 9 });
    row({ side: -1, z0: -23, z1: -50, xf: 3.4, ms: ms('L3'), faceStart: true });
    row({ side: 1, z0: -23, z1: -50, xf: 3.4, ms: ms('R3'), faceStart: true });
    backRow(-1, L + 5.7, 50, -9); backRow(1, L + 5.7, 50, -9);
    backRow(-1, PZ + 9.5, -9, -23); backRow(1, PZ + 9.5, -9, -23);
    backRow(-1, 9.3, -23, -50); backRow(1, 9.3, -23, -50);

    /* ---- church + campanile at the end of the lane ---- */
    building({ cx: 8.5, cz: -56, sx: 10, sz: 12, h: 12.5, color: '#efe2c8', faces: [{ nx: -1, nz: 0, big: true }] });
    const tx = 2.4, tz = -60, shaft = 22;
    bodies.push(body(tx, 0, tz, 4.4, shaft, 4.4, '#e6d2ae', 1));
    bodies.push(body(tx, shaft, tz, 3.8, 5, 3.8, '#e0c9a2', 1, false));
    addFacade({ cx: tx, cz: tz + 2.2, nx: 0, nz: 1, width: 4.4, height: shaft - 5, door: false });
    addFacade({ cx: tx - 2.2, cz: tz, nx: -1, nz: 0, width: 4.4, height: shaft - 5, door: false });
    const cone = new T.ConeGeometry(3.05, 4.6, 4, 1); cone.rotateY(Math.PI / 4);
    const cuv = cone.attributes.uv; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * 8, cuv.getY(i) * 3.9);
    BL.tint(cone, '#b95c3c'); cone.translate(tx, shaft + 5 + 2.3, tz);
    roofs.push(cone.index ? cone.toNonIndexed() : cone);
    const arches = [];   // dark belfry openings
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([nx, nz]) => {
      const m = BL.mat(tx + nx * 1.92, shaft + 0.9, tz + nz * 1.92, Math.atan2(nx, nz)); arches.push(m);
    });

    /* ---- the meshes ---- */
    const bodyMesh = new T.Mesh(BL.merge(bodies), bodyMat), roofMesh = new T.Mesh(BL.merge(roofs), roofMat);
    [bodyMesh, roofMesh].forEach(m => { m.castShadow = m.receiveShadow = true; group.add(m); });

    const stone = new T.MeshStandardMaterial({ color: '#efe4cc', roughness: 0.9 });
    const white = (rough, extra) => new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: rough }, extra || {}));
    function instanced(geo, mat, list, shadow) {
      if (!list.length) return null;
      const mesh = new T.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); if (it.c) mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.castShadow = !!shadow;
      group.add(mesh); return mesh;
    }
    const arch = BL.archGeo(0.42, 1.55), doorArch = BL.archGeo(0.55, 2.3);
    instanced(arch, stone, inst.frame);
    const glassMat = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
    const glassMesh = instanced(arch, glassMat, inst.glass);
    instanced(new T.BoxGeometry(0.42, 1.5, 0.05), white(0.8), inst.shutter);
    instanced(new T.BoxGeometry(1.35, 0.12, 0.34), stone, inst.sill, true);
    instanced(doorArch, stone, inst.doorFrame);
    instanced(doorArch, white(0.7), inst.door);
    instanced(new T.CylinderGeometry(0.26, 0.2, 0.46, 10), new T.MeshStandardMaterial({ color: '#b9593a', roughness: 0.9 }), inst.pot);
    instanced(new T.SphereGeometry(0.14, 10, 8), white(0.9), inst.plant);
    const dark = new T.MeshBasicMaterial({ color: '#150f0c' });
    const archMesh = new T.InstancedMesh(BL.archGeo(0.75, 2.8), dark, arches.length);
    arches.forEach((m, i) => archMesh.setMatrixAt(i, m)); archMesh.frustumCulled = false; group.add(archMesh);

    /* ---- clock faces ---- */
    const clockTex = BL.clockTexture();
    const clockMat = new T.MeshStandardMaterial({ map: clockTex, emissiveMap: clockTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6, transparent: true, alphaTest: 0.4 });
    [[0, 1], [-1, 0]].forEach(([nx, nz]) => {
      const m = new T.Mesh(new T.PlaneGeometry(2.3, 2.3), clockMat);
      m.position.set(tx + nx * 2.23, shaft - 2.6, tz + nz * 2.23); m.rotation.y = Math.atan2(nx, nz); group.add(m);
    });

    /* ---- murals ---- */
    const muralMats = [];
    MP.forEach((p, i) => {
      const tex = BL.muralTexture(p.spec, 100 + i);
      const mat = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.92 });
      p.reveal = { value: 0 };
      mat.onBeforeCompile = sh => {
        sh.uniforms.uReveal = p.reveal;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + REVEAL_PARS)
          .replace('#include <map_fragment>', '#include <map_fragment>\n' + REVEAL_MAIN);
      };
      mat.customProgramCacheKey = () => 'mural-reveal';
      const mesh = new T.Mesh(new T.PlaneGeometry(p.spec.w, p.spec.h), mat), pl = p.place;
      mesh.position.set(pl.x + pl.nx * 0.03, p.spec.h / 2, pl.z + pl.nz * 0.03); mesh.rotation.y = Math.atan2(pl.nx, pl.nz);
      mesh.receiveShadow = true; group.add(mesh);
      muralMats.push({ mat, glow: p.spec.glow }); p.mesh = mesh;
    });

    /* ---- ground ---- */
    const cob = BL.cobbleTexture(); cob.repeat.set(26 / 4, 130 / 4);
    const street = new T.Mesh(new T.PlaneGeometry(26, 130), new T.MeshStandardMaterial({ map: cob, bumpMap: cob, bumpScale: 2, roughness: 0.92 }));
    street.rotation.x = -Math.PI / 2; street.position.set(0, 0, -8); street.receiveShadow = true; group.add(street);
    const field = new T.Mesh(new T.CircleGeometry(800, 48), new T.MeshStandardMaterial({ color: '#b9a984', roughness: 1 }));
    field.rotation.x = -Math.PI / 2; field.position.y = -0.05; field.receiveShadow = true; group.add(field);

    /* ---- window glow (additive sprites) ---- */
    const lit = inst.glass.map((w, i) => ({ w, i })).filter(o => o.w.thr < 9);
    const gp = new Float32Array(lit.length * 3), gc = new Float32Array(lit.length * 3);
    lit.forEach((o, k) => gp.set(o.w.pos, k * 3));
    const glowGeo = new T.BufferGeometry();
    glowGeo.setAttribute('position', new T.BufferAttribute(gp, 3));
    const glowAttr = new T.BufferAttribute(gc, 3); glowGeo.setAttribute('color', glowAttr);
    const glow = new T.Points(glowGeo, new T.PointsMaterial({
      map: BL.glowTexture(), size: 3.2, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false
    }));
    glow.frustumCulled = false; group.add(glow);

    /* ---- time of day for windows / glow / murals ---- */
    const dayGlass = new T.Color('#51657a'), nightDark = new T.Color('#090e18');
    const base = new T.Color(), tmp = new T.Color();
    function setTod(t) {
      base.copy(dayGlass).lerp(nightDark, smoothstep(0.5, 0.82, t));
      inst.glass.forEach((w, i) => { tmp.copy(base).lerp(w.warm, smoothstep(w.thr, w.thr + 0.07, t)); glassMesh.setColorAt(i, tmp); });
      glassMesh.instanceColor.needsUpdate = true;
      lit.forEach((o, k) => {
        const s = smoothstep(o.w.thr, o.w.thr + 0.07, t) * 0.42, w = o.w.warm;
        gc[k * 3] = w.r * s; gc[k * 3 + 1] = w.g * s; gc[k * 3 + 2] = w.b * s;
      });
      glowAttr.needsUpdate = true;
      const e = smoothstep(0.5, 0.9, t);
      muralMats.forEach(m => { m.mat.emissiveIntensity = m.glow * e; });
      clockMat.emissiveIntensity = 1.4 * e;
    }

    scene.add(group);
    return { group, murals: MP, setTod, chimneys };
  };
})(window.BL = window.BL || {});
