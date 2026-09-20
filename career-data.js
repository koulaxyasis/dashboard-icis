// =============================================================
// ICIS — Career Campaign definition (the Main Story).
//
// Ten chapters in the order they should actually be tackled. The
// definition here is the immutable spine; per-milestone progress,
// deadlines and evidence live in `state.career.chapters[id]` so the
// user can edit dates and tick milestones without the structure
// drifting.
//
// `questTags` links a chapter to the quest library: while a chapter
// is active, the Main Story quest slot draws from templates carrying
// one of these tags.
// =============================================================
(function () {
  'use strict';

  var CHAPTERS = [
    {
      id: 'ch_fmva', n: 1,
      name: 'FMVA Certification',
      lore: 'The First Seal',
      objective: 'Finish the FMVA certification end to end.',
      why: 'The baseline credential every FP&A and analyst shortlist expects.',
      reward: { xp: 600, title: 'Certified Modeller', cosmetic: 'border_gilded' },
      requiredSkills: ['modeling', 'excel'],
      questTags: ['fmva'],
      milestones: [
        { id: 'm1', name: 'Finish the core accounting modules' },
        { id: 'm2', name: 'Finish the Excel and modelling modules' },
        { id: 'm3', name: 'Finish the valuation modules' },
        { id: 'm4', name: 'Pass the final assessment' },
        { id: 'm5', name: 'Download and file the certificate' }
      ]
    },
    {
      id: 'ch_fpna', n: 2,
      name: 'FP&A Certification',
      lore: 'The Second Seal',
      objective: 'Begin and complete the FP&A certification.',
      why: 'This is the specialisation the whole storyline points at.',
      reward: { xp: 700, title: 'Planner of Futures', cosmetic: 'border_azure' },
      requiredSkills: ['fpna', 'modeling'],
      questTags: ['fpna'],
      milestones: [
        { id: 'm1', name: 'Enrol and map the syllabus' },
        { id: 'm2', name: 'Finish budgeting and forecasting modules' },
        { id: 'm3', name: 'Finish variance and reporting modules' },
        { id: 'm4', name: 'Complete the capstone case' },
        { id: 'm5', name: 'Pass the final assessment' }
      ]
    },
    {
      id: 'ch_excel', n: 3,
      name: 'Excel & Financial Modeling',
      lore: 'Mastery of the Grid',
      objective: 'Get genuinely fast and accurate in Excel and modelling.',
      why: 'Speed and accuracy here is what gets noticed in a first internship.',
      reward: { xp: 500, title: 'Gridwright', cosmetic: 'bg_archive' },
      requiredSkills: ['excel', 'modeling'],
      questTags: ['excel', 'modeling'],
      milestones: [
        { id: 'm1', name: 'Shortcut fluency — no mouse for core actions' },
        { id: 'm2', name: 'Lookups, pivots and data cleaning without reference' },
        { id: 'm3', name: 'Build a 3-statement model from blank' },
        { id: 'm4', name: 'Add sensitivity and scenario switching' },
        { id: 'm5', name: 'Audit and fix someone else’s broken model' }
      ]
    },
    {
      id: 'ch_bbs', n: 4,
      name: 'BBS FP&A Project',
      lore: 'The Budgeting Trial',
      objective: 'Build a full budgeting, forecasting, variance and cash-flow model.',
      why: 'The portfolio piece that proves you can do the job, not just pass the exam.',
      reward: { xp: 900, title: 'Keeper of the Budget', cosmetic: 'border_emberwrought' },
      requiredSkills: ['fpna', 'modeling', 'excel'],
      questTags: ['bbs'],
      boss: true,
      milestones: [
        { id: 'm1', name: 'Gather sanitized historical data' },
        { id: 'm2', name: 'Build assumptions' },
        { id: 'm3', name: 'Forecast revenue and costs' },
        { id: 'm4', name: 'Build budget-versus-actual analysis' },
        { id: 'm5', name: 'Build a 13-week cash-flow forecast' },
        { id: 'm6', name: 'Build a management dashboard' },
        { id: 'm7', name: 'Write conclusions and publish a portfolio version' }
      ]
    },
    {
      id: 'ch_vale', n: 5,
      name: 'PT Vale Indonesia Equity Research',
      lore: 'The Deepmine Chronicle',
      objective: 'Polish the existing equity-research project to portfolio standard.',
      why: 'Already started — finishing it is cheaper than starting something new.',
      reward: { xp: 650, title: 'Reader of Markets', cosmetic: 'bg_bourse' },
      requiredSkills: ['equity', 'communication'],
      questTags: ['equity'],
      boss: true,
      milestones: [
        { id: 'm1', name: 'Refresh model inputs and assumptions' },
        { id: 'm2', name: 'Rebuild the comps table' },
        { id: 'm3', name: 'Tighten the valuation section' },
        { id: 'm4', name: 'Write thesis, catalysts and risks' },
        { id: 'm5', name: 'Format and publish the note' }
      ]
    },
    {
      id: 'ch_powerbi', n: 6,
      name: 'Power BI',
      lore: 'The Scrying Arts',
      objective: 'Reach practical working ability in Power BI.',
      why: 'Reporting roles increasingly assume it.',
      reward: { xp: 450, title: 'Seer of Dashboards', cosmetic: 'bg_lumen' },
      requiredSkills: ['powerbi'],
      questTags: ['powerbi'],
      milestones: [
        { id: 'm1', name: 'Load and shape data in Power Query' },
        { id: 'm2', name: 'Build a star-schema data model' },
        { id: 'm3', name: 'Write working DAX measures' },
        { id: 'm4', name: 'Publish one complete report' }
      ]
    },
    {
      id: 'ch_sql', n: 7,
      name: 'SQL Foundations',
      lore: 'First Words of Query',
      objective: 'Reach foundational, interview-ready SQL.',
      why: 'The most common technical screen for analyst roles.',
      reward: { xp: 450, title: 'Speaker of Query', cosmetic: 'border_verdant' },
      requiredSkills: ['sql'],
      questTags: ['sql'],
      milestones: [
        { id: 'm1', name: 'SELECT, WHERE, ORDER BY' },
        { id: 'm2', name: 'JOINs across multiple tables' },
        { id: 'm3', name: 'GROUP BY, HAVING, aggregates' },
        { id: 'm4', name: 'Window functions and subqueries' }
      ]
    },
    {
      id: 'ch_python', n: 8,
      name: 'Python for Finance',
      lore: 'The Serpent’s Tongue',
      objective: 'Reach foundational Python ability for finance work.',
      why: 'Separates you from the median Excel-only candidate.',
      reward: { xp: 500, title: 'Automator', cosmetic: 'bg_circuit' },
      requiredSkills: ['python'],
      questTags: ['python'],
      milestones: [
        { id: 'm1', name: 'Python basics and environment set up' },
        { id: 'm2', name: 'pandas: load, clean, group, plot' },
        { id: 'm3', name: 'Build one finance script end to end' },
        { id: 'm4', name: 'Publish the script with a short README' }
      ]
    },
    {
      id: 'ch_portfolio', n: 9,
      name: 'Publish the Portfolio',
      lore: 'Raise the Standard',
      objective: 'Get every finished project somewhere a recruiter can see it.',
      why: 'Unpublished work does not exist as far as hiring is concerned.',
      reward: { xp: 700, title: 'Standard-Bearer', cosmetic: 'border_radiant' },
      requiredSkills: ['communication', 'modeling'],
      questTags: ['portfolio'],
      milestones: [
        { id: 'm1', name: 'Choose the platform and set it up' },
        { id: 'm2', name: 'Publish the BBS FP&A project' },
        { id: 'm3', name: 'Publish the Vale equity note' },
        { id: 'm4', name: 'Write a short summary for each project' },
        { id: 'm5', name: 'Link the portfolio from your CV and LinkedIn' }
      ]
    },
    {
      id: 'ch_apply', n: 10,
      name: 'Internship Applications',
      lore: 'Petition the Court',
      objective: 'Apply for FP&A, finance analyst, corporate finance, budgeting and reporting internships.',
      why: 'The storyline only resolves here.',
      reward: { xp: 1000, title: 'Candidate of the Realm', cosmetic: 'border_sovereign' },
      requiredSkills: ['networking', 'communication'],
      questTags: ['applications', 'networking', 'interview'],
      milestones: [
        { id: 'm1', name: 'Build a target list of 20 employers' },
        { id: 'm2', name: 'Tailor CV and cover letter templates' },
        { id: 'm3', name: 'Submit the first 10 applications' },
        { id: 'm4', name: 'Reach out to 5 people at target firms' },
        { id: 'm5', name: 'Complete one real interview' }
      ]
    }
  ];

  // Skill trees. `xpPer` is what one completed quest with a matching
  // tag contributes to that skill's own track.
  var SKILLS = [
    { id: 'modeling',      name: 'Financial Modeling',      tags: ['modeling', 'fmva'],       color: '#E9BE6E' },
    { id: 'fpna',          name: 'FP&A',                    tags: ['fpna', 'bbs'],            color: '#7DD3FC' },
    { id: 'excel',         name: 'Excel',                   tags: ['excel'],                  color: '#6BE3A4' },
    { id: 'equity',        name: 'Equity Research',         tags: ['equity'],                 color: '#F0A868' },
    { id: 'powerbi',       name: 'Power BI',                tags: ['powerbi'],                color: '#F2C063' },
    { id: 'sql',           name: 'SQL',                     tags: ['sql'],                    color: '#60A5FA' },
    { id: 'python',        name: 'Python',                  tags: ['python'],                 color: '#A78BFA' },
    { id: 'communication', name: 'Business Communication',  tags: ['communication', 'writing'], color: '#F472B6' },
    { id: 'networking',    name: 'Networking & Interviewing', tags: ['networking', 'applications', 'interview'], color: '#FB923C' }
  ];

  // ---------------------------------------------------------------
  // Progress helpers — read the mutable half out of game state.
  // ---------------------------------------------------------------
  function chapterState(s, id) {
    if (!s.career.chapters[id]) {
      s.career.chapters[id] = { done: {}, deadline: '', notes: '', started: false, evidence: [] };
    }
    var cs = s.career.chapters[id];
    if (!cs.done) cs.done = {};
    if (!cs.evidence) cs.evidence = [];
    return cs;
  }

  function chapterProgress(s, chapter) {
    var cs = chapterState(s, chapter.id);
    var total = chapter.milestones.length;
    var done = chapter.milestones.filter(function (m) { return cs.done[m.id]; }).length;
    return {
      done: done, total: total,
      pct: total ? Math.round((done / total) * 100) : 0,
      complete: total > 0 && done === total,
      deadline: cs.deadline || '',
      notes: cs.notes || '',
      started: !!cs.started || done > 0,
      evidence: cs.evidence
    };
  }

  // The active chapter is the first incomplete one — the storyline is
  // deliberately linear so there is always exactly one "next thing".
  function activeChapter(s) {
    for (var i = 0; i < CHAPTERS.length; i++) {
      var p = chapterProgress(s, CHAPTERS[i]);
      if (!p.complete) return { chapter: CHAPTERS[i], progress: p };
    }
    return { chapter: CHAPTERS[CHAPTERS.length - 1], progress: chapterProgress(s, CHAPTERS[CHAPTERS.length - 1]) };
  }

  function currentMission(s) {
    var a = activeChapter(s);
    var cs = chapterState(s, a.chapter.id);
    var next = a.chapter.milestones.filter(function (m) { return !cs.done[m.id]; })[0];
    return { chapter: a.chapter, progress: a.progress, milestone: next || null };
  }

  // Every chapter deadline that is near or past, soonest first.
  function upcomingDeadlines(s, withinDays) {
    var today = window.GameState.todayKey();
    var out = [];
    CHAPTERS.forEach(function (c) {
      var p = chapterProgress(s, c);
      if (p.complete || !p.deadline) return;
      var days = window.GameState.daysBetween(today, p.deadline);
      if (withinDays == null || days <= withinDays) {
        out.push({ chapter: c, progress: p, days: days, overdue: days < 0 });
      }
    });
    out.sort(function (a, b) { return a.days - b.days; });
    return out;
  }

  function skillTotals(s) {
    return SKILLS.map(function (sk) {
      var xp = 0;
      var ledger = s.ledger || {};
      Object.keys(ledger).forEach(function (k) {
        var e = ledger[k];
        if (e && e.skill === sk.id) xp += Number(e.xp) || 0;
      });
      var c = window.GameState.skillCurve(xp);
      return {
        id: sk.id, name: sk.name, color: sk.color, tags: sk.tags,
        xp: xp, level: c.level, into: c.into, need: c.need, pct: c.pct
      };
    });
  }

  window.CareerData = {
    CHAPTERS: CHAPTERS,
    SKILLS: SKILLS,
    chapterState: chapterState,
    chapterProgress: chapterProgress,
    activeChapter: activeChapter,
    currentMission: currentMission,
    upcomingDeadlines: upcomingDeadlines,
    skillTotals: skillTotals,
    byId: CHAPTERS.reduce(function (a, c) { a[c.id] = c; return a; }, {}),
    skillById: SKILLS.reduce(function (a, c) { a[c.id] = c; return a; }, {})
  };
})();
