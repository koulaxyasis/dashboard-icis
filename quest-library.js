// =============================================================
// ICIS — quest library. 100 reusable templates.
//
//   40  career & learning        (category: 'career')
//   20  social & fellowship      (category: 'social')
//   15  fitness & health         (category: 'fitness')
//   10  personal finance & admin (category: 'finance')
//   10  recovery & household     (category: 'recovery')
//    5  recreation & exploration (category: 'recreation')
//
// `t()` fills in the defaults so every template carries the full
// schema even when a definition only states what is unusual about it.
// User edits from the library editor live in `quests.libraryOverrides`
// on the game state and are applied over these at read time — so the
// shipped list stays intact and editable at the same time.
// =============================================================
(function () {
  'use strict';

  var XP_BY_DIFFICULTY = { light: 20, normal: 35, hard: 60 };

  function t(o) {
    var difficulty = o.diff || 'normal';
    return {
      id: o.id,
      practicalTitle: o.p,
      loreTitle: o.l,
      description: o.d,
      category: o.c,
      subcategory: o.s || '',
      difficulty: difficulty,
      xp: o.xp != null ? o.xp : XP_BY_DIFFICULTY[difficulty],
      estimatedMinutes: o.min != null ? o.min : (difficulty === 'light' ? 15 : difficulty === 'hard' ? 60 : 30),
      tags: o.tags || [],
      prerequisites: o.pre || [],
      cooldownDays: o.cd != null ? o.cd : 7,
      weekdayOnly: !!o.wd,
      weekendOnly: !!o.we,
      minimumLevel: o.lvl || 1,
      maximumUsesPerWeek: o.mx != null ? o.mx : 1,
      active: o.active !== false,
      weight: o.w != null ? o.w : 1,
      discipline: o.disc || ({ career: 'career', social: 'fellowship', fitness: 'might',
                              finance: 'fortune', recovery: 'vitality', recreation: 'vitality' }[o.c])
    };
  }

  var LIBRARY = [
    // ---------------------------------------------------------------
    // CAREER & LEARNING — 40
    // ---------------------------------------------------------------
    t({ id:'c_fmva_lesson', c:'career', s:'fmva', p:'Complete one FMVA lesson', l:'Rite of the First Seal',
        d:'Finish a single FMVA lesson end to end — not just open it.', diff:'normal', min:35, cd:1, mx:5, tags:['fmva','study'] }),
    t({ id:'c_fmva_quiz', c:'career', s:'fmva', p:'Pass an FMVA quiz', l:'Trial of Recall',
        d:'Sit and pass one FMVA quiz. A retake counts.', diff:'normal', min:20, cd:2, mx:3, tags:['fmva','assessment'] }),
    t({ id:'c_fmva_module', c:'career', s:'fmva', p:'Finish an FMVA module', l:'Seal Unbroken',
        d:'Close out a whole FMVA module and record it as evidence.', diff:'hard', min:90, cd:5, tags:['fmva','milestone'] }),
    t({ id:'c_fpna_lesson', c:'career', s:'fpna', p:'Complete one FP&A lesson', l:'Rite of the Second Seal',
        d:'Finish one FP&A certification lesson.', diff:'normal', min:35, cd:1, mx:5, tags:['fpna','study'] }),
    t({ id:'c_fpna_quiz', c:'career', s:'fpna', p:'Pass an FP&A quiz', l:'Trial of the Ledger',
        d:'Complete and pass an FP&A quiz.', diff:'normal', min:20, cd:2, mx:3, tags:['fpna','assessment'] }),
    t({ id:'c_fpna_module', c:'career', s:'fpna', p:'Finish an FP&A module', l:'Second Seal Unbroken',
        d:'Complete a full FP&A module.', diff:'hard', min:90, cd:5, tags:['fpna','milestone'] }),
    t({ id:'c_fpna_case', c:'career', s:'fpna', p:'Work through an FP&A case study', l:'Field Dispatch',
        d:'Take one case from prompt to recommendation.', diff:'hard', min:60, cd:6, tags:['fpna','case'] }),
    t({ id:'c_excel_shortcuts', c:'career', s:'excel', p:'Drill 10 Excel shortcuts', l:'Swiftfingers Drill',
        d:'Ten shortcuts, no mouse. Speed is a real skill.', diff:'light', min:10, cd:3, mx:3, tags:['excel','drill'] }),
    t({ id:'c_excel_lookup', c:'career', s:'excel', p:'Build an XLOOKUP / INDEX-MATCH exercise', l:'Seeker’s Incantation',
        d:'Wire a lookup across two sheets without hardcoding.', diff:'normal', min:25, cd:5, tags:['excel'] }),
    t({ id:'c_excel_pivot', c:'career', s:'excel', p:'Build a pivot table from raw data', l:'Convergence Table',
        d:'Take an unformatted extract and pivot it into an answer.', diff:'normal', min:25, cd:5, tags:['excel'] }),
    t({ id:'c_excel_clean', c:'career', s:'excel', p:'Clean a messy dataset', l:'Purify the Scroll',
        d:'Dedupe, fix types, split columns, make it modellable.', diff:'normal', min:30, cd:5, tags:['excel','data'] }),
    t({ id:'c_model_3stmt', c:'career', s:'modeling', p:'Link a 3-statement model section', l:'Binding of the Three',
        d:'Connect income statement, balance sheet and cash flow so it balances.', diff:'hard', min:60, cd:6, tags:['modeling'] }),
    t({ id:'c_model_assumption', c:'career', s:'modeling', p:'Write a clean assumptions tab', l:'Tablet of Premises',
        d:'Every driver in one place, sourced and labelled.', diff:'normal', min:30, cd:6, tags:['modeling'] }),
    t({ id:'c_model_revenue', c:'career', s:'modeling', p:'Build a revenue driver block', l:'Wellspring Schema',
        d:'Volume × price, not a single hardcoded growth rate.', diff:'normal', min:35, cd:6, tags:['modeling'] }),
    t({ id:'c_model_cost', c:'career', s:'modeling', p:'Build a cost build-up', l:'Ledger of Burdens',
        d:'Split fixed and variable, tie to drivers.', diff:'normal', min:35, cd:6, tags:['modeling'] }),
    t({ id:'c_model_dcf', c:'career', s:'modeling', p:'Build or review a DCF section', l:'Rite of Present Value',
        d:'WACC, terminal value, sanity-check the output.', diff:'hard', min:60, cd:7, tags:['modeling','valuation'] }),
    t({ id:'c_model_sensitivity', c:'career', s:'modeling', p:'Add a sensitivity table', l:'Web of Outcomes',
        d:'Two-variable data table on the assumptions that actually matter.', diff:'normal', min:25, cd:7, tags:['modeling'] }),
    t({ id:'c_model_audit', c:'career', s:'modeling', p:'Audit a model for broken links', l:'Hunt the Fracture',
        d:'Trace precedents, kill hardcodes, fix the errors you find.', diff:'normal', min:30, cd:7, tags:['modeling','quality'] }),
    t({ id:'c_bbs_data', c:'career', s:'bbs', p:'BBS: gather sanitized historical data', l:'Gathering of Records',
        d:'Pull and anonymise the history the model needs.', diff:'normal', min:40, cd:5, tags:['bbs','project'] }),
    t({ id:'c_bbs_budget', c:'career', s:'bbs', p:'BBS: build budget vs actual', l:'Scales of Judgement',
        d:'Lay actuals against budget with clean variance columns.', diff:'hard', min:60, cd:5, tags:['bbs','project'] }),
    t({ id:'c_bbs_variance', c:'career', s:'bbs', p:'BBS: write variance commentary', l:'Testimony of Deviation',
        d:'Explain the three biggest variances in plain language.', diff:'normal', min:30, cd:5, tags:['bbs','project'] }),
    t({ id:'c_bbs_cashflow', c:'career', s:'bbs', p:'BBS: extend the 13-week cash flow', l:'Tide Chart',
        d:'Roll the forecast forward and reconcile the opening balance.', diff:'hard', min:55, cd:5, tags:['bbs','project'] }),
    t({ id:'c_bbs_dashboard', c:'career', s:'bbs', p:'BBS: improve the management dashboard', l:'Warroom Display',
        d:'One screen a manager could actually make a decision from.', diff:'hard', min:60, cd:6, tags:['bbs','project'] }),
    t({ id:'c_vale_update', c:'career', s:'equity', p:'Update the Vale Indonesia model', l:'Tending the Deepmine',
        d:'Refresh inputs and re-run the valuation.', diff:'normal', min:45, cd:6, tags:['equity','project'] }),
    t({ id:'c_vale_writeup', c:'career', s:'equity', p:'Write one section of the Vale note', l:'Chronicle of the Mine',
        d:'One section — thesis, risks, or catalysts — written properly.', diff:'normal', min:40, cd:6, tags:['equity','writing'] }),
    t({ id:'c_vale_comps', c:'career', s:'equity', p:'Refresh the comps table', l:'Council of Peers',
        d:'Update trading multiples and check the peer set still makes sense.', diff:'normal', min:30, cd:7, tags:['equity'] }),
    t({ id:'c_pbi_visual', c:'career', s:'powerbi', p:'Build one Power BI visual', l:'Scrying Glass',
        d:'One visual answering one specific question.', diff:'normal', min:30, cd:4, tags:['powerbi'] }),
    t({ id:'c_pbi_dax', c:'career', s:'powerbi', p:'Write a DAX measure', l:'Runes of Measure',
        d:'A measure, not a calculated column. Know the difference.', diff:'normal', min:25, cd:4, tags:['powerbi'] }),
    t({ id:'c_pbi_model', c:'career', s:'powerbi', p:'Set up a Power BI data model', l:'Weave the Lattice',
        d:'Relationships, star schema, correct cardinality.', diff:'hard', min:45, cd:7, tags:['powerbi'] }),
    t({ id:'c_sql_select', c:'career', s:'sql', p:'Practise SELECT, WHERE and JOIN', l:'First Words of Query',
        d:'Write five queries against a practice database.', diff:'normal', min:30, cd:3, mx:2, tags:['sql'] }),
    t({ id:'c_sql_aggregate', c:'career', s:'sql', p:'Practise GROUP BY and aggregates', l:'Summoning the Sum',
        d:'Aggregate, filter with HAVING, order the result.', diff:'normal', min:30, cd:4, tags:['sql'] }),
    t({ id:'c_sql_window', c:'career', s:'sql', p:'Practise a window function', l:'Lens of the Running Total',
        d:'ROW_NUMBER, LAG, or a running total over a partition.', diff:'hard', min:40, cd:6, tags:['sql'] }),
    t({ id:'c_py_pandas', c:'career', s:'python', p:'Do a pandas data exercise', l:'Serpent’s Grasp',
        d:'Load, filter, group and plot a dataset in pandas.', diff:'normal', min:35, cd:4, tags:['python'] }),
    t({ id:'c_py_finance', c:'career', s:'python', p:'Write a small finance script', l:'Automaton of Coin',
        d:'Something small and real — returns, amortisation, a scraper.', diff:'hard', min:45, cd:6, tags:['python'] }),
    t({ id:'c_comm_summary', c:'career', s:'communication', p:'Write a one-page executive summary', l:'Word of Command',
        d:'One page. Conclusion first. No filler.', diff:'normal', min:30, cd:5, tags:['communication'] }),
    t({ id:'c_net_message', c:'career', s:'networking', p:'Message one finance professional', l:'Send the Raven',
        d:'A short, specific, non-generic message to one person.', diff:'normal', min:15, cd:3, mx:3, tags:['networking'] }),
    t({ id:'c_net_coffee', c:'career', s:'networking', p:'Request an informational chat', l:'Parley Request',
        d:'Ask one person for fifteen minutes about their work.', diff:'normal', min:15, cd:6, tags:['networking'] }),
    t({ id:'c_apply_internship', c:'career', s:'applications', p:'Submit one internship application', l:'Petition the Court',
        d:'One real, tailored application. Generic blasts do not count.', diff:'hard', min:45, cd:2, mx:5, tags:['applications'] }),
    t({ id:'c_interview_prep', c:'career', s:'communication', p:'Prepare one interview answer', l:'Rehearse the Oath',
        d:'Pick a likely question and write a structured answer out loud.', diff:'normal', min:25, cd:4, tags:['interview'] }),
    t({ id:'c_portfolio_publish', c:'career', s:'portfolio', p:'Publish or update a portfolio project', l:'Raise the Standard',
        d:'Push a project somewhere a recruiter could actually see it.', diff:'hard', min:60, cd:7, tags:['portfolio'] }),

    // ---------------------------------------------------------------
    // SOCIAL & FELLOWSHIP — 20
    // ---------------------------------------------------------------
    t({ id:'s_reconnect', c:'social', p:'Message someone you have not spoken to recently', l:'Rekindle an Old Bond',
        d:'No agenda. Just tell them you thought of them.', diff:'light', min:10, cd:3, mx:3, tags:['reach-out'] }),
    t({ id:'s_coffee', c:'social', p:'Invite someone for coffee or lunch', l:'Summon to the Hearth',
        d:'The invitation is the quest. Their answer is not your score.', diff:'normal', min:15, cd:5, tags:['invite'] }),
    t({ id:'s_event', c:'social', p:'Attend a campus or professional event', l:'Walk Among the Guilds',
        d:'Show up. Stay long enough to talk to one person.', diff:'hard', min:90, cd:7, tags:['event'] }),
    t({ id:'s_phoneless_meal', c:'social', p:'Have one meal without your phone', l:'Feast Unbroken',
        d:'One meal, phone away, present with whoever is there.', diff:'light', min:30, cd:2, mx:3, tags:['presence'] }),
    t({ id:'s_call_family', c:'social', p:'Call a family member', l:'Word to the Homeland',
        d:'A call, not a text.', diff:'light', min:15, cd:3, mx:3, tags:['family'] }),
    t({ id:'s_study_group', c:'social', p:'Join or host a study session', l:'Circle of Scholars',
        d:'Study alongside someone, even quietly.', diff:'normal', min:60, cd:6, tags:['study'] }),
    t({ id:'s_thanks', c:'social', p:'Thank or compliment someone sincerely', l:'Grant a Boon',
        d:'Specific, not generic. Tell them what they actually did.', diff:'light', min:5, cd:3, mx:3, tags:['gratitude'] }),
    t({ id:'s_plan_weekend', c:'social', p:'Plan a weekend activity with someone', l:'Chart the Expedition',
        d:'Pick a time and a place, not just "we should hang out".', diff:'normal', min:15, cd:6, tags:['plan'] }),
    t({ id:'s_new_person', c:'social', p:'Talk to someone outside your usual circle', l:'Stranger at the Gate',
        d:'One real conversation with someone new.', diff:'normal', min:20, cd:7, tags:['expand'] }),
    t({ id:'s_hangout', c:'social', p:'Spend an hour hanging out without tracking productivity', l:'Hours Off the Ledger',
        d:'No optimising. That is the point.', diff:'normal', min:60, cd:5, tags:['rest'] }),
    t({ id:'s_reply_backlog', c:'social', p:'Clear your unread messages', l:'Empty the Message Stone',
        d:'Reply to the people you have been leaving on read.', diff:'light', min:20, cd:4, tags:['admin'] }),
    t({ id:'s_birthday', c:'social', p:'Send a birthday or milestone note', l:'Mark the Naming Day',
        d:'Catch the one you would otherwise miss.', diff:'light', min:5, cd:5, tags:['reach-out'] }),
    t({ id:'s_walk_friend', c:'social', p:'Take a walk with someone', l:'Roadfellows',
        d:'Walk and talk. Two quests in one.', diff:'normal', min:40, cd:6, tags:['activity'] }),
    t({ id:'s_intro', c:'social', p:'Introduce two people who should know each other', l:'Weave the Alliance',
        d:'Be the connector. It costs you nothing.', diff:'light', min:10, cd:10, tags:['network'] }),
    t({ id:'s_club', c:'social', p:'Show up to a club or society meeting', l:'Answer the Muster',
        d:'Attendance counts even when you are quiet.', diff:'normal', min:60, cd:7, tags:['event'] }),
    t({ id:'s_help', c:'social', p:'Offer help to someone with their work', l:'Lend the Shield',
        d:'Offer before being asked.', diff:'normal', min:30, cd:6, tags:['support'] }),
    t({ id:'s_ask_help', c:'social', p:'Ask someone for advice', l:'Seek the Elder’s Counsel',
        d:'Asking is a skill. Practise it.', diff:'normal', min:20, cd:6, tags:['support'] }),
    t({ id:'s_group_plan', c:'social', p:'Propose a group plan', l:'Raise the Warband',
        d:'Be the one who actually suggests something.', diff:'normal', min:15, cd:7, tags:['plan'] }),
    t({ id:'s_follow_up', c:'social', p:'Follow up on a plan you left hanging', l:'Close the Open Thread',
        d:'Resurrect the plan that quietly died in the group chat.', diff:'light', min:10, cd:5, tags:['plan'] }),
    t({ id:'s_share_win', c:'social', p:'Tell someone about a recent win', l:'Sound the Horn',
        d:'Let one person be glad for you.', diff:'light', min:10, cd:6, tags:['share'] }),

    // ---------------------------------------------------------------
    // FITNESS & HEALTH — 15
    // ---------------------------------------------------------------
    t({ id:'f_session', c:'fitness', p:'Complete a full training session', l:'Trial of the Training Grounds',
        d:'Your planned session, finished.', diff:'hard', min:75, cd:1, mx:5, tags:['gym'] }),
    t({ id:'f_short', c:'fitness', p:'Do a 20-minute short session', l:'Skirmish Drill',
        d:'Short counts. Showing up is the habit.', diff:'light', min:20, cd:1, mx:4, tags:['gym'] }),
    t({ id:'f_pr', c:'fitness', p:'Attempt a PR on a main lift', l:'Challenge the Limit',
        d:'One honest attempt at a personal record.', diff:'hard', min:60, cd:10, tags:['gym'] }),
    t({ id:'f_walk', c:'fitness', p:'Walk 8,000 steps', l:'The Long Road',
        d:'Distance over the day, not in one go.', diff:'normal', min:60, cd:2, mx:4, tags:['cardio'] }),
    t({ id:'f_mobility', c:'fitness', p:'Do 10 minutes of mobility work', l:'Loosen the Joints',
        d:'Hips, shoulders, ankles. The boring stuff that keeps you training.', diff:'light', min:10, cd:2, mx:4, tags:['mobility'] }),
    t({ id:'f_core', c:'fitness', p:'Do a core circuit', l:'Forge the Keystone',
        d:'Ten focused minutes.', diff:'light', min:12, cd:3, mx:3, tags:['gym'] }),
    t({ id:'f_cardio', c:'fitness', p:'Do 20 minutes of cardio', l:'Breath of the Runner',
        d:'Row, run, cycle, swim — anything sustained.', diff:'normal', min:25, cd:2, mx:3, tags:['cardio'] }),
    t({ id:'f_water', c:'fitness', s:'health', p:'Hit your water target', l:'Draw from the Healing Spring',
        d:'Reach the daily target on the water tracker.', diff:'light', min:5, cd:1, mx:7, tags:['hydration'], disc:'vitality' }),
    t({ id:'f_protein', c:'fitness', s:'health', p:'Hit your protein target', l:'Feast of Sinew',
        d:'Enough protein to make the training count.', diff:'normal', min:10, cd:1, mx:5, tags:['nutrition'], disc:'vitality' }),
    t({ id:'f_sleep', c:'fitness', s:'health', p:'Get 7+ hours of sleep', l:'Deep Rest',
        d:'The cheapest performance gain available.', diff:'normal', min:0, cd:1, mx:7, tags:['sleep'], disc:'vitality' }),
    t({ id:'f_no_late_caffeine', c:'fitness', s:'health', p:'No caffeine after your cutoff', l:'Seal the Alchemist’s Lab',
        d:'Respect the cutoff time set in the caffeine tracker.', diff:'light', min:0, cd:1, mx:7, tags:['caffeine'], disc:'vitality' }),
    t({ id:'f_stretch', c:'fitness', p:'Stretch after training', l:'Cooling the Forge',
        d:'Five minutes at the end of the session.', diff:'light', min:8, cd:2, mx:4, tags:['mobility'] }),
    t({ id:'f_posture', c:'fitness', p:'Do a posture check routine', l:'Stand as a Knight',
        d:'The desk-worker antidote.', diff:'light', min:8, cd:3, mx:3, tags:['posture'] }),
    t({ id:'f_weigh', c:'fitness', s:'health', p:'Log your weight', l:'Read the Scales',
        d:'Data, not judgement.', diff:'light', min:2, cd:3, mx:3, tags:['tracking'], disc:'vitality' }),
    t({ id:'f_photo', c:'fitness', p:'Take a progress photo', l:'Capture the Likeness',
        d:'Same light, same pose, same time of day.', diff:'light', min:5, cd:10, tags:['tracking'] }),

    // ---------------------------------------------------------------
    // PERSONAL FINANCE & ADMIN — 10
    // ---------------------------------------------------------------
    t({ id:'m_log_spend', c:'finance', p:'Log today’s spending', l:'Count the Day’s Coin',
        d:'Every transaction, into the tracker.', diff:'light', min:8, cd:1, mx:5, tags:['tracking'] }),
    t({ id:'m_review_week', c:'finance', p:'Review this week’s spending', l:'Audit of the Vault',
        d:'Look at where it actually went.', diff:'normal', min:20, cd:6, tags:['review'] }),
    t({ id:'m_networth', c:'finance', p:'Update your net worth snapshot', l:'Weigh the Hoard',
        d:'Refresh balances and record a snapshot.', diff:'normal', min:15, cd:6, tags:['networth'] }),
    t({ id:'m_subs', c:'finance', p:'Review your subscriptions', l:'Break the Binding Contracts',
        d:'List what renews this month and whether it earns its keep.', diff:'normal', min:20, cd:14, tags:['subscriptions'] }),
    t({ id:'m_budget', c:'finance', p:'Set next month’s budget', l:'Decree of Allocation',
        d:'Decide before the month spends itself.', diff:'hard', min:40, cd:21, tags:['budget'] }),
    t({ id:'m_save', c:'finance', p:'Move money to savings', l:'Seal the Reserve',
        d:'Any amount. The transfer is the habit.', diff:'light', min:5, cd:7, tags:['savings'] }),
    t({ id:'m_cancel', c:'finance', p:'Cancel one unused subscription', l:'Sever the Leech',
        d:'One recurring charge you do not use.', diff:'normal', min:15, cd:21, tags:['subscriptions'] }),
    t({ id:'m_invoice', c:'finance', p:'Send or chase an invoice', l:'Claim What Is Owed',
        d:'Freelance income does not collect itself.', diff:'normal', min:20, cd:7, tags:['income'] }),
    t({ id:'m_doc', c:'finance', p:'File one document or receipt', l:'Shelve the Scroll',
        d:'Out of the pile, into the folder.', diff:'light', min:10, cd:5, tags:['admin'] }),
    t({ id:'m_price', c:'finance', p:'Compare prices before a planned purchase', l:'Haggler’s Diligence',
        d:'Ten minutes of checking before you buy.', diff:'light', min:12, cd:10, tags:['spending'] }),

    // ---------------------------------------------------------------
    // RECOVERY & HOUSEHOLD — 10
    // ---------------------------------------------------------------
    t({ id:'r_rest', c:'recovery', p:'Take a deliberate rest day', l:'The Sanctioned Respite',
        d:'Chosen rest, not collapsed rest. It still counts as progress.', diff:'light', min:0, cd:5, tags:['rest'] }),
    t({ id:'r_tidy', c:'recovery', p:'Tidy your desk', l:'Clear the Workbench',
        d:'Clear surface, clearer session.', diff:'light', min:12, cd:3, mx:3, tags:['home'] }),
    t({ id:'r_laundry', c:'recovery', p:'Do laundry', l:'Cleanse the Garb',
        d:'Wash, dry, and actually put it away.', diff:'light', min:25, cd:4, mx:2, tags:['home'] }),
    t({ id:'r_dishes', c:'recovery', p:'Clear the kitchen', l:'Restore the Hearth',
        d:'Sink empty before bed.', diff:'light', min:15, cd:2, mx:4, tags:['home'] }),
    t({ id:'r_inbox', c:'recovery', p:'Get your inbox to zero', l:'Still the Whispers',
        d:'Archive ruthlessly.', diff:'normal', min:25, cd:5, tags:['admin'] }),
    t({ id:'r_screens', c:'recovery', p:'Spend an hour without screens', l:'The Dark Hour',
        d:'One hour, no glass.', diff:'normal', min:60, cd:4, tags:['rest'] }),
    t({ id:'r_meditate', c:'recovery', p:'Sit quietly for 10 minutes', l:'Commune with Stillness',
        d:'Timer on, eyes shut, nothing to achieve.', diff:'light', min:10, cd:2, mx:4, tags:['rest'] }),
    t({ id:'r_early', c:'recovery', p:'Be in bed by your target time', l:'Retire Before the Watch',
        d:'Lights out when you said you would.', diff:'normal', min:0, cd:2, mx:4, tags:['sleep'] }),
    t({ id:'r_plan_tomorrow', c:'recovery', p:'Plan tomorrow before bed', l:'Chart the Morrow',
        d:'Three things, written down, before you sleep.', diff:'light', min:10, cd:1, mx:5, tags:['planning'] }),
    t({ id:'r_declutter', c:'recovery', p:'Throw out or donate five things', l:'Shed the Deadweight',
        d:'Five items out of the house.', diff:'light', min:20, cd:10, tags:['home'] }),

    // ---------------------------------------------------------------
    // RECREATION & EXPLORATION — 5
    // ---------------------------------------------------------------
    t({ id:'x_read', c:'recreation', p:'Read 20 pages of a non-work book', l:'Tales Beyond the Ledger',
        d:'Fiction counts. Especially fiction.', diff:'light', min:25, cd:2, mx:4, tags:['reading'] }),
    t({ id:'x_explore', c:'recreation', p:'Visit somewhere you have never been', l:'Uncharted Territory',
        d:'A new café, park, or neighbourhood.', diff:'normal', min:60, cd:10, we:true, tags:['explore'] }),
    t({ id:'x_creative', c:'recreation', p:'Spend 30 minutes on a hobby', l:'The Idle Craft',
        d:'Something with no career value whatsoever.', diff:'normal', min:30, cd:3, mx:3, tags:['hobby'] }),
    t({ id:'x_music', c:'recreation', p:'Listen to a full album properly', l:'Bard’s Long Song',
        d:'Start to finish, not as background.', diff:'light', min:40, cd:6, tags:['music'] }),
    t({ id:'x_outdoors', c:'recreation', p:'Spend 30 minutes outdoors', l:'Under the Open Sky',
        d:'Outside, no destination required.', diff:'light', min:30, cd:2, mx:4, tags:['outdoors'] })
  ];

  // Sanity: the spec fixes the shape of this library, so fail loudly in
  // the console if an edit ever breaks the counts.
  var counts = LIBRARY.reduce(function (a, q) { a[q.category] = (a[q.category] || 0) + 1; return a; }, {});
  var EXPECTED = { career: 40, social: 20, fitness: 15, finance: 10, recovery: 10, recreation: 5 };
  Object.keys(EXPECTED).forEach(function (k) {
    if (counts[k] !== EXPECTED[k]) {
      console.warn('[quest-library] ' + k + ': expected ' + EXPECTED[k] + ', found ' + (counts[k] || 0));
    }
  });

  window.QuestLibrary = {
    all: LIBRARY,
    counts: counts,
    expected: EXPECTED,
    byId: LIBRARY.reduce(function (a, q) { a[q.id] = q; return a; }, {}),
    categories: ['career', 'social', 'fitness', 'finance', 'recovery', 'recreation'],
    difficultyXp: XP_BY_DIFFICULTY,
    make: t
  };
})();
