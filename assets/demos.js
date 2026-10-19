(function () {
  'use strict';

  const IC = {
    folder: '<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>',
    pencil: '<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4"/><path d="M13.5 6.5l4 4"/>',
    chev: '<path d="M6 9l6 6l6 -6"/>',
    x: '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
  };
  const svg = (p, cls = '', w = 1.75) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const CHEV = svg(IC.chev, 'dm-chev', 2);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const strings = root => { const S = {}; root.querySelectorAll('.dm-strings [data-k]').forEach(e => { S[e.dataset.k] = e.textContent; }); return S; };
  const say = (root, key) => root.querySelectorAll('.dm-say').forEach(e => e.classList.toggle('on', e.dataset.say === key));
  const DEMOS = {};

  DEMOS['overview-choices'] = (root) => {
    const S = strings(root), mount = root.querySelector('.dm-mount'), says = root.querySelector('.dm-says');
    const ROOT_PATH = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Hollow Knight Silksong\\Stitchwork';
    const PACKS = ['CrystalHornet', 'MySkin', 'SavageBeastfly3', 'GroalTheGreater'];
    const fresh = () => ({ open: false, hover: false, wf: 'open', wfField: '', wfOpen: false, ed: 'open', edField: '', edOpen: false,
      target: null, skipped: false, listOpen: false, armed: false });
    let st = fresh(), armTimer = 0;

    const items = () => [
      st.wf === 'open' && [S.wf, S['wf-open']],
      st.ed === 'open' && [S.ed, S['ed-open']],
      st.target == null && !st.skipped && [S.target, S['t-why']],
    ].filter(Boolean);

    const blipAt = () => st.wf === 'open' ? 0 : st.ed === 'open' ? 1 : st.target == null && !st.skipped ? 2 : -1;

    const tab = () => `<div class="dm-strip"><button type="button" class="dm-tab t-dashboard${items().length ? ' pending' : ''}${st.open ? ' sel' : ''}" style="--blink-at: -${Math.round(performance.now() % 2400)}ms" data-act="tab" aria-expanded="${st.open}" aria-label="${esc(S.tab)} (2)">
<span class="tv"><span class="plate"><span class="ico"></span><span class="label">${esc(S.tab)}</span><span class="dm-kbd" aria-hidden="true">2</span></span><span class="hem"><span class="seam"></span><span class="vial"><span class="halo"></span><span class="core"></span></span></span></span></button><div class="dm-tip" role="tooltip"></div></div>`;

    const tip = () => {
      const el = mount.querySelector('.dm-tip'), it = items();
      if (!el) return;
      el.classList.toggle('on', st.hover && it.length > 0);
      el.innerHTML = !it.length ? '' : `${esc(it.length === 1 ? S.one : S.many.replace('{0}', it.length))}<div class="items">${it.map(([t, w]) => `<div><i></i><span>${esc(t)}</span><span class="why">${esc(w)}</span></div>`).join('')}</div>`;
    };

    const row = (act, icon, label, value, open, waits, blip) =>
      `<button type="button" class="dm-choice${waits ? ' waits' : ''}" data-act="${act}" aria-expanded="${open}">${waits ? '<span class="dm-edge accent"></span>' : ''}${blip ? '<span class="dm-blip"></span>' : ''}${svg(icon, 'dm-ico')}<span class="k">${esc(label)}</span><span class="v">${esc(value)}</span>${CHEV}</button>`;

    const workingFolder = (blip) => {
      const waits = st.wf === 'open';
      const value = waits ? S['wf-open'] : st.wf === 'custom' ? S['wf-custom'] : S['wf-root'];
      let h = row('wf', IC.folder, S.wf, value, st.wfOpen, waits, blip === 0);
      if (!st.wfOpen) return h;

      const root = waits
        ? `<button type="button" class="dm-btn sm primary" data-act="keep-root">${esc(S['keep-root'])}</button>`
        : `<button type="button" class="dm-btn sm" data-act="use-root"${st.wf === 'custom' ? '' : ' disabled'}>${esc(S['use-root'])}</button>`;
      return h + `<div class="dm-block"><div class="dm-path">${esc(ROOT_PATH)}</div><div class="dm-s14 dm-muted">${esc(S['wf-about'])}</div>
<div class="dm-row">${root}</div>
<form class="dm-row" data-form="wf"><input class="dm-field" data-field="wfField" type="text" autocomplete="off" placeholder="${esc(S['wf-field'])}" aria-label="${esc(S['wf-field'])}" value="${esc(st.wfField)}"><button type="submit" class="dm-btn sm">${esc(S.set)}</button><button type="button" class="dm-btn sm" data-act="say:browse-folder">${esc(S.browse)}</button><button type="button" class="dm-btn sm icon" data-act="say:open-folder" aria-label="${esc(S['open-folder'])}">${svg(IC.folder)}</button></form>
${st.wf === 'custom' ? `<div class="dm-s14 dm-warn">${esc(S.restart)}</div>` : ''}</div>`;
    };

    const imageEditor = (blip) => {
      const waits = st.ed === 'open';
      let h = row('ed', IC.pencil, S.ed, waits ? S['ed-open'] : S['ed-default'], st.edOpen, waits, blip === 1);
      if (!st.edOpen) return h;

      const def = waits
        ? `<button type="button" class="dm-btn sm primary" data-act="keep-default">${esc(S['keep-default'])}</button>`
        : `<button type="button" class="dm-btn sm quiet" disabled>${esc(S['use-default'])}</button>`;
      return h + `<div class="dm-block"><div class="dm-s14 dm-muted">${esc(S['ed-about'])}</div>
<form class="dm-row" data-form="ed"><input class="dm-field" data-field="edField" type="text" autocomplete="off" placeholder="${esc(S['ed-field'])}" aria-label="${esc(S['ed-field'])}" value="${esc(st.edField)}"><button type="submit" class="dm-btn sm">${esc(S.set)}</button><button type="button" class="dm-btn sm" data-act="say:browse-editor">${esc(S.browse)}</button></form>
<div class="dm-row">${def}</div></div>`;
    };

    const target = (blip) => {
      const list = st.listOpen ? `<div class="dm-list">${PACKS.map(p => `<button type="button" class="dm-li${p === st.target ? ' cur' : ''}" data-act="pick" data-pack="${esc(p)}">${esc(p)}</button>`).join('')}</div>` : '';
      if (st.target != null) {
        return `<div class="dm-wrap"><div class="dm-banner set"><div class="dm-row dm-s14"><span class="dm-muted">${esc(S['t-label'])}</span><button type="button" class="dm-btn ghost name" data-act="list" aria-expanded="${st.listOpen}"><span>${esc(st.target)}</span>${CHEV}</button><button type="button" class="dm-btn ghost icon" data-act="clear" aria-label="${esc(S.clear)}">${svg(IC.x, '', 2)}</button></div>
<div class="dm-row"><button type="button" class="dm-btn sm dm-grow" data-act="say:push">${esc(S.push)}</button><button type="button" class="dm-btn sm dm-grow" data-act="say:pull-merge">${esc(S['pull-merge'])}</button><button type="button" class="dm-btn sm dm-grow ${st.armed ? 'armed' : 'danger'}" data-act="replace">${esc(st.armed ? S.arm : S['pull-replace'])}</button></div></div>${list}</div>`;
      }

      const waits = !st.skipped, edge = st.listOpen ? 'text' : waits ? 'accent' : 'faint';
      return `<div class="dm-wrap"><div class="dm-row" style="align-items: stretch"><button type="button" class="dm-banner empty${waits ? '' : ' off'}" data-act="list" aria-expanded="${st.listOpen}"><span class="dm-edge ${edge}"></span>${waits && blip === 2 ? '<span class="dm-blip"></span>' : ''}${esc(waits ? S['t-wait'] : S['t-off'])}</button>${waits ? `<button type="button" class="dm-btn sm ghost" style="align-self: center" data-act="not-now">${esc(S['not-now'])}</button>` : ''}</div>${list}</div>`;
    };

    const render = () => {
      const b = blipAt();
      const panel = `<div class="dm-panel"${st.open ? '' : ' hidden'}><div class="ttl">${esc(S.panel)}</div>
<div class="dm-block">${workingFolder(b)}</div><div class="dm-block">${imageEditor(b)}</div><div class="dm-sep"></div>${target(b)}</div>`;
      const focus = document.activeElement && root.contains(document.activeElement) ? (document.activeElement.dataset.act || document.activeElement.dataset.field) : null;
      mount.innerHTML = `<div class="dm-stage"><div class="dm-top">${tab()}<div class="dm-says-at"></div></div>${panel}</div>`;
      mount.querySelector('.dm-says-at').replaceWith(says);
      if (focus) { const el = mount.querySelector(`[data-act="${focus}"], [data-field="${focus}"]`); if (el) el.focus(); }
      tip();
    };

    let wasPending = true;
    const settle = () => { const now = items().length > 0; if (wasPending && !now) say(root, 'settled'); wasPending = now; };
    const disarm = () => { clearTimeout(armTimer); st.armed = false; };

    root.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b) || b.disabled) return;
      const act = b.dataset.act;
      if (act.startsWith('say:')) { say(root, act.slice(4)); return; }
      switch (act) {
        case 'tab': st.open = !st.open; if (!st.open) st.listOpen = false; break;
        case 'wf': st.wfOpen = !st.wfOpen; break;
        case 'ed': st.edOpen = !st.edOpen; break;
        case 'keep-root': case 'use-root': st.wf = 'root'; st.wfField = ''; break;
        case 'keep-default': st.ed = 'default'; st.edField = ''; break;
        case 'list': st.listOpen = !st.listOpen; break;
        case 'pick': st.target = b.dataset.pack; st.listOpen = false; break;
        case 'not-now': st.skipped = true; st.listOpen = false; break;
        case 'clear': st.target = null; st.listOpen = false; disarm(); break;
        case 'replace':
          if (st.armed) { disarm(); say(root, 'pull-replace'); break; }
          st.armed = true; clearTimeout(armTimer);
          armTimer = setTimeout(() => { st.armed = false; render(); }, 3000);
          break;
        case 'reset': disarm(); st = fresh(); wasPending = true; say(root, 'intro'); break;
        default: return;
      }
      render(); settle();
    });
    root.addEventListener('submit', e => {
      const f = e.target.closest('form[data-form]'); if (!f) return;
      e.preventDefault();
      if (f.dataset.form === 'wf') {

        const v = st.wfField.trim();
        if (v === '') st.wf = 'root';
        else if (/^([A-Za-z]:[\\/]|[\\/])/.test(v)) st.wf = 'custom';
        else return;
      } else {

        if (st.edField.trim() === '') st.ed = 'default';
        else { say(root, 'set-editor'); return; }
      }
      render(); settle();
    });
    root.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.field; if (k) st[k] = e.target.value; });
    root.addEventListener('keydown', e => { if (e.key === 'Escape' && st.listOpen) { st.listOpen = false; render(); } });

    const hover = on => { if (on !== st.hover) { st.hover = on; tip(); } };
    root.addEventListener('mouseover', e => hover(!!e.target.closest('.dm-tab')));
    root.addEventListener('mouseleave', () => hover(false));
    root.addEventListener('focusin', e => hover(!!e.target.closest('.dm-tab')));
    root.addEventListener('focusout', () => hover(false));
    render();
  };

  DEMOS['install-explorer'] = (root) => {
    const slots = {};
    root.querySelectorAll('.swx-strings [data-d]').forEach(e => { slots[e.dataset.d.slice('install-explorer:'.length)] = e; });

    const T = (id, k = 't') => { const e = slots[id + ':' + k]; return e ? (k === 't' ? e.textContent : e.innerHTML).trim() : ''; };
    const host = root;

    const C = { bone: '221, 216, 208', packs: '255, 138, 77', graphics: '255, 111, 145', audio: '79, 227, 208', video: '98, 182, 255',
      text: '255, 233, 194', tools: '196, 204, 218', cust: '210, 112, 230' };
    const D = (id, n, o) => Object.assign({ id, n, dir: true, kind: 'game', stage: 0 }, o || {});
    const F = (id, n, o) => Object.assign({ id, n, dir: false, kind: 'game', stage: 0 }, o || {});
    const sw = (stage, m, o) => Object.assign({ kind: 'sw', stage, m }, o || {});
    const shipped = () => [F('ship.dll', 'Stitchwork.dll', { kind: 'ships' }), F('ship.bundle', 'stitchwork.assetbundle', { kind: 'ships' }),
      D('ship.lang', 'Lang', { kind: 'ships' }), F('ship.license', 'LICENSE', { kind: 'ships' }), D('ship.licenses', 'LICENSES', { kind: 'ships' })];
    const state = () => [F('cfg', 'Stitchwork.cfg', sw(1, C.tools)),
      D('state', 'Stitchwork', sw(1, C.packs, { scope: 'profile', kids: [
        F('state.stats', 'packs-stats.txt', sw(1, C.packs)), F('state.packs', 'packs.txt', sw(2, C.packs)),
        F('state.cond', 'packs-conditions.txt', sw(2, C.packs)), D('state.profiles', 'Profiles', sw(2, C.packs))] }))];
    const data = () => D('data', 'Hollow Knight Silksong_Data', { kids: [
      F('data.boot', 'boot.config', { edit: 1 }), F('data.bootbak', 'boot.config.stitchwork-bak', sw(1, C.tools)),
      D('data.mods', 'Mods', { kind: 'cust', cust: true, kids: [D('data.cust', 'Customizer', { kind: 'cust', cust: true, kids: [
        D('data.cust.skin', 'MySkin', { kind: 'cust', cust: true, kids: [F('data.cust.active', 'active.txt', { kind: 'cust', cust: true }),
          D('data.cust.coll', 'Knight', { kind: 'cust', cust: true }), D('data.cust.t2d', 'Texture2D', { kind: 'cust', cust: true })] })] })] })] });

    const packFiles = () => [F('pk.json', 'pack.json', { kind: 'user', stage: 2 }), D('pk.sprites', 'Sprites', { kind: 'user', stage: 2 }),
      D('pk.sounds', 'Sounds', { kind: 'user', stage: 2 }), D('pk.text', 'Text', { kind: 'user', stage: 2 })];
    const packs = () => D('packs', 'Packs', sw(1, C.packs, { scope: 'shared', kids: [
      D('packs.user', 'CrystalHornet', { kind: 'user', stage: 2, lost: ui.lost, kids: ui.lost ? packFiles()
        : [D('packs.user.sw', 'Stitchwork', { kind: 'user', stage: 2, shut: true, kids: packFiles() })] }),
      D('packs.convert', 'MySkin (Stitchwork)', sw(2, C.packs, { cust: true }))] }));
    const work = () => D('work', 'Stitchwork', sw(1, C.bone, { scope: 'shared', kids: [
      D('work.sprites', 'Sprites', sw(1, C.graphics, { kids: [
        D('work.sprites.coll', 'Knight', sw(2, C.graphics, { kids: [D('work.sprites.clips', 'Clips', sw(2, C.graphics)), D('work.sprites.wip', 'Run_WIP', sw(2, C.graphics))] })),
        D('work.sprites.t2d', 'T2D', sw(1, C.graphics))] })),
      D('work.sheets', 'Spritesheets', sw(1, C.graphics)), D('work.sounds', 'Sounds', sw(1, C.audio)), D('work.videos', 'Videos', sw(1, C.video)),
      D('work.text', 'Text', sw(1, C.text)), D('work.fonts', 'Fonts', sw(1, C.text)), D('work.recolor', 'Recolor', sw(1, C.graphics)),
      D('work.dumps', 'Dumps', sw(1, C.tools, { shut: true, kids: [D('work.dumps.sprites', 'Sprites', sw(1, C.tools)), D('work.dumps.sheets', 'Spritesheets', sw(1, C.tools)),
        D('work.dumps.text', 'Text', sw(1, C.tools)), D('work.dumps.sounds', 'Sounds', sw(2, C.tools))] })),
      D('work.lang', 'Lang', sw(2, C.text)), D('work.converted', 'Converted', sw(2, C.graphics)), D('work.showcase', 'Showcase', sw(2, C.graphics)),
      D('work.backups', 'Backups', sw(2, C.tools)), D('work.doctor', 'doctor-reports', sw(2, C.tools)),
      D('work.diagnostics', 'diagnostics', sw(2, C.tools)),
      F('work.audiocat', 'audio-catalog.txt', sw(2, C.audio))] }));
    const TREES = {
      manual: () => [D('game', 'Hollow Knight Silksong', { root: true, path: '…/steamapps/common/', kids: [
        D('bep', 'BepInEx', { kind: 'loader', kids: [
          D('bep.plugins', 'plugins', { kind: 'loader', kids: [D('install.manual', 'StitchworkRoot', { kind: 'ships', kids: shipped() })] }),
          D('bep.config', 'config', { kind: 'loader', kids: state() })] }),
        data(), packs(), work()] })],
      cogfly: () => [
        D('game', 'Hollow Knight Silksong', { root: true, scope: 'shared', path: '…/steamapps/common/', kids: [data(), packs(), work()] }),
        D('profile', 'MyProfile', { root: true, kind: 'mgr', scope: 'profile', path: '…/Cogfly/profiles/', kids: [
          D('bep', 'BepInEx', { kind: 'mgr', kids: [
            D('bep.plugins', 'plugins', { kind: 'mgr', kids: [
              D('install.mgr', 'SilksongSkinCreators-Stitchwork', { kind: 'mgr', kids: [F('mgr.manifest', 'manifest.json', { kind: 'mgr' }), F('mgr.icon', 'icon.png', { kind: 'mgr' }),
                F('mgr.readme', 'README.md', { kind: 'mgr' }), F('mgr.changes', 'CHANGES.md', { kind: 'mgr' })].concat(shipped()) }),
              D('mgr.pack', 'SomeTeam-CrystalHornet', { kind: 'mgr', stage: 2, kids: [D('packs.user.sw', 'Stitchwork', { kind: 'mgr', stage: 2 })] }),
              D('mgr.custskin', 'SomeTeam-MySkin', { kind: 'cust', cust: true })] }),
            D('bep.config', 'config', { kind: 'mgr', kids: state() })] })] })],
    };

    const SVG = (p, cls) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
    const P = {
      folder: '<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>',
      open: '<path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.964 1.625h-14.026a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v2"/>',
      file: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/>',
      drive: '<path d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"/><path d="M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"/><path d="M7 8l0 .01"/><path d="M7 16l0 .01"/>',
      chev: '<path d="M6 9l6 6l6 -6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    };
    const STAGES = 3;
    const ui = { mode: host.dataset.mode === 'cogfly' ? 'cogfly' : 'manual', stage: 0, cust: false, sel: null, shut: new Set(), lost: false, pin: true };
    const view = host.dataset.view === 'folder', flip = view && host.dataset.flip === 'lost';
    if (view) ui.stage = Math.max(0, Math.min(STAGES - 1, +host.dataset.stage || 0));
    const WARN = '255, 191, 51', OK = '51, 171, 135';
    const mount = host.querySelector('.swx-mount');
    const flipTabs = () => !flip ? '' : `<div class="swx-ctl"><div class="swx-modes swx-flip" role="tablist">${['found', 'lost'].map(f =>
      `<button type="button" role="tab" data-f="${f}">${esc(T('ui.' + f))}</button>`).join('')}</div></div>`;
    mount.innerHTML = `<div class="swx-tab"><i class="grip"></i>${esc(T('ui.title'))}<i class="swx-lamp"></i></div>
      <div class="swx-plate${view ? ' pinned' : ''}">
        ${view ? flipTabs() : `<div class="swx-ctl">
          <div class="swx-modes" role="tablist">${['manual', 'cogfly'].map(m => `<button type="button" role="tab" data-m="${m}">${esc(T('ui.mode.' + m))}</button>`).join('')}</div>
          <button type="button" class="swx-cust" role="switch" aria-checked="false"><i class="sw"></i>${esc(T('ui.cust'))}</button>
        </div>
        <div class="swx-time">
          <div class="swx-track"><span class="seam"></span><span class="fill"></span></div>
          <div class="swx-stops" role="radiogroup">${[0, 1, 2].map(s => `<button type="button" class="swx-stop" role="radio" data-s="${s}"><i class="knot"></i>${esc(T('ui.stage.' + s))}</button>`).join('')}</div>
          <div class="swx-says">${[0, 1, 2].map(s => `<p data-s="${s}">${T('ui.stage.' + s, 'what')} <span class="swx-count"></span></p>`).join('')}</div>
        </div>`}
        <div class="swx-addr">${SVG(P.drive, 'ad')}<span class="swx-crumbs"></span></div>
        <div class="swx-body"><div class="swx-tree" role="tree"></div><div class="swx-detail"></div></div>
        <div class="swx-legend">
          <span data-leg="sw">${SVG(P.folder, '').replace('<svg', `<svg style="stroke: rgb(${C.graphics}); fill: rgba(${C.graphics}, .16); stroke-dasharray: 2.2 1.7"`)}${esc(T('ui.leg.sw'))}</span>
          <span data-leg="ships">${SVG(P.folder, '').replace('<svg', `<svg style="stroke: rgb(${C.bone}); fill: rgba(${C.bone}, .85)"`)}${esc(T('ui.leg.ships'))}</span>
          <span data-leg="other">${SVG(P.folder, '').replace('<svg', '<svg style="stroke: #8F8F97"')}${esc(T('ui.leg.other'))}</span>
          <span data-leg="cust">${SVG(P.folder, '').replace('<svg', `<svg style="stroke: rgb(${C.cust})"`)}${esc(T('ui.leg.cust'))}</span>
        </div>
      </div>`;
    const $ = s => mount.querySelector(s), $$ = s => [...mount.querySelectorAll(s)];
    const treeEl = $('.swx-tree'), detEl = $('.swx-detail'), body = $('.swx-body');
    let index = new Map(), prevVisible = new Set(), target = '';

    const visible = n => n.stage <= ui.stage && (!n.cust || ui.cust);
    const found = n => flip && !ui.lost && n.id === 'packs.user.sw';
    const whoOf = n => n.lost ? T('who.lost') : found(n) ? T('who.found') : n.root ? (ui.mode === 'cogfly' ? T('who.' + n.scope) : T('who.game'))
      : n.kind === 'sw' ? T('who.sw') : n.kind === 'mgr' ? T('who.mgr') : T('who.' + n.kind);
    const keyOf = (n, trail) => trail.concat(n.id).join('/');

    const keyFor = (nodes, id, trail = []) => { for (const n of nodes) { if (!visible(n)) continue; if (n.id === id) return keyOf(n, trail);
      const k = keyFor(n.kids || [], id, trail.concat(n.id)); if (k) return k; } return null; };
    const defShut = (n, key) => view ? !(key === target || target.startsWith(key + '/')) : !!n.shut;

    function render() {
      const roots = TREES[ui.mode]();
      if (view) { target = keyFor(roots, ui.lost ? 'packs.user' : host.dataset.open) || ''; if (ui.pin) { ui.sel = target; ui.pin = false; } }
      index = new Map();
      const nowVisible = new Set();
      treeEl.innerHTML = '';
      const walk = (nodes, depth, parent, trail, open = true) => nodes.forEach(n => {
        if (!visible(n)) return;
        const key = keyOf(n, trail);
        nowVisible.add(key);
        index.set(key, { n, trail, shown: open });
        const row = document.createElement('div');
        const kids = (n.kids || []).filter(visible);
        const isShut = ui.shut.has(key) || (defShut(n, key) && !ui.shut.has('open:' + key));
        row.className = `swx-row k-${n.kind}${n.root ? ' root' : ''}${kids.length && isShut ? ' shut' : ''}${prevVisible.size && !prevVisible.has(key) ? ' sewn' : ''}${ui.sel === key ? ' sel' : ''}${n.lost ? ' lost' : ''}${found(n) ? ' found' : ''}`;
        row.setAttribute('role', 'treeitem'); row.tabIndex = ui.sel === key || (!ui.sel && depth === 0 && parent === treeEl) ? 0 : -1;
        row.dataset.key = key;
        row.style.setProperty('--d', depth);
        if (n.m) row.style.setProperty('--m', n.m);
        if (n.kind === 'cust') row.style.setProperty('--m', C.cust);
        if (n.lost) row.style.setProperty('--m', WARN);
        if (found(n)) row.style.setProperty('--m', OK);
        const fresh = n.kind === 'sw' && n.stage === ui.stage && ui.stage > 0;
        row.innerHTML = (kids.length ? SVG(P.chev, 'chev') : '<span></span>')
          + SVG(n.root ? P.drive : n.dir ? (kids.length && !isShut ? P.open : P.folder) : P.file, 'ic')
          + `<span class="nm">${esc(n.n)}${n.dir && !n.root ? '/' : ''}${fresh ? '<i class="new"></i>' : ''}</span>`
          + `<span class="who">${esc(whoOf(n))}</span>`;
        parent.appendChild(row);
        if (kids.length) {
          const box = document.createElement('div');
          box.className = 'swx-kids' + (n.kind === 'sw' ? ' k-sw' : '') + (isShut ? ' shut' : '') + (n.lost ? ' lost' : '');
          box.style.setProperty('--d', depth);
          if (n.m) box.style.setProperty('--m', n.m);
          parent.appendChild(box);
          walk(n.kids, depth + 1, box, trail.concat(n.id), open && !isShut);
        }
      });
      walk(roots, 0, treeEl, []);
      prevVisible = nowVisible;
      if (ui.sel && !index.has(ui.sel)) ui.sel = null;
      if (view) {
        $$('.swx-flip button').forEach(b => { const on = (b.dataset.f === 'lost') === ui.lost; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });

        const leg = new Set([...index.values()].filter(e => e.shown).map(({ n }) => ['sw', 'ships', 'cust'].includes(n.kind) ? n.kind : 'other'));
        $$('.swx-legend [data-leg]').forEach(s => { s.hidden = !leg.has(s.dataset.leg); });
        detail();
        return;
      }
      $$('.swx-modes button').forEach(b => { b.classList.toggle('on', b.dataset.m === ui.mode); b.setAttribute('aria-selected', b.dataset.m === ui.mode); });
      $('.swx-cust').setAttribute('aria-checked', ui.cust);
      $$('.swx-stop').forEach(b => { const s = +b.dataset.s; b.classList.toggle('on', s === ui.stage); b.classList.toggle('done', s < ui.stage); b.setAttribute('aria-checked', s === ui.stage); });
      $('.swx-track').style.setProperty('--pos', (ui.stage / (STAGES - 1) * 100) + '%');
      $$('.swx-says p').forEach(p => p.classList.toggle('on', +p.dataset.s === ui.stage));
      const added = [...index.values()].filter(({ n }) => n.kind === 'sw').length;
      $$('.swx-count').forEach(c => { c.textContent = added ? T('ui.count').replace('{n}', added) : T('ui.count0'); });
      detail();
    }

    function detail() {
      const it = ui.sel && index.get(ui.sel);
      $$('.swx-row').forEach(r => r.classList.toggle('sel', r.dataset.key === ui.sel));

      const phone = matchMedia('(max-width: 640px)').matches;
      const row = it && treeEl.querySelector(`.swx-row[data-key="${CSS.escape(ui.sel)}"]`);
      if (phone && row) { row.after(detEl); detEl.style.setProperty('--d', row.style.getPropertyValue('--d')); }
      else if (detEl.parentElement !== body) body.appendChild(detEl);
      if (!it) { detEl.innerHTML = `<p class="hint">${esc(T('ui.hint'))}</p>`; crumbs(null); return; }
      const { n, trail } = it;
      const chips = [];
      if (n.lost) chips.push(`<span class="chip lost">${esc(T('ui.lost'))}</span>`);
      if (found(n)) chips.push(`<span class="chip found">${esc(T('ui.found'))}</span>`);
      if (n.kind === 'sw') chips.push(`<span class="chip sw">${esc(T(n.stage === 1 ? 'chip.sw1' : 'chip.sw2'))}</span>`);
      else if (n.kind === 'ships') chips.push(`<span class="chip ships">${esc(T('chip.ships'))}</span>`);
      else if (n.kind === 'mgr') chips.push(`<span class="chip">${esc(T('chip.mgr'))}</span>`);
      else if (n.kind === 'cust') chips.push(`<span class="chip cust">${esc(T('chip.cust'))}</span>`);
      else if (n.kind === 'user') chips.push(`<span class="chip">${esc(T('chip.user'))}</span>`);
      else chips.push(`<span class="chip">${esc(T(n.kind === 'loader' ? 'chip.loader' : 'chip.game'))}</span>`);
      if (n.edit && ui.stage >= n.edit) chips.push(`<span class="chip sw" style="--m: ${C.tools}">${esc(T('chip.edit'))}</span>`);
      const top = trail.length ? index.get(trail.slice(0, 1).join('/')) : null;
      const scope = n.scope || (top ? top.n.scope : null);
      if (ui.mode === 'cogfly' && scope) chips.push(`<span class="chip scope">${esc(T('chip.' + scope))}</span>`);

      const here = location.pathname.split('/').pop();
      const when = n.kind === 'sw' ? T(n.id, 'when') : '', see0 = T(n.id, 'see'), see = here && see0.includes(`href="${here}"`) ? '' : see0;
      detEl.style.setProperty('--m', n.lost ? WARN : found(n) ? OK : n.kind === 'cust' ? C.cust : n.m || C.bone);
      detEl.innerHTML = `<p class="dn">${esc(n.n)}${n.dir && !n.root ? '/' : ''}</p><div class="chips">${chips.join('')}</div>`
        + `<p class="dw">${T(n.lost ? 'lost' : n.id, 'what')}${when ? ' <span class="dwhen">' + when + '</span>' : ''}</p>`
        + `<p class="dp">${esc(pathOf(it))}</p>`
        + (see ? `<p class="ds">${esc(T('ui.see'))} ${see}</p>` : '');
      crumbs(it);
    }
    function pathOf(it) {
      const parts = [], trail = it.trail.concat(it.n.id);
      for (let i = 1; i <= trail.length; i++) { const e = index.get(trail.slice(0, i).join('/')); if (e) parts.push(e.n); }
      const top = parts[0];
      return (top && top.path ? top.path : '') + parts.map(p => p.n + (p.dir ? '/' : '')).join('');
    }
    function crumbs(it) {
      const el = $('.swx-addr .swx-crumbs');
      if (!it) { el.innerHTML = '<i>…</i>'; return; }
      const parts = [], trail = it.trail.concat(it.n.id);
      for (let i = 1; i <= trail.length; i++) { const e = index.get(trail.slice(0, i).join('/')); if (e) parts.push(e.n.n); }
      el.innerHTML = parts.map((p, i) => i === parts.length - 1 ? `<b>${esc(p)}</b>` : esc(p)).join('<i>›</i>');
    }
    function toggle(key) {
      const e = index.get(key); if (!e || !(e.n.kids || []).some(visible)) return;
      const shutNow = treeEl.querySelector(`.swx-row[data-key="${CSS.escape(key)}"]`).classList.contains('shut');
      if (defShut(e.n, key)) { if (shutNow) ui.shut.add('open:' + key); else ui.shut.delete('open:' + key); }
      else { if (shutNow) ui.shut.delete(key); else ui.shut.add(key); }
      prevVisible = new Set([...index.keys()]);
      render();
      focusRow(key);
    }
    function focusRow(key) { const r = treeEl.querySelector(`.swx-row[data-key="${CSS.escape(key)}"]`); if (r) { $$('.swx-row').forEach(x => { x.tabIndex = -1; }); r.tabIndex = 0; r.focus({ preventScroll: true }); } }

    treeEl.addEventListener('click', e => {
      const row = e.target.closest('.swx-row'); if (!row) return;
      const key = row.dataset.key;
      if (e.target.closest('.chev')) { toggle(key); return; }
      ui.sel = key; detail(); focusRow(key);
    });
    treeEl.addEventListener('dblclick', e => { const row = e.target.closest('.swx-row'); if (row) toggle(row.dataset.key); });
    treeEl.addEventListener('keydown', e => {
      const rows = $$('.swx-row').filter(r => r.offsetParent !== null), i = rows.indexOf(document.activeElement);
      if (i < 0) return;
      const key = rows[i].dataset.key;
      if (e.key === 'ArrowDown' && rows[i + 1]) { e.preventDefault(); ui.sel = rows[i + 1].dataset.key; detail(); focusRow(ui.sel); }
      else if (e.key === 'ArrowUp' && rows[i - 1]) { e.preventDefault(); ui.sel = rows[i - 1].dataset.key; detail(); focusRow(ui.sel); }
      else if ((e.key === 'ArrowRight' && rows[i].classList.contains('shut')) || (e.key === 'ArrowLeft' && !rows[i].classList.contains('shut') && rows[i].querySelector('.chev'))) { e.preventDefault(); toggle(key); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ui.sel = key; detail(); }
    });
    addEventListener('resize', () => detail());

    $$('.swx-flip button').forEach(b => b.addEventListener('click', () => { const lost = b.dataset.f === 'lost'; if (lost === ui.lost) return;
      ui.lost = lost; ui.pin = true; ui.shut = new Set(); render(); }));
    if (view) { render(); return; }
    $$('.swx-modes button').forEach(b => b.addEventListener('click', () => { if (ui.mode === b.dataset.m) return; ui.mode = b.dataset.m; ui.sel = null; prevVisible = new Set(); render(); }));
    $('.swx-cust').addEventListener('click', () => { ui.cust = !ui.cust; render(); });
    const setStage = s => { s = Math.max(0, Math.min(STAGES - 1, s)); if (s === ui.stage) return; ui.stage = s; render(); };
    $$('.swx-stop').forEach(b => b.addEventListener('click', () => setStage(+b.dataset.s)));
    $('.swx-stops').addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setStage(ui.stage + (e.key === 'ArrowRight' ? 1 : -1)); $$('.swx-stop')[ui.stage].focus(); } });

    $('.swx-time').addEventListener('pointerdown', e => {
      if (!e.target.closest('.swx-track, .swx-stop')) return;
      const r = $('.swx-track').getBoundingClientRect();
      const pick = x => setStage(Math.round((x - r.left) / r.width * (STAGES - 1)));
      pick(e.clientX);
      const mv = ev => pick(ev.clientX), up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    render();
  };

  DEMOS['a1-install-folder'] = DEMOS['a2-packs-folder'] = DEMOS['install-explorer'];

  document.querySelectorAll('figure.demo[data-demo]').forEach(fig => {
    const run = DEMOS[fig.dataset.demo], root = fig.querySelector('[data-dm-root]');
    if (run && root) run(root);
  });
})();
