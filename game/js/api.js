// Leaderboard client. A nickname is claimed once per phone: the server hands back a secret token
// that we keep in localStorage, so nobody else can post scores under your name.
// If the network is down, scores are queued and sent the next time the page loads.
const API = (() => {
  const base = (window.HZE_API || '') + '/api';
  const ls = { get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  const getJ = (k, d) => { try { return JSON.parse(ls.get(k)) ?? d; } catch (e) { return d; } };
  const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
  // which café / table the QR code came from (?loc=victoria); remembered for later visits
  const qloc = new URLSearchParams(location.search).get('loc'); if (qloc && /^[a-z0-9_-]{1,24}$/i.test(qloc)) ls.set('hze_loc', qloc.toLowerCase());

  async function req(path, opts = {}) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(base + path, { headers: { 'content-type': 'application/json' }, signal: ctl.signal, ...opts });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status });
      return j;
    } finally { clearTimeout(to); }
  }
  const tokens = () => getJ('hze_tokens', {});
  return {
    NAME_RE,
    get name() { return ls.get('hze_name', ''); },
    get char() { return ls.get('hze_char', 'enzi'); },
    set char(c) { ls.set('hze_char', c); },
    get loc() { return ls.get('hze_loc', ''); },
    // → { ok:true } | { ok:false, taken:true } | { ok:true, offline:true }
    async claim(name) {
      const key = name.toLowerCase(), tk = tokens();
      try {
        const j = await req('/register', { method: 'POST', body: JSON.stringify({ name, token: tk[key] || undefined }) });
        tk[key] = j.token; ls.set('hze_tokens', JSON.stringify(tk)); ls.set('hze_name', j.name); return { ok: true };
      } catch (e) {
        if (e.status === 409) return { ok: false, taken: true };
        if (e.status === 400) return { ok: false, bad: true };
        ls.set('hze_name', name); return { ok: true, offline: true };
      }
    },
    async submit(run) {
      const name = this.name, body = { name, token: tokens()[name.toLowerCase()], loc: this.loc || undefined, ...run };
      const best = Math.max(+ls.get('hze_best', 0), run.score); ls.set('hze_best', best);
      try { return { ...(await req('/scores', { method: 'POST', body: JSON.stringify(body) })), localBest: best }; }
      catch (e) { if (!e.status) { const q = getJ('hze_pending', []); q.push(body); ls.set('hze_pending', JSON.stringify(q.slice(-10))); } return { offline: !e.status, error: e.message, localBest: best }; }
    },
    async flush() {
      const q = getJ('hze_pending', []); if (!q.length) return; const left = [];
      for (const b of q) { try { await req('/scores', { method: 'POST', body: JSON.stringify(b) }); } catch (e) { if (!e.status) left.push(b); } }
      ls.set('hze_pending', JSON.stringify(left));
    },
    board(period) { return req(`/leaderboard?period=${period}&name=${encodeURIComponent(this.name)}`); },
  };
})();
