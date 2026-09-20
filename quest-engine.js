// =============================================================
// ICIS — daily quest engine.
//
// ---- Why the quests do not change when you refresh -----------
// Selection is seeded: the RNG is derived from the date string (plus
// a per-install salt and the reroll counter), so generating "today"
// twice yields the identical set. On top of that, the generated set
// is PERSISTED into state.quests the first time it is built, and
// every later read returns the stored list. Refreshing therefore
// cannot reshuffle the board even if the seed logic changed.
//
// ---- Day boundary --------------------------------------------
// Local midnight. `GameState.todayKey()` is the only clock.
//
// ---- Slots ----------------------------------------------------
//   1  main    Main Story quest from the active career chapter
//   2  career  Rotating career / skill development
//   3  body    Fitness, health or recovery
//   4  social  Social / fellowship
//   5  flex    Whatever life category has been most neglected
//
// A career deadline inside `DEADLINE_WINDOW` days overrides slot 1
// and pins it to that chapter.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState;
  var LIB = window.QuestLibrary;

  var DEADLINE_WINDOW = 3;      // days — a deadline this close takes over slot 1
  var NO_REPEAT_DAYS = 7;       // spec: no repeats within 7 days …
  var REPEATABLE_CD = 2;        // … unless the template is explicitly short-cooldown
  var HISTORY_LIMIT = 120;      // days of quest history to keep
  var NEGLECT_WINDOW = 14;      // days used to measure category neglect

  var MODES = {
    light:     { label: 'Light',     minutes: 60,  note: 'A quieter day. Still counts.' },
    normal:    { label: 'Normal',    minutes: 130, note: 'The standard load.' },
    ambitious: { label: 'Ambitious', minutes: 220, note: 'A heavy day. Choose it deliberately.' }
  };

  // ---------------------------------------------------------------
  // Seeded RNG — mulberry32. Small, fast, good enough, deterministic.
  // ---------------------------------------------------------------
  function hashStr(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Stable per-install salt so two people on the same day don't get an
  // identical board, while the same person always does.
  function salt() {
    var s = GS.get();
    if (!s.questSalt) { s.questSalt = String(Math.floor(Math.random() * 1e9)); GS.save(); }
    return s.questSalt;
  }

  // ---------------------------------------------------------------
  // Library with user overrides applied.
  // ---------------------------------------------------------------
  function library() {
    var s = GS.get();
    var ov = s.questOverrides || {};
    return LIB.all.map(function (q) {
      var patch = ov[q.id];
      return patch ? Object.assign({}, q, patch) : q;
    });
  }
  function byId(id) {
    return library().filter(function (q) { return q.id === id; })[0] || null;
  }

  // ---------------------------------------------------------------
  // Usage — derived from questHistory so there is one source of truth.
  // ---------------------------------------------------------------
  function usageIndex(state) {
    var hist = state.questHistory || {};
    var lastSeen = {};    // templateId -> most recent date it appeared
    var completed = {};   // templateId -> times completed
    var perWeek = {};     // 'weekStart|templateId' -> count
    var catByDay = {};    // date -> { category: completions }
    Object.keys(hist).forEach(function (date) {
      var day = hist[date];
      if (!day || !Array.isArray(day.list)) return;
      var wk = GS.weekStart(date);
      day.list.forEach(function (q) {
        if (!q || !q.id) return;
        if (!lastSeen[q.id] || date > lastSeen[q.id]) lastSeen[q.id] = date;
        var pk = wk + '|' + q.id;
        perWeek[pk] = (perWeek[pk] || 0) + 1;
        if (q.done) {
          completed[q.id] = (completed[q.id] || 0) + 1;
          if (!catByDay[date]) catByDay[date] = {};
          var cat = q.category || (LIB.byId[q.id] && LIB.byId[q.id].category);
          if (cat) catByDay[date][cat] = (catByDay[date][cat] || 0) + 1;
        }
      });
    });
    return { lastSeen: lastSeen, completed: completed, perWeek: perWeek, catByDay: catByDay };
  }

  // How neglected is each category over the last NEGLECT_WINDOW days?
  // Returns a multiplier >= 1 — bigger means "pick me".
  function neglectWeights(state, dateKey, idx) {
    var counts = {};
    LIB.categories.forEach(function (c) { counts[c] = 0; });
    for (var i = 1; i <= NEGLECT_WINDOW; i++) {
      var d = GS.shiftKey(dateKey, -i);
      var day = idx.catByDay[d];
      if (!day) continue;
      Object.keys(day).forEach(function (c) { if (counts[c] != null) counts[c] += day[c]; });
    }
    var max = Math.max.apply(null, LIB.categories.map(function (c) { return counts[c]; }).concat([1]));
    var w = {};
    LIB.categories.forEach(function (c) {
      // 1.0 for the most-used category, up to 2.5 for one untouched in two weeks.
      w[c] = 1 + 1.5 * ((max - counts[c]) / max);
    });
    return w;
  }

  // ---------------------------------------------------------------
  // Eligibility
  // ---------------------------------------------------------------
  function isWeekend(dateKey) {
    var p = dateKey.split('-').map(Number);
    var dow = new Date(p[0], p[1] - 1, p[2]).getDay();
    return dow === 0 || dow === 6;
  }

  function eligible(q, ctx) {
    if (!q.active) return false;
    if (q.minimumLevel > ctx.level) return false;
    if (q.weekendOnly && !ctx.weekend) return false;
    if (q.weekdayOnly && ctx.weekend) return false;

    // Cooldown and the 7-day no-repeat rule.
    var last = ctx.idx.lastSeen[q.id];
    if (last) {
      var gap = GS.daysBetween(last, ctx.date);
      if (gap < q.cooldownDays) return false;
      if (q.cooldownDays > REPEATABLE_CD && gap < NO_REPEAT_DAYS) return false;
    }
    // Weekly cap.
    var pk = GS.weekStart(ctx.date) + '|' + q.id;
    if ((ctx.idx.perWeek[pk] || 0) >= q.maximumUsesPerWeek) return false;

    // Prerequisites: each must have been completed at least once.
    for (var i = 0; i < q.prerequisites.length; i++) {
      if (!ctx.idx.completed[q.prerequisites[i]]) return false;
    }
    // Already on today's board, or too similar to something already picked.
    if (ctx.taken[q.id]) return false;
    if (q.subcategory && ctx.takenSub[q.category + ':' + q.subcategory]) return false;
    return true;
  }

  // Weighted pick. Prefers quests that still fit the remaining time
  // budget; falls back to the shortest available when nothing fits.
  function pick(pool, ctx, rng) {
    var fits = pool.filter(function (q) { return q.estimatedMinutes <= ctx.remaining; });
    var candidates = fits.length ? fits : pool.slice().sort(function (a, b) {
      return a.estimatedMinutes - b.estimatedMinutes;
    }).slice(0, 5);
    if (!candidates.length) return null;

    var weights = candidates.map(function (q) {
      var w = (q.weight || 1) * (ctx.neglect[q.category] || 1);
      // Nudge toward the active chapter's subject matter.
      if (ctx.chapterTags && q.tags.some(function (t) { return ctx.chapterTags.indexOf(t) !== -1; })) w *= 2.2;
      return w;
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = rng() * total;
    for (var i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function take(ctx, q, slot, extra) {
    if (!q) return null;
    ctx.taken[q.id] = true;
    if (q.subcategory) ctx.takenSub[q.category + ':' + q.subcategory] = true;
    ctx.remaining -= q.estimatedMinutes;
    return Object.assign({
      id: q.id, slot: slot, category: q.category, done: false, xp: q.xp
    }, extra || {});
  }

  // ---------------------------------------------------------------
  // Generation
  // ---------------------------------------------------------------
  function generate(dateKey, mode, rerollSeed) {
    var s = GS.get();
    var t = GS.totals();
    var idx = usageIndex(s);
    var lib = library();
    var mission = window.CareerData.currentMission(s);
    var deadlines = window.CareerData.upcomingDeadlines(s, DEADLINE_WINDOW);
    var urgent = deadlines[0] || null;

    var ctx = {
      date: dateKey,
      level: t.level,
      weekend: isWeekend(dateKey),
      idx: idx,
      taken: {}, takenSub: {},
      remaining: (MODES[mode] || MODES.normal).minutes,
      neglect: neglectWeights(s, dateKey, idx),
      chapterTags: (urgent ? urgent.chapter.questTags : (mission.chapter ? mission.chapter.questTags : []))
    };
    var rng = mulberry32(hashStr(dateKey + '|' + salt() + '|' + (rerollSeed || 0)));
    var out = [];

    // --- Slot 1: Main Story. A live deadline outranks the normal pick.
    var storyTags = ctx.chapterTags || [];
    var storyPool = lib.filter(function (q) {
      return q.category === 'career' &&
             q.tags.some(function (tag) { return storyTags.indexOf(tag) !== -1; }) &&
             eligible(q, ctx);
    });
    // If the chapter's own quests are all on cooldown, relax to any career quest.
    if (!storyPool.length) {
      storyPool = lib.filter(function (q) { return q.category === 'career' && eligible(q, ctx); });
    }
    var main = pick(storyPool, ctx, rng);
    out.push(take(ctx, main, 'main', {
      pinned: !!urgent,
      chapterId: (urgent ? urgent.chapter.id : (mission.chapter ? mission.chapter.id : '')),
      reason: urgent
        ? (urgent.overdue ? 'Overdue: ' + urgent.chapter.name : 'Deadline in ' + urgent.days + 'd: ' + urgent.chapter.name)
        : 'Main Story · ' + (mission.chapter ? mission.chapter.name : 'Career')
    }));

    // --- Slot 2: rotating career / skill.
    var careerPool = lib.filter(function (q) { return q.category === 'career' && eligible(q, ctx); });
    out.push(take(ctx, pick(careerPool, ctx, rng), 'career', { reason: 'Skill development' }));

    // --- Slot 3: body — fitness, health or recovery.
    var bodyPool = lib.filter(function (q) {
      return (q.category === 'fitness' || q.category === 'recovery') && eligible(q, ctx);
    });
    out.push(take(ctx, pick(bodyPool, ctx, rng), 'body', { reason: 'Body & recovery' }));

    // --- Slot 4: social.
    var socialPool = lib.filter(function (q) { return q.category === 'social' && eligible(q, ctx); });
    out.push(take(ctx, pick(socialPool, ctx, rng), 'social', { reason: 'Fellowship' }));

    // --- Slot 5: flexible — whichever life category is most neglected.
    var flexCats = ['finance', 'recovery', 'recreation', 'social', 'fitness'];
    flexCats.sort(function (a, b) { return (ctx.neglect[b] || 1) - (ctx.neglect[a] || 1); });
    var flex = null;
    for (var i = 0; i < flexCats.length && !flex; i++) {
      var pool = lib.filter(function (q) { return q.category === flexCats[i] && eligible(q, ctx); });
      flex = pick(pool, ctx, rng);
    }
    out.push(take(ctx, flex, 'flex', { reason: 'Life balance' }));

    return out.filter(Boolean);
  }

  // ---------------------------------------------------------------
  // Today — build once, then always read the stored set.
  // ---------------------------------------------------------------
  function ensureToday() {
    var s = GS.get();
    var today = GS.todayKey();
    if (s.quests && s.quests.date === today && Array.isArray(s.quests.list) && s.quests.list.length) {
      return s.quests;
    }

    // Day rolled over. Archive yesterday, then carry one unfinished quest.
    var carried = null;
    if (s.quests && s.quests.date && Array.isArray(s.quests.list) && s.quests.list.length) {
      s.questHistory[s.quests.date] = { list: s.quests.list, mode: s.quests.mode };
      var undone = s.quests.list.filter(function (q) { return !q.done && q.slot !== 'main'; });
      if (undone.length) carried = undone[0];
    }

    var mode = (s.quests && s.quests.mode) || 'normal';
    var list = generate(today, mode, 0);

    if (carried && !list.some(function (q) { return q.id === carried.id; })) {
      // Replace the flex slot with the carried-over quest.
      var flexAt = list.map(function (q) { return q.slot; }).lastIndexOf('flex');
      var rolled = Object.assign({}, carried, { done: false, slot: 'flex', rolledOver: true, reason: 'Carried from yesterday' });
      if (flexAt >= 0) list[flexAt] = rolled; else list.push(rolled);
    }

    s.quests = {
      date: today, list: list, mode: mode,
      rerollUsed: false, rerollSeed: 0,
      rolledOver: carried ? carried.id : null
    };
    prune(s);
    GS.save();
    return s.quests;
  }

  function prune(s) {
    var keys = Object.keys(s.questHistory).sort();
    while (keys.length > HISTORY_LIMIT) { delete s.questHistory[keys.shift()]; }
  }

  // Tomorrow's board, without persisting or awarding anything.
  function preview(dateKey) {
    var s = GS.get();
    var date = dateKey || GS.shiftKey(GS.todayKey(), 1);
    var mode = (s.quests && s.quests.mode) || 'normal';
    return { date: date, list: generate(date, mode, 0), preview: true };
  }

  // ---------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // XP key is date + template, so completing, un-completing and
  // re-completing the same quest can never stack.
  function awardKey(date, id) { return 'quest:' + date + ':' + id; }

  function complete(id) {
    var q = ensureToday();
    var entry = find(q.list, id);
    if (!entry || entry.done) return false;
    var tpl = byId(id);
    if (!tpl) return false;
    entry.done = true;
    entry.doneAt = Date.now();
    var s = GS.get();
    s.ledger[awardKey(q.date, id)] = {
      xp: tpl.xp, disc: tpl.discipline, at: Date.now(),
      text: tpl.practicalTitle,
      skill: skillForTags(tpl.tags)
    };
    if (tpl.category === 'career') s.career.lastActionAt = Date.now();
    GS.save();
    return true;
  }

  function uncomplete(id) {
    var q = ensureToday();
    var entry = find(q.list, id);
    if (!entry || !entry.done) return false;
    entry.done = false;
    delete entry.doneAt;
    var s = GS.get();
    delete s.ledger[awardKey(q.date, id)];
    GS.save();
    return true;
  }

  function skillForTags(tags) {
    var skills = window.CareerData.SKILLS;
    for (var i = 0; i < skills.length; i++) {
      for (var j = 0; j < tags.length; j++) {
        if (skills[i].tags.indexOf(tags[j]) !== -1) return skills[i].id;
      }
    }
    return '';
  }

  // One free reroll per day. Completed quests are never rerolled, and
  // neither is a pinned deadline quest.
  function reroll() {
    var q = ensureToday();
    if (q.rerollUsed) return { ok: false, reason: 'You have already rerolled today.' };
    var s = GS.get();
    var keep = q.list.filter(function (x) { return x.done || x.pinned; });
    if (keep.length === q.list.length) {
      return { ok: false, reason: 'Nothing left to reroll.' };
    }
    var seed = (q.rerollSeed || 0) + 1;
    var fresh = generate(q.date, q.mode, seed);

    // Keep everything already done or pinned; fill the rest from the
    // new draw, skipping anything already on the board.
    var out = [];
    var used = {};
    keep.forEach(function (x) { out.push(x); used[x.id] = true; });
    fresh.forEach(function (x) {
      if (out.length >= 5) return;
      if (used[x.id]) return;
      out.push(x); used[x.id] = true;
    });

    s.quests.list = out;
    s.quests.rerollUsed = true;
    s.quests.rerollSeed = seed;
    GS.save();
    return { ok: true, list: out };
  }

  function setMode(mode) {
    if (!MODES[mode]) return false;
    var q = ensureToday();
    var s = GS.get();
    s.quests.mode = mode;
    // Changing the day's ambition re-draws only what you have not done.
    var keep = q.list.filter(function (x) { return x.done || x.pinned; });
    var fresh = generate(q.date, mode, (q.rerollSeed || 0));
    var out = [], used = {};
    keep.forEach(function (x) { out.push(x); used[x.id] = true; });
    var target = mode === 'light' ? 3 : mode === 'ambitious' ? 6 : 5;
    fresh.forEach(function (x) {
      if (out.length >= target) return;
      if (used[x.id]) return;
      out.push(x); used[x.id] = true;
    });
    s.quests.list = out;
    GS.save();
    return true;
  }

  // ---------------------------------------------------------------
  // Library editor support
  // ---------------------------------------------------------------
  function saveOverride(id, patch) {
    var s = GS.get();
    if (!s.questOverrides) s.questOverrides = {};
    s.questOverrides[id] = Object.assign({}, s.questOverrides[id] || {}, patch);
    GS.save();
  }
  function clearOverride(id) {
    var s = GS.get();
    if (s.questOverrides) delete s.questOverrides[id];
    GS.save();
  }

  // ---------------------------------------------------------------
  // Read helpers for the UI
  // ---------------------------------------------------------------
  function todayView() {
    var q = ensureToday();
    var lib = library();
    var map = lib.reduce(function (a, x) { a[x.id] = x; return a; }, {});
    var list = q.list.map(function (e) {
      var tpl = map[e.id] || LIB.byId[e.id];
      return Object.assign({}, tpl, e, { template: tpl });
    }).filter(function (x) { return !!x.practicalTitle; });
    var done = list.filter(function (x) { return x.done; }).length;
    return {
      date: q.date, mode: q.mode, modes: MODES,
      rerollUsed: !!q.rerollUsed,
      list: list,
      done: done, total: list.length,
      allDone: list.length > 0 && done === list.length,
      minutes: list.reduce(function (a, x) { return a + (x.done ? 0 : x.estimatedMinutes); }, 0)
    };
  }

  // ---------------------------------------------------------------
  // Guild contracts — weekly targets, derived from the trackers and
  // the quest history. Nothing to claim: they read true or false.
  // ---------------------------------------------------------------
  function contracts() {
    var s = GS.get();
    var week = GS.weekKeys(GS.todayKey());
    var inWeek = function (d) { return week.indexOf(d) !== -1; };

    var doneDays = GS.readJSON('po_coach_workout_done', {}) || {};
    var trained = week.filter(function (d) { return doneDays[d]; }).length;

    var perfect = week.filter(function (d) {
      var a = s.goalArchive[d];
      return a && a.t > 0 && a.d === a.t;
    }).length;

    var w = GS.readJSON('po_water_v1', {}) || {};
    var perUnit = w.unit === 'glass' ? (Number(w.glassMl) || 250) : (Number(w.bottleMl) || 500);
    var kg = (w.profile && Number(w.profile.weightKg)) || 75;
    var target = Math.max(1500, Math.round(kg * 35));
    var hydrated = week.filter(function (d) {
      return (Number((w.logs || {})[d]) || 0) * perUnit >= target;
    }).length;

    var hist = GS.readJSON('nw:history', []) || [];
    var snapshot = Array.isArray(hist) && hist.some(function (h) {
      return inWeek(GS.dateKey(new Date(Number(h.t) || 0)));
    });

    var questsDone = 0, careerDone = 0, socialDone = 0;
    week.forEach(function (d) {
      var day = d === (s.quests && s.quests.date) ? { list: s.quests.list } : s.questHistory[d];
      if (!day || !Array.isArray(day.list)) return;
      day.list.forEach(function (q) {
        if (!q.done) return;
        questsDone++;
        var cat = q.category || (LIB.byId[q.id] && LIB.byId[q.id].category);
        if (cat === 'career') careerDone++;
        if (cat === 'social') socialDone++;
      });
    });

    var defs = [
      { id: 'w_quests',  lore: 'The Long Watch',   name: 'Complete 20 quests',        have: questsDone, need: 20, xp: 300, disc: 'resolve' },
      { id: 'w_career',  lore: 'Guild Commission', name: 'Complete 7 career quests',  have: careerDone, need: 7,  xp: 280, disc: 'career' },
      { id: 'w_train',   lore: 'Forge Week',       name: 'Train on 4 days',           have: trained,    need: 4,  xp: 220, disc: 'might' },
      { id: 'w_perfect', lore: 'Unbroken',         name: '5 days with every goal kept', have: perfect,  need: 5,  xp: 260, disc: 'resolve' },
      { id: 'w_water',   lore: 'Well of Vigour',   name: 'Hit water target on 5 days', have: hydrated,  need: 5,  xp: 180, disc: 'vitality' },
      { id: 'w_social',  lore: 'Hearthlight',      name: 'Complete 2 social quests',  have: socialDone, need: 2,  xp: 160, disc: 'fellowship' },
      { id: 'w_ledger',  lore: 'Count the Hoard',  name: 'Record a net-worth snapshot', have: snapshot ? 1 : 0, need: 1, xp: 120, disc: 'fortune' }
    ];

    // Contract XP is keyed by week, so it settles once per week and
    // cannot be farmed by toggling the underlying data back and forth.
    var wk = GS.weekStart(GS.todayKey());
    var changed = false;
    defs.forEach(function (c) {
      c.pct = c.need ? Math.min(1, c.have / c.need) : 0;
      c.complete = c.have >= c.need;
      var key = 'contract:' + wk + ':' + c.id;
      if (c.complete) {
        if (!s.ledger[key]) {
          s.ledger[key] = { xp: c.xp, disc: c.disc, at: Date.now(), text: 'Contract: ' + c.name };
          changed = true;
        }
      } else if (s.ledger[key]) { delete s.ledger[key]; changed = true; }
    });
    if (changed) GS.save();

    return {
      weekStart: wk,
      list: defs,
      done: defs.filter(function (c) { return c.complete; }).length,
      total: defs.length
    };
  }

  window.QuestEngine = {
    MODES: MODES,
    contracts: contracts,
    library: library,
    byId: byId,
    ensureToday: ensureToday,
    todayView: todayView,
    preview: preview,
    complete: complete,
    uncomplete: uncomplete,
    reroll: reroll,
    setMode: setMode,
    saveOverride: saveOverride,
    clearOverride: clearOverride,
    usageIndex: function () { return usageIndex(GS.get()); },
    _generate: generate
  };
})();
