// KFDB · live mode. Same API as the local demo store (state / update / subscribe), backed by Supabase.
// Live by default when app/kf-config.js is set. Add ?demo=1 to the URL for the local demo with sample drivers.
(function () {
 const C = window.KF_CONFIG, q = new URLSearchParams(location.search);
 window.KF_LIVE = !!(C && C.supabaseUrl && C.supabaseKey && window.supabase) && !q.has("demo");
 const demo = window.KFDB;
 demo.lookup = async id => { const u = Object.entries(demo.state.users).find(([, x]) => x.id.toUpperCase() === id.toUpperCase()); return u ? { key: u[0], kf_id: u[1].id, first: u[1].first, name: u[1].name, cls: u[1].cls, status: u[1].status, role: u[1].role, type: u[1].type } : null; };
 demo.createLogin = async () => null; demo.changePass = async () => { };
 if (!KF_LIVE) return;

 const sb = supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: true, storageKey: "kf.auth" } });
 const email = (id, v) => id.toLowerCase() + "-" + (v || 1) + "@login.kartfreedom.app";
 const blank = () => ({ v: 0, users: {}, notes: {}, skills: {}, sessions: {}, setup: {}, folders: {}, photos: {}, channels: {}, msgs: {}, reads: {}, academy: JSON.parse(JSON.stringify(demo.AC0)), owned: {}, done: {}, quiz: {}, req: {}, requests: [], payments: {}, membership: { yearly: { label: "Yearly", rate: KF.membership.rate } }, reminders: {} });
 let state = blank(), me = null, ch = null, rt = null, chain = Promise.resolve();
 const subs = new Set(), emit = () => subs.forEach(f => f(state));
 ["modules", "pass", "plans"].forEach(k => Object.defineProperty(KF, k, { configurable: true, get: () => state.academy[k] }));
 let lc = null;
 Object.defineProperty(KF, "allLessons", { configurable: true, get: () => { if (lc && lc.m === state.academy.modules) return lc.l; const l = state.academy.modules.flatMap(m => m.lessons.map(x => ({ ...x, m: m.id, mt: m.t }))); lc = { m: state.academy.modules, l }; return l; } });

 const T = [["profiles", ["key"]], ["profile_private", ["key"]], ["channels", ["id"]], ["academy", ["id"]], ["settings", ["id"]], ["notes", ["id"]], ["driver_data", ["driver"]], ["folders", ["id"]], ["media", ["id"]], ["messages", ["id"]], ["reads", ["key", "conv"]], ["progress", ["key"]], ["access", ["key"]], ["requests", ["id"]], ["payments", ["id"]]];
 const PK = Object.fromEntries(T);
 function toRows(s) {
  const o = {}; T.forEach(([t]) => o[t] = {});
  const put = (t, r) => { o[t][PK[t].map(k => r[k]).join("|")] = r; };
  Object.entries(s.users).forEach(([k, u]) => {
   put("profiles", { key: k, kf_id: u.id, auth_id: u.auth_id || null, type: u.type, role: u.role, name: u.name, first: u.first || null, cls: u.cls || null, since: u.since || null, valid: u.valid || null, coach: u.coach || null, photo: u.photo || null, status: u.status || "active", login_v: u.login_v || 1 });
   if (u.info || u.bill) put("profile_private", { key: k, info: u.info || {}, bill: u.bill || null });
  });
  Object.entries(s.notes).forEach(([d, l]) => l.forEach(n => put("notes", { id: n.id, driver: d, by_key: n.by || null, date: n.date || null, session: n.session || null, verdict: n.verdict || null, tone: n.tone || null, text: n.text || "", focus: n.focus || [], at: n.at || 0 })));
  new Set([...Object.keys(s.skills), ...Object.keys(s.sessions), ...Object.keys(s.setup)]).forEach(d => { const r = { driver: d, skills: s.skills[d] || [], sessions: s.sessions[d] || [], setup: s.setup[d] || [] }; if (r.skills.length || r.sessions.length || r.setup.length) put("driver_data", r); });
  Object.entries(s.folders).forEach(([d, l]) => l.forEach(f => put("folders", { id: f.id, driver: d, name: f.name, at: f.at || 0 })));
  Object.entries(s.photos).forEach(([d, l]) => l.forEach(p => put("media", { id: p.id, driver: d, folder: p.folder || null, path: p.blob || null, src: p.src || null, name: p.name || null, kind: p.kind || "image", by_key: p.by || null, at: p.at || 0 })));
  Object.entries(s.channels).forEach(([id, c]) => put("channels", { id, t: c.t, sub: c.sub || null, who: c.who || [], academy_owners: !!c.academyOwners }));
  Object.entries(s.msgs).forEach(([cv, l]) => l.forEach(m => put("messages", { id: m.id, conv: cv, from_key: m.from, text: m.text || "", media: m.media || [], at: m.at || 0 })));
  Object.entries(s.reads).forEach(([k, r]) => Object.entries(r || {}).forEach(([cv, n]) => put("reads", { key: k, conv: cv, n: n || 0 })));
  if (s._acad) put("academy", { id: 1, modules: s.academy.modules, pass: s.academy.pass, plans: s.academy.plans });
  new Set([...Object.keys(s.done), ...Object.keys(s.quiz)]).forEach(k => put("progress", { key: k, done: s.done[k] || {}, quiz: s.quiz[k] || {} }));
  Object.entries(s.owned).forEach(([k, a]) => put("access", { key: k, plan: a.plan || null, at: a.at || null, until: a.until || null, by_key: a.by || null }));
  (s.requests || []).forEach(r => put("requests", { id: r.id, kind: r.kind, plan: r.plan, renew: !!r.renew, from_key: r.from || null, guest: r.guest || null, price: +r.price || 0, at: r.at || 0, status: r.status || "open", by_key: r.by || null, made: r.made || null, done: r.done || null }));
  Object.entries(s.payments || {}).forEach(([d, l]) => l.forEach(p => put("payments", { id: p.id, driver: d, at: p.at || 0, amt: +p.amt || 0, what: p.what || null, method: p.method || null, status: p.status || "paid", by_key: p.by || null })));
  if (s._set) put("settings", { id: 1, membership: s.membership || {}, reminders: s.reminders || {} });
  return o;
 }
 function fromRows(R) {
  const s = blank(), push = (o, k, v) => (o[k] = o[k] || []).push(v), n = x => x == null ? undefined : +x, priv = {};
  s.v = (state.v || 0) + 1;
  R.profile_private.forEach(r => priv[r.key] = r);
  R.profiles.forEach(r => { const p = priv[r.key]; s.users[r.key] = { type: r.type, role: r.role, id: r.kf_id, name: r.name, first: r.first, cls: r.cls, since: r.since, valid: r.valid, coach: r.coach, photo: r.photo, status: r.status, login_v: r.login_v, auth_id: r.auth_id, ...(p ? { info: p.info || {}, ...(p.bill ? { bill: p.bill } : {}) } : {}) }; });
  R.notes.sort((a, b) => b.at - a.at).forEach(r => push(s.notes, r.driver, { id: r.id, by: r.by_key, date: r.date, session: r.session, verdict: r.verdict, tone: r.tone, text: r.text, focus: r.focus || [], at: +r.at }));
  R.driver_data.forEach(r => { if ((r.skills || []).length) s.skills[r.driver] = r.skills; if ((r.sessions || []).length) s.sessions[r.driver] = r.sessions; if ((r.setup || []).length) s.setup[r.driver] = r.setup; });
  R.folders.sort((a, b) => b.at - a.at).forEach(r => push(s.folders, r.driver, { id: r.id, name: r.name, at: +r.at }));
  R.media.sort((a, b) => a.at - b.at).forEach(r => push(s.photos, r.driver, { id: r.id, folder: r.folder, ...(r.path ? { blob: r.path } : {}), ...(r.src ? { src: r.src } : {}), name: r.name, kind: r.kind, by: r.by_key, at: +r.at }));
  R.channels.forEach(r => s.channels[r.id] = { t: r.t, sub: r.sub, who: r.who || [], academyOwners: r.academy_owners });
  R.messages.sort((a, b) => a.at - b.at).forEach(r => push(s.msgs, r.conv, { id: r.id, from: r.from_key, text: r.text, media: r.media || [], at: +r.at }));
  R.reads.forEach(r => (s.reads[r.key] = s.reads[r.key] || {})[r.conv] = r.n);
  if (R.academy[0]) { s.academy = { modules: R.academy[0].modules, pass: R.academy[0].pass, plans: R.academy[0].plans }; s._acad = 1; }
  R.progress.forEach(r => { s.done[r.key] = r.done || {}; s.quiz[r.key] = r.quiz || {}; });
  R.access.forEach(r => s.owned[r.key] = { plan: r.plan, at: n(r.at), until: n(r.until), by: r.by_key });
  s.requests = R.requests.sort((a, b) => b.at - a.at).map(r => ({ id: r.id, kind: r.kind, plan: r.plan, renew: r.renew, from: r.from_key, guest: r.guest, price: +r.price, at: +r.at, status: r.status, by: r.by_key, made: r.made, done: n(r.done) }));
  R.payments.sort((a, b) => b.at - a.at).forEach(r => push(s.payments, r.driver, { id: r.id, at: +r.at, amt: +r.amt, what: r.what, method: r.method, status: r.status, by: r.by_key }));
  if (R.settings[0]) { s.membership = R.settings[0].membership || s.membership; s.reminders = R.settings[0].reminders || {}; s._set = 1; }
  return s;
 }
 async function reload() {
  const R = {};
  await Promise.all(T.map(async ([t]) => { const { data, error } = await sb.from(t).select("*").limit(20000); if (error) console.warn("KFDB load", t, error.message); R[t] = data || []; }));
  state = fromRows(R); emit();
 }
 function sync(b, a) {
  chain = chain.then(async () => {
   let err = null;
   for (const [t, keys] of T) for (const k in a[t]) {
    if (!b[t][k]) { const { error } = await sb.from(t).insert(a[t][k]); if (error) err = error; }
    else if (JSON.stringify(b[t][k]) !== JSON.stringify(a[t][k])) { const m = {}; keys.forEach(c => m[c] = a[t][k][c]); const { error } = await sb.from(t).update(a[t][k]).match(m); if (error) err = error; }
   }
   for (const [t, keys] of [...T].reverse()) for (const k in b[t]) if (!a[t][k]) { const m = {}; keys.forEach(c => m[c] = b[t][k][c]); const { error } = await sb.from(t).delete().match(m); if (error) err = error; }
   if (err) { console.warn("KFDB save", err); alert("Couldn't save to the server: " + err.message); if (me) reload(); }
  });
  return chain;
 }
 function update(fn) {
  const b = toRows(state), next = JSON.parse(JSON.stringify(state)); fn(next); next.v = (state.v || 0) + 1; state = next; emit();
  return sync(b, toRows(next));
 }
 function listen() {
  if (ch) sb.removeChannel(ch);
  ch = sb.channel("kf-" + Date.now());
  T.forEach(([t]) => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, () => { clearTimeout(rt); rt = setTimeout(reload, 300); }));
  ch.subscribe();
 }
 const api = {
  live: true, loading: true, needsSetup: false, EUG: demo.EUG, HQ: demo.HQ, AC0: demo.AC0, uid: demo.uid,
  get state() { return state; }, get me() { return me; }, update, subscribe(f) { subs.add(f); return () => subs.delete(f); }, reload,
  async lookup(id) { const { data, error } = await sb.rpc("lookup_id", { p_id: id }); if (error) throw error; return (data && data[0]) || null; },
  async start() {
   const { data: { session } } = await sb.auth.getSession();
   if (session) { const { data } = await sb.rpc("me"); me = data || null; }
   if (me) { await reload(); listen(); } else { if (session) await sb.auth.signOut(); state = blank(); const { data } = await sb.rpc("needs_setup"); api.needsSetup = !!data; }
   api.loading = false; emit(); return me;
  },
  async signIn(id, pass) {
   const L = await api.lookup(id); if (!L) throw new Error("No account with that ID.");
   if (L.status === "suspended") throw new Error("This account is paused. Contact the team.");
   const { error } = await sb.auth.signInWithPassword({ email: email(L.kf_id, L.login_v), password: pass });
   if (error) throw new Error(/invalid/i.test(error.message) ? "Wrong passcode." : error.message);
   return api.start();
  },
  async signOut() { await sb.auth.signOut(); me = null; if (ch) sb.removeChannel(ch); ch = null; state = blank(); emit(); },
  async createLogin(id, v, pass) {
   const t = supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "kf.tmp" } });
   let { data, error } = await t.auth.signUp({ email: email(id, v), password: pass });
   if (error && /registered|exists/i.test(error.message)) ({ data, error } = await t.auth.signInWithPassword({ email: email(id, v), password: pass }));
   if (error) throw error; if (!data.user) throw new Error("Login not created. In Supabase turn off Confirm email."); return data.user.id;
  },
  async changePass(pass) { const { error } = await sb.auth.updateUser({ password: pass }); if (error) throw error; },
  async bootstrap({ hqName, eugPass, hqPass }) {
   const U = KF.users, E = U["member:000001"], H = { ...U["member:000002"], name: hqName, first: hqName.split(" ")[0] };
   const eA = await api.createLogin(E.id, 1, eugPass), hA = await api.createLogin(H.id, 1, hqPass);
   const { error: e1 } = await sb.auth.signInWithPassword({ email: email(H.id, 1), password: hqPass }); if (e1) throw e1;
   const prof = [["member:000001", eA, E], ["member:000002", hA, H]].map(([key, auth_id, u]) => ({ key, kf_id: u.id, auth_id, type: u.type, role: u.role, name: u.name, first: u.first, cls: u.cls, since: u.since, valid: u.valid }));
   const chs = Object.entries(demo.state.channels).map(([id, c]) => ({ id, t: c.t, sub: c.sub, who: c.who, academy_owners: !!c.academyOwners }));
   const { error } = await sb.rpc("bootstrap", { p_profiles: prof, p_academy: demo.AC0, p_settings: { yearly: { label: "Yearly", rate: KF.membership.rate } }, p_channels: chs });
   if (error) throw error;
   return api.start();
  },
  async putBlob(file) { const path = (me || "guest").replace(":", "_") + "/" + demo.uid() + "-" + (file.name || "file").replace(/[^\w.\-]+/g, "_"); const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type || undefined }); if (error) { alert("Upload failed: " + error.message); throw error; } return "s:" + path; },
  async delBlob(b) { if (b && b.startsWith("s:")) await sb.storage.from("media").remove([b.slice(2)]); },
  async mediaURL(m) { if (m.src) return m.src; if (!m.blob || !m.blob.startsWith("s:")) return null; const c = urls[m.blob]; if (c && c.exp > Date.now()) return c.u; const { data } = await sb.storage.from("media").createSignedUrl(m.blob.slice(2), 3600); if (!data) return null; urls[m.blob] = { u: data.signedUrl, exp: Date.now() + 3300e3 }; return data.signedUrl; },
  async mediaBlob(m) { if (m.blob && m.blob.startsWith("s:")) { const { data } = await sb.storage.from("media").download(m.blob.slice(2)); return data; } const r = await fetch(m.src); return r.blob(); },
  getBlob: async () => null, reset() { }
 };
 const urls = {};
 window.KFDB = api;
 api.ready = api.start().catch(e => { console.warn(e); api.loading = false; emit(); });
})();
