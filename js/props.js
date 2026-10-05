/* Props: lanterns + lamp lights, festoon bulbs, washing lines, fountain, trees, benches, parasols, birds, fireflies. */
(function (BL) {
  'use strict';
  const T = THREE, { smoothstep } = BL, TAU = Math.PI * 2;
  const COLORS = ['#ef6b4b', '#f6ead3', '#1f8f8a', '#f6b83a', '#8b7fd6', '#f2a1b8', '#1d3f9e'];

  function additivePoints(count, size, tex, fog) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new T.BufferAttribute(new Float32Array(count * 3), 3));
    const pts = new T.Points(geo, new T.PointsMaterial({
      map: tex, size, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: !!fog
    }));
    pts.frustumCulled = false; return pts;
  }

  BL.buildProps = function (scene, town) {
    const group = new T.Group(), r = BL.rng(77), glowTex = BL.glowTexture();
    const stone = new T.MeshStandardMaterial({ color: '#e3d6ba', roughness: 0.9 });
    const iron = new T.MeshStandardMaterial({ color: '#2b2622', roughness: 0.6 });
    const add = (mesh, shadow) => { mesh.castShadow = !!shadow; mesh.receiveShadow = true; group.add(mesh); return mesh; };
    const inst = (geo, mat, mats, colors) => {
      const m = new T.InstancedMesh(geo, mat, mats.length);
      mats.forEach((mx, i) => { m.setMatrixAt(i, mx); if (colors) m.setColorAt(i, new T.Color(colors[i])); });
      m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
    };

    /* ---- lanterns (wall brackets + piazza posts) with real point lights ---- */
    const SPOTS = [[3.3, 3.6, 36, -1], [-3.3, 3.6, 15, 1], [3.3, 3.6, -3, -1], [-9.4, 4.2, -10.4, 0], [9.4, 4.2, -21.6, 0], [-3.1, 3.6, -27, 1], [3.1, 3.6, -46, -1]];
    const lamps = [], lanternMat = new T.MeshBasicMaterial({ color: '#8a6a3c' });
    SPOTS.forEach(([x, y, z, dir]) => {
      add(new T.Mesh(new T.BoxGeometry(0.2, 0.36, 0.2), lanternMat)).position.set(x, y, z);
      if (dir) add(new T.Mesh(new T.BoxGeometry(0.9, 0.06, 0.06), iron)).position.set(x - dir * 0.45 + dir * 0.0, y + 0.3, z);
      else { const p = add(new T.Mesh(new T.CylinderGeometry(0.07, 0.09, y, 8), iron)); p.position.set(x, y / 2 - 0.1, z); }
      const l = new T.PointLight('#ffb25a', 0, 24, 2); l.position.set(x, y, z); scene.add(l); lamps.push(l);
    });
    const lampGlow = additivePoints(SPOTS.length, 5, glowTex);
    SPOTS.forEach((s, i) => lampGlow.geometry.attributes.position.setXYZ(i, s[0], s[1], s[2]));
    group.add(lampGlow);

    /* ---- festoon strings, washing lines ---- */
    const cable = [], bulbs = [], bulbThr = [];
    function string(z, half, y, sag, spacing) {
      const N = 14; let prev = null;
      for (let i = 0; i <= N; i++) {
        const u = i / N, p = [-half + 2 * half * u, y - sag * (1 - Math.pow(2 * u - 1, 2)), z];
        if (prev) cable.push(...prev, ...p); prev = p;
      }
      const n = Math.max(2, Math.round(2 * half / spacing));
      for (let i = 1; i < n; i++) {
        const u = i / n; bulbs.push([-half + 2 * half * u, y - sag * (1 - Math.pow(2 * u - 1, 2)) - 0.1, z]); bulbThr.push(0.5 + r() * 0.12);
      }
    }
    [40, 32, 24, 16, 8, 0, -6, -26, -32, -38, -44].forEach(z => string(z, 3.5, 6.7, 0.5, 0.9));
    [-12, -16, -20].forEach(z => string(z, 11.4, 7.4, 1.7, 1.0));
    const lines = [[29, 5.2], [-39, 5.6]], cloths = [];
    lines.forEach(([z, y]) => {
      const half = 3.5, sag = 0.25; let prev = null;
      for (let i = 0; i <= 8; i++) { const u = i / 8, p = [-half + 2 * half * u, y - sag * (1 - Math.pow(2 * u - 1, 2)), z]; if (prev) cable.push(...prev, ...p); prev = p; }
      for (let i = 0; i < 8; i++) { const u = (i + 0.7) / 8.4; cloths.push([-half + 2 * half * u, y - 0.45 - sag * (1 - Math.pow(2 * u - 1, 2)), z, COLORS[Math.floor(r() * COLORS.length)]]); }
    });
    const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(cable, 3));
    group.add(new T.LineSegments(cg, new T.LineBasicMaterial({ color: '#2b2723' })));
    const clothMesh = new T.InstancedMesh(new T.PlaneGeometry(0.55, 0.8), new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide, roughness: 0.95 }), cloths.length);
    const clothBase = cloths.map(c => ({ x: c[0], top: c[1] + 0.4, z: c[2], yaw: r() * 0.5 - 0.25, ph: r() * TAU }));
    cloths.forEach((c, i) => { clothMesh.setMatrixAt(i, BL.mat(c[0], c[1], c[2], clothBase[i].yaw)); clothMesh.setColorAt(i, new T.Color(c[3])); });
    clothMesh.frustumCulled = false; group.add(clothMesh);
    const _cm = new T.Matrix4(), _cq = new T.Quaternion(), _ce = new T.Euler(), _cp = new T.Vector3(), _cs = new T.Vector3(1, 1, 1);
    const bulbMat = new T.MeshBasicMaterial({ color: '#e8dcc0' });
    const bulbMesh = new T.InstancedMesh(new T.SphereGeometry(0.075, 8, 6), bulbMat, bulbs.length);
    bulbs.forEach((b, i) => bulbMesh.setMatrixAt(i, BL.mat(b[0], b[1], b[2]))); bulbMesh.frustumCulled = false; group.add(bulbMesh);
    const bulbGlow = additivePoints(bulbs.length, 1.5, glowTex);
    bulbs.forEach((b, i) => bulbGlow.geometry.attributes.position.setXYZ(i, b[0], b[1], b[2])); group.add(bulbGlow);

    /* ---- piazza: inlay, fountain, benches, parasols, pines ---- */
    const inlay = new T.Mesh(new T.CircleGeometry(6.6, 64), new T.MeshStandardMaterial({ map: BL.piazzaTexture(), roughness: 0.9 }));
    inlay.rotation.x = -Math.PI / 2; inlay.position.set(0, 0.012, -16); inlay.receiveShadow = true; group.add(inlay);
    const FZ = -16;
    add(new T.Mesh(new T.CylinderGeometry(2.6, 2.8, 0.7, 40), stone), true).position.set(0, 0.35, FZ);
    const water = new T.MeshStandardMaterial({ color: '#5fb0c8', roughness: 0.12, metalness: 0.1 });
    add(new T.Mesh(new T.CylinderGeometry(2.35, 2.35, 0.05, 40), water)).position.set(0, 0.64, FZ);
    add(new T.Mesh(new T.CylinderGeometry(0.28, 0.4, 1.9, 16), stone), true).position.set(0, 1.55, FZ);
    add(new T.Mesh(new T.CylinderGeometry(1.15, 0.9, 0.28, 32), stone), true).position.set(0, 2.55, FZ);
    add(new T.Mesh(new T.CylinderGeometry(0.95, 0.95, 0.04, 32), water)).position.set(0, 2.7, FZ);
    add(new T.Mesh(new T.SphereGeometry(0.3, 14, 10), stone)).position.set(0, 3.0, FZ);
    const N_WATER = 150, waterGeo = new T.BufferGeometry();
    waterGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(N_WATER * 3), 3));
    const jets = new T.Points(waterGeo, new T.PointsMaterial({ map: glowTex, size: 0.24, color: '#e8f6ff', transparent: true, depthWrite: false }));
    jets.frustumCulled = false; group.add(jets);
    const seeds = Array.from({ length: N_WATER }, (_, i) => ({ a: i * 2.399, rv: i % 5 < 2 ? 0.05 + r() * 0.12 : 0.5 + r() * 0.7, vy: i % 5 < 2 ? 5.2 + r() * 0.8 : 3.6 + r() * 0.9 }));

    const benchPos = [[-6.8, -12.2, Math.PI / 2], [6.8, -12.2, -Math.PI / 2], [-6.8, -19.8, Math.PI / 2], [6.8, -19.8, -Math.PI / 2]];
    inst(new T.BoxGeometry(0.55, 0.5, 1.8), stone, benchPos.map(b => BL.mat(b[0], 0.25, b[1], 0)));
    inst(new T.BoxGeometry(0.7, 0.09, 1.95), stone, benchPos.map(b => BL.mat(b[0], 0.55, b[1], 0)));

    const tables = [[-5.5, -11.2], [5.8, -12.4], [4.8, -20.6], [-4.3, -21]], tc = ['#ef6b4b', '#f6ead3', '#1f8f8a', '#f6b83a'];
    inst(new T.CylinderGeometry(0.04, 0.04, 2.3, 6), iron, tables.map(t => BL.mat(t[0], 1.15, t[1], 0)));
    inst(new T.CylinderGeometry(0.55, 0.55, 0.05, 20), iron, tables.map(t => BL.mat(t[0] + 1.2, 0.75, t[1], 0)));
    inst(new T.CylinderGeometry(0.04, 0.04, 0.75, 6), iron, tables.map(t => BL.mat(t[0] + 1.2, 0.37, t[1], 0)));
    inst(new T.ConeGeometry(1.5, 0.55, 14), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), tables.map(t => BL.mat(t[0], 2.45, t[1], 0)), tc);

    const bays = [[-8.4, -12.2], [8.4, -12.2], [-8.4, -19.8], [8.4, -19.8]], green = new T.MeshStandardMaterial({ color: '#5f8f4c', roughness: 0.95 });
    inst(new T.CylinderGeometry(0.08, 0.11, 1.5, 8), new T.MeshStandardMaterial({ color: '#5a4636', roughness: 1 }), bays.map(p => BL.mat(p[0], 0.75, p[1], 0)));
    inst(new T.SphereGeometry(0.95, 16, 12), green, bays.map(p => BL.mat(p[0], 2.3, p[1], 0)));
    inst(new T.CylinderGeometry(0.34, 0.26, 0.5, 12), new T.MeshStandardMaterial({ color: '#b9593a', roughness: 0.9 }), bays.map(p => BL.mat(p[0], 0.25, p[1], 0)));

    /* ---- cypresses (piazza corners, terrace, hills) + terrace parapet ---- */
    const cy = [[-10.6, -9.8], [10.6, -9.8], [-10.6, -22.2], [10.6, -22.2], [-6, -55], [-4.3, -58.5], [-7.5, -52.5], [-5.2, -63], [9.5, -64]];
    for (let i = 0; i < 34; i++) cy.push([(r() < 0.5 ? -1 : 1) * (18 + r() * 52), -62 - r() * 70]);
    const cyMats = cy.map(c => { const s = 0.85 + r() * 0.55; return BL.mat(c[0], 3.3 * s, c[1], 0, 0.8 * s, 3.5 * s, 0.8 * s); });
    inst(new T.SphereGeometry(1, 12, 10), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), cyMats, cy.map(() => (r() < 0.5 ? '#3d6642' : '#4a7a4c')));
    add(new T.Mesh(new T.BoxGeometry(0.5, 1.1, 12), stone), true).position.set(-3.65, 0.55, -56);
    add(new T.Mesh(new T.BoxGeometry(0.8, 0.12, 12.2), stone)).position.set(-3.65, 1.16, -56);

    /* ---- birds + fireflies ---- */
    const bc = BL.canvas(64, 64), bg = bc.getContext('2d');
    bg.strokeStyle = '#1b1b26'; bg.lineWidth = 6; bg.lineCap = 'round'; bg.beginPath(); bg.moveTo(8, 22); bg.quadraticCurveTo(22, 14, 32, 34); bg.quadraticCurveTo(42, 14, 56, 22); bg.stroke();
    const N_BIRD = 26, birdGeo = new T.BufferGeometry();
    birdGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(N_BIRD * 3), 3));
    const birds = new T.Points(birdGeo, new T.PointsMaterial({ map: BL.canvasTexture(bc, false), size: 1.3, transparent: true, depthWrite: false }));
    birds.frustumCulled = false; group.add(birds);
    const bs = Array.from({ length: N_BIRD }, () => ({ rad: 12 + r() * 16, sp: 0.18 + r() * 0.16, ph: r() * TAU, h: 26 + r() * 10, bob: r() * TAU }));
    const N_FLY = 80, flies = additivePoints(N_FLY, 0.9, glowTex), fs = Array.from({ length: N_FLY }, () => ({ x: (r() - 0.5) * 18, y: 0.6 + r() * 3.2, z: 40 - r() * 88, ph: r() * TAU, sp: 0.4 + r() * 0.5 }));
    group.add(flies);

    /* ---- dust motes in the light + chimney smoke ---- */
    const N_DUST = 160, dust = additivePoints(N_DUST, 0.1, glowTex), dg = dust.geometry.attributes.color;
    const ds = Array.from({ length: N_DUST }, () => ({ x: (r() - 0.5) * 8, y: 1 + r() * 7, z: 44 - r() * 92, ph: r() * TAU, sp: 0.1 + r() * 0.25 }));
    group.add(dust);
    const chim = (town && town.chimneys) || [], PER = 4, N_SMOKE = chim.length * PER;
    const smokeGeo = new T.BufferGeometry();
    smokeGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(N_SMOKE * 3), 3));
    smokeGeo.setAttribute('aA', new T.BufferAttribute(new Float32Array(N_SMOKE), 1));
    smokeGeo.setAttribute('aS', new T.BufferAttribute(new Float32Array(N_SMOKE), 1));
    const smokeMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTex: { value: glowTex }, uCol: { value: new T.Color('#d8d2c8') }, uScale: { value: 500 } },
      vertexShader: 'attribute float aA; attribute float aS; varying float vA; uniform float uScale; void main() { vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uScale / -mv.z; }',
      fragmentShader: 'uniform sampler2D uTex; uniform vec3 uCol; varying float vA;\nvoid main() {\n gl_FragColor = vec4(uCol, texture2D(uTex, gl_PointCoord).a * vA);\n#include <colorspace_fragment>\n}'
    });
    const smoke = new T.Points(smokeGeo, smokeMat); smoke.frustumCulled = false; group.add(smoke);
    const sm = Array.from({ length: N_SMOKE }, (_, i) => ({ c: chim[Math.floor(i / PER)], off: (i % PER) / PER + r() * 0.15, sp: 0.07 + r() * 0.04, w: r() * TAU }));

    /* ---- time of day ---- */
    const lanternOn = new T.Color('#ffb04a'), lanternOff = new T.Color('#8a6a3c'), bulbOn = new T.Color('#fff0c0'), bulbOff = new T.Color('#e8dcc0'), warm = new T.Color('#ff9d45');
    const lg = lampGlow.geometry.attributes.color, bgc = bulbGlow.geometry.attributes.color, fg = flies.geometry.attributes.color;
    let night = 0;
    function setTod(t) {
      night = smoothstep(0.5, 0.85, t);
      lanternMat.color.copy(lanternOff).lerp(lanternOn, night);
      bulbMat.color.copy(bulbOff).lerp(bulbOn, night);
      for (let i = 0; i < SPOTS.length; i++) lg.setXYZ(i, warm.r * night * 0.65, warm.g * night * 0.65, warm.b * night * 0.65);
      for (let i = 0; i < bulbs.length; i++) { const s = smoothstep(bulbThr[i], bulbThr[i] + 0.1, t) * 0.55; bgc.setXYZ(i, warm.r * s, warm.g * s, warm.b * s); }
      for (let i = 0; i < N_FLY; i++) fg.setXYZ(i, 0.55 * night, 0.85 * night, 0.25 * night);
      lg.needsUpdate = bgc.needsUpdate = fg.needsUpdate = true;
      birds.material.opacity = 1 - smoothstep(0.35, 0.65, t);
      const day = 1 - night, dc = 0.4 * day;
      for (let i = 0; i < N_DUST; i++) dg.setXYZ(i, dc, dc * 0.92, dc * 0.7);
      dg.needsUpdate = true;
      smokeMat.uniforms.uCol.value.set(night > 0.5 ? '#6a72a8' : t > 0.3 ? '#e0b9a0' : '#d8d2c8');
    }

    function update(time, viewScale) {
      smokeMat.uniforms.uScale.value = viewScale || 500;
      const sa = smokeGeo.attributes.aA, ss = smokeGeo.attributes.aS, sp = smokeGeo.attributes.position;
      sm.forEach((s, i) => {
        const ph = (time * s.sp + s.off) % 1;
        sp.setXYZ(i, s.c[0] + ph * 2.6 + Math.sin(time * 0.6 + s.w) * 0.25 * ph, s.c[1] + 0.2 + ph * 5, s.c[2] + Math.sin(time * 0.5 + s.w) * 0.3 * ph);
        sa.setX(i, Math.sin(ph * Math.PI) * 0.34); ss.setX(i, 0.5 + ph * 1.6);
      });
      sp.needsUpdate = sa.needsUpdate = ss.needsUpdate = true;
      const dp = dust.geometry.attributes.position;
      ds.forEach((d, i) => dp.setXYZ(i, d.x + Math.sin(time * d.sp + d.ph) * 1.4, d.y + Math.sin(time * d.sp * 1.3 + d.ph) * 0.8, d.z + Math.cos(time * d.sp + d.ph) * 1.2));
      dp.needsUpdate = true;
      clothBase.forEach((c, i) => {
        const a = Math.sin(time * 1.4 + c.ph) * 0.14 + Math.sin(time * 0.6 + c.ph * 2) * 0.06;
        _ce.set(0, c.yaw, a); _cq.setFromEuler(_ce); _cp.set(c.x + Math.sin(a) * 0.4, c.top - Math.cos(a) * 0.4, c.z);
        clothMesh.setMatrixAt(i, _cm.compose(_cp, _cq, _cs));
      });
      clothMesh.instanceMatrix.needsUpdate = true;
      lamps.forEach((l, i) => { if (l.userData.base) l.intensity = l.userData.base * (1 + 0.05 * Math.sin(time * 7 + i * 3) + 0.035 * Math.sin(time * 13.3 + i)); });
      const wp = waterGeo.attributes.position;
      for (let i = 0; i < N_WATER; i++) {
        const s = seeds[i], ph = (time * 0.7 + i / N_WATER) % 1, tt = ph * 1.15;
        wp.setXYZ(i, Math.cos(s.a) * s.rv * tt, 3.1 + s.vy * tt - 4.9 * tt * tt, FZ + Math.sin(s.a) * s.rv * tt);
        if (wp.getY(i) < 2.7 && s.rv < 0.5) wp.setY(i, 2.7);
      }
      wp.needsUpdate = true;
      const bp = birdGeo.attributes.position;
      bs.forEach((b, i) => { const a = time * b.sp + b.ph; bp.setXYZ(i, 2.4 + Math.cos(a) * b.rad, b.h + Math.sin(time * 0.9 + b.bob) * 1.4, -60 + Math.sin(a) * b.rad); });
      bp.needsUpdate = true;
      if (night > 0.02) {
        const fp = flies.geometry.attributes.position;
        fs.forEach((f, i) => fp.setXYZ(i, f.x + Math.sin(time * f.sp + f.ph) * 1.2, f.y + Math.sin(time * f.sp * 1.7 + f.ph) * 0.5, f.z + Math.cos(time * f.sp + f.ph) * 1.2));
        fp.needsUpdate = true;
      }
    }

    scene.add(group);
    return { group, lamps, setTod, update };
  };
})(window.BL = window.BL || {});
