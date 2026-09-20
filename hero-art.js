// =============================================================
// ICIS — hero portrait. Original anime-inspired SVG, drawn from
// primitives so there is no image asset and no generative service.
//
// Four palettes ("portraits") and five frame borders make it
// customisable without needing artwork per combination.
// =============================================================
(function () {
  'use strict';

  var PALETTES = {
    aurora:  { hair1:'#CFE4FF', hair2:'#6E9BE0', hair3:'#38548F', cloak1:'#1E2A4A', cloak2:'#141C33', trim:'#E9BE6E' },
    ember:   { hair1:'#FFD9BC', hair2:'#E28457', hair3:'#8E4324', cloak1:'#3A2018', cloak2:'#221310', trim:'#F0A868' },
    verdant: { hair1:'#D6F2D8', hair2:'#69B583', hair3:'#2F6B4A', cloak1:'#16301F', cloak2:'#0E2016', trim:'#6BE3A4' },
    dusk:    { hair1:'#E4D4FF', hair2:'#9B7DE0', hair3:'#523A8E', cloak1:'#271E44', cloak2:'#17112B', trim:'#A78BFA' }
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

  // The portrait is deliberately calm: a three-quarter bust, no
  // expression changes (that is Nova's job), readable at 44px.
  function portrait(opts) {
    opts = opts || {};
    var p = PALETTES[opts.portrait] || PALETTES.aurora;
    var bg = BACKGROUNDS[opts.background] || BACKGROUNDS.deepnight;
    var size = opts.size || 120;
    var uid = 'h' + Math.random().toString(36).slice(2, 8);

    return '' +
'<svg viewBox="0 0 200 200" width="' + size + '" height="' + size + '" role="img" aria-label="Your hero portrait">' +
  '<defs>' +
    '<linearGradient id="bg' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + bg.a + '"/><stop offset="100%" stop-color="' + bg.b + '"/></linearGradient>' +
    '<linearGradient id="hr' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + p.hair1 + '"/><stop offset="55%" stop-color="' + p.hair2 + '"/>' +
      '<stop offset="100%" stop-color="' + p.hair3 + '"/></linearGradient>' +
    '<linearGradient id="sk' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#FFE7D6"/><stop offset="100%" stop-color="#EFC4A6"/></linearGradient>' +
    '<linearGradient id="cl' + uid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + p.cloak1 + '"/><stop offset="100%" stop-color="' + p.cloak2 + '"/></linearGradient>' +
    '<clipPath id="cp' + uid + '"><circle cx="100" cy="100" r="96"/></clipPath>' +
  '</defs>' +
  '<g clip-path="url(#cp' + uid + ')">' +
    '<rect width="200" height="200" fill="url(#bg' + uid + ')"/>' +
    // faint heraldic rays
    '<g opacity=".16" stroke="' + p.trim + '" stroke-width="1.4">' +
      '<path d="M100 200V96M100 96l72 46M100 96L28 142M100 96l54-52M100 96L46 44"/></g>' +
    // shoulders
    '<path d="M36 200c0-32 28-50 64-50s64 18 64 50z" fill="url(#cl' + uid + ')"/>' +
    '<path d="M64 200c4-20 16-32 36-32s32 12 36 32z" fill="' + p.trim + '" opacity=".16"/>' +
    // collar gem
    '<path d="M100 156l-11 15 11 11 11-11z" fill="' + p.trim + '"/>' +
    // hair (back)
    '<path d="M100 26c-33 0-51 23-51 53 0 22 5 33 3 47l-11 18c20-6 28-14 28-14s-6-30-6-47c0-21 14-33 37-33s37 12 37 33c0 17-6 47-6 47s8 8 28 14l-11-18c-2-14 3-25 3-47 0-30-18-53-51-53z" fill="url(#hr' + uid + ')"/>' +
    // face
    '<ellipse cx="100" cy="96" rx="34" ry="38" fill="url(#sk' + uid + ')"/>' +
    // fringe
    '<path d="M66 90c0-25 15-38 34-38s34 13 34 38c-6-13-15-21-21-17-8 5-13 3-19-2-8-6-21 4-28 19z" fill="url(#hr' + uid + ')"/>' +
    // eyes + brows, fixed calm expression
    '<g fill="#2A2440">' +
      '<ellipse cx="88" cy="97" rx="5.4" ry="6.6"/><ellipse cx="112" cy="97" rx="5.4" ry="6.6"/></g>' +
    '<circle cx="86.2" cy="94.6" r="1.8" fill="#fff" opacity=".9"/>' +
    '<circle cx="110.2" cy="94.6" r="1.8" fill="#fff" opacity=".9"/>' +
    '<g fill="none" stroke="#2A2440" stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M81 86h13M106 86h13"/><path d="M96 113q4 3 8 0"/></g>' +
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
