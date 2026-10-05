/* The six murals, painted procedurally onto canvases (flat, bold, Matisse/Bauhaus-ish). */
(function (BL) {
  'use strict';

  const P = {
    cobalt: '#1d3f9e', navy: '#0f1f55', saffron: '#f6b83a', coral: '#ef6b4b', cream: '#f6ead3',
    teal: '#1f8f8a', pink: '#f2a1b8', terracotta: '#c9623a', lilac: '#8b7fd6', red: '#d8392f'
  };
  const TAU = Math.PI * 2;

  const circle = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  function sparkle(g, x, y, s, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(x, y - s);
    g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s);
    g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  }
  function wave(g, W, H, y0, amp, wl, phase, c) {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W + 6; x += 6) g.lineTo(x, y0 + Math.sin(x / wl * TAU + phase) * amp);
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  function ellipse(g, x, y, rx, ry, rot, c) {
    g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill();
  }

  /* ---- 1. Il Sole di Nonna Rosa ---- */
  function sole(g, W, H, r) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#142d7a'); bg.addColorStop(1, '#2b56c8');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) sparkle(g, r() * W, r() * H * 0.5, 7 + r() * 13, P.cream);
    const cx = W / 2, cy = H * 0.4, R = W * 0.34, n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * TAU, w = Math.PI / n * 0.92;
      g.fillStyle = i % 2 ? P.saffron : P.coral; g.beginPath();
      g.moveTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
      g.lineTo(cx + Math.cos(a) * R * 1.48, cy + Math.sin(a) * R * 1.48);
      g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); g.fill();
    }
    [[1, P.cream], [0.86, P.saffron], [0.7, P.coral], [0.54, P.terracotta], [0.38, P.saffron], [0.2, P.cream], [0.08, P.navy]]
      .forEach(([k, c]) => circle(g, cx, cy, R * k, c));
    wave(g, W, H, H * 0.76, 24, W * 0.9, 0.5, '#1f7a6e');
    wave(g, W, H, H * 0.83, 20, W * 0.7, 2.0, '#2f9a5a');
    wave(g, W, H, H * 0.9, 16, W * 0.55, 4.0, '#124d3d');
    [[0.18, 0.2], [0.82, 0.17], [0.92, 0.13]].forEach(([x, h]) => ellipse(g, W * x, H * (0.9 - h / 2), W * 0.04, H * h / 2, 0, '#0c3b2c'));
  }

  /* ---- 2. Onde di Seta ---- */
  function onde(g, W, H, r) {
    g.fillStyle = P.cream; g.fillRect(0, 0, W, H);
    circle(g, W / 2, H * 0.3, W * 0.3, P.coral);
    g.lineWidth = W * 0.035;
    [0.4, 0.5, 0.6].forEach((k, i) => { g.strokeStyle = i % 2 ? P.saffron : P.terracotta; g.beginPath(); g.arc(W / 2, H * 0.3, W * k, Math.PI, 0); g.stroke(); });
    const cols = [P.navy, P.teal, P.cream, P.coral, P.saffron, P.cobalt], bands = 11;
    for (let i = 0; i < bands; i++) {
      wave(g, W, H, H * (0.5 + i * 0.048), 8 + i * 3.2, W * (0.8 - i * 0.03), i * 1.3, cols[i % cols.length]);
    }
  }

  /* ---- 3. Mosaico della Piazza ---- */
  function mosaico(g, W, H, r) {
    const cols = 14, T = W / cols, pal = [P.terracotta, P.cream, P.navy, P.saffron, P.teal, P.coral];
    for (let j = 0; j * T < H; j++) for (let i = 0; i < cols; i++) {
      const x = i * T, y = j * T, a = Math.floor(r() * pal.length);
      let b = Math.floor(r() * pal.length); if (b === a) b = (b + 2) % pal.length;
      g.save(); g.beginPath(); g.rect(x, y, T, T); g.clip();
      g.fillStyle = pal[a]; g.fillRect(x, y, T, T); g.fillStyle = pal[b];
      const t = Math.floor(r() * 6), k = Math.floor(r() * 4), cxs = [x, x + T, x + T, x], cys = [y, y, y + T, y + T];
      if (t === 0) { g.beginPath(); g.arc(cxs[k], cys[k], T, 0, TAU); g.fill(); }
      else if (t === 1) { g.beginPath(); g.arc(x + T / 2, y + (k % 2 ? T : 0), T / 2, 0, TAU); g.fill(); }
      else if (t === 2) { circle(g, x + T / 2, y + T / 2, T * 0.46, pal[b]); circle(g, x + T / 2, y + T / 2, T * 0.3, pal[a]); circle(g, x + T / 2, y + T / 2, T * 0.14, pal[b]); }
      else if (t === 3) { for (let s = 0; s < 4; s += 2) g.fillRect(x + (k % 2 ? s * T / 4 : 0), y + (k % 2 ? 0 : s * T / 4), k % 2 ? T / 4 : T, k % 2 ? T : T / 4); }
      else if (t === 4) { g.beginPath(); g.moveTo(cxs[k], cys[k]); g.lineTo(cxs[(k + 1) % 4], cys[(k + 1) % 4]); g.lineTo(cxs[(k + 2) % 4], cys[(k + 2) % 4]); g.fill(); }
      else circle(g, x + T / 2, y + T / 2, T * 0.26, pal[b]);
      g.restore();
    }
    const cx = W / 2, cy = H / 2;
    [[3.2, P.cream], [2.7, P.terracotta], [2.2, P.navy], [1.7, P.saffron], [1.15, P.cream], [0.6, P.coral]].forEach(([k, c]) => circle(g, cx, cy, T * k, c));
  }

  /* ---- 4. Giardino di Nonno Carlo ---- */
  function giardino(g, W, H, r) {
    g.fillStyle = '#1b6150'; g.fillRect(0, 0, W, H);
    const greens = ['#2f8a5a', '#3da66a', '#14523f', '#6fbf73', '#1f7a4e'];
    for (let i = 0; i < 150; i++) {
      const x = r() * W, y = r() * H, rx = W * (0.03 + r() * 0.05), ry = rx * (2.2 + r()), rot = r() * Math.PI;
      ellipse(g, x, y, rx, ry, rot, greens[Math.floor(r() * greens.length)]);
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; g.beginPath();
      g.moveTo(x - Math.sin(rot) * ry * 0.9, y + Math.cos(rot) * ry * 0.9); g.lineTo(x + Math.sin(rot) * ry * 0.9, y - Math.cos(rot) * ry * 0.9); g.stroke();
    }
    const petals = [P.coral, P.pink, P.saffron, P.cream, P.lilac];
    const flower = (x, y, s, c) => {
      const n = 7 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) { const a = k / n * TAU; ellipse(g, x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.4, s * 0.24, a, c); }
      circle(g, x, y, s * 0.3, P.saffron); circle(g, x, y, s * 0.14, P.terracotta);
    };
    for (let i = 0; i < 28; i++) flower(r() * W, r() * H, W * (0.03 + r() * 0.035), petals[Math.floor(r() * petals.length)]);
    flower(W / 2, H * 0.48, W * 0.14, P.coral);
  }

  /* ---- 5. Luna Piena (glows at night) ---- */
  function luna(g, W, H, r) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a1038'); bg.addColorStop(1, '#2a3da0');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) sparkle(g, r() * W, r() * H * 0.7, 5 + r() * 12, r() < 0.3 ? P.saffron : P.cream);
    const cx = W / 2, cy = H * 0.33, R = W * 0.32;
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    g.fillStyle = '#f7edd0'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.arc(cx + R * 0.38, cy - R * 0.06, R * 0.9, 0, TAU, true); g.fill('evenodd');
    g.restore();
    g.strokeStyle = 'rgba(247,237,208,0.35)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    const bands = ['#6a5fc8', '#2e49b8', '#d78bb0', '#3b2f8f'];
    bands.forEach((c, i) => wave(g, W, H, H * (0.62 + i * 0.07), 18 + i * 4, W * (0.8 - i * 0.07), i * 2.2, c));
    for (let i = 0; i < 6; i++) {
      const bw = W * 0.1, x = W * (0.07 + i * 0.155), y = H * 0.93, bh = H * (0.035 + r() * 0.03);
      g.fillStyle = '#10163f'; g.fillRect(x, y - bh, bw, bh);
      g.beginPath(); g.moveTo(x - 6, y - bh); g.lineTo(x + bw / 2, y - bh - bw * 0.35); g.lineTo(x + bw + 6, y - bh); g.fill();
      g.fillStyle = P.saffron; g.fillRect(x + bw * 0.3, y - bh * 0.75, bw * 0.4, bh * 0.4);
    }
  }

  /* ---- 6. L'Occhio del Borgo ---- */
  function occhio(g, W, H, r) {
    g.fillStyle = P.cream; g.fillRect(0, 0, W, H);
    const D = W / 4, pal = [P.saffron, P.red, P.teal, P.navy, P.pink];
    for (let j = -1; j * D / 2 < H + D; j++) for (let i = -1; i < 6; i++) {
      const x = i * D + (j % 2 ? D / 2 : 0), y = j * D / 2;
      g.fillStyle = pal[((i + j * 2) % pal.length + pal.length) % pal.length];
      g.beginPath(); g.moveTo(x, y - D / 2); g.lineTo(x + D / 2, y); g.lineTo(x, y + D / 2); g.lineTo(x - D / 2, y); g.fill();
    }
    const cx = W / 2, cy = H * 0.46, ew = W * 0.46, eh = W * 0.26;
    g.fillStyle = P.cream; g.strokeStyle = P.navy; g.lineWidth = W * 0.022;
    g.beginPath(); g.moveTo(cx - ew, cy); g.quadraticCurveTo(cx, cy - eh * 2, cx + ew, cy); g.quadraticCurveTo(cx, cy + eh * 2, cx - ew, cy); g.fill(); g.stroke();
    [[0.17, P.teal], [0.13, P.navy], [0.09, P.saffron], [0.05, P.navy]].forEach(([k, c]) => circle(g, cx, cy, W * k, c));
    circle(g, cx - W * 0.03, cy - W * 0.035, W * 0.02, P.cream);
    g.strokeStyle = P.navy; g.lineWidth = W * 0.014; g.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const t = (i + 0.5) / 11, x = cx - ew + 2 * ew * t, y = cy - eh * 1.0 * Math.sin(t * Math.PI) * 1.0;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (t - 0.5) * W * 0.12, y - W * 0.07); g.stroke();
    }
  }

  BL.murals = [
    { id: 'sole', title: 'Il Sole di Nonna Rosa', artist: 'Marta Pellegrini', year: 2023, w: 6, h: 10.2, glow: 0.22, draw: sole,
      line: 'A neighbour’s kitchen sun, painted four storeys tall.' },
    { id: 'onde', title: 'Onde di Seta', artist: 'Luca Ferri', year: 2024, w: 6, h: 10.2, glow: 0.22, draw: onde,
      line: 'The sea nobody here has seen, remembered in silk.' },
    { id: 'mosaico', title: 'Mosaico della Piazza', artist: 'Collettivo Tre Archi', year: 2022, w: 14, h: 9.5, glow: 0.22, draw: mosaico,
      line: 'Two hundred tiles, one for every household.' },
    { id: 'giardino', title: 'Giardino di Nonno Carlo', artist: 'Giulia Bassi', year: 2024, w: 14, h: 9.5, glow: 0.22, draw: giardino,
      line: 'The garden he planted, finally allowed to climb.' },
    { id: 'luna', title: 'Luna Piena', artist: 'Elia Moretti', year: 2023, w: 6, h: 10.2, glow: 0.95, draw: luna,
      line: 'Painted with glow pigment. Wait for dark.' },
    { id: 'occhio', title: 'L’Occhio del Borgo', artist: 'Sara Vitale', year: 2025, w: 6, h: 10.2, glow: 0.25, draw: occhio,
      line: 'It watches over the lane. It has never once blinked.' }
  ];

  function finish(g, W, H, r) {
    for (let i = 0; i < W * H / 140; i++) {                       // painted-wall grain
      const v = r() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${0.03 + r() * 0.06})`;
      g.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5);
    }
    g.strokeStyle = P.cream; g.lineWidth = Math.min(W, H) * 0.035;
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
  }

  /* One mural -> CanvasTexture. Draws the procedural painting instantly, then swaps in the
     generated artwork (BL.art, from js/art.js) once decoded; BL.artLoads lets boot wait for it. */
  BL.artLoads = [];
  BL.muralTexture = function (spec, seed) {
    const CAP = BL.MOBILE ? 1600 : 2200; let k = BL.MOBILE ? 130 : 190; const longest = Math.max(spec.w, spec.h) * k; if (longest > CAP) k *= CAP / longest;
    const W = Math.round(spec.w * k), H = Math.round(spec.h * k), c = BL.canvas(W, H), g = c.getContext('2d');
    spec.draw(g, W, H, BL.rng(seed)); finish(g, W, H, BL.rng(seed + 1));
    const tex = BL.canvasTexture(c, false), src = BL.art && BL.art[spec.id];
    if (src) BL.artLoads.push(new Promise(done => {
      const img = new Image();
      img.onload = () => {
        const s = Math.max(W / img.width, H / img.height), dw = img.width * s, dh = img.height * s;
        g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh); finish(g, W, H, BL.rng(seed + 2));
        tex.needsUpdate = true; done();
      };
      img.onerror = done; img.src = src;
    }));
    return tex;
  };
})(window.BL = window.BL || {});
