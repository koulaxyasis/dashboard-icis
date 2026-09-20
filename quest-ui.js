// =============================================================
// ICIS — shared quest UI.
//
// Two distinct lists, rendered the same way wherever they appear:
//
//   DAILY QUESTS   the five the engine picks for you each day.
//                  Rotating, automated, not editable.
//
//   MY QUESTS      the ones you write yourself. Backed by the same
//                  `goals:<date>` keys the Quest Board has always used,
//                  so the streak, the archive and the goal ticker keep
//                  working and nothing is migrated.
//
// The Hub and the Quest Board both mount these, so the two surfaces can
// never drift apart visually or behaviourally.
//
// NOTE ON THE DAY KEY: personal quests use the Quest Board's own 6 AM
// rollover, not midnight, because they share its storage. The daily
// quest engine is separate and resets at local midnight by spec.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState, QE = window.QuestEngine, UI = window.UI;

  // ---------------------------------------------------------------
  // Personal quest storage — the Quest Board's 6 AM day boundary.
  // ---------------------------------------------------------------
  function personalDateKey() {
    var now = new Date();
    var d = new Date(now);
    if (now.getHours() < 6) d.setDate(d.getDate() - 1);
    return GS.dateKey(d);
  }
  function personalKey() { return 'goals:' + personalDateKey(); }

  function readPersonal() {
    var list = GS.readJSON(personalKey(), []);
    return Array.isArray(list) ? list : [];
  }
  function writePersonal(list) {
    GS.writeJSON(personalKey(), list);
    // The Quest Board listens for this to redraw its ticker, ring and bar.
    try { window.dispatchEvent(new CustomEvent('goals-changed')); } catch (e) {}
    GS.reconcile();
  }

  function addPersonal(text) {
    var t = String(text || '').trim();
    if (!t) return false;
    var list = readPersonal();
    list.push({ text: t.slice(0, 160), done: false });
    writePersonal(list);
    return true;
  }
  function togglePersonal(index) {
    var list = readPersonal();
    if (!list[index]) return;
    list[index].done = !list[index].done;
    if (list[index].done) list[index].doneAt = Date.now();
    else delete list[index].doneAt;
    writePersonal(list);
  }
  function removePersonal(index) {
    var list = readPersonal();
    if (!list[index]) return;
    list.splice(index, 1);
    writePersonal(list);
  }

  // ---------------------------------------------------------------
  // CSS — one definition, both surfaces.
  // ---------------------------------------------------------------
  var CSS = `
.qsec { display:flex; align-items:baseline; justify-content:space-between; gap:8px 12px;
        margin:26px 0 12px; flex-wrap:wrap; }
.qsec-t { font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); }
.qsec-m { font-size:11px; color:var(--text-3); font-family:var(--mono); }
.qsec-note { font-size:11px; color:var(--text-3); }

.qmode { display:inline-flex; border:1px solid var(--line); border-radius:10px; overflow:hidden; }
.qmode button { border:0; background:transparent; color:var(--text-3); font:inherit;
                font-size:11px; font-weight:700; padding:6px 10px; cursor:pointer; }
.qmode button.on { background:rgba(233,190,110,.16); color:var(--gold); }

.q { display:flex; align-items:flex-start; gap:12px; padding:13px 14px; margin-bottom:8px;
     background:var(--panel); border:1px solid var(--line); border-radius:var(--r-lg); }
.q.done { border-color:rgba(107,227,164,.28); background:rgba(107,227,164,.05); }
.q.pinned { border-color:rgba(233,190,110,.38); }
.q-box { width:23px; height:23px; flex:none; margin-top:1px; border-radius:7px; cursor:pointer; padding:0;
         border:1.5px solid var(--line-2); background:transparent; display:grid; place-items:center;
         color:transparent; }
.q-box.on { background:var(--ok); border-color:var(--ok); color:#08130E; }
.q-b { flex:1; min-width:0; }
.q-lore { font-size:9.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--gold); }
.q-t { font-size:13.5px; font-weight:650; color:var(--text); margin-top:2px; line-height:1.3; }
.q.done .q-t { color:var(--ok); text-decoration:line-through; }
.q-d { font-size:11.5px; color:var(--text-3); margin-top:3px; line-height:1.4; }
.q-tags { display:flex; gap:5px; margin-top:6px; flex-wrap:wrap; }
.q-r { flex:none; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
.q-xp { font-family:var(--mono); font-size:12px; font-weight:700; color:var(--gold); }
.q-min { font-size:9.5px; color:var(--text-3); }
.q-del { border:0; background:transparent; color:var(--text-3); cursor:pointer; padding:2px; line-height:0; }
.q-del:hover { color:var(--bad); }

.q-add { display:flex; gap:7px; margin-top:4px; }
.q-add input { flex:1; min-width:0; }
`;

  function injectCss() {
    if (document.getElementById('quest-ui-css')) return;
    var st = document.createElement('style');
    st.id = 'quest-ui-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------------------
  // DAILY QUESTS — automated, five a day
  // ---------------------------------------------------------------
  function dailyHtml(opts) {
    var v = QE.todayView();
    var rows = v.list.map(function (q) {
      return '<div class="q' + (q.done ? ' done' : '') + (q.pinned ? ' pinned' : '') + '">' +
        '<button class="q-box' + (q.done ? ' on' : '') + '" data-dq="' + UI.esc(q.id) + '" ' +
          'aria-label="Toggle quest">' + UI.icon('check', 14) + '</button>' +
        '<div class="q-b">' +
          '<div class="q-lore">' + UI.esc(q.loreTitle) + '</div>' +
          '<div class="q-t">' + UI.esc(q.practicalTitle) + '</div>' +
          (opts && opts.compact ? '' : '<div class="q-d">' + UI.esc(q.description) + '</div>') +
          '<div class="q-tags">' +
            '<span class="chip' + (q.pinned ? ' on' : '') + '">' + UI.esc(q.reason || q.slot) + '</span>' +
            '<span class="chip">' + UI.esc(q.difficulty) + '</span>' +
            (q.rolledOver ? '<span class="chip on">carried over</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="q-r"><div class="q-xp">+' + q.xp + '</div>' +
          '<div class="q-min">' + q.estimatedMinutes + 'm</div></div>' +
      '</div>';
    }).join('');
    return { html: rows, view: v };
  }

  function mountDaily(elOrId, opts) {
    injectCss();
    opts = opts || {};
    var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;

    function draw() {
      var r = dailyHtml(opts);
      var v = r.view;
      el.innerHTML =
        '<div class="qsec">' +
          '<span class="qsec-t">Daily Quests</span>' +
          '<span class="row" style="gap:8px">' +
            '<span class="qmode" data-qmode>' +
              ['light', 'normal', 'ambitious'].map(function (m) {
                return '<button data-mode="' + m + '"' + (v.mode === m ? ' class="on"' : '') + '>' +
                  m.charAt(0).toUpperCase() + m.slice(1) + '</button>';
              }).join('') +
            '</span>' +
            '<button class="btn sm" data-reroll' + (v.rerollUsed ? ' disabled' : '') + '>' +
              UI.icon('dice', 14) + (v.rerollUsed ? ' Used' : ' Reroll') + '</button>' +
          '</span>' +
        '</div>' +
        '<div class="qsec-note" style="margin:-6px 0 10px">Chosen for you each day. Resets at midnight.</div>' +
        r.html +
        '<div class="qsec-m" style="margin-top:6px">' + v.done + ' of ' + v.total + ' complete' +
          (v.minutes ? ' · about ' + v.minutes + ' minutes left' : ' · board cleared') + '</div>';
    }

    el.addEventListener('click', function (e) {
      var box = e.target.closest('[data-dq]');
      if (box) {
        var id = box.getAttribute('data-dq');
        var q = QE.todayView().list.filter(function (x) { return x.id === id; })[0];
        if (!q) return;
        if (q.done) QE.uncomplete(id);
        else {
          QE.complete(id);
          UI.toast('check', 'Quest complete', q.practicalTitle, '+' + q.xp + ' XP · ' + q.loreTitle);
        }
        draw();
        if (opts.onChange) opts.onChange();
        return;
      }
      var m = e.target.closest('[data-mode]');
      if (m) { QE.setMode(m.getAttribute('data-mode')); draw(); if (opts.onChange) opts.onChange(); return; }
      var rr = e.target.closest('[data-reroll]');
      if (rr) {
        var res = QE.reroll();
        UI.toast('dice', 'Reroll', res.ok ? 'The board has been redrawn' : res.reason,
                 res.ok ? 'One reroll per day' : '');
        draw();
        if (opts.onChange) opts.onChange();
      }
    });

    draw();
    return { redraw: draw };
  }

  // ---------------------------------------------------------------
  // MY QUESTS — written by you
  // ---------------------------------------------------------------
  function mountPersonal(elOrId, opts) {
    injectCss();
    opts = opts || {};
    var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;

    function draw() {
      var list = readPersonal();
      var done = list.filter(function (g) { return g && g.done; }).length;
      var rows = list.length ? list.map(function (g, i) {
        return '<div class="q' + (g.done ? ' done' : '') + '">' +
          '<button class="q-box' + (g.done ? ' on' : '') + '" data-pq="' + i + '" ' +
            'aria-label="Toggle quest">' + UI.icon('check', 14) + '</button>' +
          '<div class="q-b"><div class="q-t">' + UI.esc(g.text) + '</div></div>' +
          '<div class="q-r">' +
            '<span class="q-xp">+' + GS.XP.goal + '</span>' +
            '<button class="q-del" data-pqdel="' + i + '" aria-label="Remove">' +
              UI.icon('close', 13) + '</button>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="empty">Nothing of your own yet. Add the thing you actually need to do today.</div>';

      el.innerHTML =
        '<div class="qsec">' +
          '<span class="qsec-t">My Quests</span>' +
          '<span class="qsec-m">' + done + ' / ' + list.length + '</span>' +
        '</div>' +
        '<div class="qsec-note" style="margin:-6px 0 10px">Written by you. Every one kept counts toward your streak.</div>' +
        rows +
        (opts.readOnly ? '' :
          '<div class="q-add">' +
            '<input data-pqin placeholder="Add a quest of your own…" maxlength="160" autocomplete="off">' +
            '<button class="btn gold" data-pqadd>Add</button>' +
          '</div>');
    }

    el.addEventListener('click', function (e) {
      var box = e.target.closest('[data-pq]');
      if (box) { togglePersonal(Number(box.getAttribute('data-pq'))); draw(); if (opts.onChange) opts.onChange(); return; }
      var del = e.target.closest('[data-pqdel]');
      if (del) { removePersonal(Number(del.getAttribute('data-pqdel'))); draw(); if (opts.onChange) opts.onChange(); return; }
      var add = e.target.closest('[data-pqadd]');
      if (add) {
        var inp = el.querySelector('[data-pqin]');
        if (inp && addPersonal(inp.value)) { inp.value = ''; draw(); if (opts.onChange) opts.onChange(); }
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var inp = e.target.closest('[data-pqin]');
      if (inp && addPersonal(inp.value)) { inp.value = ''; draw(); if (opts.onChange) opts.onChange(); }
    });

    // Redraw when the Quest Board's own UI edits the same list.
    window.addEventListener('goals-changed', draw);

    draw();
    return { redraw: draw };
  }

  window.QuestUI = {
    mountDaily: mountDaily,
    mountPersonal: mountPersonal,
    readPersonal: readPersonal,
    addPersonal: addPersonal,
    personalDateKey: personalDateKey,
    CSS: CSS
  };
})();
