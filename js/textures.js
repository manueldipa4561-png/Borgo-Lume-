/* Procedural canvas textures: plaster, cobbles, roof tiles, glow sprite, clock, piazza inlay. */
(function (BL) {
  'use strict';

  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const tex = (c, repeat) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  BL.canvas = cv; BL.canvasTexture = tex;

  BL.plasterTexture = function () {
    const S = 512, c = cv(S, S), g = c.getContext('2d'), r = BL.rng(11);
    g.fillStyle = '#f4f1ec'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 110; i++) {
      const x = r() * S, y = r() * S, rad = 30 + r() * 90, a = 0.02 + r() * 0.04, dark = r() < 0.6;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const cx = x + dx * S, cy = y + dy * S;
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gr.addColorStop(0, dark ? `rgba(120,100,80,${a})` : `rgba(255,255,255,${a})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      }
    }
    for (let i = 0; i < 5000; i++) {
      const v = r() < 0.5 ? 0 : 255;
      g.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.07})`;
      g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
    }
    return tex(c);
  };

  BL.cobbleTexture = function () {
    const S = 1024, C = 64, c = cv(S, S), g = c.getContext('2d'), r = BL.rng(5);
    g.fillStyle = '#5f574d'; g.fillRect(0, 0, S, S);
    for (let j = 0; j < S / C; j++) for (let i = 0; i < S / C; i++) {
      const x = i * C + (j % 2) * C / 2 + 3 + r() * 3, y = j * C + 3 + r() * 3;
      const w = C - 8 - r() * 4, h = C - 8 - r() * 4;
      const l = 54 + r() * 20, hue = 26 + r() * 16, sat = 8 + r() * 14;
      for (const off of [0, -S]) {
        const xx = x + off; if (xx > S || xx + w < 0) continue;
        g.fillStyle = `hsl(${hue},${sat}%,${l}%)`;
        g.beginPath(); g.roundRect(xx, y, w, h, 14); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.13)';
        g.beginPath(); g.roundRect(xx + 3, y + 3, w * 0.7, h * 0.55, 10); g.fill();
      }
    }
    return tex(c);
  };

  BL.roofTexture = function () {
    const S = 256, cols = 6, rows = 8, tw = S / cols, th = S / rows, c = cv(S, S), g = c.getContext('2d'), r = BL.rng(9);
    g.fillStyle = '#3a1d14'; g.fillRect(0, 0, S, S);
    for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
      const x = (i + (j % 2) * 0.5) * tw, y = j * th;
      g.fillStyle = `hsl(${11 + r() * 9},${50 + r() * 14}%,${40 + r() * 16}%)`;
      g.beginPath(); g.roundRect(x + 1, y + 1, tw - 2, th + 5, 7); g.fill();
      const gr = g.createLinearGradient(0, y, 0, y + th);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,5,0,0.4)');
      g.fillStyle = gr; g.fillRect(x + 1, y + 1, tw - 2, th);
    }
    return tex(c);
  };

  BL.glowTexture = function () {
    const c = cv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    gr.addColorStop(0.55, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return tex(c, false);
  };

  BL.clockTexture = function () {
    const S = 512, c = cv(S, S), g = c.getContext('2d'), m = S / 2;
    g.fillStyle = '#efe3c8'; g.beginPath(); g.arc(m, m, m, 0, 7); g.fill();
    g.strokeStyle = '#2a1d16'; g.lineWidth = 18; g.beginPath(); g.arc(m, m, m - 12, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2; g.lineWidth = i % 3 ? 7 : 14;
      g.beginPath(); g.moveTo(m + Math.sin(a) * (m - 46), m - Math.cos(a) * (m - 46));
      g.lineTo(m + Math.sin(a) * (m - 84), m - Math.cos(a) * (m - 84)); g.stroke();
    }
    g.lineCap = 'round'; g.lineWidth = 16;
    g.beginPath(); g.moveTo(m, m); g.lineTo(m + Math.sin(-1.05) * 130, m - Math.cos(-1.05) * 130); g.stroke();
    g.lineWidth = 11; g.beginPath(); g.moveTo(m, m); g.lineTo(m + Math.sin(2.0) * 190, m - Math.cos(2.0) * 190); g.stroke();
    g.fillStyle = '#2a1d16'; g.beginPath(); g.arc(m, m, 16, 0, 7); g.fill();
    return tex(c, false);
  };

  /* Sun-burst inlay around the fountain. */
  BL.piazzaTexture = function () {
    const S = 1024, m = S / 2, c = cv(S, S), g = c.getContext('2d');
    g.beginPath(); g.arc(m, m, m, 0, 7); g.clip();
    g.fillStyle = '#e6d7b9'; g.fillRect(0, 0, S, S);
    const n = 32;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#c9633b' : '#efe4cb';
      g.beginPath(); g.moveTo(m, m);
      g.arc(m, m, m * 0.62, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2); g.fill();
    }
    [[0.62, '#2b2a3a'], [0.57, '#e6d7b9'], [0.3, '#2f6f74'], [0.27, '#e6d7b9']].forEach(([k, col]) => {
      g.fillStyle = col; g.beginPath(); g.arc(m, m, m * k, 0, 7); g.fill();
    });
    g.strokeStyle = '#2b2a3a'; g.lineWidth = 14; g.beginPath(); g.arc(m, m, m * 0.9, 0, 7); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(m, m, m * 0.96, 0, 7); g.stroke();
    return tex(c, false);
  };
})(window.BL = window.BL || {});
