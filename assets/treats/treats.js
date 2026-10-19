(function () {
  'use strict';

  const A = window.TREATS, BASE = new URL(window.TREATS_BASE || '', document.baseURI).href;
  if (!A) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.tr-anim[data-anim]').forEach(el => {
    const clips = [el.dataset.anim, ...(el.dataset.layers || '').split(' ').filter(Boolean)].map(n => A[n]);
    if (!clips[0] || clips.includes(undefined)) return;
    const k = +(el.dataset.scale || .5), n = clips[0].seq.length, loopTo = clips[0].loop || 0;
    const geo = el.hasAttribute('data-flip') ? f => Object.assign({}, f, { m: !f.m, x: -(f.x + f.w) }) : f => f;
    const fr = clips.flatMap(c => c.seq.filter(Boolean).map(s => geo(c.files[s])));
    const x0 = Math.min(...fr.map(f => f.x)), y0 = Math.min(...fr.map(f => f.y));
    const x1 = Math.max(...fr.map(f => f.x + f.w)), y1 = Math.max(...fr.map(f => f.y + f.h));
    el.style.width = (x1 - x0) * k + 'px'; el.style.height = (y1 - y0) * k + 'px';

    if (el.hasAttribute('data-pivot')) { el.style.marginLeft = x0 * k + 'px'; el.style.marginBottom = -y1 * k + 'px'; }

    const imgs = clips.map(c => {
      const own = {};
      c.seq.filter(Boolean).forEach(s => {
        if (own[s]) return;
        const f = geo(c.files[s]), img = new Image();
        img.alt = ''; img.src = BASE + f.src; img.className = f.m ? 'm' : ''; img.style.visibility = 'hidden';
        img.style.left = (f.x - x0) * k + 'px'; img.style.top = (f.y - y0) * k + 'px'; img.style.width = f.w * k + 'px';
        el.appendChild(img); own[s] = img;
      });
      return own;
    });
    const shown = clips.map(() => null);
    let i = 0;

    const dx = clips[0].dx, sign = el.hasAttribute('data-flip') ? -1 : 1;
    const show = () => {
      if (dx) el.style.translate = sign * dx[i % n] * k + 'px 0';
      clips.forEach((c, j) => {
        const s = c.seq[i % c.seq.length], img = s ? imgs[j][s] : null;
        if (shown[j] === img) return;
        if (img) img.style.visibility = '';
        if (shown[j]) shown[j].style.visibility = 'hidden';
        shown[j] = img;
      });
    };
    show();
    el.trRestart = () => { i = 0; show(); };
    if (!still && n > 1) setInterval(() => { i = i + 1 >= n ? loopTo : i + 1; show(); }, 1000 / clips[0].fps);
  });

  document.querySelectorAll('.rig[data-rig]').forEach(rig => {
    const t = A[rig.dataset.rig]; if (!t) return;
    t.pieces.slice().reverse().forEach(p => {
      const img = new Image(); img.alt = ''; img.src = BASE + p.src; img.className = p.key;
      if (p.loop) { img.dataset.loop = p.loop; img.dataset.fps = 6; }
      if (p.rot) img.style.transform = `rotate(${p.rot}deg)`;
      if (p.alpha != null) img.style.opacity = p.alpha;
      img.style.left = p.x + 'px'; img.style.top = p.y + 'px'; img.style.width = p.w + 'px'; img.style.height = p.h + 'px'; rig.prepend(img);
    });
  });

  const unfurl = el => {
    const frames = A[el.dataset.frames]; if (!frames) return;
    let i = still ? frames.length - 1 : 0;
    el.src = BASE + frames[i].src;
    if (still) return;
    const t = setInterval(() => { i++; if (i >= frames.length) { clearInterval(t); return; } el.src = BASE + frames[i].src; }, 1000 / 18);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { unfurl(e.target); io.unobserve(e.target); } }), { threshold: .4 });
  document.querySelectorAll('img[data-frames]').forEach(el => { el.src = BASE + A[el.dataset.frames][0].src; io.observe(el); });

  document.querySelectorAll('img[data-loop]').forEach(el => {
    const frames = A[el.dataset.loop]; let i = 0; el.src = BASE + frames[0].src;
    if (!still) setInterval(() => { i = (i + 1) % frames.length; el.src = BASE + frames[i].src; }, 1000 / +(el.dataset.fps || 10));
  });

  document.querySelectorAll('[data-bg]').forEach(el => el.dataset.bg.split(' ').forEach(pair => {
    const [prop, key] = pair.split(':'); el.style.setProperty(prop, `url("${BASE + A[key].src}")`);
  }));
  document.querySelectorAll('img[data-art]').forEach(el => { const a = A[el.dataset.art]; el.src = BASE + a.src; if (a.m) el.classList.add('m'); });

  document.querySelectorAll('.tr-choose').forEach(ch => {
    const opts = [...ch.querySelectorAll('.tr-opt')], res = [...ch.querySelectorAll('.tr-result')];
    const pick = id => { opts.forEach(o => { o.classList.toggle('on', o.dataset.r === id); o.setAttribute('aria-pressed', o.dataset.r === id); });
      res.forEach(r => r.classList.toggle('on', r.dataset.r === id)); };
    opts.forEach(o => o.addEventListener('click', () => pick(o.dataset.r)));
    pick(ch.dataset.start || opts[0].dataset.r);
  });
})();
