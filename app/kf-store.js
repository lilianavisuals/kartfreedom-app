// KFDB · shared team data. Persists in localStorage (records) + IndexedDB (photos/videos) and syncs live
// between every open tab/window via BroadcastChannel. Swap load/save/broadcast for a hosted backend
// (Firebase, Supabase…) to sync across devices; the rest of the app only uses get/update/subscribe.
window.KFDB = (function () {
 const LS = "kfdb.v2", bc = "BroadcastChannel" in window ? new BroadcastChannel("kfdb") : null, subs = new Set();
 const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
 const now = Date.now(), day = 864e5;
 const EUG = "member:000001", HQ = "member:000002";
 const AC0 = JSON.parse(JSON.stringify({ modules: KF.modules, pass: KF.pass, plans: KF.plans }));
 const ROLES_ALL = ["owner", "manager", "coach", "staff"];
 function seedBilling(users) {
  const pay = {}, mo = 30 * day;
  Object.entries(users).forEach(([k, u]) => {
   if (u.role === "member") {
    const late = k === "member:270003";
    u.bill = { plan: KF.membership.label, rate: KF.membership.rate, per: KF.membership.per, due: late ? now - 6 * day : now + 19 * day, method: "Visa ·· " + (4000 + (parseInt(k.slice(-2)) * 137) % 6000) };
    pay[k] = [0, 1, 2].map(i => ({ id: uid() + i, at: now - (late ? 36 : 11) * day - i * mo, amt: u.bill.rate, what: KF.membership.label, method: u.bill.method, status: "paid" }));
   } else if (u.role === "academy") {
    u.bill = { plan: "Academy · Yearly", rate: KF.plans.yearly.regular, per: "yr", due: now + 300 * day, method: "Apple Pay" };
    pay[k] = [{ id: uid(), at: now - 65 * day, amt: KF.plans.yearly.regular, what: "Academy · Yearly", method: "Apple Pay", status: "paid" }];
   }
  });
  return pay;
 }
 function migrate(s) {
  let ch = false;
  if (!s.academy) { s.academy = JSON.parse(JSON.stringify(AC0)); ch = true; }
  if (!s.users[HQ]) { s.users[HQ] = { ...KF.users[HQ], status: "active" }; ch = true; }
  Object.values(s.channels || {}).forEach(c => { if (!c.who.includes("manager")) { c.who.push("manager"); ch = true; } });
  if (!s.payments) { s.payments = seedBilling(s.users); ch = true; }
  if (!s.membership) { s.membership = { monthly: { label: "Monthly", rate: KF.membership.rate }, yearly: { label: "Yearly", rate: KF.membership.rate * 10 } }; ch = true; }
  if (!s.stripe) { s.stripe = { links: {}, portal: "" }; ch = true; }
  if (!s.requests) { s.requests = []; ch = true; }
  if (!s.mig3) { s.mig3 = 1; ch = true; delete s.stripe; const yr = 365 * day;
   s.membership = { yearly: { label: "Yearly", rate: KF.membership.rate } }; s.payments = {};
   Object.entries(s.users).forEach(([k, u]) => {
    if (u.role === "member") { const due = k === "member:270003" ? now - 6 * day : k === "member:270005" ? now + 5 * day : now + (60 + parseInt(k.slice(-1)) * 31) * day;
     u.bill = { plan: "Membership · Yearly", rate: KF.membership.rate, per: "yr", due, status: "active", method: "Zelle" }; s.payments[k] = [{ id: uid(), at: due - yr, amt: KF.membership.rate, what: "Membership · Yearly", method: "Zelle", status: "paid" }]; }
    else if (u.role === "academy") { delete u.bill; const due = now + 300 * day; s.owned[k] = { plan: "yearly", at: due - yr, until: due }; s.payments[k] = [{ id: uid(), at: due - yr, amt: s.academy.plans.yearly.regular, what: "Academy · Yearly", method: "Zelle", status: "paid" }]; }
    else delete u.bill;
   });
   Object.values(s.owned).forEach(o => { if (!o.until) o.until = (o.at || now) + (o.plan === "monthly" ? 30 : 365) * day; });
   s.requests = [{ id: uid(), kind: "academy", plan: "monthly", from: null, guest: { name: "Marcus Hale", email: "marcus.hale@example.com", phone: "(904) 555-0182", cls: "Mini Swift" }, price: s.academy.plans.monthly.regular, at: now - 3 * 36e5, status: "open" }];
  }
  return ch;
 }
 function seed() {
  const users = {};
  Object.entries(KF.users).forEach(([k, u]) => { users[k] = { ...u, role: u.role || (u.type === "academy" ? "academy" : "member"), status: "active" }; });
  const J = "member:270001";
  const ago = d => now - d * day;
  return {
   v: 1, users,
   notes: { [J]: KF.coachNotes.map((n, i) => ({ ...n, id: uid() + i, by: EUG, at: ago([3, 10, 17][i] || 20) })) },
   skills: { [J]: KF.skills.map(s => ({ ...s })) },
   sessions: { [J]: KF.sessions.map(s => ({ ...s })) },
   setup: { [J]: KF.setup.map(s => ({ ...s })) },
   folders: { [J]: [{ id: "f1", name: "Jacksonville · Nov 2026", at: ago(3) }, { id: "f2", name: "Music City", at: ago(10) }, { id: "f3", name: "Team portraits", at: ago(40) }] },
   photos: { [J]: [
    { id: "p1", folder: "f1", src: "assets/jude-action.jpg", name: "Jude-Jacksonville.jpg", kind: "image", by: EUG, at: ago(3) },
    { id: "p2", folder: "f2", src: "assets/music-city-kart.jpg", name: "Music-City.jpg", kind: "image", by: EUG, at: ago(10) },
    { id: "p3", folder: "f3", src: "assets/jude-id-photo.jpg", name: "Jude-portrait-2026.jpg", kind: "image", by: EUG, at: ago(40) }] },
   channels: {
    general: { t: "General", sub: "Everyone at KartFreedom", who: ["owner", "coach", "staff", "member", "academy"] },
    members: { t: "Members", sub: "Race team members", who: ["owner", "coach", "staff", "member"] },
    academy: { t: "Academy", sub: "Academy drivers", who: ["owner", "coach", "staff", "academy"], academyOwners: true }
   },
   msgs: {
    general: [
     { id: uid(), from: EUG, text: "Practice day Nov 21 at Jacksonville. Gates 7:30, first session 9:00.", at: ago(2) },
     { id: uid(), from: "member:270006", text: "Is anyone bringing a spare 10-tooth sprocket?", at: ago(1.9) },
     { id: uid(), from: "member:270004", text: "I have two. Find me in the paddock.", at: ago(1.8) }],
    members: [
     { id: uid(), from: EUG, text: "Winter Series Rd 1 entries close Nov 28. Confirm with me by then.", at: ago(1) },
     { id: uid(), from: "member:270003", text: "Confirmed for Micro.", at: ago(.9) }],
    academy: [{ id: uid(), from: "academy:270002", text: "Unit 1 done. The flags topic quiz is harder than it looks.", at: ago(.5) }]
   },
   reads: {}, owned: {}, done: {}, quiz: {}, req: {}
  };
 }
 function seedAll() { const s = seed(); migrate(s); return s; }
 const load = () => { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } };
 let state = load();
 if (!state) { state = seedAll(); localStorage.setItem(LS, JSON.stringify(state)); }
 else if (migrate(state)) localStorage.setItem(LS, JSON.stringify(state));
 // Academy content, pass marks and pricing now live in the shared data so staff can edit them.
 let lc = null;
 Object.defineProperty(KF, "modules", { configurable: true, get: () => state.academy.modules });
 Object.defineProperty(KF, "pass", { configurable: true, get: () => state.academy.pass });
 Object.defineProperty(KF, "plans", { configurable: true, get: () => state.academy.plans });
 Object.defineProperty(KF, "allLessons", { configurable: true, get: () => { if (lc && lc.v === state.v && lc.m === state.academy.modules) return lc.l; const l = state.academy.modules.flatMap(m => m.lessons.map(x => ({ ...x, m: m.id, mt: m.t }))); lc = { v: state.v, m: state.academy.modules, l }; return l; } });
 const emit = () => subs.forEach(f => f(state));
 const refresh = () => { const s = load(); if (s) { migrate(s); state = s; emit(); } };
 if (bc) bc.onmessage = refresh;
 window.addEventListener("storage", e => { if (e.key === LS) refresh(); });
 function update(fn) {
  const next = JSON.parse(JSON.stringify(load() || state)); fn(next); next.v = (next.v || 0) + 1; state = next;
  try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) { alert("Storage is full. Remove some photos or videos."); }
  if (bc) bc.postMessage(state.v); emit();
 }
 let dbp;
 const idb = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open("kfmedia", 1); r.onupgradeneeded = () => r.result.createObjectStore("b"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
 async function putBlob(blob) { const id = "b" + uid(), d = await idb(); await new Promise((res, rej) => { const t = d.transaction("b", "readwrite"); t.objectStore("b").put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); }); return id; }
 async function getBlob(id) { const d = await idb(); return new Promise(res => { const r = d.transaction("b").objectStore("b").get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); }
 async function delBlob(id) { const d = await idb(); d.transaction("b", "readwrite").objectStore("b").delete(id); }
 const urls = {};
 async function mediaURL(m) { if (m.src) return m.src; if (urls[m.blob]) return urls[m.blob]; const b = await getBlob(m.blob); return b ? (urls[m.blob] = URL.createObjectURL(b)) : null; }
 async function mediaBlob(m) { if (m.blob) return getBlob(m.blob); const r = await fetch(m.src); return r.blob(); }
 return { get state() { return state; }, update, subscribe(f) { subs.add(f); return () => subs.delete(f); }, uid, putBlob, getBlob, delBlob, mediaURL, mediaBlob, EUG,
  HQ, AC0, reset() { localStorage.removeItem(LS); state = seedAll(); localStorage.setItem(LS, JSON.stringify(state)); if (bc) bc.postMessage("reset"); emit(); } };
})();
