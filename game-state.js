// =============================================================
// ICIS — shared game state. One source of truth for all progression.
//
// Every page reads and writes `icisGameStateV2` through this module.
// Nothing else computes a level.
//
// ---- Why there is an XP ledger -------------------------------
// XP is never "added" by a page. Every award is an entry in
// `ledger`, keyed by a string that identifies the ACTION, not the
// moment it was noticed:
//
//     goal:2026-09-20        one entry for that whole day's goals
//     gym:2026-09-20         one entry per training day
//     task:<proj>:<task>     one entry per project task
//     quest:2026-09-20:q_17  one entry per quest per day
//
// Writing the same key twice overwrites instead of stacking, so:
//   * opening a page can never change your level,
//   * refreshing can never re-award anything,
//   * logging water forty times still earns one day's XP,
//   * and every page shows the same number because they all sum
//     the same ledger.
//
// `reconcile()` rebuilds the derived entries (goals, gym, water,
// caffeine, tasks, finance) from the tracker pages' own storage on
// every load. It is a pure function of that data, so running it a
// hundred times produces the identical ledger.
//
// ---- Day boundary --------------------------------------------
// Quests and daily resets use LOCAL MIDNIGHT (per spec). Note the
// goals page (main.html) rolls its own day over at 6 AM; that is
// its business, and `goalArchive` records whatever it had.
// =============================================================
(function () {
  'use strict';

  var KEY = 'icisGameStateV2';
  var SCHEMA = 2;

  // ---------------------------------------------------------------
  // Disciplines — one per world location.
  // ---------------------------------------------------------------
  var DISCIPLINES = [
    { id: 'career',    name: 'Career',     lore: 'Career Guild',       practical: 'Certifications & job hunt', color: '#E9BE6E', page: 'career.html' },
    { id: 'arcana',    name: 'Craft',      lore: "Adventurer's Guild", practical: 'Projects & deliverables',   color: '#A78BFA', page: 'guild.html' },
    { id: 'resolve',   name: 'Resolve',    lore: 'Quest Board',        practical: 'Daily goals & habits',      color: '#FBBF24', page: 'main.html' },
    { id: 'might',     name: 'Might',      lore: 'Training Grounds',   practical: 'Gym & training',            color: '#F87171', page: 'gym.html' },
    { id: 'vitality',  name: 'Vitality',   lore: 'Healing Spring',     practical: 'Water, sleep & recovery',   color: '#60A5FA', page: 'po-water.html' },
    { id: 'fellowship',name: 'Fellowship', lore: 'Tavern',             practical: 'Friends & social life',     color: '#F472B6', page: 'tavern.html' },
    { id: 'fortune',   name: 'Fortune',    lore: 'Treasury',           practical: 'Money & admin',             color: '#34D399', page: 'finance.html' }
  ];

  var RANKS = [
    { at: 1,  name: 'Wanderer',  sigil: 'F' },
    { at: 5,  name: 'Initiate',  sigil: 'E' },
    { at: 10, name: 'Adept',     sigil: 'D' },
    { at: 18, name: 'Knight',    sigil: 'C' },
    { at: 28, name: 'Warden',    sigil: 'B' },
    { at: 40, name: 'Paragon',   sigil: 'A' },
    { at: 55, name: 'Ascendant', sigil: 'S' },
    { at: 75, name: 'Mythic',    sigil: 'SS' }
  ];

  var CLASSES = [
    { id: 'strategist', name: 'Strategist', blurb: 'Plans the quarter before the week.', bonus: 'career' },
    { id: 'scholar',    name: 'Scholar',    blurb: 'Learns the model before running it.', bonus: 'arcana' },
    { id: 'monk',       name: 'Monk',       blurb: 'Keeps the streak when nobody watches.', bonus: 'resolve' },
    { id: 'vanguard',   name: 'Vanguard',   blurb: 'Trains first, negotiates later.', bonus: 'might' },
    { id: 'artificer',  name: 'Artificer',  blurb: 'Builds the dashboard that builds the habit.', bonus: 'fortune' }
  ];

  // Derived-XP rates. Keep these in one place so tuning is one edit.
  var XP = {
    goal: 15, perfectDay: 40,
    workoutDay: 70, volumePer: 300,
    waterHit: 30, waterPartial: 10,
    cleanCaffeine: 12,
    task: 25, project: 200,
    nwSnapshot: 20, nwActivity: 8, growthPer: 50, growthCap: 1200
  };

  // ---------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  // ---------------------------------------------------------------
  // Dates. `todayKey()` is LOCAL midnight-based — the day boundary
  // for quests, streaks and daily resets.
  // ---------------------------------------------------------------
  function dateKey(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function todayKey() { return dateKey(new Date()); }
  function shiftKey(key, days) {
    var p = String(key).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    d.setDate(d.getDate() + days);
    return dateKey(d);
  }
  function daysBetween(aKey, bKey) {
    var a = String(aKey).split('-').map(Number);
    var b = String(bKey).split('-').map(Number);
    var da = new Date(a[0], a[1] - 1, a[2]);
    var db = new Date(b[0], b[1] - 1, b[2]);
    return Math.round((db - da) / 86400000);
  }
  // Monday-anchored week containing `key`.
  function weekStart(key) {
    var p = String(key).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    var dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return dateKey(d);
  }
  function weekKeys(key) {
    var start = weekStart(key || todayKey());
    var out = [];
    for (var i = 0; i < 7; i++) out.push(shiftKey(start, i));
    return out;
  }

  // ---------------------------------------------------------------
  // Level curves
  // ---------------------------------------------------------------
  function curve(xp, base, step) {
    var level = 1, need = base, rem = Math.max(0, Math.floor(num(xp)));
    while (rem >= need && level < 999) { rem -= need; level++; need = base + (level - 1) * step; }
    return { level: level, into: rem, need: need, pct: need > 0 ? Math.min(1, rem / need) : 0, xp: Math.floor(num(xp)) };
  }
  function heroCurve(xp) { return curve(xp, 100, 45); }
  function skillCurve(xp) { return curve(xp, 60, 25); }
  function rankFor(level) {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (level >= RANKS[i].at) r = RANKS[i];
    return r;
  }
  function nextRankFor(level) {
    for (var i = 0; i < RANKS.length; i++) if (level < RANKS[i].at) return RANKS[i];
    return null;
  }

  // ---------------------------------------------------------------
  // Blank state
  // ---------------------------------------------------------------
  function blank() {
    return {
      v: SCHEMA,
      createdAt: Date.now(),
      player: {
        name: 'Icis',
        className: '',          // '' = derive from strongest discipline
        classId: '',
        title: '',
        portrait: 'aurora',
        border: 'plain',
        background: 'deepnight',
        unlockedTitles: [],
        unlockedCosmetics: []
      },
      career: { chapters: {}, skills: {}, lastActionAt: 0, evidence: [] },
      quests: { date: '', list: [], mode: 'normal', rerollUsed: false, rolledOver: null, previewDate: '' },
      questHistory: {},          // date -> { list:[{id,done,xp}], mode }
      questUsage: {},            // templateId -> { last: 'YYYY-MM-DD', week: {…} }
      projects: {},              // pm project id -> { bossName, difficulty, phases:[…] }
      achievements: {},          // id -> unlockedAt
      social: { people: [], plans: [], memories: [] },
      nova: { enabled: true, recent: [], dismissedAt: 0 },
      rewards: { claimed: [] },
      settings: { reducedMotion: false, novaEnabled: true, showPractical: true },
      ledger: {},                // dedupeKey -> { xp, disc, at }
      goalArchive: {},           // date -> { d, t }  (survives main.html's sweep)
      streakShields: 0,
      lastSeen: { level: 0, disciplines: {}, achievements: [] }
    };
  }

  // ---------------------------------------------------------------
  // Load + migrate. Never destructive: the tracker pages keep owning
  // their own keys, we only read them.
  // ---------------------------------------------------------------
  var cache = null;

  function migrate(s) {
    var changed = false;
    // A first run still has to pick up v1 data below, so start from a
    // blank state and fall through rather than returning early.
    if (!s || typeof s !== 'object') { s = blank(); changed = true; }

    // Fill in anything a newer schema added.
    var base = blank();
    Object.keys(base).forEach(function (k) {
      if (!(k in s)) { s[k] = base[k]; changed = true; }
    });
    Object.keys(base.player).forEach(function (k) {
      if (s.player && !(k in s.player)) { s.player[k] = base.player[k]; changed = true; }
    });
    Object.keys(base.settings).forEach(function (k) {
      if (s.settings && !(k in s.settings)) { s.settings[k] = base.settings[k]; changed = true; }
    });

    // v1 (rpg.js) -> v2. Carry over the hero profile and the goal archive
    // rather than starting the user from zero.
    var hero = readJSON('rpg:hero', null);
    if (hero && !s._heroMigrated) {
      if (hero.name) s.player.name = String(hero.name).slice(0, 24);
      if (hero.className) s.player.className = String(hero.className).slice(0, 24);
      s._heroMigrated = true;
      changed = true;
    }
    var archive = readJSON('rpg:archive', null);
    if (archive && typeof archive === 'object') {
      Object.keys(archive).forEach(function (d) {
        if (!s.goalArchive[d]) { s.goalArchive[d] = archive[d]; changed = true; }
      });
    }
    if (s.v !== SCHEMA) { s.v = SCHEMA; changed = true; }
    return { state: s, changed: changed };
  }

  function load() {
    if (cache) return cache;
    var raw = readJSON(KEY, null);
    var m = migrate(raw);
    cache = m.state;
    if (m.changed) writeJSON(KEY, cache);
    return cache;
  }

  function save() {
    if (!cache) return;
    writeJSON(KEY, cache);
    notify();
  }

  // ---------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------
  var subs = [];
  var notifyQueued = false;
  function subscribe(fn) {
    if (typeof fn === 'function') subs.push(fn);
    return function () { subs = subs.filter(function (f) { return f !== fn; }); };
  }
  function notify() {
    if (notifyQueued) return;
    notifyQueued = true;
    // Coalesce bursts of writes into one render pass.
    setTimeout(function () {
      notifyQueued = false;
      var snap = totals();
      subs.forEach(function (f) { try { f(snap); } catch (e) {} });
      try {
        document.dispatchEvent(new CustomEvent('icis:update', { detail: snap }));
      } catch (e) {}
    }, 0);
  }

  // ---------------------------------------------------------------
  // The ledger
  // ---------------------------------------------------------------
  // Idempotent. Returns true only when something actually changed, so
  // callers can tell a real award from a replay.
  function put(key, xp, disc, meta) {
    var s = load();
    var amount = Math.max(0, Math.round(num(xp)));
    var prev = s.ledger[key];
    if (prev && prev.xp === amount && prev.disc === disc) return false;
    s.ledger[key] = { xp: amount, disc: disc, at: (prev && prev.at) || Date.now() };
    if (meta && meta.text) s.ledger[key].text = String(meta.text).slice(0, 120);
    return true;
  }
  function has(key) { return !!load().ledger[key]; }
  function drop(key) {
    var s = load();
    if (!s.ledger[key]) return false;
    delete s.ledger[key];
    return true;
  }

  // Public award: use for explicit, user-driven events (quest done,
  // milestone cleared). `key` must identify the action uniquely.
  function award(key, xp, disc, meta) {
    var changed = put(key, xp, disc, meta);
    if (changed) save();
    return changed;
  }
  function revoke(key) {
    var changed = drop(key);
    if (changed) save();
    return changed;
  }

  // ---------------------------------------------------------------
  // Reconciliation — rebuild derived entries from the tracker pages.
  // Pure: same tracker data in, same ledger out.
  // ---------------------------------------------------------------
  function liveGoalDays() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('goals:') !== 0) continue;
      var list = readJSON(k, null);
      if (!Array.isArray(list) || !list.length) continue;
      out[k.slice(6)] = {
        done: list.filter(function (g) { return g && g.done; }).length,
        total: list.length,
        list: list
      };
    }
    return out;
  }

  function reconcile() {
    var s = load();
    var changed = false;

    // --- Goals. main.html deletes past days on load, so bank them first.
    var live = liveGoalDays();
    Object.keys(live).forEach(function (d) {
      var e = { d: live[d].done, t: live[d].total };
      var cur = s.goalArchive[d];
      if (!cur || cur.d !== e.d || cur.t !== e.t) { s.goalArchive[d] = e; changed = true; }
    });
    Object.keys(s.goalArchive).forEach(function (d) {
      var a = s.goalArchive[d];
      if (!a || num(a.t) <= 0) return;
      var xp = num(a.d) * XP.goal + (num(a.d) === num(a.t) ? XP.perfectDay : 0);
      if (put('goal:' + d, xp, 'resolve')) changed = true;
    });

    // --- Gym: one entry per training day (volume folded in).
    var gym = readJSON('po_coach_v1', {}) || {};
    var doneMap = readJSON('po_coach_workout_done', {}) || {};
    var days = {};
    Object.keys(doneMap).forEach(function (d) { if (doneMap[d]) days[d] = days[d] || { vol: 0, sets: 0 }; });
    var logs = (gym && typeof gym.logs === 'object' && gym.logs) || {};
    Object.keys(logs).forEach(function (exId) {
      var arr = logs[exId];
      if (!Array.isArray(arr)) return;
      arr.forEach(function (l) {
        if (!l || !l.date) return;
        var d = String(l.date).slice(0, 10);
        var rec = days[d] || (days[d] = { vol: 0, sets: 0 });
        rec.vol += num(l.weight) * num(l.reps);
        rec.sets += 1;
      });
    });
    Object.keys(days).forEach(function (d) {
      var xp = XP.workoutDay + Math.floor(days[d].vol / XP.volumePer);
      if (put('gym:' + d, xp, 'might')) changed = true;
    });

    // --- Water + caffeine: one entry per day each.
    var w = readJSON('po_water_v1', {}) || {};
    var perUnit = w.unit === 'glass' ? (num(w.glassMl) || 250) : (num(w.bottleMl) || 500);
    var kg = (w.profile && num(w.profile.weightKg)) || 75;
    var targetMl = Math.max(1500, Math.round(kg * 35));
    var wlogs = (w.logs && typeof w.logs === 'object') ? w.logs : {};
    Object.keys(wlogs).forEach(function (d) {
      var ml = num(wlogs[d]) * perUnit;
      if (ml <= 0) return;
      if (put('water:' + d, ml >= targetMl ? XP.waterHit : XP.waterPartial, 'vitality')) changed = true;
    });

    var limit = num(w.caffeineMgPerDay) || 400;
    var caf = readJSON('caf:logs', []) || [];
    var cafByDay = {};
    if (Array.isArray(caf)) {
      caf.forEach(function (l) {
        if (!l || !l.ts) return;
        var d = dateKey(new Date(num(l.ts)));
        cafByDay[d] = (cafByDay[d] || 0) + num(l.mg);
      });
    }
    Object.keys(cafByDay).forEach(function (d) {
      if (cafByDay[d] <= limit) { if (put('caf:' + d, XP.cleanCaffeine, 'vitality')) changed = true; }
      else if (drop('caf:' + d)) changed = true;
    });

    // --- Projects: per task and per finished project.
    var projects = readJSON('pm:projects', []) || [];
    if (Array.isArray(projects)) {
      projects.forEach(function (p) {
        if (!p || !p.id) return;
        (Array.isArray(p.tasks) ? p.tasks : []).forEach(function (t) {
          if (!t || !t.id) return;
          var key = 'task:' + p.id + ':' + t.id;
          if (t.status === 'done') { if (put(key, XP.task, 'arcana', { text: t.name })) changed = true; }
          else if (drop(key)) changed = true;
        });
        var pk = 'project:' + p.id;
        if (p.status === 'done') { if (put(pk, XP.project, 'arcana', { text: p.name })) changed = true; }
        else if (drop(pk)) changed = true;
      });
    }

    // --- Finance: snapshots, moves, and realised growth.
    var hist = readJSON('nw:history', []) || [];
    var acts = readJSON('nw:activity', []) || [];
    if (Array.isArray(hist) && hist.length) {
      if (put('nw:snapshots', hist.length * XP.nwSnapshot, 'fortune')) changed = true;
      var growth = hist.length >= 2 ? num(hist[hist.length - 1].v) - num(hist[0].v) : 0;
      var gx = growth > 0 ? Math.min(XP.growthCap, Math.floor(growth / XP.growthPer)) : 0;
      if (gx > 0) { if (put('nw:growth', gx, 'fortune')) changed = true; }
      else if (drop('nw:growth')) changed = true;
    }
    if (Array.isArray(acts) && acts.length) {
      if (put('nw:moves', acts.length * XP.nwActivity, 'fortune')) changed = true;
    }

    if (changed) save();
    return changed;
  }

  // ---------------------------------------------------------------
  // Totals — what every page renders from.
  // ---------------------------------------------------------------
  function totals() {
    var s = load();
    var byDisc = {};
    DISCIPLINES.forEach(function (d) { byDisc[d.id] = 0; });
    var total = 0;
    Object.keys(s.ledger).forEach(function (k) {
      var e = s.ledger[k];
      if (!e) return;
      var xp = num(e.xp);
      total += xp;
      if (byDisc[e.disc] != null) byDisc[e.disc] += xp;
    });

    var hero = heroCurve(total);
    var disciplines = DISCIPLINES.map(function (d) {
      var c = skillCurve(byDisc[d.id]);
      return {
        id: d.id, name: d.name, lore: d.lore, practical: d.practical,
        color: d.color, page: d.page,
        xp: byDisc[d.id], level: c.level, into: c.into, need: c.need, pct: c.pct
      };
    });

    var strongest = disciplines.slice().sort(function (a, b) { return b.xp - a.xp; })[0];
    var classId = s.player.classId;
    var cls = CLASSES.filter(function (c) { return c.id === classId; })[0];
    var derivedClass = strongest && strongest.xp > 0
      ? ({ career: 'Strategist', arcana: 'Artificer', resolve: 'Monk', might: 'Vanguard',
           vitality: 'Druid', fellowship: 'Envoy', fortune: 'Merchant' }[strongest.id] || 'Wanderer')
      : 'Wanderer';

    // Adventurer Score: a plain readable number, explained in the UI.
    // = total XP / 10, plus 25 per hero level, plus 15 per discipline level.
    var discLevels = disciplines.reduce(function (a, d) { return a + d.level; }, 0);
    var score = Math.round(total / 10) + hero.level * 25 + discLevels * 15;

    return {
      state: s,
      name: s.player.name || 'Icis',
      className: s.player.className || (cls ? cls.name : derivedClass),
      derivedClass: derivedClass,
      title: s.player.title || '',
      totalXp: total,
      level: hero.level, into: hero.into, need: hero.need, pct: hero.pct,
      rank: rankFor(hero.level),
      nextRank: nextRankFor(hero.level),
      disciplines: disciplines,
      byId: disciplines.reduce(function (a, d) { a[d.id] = d; return a; }, {}),
      score: score,
      scoreParts: { xp: Math.round(total / 10), level: hero.level * 25, disciplines: discLevels * 15 },
      today: todayKey()
    };
  }

  // ---------------------------------------------------------------
  // Chronicle — recent ledger entries with a human label.
  // ---------------------------------------------------------------
  function chronicle(limit) {
    var s = load();
    var out = [];
    Object.keys(s.ledger).forEach(function (k) {
      var e = s.ledger[k];
      if (!e || !e.at) return;
      out.push({ key: k, xp: num(e.xp), disc: e.disc, at: e.at, text: e.text || labelFor(k) });
    });
    out.sort(function (a, b) { return b.at - a.at; });
    return out.slice(0, limit || 30);
  }
  function labelFor(key) {
    var p = String(key).split(':');
    switch (p[0]) {
      case 'goal':    return 'Daily goals kept';
      case 'gym':     return 'Training session';
      case 'water':   return 'Hydration logged';
      case 'caf':     return 'Caffeine within limit';
      case 'task':    return 'Task cleared';
      case 'project': return 'Project shipped';
      case 'quest':   return 'Quest completed';
      case 'career':  return 'Career milestone';
      case 'social':  return 'Fellowship action';
      case 'nw':      return 'Treasury updated';
      default:        return 'Progress recorded';
    }
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------
  window.GameState = {
    KEY: KEY,
    DISCIPLINES: DISCIPLINES,
    RANKS: RANKS,
    CLASSES: CLASSES,
    XP: XP,

    get: load,
    save: save,
    update: function (fn) { var s = load(); fn(s); save(); return s; },
    reset: function () { cache = blank(); save(); },

    award: award,
    revoke: revoke,
    hasAward: has,
    reconcile: reconcile,

    totals: totals,
    chronicle: chronicle,
    subscribe: subscribe,
    notify: notify,

    todayKey: todayKey,
    dateKey: dateKey,
    shiftKey: shiftKey,
    daysBetween: daysBetween,
    weekStart: weekStart,
    weekKeys: weekKeys,
    heroCurve: heroCurve,
    skillCurve: skillCurve,
    rankFor: rankFor,
    nextRankFor: nextRankFor,
    readJSON: readJSON,
    writeJSON: writeJSON
  };

  // Reconcile once as soon as the module loads so every page starts
  // from the same numbers, then again if another tab changes data.
  reconcile();
  window.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (e.key === KEY) { cache = null; load(); notify(); return; }
    reconcile();
  });
})();
