/* Sky dome (gradient, sun, moon, stars, clouds) and the layered hills behind the village. */
(function (BL) {
  'use strict';

  const vert = `
    varying vec3 vDir;
    void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

  const frag = `
    precision highp float;
    varying vec3 vDir;
    uniform vec3 uTop, uHorizon, uSunCol, uSunDir, uMoonDir, uCloud;
    uniform float uNight, uTime;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y, 0.0, 1.0);
      vec3 col = mix(uHorizon, uTop, pow(h, 0.36));
      float sd = max(dot(d, uSunDir), 0.0);
      col += uSunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 40.0) * 0.55 + pow(sd, 6.0) * 0.22);
      if (d.y > 0.0) {
        vec2 cuv = d.xz / (d.y + 0.18) * 0.7 + vec2(uTime * 0.006, 0.0);
        float c = smoothstep(0.6, 0.86, fbm(cuv)) * smoothstep(0.0, 0.22, d.y);
        col = mix(col, uCloud, c * 0.9);
      }
      if (uNight > 0.01 && d.y > 0.0) {
        vec3 sp = d * 160.0; vec3 cell = floor(sp); float rnd = hash3(cell);
        float star = step(0.985, rnd) * smoothstep(0.22, 0.0, length(fract(sp) - 0.5)) * (0.55 + 0.45 * sin(uTime * 2.0 + rnd * 60.0));
        sp = d * 70.0; cell = floor(sp); rnd = hash3(cell + 7.0);
        star += step(0.992, rnd) * smoothstep(0.3, 0.0, length(fract(sp) - 0.5)) * 0.9;
        col += vec3(star) * uNight * smoothstep(0.0, 0.3, d.y);
      }
      float md = dot(d, uMoonDir);
      float disc = smoothstep(0.99855, 0.99875, md);
      vec3 moonCol = vec3(1.0, 0.96, 0.86) * (0.88 + 0.12 * noise(d.xz * 90.0 + d.y * 40.0));
      col = mix(col, moonCol, disc * uNight);
      col += vec3(0.55, 0.65, 1.0) * (pow(max(md, 0.0), 80.0) * 0.5 + pow(max(md, 0.0), 8.0) * 0.08) * uNight;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`;

  BL.createSky = function () {
    const uniforms = {
      uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() },
      uCloud: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(0, 1, 0) }, uNight: { value: 0 }, uTime: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
    mesh.frustumCulled = false; mesh.renderOrder = -10;
    return { mesh, uniforms };
  };

  BL.createHills = function () {
    const group = new THREE.Group(), layers = [];
    const defs = [
      { z: -170, base: 10, amp: 20, seed: 1.3, col: '#7f9a7c' },
      { z: -250, base: 26, amp: 32, seed: 4.1, col: '#93ad9b' },
      { z: -340, base: 44, amp: 46, seed: 7.7, col: '#aac0b2' }
    ];
    defs.forEach(d => {
      const W = 900, shape = new THREE.Shape(); shape.moveTo(-W, -80);
      for (let x = -W; x <= W; x += 12) {
        shape.lineTo(x, d.base + d.amp * (0.55 * Math.sin(x * 0.009 + d.seed) + 0.3 * Math.sin(x * 0.023 + d.seed * 2.1) + 0.15 * Math.sin(x * 0.058 + d.seed * 3.3)));
      }
      shape.lineTo(W, -80);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: d.col, fog: true }));
      mesh.position.z = d.z; group.add(mesh); layers.push({ mesh, base: new THREE.Color(d.col) });
    });
    return { group, layers };
  };
})(window.BL = window.BL || {});
