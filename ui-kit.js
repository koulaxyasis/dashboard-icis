// =============================================================
// ICIS — shared UI kit.
//
// One stylesheet, one icon set, one nav, one HUD. Every page pulls
// from here so the world looks like one place.
//
// Icons are inline SVG rather than emoji: emoji render differently on
// every platform and cannot be recoloured per discipline.
// =============================================================
(function () {
  'use strict';

  var GS = window.GameState;

  // ---------------------------------------------------------------
  // Icons — 24x24 stroke paths. `UI.icon(name)` returns an <svg>.
  // ---------------------------------------------------------------
  var ICONS = {
    quest:     '<path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M14 4v6h6"/><path d="M8 13l2 2 4-4"/>',
    guild:     '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/>',
    career:    '<path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z"/><path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3"/><path d="M3 13h18"/>',
    training:  '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
    spring:    '<path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z"/>',
    treasury:  '<path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/><path d="M3 9l3-5h12l3 5"/><path d="M12 13v3"/>',
    alchemy:   '<path d="M9 3h6"/><path d="M10 3v6l-5 8.5A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-3.5L14 9V3"/><path d="M7.5 15h9"/>',
    tavern:    '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 3v2M11 3v2M15 3v2"/>',
    hero:      '<path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z"/><path d="M12 8v5M9.5 10.5h5"/>',
    spirit:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    sword:     '<path d="M14.5 3.5L20 9l-9.5 9.5-2-2L4 21l-1-1 4.5-4.5-2-2L14.5 3.5z"/>',
    scroll:    '<path d="M5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H7a2 2 0 0 1-2-2V4z"/><path d="M9 8h6M9 12h6"/>',
    flame:     '<path d="M12 21a5 5 0 0 0 5-5c0-4-5-9-5-9s-5 5-5 9a5 5 0 0 0 5 5z"/><path d="M12 18a2 2 0 0 0 2-2c0-1.5-2-3.5-2-3.5s-2 2-2 3.5a2 2 0 0 0 2 2z"/>',
    star:      '<path d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.1-5.6-3.2-5.6 3.2 1.3-6.1L3 9.6l6.3-.7L12 3z"/>',
    trophy:    '<path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M10 14h4M9 20h6M12 14v6"/>',
    check:     '<path d="M4 12.5l5 5L20 6.5"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    dice:      '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrow:     '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron:   '<path d="M9 6l6 6-6 6"/>',
    close:     '<path d="M6 6l12 12M18 6L6 18"/>',
    gear:      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    people:    '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17 14.5a6 6 0 0 1 4 5.5"/>',
    skull:     '<path d="M12 3a8 8 0 0 0-8 8v3l2 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3l2-1v-3a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/>',
    book:      '<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V4z"/>',
    bolt:      '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>'
  };

  function icon(name, size, cls) {
    var d = ICONS[name] || ICONS.star;
    var s = size || 20;
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" width="' + s + '" height="' + s +
      '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  // ---------------------------------------------------------------
  // World map — the rename layer. Fantasy name on top, plain name under.
  // ---------------------------------------------------------------
  var WORLD = [
    { key: 'hub',     href: 'index.html',     lore: 'Adventurer Hub',    practical: 'Home',            icon: 'star',     color: '#E9BE6E' },
    { key: 'quest',   href: 'main.html',      lore: 'Quest Board',       practical: 'Goals',           icon: 'quest',    color: '#FBBF24' },
    { key: 'career',  href: 'career.html',    lore: 'Career Guild',      practical: 'Career',          icon: 'career',   color: '#E9BE6E' },
    { key: 'guild',   href: 'guild.html',     lore: "Adventurer's Guild",practical: 'Projects',        icon: 'guild',    color: '#A78BFA' },
    { key: 'training',href: 'gym.html',       lore: 'Training Grounds',  practical: 'Fitness',         icon: 'training', color: '#F87171' },
    { key: 'spring',  href: 'po-water.html',  lore: 'Healing Spring',    practical: 'Water',           icon: 'spring',   color: '#60A5FA' },
    { key: 'treasury',href: 'finance.html',   lore: 'Treasury',          practical: 'Finance',         icon: 'treasury', color: '#34D399' },
    { key: 'alchemy', href: 'caffeine.html',  lore: "Alchemist's Lab",   practical: 'Caffeine',        icon: 'alchemy',  color: '#C9A36B' },
    { key: 'tavern',  href: 'tavern.html',    lore: 'Tavern',            practical: 'Social',          icon: 'tavern',   color: '#F472B6' },
    { key: 'hero',    href: 'character.html', lore: 'Hero Profile',      practical: 'Character',       icon: 'hero',     color: '#E9BE6E' },
    { key: 'spirit',  href: 'nova.html',      lore: 'Spirit Companion',  practical: 'Nova',            icon: 'spirit',   color: '#A78BFA' }
  ];

  // Bottom nav keeps to five so the tap targets stay usable on a phone.
  var NAV = ['hub', 'quest', 'career', 'guild', 'hero'];

  // ---------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------
  var CSS = `
:root {
  /* Deep navy / charcoal rather than pure black — per spec. */
  --bg:        #0B0E1A;
  --bg-2:      #0F1322;
  --panel:     rgba(255,255,255,0.045);
  --panel-2:   rgba(255,255,255,0.07);
  --line:      rgba(255,255,255,0.09);
  --line-2:    rgba(255,255,255,0.16);

  --text:      #F2F3F7;
  --text-2:    #AFB4C6;
  --text-3:    #767D95;

  --gold:      #E9BE6E;
  --gold-dim:  #B98F42;
  --gold-hi:   #F8E3B4;

  --career:    #E9BE6E;
  --arcana:    #A78BFA;
  --resolve:   #FBBF24;
  --might:     #F87171;
  --vitality:  #60A5FA;
  --fellowship:#F472B6;
  --fortune:   #34D399;

  --ok:        #6BE3A4;
  --warn:      #F0A868;
  --bad:       #F2777A;

  --r-sm: 10px; --r: 14px; --r-lg: 18px;
  --font: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
/* Only pages that opt in with the data-icis attribute take the layout.
   The token block above is global, so the older tracker pages pick up
   the navy palette through their own var() usage without their
   structure being rewritten underneath them. */
body.icis * { box-sizing: border-box; }
body.icis {
  margin: 0;
  min-height: 100vh; position: relative; overflow-x: hidden;
  background: var(--bg); color: var(--text-2);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  padding: max(18px, env(safe-area-inset-top)) 18px 90px;
}
/* Every page that gets the nav needs room under it. */
body.has-nav { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
/* One static gradient. No perpetual motion behind the text. */
body.icis::before {
  content: ''; position: fixed; inset: 0; z-index: -2; pointer-events: none;
  background:
    radial-gradient(900px 500px at 78% -8%, rgba(233,190,110,0.10), transparent 60%),
    radial-gradient(700px 500px at 10% 105%, rgba(167,139,250,0.08), transparent 60%),
    linear-gradient(180deg, #0B0E1A 0%, #0C1020 60%, #0A0D18 100%);
}
.wrap { max-width: 1120px; margin: 0 auto; }

/* ---------- type ---------- */
.h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em; color: var(--text); }
.lore { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); }
.sub { font-size: 12px; color: var(--text-3); }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }

/* Wraps: section headers carry controls (mode switch, reroll, links) that
   do not fit beside the label on a narrow phone. */
.sec { display: flex; align-items: baseline; justify-content: space-between;
       gap: 8px 12px; margin: 26px 0 12px; flex-wrap: wrap; }
.sec-t { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); }
.sec-m { font-size: 11px; color: var(--text-3); font-family: var(--mono); }

/* ---------- card ---------- */
.card {
  position: relative; overflow: hidden;
  background: var(--panel); border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: 0 10px 34px rgba(0,0,0,0.42);
}
.card.pad { padding: 16px; }
/* Ornamental corner ticks — cheap fantasy framing, no image needed. */
.card.ornate::before, .card.ornate::after {
  content: ''; position: absolute; width: 12px; height: 12px; pointer-events: none;
  border-color: rgba(233,190,110,0.5); border-style: solid; border-width: 0;
}
.card.ornate::before { top: 8px; left: 8px; border-top-width: 1.5px; border-left-width: 1.5px; border-top-left-radius: 4px; }
.card.ornate::after  { bottom: 8px; right: 8px; border-bottom-width: 1.5px; border-right-width: 1.5px; border-bottom-right-radius: 4px; }

/* ---------- bars ---------- */
.track { height: 9px; border-radius: 6px; background: rgba(0,0,0,0.45); border: 1px solid var(--line); overflow: hidden; }
.track.sm { height: 5px; border: 0; }
.fill { height: 100%; width: 0; border-radius: 5px; background: linear-gradient(90deg, var(--gold-dim), var(--gold) 65%, var(--gold-hi)); transition: width .6s cubic-bezier(.22,1,.36,1); }
.fill.plain { background: currentColor; }

/* ---------- rank badge ---------- */
.rank {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 22px; padding: 0 7px;
  border-radius: 6px; font-family: var(--mono); font-size: 11px; font-weight: 800;
  color: #241905; background: linear-gradient(180deg, var(--gold-hi), var(--gold-dim));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}
.rank.r-F, .rank.r-E { background: linear-gradient(180deg,#C9CEDC,#7C8298); color:#1B1E27; }
.rank.r-D, .rank.r-C { background: linear-gradient(180deg,#9FD8C0,#4E8C74); color:#08130E; }
.rank.r-B, .rank.r-A { background: linear-gradient(180deg,#F8E3B4,#B98F42); color:#241905; }
.rank.r-S, .rank.r-SS{ background: linear-gradient(180deg,#F6C9FF,#9A5BD6); color:#1B0724; }

/* ---------- chips / buttons ---------- */
.btn {
  display: inline-flex; align-items: center; gap: 7px; justify-content: center;
  padding: 10px 14px; border-radius: var(--r); border: 1px solid var(--line-2);
  background: var(--panel-2); color: var(--text); font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; text-decoration: none; -webkit-tap-highlight-color: transparent;
  transition: background .15s, border-color .15s, transform .08s;
}
.btn:hover { background: rgba(255,255,255,0.11); border-color: rgba(255,255,255,0.28); }
.btn:active { transform: translateY(1px); }
.btn.gold {
  background: linear-gradient(180deg, var(--gold-hi), var(--gold-dim)); color: #241905;
  border-color: rgba(233,190,110,0.7); font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 6px 18px rgba(0,0,0,0.3);
}
.btn.gold:hover { filter: brightness(1.06); background: linear-gradient(180deg, var(--gold-hi), var(--gold-dim)); }
.btn.sm { padding: 7px 10px; font-size: 12px; }
.btn[disabled] { opacity: .45; cursor: not-allowed; }
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  border: 1px solid var(--line-2); color: var(--text-3);
}
.chip.on { color: var(--gold); border-color: rgba(233,190,110,0.45); background: rgba(233,190,110,0.10); }
.chip.ok { color: var(--ok); border-color: rgba(107,227,164,0.4); background: rgba(107,227,164,0.10); }
.chip.bad { color: var(--bad); border-color: rgba(242,119,122,0.4); background: rgba(242,119,122,0.10); }

.ic { flex: none; vertical-align: -0.15em; }

/* ---------- HUD plate ---------- */
/* Default: sits inside whatever padding the host page already has.
   Only the new layout bleeds it to the page edges, because only there
   do we know what the body padding is. */
.hud {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 16px;
  padding: max(8px, env(safe-area-inset-top)) 16px 8px;
  background: rgba(11,14,26,0.86);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
}
body.icis .hud { margin-left: -18px; margin-right: -18px; padding-left: 18px; padding-right: 18px; }
.hud-orb {
  width: 34px; height: 34px; flex: none; display: grid; place-items: center;
  border-radius: 50%; font-family: var(--mono); font-size: 13px; font-weight: 800; color: #241905;
  background: radial-gradient(circle at 34% 28%, var(--gold-hi), var(--gold-dim) 65%, #6B4A18);
  box-shadow: 0 0 12px rgba(233,190,110,0.30), inset 0 1px 0 rgba(255,255,255,0.5);
  text-decoration: none;
}
.hud-body { flex: 1; min-width: 0; }
.hud-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.hud-name { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.hud-xp { font-family: var(--mono); font-size: 10px; color: var(--text-3); }
.hud-act { display: flex; gap: 6px; flex: none; }
.hud-act a {
  width: 34px; height: 34px; display: grid; place-items: center;
  border-radius: 10px; border: 1px solid var(--line); background: var(--panel);
  color: var(--text-2); text-decoration: none;
}
.hud-act a:hover { color: var(--gold); border-color: rgba(233,190,110,0.4); }

/* ---------- bottom nav ---------- */
.nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 45;
  display: flex; justify-content: space-around;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  background: rgba(10,13,24,0.94); border-top: 1px solid var(--line);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
}
.nav a {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 5px 2px; text-decoration: none; color: var(--text-3);
  font-size: 9.5px; font-weight: 700; letter-spacing: .04em;
  -webkit-tap-highlight-color: transparent;
}
.nav a .lbl-lore { color: inherit; }
.nav a .lbl-sub { font-size: 8px; font-weight: 600; opacity: .62; letter-spacing: .02em; }
.nav a.on { color: var(--gold); }
.nav a:active { transform: scale(.95); }

/* ---------- toast ---------- */
.toasts {
  position: fixed; left: 0; right: 0; top: max(10px, env(safe-area-inset-top));
  z-index: 200; display: flex; flex-direction: column; align-items: center; gap: 8px;
  pointer-events: none; padding: 0 14px;
}
.toast {
  display: flex; align-items: center; gap: 12px; width: 100%; max-width: 420px;
  padding: 12px 15px; border-radius: var(--r);
  border: 1px solid rgba(233,190,110,0.35);
  background: linear-gradient(180deg, rgba(26,22,14,0.97), rgba(14,13,20,0.97));
  box-shadow: 0 16px 44px rgba(0,0,0,0.6);
  animation: tIn .42s cubic-bezier(.22,1,.36,1);
}
.toast.out { animation: tOut .3s ease forwards; }
@keyframes tIn { from { opacity: 0; transform: translateY(-14px) scale(.97); } }
@keyframes tOut { to { opacity: 0; transform: translateY(-10px) scale(.98); } }
.toast-ic { color: var(--gold); }
.toast-k { font-size: 9.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.toast-t { font-size: 14px; font-weight: 700; color: var(--text); margin-top: 1px; }
.toast-s { font-size: 12px; color: var(--text-3); margin-top: 1px; }

/* ---------- level-up overlay (skippable) ---------- */
.lvlup {
  position: fixed; inset: 0; z-index: 300; display: grid; place-items: center;
  background: rgba(6,8,14,0.78); backdrop-filter: blur(6px);
  cursor: pointer; animation: tIn .3s ease;
}
.lvlup-in { text-align: center; padding: 24px; }
.lvlup-k { font-size: 11px; font-weight: 800; letter-spacing: .3em; text-transform: uppercase; color: var(--gold); }
.lvlup-n {
  font-family: var(--mono); font-size: 76px; font-weight: 800; line-height: 1; margin: 8px 0;
  color: var(--gold-hi); text-shadow: 0 0 30px rgba(233,190,110,0.5);
  animation: pop .5s cubic-bezier(.22,1,.36,1);
}
@keyframes pop { from { transform: scale(.7); opacity: 0; } }
.lvlup-s { font-size: 14px; color: var(--text-2); }
.lvlup-hint { margin-top: 18px; font-size: 11px; color: var(--text-3); }

/* ---------- utility ---------- */
.row { display: flex; align-items: center; gap: 10px; }
.row.wrap { flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
.grid { display: grid; gap: 10px; }
.g2 { grid-template-columns: repeat(2, 1fr); }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g4 { grid-template-columns: repeat(4, 1fr); }
.auto { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.trunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { padding: 22px 14px; text-align: center; font-size: 13px; color: var(--text-3); }
input, textarea, select {
  font: inherit; color: var(--text); background: rgba(0,0,0,0.3);
  border: 1px solid var(--line); border-radius: var(--r-sm); padding: 9px 11px; outline: none;
  width: 100%;
}
input:focus, textarea:focus, select:focus { border-color: rgba(233,190,110,0.5); }
label.fl { display: block; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 6px; }

@media (max-width: 720px) { .g4 { grid-template-columns: repeat(2, 1fr); } .g3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 460px) {
  body.icis { padding-left: 13px; padding-right: 13px; }
  body.icis .hud { margin-left: -13px; margin-right: -13px; padding-left: 13px; padding-right: 13px; }
  .g2, .g3, .g4 { grid-template-columns: 1fr; }
  .h1 { font-size: 22px; }
}

/* Respect the OS setting AND the in-app toggle. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
body.no-motion *, body.no-motion *::before, body.no-motion *::after {
  animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important;
}
`;

  // ---------------------------------------------------------------
  // Injection
  // ---------------------------------------------------------------
  function injectCss() {
    if (document.getElementById('icis-ui')) return;
    var st = document.createElement('style');
    st.id = 'icis-ui';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function currentKey() {
    var p = (location.pathname || '').toLowerCase();
    var file = p.split('/').pop() || 'index.html';
    if (!file) file = 'index.html';
    for (var i = 0; i < WORLD.length; i++) {
      if (WORLD[i].href.toLowerCase() === file) return WORLD[i].key;
    }
    if (file === 'health.html') return 'guild';
    return 'hub';
  }

  function injectHud() {
    if (document.getElementById('icisHud')) return;
    if (document.body.hasAttribute('data-no-hud')) return;
    var el = document.createElement('div');
    el.className = 'hud'; el.id = 'icisHud';
    el.innerHTML =
      '<a class="hud-orb" href="character.html" id="hudOrb" aria-label="Hero profile">1</a>' +
      '<div class="hud-body">' +
        '<div class="hud-line">' +
          '<span class="hud-name" id="hudName">Wanderer</span>' +
          '<span class="hud-xp mono" id="hudXp">0 / 100</span>' +
        '</div>' +
        '<div class="track sm"><div class="fill" id="hudFill"></div></div>' +
      '</div>' +
      '<div class="hud-act">' +
        '<a href="nova.html" aria-label="Spirit companion">' + icon('spirit', 18) + '</a>' +
        '<a href="character.html?tab=settings" aria-label="Settings">' + icon('gear', 18) + '</a>' +
      '</div>';
    var first = document.querySelector('body > .wrap') || document.body.firstChild;
    document.body.insertBefore(el, first);
  }

  function injectNav() {
    if (document.getElementById('icisNav')) return;
    if (document.body.hasAttribute('data-no-nav')) return;
    var cur = currentKey();
    var html = NAV.map(function (k) {
      var w = WORLD.filter(function (x) { return x.key === k; })[0];
      return '<a href="' + w.href + '" class="' + (k === cur ? 'on' : '') + '">' +
        icon(w.icon, 21) +
        '<span class="lbl-lore">' + esc(w.lore.split(' ')[0]) + '</span>' +
        '<span class="lbl-sub">' + esc(w.practical) + '</span>' +
      '</a>';
    }).join('');
    var nav = document.createElement('nav');
    nav.className = 'nav'; nav.id = 'icisNav';
    nav.innerHTML = html;
    document.body.appendChild(nav);
    document.body.classList.add('has-nav');
  }

  function renderHud(t) {
    var orb = document.getElementById('hudOrb');
    if (!orb) return;
    orb.textContent = t.level;
    document.getElementById('hudName').textContent = t.name + ' · ' + t.rank.name;
    document.getElementById('hudXp').textContent = t.into + ' / ' + t.need;
    document.getElementById('hudFill').style.width = (t.pct * 100).toFixed(1) + '%';
  }

  // ---------------------------------------------------------------
  // Toasts + level-up
  // ---------------------------------------------------------------
  function toast(ic, kicker, title, sub) {
    injectCss();
    var wrap = document.getElementById('icisToasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'icisToasts'; wrap.className = 'toasts';
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="toast-ic">' + icon(ic, 24) + '</span><div class="grow">' +
      '<div class="toast-k">' + esc(kicker) + '</div>' +
      '<div class="toast-t">' + esc(title) + '</div>' +
      (sub ? '<div class="toast-s">' + esc(sub) + '</div>' : '') + '</div>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 320);
    }, 4200);
  }

  // Tap anywhere to skip.
  function levelUp(level, rankName, sub) {
    injectCss();
    // Never stack overlays — one at a time, whatever calls in.
    if (document.querySelector('.lvlup')) return;
    var el = document.createElement('div');
    el.className = 'lvlup';
    el.innerHTML = '<div class="lvlup-in">' +
      '<div class="lvlup-k">Level Up</div>' +
      '<div class="lvlup-n mono">' + level + '</div>' +
      '<div class="lvlup-s">' + esc(rankName) + (sub ? ' · ' + esc(sub) : '') + '</div>' +
      '<div class="lvlup-hint">tap to continue</div></div>';
    function close() { el.remove(); }
    el.addEventListener('click', close);
    document.body.appendChild(el);
    setTimeout(close, 4000);
  }

  // ---------------------------------------------------------------
  // Milestone watcher — fires toasts only for genuinely new progress.
  // ---------------------------------------------------------------
  // "Have I already shown this notification HERE?" is per-device state, so
  // it lives in its own localStorage key and is deliberately NOT part of
  // the synced blob. When it was inside the synced state, cloud sync kept
  // restoring another device's older copy and every page load re-announced
  // the same level-up.
  var SEEN_KEY = 'icis:seen';

  function loadSeen() {
    var seen = GS.readJSON(SEEN_KEY, null);
    if (seen && typeof seen.level === 'number') return seen;
    // One-time migration out of the synced state.
    var legacy = GS.get().lastSeen;
    if (legacy && typeof legacy.level === 'number' && legacy.level > 0) {
      GS.writeJSON(SEEN_KEY, legacy);
      return legacy;
    }
    return null;
  }

  function checkMilestones(t) {
    var seen = loadSeen();
    var next = { level: t.level, disciplines: {}, achievements: (seen && seen.achievements) || [] };
    t.disciplines.forEach(function (d) { next.disciplines[d.id] = d.level; });

    // No record on this device yet: bank the baseline silently rather than
    // announcing progress the user already made.
    if (!seen) { GS.writeJSON(SEEN_KEY, next); return; }

    if (t.level > seen.level) {
      levelUp(t.level, t.rank.name, t.nextRank ? 'Next: ' + t.nextRank.name + ' at ' + t.nextRank.at : '');
    }
    t.disciplines.forEach(function (d) {
      var before = (seen.disciplines && seen.disciplines[d.id]) || 1;
      if (d.level > before) toast('star', d.lore, d.name + ' reached level ' + d.level, d.practical);
    });

    // Store a high-water mark, never a lower one. If sync momentarily
    // restores an older snapshot the level can dip; without this, climbing
    // back to a level already announced would announce it a second time.
    next.level = Math.max(next.level, seen.level);
    t.disciplines.forEach(function (d) {
      var before = (seen.disciplines && seen.disciplines[d.id]) || 1;
      next.disciplines[d.id] = Math.max(next.disciplines[d.id], before);
    });
    if (JSON.stringify(seen) !== JSON.stringify(next)) GS.writeJSON(SEEN_KEY, next);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function applyMotionPref() {
    var s = GS.get();
    document.body.classList.toggle('no-motion', !!(s.settings && s.settings.reducedMotion));
  }

  function refresh() {
    var t = GS.totals();
    renderHud(t);
    try { checkMilestones(t); } catch (e) {}
    return t;
  }

  function boot() {
    injectCss();
    // Opt-in layout: new pages carry data-icis, legacy trackers keep theirs.
    if (document.body.hasAttribute('data-icis')) document.body.classList.add('icis');
    applyMotionPref();
    injectHud();
    injectNav();
    refresh();
    GS.subscribe(function (t) { renderHud(t); });
  }

  window.UI = {
    ICONS: ICONS, WORLD: WORLD, NAV: NAV,
    icon: icon, esc: esc, toast: toast, levelUp: levelUp,
    refresh: refresh, currentKey: currentKey, applyMotionPref: applyMotionPref,
    world: function (key) { return WORLD.filter(function (x) { return x.key === key; })[0]; },
    // Small render helpers reused across pages.
    bar: function (pct, color) {
      return '<div class="track sm"><div class="fill' + (color ? ' plain' : '') + '" style="width:' +
        (Math.max(0, Math.min(1, pct)) * 100).toFixed(1) + '%' + (color ? ';color:' + color : '') + '"></div></div>';
    },
    rankBadge: function (rank) {
      return '<span class="rank r-' + esc(rank.sigil) + '">' + esc(rank.sigil) + '</span>';
    },
    fmt: function (n) { return Math.round(Number(n) || 0).toLocaleString(); },
    ago: function (ts) {
      var s = Math.max(0, (Date.now() - ts) / 1000);
      if (s < 60) return 'now';
      if (s < 3600) return Math.floor(s / 60) + 'm';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      var d = Math.floor(s / 86400);
      if (d < 7) return d + 'd';
      if (d < 365) return Math.floor(d / 7) + 'w';
      return Math.floor(d / 365) + 'y';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else { boot(); }
})();
