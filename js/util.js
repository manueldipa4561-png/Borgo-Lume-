/* Shared helpers. Classic scripts + one global (BL) so the site opens straight from disk. */
(function (BL) {
  'use strict';

  BL.rng = function (seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  BL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  BL.lerp = (a, b, t) => a + (b - a) * t;
  BL.smoothstep = (a, b, v) => { const t = BL.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  BL.damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

  /* Concatenate geometries into one non-indexed geometry (position/normal/uv/color). */
  BL.merge = function (geos) {
    const parts = geos.map(g => (g.index ? g.toNonIndexed() : g));
    const n = parts.reduce((s, g) => s + g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2), col = new Float32Array(n * 3).fill(1);
    let o = 0;
    for (const g of parts) {
      const a = g.attributes, c = a.position.count;
      pos.set(a.position.array, o * 3); nor.set(a.normal.array, o * 3);
      if (a.uv) uv.set(a.uv.array, o * 2);
      if (a.color) col.set(a.color.array, o * 3);
      o += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return out;
  };

  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
  /* Matrix from position + yaw + scale. */
  BL.mat = function (x, y, z, rotY, sx, sy, sz) {
    _p.set(x, y, z); _q.setFromEuler(_e.set(0, rotY || 0, 0)); _s.set(sx || 1, sy || 1, sz || 1);
    return new THREE.Matrix4().compose(_p, _q, _s);
  };

  /* Paint a flat colour onto every vertex of a geometry. */
  BL.tint = function (geo, color, mult) {
    const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r * (mult || 1); a[i * 3 + 1] = c.g * (mult || 1); a[i * 3 + 2] = c.b * (mult || 1); }
    geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return geo;
  };
})(window.BL = window.BL || {});
