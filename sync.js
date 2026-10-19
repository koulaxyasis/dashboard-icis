// =============================================================
// Shared cloud-sync helper for the dashboard.
// Each page calls initCloudSync({...}) once with its config:
//   appKey         — string row key in the public.app_state table
//   syncedKeys     — exact localStorage keys to mirror
//   syncedPrefixes — localStorage key prefixes to mirror (e.g. 'goals:')
//   onApplied      — optional callback after remote state has been applied
//   legacyAppKey   — optional row this page used to sync under. Read once,
//                    only while the page's own row is still empty, to
//                    fill in keys this device is missing. Never written,
//                    and never used to delete anything.
//
// Every page that shares an appKey MUST sync the same keys. A push writes
// the whole row with only this page's keys, and an apply deletes local
// matching keys that are missing from the row — so two pages sharing a
// row with different keys delete each other's data.
//
// Requires:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="sync.js" defer></script>
// =============================================================
(function () {
  'use strict';

  // Prefer Vercel env vars (served via /api/config → window.DASH_*),
  // otherwise fall back to these defaults.
  const SUPABASE_URL = (typeof window !== 'undefined' && window.DASH_SUPABASE_URL) || 'https://srajryooffirbroltjmg.supabase.co';
  const SUPABASE_KEY = (typeof window !== 'undefined' && window.DASH_SUPABASE_KEY) || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';

  // Postgres stores the row as jsonb, which reorders object keys. Every
  // comparison goes through this key-sorted form, or the echo of our own
  // push looks like another device's change and gets applied over edits
  // made since.
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') {
      return '{' + Object.keys(v).sort().map(function (k) {
        return JSON.stringify(k) + ':' + canon(v[k]);
      }).join(',') + '}';
    }
    return JSON.stringify(v);
  }

  window.initCloudSync = function (config) {
    const appKey = config && config.appKey;
    const syncedKeys = (config && config.syncedKeys) || [];
    const syncedPrefixes = (config && config.syncedPrefixes) || [];
    const onApplied = config && config.onApplied;
    const legacyAppKey = config && config.legacyAppKey;
    if (!appKey) return;
    if (!window.supabase) return;
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    if (SUPABASE_URL.indexOf('PASTE-') === 0 || SUPABASE_KEY.indexOf('PASTE-') === 0) return;

    let supa = null;
    let pushTimer = null;
    let suppressSync = false;
    let lastSyncedJson = null;   // canon() of the row as last pushed or applied
    // True from a local edit until a push of it succeeds. While set, the
    // cloud copy is older than this device, so it is never applied here.
    let dirty = false;
    let lastFlushJson = null;

    function matches(k) {
      if (!k) return false;
      if (syncedKeys.indexOf(k) !== -1) return true;
      for (let i = 0; i < syncedPrefixes.length; i++) {
        if (k.indexOf(syncedPrefixes[i]) === 0) return true;
      }
      return false;
    }
    function listAllKeys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (matches(k)) out.push(k);
      }
      return out;
    }
    function parse(v) {
      try { return JSON.parse(v); } catch (e) { return v; }
    }
    function collect() {
      const out = {};
      for (const k of listAllKeys()) {
        const v = localStorage.getItem(k);
        if (v == null) continue;
        out[k] = parse(v);
      }
      return out;
    }
    function localEdit() {
      dirty = true;
      schedulePush();
    }

    const origSet = localStorage.setItem.bind(localStorage);
    const origRemove = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      try { if (!suppressSync && matches(k)) localEdit(); } catch (e) {}
    };
    localStorage.removeItem = function (k) {
      origRemove(k);
      try { if (!suppressSync && matches(k)) localEdit(); } catch (e) {}
    };

    function applyRemote(remote) {
      if (!remote || typeof remote !== 'object') return false;
      suppressSync = true;
      let changed = false;
      try {
        for (const k of Object.keys(remote)) {
          if (!matches(k)) continue;
          const local = localStorage.getItem(k);
          if (local == null || canon(parse(local)) !== canon(remote[k])) {
            try { origSet(k, JSON.stringify(remote[k])); changed = true; } catch (e) {}
          }
        }
        for (const k of listAllKeys()) {
          if (!(k in remote)) {
            try { origRemove(k); changed = true; } catch (e) {}
          }
        }
      } finally { suppressSync = false; }
      if (changed && typeof onApplied === 'function') {
        try { onApplied(); } catch (e) {}
      }
      return changed;
    }

    async function pushNow() {
      if (!supa) return;
      const state = collect();
      const json = canon(state);
      if (json === lastSyncedJson) { dirty = false; return; }
      try {
        const { error } = await supa.from('app_state').upsert(
          { key: appKey, data: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
        if (!error) {
          lastSyncedJson = json;
          // An edit made while the push was in flight still needs its own.
          if (canon(collect()) === json) dirty = false;
          else schedulePush();
        }
      } catch (e) {}
    }
    function schedulePush() {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(pushNow, 250);
    }
    // Last-chance push when the page goes away or into the background.
    // It cannot report back, so `dirty` stays set and the next resume
    // pushes again.
    function flushOnUnload() {
      if (!dirty) return;
      const state = collect();
      const json = canon(state);
      if (json === lastSyncedJson || json === lastFlushJson) return;
      try {
        fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ key: appKey, data: state, updated_at: new Date().toISOString() }),
          keepalive: true,
        }).catch(() => {});
        lastFlushJson = json;
      } catch (e) {}
    }

    // One-time migration off a shared row. Fills in only the keys this
    // page owns that are missing locally; whatever this device already
    // has wins, and nothing is removed. The legacy row is left untouched,
    // so it stays available as a fallback copy.
    async function adoptLegacy() {
      try {
        const { data, error } = await supa
          .from('app_state').select('data').eq('key', legacyAppKey).maybeSingle();
        if (error || !data || !data.data || typeof data.data !== 'object') return;
        let changed = false;
        suppressSync = true;
        try {
          for (const k of Object.keys(data.data)) {
            if (!matches(k) || localStorage.getItem(k) != null) continue;
            try { origSet(k, JSON.stringify(data.data[k])); changed = true; } catch (e) {}
          }
        } finally { suppressSync = false; }
        if (changed && typeof onApplied === 'function') {
          try { onApplied(); } catch (e) {}
        }
      } catch (e) {}
    }

    // Take a cloud copy that differs from what this device last saw —
    // unless this device has edits the cloud has not got yet.
    function takeRemote(remote) {
      if (!remote || typeof remote !== 'object' || !Object.keys(remote).length) return;
      const incoming = canon(remote);
      if (incoming === lastSyncedJson || dirty) return;
      lastSyncedJson = incoming;
      applyRemote(remote);
    }

    // A phone PWA is resumed far more often than it is reloaded, and the
    // realtime socket drops while it sits in the background, so changes
    // made on another device meanwhile never arrive. Re-read the row each
    // time the page comes back; push first if this device has edits.
    let refreshing = false;
    let lastRefresh = 0;
    async function refresh() {
      if (!supa || refreshing || document.hidden) return;
      if (Date.now() - lastRefresh < 1500) return;
      lastRefresh = Date.now();
      refreshing = true;
      try {
        if (dirty) { await pushNow(); return; }
        const { data, error } = await supa
          .from('app_state').select('data').eq('key', appKey).maybeSingle();
        if (!error && data) takeRemote(data.data);
      } catch (e) {} finally { refreshing = false; }
    }

    (async function init() {
      supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      // Snapshot local state before the network round-trip. If the user
      // edits something (e.g. adds a project) while this fetch is in
      // flight, applying the fetched snapshot below would silently wipe
      // out that edit — it reflects the world from before the edit
      // happened. Detect that by re-checking local state once the fetch
      // resolves: if it moved, local wins and gets pushed up instead.
      const beforeFetchJson = canon(collect());
      try {
        const { data, error } = await supa
          .from('app_state').select('data').eq('key', appKey).maybeSingle();
        if (canon(collect()) !== beforeFetchJson) {
          dirty = true;
          schedulePush();
        } else if (!error && data && data.data && Object.keys(data.data).length > 0) {
          lastSyncedJson = canon(data.data);
          applyRemote(data.data);
        } else {
          // Our own row is empty. Only treat it as empty when the read
          // actually succeeded — a failed read must not seed anything.
          if (!error && legacyAppKey) await adoptLegacy();
          if (!error && Object.keys(collect()).length > 0) { dirty = true; schedulePush(); }
        }
      } catch (e) {}
      supa.channel('app_state_' + appKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: 'key=eq.' + appKey,
        }, (payload) => {
          if (payload.new && payload.new.data) takeRemote(payload.new.data);
        })
        .subscribe();
    })();

    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flushOnUnload(); else refresh();
    });
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
    window.addEventListener('storage', (e) => {
      if (e.key && matches(e.key)) localEdit();
    });
  };
})();
