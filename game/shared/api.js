// Player + leaderboard client, shared by the hub and every game.
// Load it with the game's id:  <script src="../shared/api.js" data-game="safari"></script>
// Players sign in once on the hub with a nickname and a 4-digit PIN. The server hands back a secret
// token that we keep in localStorage, so every game on this site knows who is playing.
// The PIN lets a player get their name back on a new phone.
// If the network is down, scores are queued and sent the next time a page loads.
const API = (() => {
  const base = (window.HZE_API || '') + '/api';
  const GAME = document.currentScript?.dataset.game || '';
  const ls = { get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };
  const getJ = (k, d) => { try { return JSON.parse(ls.get(k)) ?? d; } catch (e) { return d; } };
  const NAME_RE = /^[A-Za-z0-9_]{3,16}$/, PIN_RE = /^\d{4}$/;
  // which café / table the QR code came from (?loc=victoria); remembered for later visits
  const qloc = new URLSearchParams(location.search).get('loc'); if (qloc && /^[a-z0-9_-]{1,24}$/i.test(qloc)) ls.set('hze_loc', qloc.toLowerCase());

  async function req(path, opts = {}) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(base + path, { headers: { 'content-type': 'application/json' }, signal: ctl.signal, ...opts });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status, body: j });
      return j;
    } finally { clearTimeout(to); }
  }
  const post = (path, b) => req(path, { method: 'POST', body: JSON.stringify(b) });
  const tokens = () => getJ('hze_tokens', {});
  const saveToken = (name, tk) => { const t = tokens(); t[name.toLowerCase()] = tk; ls.set('hze_tokens', JSON.stringify(t)); };
  const myToken = () => tokens()[(ls.get('hze_name', '')).toLowerCase()];

  return {
    NAME_RE, PIN_RE, GAME,
    get name() { return ls.get('hze_name', ''); },
    get token() { return myToken(); },
    // signed in on this phone (has a token from the server)
    get signedIn() { return !!this.name && !!myToken(); },
    get char() { return ls.get('hze_char', 'enzi'); },
    set char(c) { ls.set('hze_char', c); },
    get loc() { return ls.get('hze_loc', ''); },

    // Sign up or sign back in. Returns one of:
    //   { ok, created? } · { taken, hasPin } · { wrongPin, triesLeft } · { locked, retryIn } · { bad } · { ok, offline }
    async signIn(name, pin) {
      try {
        const j = await post('/register', { name, pin, token: tokens()[name.toLowerCase()] });
        saveToken(j.name, j.token); ls.set('hze_name', j.name); ls.del('hze_pending_reg');
        return { ok: true, created: !!j.created, hasPin: j.hasPin };
      } catch (e) {
        const b = e.body || {};
        if (e.status === 409) return { taken: true, hasPin: b.hasPin };
        if (e.status === 403) return { wrongPin: true, triesLeft: b.triesLeft };
        if (e.status === 423) return { locked: true, retryIn: b.retryIn };
        if (e.status === 400) return { bad: true, error: b.error };
        // no network: play now, finish signing in later (see flush)
        ls.set('hze_name', name); ls.set('hze_pending_reg', JSON.stringify({ name, pin }));
        return { ok: true, offline: true };
      }
    },
    // Check this phone's sign-in with the server. → { ok, hasPin } | { offline } | { lost }
    async check() {
      if (ls.get('hze_pending_reg')) return { offline: true }; // signed in offline, not sent yet
      if (!this.signedIn) return { lost: true };
      try { const j = await post('/register', { name: this.name, token: myToken() }); return { ok: true, hasPin: j.hasPin }; }
      catch (e) { return e.status ? { lost: true } : { offline: true }; }
    },
    // Add a PIN for players who signed up before PINs existed.
    async setPin(pin) {
      try { const j = await post('/register', { name: this.name, token: myToken(), pin }); return { ok: j.hasPin }; }
      catch (e) { return { error: e.message }; }
    },
    signOut() { ls.del('hze_name'); ls.del('hze_pending_reg'); },

    async submit(run) {
      const name = this.name, body = { name, token: myToken(), game: GAME, loc: this.loc || undefined, ...run };
      const bk = 'hze_best_' + GAME, best = Math.max(+ls.get(bk, 0), run.score); ls.set(bk, best);
      try { return { ...(await post('/scores', body)), localBest: best }; }
      catch (e) { if (!e.status) { const q = getJ('hze_pending', []); q.push(body); ls.set('hze_pending', JSON.stringify(q.slice(-10))); } return { offline: !e.status, error: e.message, localBest: best }; }
    },
    // Send anything that was waiting for the network: first an unfinished sign-in, then queued scores.
    async flush() {
      const reg = getJ('hze_pending_reg', null);
      if (reg) { const r = await this.signIn(reg.name, reg.pin); if (r.offline) return; if (!r.ok) { ls.del('hze_pending_reg'); return; } }
      const q = getJ('hze_pending', []); if (!q.length) return; const left = [];
      for (const b of q) { b.token ||= tokens()[b.name.toLowerCase()]; try { await post('/scores', b); } catch (e) { if (!e.status) left.push(b); } }
      ls.set('hze_pending', JSON.stringify(left));
    },
    board(period, game = GAME) { return req(`/leaderboard?game=${encodeURIComponent(game)}&period=${period}&name=${encodeURIComponent(this.name)}`); },
  };
})();
