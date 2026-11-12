// Coach console (roster + driver profiles + live notes) and owner Team panel (access levels).
const kfAcadFor = (db, k) => kfAcademyStats({ quiz: db.quiz[k] || {} });
const kfDrivers = db => Object.entries(db.users).filter(([, u]) => u.role === "member" || u.role === "academy");
const KF_TONES = [["success", "Gaining"], ["warning", "Watch"], ["info", "Info"], ["danger", "Issue"]];
const KF_ROLECHIP = { owner: "accent", manager: "accent", coach: "accent", staff: "info", member: "success", academy: "warning" };

function RosterTab({ ctx }) {
 const db = useDB(), [q, setQ] = useStateK(""), [f, setF] = useStateK("all");
 const all = kfDrivers(db), list = all.filter(([, u]) => (f === "all" || u.role === f) && (u.name + u.id + u.cls).toLowerCase().includes(q.toLowerCase()));
 const wk = Date.now() - 7 * 864e5, notesWk = Object.values(db.notes).flat().filter(n => n.at > wk).length;
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">{KF.roles[ctx.user.role].label} · {ctx.user.name}</span><h1 className="kf-h1">The <em>drivers</em></h1></div>
  {kfCan(ctx.user, "billing") && (() => { const od = kfAccessRows(db).filter(r => r.until < Date.now()); return od.length > 0 && <button className="kf-card kf-dlrow kf-billrow bad" onClick={() => ctx.go("billing")}><KIcon n="card"></KIcon><div><b>{od.length} {od.length === 1 ? "payment" : "payments"} overdue</b><small>{od.slice(0, 3).map(r => r.u.name + " · " + kfItem(r.kind, r.plan)).join(" · ")}{od.length > 3 ? " +" + (od.length - 3) + " more" : ""}</small></div><KIcon n="right" s={18}></KIcon></button>; })()}
  <div className={"kf-card kf-stats" + (kfCan(ctx.user, "coach") ? "" : " n3")}><Stat label="Drivers" main={String(all.length)} decimal=""></Stat>
   <Stat label="Members" main={String(all.filter(([, u]) => u.role === "member").length)} decimal=""></Stat>
   <Stat label="Academy only" main={String(all.filter(([, u]) => u.role === "academy").length)} decimal=""></Stat>
   {kfCan(ctx.user, "coach") && <Stat label="Notes this week" main={String(notesWk)} decimal=""></Stat>}
  </div>
  <div className="kf-toolbar">
   <label className="kf-search"><KIcon n="search" s={18}></KIcon><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, ID or class"></input></label>
   <div className="kf-seg">{[["all", "All"], ["member", "Members"], ["academy", "Academy"]].map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div>
  </div>
  <div className="kf-roster">{list.map(([k, u]) => { const n = (db.notes[k] || [])[0], a = kfAcadFor(db, k), acad = !!db.owned[k] || u.role === "academy";
   return <button key={k} className="kf-card kf-drv" onClick={() => ctx.push({ t: "driver", id: k })}>
    <div className="kf-drv-top"><KAvatar u={u} s={52}></KAvatar><div><b>{u.name}</b><small className="kf-mono">{u.id}</small></div>{u.status === "suspended" ? <VerdictChip label="Paused" tone="danger"></VerdictChip> : <VerdictChip label={KF.roles[u.role].label} tone={KF_ROLECHIP[u.role]}></VerdictChip>}</div>
    <div className="kf-g3"><div><small>Class</small><b>{u.cls}</b></div><div><small>Last note</small><b>{n ? kfAgo(n.at) : "—"}</b></div><div><small>Academy</small><b>{acad ? a.pct + "%" : "—"}</b></div></div>
   </button>; })}
   {!list.length && <p className="kf-hint">No drivers match.</p>}</div>
 </div>;
}

function DriverView({ ctx, id, tab: t0 }) {
 const db = useDB(), u = db.users[id], [tab, setTab] = useStateK(t0 || "notes");
 if (!u) return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Driver"></KHeader><p className="kf-hint">Driver not found.</p></div>;
 const coach = kfCan(ctx.user, "coach"), media = coach || kfCan(ctx.user, "media"), admin = kfCan(ctx.user, "admin"), bill = kfCan(ctx.user, "billing");
 const tabs = [coach && ["notes", "Notes"], coach && ["progress", "Progress"], admin && ["info", "Info"], bill && ["billing", "Payments"], ["academy", "Academy"], ["photos", "Files"]].filter(Boolean);
 const cur = tabs.some(t => t[0] === tab) ? tab : tabs[0][0];
 const msg = () => { ctx.set({ chatOpen: kfDM(ctx.key, id) }); ctx.go("chat"); };
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Driver profile" right={<span className="kf-hdr-k">{u.id}</span>}></KHeader>
  <div className="kf-scroll"><div className="kf-pad">
   <div className="kf-prof">
    <KAvatar u={u} s={84}></KAvatar>
    <div className="kf-stack g8"><h1 className="kf-h1">{u.name}</h1><div className="kf-row"><VerdictChip label={KF.roles[u.role].label} tone={KF_ROLECHIP[u.role]}></VerdictChip><span className="kf-hero-meta"><span>{u.cls}</span><span>Since {u.since}</span>{u.status === "suspended" && <span style={{ color: "#FF9AD8" }}>Paused</span>}</span></div></div>
    <div className="kf-prof-act"><button className="kf-btn solid auto" onClick={msg}><KIcon n="chat" s={16}></KIcon>Message</button>{kfCan(ctx.user, "admin") && <button className="kf-btn ghost auto" onClick={() => ctx.go("team")}><KIcon n="shield" s={16}></KIcon>Access</button>}</div>
   </div>
   <div className="kf-seg wide">{tabs.map(([k, l]) => <button key={k} className={cur === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
   {cur === "notes" && <NotesPane ctx={ctx} id={id} coach={coach}></NotesPane>}
   {cur === "progress" && <ProgressPane ctx={ctx} id={id} coach={coach}></ProgressPane>}
   {cur === "info" && <InfoPane ctx={ctx} id={id}></InfoPane>}
   {cur === "billing" && <BillingPane ctx={ctx} id={id}></BillingPane>}
   {cur === "academy" && <AcademyPane ctx={ctx} id={id}></AcademyPane>}
   {cur === "photos" && <FolderBrowser ctx={ctx} driver={id} canEdit={media}></FolderBrowser>}
  </div></div>
 </div>;
}

function NotesPane({ ctx, id, coach }) {
 const db = useDB(), notes = db.notes[id] || [], blank = { session: "", verdict: "", tone: "success", text: "", focus: "" }, [f, setF] = useStateK(blank), [ok, setOk] = useStateK(false);
 const post = e => { e.preventDefault(); if (!f.text.trim()) return;
  const n = { id: KFDB.uid(), date: kfDate(Date.now()), session: f.session.trim() || "General", verdict: f.verdict.trim() || KF_TONES.find(t => t[0] === f.tone)[1], tone: f.tone, text: f.text.trim(), focus: f.focus.split("\n").map(s => s.trim()).filter(Boolean), by: ctx.key, at: Date.now() };
  KFDB.update(d => { d.notes[id] = [n, ...(d.notes[id] || [])]; }); setF(blank); setOk(true); setTimeout(() => setOk(false), 2400); };
 const del = n => confirm("Delete this note?") && KFDB.update(d => { d.notes[id] = d.notes[id].filter(x => x.id !== n.id); });
 return <div className="kf-cols">
  {coach && <form className="kf-card hi kf-stack g12 kf-composer" onSubmit={post}>
   <span className="kf-lbl lilac">New note · posts live to {db.users[id].first || db.users[id].name}</span>
   <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Session</span><input value={f.session} onChange={e => setF({ ...f, session: e.target.value })} placeholder="Practice · Jacksonville"></input></label>
    <label className="kf-field"><span className="kf-lbl">Verdict</span><input value={f.verdict} onChange={e => setF({ ...f, verdict: e.target.value })} placeholder="Gaining · −0.3 s"></input></label></div>
   <div className="kf-seg">{KF_TONES.map(([k, l]) => <button type="button" key={k} className={f.tone === k ? "on" : ""} onClick={() => setF({ ...f, tone: k })}>{l}</button>)}</div>
   <label className="kf-field"><span className="kf-lbl">Note</span><textarea rows="4" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="What happened, what to change."></textarea></label>
   <label className="kf-field"><span className="kf-lbl">Focus items · one per line</span><textarea rows="3" value={f.focus} onChange={e => setF({ ...f, focus: e.target.value })} placeholder={"Brake release into T4\nThrottle later at T7"}></textarea></label>
   <button className="kf-btn solid" disabled={!f.text.trim()}>{ok ? "Posted" : "Post note"}</button>
  </form>}
  <div className="kf-stack g12">{notes.length ? notes.map(n => { const a = db.users[n.by]; return <div key={n.id} className="kf-card kf-note">
   <div className="kf-rowb" style={{ width: "100%" }}><span className="kf-lbl">{n.date} · {n.session}</span>{(n.by === ctx.key || kfCan(ctx.user, "admin")) && coach && <button className="kf-link" onClick={() => del(n)}>Delete</button>}</div>
   <VerdictChip label={n.verdict} tone={n.tone}></VerdictChip><p className="kf-body">{n.text}</p>
   {n.focus && n.focus.length > 0 && <ul className="kf-focus">{n.focus.map(x => <li key={x}>{x}</li>)}</ul>}
   <span className="kf-lbl">{a ? a.name : "Coach"} · {kfAgo(n.at)}</span></div>; }) : <div className="kf-card kf-empty"><p className="kf-body sm">No notes yet.</p></div>}</div>
 </div>;
}

function ProgressPane({ ctx, id, coach }) {
 const db = useDB(), skills = db.skills[id] || KF.skills.map(s => ({ k: s.k, v: 5, d: 0 })), sess = db.sessions[id] || [];
 const today = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }), [f, setF] = useStateK({ date: today, track: "", type: "Practice", best: "", pos: "" });
 const step = (i, dv) => KFDB.update(d => { const s = (d.skills[id] || skills).map(x => ({ ...x })); const nv = Math.max(0, Math.min(10, Math.round((s[i].v + dv) * 10) / 10)); s[i].d = Math.round(((s[i].d || 0) + nv - s[i].v) * 10) / 10; s[i].v = nv; d.skills[id] = s; });
 const add = e => { e.preventDefault(); if (!f.track || !/^\d+(\.\d+)?$/.test(f.best)) return; KFDB.update(d => { d.sessions[id] = [...(d.sessions[id] || []), { ...f, pos: f.pos || undefined }]; }); setF({ ...f, best: "", pos: "" }); };
 return <div className="kf-cols">
  <section className="kf-sec"><KSecH label={"Skill ratings" + (coach ? " · tap to adjust" : "")}></KSecH>
   <div className="kf-card kf-skills">{skills.map((k, i) => <div key={k.k} className="kf-skill"><div className="kf-rowb"><span>{k.k}</span><span className="kf-row" style={{ gap: 8 }}>{coach && <button className="kf-step" onClick={() => step(i, -.1)} aria-label="Lower">−</button>}<span className="kf-mono">{k.v.toFixed(1)}</span>{coach && <button className="kf-step" onClick={() => step(i, .1)} aria-label="Raise">+</button>}</span></div><KBar v={k.v} max={10}></KBar></div>)}</div>
  </section>
  <section className="kf-sec"><KSecH label="Sessions"></KSecH>
   {coach && <form className="kf-card kf-stack g12" onSubmit={add}>
    <div className="kf-g3"><label className="kf-field"><span className="kf-lbl">Date</span><input value={f.date} onChange={e => setF({ ...f, date: e.target.value })}></input></label><label className="kf-field"><span className="kf-lbl">Track</span><input value={f.track} onChange={e => setF({ ...f, track: e.target.value })} placeholder="Jacksonville"></input></label><label className="kf-field"><span className="kf-lbl">Best lap (s)</span><input inputMode="decimal" value={f.best} onChange={e => setF({ ...f, best: e.target.value })} placeholder="48.177"></input></label></div>
    <div className="kf-row"><div className="kf-seg">{["Practice", "Race"].map(t => <button type="button" key={t} className={f.type === t ? "on" : ""} onClick={() => setF({ ...f, type: t })}>{t}</button>)}</div>{f.type === "Race" && <label className="kf-field kf-sm"><input value={f.pos} onChange={e => setF({ ...f, pos: e.target.value })} placeholder="P5"></input></label>}<span className="kf-grow"></span><button className="kf-btn solid auto sm">Log session</button></div>
   </form>}
   <div className="kf-card kf-list">{sess.length ? [...sess].reverse().map((x, i) => <div key={i} className="kf-li"><span className="kf-date">{x.date.split(" ")[0]}<b>{x.date.split(" ")[1]}</b></span><div><b>{x.type}{x.pos ? " · " + x.pos : ""}</b><small>{x.track}</small></div><span className="kf-mono">{x.best}</span></div>) : <p className="kf-hint" style={{ padding: "18px 0" }}>No sessions logged.</p>}</div>
  </section>
 </div>;
}

function AcademyPane({ ctx, id }) {
 const db = useDB(), u = db.users[id], a = kfAcadFor(db, id), q = db.quiz[id] || {}, own = db.owned[id], has = !!own || u.role === "academy", admin = kfCan(ctx.user, "admin");
 const grant = on => KFDB.update(d => { if (on) d.owned[id] = { plan: "yearly", at: Date.now(), until: kfAdd(Date.now(), "yearly"), by: ctx.key }; else delete d.owned[id]; });
 return <div className="kf-stack">
  <div className="kf-card kf-rowb"><div className="kf-stack g8"><span className="kf-lbl">Academy access</span><b style={{ fontSize: 17, fontWeight: 500 }}>{has ? (own ? KF.plans[own.plan || "yearly"].label + " plan" + (own.until ? " · " + kfSt(own.until).label : "") : "Academy account") : "No access"}</b></div>
   {admin && u.role !== "academy" && <button className={"kf-btn auto sm" + (has ? " ghost" : " solid")} onClick={() => grant(!has)}>{has ? "Revoke" : "Grant access"}</button>}</div>
  {has && <><div className="kf-card kf-stats"><Stat label="Course" main={String(a.pct)} decimal="" unit="%"></Stat><Stat label="Topics" main={String(a.done)} decimal="" unit={"/" + a.total}></Stat><Stat label="Exams" main={String(a.exams)} decimal="" unit={"/" + KF.modules.length}></Stat><Stat label="Next" main={a.next ? "U" + (KF.modules.findIndex(m => m.id === a.next.m) + 1) : "Done"} decimal=""></Stat></div>
   <div className="kf-card kf-list">{KF.modules.map((m, i) => { const d = m.lessons.filter(l => (q[l.id] || 0) >= KF.pass.topic).length, ex = q["exam:" + m.id]; return <div key={m.id} className="kf-li"><span className="kf-num">{String(i + 1).padStart(2, "0")}</span><div><b>{m.t}</b><KBar v={d} max={m.lessons.length}></KBar></div><span className="kf-mono">{d}/{m.lessons.length}{ex != null ? " · " + ex + "/" + m.exam.length : ""}</span></div>; })}</div></>}
 </div>;
}

function kfNewId(db, type) {
 const pre = type === "staff" ? "00" : "27", kind = type === "academy" ? "academy" : "member"; let n = 1;
 while (db.users["member:" + pre + String(n).padStart(4, "0")] || db.users["academy:" + pre + String(n).padStart(4, "0")]) n++;
 const p = String(n).padStart(4, "0"); return { key: kind + ":" + pre + p, id: (kind === "academy" ? "KFA-" : "KF-") + pre + "-" + p };
}

function TeamTab({ ctx }) {
 const db = useDB(), [q, setQ] = useStateK(""), [flt, setFlt] = useStateK("drivers"), [add, setAdd] = useStateK(false), [made, setMade] = useStateK(null), [f, setF] = useStateK({ name: "", cls: "", type: "academy", role: "academy", email: "", phone: "", plan: "yearly", paid: "" });
 const people = Object.entries(db.users).filter(([, u]) => (flt === "all" || (flt === "staff" ? kfStaff(u) : !kfStaff(u))) && (u.name + u.id).toLowerCase().includes(q.toLowerCase())).sort((a, b) => KF.roles[b[1].role].rank - KF.roles[a[1].role].rank || a[1].name.localeCompare(b[1].name));
 const set = (k, p) => KFDB.update(d => { d.users[k] = { ...d.users[k], ...p }; });
 const [pc, setPc] = useStateK(""), [cErr, setCErr] = useStateK(""), [cBusy, setCBusy] = useStateK(false), minPc = f.type === "staff" ? 8 : 6;
 const create = async e => { e.preventDefault(); if (!f.name.trim() || cBusy) return; if (KF_LIVE && pc.length < minPc) { setCErr("Passcode needs " + minPc + "+ digits."); return; } const n = kfNewId(KFDB.state, f.type);
  setCBusy(true); setCErr(""); let auth = null; try { auth = await KFDB.createLogin(n.id, 1, pc); } catch (er) { setCErr(er.message); setCBusy(false); return; } setCBusy(false);
  const u = { type: f.type, role: f.role, id: n.id, name: f.name.trim(), first: f.name.trim().split(" ")[0], cls: f.cls.trim() || (f.type === "staff" ? "Team staff" : "—"), since: String(new Date().getFullYear()), valid: f.type === "staff" ? "Staff" : f.type === "academy" ? "Academy" : "12 / 27", photo: null, status: "active", coach: "Eugene", info: { email: f.email.trim(), phone: f.phone.trim() }, ...(auth ? { auth_id: auth, login_v: 1 } : {}) };
  KFDB.update(d => { d.users[n.key] = u; if (f.type === "academy" && f.paid) kfGrantIn(d, n.key, "academy", f.plan, f.paid, ctx.key); }); setMade(n.key); setPc(""); setF({ name: "", cls: "", type: "academy", role: "academy", email: "", phone: "", plan: "yearly", paid: "" }); };
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Owner controls</span><h1 className="kf-h1">Driver <em>accounts</em></h1><p className="kf-lead">Create accounts and login IDs, set access levels and pause accounts. Academy drivers sign in by typing their KFA login ID. Members and staff scan their printed card.</p></div>
  <div className="kf-levels">{Object.entries(KF.roles).map(([k, r]) => <div key={k} className="kf-card"><div className="kf-rowb"><b>{r.label}</b><span className="kf-mono">{Object.values(db.users).filter(u => u.role === k).length}</span></div><small>{{ owner: "Everything: coaching, academy, payments, access", manager: "Runs the app: files, academy, payments, driver info. No coaching", coach: "Roster, notes, ratings, files, academy editor", staff: "Roster view and team chat", member: "Driver dashboard, coach notes, files", academy: "Academy course and chat" }[k]}</small></div>)}</div>
  <div className="kf-toolbar"><label className="kf-search"><KIcon n="search" s={18}></KIcon><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people"></input></label><div className="kf-seg">{[["drivers", "Drivers"], ["staff", "Staff"], ["all", "All"]].map(([k, l]) => <button key={k} className={flt === k ? "on" : ""} onClick={() => setFlt(k)}>{l}</button>)}</div><button className="kf-btn solid auto" onClick={() => { setAdd(true); setMade(null); }}><KIcon n="plus" s={16}></KIcon>New account</button></div>
  <div className="kf-card kf-list kf-team">{people.map(([k, u]) => { const self = k === ctx.key, has = !!db.owned[k] || u.role === "academy";
   return <div key={k} className="kf-li kf-person">
    <KAvatar u={u} s={42}></KAvatar>
    <div><b>{u.name}{self && " · you"}</b><small className="kf-mono">{u.id} · {u.type === "academy" ? "login ID" : "card"} · {u.cls}</small></div>
    <div className="kf-person-c">
     <label className="kf-select"><select value={u.role} disabled={self} onChange={e => set(k, { role: e.target.value })}>{Object.entries(KF.roles).map(([r, x]) => <option key={r} value={r}>{x.label}</option>)}</select></label>
     <button className={"kf-pill" + (has ? " on" : "")} disabled={u.role === "academy" || kfStaff(u)} onClick={() => KFDB.update(d => { if (has) delete d.owned[k]; else d.owned[k] = { plan: "yearly", at: Date.now(), until: kfAdd(Date.now(), "yearly"), by: ctx.key }; })}>Academy</button>
     <button className={"kf-pill" + (u.status === "suspended" ? " bad" : " on")} disabled={self} onClick={() => set(k, { status: u.status === "suspended" ? "active" : "suspended" })}>{u.status === "suspended" ? "Paused" : "Active"}</button>
     {(u.role === "member" || u.role === "academy") && <button className="kf-icbtn" aria-label="Open profile" onClick={() => ctx.push({ t: "driver", id: k })}><KIcon n="right" s={18}></KIcon></button>}
    </div>
   </div>; })}</div>
  {!KF_LIVE && <button className="kf-link" style={{ alignSelf: "flex-start" }} onClick={() => confirm("Reset all demo data? Notes, chat, uploads and progress will be cleared.") && KFDB.reset()}>Reset demo data</button>}
  <KSheet open={add} onClose={() => setAdd(false)}>
   {made && db.users[made] ? <>
    <span className="kf-ok"><i></i>Account created</span><h2 className="kf-h2">{db.users[made].name}</h2>
    {db.users[made].type === "academy" ? <><div className="kf-card hi kf-stack g8"><span className="kf-lbl">Academy login ID</span><b className="kf-loginid">{db.users[made].id}</b><small className="kf-body sm">{db.owned[made] ? "Access to " + kfLong(db.owned[made].until) : "No Academy access yet · grant it in Payments once paid"}</small></div>
     <p className="kf-body sm">Send this ID to the driver. They tap <b>Enter Academy ID</b> on the sign-in screen.</p>
     <button className="kf-btn ghost" onClick={() => navigator.clipboard && navigator.clipboard.writeText(db.users[made].id)}>Copy login ID</button></>
     : <><KCard user={db.users[made]} side="back"></KCard><p className="kf-body sm">Print the card. {db.users[made].name.split(" ")[0]} signs in by scanning it. ID <b className="kf-mono">{db.users[made].id}</b> can't be typed in.</p></>}
    <button className="kf-btn solid" onClick={() => setAdd(false)}>Done</button>
   </> : <form className="kf-stack g12" onSubmit={create}>
    <div className="kf-rowb"><span className="kf-lbl">New account</span><button type="button" className="kf-icbtn" onClick={() => setAdd(false)}><KIcon n="x"></KIcon></button></div>
    <div className="kf-seg wide">{[["academy", "Academy · login ID"], ["member", "Member · card"], ["staff", "Staff · card"]].map(([k, l]) => <button type="button" key={k} className={f.type === k ? "on" : ""} onClick={() => setF({ ...f, type: k, role: k === "staff" ? "staff" : k })}>{l}</button>)}</div>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Full name</span><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="First Last"></input></label>
     <label className="kf-field"><span className="kf-lbl">Class / title</span><input value={f.cls} onChange={e => setF({ ...f, cls: e.target.value })} placeholder="Micro, KA100 Jr…"></input></label></div>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Email</span><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })}></input></label><label className="kf-field"><span className="kf-lbl">Phone</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}></input></label></div>
    {f.type === "academy" && <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Academy plan</span><div className="kf-seg wide">{["monthly", "yearly"].map(p => <button type="button" key={p} className={f.plan === p ? "on" : ""} onClick={() => setF({ ...f, plan: p })}>{kfPlanL(p)}</button>)}</div></label>
     <label className="kf-field"><span className="kf-lbl">Paid by Zelle · USD · optional</span><input inputMode="decimal" value={f.paid} placeholder={String(db.academy.plans[f.plan].regular)} onChange={e => setF({ ...f, paid: e.target.value.replace(/[^\d.]/g, "") })}></input></label></div>}
    {f.type === "staff" && <label className="kf-field"><span className="kf-lbl">Level</span><label className="kf-select"><select value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{Object.entries(KF.roles).filter(([r]) => kfStaff({ role: r })).map(([r, x]) => <option key={r} value={r}>{x.label}</option>)}</select></label></label>}
    {KF_LIVE && <label className="kf-field"><span className="kf-lbl">Passcode · {minPc}+ digits · give it to them privately</span><input inputMode="numeric" value={pc} onChange={e => setPc(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder={"•".repeat(minPc)}></input></label>}
    {cErr && <p className="kf-warn">{cErr}</p>}
    <button className="kf-btn solid" disabled={!f.name.trim() || cBusy || (KF_LIVE && pc.length < minPc)}>{cBusy ? "Creating…" : f.type === "academy" ? "Create account · issue login ID" : "Create account · issue card"}</button>
   </form>}
  </KSheet>
 </div>;
}

Object.assign(window, { RosterTab, DriverView, TeamTab, kfAcadFor });
