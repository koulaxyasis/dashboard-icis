// =============================================================
// ICIS — the Planner's Today's Quests, shared.
//
// The War Room (planner.html) owns `planner:v1`, but its Today's Quests
// also show on the Hub and the Quest Board next to the Daily Quests.
// Everything that decides what is on today's list, and what ticking one
// off means, lives here so the three surfaces can never disagree.
//
// Functions take the planner state object and mutate it in place; the
// caller writes it back. Nothing here creates planner data: a device
// that has never opened the War Room has none, and gets none.
//
// A new day carries every unfinished quest from the last list forward
// (up to the cap), then fills free slots from today's weekly board.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState;
  var KEY = 'planner:v1';
  var CAP = 5;
  var XP_FOR = { deep: 30, medium: 15, light: 5 };

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function today() { return GS.todayKey(); }

  function read() {
    var s = GS.readJSON(KEY, null);
    if (!s || typeof s !== 'object' || !Array.isArray(s.tasks) || !Array.isArray(s.lines)) return null;
    if (!s.done || typeof s.done !== 'object') s.done = {};
    if (!Array.isArray(s.board)) s.board = [];
    if (!s.settings || typeof s.settings !== 'object') s.settings = {};
    if (!s.today || !Array.isArray(s.today.ids)) s.today = { date: '', ids: [] };
    return s;
  }
  function write(s) { GS.writeJSON(KEY, s); }

  function lineOf(s, id) {
    for (var i = 0; i < s.lines.length; i++) if (s.lines[i].id === id) return s.lines[i];
    return null;
  }

  function blockForTime(v) {
    var h = parseInt(String(v || '').split(':')[0], 10);
    if (!isFinite(h)) return null;
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
  function peak(s) {
    var b = blockForTime(s.settings.peakFrom);
    if (!b) return null;
    return { block: b, label: s.settings.peakFrom + (s.settings.peakTo ? '–' + s.settings.peakTo : '') };
  }

  function examOn(s) { return !!s.settings.exam; }
  function lowOn(s) { return s.settings.lowDate === today(); }
  function visible(s, t) { return examOn(s) || !lowOn(s) || t.energy === 'light'; }

  // Exam Week replaces the plan with exactly two daily items. They are
  // fixed, not stored as tasks, but complete and earn XP like any other.
  function examTasks(s) {
    var clip = lineOf(s, 'clip') || s.lines.filter(function (l) { return l.kind === 'Guild Contract'; })[0] || null;
    var pk = peak(s);
    return [
      { id: 'exam_study', title: 'Study block', energy: 'deep', minutes: 120, repeat: 'daily', line: '', disc: 'career',
        exam: true, block: pk ? pk.block : 'morning', note: 'The one deep block that matters this week.' },
      { id: 'exam_clip', title: 'Post 1 clip', energy: 'medium', minutes: 30, repeat: 'daily',
        line: clip ? clip.id : '', disc: clip ? clip.disc : 'fortune',
        exam: true, block: 'evening', note: 'Keeps the contract warm. Nothing more.' }
    ];
  }
  function taskOf(s, id) {
    for (var i = 0; i < s.tasks.length; i++) if (s.tasks[i].id === id) return s.tasks[i];
    return examTasks(s).filter(function (x) { return x.id === id; })[0] || null;
  }

  // ---------------------------------------------------------------
  // Completion. A repeating task is done per day or per week; a one-off
  // is done once. Each completion carries its own minutes, track and XP
  // so the weekly totals and the ledger survive the task being deleted.
  // ---------------------------------------------------------------
  function periodOf(t, date) {
    if (t.repeat === 'daily') return date;
    if (t.repeat === 'weekly') return 'w' + GS.weekStart(date);
    return 'once';
  }
  function doneOf(s, t, date) {
    var m = s.done[t.id];
    return m ? m[periodOf(t, date)] || null : null;
  }
  function setDone(s, t, date, on) {
    var per = periodOf(t, date), m = s.done[t.id];
    if (!on) {
      if (m && m[per]) { delete m[per]; if (!Object.keys(m).length) delete s.done[t.id]; }
      return;
    }
    if (!m) m = s.done[t.id] = {};
    if (m[per]) return;
    var ln = lineOf(s, t.line);
    m[per] = {
      at: Date.now(), date: date, min: Math.max(0, num(t.minutes)), line: t.line || '',
      xp: XP_FOR[t.energy] || 0, disc: (ln && ln.disc) || t.disc || 'arcana',
      text: String(t.title).slice(0, 120)
    };
  }

  // ---------------------------------------------------------------
  // Today's list
  // ---------------------------------------------------------------
  function todayIds(s) {
    if (s.today.date !== today()) return [];
    return s.today.ids.filter(function (id) { return !!taskOf(s, id); });
  }

  // Bring the list up to today. Returns true when it changed anything,
  // so the caller knows to write. A device with no list yet (first visit)
  // is left alone until there is something to put on it.
  function roll(s) {
    var d = today(), changed = false, old = s.today;
    if (old.date && old.date !== d) {
      var carry = old.date < d ? old.ids.filter(function (id) {
        var t = taskOf(s, id);
        return t && !t.exam && !doneOf(s, t, old.date) && !doneOf(s, t, d);
      }).slice(0, CAP) : [];
      s.today = { date: d, ids: carry, carried: carry.slice(), pulled: [] };
      changed = true;
    }
    if (!examOn(s) && pullBoard(s)) changed = true;
    return changed;
  }
  // Start today's list if there is none yet.
  function ensure(s) {
    roll(s);
    if (s.today.date !== today()) s.today = { date: today(), ids: [], carried: [], pulled: [] };
  }

  // What the board holds for today lands on today's list, up to the cap.
  // Each entry is pulled once, so removing it from today sticks.
  function pullBoard(s) {
    var d = today(), pulled = s.today.date === d ? s.today.pulled || [] : [];
    var fresh = s.board.filter(function (e) { return e.date === d && pulled.indexOf(e.id) === -1; });
    if (!fresh.length) return false;
    if (s.today.date !== d) s.today = { date: d, ids: [], carried: [], pulled: [] };
    if (!s.today.pulled) s.today.pulled = [];
    fresh.forEach(function (e) {
      s.today.pulled.push(e.id);
      if (!taskOf(s, e.task) || s.today.ids.indexOf(e.task) !== -1 || todayIds(s).length >= CAP) return;
      s.today.ids.push(e.task);
    });
    return true;
  }

  function carried(s, id) {
    return s.today.date === today() && (s.today.carried || []).indexOf(id) !== -1;
  }

  // What the Hub and the Quest Board show: today's list as the War Room
  // shows it, Exam Week and low-energy days included.
  function view(s) {
    var d = today();
    var exam = examOn(s);
    var all = exam ? examTasks(s) : todayIds(s).map(function (id) { return taskOf(s, id); });
    var shown = all.filter(function (t) { return visible(s, t); });
    var items = shown.map(function (t) {
      var ln = lineOf(s, t.line);
      return { task: t, line: ln, done: !!doneOf(s, t, d), carried: carried(s, t.id), xp: XP_FOR[t.energy] || 0 };
    });
    return {
      exam: exam, low: !exam && lowOn(s), hidden: all.length - shown.length,
      items: items, total: all.length,
      done: all.filter(function (t) { return doneOf(s, t, d); }).length
    };
  }

  // Tick or untick from outside the War Room. Returns the task when it
  // was just completed, for the toast.
  function toggle(s, id) {
    var t = taskOf(s, id), d = today();
    if (!t) return null;
    var was = !!doneOf(s, t, d);
    setDone(s, t, d, !was);
    return was ? null : t;
  }

  window.PlannerCore = {
    KEY: KEY, CAP: CAP, XP_FOR: XP_FOR,
    read: read, write: write,
    lineOf: lineOf, taskOf: taskOf, examTasks: examTasks, peak: peak, blockForTime: blockForTime,
    examOn: examOn, lowOn: lowOn, visible: visible,
    periodOf: periodOf, doneOf: doneOf, setDone: setDone,
    todayIds: todayIds, roll: roll, ensure: ensure, pullBoard: pullBoard, carried: carried,
    view: view, toggle: toggle
  };
})();
