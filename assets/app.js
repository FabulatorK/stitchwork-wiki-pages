(() => {
  'use strict';

  const root = document.documentElement;

  const topbar = document.querySelector('.topbar');
  const syncHeaderHeight = () => {
    if (topbar) root.style.setProperty('--topbar-h', `${topbar.getBoundingClientRect().height}px`);
  };
  syncHeaderHeight();
  if (topbar && typeof ResizeObserver !== 'undefined') new ResizeObserver(syncHeaderHeight).observe(topbar);
  else addEventListener('resize', syncHeaderHeight, { passive: true });
  const stored = localStorage.getItem('sw-theme');
  if (stored) root.setAttribute('data-theme', stored);
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
  const themeBtn = document.getElementById('themeBtn');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  const themeMs = () => {
    const d = getComputedStyle(root).getPropertyValue('--theme-dur').trim();
    const n = parseFloat(d);
    return isNaN(n) ? 1000 : d.endsWith('ms') ? n : n * 1000;
  };
  let switching = false;
  themeBtn?.addEventListener('click', () => {

    if (switching) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const apply = () => { root.setAttribute('data-theme', next); localStorage.setItem('sw-theme', next); };
    if (calm.matches) { apply(); return; }
    switching = true;
    themeBtn.setAttribute('aria-disabled', 'true');
    root.classList.add('theme-switching');
    const done = () => {
      switching = false;
      themeBtn.removeAttribute('aria-disabled');
      root.classList.remove('theme-switching', 'theme-fade');
    };

    if (document.startViewTransition) document.startViewTransition(apply).finished.finally(done);
    else { root.classList.add('theme-fade'); apply(); setTimeout(done, themeMs()); }
  });

  const sidebar = document.getElementById('sidebar');
  document.getElementById('menuBtn')?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (window.innerWidth > 760 || !sidebar?.classList.contains('open')) return;
    if (!sidebar.contains(e.target) && e.target.id !== 'menuBtn') sidebar.classList.remove('open');
  });

  const reading = document.getElementById('reading');
  const readingFill = document.getElementById('readingFill');
  const readingLabel = document.getElementById('readingLabel');
  const pageName = document.querySelector('.content h1 .page-name')?.textContent || '';
  if (readingLabel) readingLabel.textContent = pageName;
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (reading) {
      reading.classList.toggle('idle', max < 40);
      readingFill.style.width = (max > 0 ? Math.min(1, h.scrollTop / max) * 100 : 0) + '%';
    }
    spy();
  };

  const tocLinks = [...document.querySelectorAll('.toc a')];
  const targets = tocLinks.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  let spyRAF = 0;
  function spy() {
    if (!targets.length || spyRAF) return;
    spyRAF = requestAnimationFrame(() => {
      spyRAF = 0;
      let active = targets[0], passed = false;
      const threshold = (topbar?.getBoundingClientRect().height || 64) + 36;
      for (const t of targets) { if (t.getBoundingClientRect().top <= threshold) { active = t; passed = true; } else break; }
      tocLinks.forEach(a => a.classList.toggle('active', decodeURIComponent(a.hash.slice(1)) === active.id));

      if (readingLabel) readingLabel.textContent = passed ? active.textContent : pageName;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('pre.code .copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('code')?.innerText ?? '';
      try { await navigator.clipboard.writeText(code); } catch { return; }
      btn.textContent = 'Copied'; btn.classList.add('done');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1400);
    });
  });

  const search = document.getElementById('search');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll('.nav-sec').forEach(sec => {
      let any = false;
      sec.querySelectorAll('li').forEach(li => {
        const hit = li.textContent.toLowerCase().includes(q);
        li.classList.toggle('hidden', q && !hit);
        if (hit) any = true;
      });
      sec.style.display = (q && !any) ? 'none' : '';
      if (q && any) sec.open = true;
    });
  });

  document.querySelectorAll('.content details, .nav-sec').forEach(d => {
    const sum = d.querySelector(':scope > summary');
    if (!sum) return;
    const clip = document.createElement('div');
    clip.className = 'fold-body';
    while (sum.nextSibling) clip.appendChild(sum.nextSibling);
    d.appendChild(clip);
    let click = 0;
    const stop = () => { clip.getAnimations().forEach(a => a.cancel()); clip.classList.remove('moving'); };
    const once = (k, fn) => () => { if (k === click) { click++; fn(); } };
    sum.addEventListener('click', e => {
      if (calm.matches) return;
      e.preventDefault();

      const from = d.open ? clip.getBoundingClientRect().height : 0, opening = !d.open || d.classList.contains('closing');
      stop();
      const k = ++click;
      clip.classList.add('moving');
      let run, end;
      if (opening) {
        d.classList.remove('closing');
        d.open = true;
        run = clip.animate([{ height: from + 'px', opacity: from ? 1 : 0 }, { opacity: 1, offset: .6 }, { height: clip.scrollHeight + 'px', opacity: 1 }],
          { duration: 360, easing: 'cubic-bezier(.2, .8, .2, 1)' });
        end = once(k, stop);
      } else {
        d.classList.add('closing');

        run = clip.animate([{ height: from + 'px', opacity: 1 }, { opacity: 0, offset: .7 }, { height: '0px', opacity: 0 }],
          { duration: 260, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
        end = once(k, () => { d.open = false; d.classList.remove('closing'); stop(); });
      }
      run.onfinish = end;
      setTimeout(end, run.effect.getTiming().duration + 200);
    });
  });

  const ftHosts = document.querySelectorAll('.filetree');
  if (ftHosts.length) {
    const ftText = document.getElementById('filetree-text');
    const FT = JSON.parse(ftText ? ftText.textContent : '{}');
    const UI = FT.ui || {}, PRESETS = FT.presets || {}, NODES = FT.nodes || {};
    const d = (n, o) => Object.assign({ n, t: 'd' }, o || {});
    const f = (n, o) => Object.assign({ n, t: 'f' }, o || {});
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const TREES = {
      packmap: [
        { id: 'full', tree: [
          d('…/Packs/MyCrawReskin', { see: 'A2-installing-packs', kids: [
            f('manifest.json', { see: 'distributing-your-pack' }),
            f('icon.png', { see: 'distributing-your-pack' }),
            f('README.md'),
            d('Stitchwork', { kids: [
              f('pack.json', { see: 'distributing-your-pack' }),
              f('cover.png', { see: 'distributing-your-pack' }),
              d('Sprites', { kids: [
                d('Ability Get Thread Cln', { see: 'B2-finding-any-sprite', kids: [
                  d('atlas0', { kids: [
                    f('weaver_pray_thread_bind0001.png', { eg: 'Sprites/Ability Get Thread Cln/atlas0/weaver_pray_thread_bind0001.png', see: 'B1-starting-a-skin-pack' })
                  ] })
                ] }),
                d('T2D', { kids: [
                  d('Scarecraw', { kids: [
                    f('scarecraw0000.png', { eg: 'Sprites/T2D/Scarecraw/scarecraw0000.png', see: 'B4-t2d-sprites' })
                  ] })
                ] })
              ] }),
              d('Spritesheets', { kids: [
                d('Crow Cln', { kids: [
                  f('atlas0.png', { eg: 'Spritesheets/Crow Cln/atlas0.png', see: 'B3-spritesheets' })
                ] })
              ] }),
              d('Sounds', { see: 'D1-audio', kids: [
                f('big_yelp_01.wav', { eg: 'Sounds/big_yelp_01.wav', see: 'D1-audio' })
              ] }),
              d('Text', { see: 'C1-text', kids: [
                d('Wanderers', { kids: [
                  f('EN.yml', { eg: 'Text/Wanderers/EN.yml', see: 'C1-text' })
                ] })
              ] }),
              d('Videos', { see: 'E1-video', kids: [
                f('Cinematic_Intro.mp4', { eg: 'Videos/Cinematic_Intro.mp4', see: 'E1-video' })
              ] }),
              d('Fonts', { see: 'C2-fonts' }),
              d('Recolor', { see: 'B9-colors', kids: [
                f('_global.txt', { eg: 'Recolor/_global.txt', see: 'B9-colors' }),
                f('_hero.txt', { eg: 'Recolor/_hero.txt', see: 'B9-colors' })
              ] })
            ] })
          ] })
        ] },
        { id: 't2d', tree: [
          d('Stitchwork', { kids: [
            d('Sprites', { kids: [
              d('T2D', { see: 'B4-t2d-sprites', kids: [
                d('Scarecraw', { kids: [
                  f('scarecraw0000.png', { eg: 'Sprites/T2D/Scarecraw/scarecraw0000.png', see: 'B4-t2d-sprites' })
                ] }),
                d('Inventory', { kids: [
                  f('Hornet_craw_scrap.png', { eg: 'Sprites/T2D/Inventory/Hornet_craw_scrap.png', see: 'B4-t2d-sprites' })
                ] })
              ] })
            ] }),
            d('Spritesheets', { kids: [
              d('T2D', { kids: [
                f('rag_break_particle.png', { eg: 'Spritesheets/T2D/rag_break_particle.png', see: 'B4-t2d-sprites' })
              ] })
            ] })
          ] })
        ] },
        { id: 'inst', tree: [
          d('Stitchwork', { kids: [
            d('Sprites', { kids: [
              d('{CollectionName}', { see: 'B7-sprite-paths', kids: [
                d('{VanillaTextureName}', { kids: [
                  f('{SpriteName}.png', { eg: 'Sprites/{CollectionName}/{VanillaTextureName}/{SpriteName}.png', see: 'B7-sprite-paths' })
                ] })
              ] })
            ] })
          ] })
        ] },
        { id: 'ws', tree: [
          d('<Game folder>/Stitchwork', { see: 'B1-starting-a-skin-pack', kids: [
            d('Sprites', { see: 'B7-sprite-paths' }),
            d('Text', { see: 'C1-text' }),
            d('Recolor', { see: 'B9-colors' }),
            d('Lang', { see: 'C1-text' }),
            d('Dumps', { ds: true, see: 'dumping' }),
            d('Converted', { ds: true, see: 'B3-spritesheets' }),
            d('Showcase', { see: 'B8-animation-controller' }),
            d('Backups', { see: 'A3-pack-manager' })
          ] }),
          d('…/BepInEx/plugins/StitchworkRoot', { see: 'A1-getting-started', kids: [
            f('Stitchwork.dll', { ess: true }),
            f('stitchwork.assetbundle', { ess: true }),
            d('Lang', { ess: true }),
            f('LICENSE')
          ] })
        ] }
      ]
    };
    const HINT = '<div class="ft-hint">' + esc(UI.hint || '') + '</div>';
    ftHosts.forEach(host => {
      const treeId = TREES[host.dataset.tree] ? host.dataset.tree : 'packmap';
      const presets = TREES[treeId];
      host.innerHTML = '<div class="ft-presets"></div><div class="ft-grid"><div class="ft-tree"></div><div class="ft-detail"></div></div>';
      const preEl = host.querySelector('.ft-presets'), treeEl = host.querySelector('.ft-tree'), detEl = host.querySelector('.ft-detail');
      let selRow = null;
      const showDetail = (nd, tx) => {
        let h = '';
        if (nd.ds) h += '<span class="ft-dtag ds">' + esc(UI.keepDontShip || '') + '</span>';
        else if (nd.ess) h += '<span class="ft-dtag ess">' + esc(UI.essential || '') + '</span>';
        else if (tx.tag) h += '<span class="ft-dtag">' + esc(tx.tag) + '</span>';
        h += '<p class="ft-dname">' + esc(nd.n) + (nd.t === 'd' ? '/' : '') + '</p>';
        if (tx.what) h += '<p class="ft-dwhat">' + esc(tx.what) + '</p>';
        if (nd.eg) h += '<div class="ft-deg">' + esc(nd.eg) + '</div>';
        if (nd.see) h += '<p class="ft-dsee">' + esc(UI.see || '') + ' <a href="' + esc(nd.see) + '.html">' + esc(tx.see || nd.see) + '</a></p>';
        detEl.innerHTML = h;
      };
      const rowEl = (nd, tx, depth) => {
        const r = document.createElement('div');
        r.className = 'ft-row' + (nd.t === 'd' ? ' dir' : '');
        r.style.paddingLeft = (8 + depth * 15) + 'px';
        const pcls = nd.ds ? 'ft-pill ds' : (nd.ess ? 'ft-pill ess' : 'ft-pill');
        const ptxt = nd.ds ? UI.dontShip : (nd.ess ? UI.essentialPill : tx.pill);
        const pill = ptxt ? '<span class="' + pcls + '">' + esc(ptxt) + '</span>' : '';
        r.innerHTML = '<span class="ft-caret">' + (nd.t === 'd' ? '▾' : '') + '</span><span class="ft-nm">' + esc(nd.n) + (nd.t === 'd' ? '/' : '') + '</span>' + pill;
        return r;
      };
      const build = (nodes, depth, parent, preset, path) => {
        nodes.forEach(nd => {
          const p = path ? path + '/' + nd.n : nd.n;
          const tx = NODES[treeId + ':' + preset + ':' + p] || {};
          const r = rowEl(nd, tx, depth); parent.appendChild(r);
          let kids = null;
          if (nd.kids && nd.kids.length) { kids = document.createElement('div'); kids.className = 'ft-kids'; parent.appendChild(kids); build(nd.kids, depth + 1, kids, preset, p); }
          r.addEventListener('click', () => {
            if (selRow) selRow.classList.remove('sel'); selRow = r; r.classList.add('sel'); showDetail(nd, tx);
            if (kids) { kids.classList.toggle('col'); const c = r.querySelector('.ft-caret'); if (c) c.textContent = kids.classList.contains('col') ? '▸' : '▾'; }
          });
        });
      };
      const render = i => {
        treeEl.innerHTML = ''; selRow = null; detEl.innerHTML = HINT;
        build(presets[i].tree, 0, treeEl, presets[i].id, '');
        [...preEl.children].forEach((b, j) => b.classList.toggle('on', j === i));
      };
      presets.forEach((p, i) => {
        const b = document.createElement('button'); b.className = 'ft-pbtn'; b.textContent = PRESETS[treeId + ':' + p.id] || p.id;
        b.addEventListener('click', () => render(i)); preEl.appendChild(b);
      });
      render(0);
    });
  }
})();
