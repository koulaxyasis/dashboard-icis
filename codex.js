// =============================================================
// ICIS — the Codex.
//
// One long-form reflective passage per day. Not one-line quotes:
// each entry takes a single idea and actually develops it, which is
// the only kind worth re-reading.
//
// ---- How the daily pick works --------------------------------
// Purely derived from the date. No stored "today's entry", nothing
// written on load, nothing to drift or desync:
//
//   dayIndex   days since a fixed epoch
//   cycle      floor(dayIndex / N)      which pass through the deck
//   position   dayIndex % N             where in that pass
//   order      a shuffle seeded by the cycle
//   entry      order[position]
//
// Because each cycle is a fresh permutation of ALL entries, you see
// every one before any repeats, and the order differs each time
// round. Two devices agree because the seed is the date plus the
// shared install salt.
//
// The tone is deliberately plain. These are about the ordinary
// mechanics of starting, continuing and stopping — not pep talk, and
// explicitly not advice about health or mood.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState;
  var EPOCH = '2020-01-01';

  var ENTRIES = [
    {
      id: 'imperfect_start', theme: 'Starting',
      title: 'The picture in your head is the problem',
      text: 'Procrastination usually starts with an ideal image of how the thing should turn out. You want to begin, but you already hold a finished picture, and every early attempt is measured against it and found wanting. That is not laziness, it is a mismatch you have set up in advance. When you look at people who produce a lot, you cannot see how many times they started badly, because nobody publishes that part. The fear is not of the work. It is of making something imperfect and having to look at it. Waiting for the right moment is a way of protecting yourself from that. The resistance means you care, not that you are weak. But to eventually do something well, you first have to let yourself do it badly.'
    },
    {
      id: 'first_draft', theme: 'Starting',
      title: 'A bad version is a real version',
      text: 'A rough model that balances is worth more than an elegant one you have not built. The rough one can be corrected; the imagined one cannot, because it does not exist yet. There is a strange comfort in keeping work in your head, where it is still flawless. The moment it becomes a file it also becomes judgeable, and that is the part people avoid without naming it. Try lowering the bar for the first version specifically — not for the final one. Make something ugly that runs end to end, then improve it in passes. Nearly everything good you have ever seen was version six or seven of something embarrassing.'
    },
    {
      id: 'twenty_minutes', theme: 'Starting',
      title: 'Negotiate the size, not the doing',
      text: 'When you cannot make yourself start, the instinct is to argue about whether to do it at all. That argument is expensive and you usually lose. A better move is to stop negotiating over whether and negotiate over how much. Twenty minutes. One section. One formula. The point is not that twenty minutes is enough — often it is not — but that starting is the expensive step, and once you are in, continuing costs far less than beginning did. Most sessions that ran for two hours were agreed to as twenty minutes.'
    },
    {
      id: 'comparison', theme: 'Comparison',
      title: 'You are comparing inside to outside',
      text: 'You know every doubt you have had, every abandoned attempt, every evening you did nothing. Of other people you know only what they chose to show. That is not a fair comparison and no amount of effort will make it fair, because the two sets of information are different in kind. This matters practically: when you feel behind, check what you are actually measuring. Usually it is your private record of hesitation against someone’s public record of results. If you want a real comparison, compare yourself to your own work from six months ago. That one is at least made of the same material.'
    },
    {
      id: 'late_start', theme: 'Comparison',
      title: 'Starting later is not starting worse',
      text: 'There is a persistent idea that there was a correct age to have begun, and that having missed it you are now running a race at a disadvantage. In most fields this is simply not how it works. What compounds is not the date you started but the number of repetitions you accumulate, and someone paying real attention for two years will usually pass someone who has been half-present for six. The people who began earlier are not holding a lead you can never close. They are holding a head start in a race with no finish line, which is a much less frightening thing to hold.'
    },
    {
      id: 'motivation', theme: 'Consistency',
      title: 'Motivation arrives late',
      text: 'The common belief is that you feel motivated and therefore act. In practice it runs the other way more often than not: you act, the work becomes concrete, and motivation shows up partway through as a result of the action rather than a precondition for it. This is why waiting to feel ready is such a reliable trap. You are waiting for something that is generated by the thing you are avoiding. It also means a session that starts flat is not evidence of a bad day. It is just the normal shape of the first ten minutes.'
    },
    {
      id: 'streak_break', theme: 'Consistency',
      title: 'The day after you miss',
      text: 'Missing one day costs almost nothing. What costs something is the story you tell about having missed it — that you have proven something about yourself, that the run is ruined, that you may as well stop properly now. That story is what turns one day into three weeks. The people who look consistent are not people who never miss. They are people who treat a missed day as a missed day rather than as a verdict, and who make the next one small enough that returning is easy. Never miss twice is a far more useful rule than never miss.'
    },
    {
      id: 'boring_middle', theme: 'Consistency',
      title: 'The middle is supposed to be dull',
      text: 'Beginnings are interesting because everything is new, and endings are interesting because something resolves. The middle is neither, and the middle is where most of the actual work sits. Many projects are abandoned not because they got hard but because they got boring, and boredom is easily mistaken for a sign that something is wrong. It usually is not. It is the sound of a thing being built. If you can learn to keep going through the unremarkable stretch, you will finish a category of work that most people never see the end of.'
    },
    {
      id: 'small_compound', theme: 'Consistency',
      title: 'Small is not the same as insignificant',
      text: 'An hour of focused work looks like nothing on the day you do it. That is the honest problem with compounding: the feedback arrives long after the behaviour, so early on you are asked to trust a process you cannot yet see working. The way through is to stop grading days by how they felt and start counting them. Thirty unremarkable sessions produce a visible skill. None of them individually felt like the one that mattered, because none of them was.'
    },
    {
      id: 'beginner', theme: 'Learning',
      title: 'Being visibly new is the cost of entry',
      text: 'Nobody enjoys being the least capable person in the room, and the reflex is to hide until you are good enough to be seen. The trouble is that competence mostly comes from being corrected, and you cannot be corrected in private. Every person you consider skilled spent a period being obviously inexperienced in front of someone. They did not skip it; you just met them afterwards. Asking a question that reveals what you do not know is a short, specific discomfort that buys a permanent piece of understanding. That is an unusually good trade.'
    },
    {
      id: 'confusion', theme: 'Learning',
      title: 'Confusion is the work, not a failure of it',
      text: 'There is a moment in learning something technical where nothing fits together and you feel slower than when you started. It is easy to read this as evidence that you are not suited to the material. More often it means you have loaded enough pieces into your head to notice they do not yet connect, which is a strictly later stage than not knowing there were pieces. The discomfort is the sensation of a model being assembled. It usually resolves not by thinking harder but by doing one more concrete example.'
    },
    {
      id: 'teach_back', theme: 'Learning',
      title: 'You do not know it until you can say it plainly',
      text: 'Following an explanation feels like understanding, and it is not. Recognition is much easier than recall, so watching someone build a model produces a confident feeling that collapses the moment you face a blank sheet. The cheapest test is to explain the idea out loud, in your own words, without looking. Wherever the sentence goes vague is exactly where the understanding is thin. This is uncomfortable precisely because it is informative.'
    },
    {
      id: 'finish', theme: 'Finishing',
      title: 'Finishing is a separate skill from starting',
      text: 'Starting is exciting and requires nothing but enthusiasm. Finishing requires deciding that something imperfect is now done, which is a different and less pleasant act. This is why half-built projects accumulate: each new one offers the pleasure of the beginning while letting you postpone the judgement that comes with the end. One completed, slightly disappointing piece of work teaches you more, and is worth more to anyone assessing you, than four promising fragments. Pick the one closest to done and close it.'
    },
    {
      id: 'ninety_percent', theme: 'Finishing',
      title: 'The last ten percent is its own project',
      text: 'The final stretch of a piece of work is rarely more of the same. It is formatting, checking, writing the summary, fixing the thing you knew was wrong and hoped nobody would notice. It is unglamorous and it is where most of the perceived quality actually comes from. Expecting it to feel like the productive middle is what makes people stall there. Budget for it separately, treat it as its own task with its own hours, and it stops feeling like failure to still be working on something you thought was nearly done.'
    },
    {
      id: 'publish', theme: 'Finishing',
      title: 'Unpublished work does not exist',
      text: 'A model on your laptop, however good, is invisible to everyone whose opinion would change your situation. This is uncomfortable because publishing is the moment the work stops being potential and becomes a fixed, judgeable thing. The instinct to polish for one more week is usually that discomfort wearing a respectable disguise. Somewhere past a reasonable standard, additional polish stops improving the work and starts delaying the feedback that would improve it faster.'
    },
    {
      id: 'rest', theme: 'Rest',
      title: 'Rest you chose is different from rest you collapsed into',
      text: 'The same evening spent not working can be two completely different things. Deciding in advance that tonight is off, and then being off, leaves you recovered. Intending to work, failing to, and spending the evening in low-grade guilt leaves you neither rested nor productive. The activity is identical; only the decision differs. If you are going to take the time anyway — and you are — take it deliberately. Deciding is what converts wasted time into recovery.'
    },
    {
      id: 'sleep', theme: 'Rest',
      title: 'The foundation is boring on purpose',
      text: 'Sleep, water, food and movement are unglamorous and easy to treat as optional when you are busy. They are also the variables that set the ceiling on everything else you are trying to do. An extra hour worked against a bad night is usually a poor trade: you buy sixty minutes of low-quality output and pay for it with the next day. Protecting the foundation is not self-indulgence. It is the least interesting and most reliable performance decision available to you.'
    },
    {
      id: 'guilt_rest', theme: 'Rest',
      title: 'Guilt is not a work ethic',
      text: 'Feeling bad about not working can masquerade as caring about the work. It is not the same thing, and it is not productive: guilt reliably makes starting harder, because now the task carries the weight of everything you failed to do before. A day off you have accepted costs you a day. A day off you spend feeling terrible about costs you the day and makes the next one worse. If you have already lost the time, at least stop paying interest on it.'
    },
    {
      id: 'identity', theme: 'Identity',
      title: 'You are not your worst week',
      text: 'After a bad stretch it is tempting to conclude something permanent: that you are undisciplined, that you never follow through, that this is simply what you are like. Notice the tense. A run of poor days is information about those days and the conditions around them. It is not a diagnosis of character. The evidence for what you are like is the whole record, and the whole record almost certainly includes long periods of doing exactly what you said you would.'
    },
    {
      id: 'discipline', theme: 'Identity',
      title: 'Discipline is mostly design',
      text: 'People with apparent self-control are not usually gritting their teeth harder than you. They have arranged things so that less willpower is required: the work is already open, the phone is in another room, the session happens at a time that is defended by default. Willpower is a poor daily strategy because it runs out exactly when you are tired, which is when you most need it. Changing the environment holds up when your resolve does not.'
    },
    {
      id: 'ambition_kindness', theme: 'Identity',
      title: 'Wanting it badly is why it is hard',
      text: 'Resistance tends to scale with how much something matters. The tasks you avoid most are rarely the trivial ones; they are the ones tied to who you want to become, where failing would mean something. Read that way, avoidance stops being evidence of not caring and becomes evidence of the opposite. That reframing is useful, because you cannot shame yourself into starting something you are afraid of, but you can often start it anyway once you understand what the fear is about.'
    },
    {
      id: 'career_slow', theme: 'Career',
      title: 'Careers move in steps, not slopes',
      text: 'Progress feels absent for long stretches and then arrives all at once, because the things that change your situation — a certification finishing, a project going public, an application landing — are discrete events separated by months of invisible preparation. During the flat parts it is natural to conclude that nothing is working. Usually the accumulation is real and simply has not surfaced yet. Judge the flat periods by whether the inputs are happening, not by whether the outcome has arrived.'
    },
    {
      id: 'evidence', theme: 'Career',
      title: 'Build the evidence, not just the ability',
      text: 'Being able to do something and being able to show that you can are two separate assets, and the second is what other people act on. A finished project someone can open is worth more in a hiring conversation than a considerably deeper skill nobody can see. This is not unfair, it is just an information problem: nobody can assess what you have not made visible. When you finish something, spend the extra hour that turns it into evidence.'
    },
    {
      id: 'rejection', theme: 'Career',
      title: 'Applications are a numbers process wearing a personal disguise',
      text: 'A rejection feels like a judgement of you and is usually a judgement of fit, timing, headcount, or a hundred candidates and one seat. The emotional weight it carries is out of proportion to the information it contains. The practical consequence is that the correct response to a rejection is almost always to send the next application, not to spend three days re-examining yourself. Volume and specificity beat agonising, and agonising is what stops volume.'
    },
    {
      id: 'niche', theme: 'Career',
      title: 'Specific beats impressive',
      text: 'There is a pull toward learning everything adjacent to your field, because breadth feels like safety. But people are hired to solve particular problems, and the person who can clearly do one useful thing is easier to say yes to than the person who is vaguely capable across many. Depth also compounds faster, because each new piece attaches to an existing structure instead of starting a new one. Choose the narrow thing and go further into it than feels necessary.'
    },
    {
      id: 'money_anxiety', theme: 'Money',
      title: 'Looking at the number is the hard part',
      text: 'Financial avoidance is rarely about arithmetic. Not checking is a way of not feeling something, and the not-knowing quietly costs more than the knowing would: decisions get made on vague dread instead of figures. The relief people describe after finally opening the accounts is not because the news was good. It is because a specific problem is smaller than an unspecified one, and can actually be acted on.'
    },
    {
      id: 'money_small', theme: 'Money',
      title: 'Track before you optimise',
      text: 'The instinct is to fix spending before understanding it — new rules, new budget, new restrictions, usually abandoned within a month. Measurement first is less satisfying and works better. A few weeks of simply recording where money goes tends to change behaviour on its own, without any rule, because most leakage is invisible rather than deliberate. You cannot make a sensible decision about a number you have never seen.'
    },
    {
      id: 'social_effort', theme: 'People',
      title: 'The reaching out is the part you control',
      text: 'Whether someone replies, is free, or wants to meet is not yours to determine. Sending the message is. Judging your social life by responses puts the scoring in other people’s hands and makes you reluctant to try; judging it by whether you reached out keeps it in yours. Most friendships do not end from conflict. They end because both people were waiting for the other to go first, each reading the silence as disinterest rather than symmetry.'
    },
    {
      id: 'social_drift', theme: 'People',
      title: 'Closeness is maintained, not achieved',
      text: 'It is easy to assume that a good friendship is durable enough to survive neglect, and mostly it is — but the ease of it is not. Contact is what keeps the shared context current, and without it you eventually have to re-explain your life to someone who used to already know. The maintenance is smaller than people expect. A message with no agenda, sent at no particular occasion, does most of it.'
    },
    {
      id: 'ask_help', theme: 'People',
      title: 'Asking is a skill, and it is cheaper than you think',
      text: 'Struggling alone with something someone nearby could resolve in five minutes is common, and the reason is usually fear of appearing incapable. In practice, most people enjoy being asked about things they know. The request flatters their competence and costs them little. The exchange is asymmetric in your favour: a small, brief awkwardness for you, a genuine pleasure for them, and hours saved.'
    },
    {
      id: 'focus_no', theme: 'Focus',
      title: 'Every yes is a quiet no elsewhere',
      text: 'Commitments do not feel like choices when you make them one at a time; each seems small and reasonable in isolation. They compete for the same finite hours regardless, and the thing that gets squeezed is almost always the important work with no deadline attached. Saying no is not primarily about protecting your time from other people. It is about protecting one thing you have decided matters from the many things that merely arrived.'
    },
    {
      id: 'planning_trap', theme: 'Focus',
      title: 'Planning can be a very convincing way to avoid the work',
      text: 'Reorganising the system, choosing the tool, restructuring the plan — all of it feels like progress and produces none. It is appealing because it is comfortable, visibly effortful, and entirely free of the risk of doing the thing badly. A useful check: at the end of a session, ask whether the actual work is further along than when you sat down. If the answer is that the plan is better, you have spent the session avoiding something.'
    },
    {
      id: 'one_thing', theme: 'Focus',
      title: 'Three priorities means no priorities',
      text: 'Attention does not split cleanly. Running several important efforts at once usually produces several half-finished ones and the persistent feeling of being behind on all of them. Sequencing feels slower and is generally faster: one thing carried to completion, then the next. The discomfort of consciously deprioritising something is real, but it is smaller than the discomfort of dragging four unfinished things through the next six months.'
    },
    {
      id: 'setback', theme: 'Setbacks',
      title: 'A setback is information, delivered rudely',
      text: 'Something failing tells you where the weakness is, which is the one thing you could not have learned from success. This is genuinely useful and feels terrible, and the feeling usually arrives first and loudest. The practical move is to delay the conclusions until the reaction has passed. Decisions made in the hour after something goes wrong are almost always too large — quitting, restructuring everything, declaring yourself unsuited. Wait a day and the same event tends to suggest a much smaller correction.'
    },
    {
      id: 'restart', theme: 'Setbacks',
      title: 'Returning is not starting over',
      text: 'After a long gap it feels like everything is lost and the whole climb must be repeated. It is rarely true. Skills degrade far more slowly than confidence does, and most of what feels like lost ground is the awkwardness of the first session back rather than actual regression. The way to find out which it is, is to do one small piece of work. You usually discover that more stayed than you feared.'
    },
    {
      id: 'good_enough', theme: 'Standards',
      title: 'Decide what standard this particular thing deserves',
      text: 'Not everything warrants your best work, and treating every task as maximum-effort is a reliable route to finishing very little. A practice exercise, an internal draft and a portfolio piece deserve genuinely different levels of care. The skill is choosing the standard deliberately at the start rather than defaulting to maximum and then stalling. Perfectionism applied indiscriminately is not high standards. It is an absence of judgement about where standards matter.'
    }
  ];

  // ---------------------------------------------------------------
  // Deterministic daily selection — no storage, no writes.
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
  // Fisher-Yates over the whole deck, so a cycle shows every entry once.
  var orderCache = {};
  function shuffleFor(cycle) {
    if (orderCache[cycle]) return orderCache[cycle];
    var n = ENTRIES.length;
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    var salt = (GS.get().questSalt || 'icis');   // read only; never written here
    var rng = mulberry32(hashStr('codex:' + salt + ':' + cycle));
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(rng() * (j + 1));
      var t = arr[j]; arr[j] = arr[k]; arr[k] = t;
    }
    orderCache[cycle] = arr;
    return arr;
  }

  // Each cycle is shuffled independently, so the last entry of one cycle
  // and the first of the next can be the same one — you would see it two
  // days running. Deterministically swap the first two when that happens.
  function orderFor(cycle) {
    var arr = shuffleFor(cycle).slice();
    if (cycle > 0 && arr.length > 1) {
      var prev = shuffleFor(cycle - 1);
      if (arr[0] === prev[prev.length - 1]) {
        var t = arr[0]; arr[0] = arr[1]; arr[1] = t;
      }
    }
    return arr;
  }

  function positionFor(dateKey) {
    var n = ENTRIES.length;
    var day = GS.daysBetween(EPOCH, dateKey || GS.todayKey());
    var cycle = Math.floor(day / n);
    var pos = ((day % n) + n) % n;
    return { cycle: cycle, pos: pos, n: n };
  }

  function entryFor(dateKey) {
    var p = positionFor(dateKey);
    var entry = ENTRIES[orderFor(p.cycle)[p.pos]];
    return Object.assign({}, entry, {
      dayOfCycle: p.pos + 1, cycleLength: p.n, cycle: p.cycle
    });
  }

  function today() { return entryFor(GS.todayKey()); }
  function tomorrow() { return entryFor(GS.shiftKey(GS.todayKey(), 1)); }

  // ---------------------------------------------------------------
  // Saved entries — user-initiated only, so page loads stay inert.
  // ---------------------------------------------------------------
  function saved() {
    var s = GS.get();
    return Array.isArray(s.codexSaved) ? s.codexSaved : [];
  }
  function isSaved(id) { return saved().indexOf(id) !== -1; }
  function toggleSave(id) {
    GS.update(function (s) {
      if (!Array.isArray(s.codexSaved)) s.codexSaved = [];
      var i = s.codexSaved.indexOf(id);
      if (i === -1) s.codexSaved.push(id); else s.codexSaved.splice(i, 1);
    });
    return isSaved(id);
  }

  // ---------------------------------------------------------------
  // Card
  // ---------------------------------------------------------------
  var CSS = `
.cx { padding:20px 22px; border-color:rgba(233,190,110,.20);
      background:radial-gradient(circle at 88% 0%, rgba(233,190,110,.10), transparent 60%), var(--panel); }
.cx-head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.cx-theme { font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); }
.cx-meta { font-family:var(--mono); font-size:10.5px; color:var(--text-3); }
.cx-title { font-size:19px; font-weight:700; color:var(--text); letter-spacing:-.018em; margin:7px 0 10px; line-height:1.25; }
.cx-text { font-size:15px; line-height:1.68; color:var(--text-2); }
.cx-foot { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:15px; }
@media (max-width:460px){ .cx { padding:17px; } .cx-title { font-size:17px; } .cx-text { font-size:14.5px; line-height:1.62; } }
`;

  function injectCss() {
    if (document.getElementById('codex-css')) return;
    var st = document.createElement('style');
    st.id = 'codex-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function cardHtml(entry, opts) {
    var UI = window.UI;
    opts = opts || {};
    return '<div class="cx-head">' +
        '<span class="cx-theme">Codex · ' + UI.esc(entry.theme) + '</span>' +
        '<span class="cx-meta">' + entry.dayOfCycle + ' / ' + entry.cycleLength + '</span>' +
      '</div>' +
      '<div class="cx-title">' + UI.esc(entry.title) + '</div>' +
      '<div class="cx-text">' + UI.esc(entry.text) + '</div>' +
      (opts.noActions ? '' :
        '<div class="cx-foot">' +
          '<button class="btn sm" data-cxsave="' + UI.esc(entry.id) + '">' +
            UI.icon(isSaved(entry.id) ? 'check' : 'star', 14) +
            (isSaved(entry.id) ? ' Saved' : ' Save') + '</button>' +
          '<a class="btn sm" href="codex.html">All entries ' + UI.icon('arrow', 13) + '</a>' +
        '</div>');
  }

  // Mounts today's entry. Re-rendering is safe: there is no input here,
  // and the entry is derived from the date rather than held in state.
  function mount(elOrId, opts) {
    injectCss();
    opts = opts || {};
    var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.className = 'card ornate cx';

    function draw() { el.innerHTML = cardHtml(today(), opts); }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cxsave]');
      if (!b) return;
      toggleSave(b.getAttribute('data-cxsave'));
      draw();
    });

    draw();
    return { redraw: draw };
  }

  window.Codex = {
    ENTRIES: ENTRIES,
    count: ENTRIES.length,
    themes: ENTRIES.reduce(function (a, e) {
      if (a.indexOf(e.theme) === -1) a.push(e.theme);
      return a;
    }, []),
    entryFor: entryFor,
    today: today,
    tomorrow: tomorrow,
    saved: saved,
    isSaved: isSaved,
    toggleSave: toggleSave,
    cardHtml: cardHtml,
    mount: mount,
    injectCss: injectCss,
    CSS: CSS
  };
})();
