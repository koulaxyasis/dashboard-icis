// =============================================================
// ICIS — hero portrait: an armoured knight, drawn as original SVG
// from primitives so there is no image asset and no generative
// service. Matches the app icon's helm.
//
// Four palettes and seven frame borders make it customisable without
// needing artwork per combination. The palette KEYS are unchanged
// (aurora / ember / verdant / dusk), so an existing saved choice
// still resolves — only what they render changed.
//
// Nova keeps her own separate look on purpose: you are the knight,
// she is the spirit, and they should not read as the same character.
// =============================================================
(function () {
  'use strict';

  // metal1/2/3 = highlight, midtone, shadow. `glow` lights the visor,
  // which is what stops an empty helm looking lifeless.
  var PALETTES = {
    aurora:  { metal1:'#EDF3FF', metal2:'#9FB2D0', metal3:'#46587C',
               cloak1:'#1E2A4A', cloak2:'#131B31', trim:'#E9BE6E', glow:'#A8D4FF' },
    ember:   { metal1:'#FFE7CF', metal2:'#D89A66', metal3:'#7A4520',
               cloak1:'#3A2018', cloak2:'#20120E', trim:'#F0A868', glow:'#FFB673' },
    verdant: { metal1:'#E4F6E9', metal2:'#8FC3A2', metal3:'#37684E',
               cloak1:'#16301F', cloak2:'#0D1E14', trim:'#6BE3A4', glow:'#93FFC4' },
    dusk:    { metal1:'#F0E6FF', metal2:'#B39CE0', metal3:'#584490',
               cloak1:'#271E44', cloak2:'#161028', trim:'#A78BFA', glow:'#CBB5FF' }
  };

  var BORDERS = {
    plain:          { ring:'rgba(255,255,255,0.14)', glow:'none',                         label:'Plain' },
    border_azure:   { ring:'#60A5FA',                glow:'0 0 18px rgba(96,165,250,.45)', label:'Azure' },
    border_verdant: { ring:'#34D399',                glow:'0 0 18px rgba(52,211,153,.45)', label:'Verdant' },
    border_gilded:  { ring:'#E9BE6E',                glow:'0 0 20px rgba(233,190,110,.5)', label:'Gilded' },
    border_emberwrought:{ ring:'#F0A868',            glow:'0 0 20px rgba(240,168,104,.5)', label:'Emberwrought' },
    border_radiant: { ring:'#F8E3B4',                glow:'0 0 26px rgba(248,227,180,.6)', label:'Radiant' },
    border_sovereign:{ ring:'#C79BFF',               glow:'0 0 28px rgba(199,155,255,.6)', label:'Sovereign' }
  };

  var BACKGROUNDS = {
    deepnight: { a:'#131A33', b:'#0A0E1C', label:'Deep Night' },
    archive:   { a:'#2A2418', b:'#14110A', label:'The Archive' },
    bourse:    { a:'#132A24', b:'#0A1713', label:'The Bourse' },
    lumen:     { a:'#22203C', b:'#100F1E', label:'Lumen Hall' },
    circuit:   { a:'#10242C', b:'#081418', label:'Circuit Vault' }
  };

  // Career-tool cosmetic. Drawn as a small emblem shown beside the
  // portrait. `req` is the cosmetic id that must be unlocked, or null for
  // always-available. Nothing here is read by the progression code.
  var TOOLS = {
    none:       { label: 'None',            req: null,                 art: '' },
    abacus:     { label: 'Counting Frame',  req: null,
      art: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M4 14.5h16"/>' +
           '<circle cx="9" cy="7.5" r="1.3"/><circle cx="14" cy="12.2" r="1.3"/><circle cx="11" cy="16.8" r="1.3"/>' },
    quill:      { label: 'Ledger Quill',    req: 'border_gilded',
      art: '<path d="M4 20c6-1 9-4 12-9s3-7 3-7-4 0-8 3-6 7-7 13z"/><path d="M4 20l5-5"/>' },
    modelblade: { label: 'Model Blade',     req: 'border_emberwrought',
      art: '<path d="M14.5 3.5L20 9l-9.5 9.5-2-2L4 21l-1-1 4.5-4.5-2-2z"/><path d="M12 9l3 3"/>' },
    terminal:   { label: 'Query Terminal',  req: 'border_verdant',
      art: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M7 9l3 2.5L7 14M12.5 14.5H17"/>' },
    scope:      { label: "Analyst's Lens",  req: 'bg_bourse',
      art: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 11l2 2 3.5-4"/>' },
    crown:      { label: 'Sovereign Seal',  req: 'border_sovereign',
      art: '<path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/><path d="M4 20h16"/>' }
  };

  // Companion cosmetic — a small familiar shown at the portrait's corner.
  var COMPANIONS = {
    none:   { label: 'None',        req: null, art: '' },
    wisp:   { label: 'Pale Wisp',   req: null,
      art: '<circle cx="12" cy="11" r="4.5"/><path d="M12 15.5c-1.5 2-3 3-3 4.5M12 15.5c1.5 2 3 3 3 4.5"/>' },
    fox:    { label: 'Ember Fox',   req: 'border_emberwrought',
      art: '<path d="M5 8l2-4 3 3h4l3-3 2 4v6a7 7 0 0 1-14 0z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/>' },
    owl:    { label: 'Archive Owl', req: 'bg_archive',
      art: '<ellipse cx="12" cy="13" rx="6.5" ry="7"/><circle cx="9.5" cy="11" r="2"/><circle cx="14.5" cy="11" r="2"/><path d="M7 6l2 2M17 6l-2 2"/>' },
    drake:  { label: 'Lumen Drake', req: 'bg_lumen',
      art: '<path d="M4 14c3-5 8-7 13-6-2 1-3 3-3 3s4 0 6 3c-4 1-6 4-8 4s-5-2-8-4z"/><circle cx="16" cy="9.5" r="0.9"/>' },
    sprite: { label: 'Radiant Sprite', req: 'border_radiant',
      art: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>' }
  };

  function emblem(set, id, size, color) {
    var item = set[id];
    if (!item || !item.art) return '';
    return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" fill="none" ' +
      'stroke="' + (color || '#E9BE6E') + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + item.art + '</svg>';
  }

  function unlocked(state, req) {
    if (!req) return true;
    var owned = (state.player && state.player.unlockedCosmetics) || [];
    return owned.indexOf(req) !== -1;
  }

  // Deliberately still: a helmed bust with no expression changes (that
  // is Nova's job), and heavy enough shapes to stay readable at 44px.
  function portrait(opts) {
    opts = opts || {};
    var p = PALETTES[opts.portrait] || PALETTES.aurora;
    var bg = BACKGROUNDS[opts.background] || BACKGROUNDS.deepnight;
    var size = opts.size || 120;
    var uid = 'h' + Math.random().toString(36).slice(2, 8);

    return '' +
'<svg viewBox="0 0 200 200" width="' + size + '" height="' + size + '" role="img" aria-label="Your knight">' +
  '<defs>' +
    '<linearGradient id="bg' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + bg.a + '"/><stop offset="100%" stop-color="' + bg.b + '"/></linearGradient>' +
    // plate: lit from the upper left, shadowed lower right
    '<linearGradient id="mt' + uid + '" x1="0.15" y1="0" x2="0.8" y2="1">' +
      '<stop offset="0%" stop-color="' + p.metal1 + '"/>' +
      '<stop offset="42%" stop-color="' + p.metal2 + '"/>' +
      '<stop offset="100%" stop-color="' + p.metal3 + '"/></linearGradient>' +
    '<linearGradient id="mt2' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + p.metal2 + '"/>' +
      '<stop offset="100%" stop-color="' + p.metal3 + '"/></linearGradient>' +
    '<linearGradient id="cl' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + p.cloak1 + '"/>' +
      '<stop offset="100%" stop-color="' + p.cloak2 + '"/></linearGradient>' +
    '<radialGradient id="gl' + uid + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + p.glow + '" stop-opacity=".95"/>' +
      '<stop offset="100%" stop-color="' + p.glow + '" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="cp' + uid + '"><circle cx="100" cy="100" r="96"/></clipPath>' +
  '</defs>' +
  '<g clip-path="url(#cp' + uid + ')">' +
    '<rect width="200" height="200" fill="url(#bg' + uid + ')"/>' +
    // faint heraldic rays
    '<g opacity=".14" stroke="' + p.trim + '" stroke-width="1.6">' +
      '<path d="M100 200V104M100 104l70 44M100 104L30 148M100 104l54-52M100 104L46 52"/></g>' +

    // ---- cloak behind the shoulders ----
    '<path d="M24 200c0-34 22-56 50-64l26 12 26-12c28 8 50 30 50 64z" fill="url(#cl' + uid + ')"/>' +

    // ---- pauldrons ----
    '<path d="M22 200c0-26 12-44 32-52 10 12 14 32 13 52z" fill="url(#mt2' + uid + ')" ' +
      'stroke="' + p.metal1 + '" stroke-opacity=".35" stroke-width="1.6"/>' +
    '<path d="M178 200c0-26-12-44-32-52-10 12-14 32-13 52z" fill="url(#mt2' + uid + ')" ' +
      'stroke="' + p.metal1 + '" stroke-opacity=".35" stroke-width="1.6"/>' +
    // pauldron lames
    '<g fill="none" stroke="' + p.metal3 + '" stroke-opacity=".55" stroke-width="1.6">' +
      '<path d="M30 176c10-3 21-3 32-1M34 162c8-3 17-3 26-2M170 176c-10-3-21-3-32-1M166 162c-8-3-17-3-26-2"/></g>' +

    // ---- breastplate + gorget ----
    '<path d="M72 152h56l6 48H66z" fill="url(#mt' + uid + ')"/>' +
    '<path d="M100 163l11 4v10c0 8-5 14-11 17-6-3-11-9-11-17v-10z" ' +
      'fill="' + p.trim + '" opacity=".9"/>' +
    '<path d="M100 170v14" stroke="' + p.cloak2 + '" stroke-opacity=".5" stroke-width="2"/>' +
    '<path d="M74 150c8 7 16 10 26 10s18-3 26-10l3 10c-9 8-18 12-29 12s-20-4-29-12z" ' +
      'fill="url(#mt2' + uid + ')" stroke="' + p.metal1 + '" stroke-opacity=".3" stroke-width="1.4"/>' +

    // ---- helm ----
    '<path d="M67 78a33 33 0 0 1 66 0v26c0 16-8 28-20 34l-13 7-13-7c-12-6-20-18-20-34z" ' +
      'fill="url(#mt' + uid + ')" stroke="' + p.metal1 + '" stroke-opacity=".45" stroke-width="1.8" ' +
      'stroke-linejoin="round"/>' +
    // centre ridge
    '<path d="M100 45c-6 0-11 1-16 3v90l16 8 16-8V48c-5-2-10-3-16-3z" fill="' + p.metal1 + '" opacity=".14"/>' +
    // brow bevel
    '<path d="M70 76c9-6 19-9 30-9s21 3 30 9" fill="none" stroke="' + p.metal3 + '" ' +
      'stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>' +
    // visor slit, with the glow that gives it life
    '<ellipse cx="100" cy="90" rx="30" ry="11" fill="url(#gl' + uid + ')" opacity=".55"/>' +
    '<rect x="76" y="85" width="48" height="10" rx="5" fill="#070A12" fill-opacity=".92"/>' +
    '<rect x="82" y="88" width="14" height="4" rx="2" fill="' + p.glow + '" opacity=".9"/>' +
    '<rect x="104" y="88" width="14" height="4" rx="2" fill="' + p.glow + '" opacity=".9"/>' +
    // breaths
    '<g fill="#070A12" fill-opacity=".8">' +
      '<rect x="88" y="106" width="6" height="18" rx="3"/>' +
      '<rect x="97" y="107" width="6" height="19" rx="3"/>' +
      '<rect x="106" y="106" width="6" height="18" rx="3"/></g>' +
  '</g>' +
'</svg>';
  }

  // Wraps the portrait in its frame, with the tool and companion emblems
  // pinned to the corners. Returns HTML.
  function framed(opts) {
    opts = opts || {};
    var b = BORDERS[opts.border] || BORDERS.plain;
    var size = opts.size || 120;
    var badge = Math.max(20, Math.round(size * 0.28));
    var tool = opts.tool && opts.tool !== 'none' ? TOOLS[opts.tool] : null;
    var comp = opts.companion && opts.companion !== 'none' ? COMPANIONS[opts.companion] : null;

    return '<span class="hero-slot" style="width:' + size + 'px;height:' + size + 'px">' +
      '<span class="hero-frame" style="width:' + size + 'px;height:' + size + 'px;' +
        'border-color:' + b.ring + ';box-shadow:' + b.glow + '">' + portrait(opts) + '</span>' +
      (tool ? '<span class="hero-badge hero-badge-tool" title="' + tool.label + '" ' +
        'style="width:' + badge + 'px;height:' + badge + 'px">' +
        emblem(TOOLS, opts.tool, Math.round(badge * 0.62)) + '</span>' : '') +
      (comp ? '<span class="hero-badge hero-badge-comp" title="' + comp.label + '" ' +
        'style="width:' + badge + 'px;height:' + badge + 'px">' +
        emblem(COMPANIONS, opts.companion, Math.round(badge * 0.62), '#A78BFA') + '</span>' : '') +
    '</span>';
  }

  // Reads the six equipment slots off the shared state.
  function fromState(state, size) {
    var eq = (state && state.player && state.player.equipment) || {};
    return framed({
      portrait: eq.portrait, border: eq.border, background: eq.background,
      tool: eq.tool, companion: eq.companion, size: size
    });
  }

  var CSS = `
.hero-slot { position:relative; display:inline-block; flex:none; }
.hero-frame {
  display:inline-grid; place-items:center; flex:none;
  border-radius:50%; border:2px solid rgba(255,255,255,.14); overflow:hidden;
  background:#0A0E1C;
}
.hero-frame svg { display:block; }
.hero-badge {
  position:absolute; display:grid; place-items:center; border-radius:50%;
  background:#0B0E1A; border:1.5px solid rgba(233,190,110,.55);
  box-shadow:0 2px 8px rgba(0,0,0,.5);
}
.hero-badge-tool { right:-2px; bottom:-2px; }
.hero-badge-comp { left:-2px; bottom:-2px; border-color:rgba(167,139,250,.6); }
`;

  // One declarative description of the six slots, so the settings UI and
  // the tests iterate the same list.
  var SLOTS = [
    { id: 'portrait',   label: 'Portrait',   set: PALETTES,    kind: 'palette' },
    { id: 'border',     label: 'Border',     set: BORDERS,     kind: 'border' },
    { id: 'background', label: 'Background', set: BACKGROUNDS, kind: 'background' },
    { id: 'title',      label: 'Title',      set: null,        kind: 'title' },
    { id: 'tool',       label: 'Career Tool', set: TOOLS,      kind: 'emblem' },
    { id: 'companion',  label: 'Companion',  set: COMPANIONS,  kind: 'emblem' }
  ];

  window.HeroArt = {
    PALETTES: PALETTES, BORDERS: BORDERS, BACKGROUNDS: BACKGROUNDS,
    TOOLS: TOOLS, COMPANIONS: COMPANIONS, SLOTS: SLOTS,
    portrait: portrait, framed: framed, fromState: fromState,
    emblem: emblem, unlocked: unlocked, CSS: CSS,

    // One rule for "can this option be equipped yet", used by both the
    // settings UI and the tests. Palettes are always free; borders and
    // backgrounds unlock by their own cosmetic id; tools and companions
    // declare a `req`.
    optionUnlocked: function (state, slotId, optionId) {
      var owned = (state.player && state.player.unlockedCosmetics) || [];
      switch (slotId) {
        case 'portrait':   return true;
        case 'border':     return optionId === 'plain' || owned.indexOf(optionId) !== -1;
        case 'background': return optionId === 'deepnight' ||
                                  owned.indexOf('bg_' + optionId) !== -1 || owned.indexOf(optionId) !== -1;
        case 'title':      return optionId === '' || ((state.player.unlockedTitles || []).indexOf(optionId) !== -1);
        case 'tool':       return unlocked(state, (TOOLS[optionId] || {}).req);
        case 'companion':  return unlocked(state, (COMPANIONS[optionId] || {}).req);
        default:           return true;
      }
    },
    requirementLabel: function (slotId, optionId) {
      var req = slotId === 'tool' ? (TOOLS[optionId] || {}).req
              : slotId === 'companion' ? (COMPANIONS[optionId] || {}).req
              : slotId === 'border' ? optionId
              : slotId === 'background' ? 'bg_' + optionId : null;
      if (!req) return '';
      return 'Unlocks with the ' + String(req).replace(/^(border_|bg_)/, '').replace(/_/g, ' ') + ' reward';
    },
    // Cosmetics the user has actually unlocked, plus the always-available ones.
    availableBorders: function (state) {
      var owned = (state.player && state.player.unlockedCosmetics) || [];
      return Object.keys(BORDERS).filter(function (k) {
        return k === 'plain' || owned.indexOf(k) !== -1;
      });
    },
    availableBackgrounds: function (state) {
      var owned = (state.player && state.player.unlockedCosmetics) || [];
      return Object.keys(BACKGROUNDS).filter(function (k) {
        return k === 'deepnight' || owned.indexOf('bg_' + k) !== -1 || owned.indexOf(k) !== -1;
      });
    }
  };
})();
