// =============================================================
// ICIS — Nova, the Spirit Companion.
//
// Entirely local and deterministic. No API key, no network call, no
// backend. Nova reads `icisGameStateV2` plus the tracker keys, walks
// an ordered rule list, and returns ONE message from a fixed set of
// templates.
//
// Priority order (first match wins within a tier):
//   1 urgent deadline within 3 days
//   2 overdue career or project task
//   3 unfinished Main Story quest
//   4 daily quests close to completion
//   5 neglected career skill
//   6 upcoming social plan
//   7 fitness / hydration / caffeine / recovery
//   8 positive feedback on recent progress
//   9 general suggestion
//
// Nova is a rule engine with a face. It is not intelligent, is not
// conscious, and never gives medical, financial or mental-health
// advice — the templates below are deliberately limited to pointing
// at the user's own data and their next action.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState;
  var NO_REPEAT_DAYS = 3;

  // ---------------------------------------------------------------
  // Original portrait. Stylised anime-inspired spirit companion,
  // drawn from scratch as SVG so there is no asset to load and the
  // expression can change without generative art.
  // ---------------------------------------------------------------
  var EYES = {
    neutral:   '<ellipse cx="-13" cy="0" rx="6.4" ry="7.6"/><ellipse cx="13" cy="0" rx="6.4" ry="7.6"/>',
    pleased:   '<path d="M-19.5 1.5q6.5-8 13 0" fill="none" stroke-width="3.4" stroke-linecap="round"/><path d="M6.5 1.5q6.5-8 13 0" fill="none" stroke-width="3.4" stroke-linecap="round"/>',
    focused:   '<ellipse cx="-13" cy="0.5" rx="6.4" ry="5.4"/><ellipse cx="13" cy="0.5" rx="6.4" ry="5.4"/>',
    concerned: '<ellipse cx="-13" cy="1" rx="6" ry="7"/><ellipse cx="13" cy="1" rx="6" ry="7"/>',
    proud:     '<ellipse cx="-13" cy="0" rx="6.6" ry="8"/><ellipse cx="13" cy="0" rx="6.6" ry="8"/>',
    sleepy:    '<path d="M-19.5 0q6.5 5 13 0" fill="none" stroke-width="3.2" stroke-linecap="round"/><path d="M6.5 0q6.5 5 13 0" fill="none" stroke-width="3.2" stroke-linecap="round"/>'
  };
  var BROWS = {
    neutral:   '<path d="M-20 -12h13M7 -12h13"/>',
    pleased:   '<path d="M-20 -13q6.5-3 13 0M7 -13q6.5-3 13 0"/>',
    focused:   '<path d="M-20 -13l13 3M20 -13l-13 3"/>',
    concerned: '<path d="M-20 -14l13 4M20 -14l-13 4"/>',
    proud:     '<path d="M-20 -14q6.5-4 13 0M7 -14q6.5-4 13 0"/>',
    sleepy:    '<path d="M-20 -11h13M7 -11h13"/>'
  };
  var MOUTHS = {
    neutral:   '<path d="M-4 16q4 3 8 0"/>',
    pleased:   '<path d="M-6 15q6 7 12 0"/>',
    focused:   '<path d="M-4 17h8"/>',
    concerned: '<path d="M-5 18q5-4 10 0"/>',
    proud:     '<path d="M-7 15q7 8 14 0"/>',
    sleepy:    '<path d="M-3 17q3 2 6 0"/>'
  };

  function portrait(expression, size) {
    var e = EYES[expression] ? expression : 'neutral';
    var s = size || 120;
    return '' +
'<svg class="nova-art" viewBox="0 0 200 200" width="' + s + '" height="' + s + '" role="img" aria-label="Nova, your companion">' +
  '<defs>' +
    '<radialGradient id="nvHalo" cx="50%" cy="38%" r="62%">' +
      '<stop offset="0%" stop-color="#A78BFA" stop-opacity=".45"/>' +
      '<stop offset="60%" stop-color="#6D5BD0" stop-opacity=".16"/>' +
      '<stop offset="100%" stop-color="#0B0E1A" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<linearGradient id="nvHair" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#D8CCFF"/><stop offset="55%" stop-color="#9B86E8"/><stop offset="100%" stop-color="#5E4CA8"/>' +
    '</linearGradient>' +
    '<linearGradient id="nvSkin" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#FFE7D6"/><stop offset="100%" stop-color="#F2C9AE"/>' +
    '</linearGradient>' +
    '<linearGradient id="nvCloak" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#2A2450"/><stop offset="100%" stop-color="#171733"/>' +
    '</linearGradient>' +
  '</defs>' +
  '<circle cx="100" cy="96" r="92" fill="url(#nvHalo)"/>' +
  // shoulders / cloak
  '<path d="M46 200c0-28 24-44 54-44s54 16 54 44z" fill="url(#nvCloak)" stroke="#8B7AD6" stroke-opacity=".35" stroke-width="2"/>' +
  '<path d="M100 158l-13 20 13 12 13-12z" fill="#E9BE6E" opacity=".9"/>' +
  // hair back
  '<path d="M100 26c-34 0-52 24-52 54 0 20 4 30 4 44l-12 22c22-8 30-16 30-16s-6-30-6-46c0-22 14-34 36-34s36 12 36 34c0 16-6 46-6 46s8 8 30 16l-12-22c0-14 4-24 4-44 0-30-18-54-52-54z" fill="url(#nvHair)"/>' +
  // face
  '<ellipse cx="100" cy="94" rx="36" ry="40" fill="url(#nvSkin)"/>' +
  // fringe
  '<path d="M64 88c0-26 16-40 36-40s36 14 36 40c-6-14-16-22-22-18-8 5-14 3-20-2-8-6-22 4-30 20z" fill="url(#nvHair)"/>' +
  // expression group, centred on the eye line
  '<g transform="translate(100 94)" fill="#2C2350">' + EYES[e] + '</g>' +
  '<g transform="translate(100 94)" fill="none" stroke="#2C2350" stroke-width="2.6" stroke-linecap="round">' +
    BROWS[e] + MOUTHS[e] +
  '</g>' +
  // eye highlights (skipped when the eyes are closed arcs)
  (e === 'pleased' || e === 'sleepy' ? '' :
    '<circle cx="85" cy="91" r="2.1" fill="#fff" opacity=".92"/><circle cx="111" cy="91" r="2.1" fill="#fff" opacity=".92"/>') +
  // sigil
  '<circle cx="100" cy="62" r="4.6" fill="#E9BE6E" opacity=".92"/>' +
'</svg>';
  }

  // ---------------------------------------------------------------
  // Context — everything the rules are allowed to look at.
  // ---------------------------------------------------------------
  function buildContext() {
    var s = GS.get();
    var t = GS.totals();
    var today = GS.todayKey();
    var hour = new Date().getHours();
    var CD = window.CareerData;
    var QE = window.QuestEngine;

    var qv = QE ? QE.todayView() : { list: [], done: 0, total: 0 };
    var mainQuest = qv.list.filter(function (q) { return q.slot === 'main'; })[0] || null;

    var deadlines = CD ? CD.upcomingDeadlines(s, 3) : [];
    var mission = CD ? CD.currentMission(s) : null;

    // Overdue project tasks, straight from the project manager's own data.
    var projects = GS.readJSON('pm:projects', []) || [];
    var overdue = 0, nextProject = null;
    if (Array.isArray(projects)) {
      projects.forEach(function (p) {
        if (!p || p.status === 'done') return;
        (Array.isArray(p.tasks) ? p.tasks : []).forEach(function (task) {
          if (task && task.status !== 'done' && task.dueDate && String(task.dueDate) < today) {
            overdue++;
            if (!nextProject) nextProject = p;
          }
        });
      });
    }

    // Trackers.
    var w = GS.readJSON('po_water_v1', {}) || {};
    var perUnit = w.unit === 'glass' ? (Number(w.glassMl) || 250) : (Number(w.bottleMl) || 500);
    var kg = (w.profile && Number(w.profile.weightKg)) || 75;
    var waterTarget = Math.max(1500, Math.round(kg * 35));
    var waterToday = (Number((w.logs || {})[today]) || 0) * perUnit;

    var cafLimit = Number(w.caffeineMgPerDay) || 400;
    var caf = GS.readJSON('caf:logs', []) || [];
    var cafToday = 0, lastCafHour = -1;
    if (Array.isArray(caf)) {
      caf.forEach(function (l) {
        if (!l || !l.ts) return;
        if (GS.dateKey(new Date(l.ts)) === today) {
          cafToday += Number(l.mg) || 0;
          lastCafHour = Math.max(lastCafHour, new Date(l.ts).getHours());
        }
      });
    }

    var doneDays = GS.readJSON('po_coach_workout_done', {}) || {};
    var week = GS.weekKeys(today);
    var workoutsThisWeek = week.filter(function (d) { return doneDays[d]; }).length;
    var trainedToday = !!doneDays[today];

    // Same streak the rest of the app shows — computed once in game-state,
    // shields and rest days included.
    var streakInfo = GS.streakInfo();
    var streak = streakInfo.count;

    // Social.
    var plans = (s.social && s.social.plans) || [];
    var upcoming = plans
      .filter(function (p) { return p && p.date && !p.done && p.date >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0] || null;
    var stalePeople = ((s.social && s.social.people) || []).filter(function (p) {
      if (!p || !p.lastContact) return true;
      return GS.daysBetween(p.lastContact, today) >= 21;
    });

    // Activity recency.
    var lastLedgerAt = 0;
    Object.keys(s.ledger).forEach(function (k) {
      var e = s.ledger[k];
      if (e && e.at > lastLedgerAt) lastLedgerAt = e.at;
    });
    var daysIdle = lastLedgerAt ? Math.floor((Date.now() - lastLedgerAt) / 86400000) : 0;
    var daysSinceCareer = s.career.lastActionAt
      ? Math.floor((Date.now() - s.career.lastActionAt) / 86400000) : 99;

    // Weakest career skill that has been started at all.
    var skills = CD ? CD.skillTotals(s) : [];
    var neglectedSkill = skills.slice().sort(function (a, b) { return a.xp - b.xp; })[0] || null;

    return {
      s: s, t: t, today: today, hour: hour,
      morning: hour >= 5 && hour < 12, afternoon: hour >= 12 && hour < 18,
      evening: hour >= 18 && hour < 23, night: hour >= 23 || hour < 5,
      quests: qv, mainQuest: mainQuest,
      questsDone: qv.done, questsTotal: qv.total,
      deadline: deadlines[0] || null,
      mission: mission,
      overdueTasks: overdue, overdueProject: nextProject,
      waterToday: waterToday, waterTarget: waterTarget,
      cafToday: cafToday, cafLimit: cafLimit, lastCafHour: lastCafHour,
      workoutsThisWeek: workoutsThisWeek, trainedToday: trainedToday,
      dow: new Date().getDay(),
      streak: streak,
      shields: streakInfo.shields,
      maxShields: streakInfo.maxShields,
      shieldedDays: streakInfo.spent.length,
      isRestToday: streakInfo.isRestToday,
      nextShieldAt: streakInfo.nextShieldAt,
      socialPlan: upcoming, stalePeople: stalePeople,
      daysIdle: daysIdle, daysSinceCareer: daysSinceCareer,
      neglectedSkill: neglectedSkill,
      level: t.level
    };
  }

  // ---------------------------------------------------------------
  // Rules. Ordered by priority tier, first eligible match wins.
  // Every entry is a template; there are 56 of them.
  // ---------------------------------------------------------------
  var A = {
    career:   { label: 'Open Career Guild', href: 'career.html' },
    quests:   { label: 'Open Quest Board',  href: 'main.html' },
    hub:      { label: 'Open Hub',          href: 'index.html' },
    guild:    { label: 'Open Projects',     href: 'guild.html' },
    training: { label: 'Open Training',     href: 'gym.html' },
    spring:   { label: 'Open Healing Spring', href: 'po-water.html' },
    alchemy:  { label: "Open Alchemist's Lab", href: 'caffeine.html' },
    treasury: { label: 'Open Treasury',     href: 'finance.html' },
    tavern:   { label: 'Open Tavern',       href: 'tavern.html' },
    hero:     { label: 'View Hero Profile', href: 'character.html' }
  };

  function days(n) { return n + ' day' + (Math.abs(n) === 1 ? '' : 's'); }

  var RULES = [
    // --- 1. Urgent deadline (within 3 days) -----------------------
    { id: 'dl_overdue', tier: 1, expr: 'concerned', act: A.career,
      when: function (c) { return c.deadline && c.deadline.overdue; },
      msg: function (c) { return 'The ' + c.deadline.chapter.name + ' deadline has passed. Reset the date or clear one milestone today.'; } },
    { id: 'dl_tomorrow', tier: 1, expr: 'focused', act: A.career,
      when: function (c) { return c.deadline && c.deadline.days <= 1; },
      msg: function (c) { return 'Your ' + c.deadline.chapter.name + ' deadline is tomorrow. Focus on the next milestone.'; } },
    { id: 'dl_soon', tier: 1, expr: 'focused', act: A.career,
      when: function (c) { return c.deadline && c.deadline.days <= 3; },
      msg: function (c) { return c.deadline.chapter.name + ' is due in ' + days(c.deadline.days) + ' and sits at ' + c.deadline.progress.pct + '%.'; } },

    // --- 2. Overdue tasks ----------------------------------------
    { id: 'od_many', tier: 2, expr: 'concerned', act: A.guild,
      when: function (c) { return c.overdueTasks >= 3; },
      msg: function (c) { return c.overdueTasks + ' project tasks are past their due date. Re-date them or close the smallest one.'; } },
    { id: 'od_one', tier: 2, expr: 'focused', act: A.guild,
      when: function (c) { return c.overdueTasks > 0; },
      msg: function (c) { return 'A task on ' + (c.overdueProject ? c.overdueProject.name : 'one of your projects') + ' is overdue. It is usually smaller than it looks.'; } },

    // --- 3. Main Story quest -------------------------------------
    { id: 'main_pinned', tier: 3, expr: 'focused', act: A.quests,
      when: function (c) { return c.mainQuest && !c.mainQuest.done && c.mainQuest.pinned; },
      msg: function (c) { return 'Deadline pressure has set your Main Story quest: "' + c.mainQuest.practicalTitle + '".'; } },
    { id: 'main_open', tier: 3, expr: 'neutral', act: A.quests,
      when: function (c) { return c.mainQuest && !c.mainQuest.done; },
      msg: function (c) { return 'Your Main Story quest is "' + c.mainQuest.practicalTitle + '". Start with one small step.'; } },
    { id: 'main_morning', tier: 3, expr: 'pleased', act: A.quests,
      when: function (c) { return c.mainQuest && !c.mainQuest.done && c.morning; },
      msg: function (c) { return 'Morning is the cheapest time to move the Main Story. "' + c.mainQuest.practicalTitle + '" is waiting.'; } },

    // --- 4. Daily quests close to done ---------------------------
    { id: 'q_one_left', tier: 4, expr: 'pleased', act: A.quests,
      when: function (c) { return c.questsTotal > 0 && c.questsTotal - c.questsDone === 1; },
      msg: function () { return "One quest remains. Finish it to close the day out clean."; } },
    { id: 'q_two_left', tier: 4, expr: 'neutral', act: A.quests,
      when: function (c) { return c.questsTotal > 0 && c.questsTotal - c.questsDone === 2; },
      msg: function () { return 'Two quests left. Pick the shorter one first.'; } },
    { id: 'q_all_done', tier: 4, expr: 'proud', act: A.hero,
      when: function (c) { return c.questsTotal > 0 && c.questsDone === c.questsTotal; },
      msg: function () { return 'Every quest cleared today. That is a full board.'; } },
    { id: 'q_none_yet_pm', tier: 4, expr: 'focused', act: A.quests,
      when: function (c) { return c.questsDone === 0 && c.afternoon; },
      msg: function () { return 'The board is still untouched. One quest now beats five tonight.'; } },
    { id: 'q_none_yet_eve', tier: 4, expr: 'concerned', act: A.quests,
      when: function (c) { return c.questsDone === 0 && c.evening; },
      msg: function () { return 'Evening, and nothing ticked off yet. Take the lightest quest on the board.'; } },

    // --- 5. Neglected career skill -------------------------------
    { id: 'career_idle_long', tier: 5, expr: 'concerned', act: A.career,
      when: function (c) { return c.daysSinceCareer >= 7; },
      msg: function () { return 'The Career Campaign has been quiet for a week. One short skill quest restarts it.'; } },
    { id: 'career_idle', tier: 5, expr: 'focused', act: A.career,
      when: function (c) { return c.daysSinceCareer >= 3; },
      msg: function (c) { return 'Your Career Campaign has been inactive for ' + days(c.daysSinceCareer) + '. Complete one short skill quest today.'; } },
    { id: 'skill_weak', tier: 5, expr: 'neutral', act: A.career,
      when: function (c) { return c.neglectedSkill && c.neglectedSkill.xp === 0; },
      msg: function (c) { return c.neglectedSkill.name + ' is still at zero. Even one session puts it on the board.'; } },
    { id: 'skill_lagging', tier: 5, expr: 'neutral', act: A.career,
      when: function (c) { return c.neglectedSkill && c.neglectedSkill.level <= 2; },
      msg: function (c) { return c.neglectedSkill.name + ' is your thinnest skill right now. Worth an hour this week.'; } },
    { id: 'chapter_progress', tier: 5, expr: 'pleased', act: A.career,
      when: function (c) { return c.mission && c.mission.progress.pct >= 60 && c.mission.progress.pct < 100; },
      msg: function (c) { return c.mission.chapter.name + ' is ' + c.mission.progress.pct + '% done. The last stretch is the cheapest.'; } },
    { id: 'chapter_next', tier: 5, expr: 'neutral', act: A.career,
      when: function (c) { return c.mission && c.mission.milestone; },
      msg: function (c) { return 'Next milestone: ' + c.mission.milestone.name + '.'; } },

    // --- 6. Social plans -----------------------------------------
    { id: 'social_today', tier: 6, expr: 'pleased', act: A.tavern,
      when: function (c) { return c.socialPlan && c.socialPlan.date === c.today; },
      msg: function (c) { return 'You have "' + c.socialPlan.title + '" today. Confirm the time and location.'; } },
    { id: 'social_soon', tier: 6, expr: 'pleased', act: A.tavern,
      when: function (c) { return c.socialPlan && GS.daysBetween(c.today, c.socialPlan.date) <= 2; },
      msg: function (c) { return 'A Fellowship event is approaching: "' + c.socialPlan.title + '". Confirm the details.'; } },
    { id: 'social_stale', tier: 6, expr: 'neutral', act: A.tavern,
      when: function (c) { return c.stalePeople.length >= 3; },
      msg: function (c) { return c.stalePeople.length + ' people have gone quiet for a while. One message is enough.'; } },
    { id: 'social_stale_one', tier: 6, expr: 'neutral', act: A.tavern,
      when: function (c) { return c.stalePeople.length >= 1; },
      msg: function (c) { return 'It has been a while since you spoke to ' + (c.stalePeople[0].name || 'someone on your list') + '.'; } },
    { id: 'social_empty', tier: 6, expr: 'neutral', act: A.tavern,
      when: function (c) { return !c.socialPlan && !(c.s.social.plans || []).length; },
      msg: function () { return 'Nothing in the Tavern yet. Adding one plan makes it far more likely to happen.'; } },
    { id: 'social_weekend', tier: 6, expr: 'pleased', act: A.tavern,
      when: function (c) { return (c.dow === 5 || c.dow === 6) && !c.socialPlan; },
      msg: function () { return 'The weekend is open and unplanned. Propose something to one person.'; } },

    // --- 7. Body: fitness, hydration, caffeine, recovery ----------
    { id: 'fit_none_midweek', tier: 7, expr: 'concerned', act: A.training,
      when: function (c) { return c.workoutsThisWeek === 0 && c.dow >= 3; },
      msg: function () { return 'The Training Grounds have been quiet this week. A short session still counts.'; } },
    { id: 'fit_one_more', tier: 7, expr: 'focused', act: A.training,
      when: function (c) { return c.workoutsThisWeek > 0 && c.workoutsThisWeek < 3 && c.dow >= 4; },
      msg: function (c) { return c.workoutsThisWeek + ' session' + (c.workoutsThisWeek === 1 ? '' : 's') + ' this week. One more makes it a real week.'; } },
    { id: 'fit_strong_week', tier: 7, expr: 'proud', act: A.training,
      when: function (c) { return c.workoutsThisWeek >= 4; },
      msg: function (c) { return c.workoutsThisWeek + ' sessions this week. That is the consistency that actually changes things.'; } },
    { id: 'fit_trained_today', tier: 7, expr: 'proud', act: A.training,
      when: function (c) { return c.trainedToday; },
      msg: function () { return 'Training logged today. Stretch and eat something with protein in it.'; } },
    { id: 'water_low_pm', tier: 7, expr: 'concerned', act: A.spring,
      when: function (c) { return c.waterToday < c.waterTarget * 0.4 && c.hour >= 15; },
      msg: function (c) { return 'You are at ' + (c.waterToday / 1000).toFixed(1) + 'L of ' + (c.waterTarget / 1000).toFixed(1) + 'L. The Healing Spring is right there.'; } },
    { id: 'water_close', tier: 7, expr: 'pleased', act: A.spring,
      when: function (c) { return c.waterToday >= c.waterTarget * 0.7 && c.waterToday < c.waterTarget; },
      msg: function () { return 'Close to your water target. One more and it is done.'; } },
    { id: 'water_done', tier: 7, expr: 'proud', act: A.spring,
      when: function (c) { return c.waterToday >= c.waterTarget; },
      msg: function () { return 'Water target reached. The cheapest win of the day, already banked.'; } },
    { id: 'caf_over', tier: 7, expr: 'concerned', act: A.alchemy,
      when: function (c) { return c.cafToday > c.cafLimit; },
      msg: function (c) { return 'You are ' + Math.round(c.cafToday - c.cafLimit) + 'mg over your caffeine ceiling. Water from here.'; } },
    { id: 'caf_late', tier: 7, expr: 'concerned', act: A.spring,
      when: function (c) { return c.lastCafHour >= 16; },
      msg: function () { return "The Alchemist's Lab is closed for today. Choose water or a caffeine-free drink."; } },
    { id: 'caf_clean', tier: 7, expr: 'pleased', act: A.alchemy,
      when: function (c) { return c.cafToday > 0 && c.cafToday <= c.cafLimit * 0.6; },
      msg: function () { return 'Caffeine comfortably inside your limit today.'; } },
    { id: 'rec_late_night', tier: 7, expr: 'sleepy', act: A.spring,
      when: function (c) { return c.night; },
      msg: function () { return 'It is late. Sleep does more for tomorrow than one more hour tonight.'; } },
    { id: 'rec_evening_wind', tier: 7, expr: 'sleepy', act: A.quests,
      when: function (c) { return c.hour >= 21; },
      msg: function () { return 'Winding-down hour. Plan tomorrow in three lines, then stop.'; } },

    // --- 8. Positive feedback ------------------------------------
    { id: 'streak_long', tier: 8, expr: 'proud', act: A.hero,
      when: function (c) { return c.streak >= 14; },
      msg: function (c) { return c.streak + ' days unbroken. That is no longer a streak, it is a habit.'; } },
    { id: 'streak_week', tier: 8, expr: 'proud', act: A.hero,
      when: function (c) { return c.streak >= 7; },
      msg: function (c) { return c.streak + '-day streak. Protect it with one small quest today.'; } },
    { id: 'streak_small', tier: 8, expr: 'pleased', act: A.quests,
      when: function (c) { return c.streak >= 3; },
      msg: function (c) { return c.streak + ' days running. The third day is where most people stop.'; } },
    { id: 'level_milestone', tier: 8, expr: 'proud', act: A.hero,
      when: function (c) { return c.level >= 10 && c.level % 5 === 0; },
      msg: function (c) { return 'Level ' + c.level + ', rank ' + c.t.rank.name + '. Your consistency is becoming visible.'; } },
    { id: 'score_growing', tier: 8, expr: 'pleased', act: A.hero,
      when: function (c) { return c.t.score > 500; },
      msg: function (c) { return 'Adventurer Score ' + c.t.score + '. Mostly earned in small pieces.'; } },
    { id: 'balanced', tier: 8, expr: 'proud', act: A.hero,
      when: function (c) { return c.t.disciplines.every(function (d) { return d.level >= 3; }); },
      msg: function () { return 'Every discipline is at level 3 or better. Few people keep the whole board moving.'; } },

    // --- Streak shields and rest days ----------------------------
    { id: 'shield_spent', tier: 8, expr: 'pleased', act: A.hero,
      when: function (c) { return c.shieldedDays > 0; },
      msg: function (c) { return 'A streak shield covered ' + (c.shieldedDays === 1 ? 'a missed day' : c.shieldedDays + ' missed days') + '. Your streak stands at ' + c.streak + '.'; } },
    { id: 'shield_none', tier: 8, expr: 'focused', act: A.quests,
      when: function (c) { return c.shields === 0 && c.streak >= 3; },
      msg: function (c) { return 'No shields left and a ' + c.streak + '-day streak riding on today. Next one at day ' + c.nextShieldAt + '.'; } },
    { id: 'shield_full', tier: 8, expr: 'proud', act: A.hero,
      when: function (c) { return c.shields >= c.maxShields; },
      msg: function (c) { return 'All ' + c.maxShields + ' streak shields held. You have room to take a bad day.'; } },
    { id: 'rest_today', tier: 8, expr: 'sleepy', act: A.hero,
      when: function (c) { return c.isRestToday; },
      msg: function () { return 'Today is a marked rest day. It protects the streak without spending a shield.'; } },

    // --- Returning after inactivity ------------------------------
    { id: 'return_long', tier: 3, expr: 'pleased', act: A.quests,
      when: function (c) { return c.daysIdle >= 7; },
      msg: function (c) { return 'Welcome back after ' + days(c.daysIdle) + '. Nothing was lost — take one light quest to restart.'; } },
    { id: 'return_short', tier: 4, expr: 'pleased', act: A.quests,
      when: function (c) { return c.daysIdle >= 3; },
      msg: function () { return 'A few quiet days. No XP was removed. Pick the smallest thing on the board.'; } },

    // --- 9. General suggestions (always eligible) ----------------
    { id: 'gen_money', tier: 9, expr: 'neutral', act: A.treasury,
      when: function () { return true; },
      msg: function () { return 'The Treasury has not been counted in a while. A snapshot takes two minutes.'; } },
    { id: 'gen_smallest', tier: 9, expr: 'neutral', act: A.quests,
      when: function () { return true; },
      msg: function () { return 'When the day looks heavy, do the smallest quest first. Momentum is the point.'; } },
    { id: 'gen_portfolio', tier: 9, expr: 'focused', act: A.career,
      when: function () { return true; },
      msg: function () { return 'Unpublished work does not count. Ten minutes of tidying a project moves the campaign.'; } },
    { id: 'gen_network', tier: 9, expr: 'neutral', act: A.career,
      when: function () { return true; },
      msg: function () { return 'One message to one person in finance is a complete quest. It does not need to be clever.'; } },
    { id: 'gen_review', tier: 9, expr: 'neutral', act: A.hero,
      when: function () { return true; },
      msg: function () { return 'Worth a look at the Chronicle — recent progress is easy to forget.'; } },
    { id: 'gen_rest', tier: 9, expr: 'sleepy', act: A.quests,
      when: function () { return true; },
      msg: function () { return 'A deliberate rest day is a quest too. Choosing it is different from drifting into it.'; } },
    { id: 'gen_excel', tier: 9, expr: 'focused', act: A.career,
      when: function () { return true; },
      msg: function () { return 'Ten minutes of Excel shortcuts compounds faster than almost anything else you could do.'; } },
    { id: 'gen_sleep', tier: 9, expr: 'sleepy', act: A.spring,
      when: function () { return true; },
      msg: function () { return 'Recovery is part of the build, not a break from it.'; } },
    { id: 'gen_tidy', tier: 9, expr: 'neutral', act: A.quests,
      when: function () { return true; },
      msg: function () { return 'A clear desk makes the next session start faster. Low effort, real effect.'; } },
    { id: 'gen_plan', tier: 9, expr: 'focused', act: A.hub,
      when: function () { return true; },
      msg: function () { return 'Three lines of plan tonight removes tomorrow’s decision cost.'; } }
  ];

  // ---------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------
  function recentIds(s) {
    var out = {};
    var today = GS.todayKey();
    ((s.nova && s.nova.recent) || []).forEach(function (r) {
      if (!r || !r.date) return;
      if (GS.daysBetween(r.date, today) < NO_REPEAT_DAYS) out[r.id] = true;
    });
    return out;
  }

  function pick(opts) {
    var c = buildContext();
    var s = c.s;
    if (s.settings && s.settings.novaEnabled === false) return null;

    var seen = (opts && opts.ignoreRecent) ? {} : recentIds(s);
    var eligible = RULES.filter(function (r) {
      try { return r.when(c); } catch (e) { return false; }
    });
    var fresh = eligible.filter(function (r) { return !seen[r.id]; });
    // If everything eligible is on cooldown, fall back to the full set
    // rather than saying nothing.
    var pool = fresh.length ? fresh : eligible;
    if (!pool.length) return null;

    var best = pool.reduce(function (a, b) { return b.tier < a.tier ? b : a; });
    var tierPool = pool.filter(function (r) { return r.tier === best.tier; });

    // Urgent tiers take the FIRST match in declaration order, because the
    // rules there are written most-specific-first ("deadline is tomorrow"
    // must beat "deadline in 1 days"). Only the two lowest tiers — generic
    // praise and general suggestions — rotate, so they do not repeat.
    var rule;
    if (best.tier >= 8) {
      rule = tierPool[Math.abs(hash(c.today + '|' + best.tier)) % tierPool.length];
    } else {
      rule = tierPool[0];
    }

    var text;
    try { text = rule.msg(c); } catch (e) { text = 'Keep going.'; }
    return {
      id: rule.id, tier: rule.tier, expression: rule.expr,
      message: text, action: rule.act, context: c
    };
  }

  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h | 0;
  }

  function remember(msg) {
    if (!msg) return;
    var s = GS.get();
    if (!s.nova.recent) s.nova.recent = [];
    var last = s.nova.recent[0];
    if (last && last.id === msg.id && last.date === GS.todayKey()) return;
    s.nova.recent.unshift({ id: msg.id, date: GS.todayKey(), at: Date.now(), text: msg.message });
    s.nova.recent = s.nova.recent.slice(0, 40);
    GS.save();
  }

  // The message every surface should show.
  //
  // Nova holds ONE message per day rather than re-picking on each view.
  // Re-picking looked stable in isolation, but combined with the 3-day
  // no-repeat rule it meant each view chose a *different* message and
  // wrote it — so opening the hub mutated state, cloud-sync pushed it,
  // and any other open surface reacted. Holding the choice makes an
  // ordinary page load a pure read, and makes Nova less twitchy to read.
  //
  // The stored rule is re-evaluated on every call, so the wording stays
  // current and a rule that stops applying is replaced. `force` (the
  // "Another" button) deliberately advances to the next one.
  function message(opts) {
    var s = GS.get();
    if (s.settings && s.settings.novaEnabled === false) return null;
    var today = GS.todayKey();
    var cur = s.nova.current;

    if (!(opts && opts.force) && cur && cur.date === today && cur.id) {
      var rule = RULES.filter(function (r) { return r.id === cur.id; })[0];
      if (rule) {
        var c = buildContext();
        var ok = false;
        try { ok = rule.when(c); } catch (e) { ok = false; }
        if (ok) {
          var text;
          try { text = rule.msg(c); } catch (e) { text = cur.message; }
          return { id: rule.id, tier: rule.tier, expression: rule.expr,
                   message: text, action: rule.act, context: c, held: true };
        }
      }
    }

    var m = pick(opts);
    if (!m) return null;
    // One write covers both the held choice and the history entry.
    var recent = s.nova.recent || [];
    var last = recent[0];
    if (!(last && last.id === m.id && last.date === today)) {
      recent.unshift({ id: m.id, date: today, at: Date.now(), text: m.message });
      s.nova.recent = recent.slice(0, 40);
    }
    s.nova.current = { id: m.id, date: today, message: m.message };
    GS.save();
    return m;
  }

  function dismiss() {
    var s = GS.get();
    s.nova.dismissedAt = Date.now();
    GS.save();
  }
  function isDismissed() {
    var s = GS.get();
    // A dismissal lasts until the next local day.
    if (!s.nova.dismissedAt) return false;
    return GS.dateKey(new Date(s.nova.dismissedAt)) === GS.todayKey();
  }
  function setEnabled(on) {
    var s = GS.get();
    s.settings.novaEnabled = !!on;
    s.nova.enabled = !!on;
    GS.save();
  }

  // ---------------------------------------------------------------
  // Card renderer — used on the hub and the Nova page.
  // ---------------------------------------------------------------
  function card(opts) {
    opts = opts || {};
    var s = GS.get();
    if (s.settings && s.settings.novaEnabled === false) return '';
    if (opts.respectDismiss && isDismissed()) return '';
    var m = message();
    if (!m) return '';
    var UI = window.UI;
    return '<section class="card ornate pad nova-card" id="novaCard" data-nova="' + UI.esc(m.id) + '">' +
      '<div class="nova-row">' +
        '<div class="nova-face">' + portrait(m.expression, opts.size || 96) + '</div>' +
        '<div class="grow">' +
          '<div class="nova-head"><span class="lore">Nova</span>' +
            '<button class="nova-x" id="novaDismiss" aria-label="Dismiss">' + UI.icon('close', 15) + '</button>' +
          '</div>' +
          '<p class="nova-msg">' + UI.esc(m.message) + '</p>' +
          '<a class="btn sm" href="' + UI.esc(m.action.href) + '">' + UI.esc(m.action.label) + ' ' + UI.icon('arrow', 14) + '</a>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  var CARD_CSS = `
.nova-row { display: flex; gap: 14px; align-items: center; }
.nova-face { flex: none; filter: drop-shadow(0 6px 18px rgba(124,92,220,.30)); }
.nova-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.nova-x { border: 0; background: transparent; color: var(--text-3); cursor: pointer; padding: 2px; line-height: 0; }
.nova-x:hover { color: var(--text); }
.nova-msg { margin: 6px 0 11px; font-size: 14px; line-height: 1.45; color: var(--text); }
@media (max-width: 460px) {
  .nova-row { gap: 10px; }
  .nova-face svg { width: 74px; height: 74px; }
  .nova-msg { font-size: 13px; }
}
`;

  function mount(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!document.getElementById('nova-css')) {
      var st = document.createElement('style');
      st.id = 'nova-css'; st.textContent = CARD_CSS;
      document.head.appendChild(st);
    }
    el.innerHTML = card(opts || { respectDismiss: true });
    var x = document.getElementById('novaDismiss');
    if (x) x.addEventListener('click', function () { dismiss(); el.innerHTML = ''; });
  }

  window.Nova = {
    RULES: RULES,
    templateCount: RULES.length,
    portrait: portrait,
    expressions: Object.keys(EYES),
    context: buildContext,
    pick: pick,
    message: message,
    remember: remember,
    dismiss: dismiss,
    isDismissed: isDismissed,
    setEnabled: setEnabled,
    card: card,
    mount: mount,
    CARD_CSS: CARD_CSS
  };
})();
