// =============================================================
// ASCENSION — the RPG layer over the dashboard.
//
// Everything here is DERIVED from the data the other pages already
// write. Nothing awards XP at event time, so there is no parallel
// score to drift out of sync, and every day you already logged counts
// retroactively. The only thing this file persists is `rpg:hero`
// (name/class) and `rpg:seen` (last level shown, for the level-up toast).
//
// Drop on any page with:  <script src="rpg.js" defer></script>
// It self-injects the HUD nameplate into the topbar.
// =============================================================
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // Tuning
  // ---------------------------------------------------------------
  const XP = {
    goal: 15,          // per daily goal checked off
    perfectDay: 40,    // bonus for a day where every goal was kept
    workoutDay: 70,    // per day you trained
    volumePer: 300,    // 1 XP per this many kg·reps lifted
    waterHit: 30,      // per day you hit your water target
    waterPartial: 10,  // per day you logged water but fell short
    cleanCaffeine: 12, // per day at or under your caffeine ceiling
    task: 25,          // per project task finished
    project: 200,      // per project shipped
    nwSnapshot: 20,    // per net-worth snapshot
    nwActivity: 8,     // per logged asset movement
    growthPer: 50,     // 1 XP per this much net-worth growth
    growthCap: 1200,
  };

  const SKILLS = [
    { id: 'resolve',  name: 'Resolve',  glyph: '🔥', color: '#FBBF24', page: 'main.html',     blurb: 'Vows kept, day after day' },
    { id: 'might',    name: 'Might',    glyph: '⚔️', color: '#F87171', page: 'gym.html',      blurb: 'Iron moved, body forged' },
    { id: 'vitality', name: 'Vitality', glyph: '💧', color: '#60A5FA', page: 'po-water.html', blurb: 'Water, fuel, clean living' },
    { id: 'arcana',   name: 'Arcana',   glyph: '📜', color: '#A78BFA', page: 'health.html',   blurb: 'Work shipped, craft mastered' },
    { id: 'fortune',  name: 'Fortune',  glyph: '💰', color: '#34D399', page: 'finance.html',  blurb: 'Coin counted, hoard grown' },
  ];

  const RANKS = [
    { at: 1,  name: 'Wanderer',  sigil: '·' },
    { at: 5,  name: 'Initiate',  sigil: '✦' },
    { at: 10, name: 'Adept',     sigil: '✧' },
    { at: 18, name: 'Knight',    sigil: '⬧' },
    { at: 28, name: 'Warden',    sigil: '❖' },
    { at: 40, name: 'Paragon',   sigil: '✶' },
    { at: 55, name: 'Ascendant', sigil: '✷' },
    { at: 75, name: 'Mythic',    sigil: '✹' },
  ];

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function dk(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }
  // The goals page rolls the day over at 6 AM, not midnight. Match it so
  // a 2 AM workout still counts toward "yesterday" everywhere.
  function activeDate() {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function shiftDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }
  // Monday-anchored week containing the active date.
  function weekDays() {
    const today = activeDate();
    const dow = (today.getDay() + 6) % 7; // 0 = Monday
    const out = [];
    for (let i = 0; i <= dow; i++) out.push(dk(shiftDays(today, -dow + i)));
    return out;
  }
  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  // Level curves. The hero curve is steeper because it eats every skill's
  // XP at once; skills use a gentler one so a single discipline still climbs.
  function curve(xp, base, step) {
    let level = 1, need = base, rem = Math.max(0, Math.floor(num(xp)));
    // Guard against a runaway loop if xp is ever absurd.
    while (rem >= need && level < 999) { rem -= need; level++; need = base + (level - 1) * step; }
    return { level, into: rem, need, pct: need > 0 ? Math.min(1, rem / need) : 0, xp: Math.floor(num(xp)) };
  }
  const heroCurve  = (xp) => curve(xp, 100, 45);
  const skillCurve = (xp) => curve(xp, 60, 25);

  function rankFor(level) {
    let r = RANKS[0];
    for (const cand of RANKS) if (level >= cand.at) r = cand;
    return r;
  }
  function nextRankFor(level) {
    for (const cand of RANKS) if (level < cand.at) return cand;
    return null;
  }

  // ---------------------------------------------------------------
  // Derivation — one function per skill, each reading only the keys the
  // corresponding page already owns.
  // ---------------------------------------------------------------

  // main.html — `goals:YYYY-MM-DD` → [{ text, done, doneAt }]
  //
  // main.html's rollover() DELETES every past-day goals: key each time it
  // loads, carrying unfinished goals into today. So the live keys are only
  // ever "today" plus whatever hasn't been swept yet — there is no goal
  // history to derive from. We keep our own durable tally in `rpg:archive`
  // ({ 'YYYY-MM-DD': { d: done, t: total } }), refreshed from the live keys
  // on every page load and whenever main.html reports a change, so a day is
  // banked long before the sweep removes it.
  const ARCHIVE_KEY = 'rpg:archive';

  function liveGoalDays() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf('goals:') !== 0) continue;
      const list = readJSON(k, null);
      if (!Array.isArray(list) || !list.length) continue;
      out[k.slice('goals:'.length)] = {
        done: list.filter(g => g && g.done).length,
        total: list.length,
        list,
      };
    }
    return out;
  }

  function archiveGoalDays(live) {
    const archive = readJSON(ARCHIVE_KEY, {}) || {};
    let changed = false;
    Object.keys(live).forEach(date => {
      const cur = archive[date];
      const next = { d: live[date].done, t: live[date].total };
      if (!cur || cur.d !== next.d || cur.t !== next.t) {
        archive[date] = next;
        changed = true;
      }
    });
    if (changed) writeJSON(ARCHIVE_KEY, archive);
    return archive;
  }

  function deriveResolve() {
    const live = liveGoalDays();
    const archive = archiveGoalDays(live);

    const byDate = {};
    Object.keys(archive).forEach(date => {
      const a = archive[date];
      if (a && num(a.t) > 0) byDate[date] = { done: num(a.d), total: num(a.t) };
    });
    // The live key is the fresher truth for any day still on disk.
    Object.keys(live).forEach(date => {
      byDate[date] = { done: live[date].done, total: live[date].total };
    });

    let goalsDone = 0, goalsTotal = 0, perfectDays = 0;
    Object.keys(byDate).forEach(date => {
      const e = byDate[date];
      goalsDone += e.done;
      goalsTotal += e.total;
      if (e.total > 0 && e.done === e.total) perfectDays++;
    });

    // Chronicle entries need a timestamp, which only the live lists carry.
    const events = [];
    Object.keys(live).forEach(date => {
      live[date].list.forEach(g => {
        if (g && g.done && g.doneAt) {
          events.push({ ts: num(g.doneAt), skill: 'resolve', xp: XP.goal, text: String(g.text || 'A vow kept') });
        }
      });
    });

    // main.html maintains `goal_streak_v1` incrementally and it survives the
    // sweep, so it — not our archive — is the streak the rest of the app shows.
    const streakRec = readJSON('goal_streak_v1', null);
    const streak = (streakRec && num(streakRec.count)) || 0;

    const today = byDate[dk(activeDate())] || { done: 0, total: 0 };
    const week = weekDays().filter(d => byDate[d] && byDate[d].total > 0 && byDate[d].done === byDate[d].total).length;

    return {
      xp: goalsDone * XP.goal + perfectDays * XP.perfectDay,
      events,
      today,
      stats: { goalsDone, goalsTotal, perfectDays, streak, perfectThisWeek: week, daysTracked: Object.keys(byDate).length },
    };
  }

  // gym.html — `po_coach_v1` { logs: { exId: [{weight, reps, date}] } }
  //          + `po_coach_workout_done` { 'YYYY-MM-DD': true }
  function deriveMight() {
    const st = readJSON('po_coach_v1', {}) || {};
    const doneMap = readJSON('po_coach_workout_done', {}) || {};
    const days = {}; // date → { vol, sets, ts }
    let volume = 0, setCount = 0;

    Object.keys(doneMap).forEach(d => {
      if (doneMap[d]) days[d] = days[d] || { vol: 0, sets: 0, ts: 0 };
    });

    const logs = (st && typeof st.logs === 'object' && st.logs) || {};
    Object.keys(logs).forEach(exId => {
      const arr = logs[exId];
      if (!Array.isArray(arr)) return;
      arr.forEach(l => {
        if (!l || !l.date) return;
        const date = String(l.date).slice(0, 10);
        const vol = num(l.weight) * num(l.reps);
        const ts = Date.parse(l.date) || 0;
        const d = days[date] || (days[date] = { vol: 0, sets: 0, ts: 0 });
        d.vol += vol;
        d.sets += 1;
        if (ts > d.ts) d.ts = ts;
        volume += vol;
        setCount += 1;
      });
    });

    const units = st.units === 'lb' ? 'lb' : 'kg';
    const events = Object.keys(days).map(date => {
      const d = days[date];
      const ts = d.ts || (Date.parse(date + 'T18:00:00') || 0);
      const detail = d.sets
        ? d.sets + ' sets · ' + Math.round(d.vol).toLocaleString() + ' ' + units + ' moved'
        : 'Session marked complete';
      return { ts, skill: 'might', xp: XP.workoutDay + Math.floor(d.vol / XP.volumePer), text: detail };
    });

    const dayList = Object.keys(days);
    const trainedToday = !!days[dk(activeDate())];
    const thisWeek = weekDays().filter(d => days[d]).length;

    // Consecutive weeks with 2+ sessions, walking back from this week.
    let cursor = activeDate();
    const dow = (cursor.getDay() + 6) % 7;
    let weekStart = shiftDays(cursor, -dow);
    let weekStreak = 0;
    for (let i = 0; i < 260; i++) {
      let count = 0;
      for (let j = 0; j < 7; j++) if (days[dk(shiftDays(weekStart, j))]) count++;
      // The current, unfinished week shouldn't break the chain.
      if (count >= 2) weekStreak++;
      else if (i > 0) break;
      weekStart = shiftDays(weekStart, -7);
    }

    return {
      xp: dayList.length * XP.workoutDay + Math.floor(volume / XP.volumePer),
      events,
      stats: { sessions: dayList.length, volume: Math.round(volume), sets: setCount, units, trainedToday, thisWeek, weekStreak },
    };
  }

  // po-water.html — `po_water_v1` { unit, bottleMl, glassMl, profile, logs }
  // caffeine.html — `caf:logs` [{ mg, ts, n }]
  function deriveVitality() {
    const w = readJSON('po_water_v1', {}) || {};
    const perUnit = w.unit === 'glass' ? (num(w.glassMl) || 250) : (num(w.bottleMl) || 500);
    const kg = (w.profile && num(w.profile.weightKg)) || 75;
    const targetMl = Math.max(1500, Math.round(kg * 35));
    const logs = (w.logs && typeof w.logs === 'object') ? w.logs : {};

    let hitDays = 0, partialDays = 0;
    const waterByDate = {};
    Object.keys(logs).forEach(d => {
      const ml = num(logs[d]) * perUnit;
      if (ml <= 0) return;
      waterByDate[d] = ml;
      if (ml >= targetMl) hitDays++; else partialDays++;
    });

    const limit = num(w.caffeineMgPerDay) || 400;
    const caf = readJSON('caf:logs', []) || [];
    const cafByDate = {};
    const events = [];
    if (Array.isArray(caf)) {
      caf.forEach(l => {
        if (!l || !l.ts) return;
        const d = dk(new Date(num(l.ts)));
        cafByDate[d] = (cafByDate[d] || 0) + num(l.mg);
      });
    }
    let cleanDays = 0;
    Object.keys(cafByDate).forEach(d => { if (cafByDate[d] <= limit) cleanDays++; });

    Object.keys(waterByDate).forEach(d => {
      const ml = waterByDate[d];
      const hit = ml >= targetMl;
      events.push({
        ts: Date.parse(d + 'T20:00:00') || 0,
        skill: 'vitality',
        xp: hit ? XP.waterHit : XP.waterPartial,
        text: (ml / 1000).toFixed(1) + ' L of water' + (hit ? ' — target met' : ''),
      });
    });

    const todayKey = dk(activeDate());
    const todayMl = waterByDate[todayKey] || 0;
    const todayMg = cafByDate[todayKey] || 0;
    const week = weekDays().filter(d => (waterByDate[d] || 0) >= targetMl).length;

    return {
      xp: hitDays * XP.waterHit + partialDays * XP.waterPartial + cleanDays * XP.cleanCaffeine,
      events,
      stats: {
        hitDays, partialDays, cleanDays, targetMl, todayMl, todayMg, caffeineLimit: limit,
        hitThisWeek: week, hitToday: todayMl >= targetMl, loggedCaffeineToday: !!cafByDate[todayKey],
      },
    };
  }

  // health.html — `pm:projects` [{ name, status, tasks: [{ name, status, dueDate }] }]
  function deriveArcana() {
    const projects = readJSON('pm:projects', []) || [];
    let tasksDone = 0, tasksTotal = 0, projectsDone = 0, overdue = 0, active = 0;
    const today = dk(activeDate());

    if (Array.isArray(projects)) {
      projects.forEach(p => {
        if (!p) return;
        if (p.status === 'done') projectsDone++;
        else if (p.status === 'in_progress') active++;
        const tasks = Array.isArray(p.tasks) ? p.tasks : [];
        tasks.forEach(t => {
          if (!t) return;
          tasksTotal++;
          if (t.status === 'done') tasksDone++;
          else if (t.dueDate && String(t.dueDate) < today) overdue++;
        });
      });
    }

    return {
      xp: tasksDone * XP.task + projectsDone * XP.project,
      events: [],
      stats: {
        tasksDone, tasksTotal, projectsDone, overdue, active,
        projects: Array.isArray(projects) ? projects.length : 0,
      },
    };
  }

  // finance.html — `nw:history` [{ t, v }], `nw:activity` [{ ts, name, delta }]
  function deriveFortune() {
    const hist = readJSON('nw:history', []) || [];
    const acts = readJSON('nw:activity', []) || [];
    const history = Array.isArray(hist) ? hist : [];
    const activity = Array.isArray(acts) ? acts : [];

    let growth = 0;
    if (history.length >= 2) {
      growth = num(history[history.length - 1].v) - num(history[0].v);
    }
    const growthXp = growth > 0 ? Math.min(XP.growthCap, Math.floor(growth / XP.growthPer)) : 0;

    const events = activity.map(a => ({
      ts: num(a && a.ts),
      skill: 'fortune',
      xp: XP.nwActivity,
      text: String((a && a.name) || 'Ledger updated'),
    }));

    const week = weekDays();
    const loggedThisWeek = history.some(h => week.indexOf(dk(new Date(num(h.t)))) !== -1);

    return {
      xp: history.length * XP.nwSnapshot + activity.length * XP.nwActivity + growthXp,
      events,
      stats: {
        snapshots: history.length, moves: activity.length, growth,
        netWorth: history.length ? num(history[history.length - 1].v) : 0,
        loggedThisWeek,
      },
    };
  }

  // ---------------------------------------------------------------
  // Quests — every one is a pure function of today's / this week's data,
  // so they tick themselves off the moment the underlying page is used.
  // ---------------------------------------------------------------
  function buildQuests(s) {
    const r = s.skills.resolve.stats, m = s.skills.might.stats;
    const v = s.skills.vitality.stats, a = s.skills.arcana.stats, f = s.skills.fortune.stats;
    const goalTarget = Math.max(1, Math.min(3, s.skills.resolve.today.total || 3));

    const daily = [
      { id: 'd_goals', skill: 'resolve', name: 'Keep your vows',
        desc: 'Check off ' + goalTarget + ' goals today',
        have: s.skills.resolve.today.done, need: goalTarget, reward: 45 },
      { id: 'd_train', skill: 'might', name: 'Move the iron',
        desc: 'Log a training session',
        have: m.trainedToday ? 1 : 0, need: 1, reward: 70 },
      { id: 'd_water', skill: 'vitality', name: 'Drink deep',
        desc: 'Reach ' + (v.targetMl / 1000).toFixed(1) + ' L of water',
        have: Math.min(v.todayMl, v.targetMl), need: v.targetMl, reward: 30, unit: 'ml' },
      { id: 'd_caf', skill: 'vitality', name: 'Temper the brew',
        desc: 'Stay at or under ' + v.caffeineLimit + ' mg caffeine',
        have: v.todayMg <= v.caffeineLimit ? 1 : 0, need: 1, reward: 12 },
      { id: 'd_board', skill: 'arcana', name: 'Hold the line',
        desc: a.tasksTotal ? 'Leave no task overdue' : 'Add a project to track',
        have: a.tasksTotal ? (a.overdue === 0 ? 1 : 0) : 0, need: 1, reward: 25 },
    ];

    const weekly = [
      { id: 'w_train', skill: 'might', name: 'Forge week',
        desc: 'Train on 4 days this week', have: m.thisWeek, need: 4, reward: 220 },
      { id: 'w_perfect', skill: 'resolve', name: 'Unbroken',
        desc: 'Finish 5 days with every goal kept', have: r.perfectThisWeek, need: 5, reward: 260 },
      { id: 'w_water', skill: 'vitality', name: 'Well of vigour',
        desc: 'Hit your water target on 5 days', have: v.hitThisWeek, need: 5, reward: 180 },
      { id: 'w_ledger', skill: 'fortune', name: 'Count the hoard',
        desc: 'Record a net-worth snapshot', have: f.loggedThisWeek ? 1 : 0, need: 1, reward: 120 },
    ];

    const prep = (q) => Object.assign({}, q, {
      pct: q.need > 0 ? Math.min(1, q.have / q.need) : 0,
      complete: q.have >= q.need,
    });
    return { daily: daily.map(prep), weekly: weekly.map(prep) };
  }

  // ---------------------------------------------------------------
  // Achievements — all-time milestones, also purely derived.
  // ---------------------------------------------------------------
  function buildAchievements(s) {
    const r = s.skills.resolve.stats, m = s.skills.might.stats;
    const v = s.skills.vitality.stats, a = s.skills.arcana.stats, f = s.skills.fortune.stats;

    const defs = [
      { id: 'first_blood', glyph: '🗡️', name: 'First Blood',    desc: 'Complete your first goal',        have: r.goalsDone,   need: 1 },
      { id: 'centurion',   glyph: '💯', name: 'Centurion',      desc: 'Complete 100 goals',              have: r.goalsDone,   need: 100 },
      { id: 'thousand',    glyph: '👑', name: 'Vow Keeper',     desc: 'Complete 1,000 goals',            have: r.goalsDone,   need: 1000 },
      { id: 'week_streak', glyph: '🔥', name: 'Seven Days',     desc: 'A 7-day perfect streak',          have: r.streak,      need: 7 },
      { id: 'month_streak',glyph: '☄️', name: 'Thirty Nights',  desc: 'A 30-day perfect streak',         have: r.streak,      need: 30 },
      { id: 'iron_10',     glyph: '⚔️', name: 'Iron Initiate',  desc: 'Train on 10 days',                have: m.sessions,    need: 10 },
      { id: 'iron_100',    glyph: '🛡️', name: 'Iron Warden',    desc: 'Train on 100 days',               have: m.sessions,    need: 100 },
      { id: 'tonnage',     glyph: '🏔️', name: 'Mountainmover',  desc: 'Move 100,000 ' + m.units,         have: m.volume,      need: 100000 },
      { id: 'megaton',     glyph: '🌋', name: 'Titan',          desc: 'Move 1,000,000 ' + m.units,       have: m.volume,      need: 1000000 },
      { id: 'hydrated',    glyph: '💧', name: 'Wellspring',     desc: 'Hit your water target 30 times',  have: v.hitDays,     need: 30 },
      { id: 'temperance',  glyph: '🍵', name: 'Temperance',     desc: '50 days inside your caffeine cap',have: v.cleanDays,   need: 50 },
      { id: 'shipped',     glyph: '📜', name: 'Shipwright',     desc: 'Finish a project',                have: a.projectsDone,need: 1 },
      { id: 'shipped_5',   glyph: '🏛️', name: 'Archmage',       desc: 'Finish 5 projects',               have: a.projectsDone,need: 5 },
      { id: 'taskmaster',  glyph: '✅', name: 'Taskmaster',     desc: 'Close 100 tasks',                 have: a.tasksDone,   need: 100 },
      { id: 'bookkeeper',  glyph: '📈', name: 'Bookkeeper',     desc: 'Record 25 net-worth snapshots',   have: f.snapshots,   need: 25 },
      { id: 'polymath',    glyph: '✷', name: 'Polymath',        desc: 'Reach level 5 in every skill',
        have: SKILLS.filter(sk => s.skills[sk.id].level >= 5).length, need: SKILLS.length },
    ];

    return defs.map(d => Object.assign({}, d, {
      unlocked: d.have >= d.need,
      pct: d.need > 0 ? Math.min(1, d.have / d.need) : 0,
    }));
  }

  // ---------------------------------------------------------------
  // Public: compute the whole character in one pass.
  // ---------------------------------------------------------------
  function compute() {
    const raw = {
      resolve: deriveResolve(),
      might: deriveMight(),
      vitality: deriveVitality(),
      arcana: deriveArcana(),
      fortune: deriveFortune(),
    };

    const skills = {};
    let totalXp = 0;
    const events = [];
    SKILLS.forEach(meta => {
      const d = raw[meta.id];
      const c = skillCurve(d.xp);
      skills[meta.id] = Object.assign({}, meta, c, {
        stats: d.stats,
        today: d.today || null,
      });
      totalXp += d.xp;
      d.events.forEach(e => { if (e.ts > 0) events.push(e); });
    });

    const hero = heroCurve(totalXp);
    const rank = rankFor(hero.level);
    const nextRank = nextRankFor(hero.level);
    const profile = readJSON('rpg:hero', {}) || {};

    // Highest skill decides the class title — you are what you practise.
    const ordered = SKILLS.map(m => skills[m.id]).sort((a, b) => b.xp - a.xp);
    const CLASS_BY_SKILL = {
      resolve: 'Monk', might: 'Berserker', vitality: 'Druid', arcana: 'Artificer', fortune: 'Merchant Prince',
    };
    const derivedClass = ordered[0] && ordered[0].xp > 0 ? CLASS_BY_SKILL[ordered[0].id] : 'Wanderer';

    const state = {
      name: String(profile.name || 'Icis'),
      className: String(profile.className || derivedClass),
      derivedClass,
      totalXp,
      level: hero.level,
      into: hero.into,
      need: hero.need,
      pct: hero.pct,
      rank,
      nextRank,
      skills,
      skillList: SKILLS.map(m => skills[m.id]),
      events: events.sort((a, b) => b.ts - a.ts).slice(0, 40),
      power: Math.round(totalXp / 10) + hero.level * 25,
    };

    state.quests = buildQuests(state);
    state.achievements = buildAchievements(state);
    state.questsDone = state.quests.daily.filter(q => q.complete).length;
    state.weeklyDone = state.quests.weekly.filter(q => q.complete).length;
    state.trophies = state.achievements.filter(a => a.unlocked).length;
    return state;
  }

  // ---------------------------------------------------------------
  // HUD — a nameplate in the topbar on every page, plus the level-up toast.
  // ---------------------------------------------------------------
  const hudCss = `
.rpg-plate {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 5px 12px 5px 6px;
  border-radius: 999px;
  border: 1px solid rgba(233,190,110,0.22);
  background: linear-gradient(180deg, rgba(233,190,110,0.10), rgba(233,190,110,0.03));
  text-decoration: none; color: inherit;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
  transition: border-color .18s, background .18s, transform .1s;
}
.rpg-plate:hover { border-color: rgba(233,190,110,0.45); background: linear-gradient(180deg, rgba(233,190,110,0.16), rgba(233,190,110,0.05)); }
.rpg-plate:active { transform: scale(0.97); }
.rpg-plate-orb {
  width: 30px; height: 30px; flex: none;
  display: grid; place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #F6DCA8, #C99B4E 62%, #6E4C1E);
  color: #2A1B06; font-size: 12px; font-weight: 800;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 0 12px rgba(233,190,110,0.35), inset 0 1px 0 rgba(255,255,255,0.5);
}
.rpg-plate-body { display: flex; flex-direction: column; gap: 3px; min-width: 96px; }
.rpg-plate-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.rpg-plate-rank {
  font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: #E9BE6E;
}
.rpg-plate-xp {
  font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.40);
  font-variant-numeric: tabular-nums;
}
.rpg-plate-track {
  height: 4px; border-radius: 3px; overflow: hidden;
  background: rgba(255,255,255,0.10);
}
.rpg-plate-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #C99B4E, #F6DCA8);
  box-shadow: 0 0 8px rgba(233,190,110,0.5);
  transition: width .5s cubic-bezier(.22,1,.36,1);
}
@media (max-width: 380px) {
  .rpg-plate-body { min-width: 72px; }
}

/* Level-up / quest toast */
.rpg-toast-wrap {
  position: fixed; left: 0; right: 0; top: max(12px, env(safe-area-inset-top));
  z-index: 200; display: flex; flex-direction: column; align-items: center; gap: 8px;
  pointer-events: none; padding: 0 14px;
}
.rpg-toast {
  display: flex; align-items: center; gap: 12px;
  max-width: 420px; width: 100%;
  padding: 13px 16px;
  border-radius: 14px;
  border: 1px solid rgba(233,190,110,0.35);
  background: linear-gradient(180deg, rgba(30,24,12,0.97), rgba(16,13,8,0.97));
  box-shadow: 0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  animation: rpgToastIn .5s cubic-bezier(.22,1,.36,1);
}
.rpg-toast.out { animation: rpgToastOut .4s ease forwards; }
@keyframes rpgToastIn { from { opacity: 0; transform: translateY(-18px) scale(.96); } }
@keyframes rpgToastOut { to { opacity: 0; transform: translateY(-14px) scale(.97); } }
.rpg-toast-glyph { font-size: 26px; line-height: 1; filter: drop-shadow(0 0 10px rgba(233,190,110,.6)); }
.rpg-toast-kicker {
  font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
  color: #E9BE6E; margin-bottom: 2px;
}
.rpg-toast-title { font-size: 15px; font-weight: 700; color: #FAFAFA; letter-spacing: -0.01em; }
.rpg-toast-sub { font-size: 12px; color: rgba(255,255,255,0.52); margin-top: 2px; }
@media (prefers-reduced-motion: reduce) {
  .rpg-toast, .rpg-toast.out { animation: none; }
  .rpg-plate-fill { transition: none; }
}
`;

  function injectCss() {
    if (document.getElementById('rpg-hud-style')) return;
    const style = document.createElement('style');
    style.id = 'rpg-hud-style';
    style.textContent = hudCss;
    document.head.appendChild(style);
  }

  function toast(glyph, kicker, title, sub) {
    injectCss();
    let wrap = document.getElementById('rpgToasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'rpgToasts';
      wrap.className = 'rpg-toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'rpg-toast';
    const g = document.createElement('div');
    g.className = 'rpg-toast-glyph';
    g.textContent = glyph;
    const body = document.createElement('div');
    const k = document.createElement('div');
    k.className = 'rpg-toast-kicker';
    k.textContent = kicker;
    const t = document.createElement('div');
    t.className = 'rpg-toast-title';
    t.textContent = title;
    body.appendChild(k);
    body.appendChild(t);
    if (sub) {
      const s = document.createElement('div');
      s.className = 'rpg-toast-sub';
      s.textContent = sub;
      body.appendChild(s);
    }
    el.appendChild(g);
    el.appendChild(body);
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 420);
    }, 4200);
  }

  // Compare the freshly computed level against the last one we showed, and
  // celebrate anything that went up since.
  function checkMilestones(state) {
    const seen = readJSON('rpg:seen', null);
    const now = {
      level: state.level,
      skills: {},
      trophies: state.achievements.filter(a => a.unlocked).map(a => a.id),
    };
    SKILLS.forEach(m => { now.skills[m.id] = state.skills[m.id].level; });

    if (!seen || typeof seen.level !== 'number') {
      // First run — record the baseline silently so we don't fire a wall of
      // toasts for history that already existed.
      writeJSON('rpg:seen', now);
      return;
    }

    if (now.level > seen.level) {
      toast('✦', 'Level up', 'Level ' + now.level + ' — ' + state.rank.name,
        state.nextRank ? state.nextRank.name + ' at level ' + state.nextRank.at : 'You have reached the summit');
    }
    SKILLS.forEach(m => {
      const before = (seen.skills && seen.skills[m.id]) || 1;
      if (now.skills[m.id] > before) {
        toast(m.glyph, m.name + ' advanced', m.name + ' — level ' + now.skills[m.id], m.blurb);
      }
    });
    const seenTrophies = Array.isArray(seen.trophies) ? seen.trophies : [];
    state.achievements.forEach(a => {
      if (a.unlocked && seenTrophies.indexOf(a.id) === -1) {
        toast(a.glyph, 'Achievement', a.name, a.desc);
      }
    });

    writeJSON('rpg:seen', now);
  }

  function renderPlate(state) {
    const plate = document.getElementById('rpgPlate');
    if (!plate) return;
    plate.querySelector('.rpg-plate-orb').textContent = state.level;
    plate.querySelector('.rpg-plate-rank').textContent = state.rank.sigil + ' ' + state.rank.name;
    plate.querySelector('.rpg-plate-xp').textContent = state.into + ' / ' + state.need;
    plate.querySelector('.rpg-plate-fill').style.width = (state.pct * 100).toFixed(1) + '%';
    plate.setAttribute('aria-label',
      'Level ' + state.level + ' ' + state.rank.name + ', ' + state.into + ' of ' + state.need + ' XP');
  }

  function injectPlate() {
    if (document.getElementById('rpgPlate')) return;
    const bar = document.getElementById('topbar');
    if (!bar) return;
    injectCss();
    // topbar.js right-aligns its buttons; make room on the left for the plate.
    bar.style.justifyContent = 'space-between';
    const a = document.createElement('a');
    a.id = 'rpgPlate';
    a.className = 'rpg-plate';
    a.href = 'character.html';
    a.innerHTML =
      '<span class="rpg-plate-orb">1</span>' +
      '<span class="rpg-plate-body">' +
        '<span class="rpg-plate-line">' +
          '<span class="rpg-plate-rank">Wanderer</span>' +
          '<span class="rpg-plate-xp">0 / 100</span>' +
        '</span>' +
        '<span class="rpg-plate-track"><span class="rpg-plate-fill" style="width:0%"></span></span>' +
      '</span>';
    bar.insertBefore(a, bar.firstChild);
  }

  function refresh() {
    let state;
    try { state = compute(); } catch (e) { return null; }
    window.RPG.state = state;
    try { renderPlate(state); } catch (e) {}
    try { checkMilestones(state); } catch (e) {}
    document.dispatchEvent(new CustomEvent('rpg:update', { detail: state }));
    return state;
  }

  window.RPG = {
    compute, refresh, toast,
    SKILLS, RANKS, XP,
    heroCurve, skillCurve, rankFor, nextRankFor,
    activeDate, dateKey: dk,
    state: null,
  };

  function boot() {
    // character.html draws its own header, so it opts out of the plate.
    if (!document.body.hasAttribute('data-rpg-no-plate')) {
      // topbar.js also boots on DOMContentLoaded; give it the same tick.
      injectPlate();
      if (!document.getElementById('rpgPlate')) setTimeout(injectPlate, 0);
    }
    refresh();
    // Any page writing to localStorage (or a cloud-sync push landing) should
    // move the bar without a reload.
    window.addEventListener('storage', refresh);
    // main.html fires this on every goals write — it's our cue to bank the
    // day into the archive before its rollover sweeps the key away.
    window.addEventListener('goals-changed', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
