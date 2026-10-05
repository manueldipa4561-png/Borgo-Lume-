/* Time of day: one number (0 = day, 1 = night) drives sky, light, fog, lamps, windows. Passes through golden hour + sunset. */
(function (BL) {
  'use strict';

  const KEYS = [0, 0.4, 0.62, 0.74, 1];                      // day, golden, sunset, blue hour, night
  const col = a => a.map(h => new THREE.Color(h));
  const C = {
    top:     col(['#4f93dd', '#5a73c4', '#4a4a9c', '#1f2a6b', '#040817']),
    hor:     col(['#f2e2c6', '#ffb273', '#ff6f6f', '#6a4f9a', '#14204a']),
    fog:     col(['#e8dcc6', '#f0b28a', '#c8706f', '#4a3f7a', '#0e1636']),
    cloud:   col(['#ffffff', '#ffd2a8', '#ff9a8a', '#8a6aa8', '#1e2850']),
    key:     col(['#fff2da', '#ffb26b', '#ff7e5f', '#8fa0ff', '#9db4ff']),
    hemiSky: col(['#d2e6ff', '#c9a5d8', '#8f6fb0', '#5468b8', '#4058a8']),
    hemiGnd: col(['#e6cba8', '#c97b57', '#8a4a50', '#3a3050', '#121228']),
    hill:    col(['#ffffff', '#ffd0b0', '#d8909a', '#6a68a8', '#1c2450'])
  };
  const N = {
    keyInt:   [3.1, 3.4, 0.7, 0.55, 1.3],
    hemiInt:  [1.55, 1.3, 0.8, 0.7, 0.85],
    keyEl:    [52, 12, 3, 9, 42],   keyAz:  [-50, -22, -8, 26, 30],
    sunEl:    [52, 12, -2, -30, -40], sunAz: [-50, -22, -8, -8, -8],
    moonEl:   [-40, -20, 8, 28, 46], moonAz: [30, 30, 28, 30, 30],
    exposure: [1.12, 1.15, 1.1, 1.1, 1.25],
    night:    [0, 0, 0.25, 0.8, 1]
  };
  const LAMP_INTENSITY = 70;

  const num = (arr, i, f) => arr[i] + (arr[i + 1] - arr[i]) * f;
  const mix = (out, arr, i, f) => out.copy(arr[i]).lerp(arr[i + 1], f);
  function dir(el, az, out) {
    const e = el * Math.PI / 180, a = az * Math.PI / 180;
    return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
  }
  function pick(t) {
    for (let i = 0; i < KEYS.length - 1; i++) if (t <= KEYS[i + 1]) return [i, (t - KEYS[i]) / (KEYS[i + 1] - KEYS[i])];
    return [KEYS.length - 2, 1];
  }

  /* ctx: { scene, renderer, sky, hemi, key, lamps[], hills, town, props } */
  BL.createTimeOfDay = function (ctx) {
    const { scene, renderer, sky, hemi, key, lamps, hills } = ctx, u = sky.uniforms;
    const v = new THREE.Vector3(), tint = new THREE.Color(), target = new THREE.Vector3(0, 0, -8);

    function set(t) {
      const [i, f] = pick(t);
      mix(u.uTop.value, C.top, i, f); mix(u.uHorizon.value, C.hor, i, f);
      mix(u.uCloud.value, C.cloud, i, f); mix(scene.fog.color, C.fog, i, f);
      mix(u.uSunCol.value, C.key, i, f);
      u.uNight.value = num(N.night, i, f);
      dir(num(N.sunEl, i, f), num(N.sunAz, i, f), u.uSunDir.value);
      dir(num(N.moonEl, i, f), num(N.moonAz, i, f), u.uMoonDir.value);

      mix(key.color, C.key, i, f); key.intensity = num(N.keyInt, i, f);
      dir(num(N.keyEl, i, f), num(N.keyAz, i, f), v);
      key.position.copy(target).addScaledVector(v, 260);
      key.target.position.copy(target); key.target.updateMatrixWorld();
      renderer.shadowMap.needsUpdate = true;

      mix(hemi.color, C.hemiSky, i, f); mix(hemi.groundColor, C.hemiGnd, i, f); hemi.intensity = num(N.hemiInt, i, f);
      renderer.toneMappingExposure = num(N.exposure, i, f);

      mix(tint, C.hill, i, f);
      hills.layers.forEach(l => l.mesh.material.color.copy(l.base).multiply(tint));

      const lampI = BL.smoothstep(0.5, 0.85, t) * LAMP_INTENSITY;
      lamps.forEach(l => { l.userData.base = lampI; l.intensity = lampI; });

      ctx.town.setTod(t); ctx.props.setTod(t);
      document.body.dataset.tod = t > 0.55 ? 'night' : 'day';
    }
    return { set };
  };
})(window.BL = window.BL || {});
