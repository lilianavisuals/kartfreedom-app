// Payments & access (owner / HQ): request inbox, manual renewals (Zelle), payment log, driver info.
const kfISO = t => t ? new Date(t).toISOString().slice(0, 10) : "";
const kfFromISO = s => s ? new Date(s + "T12:00:00").getTime() : null;
const kfLong = t => t ? new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const kfBill = u => kfSt(u && u.bill && u.bill.due);
const kfPaid = (db, from) => Object.values(db.payments || {}).flat().filter(p => p.status === "paid" && p.at >= from).reduce((s, p) => s + (+p.amt || 0), 0);
function kfCSV(db) {
 const rows = [["Date", "Driver", "ID", "Item", "Amount", "Method", "Status"]];
 Object.entries(db.payments || {}).forEach(([k, l]) => l.forEach(p => { const u = db.users[k] || {}; rows.push([kfISO(p.at), u.name, u.id, p.what, p.amt, p.method, p.status]); }));
 const csv = rows.map(r => r.map(x => '"' + String(x ?? "").replace(/"/g, '""') + '"').join(",")).join("\n"), a = document.createElement("a");
 a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "KartFreedom payments " + kfISO(Date.now()) + ".csv"; document.body.appendChild(a); a.click(); a.remove();
}
function kfPhoto(file) {
 return new Promise(res => { const img = new Image(); img.onload = () => { const s = 360, c = document.createElement("canvas"), k = Math.max(s / img.width, s / img.height); c.width = c.height = s; c.getContext("2d").drawImage(img, (s - img.width * k) / 2, (s - img.height * k) / 2, img.width * k, img.height * k); res(c.toDataURL("image/jpeg", .85)); }; img.src = URL.createObjectURL(file); });
}
// Every access line (membership + academy) for drivers
function kfAccessRows(db) {
 const out = [];
 kfDrivers(db).forEach(([k, u]) => {
  if (u.bill && u.bill.due) out.push({ k, u, kind: "membership", plan: "yearly", until: u.bill.due });
  const o = db.owned[k]; if (o && o.until) out.push({ k, u, kind: "academy", plan: o.plan || "yearly", until: o.until });
 });
 return out.sort((a, b) => a.until - b.until);
}

// Confirm a Zelle payment and grant one period
function GrantSheet({ ctx, job, onClose }) {
 const db = useDB(), [plan, setPlan] = useStateK("yearly"), [amt, setAmt] = useStateK(""), [f, setF] = useStateK({ name: "", email: "", phone: "", cls: "" }), [made, setMade] = useStateK(null);
 useEffectK(() => { if (!job) return; setMade(null); setPlan(job.plan || "yearly"); const g = (job.req && job.req.guest) || {}; setF({ name: g.name || "", email: g.email || "", phone: g.phone || "", cls: g.cls || "" }); }, [job && (job.id || job.k + job.kind)]);
 const u = job && job.k ? db.users[job.k] : null, kind = job ? job.kind : "academy", guest = job && !job.k;
 const price = !job ? 0 : kind === "membership" ? kfMemPrice(db) : kfAcadPrice(db, u, plan);
 useEffectK(() => { if (job) setAmt(String(job.req && job.req.plan === plan ? job.req.price : price)); }, [plan, job && (job.id || job.k + job.kind)]);
 const cur = !u ? null : kind === "membership" ? u.bill && u.bill.due : db.owned[job.k] && db.owned[job.k].until;
 const until = kfAdd(cur && cur > Date.now() ? cur : Date.now(), kind === "membership" ? "yearly" : plan);
 const [pc, setPc] = useStateK(""), [gErr, setGErr] = useStateK(""), [gBusy, setGBusy] = useStateK(false);
 const ok = guest ? f.name.trim().length > 2 && (!KF_LIVE || pc.length >= 6) : true;
 const go = async e => { e.preventDefault(); if (!ok || gBusy) return;
  if (guest) { const n = kfNewId(KFDB.state, "academy"), nm = f.name.trim(); let auth = null;
   setGBusy(true); setGErr(""); try { auth = await KFDB.createLogin(n.id, 1, pc); } catch (er) { setGErr(er.message); setGBusy(false); return; } setGBusy(false);
   KFDB.update(d => { d.users[n.key] = { type: "academy", role: "academy", id: n.id, name: nm, first: nm.split(" ")[0], cls: f.cls.trim() || "—", since: String(new Date().getFullYear()), valid: "Academy", photo: null, status: "active", info: { email: f.email.trim(), phone: f.phone.trim() }, ...(auth ? { auth_id: auth, login_v: 1 } : {}) };
    kfGrantIn(d, n.key, "academy", plan, amt, ctx.key); const r = (d.requests || []).find(x => x.id === job.req.id); if (r) Object.assign(r, { status: "approved", made: n.key, by: ctx.key, done: Date.now() });
    kfNotify(d, ctx.key, n.key, "Welcome to the KartFreedom Academy. Your access is active until " + kfLong(until) + ". Your login ID is " + n.id + "."); });
   setMade(n.key); setPc(""); return; }
  KFDB.update(d => { const t = kfGrantIn(d, job.k, kind, plan, amt, ctx.key); if (job.req) { const r = (d.requests || []).find(x => x.id === job.req.id); if (r) Object.assign(r, { status: "approved", by: ctx.key, done: Date.now() }); }
   kfNotify(d, ctx.key, job.k, "Payment received · " + kfItem(kind, plan) + " · " + kfMoney(+amt || 0) + ". Access active until " + kfLong(t) + "."); });
  onClose(); };
 const nu = made && db.users[made], msg = nu && "Hi " + nu.first + ", your KartFreedom Academy access is active. Open the KartFreedom app, tap Enter Academy ID and type " + nu.id + "." + (KF_LIVE ? " We'll send your passcode separately." : "");
 return <KSheet open={!!job} onClose={onClose}>{job && (nu ? <>
  <span className="kf-ok lilac"><i></i>Account created</span><h2 className="kf-h2">{nu.name}</h2>
  <div className="kf-card hi kf-stack g8"><span className="kf-lbl">Academy login ID</span><b className="kf-loginid">{nu.id}</b><small className="kf-body sm">Access to {kfLong(db.owned[made].until)} · {kfPlanL(db.owned[made].plan)}</small></div>
  <div className="kf-row"><button className="kf-btn ghost auto sm" onClick={() => navigator.clipboard && navigator.clipboard.writeText(nu.id)}>Copy ID</button>{nu.info.email && <a className="kf-btn ghost auto sm" href={"mailto:" + nu.info.email + "?subject=" + encodeURIComponent("Your KartFreedom Academy login") + "&body=" + encodeURIComponent(msg)}>Email it</a>}{nu.info.phone && <a className="kf-btn ghost auto sm" href={"sms:" + nu.info.phone.replace(/[^\d+]/g, "") + "?&body=" + encodeURIComponent(msg)}>Text it</a>}</div>
  <button className="kf-btn solid" onClick={onClose}>Done</button>
 </> : <form className="kf-stack g12" onSubmit={go}>
  <div className="kf-rowb"><span className="kf-lbl">{guest ? "Create Academy account" : job.req ? "Approve request" : "Renew access"}</span><button type="button" className="kf-icbtn" onClick={onClose}><KIcon n="x"></KIcon></button></div>
  <h2 className="kf-h2">{guest ? f.name || "New driver" : u.name}</h2>
  {guest && <><div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Full name</span><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })}></input></label><label className="kf-field"><span className="kf-lbl">Class</span><input value={f.cls} onChange={e => setF({ ...f, cls: e.target.value })}></input></label></div>
   <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Email</span><input value={f.email} onChange={e => setF({ ...f, email: e.target.value })}></input></label><label className="kf-field"><span className="kf-lbl">Phone</span><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}></input></label></div></>}
  {kind === "academy" ? <div className="kf-seg wide">{["monthly", "yearly"].map(p => <button type="button" key={p} className={plan === p ? "on" : ""} onClick={() => setPlan(p)}>{kfPlanL(p)}</button>)}</div> : <span className="kf-lbl lilac">Membership · Yearly</span>}
  <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Received by Zelle · USD</span><input inputMode="decimal" value={amt} onChange={e => setAmt(e.target.value.replace(/[^\d.]/g, ""))}></input></label>
   <div className="kf-field"><span className="kf-lbl">Access until</span><b className="kf-until">{kfLong(until)}</b></div></div>
  {guest && KF_LIVE && <label className="kf-field"><span className="kf-lbl">Their passcode · 6+ digits</span><input inputMode="numeric" value={pc} onChange={e => setPc(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="••••••"></input></label>}
  {gErr && <p className="kf-warn">{gErr}</p>}
  <button className="kf-btn solid" disabled={!ok || gBusy}>{gBusy ? "Creating…" : guest ? "Payment received · create account" : "Payment received · grant access"}</button>
  <p className="kf-hint">Only confirm once the Zelle payment has arrived.</p>
 </form>)}</KSheet>;
}

function BillingTab({ ctx }) {
 const db = useDB(), [f, setF] = useStateK("due"), [job, setJob] = useStateK(null), now = Date.now(), y0 = new Date(new Date().getFullYear(), 0, 1).getTime();
 const reqs = kfOpenReqs(db), rows = kfAccessRows(db), soon = rows.filter(r => r.until - now < 14 * 864e5), list = f === "due" ? soon : rows;
 const recent = Object.entries(db.payments || {}).flatMap(([k, l]) => l.map(p => ({ ...p, k }))).sort((a, b) => b.at - a.at).slice(0, 8);
 const decline = r => confirm("Decline this request?") && KFDB.update(d => { const x = d.requests.find(y => y.id === r.id); if (x) Object.assign(x, { status: "declined", by: ctx.key, done: Date.now() }); if (r.from) kfNotify(d, ctx.key, r.from, "Your request for " + kfReqLabel(r) + " was declined. Message us with any questions."); });
 const msg = k => { ctx.set({ chatOpen: kfDM(ctx.key, k) }); ctx.go("chat"); };
 const eugene = db.users[KFDB.EUG], overdue = rows.filter(r => r.until < now), rem = db.reminders || {};
 const remind = r => { const price = r.kind === "membership" ? r.u.bill.rate : kfAcadPrice(db, r.u, r.plan); KFDB.update(d => { kfNotify(d, ctx.key, r.k, "Reminder: your " + kfItem(r.kind, r.plan) + " expired on " + kfLong(r.until) + ". Send " + kfMoney(price) + " by Zelle to renew, then I'll switch your access back on."); d.reminders = { ...(d.reminders || {}), [r.k + "|" + r.kind]: Date.now() }; }); };
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Access & payments · Zelle</span><h1 className="kf-h1">Requests & <em>renewals</em></h1><p className="kf-lead">Drivers request access here. Take payment by Zelle, then grant one month or one year. Nothing renews by itself.</p></div>
  <div className="kf-card kf-stats">
   <Stat label="Open requests" main={String(reqs.length)} decimal=""></Stat>
   <Stat label="Renew in 14 d" main={String(soon.filter(r => r.until >= now).length)} decimal=""></Stat>
   <Stat label="Expired" main={String(rows.filter(r => r.until < now).length)} decimal=""></Stat>
   <Stat label="This year" main={kfMoney(kfPaid(db, y0))} decimal=""></Stat>
  </div>
  {overdue.length > 0 && <section className="kf-sec"><KSecH label={"Overdue · " + overdue.length}><span className="kf-ok bad"><i></i>Action needed</span></KSecH>
   <div className="kf-card kf-list kf-overdue">{overdue.map(r => { const days = Math.ceil((now - r.until) / 864e5), rt = rem[r.k + "|" + r.kind]; return <div key={r.k + r.kind} className="kf-li kf-renew">
    <KAvatar u={r.u} s={40}></KAvatar><button className="kf-renew-m" onClick={() => ctx.push({ t: "driver", id: r.k, tab: "billing" })}><b>{r.u.name}</b><small>{kfItem(r.kind, r.plan)} · {days} d overdue · since {kfLong(r.until)}{rt ? " · reminded " + kfAgo(rt) : ""}</small></button>
    <div className="kf-row" style={{ gap: 8 }}><button className="kf-btn ghost auto sm" onClick={() => remind(r)}><KIcon n="chat" s={14}></KIcon>{rt ? "Remind again" : "Send reminder"}</button><button className="kf-btn solid auto sm" onClick={() => setJob({ k: r.k, kind: r.kind, plan: r.plan })}>Paid · renew</button></div></div>; })}</div>
  </section>}
  <section className="kf-sec"><KSecH label={"Requests · " + reqs.length}></KSecH>
   {reqs.length ? <div className="kf-reqs">{reqs.map(r => { const u = r.from && db.users[r.from], nm = u ? u.name : r.guest.name;
    return <div key={r.id} className="kf-card kf-req">
     <div className="kf-drv-top">{u ? <KAvatar u={u} s={44}></KAvatar> : <span className="kf-av" style={{ width: 44, height: 44, fontSize: 15 }}>{kfInit(nm)}</span>}<div><b>{nm}</b><small className="kf-mono">{u ? u.id + " · " + KF.roles[u.role].label : "New · no account yet"}</small></div><span className="kf-lbl">{kfAgo(r.at)}</span></div>
     <div className="kf-rowb kf-wrap"><VerdictChip label={kfReqLabel(r)} tone={r.kind === "membership" ? "accent" : "info"}></VerdictChip><b className="kf-mono">{kfMoney(r.price)}</b></div>
     {r.guest && <div className="kf-contact">{r.guest.email && <a href={"mailto:" + r.guest.email}>{r.guest.email}</a>}{r.guest.phone && <a href={"tel:" + r.guest.phone.replace(/[^\d+]/g, "")}>{r.guest.phone}</a>}{r.guest.cls && <span>{r.guest.cls}</span>}</div>}
     <div className="kf-req-act"><button className="kf-btn solid auto sm" onClick={() => setJob({ id: r.id, req: r, k: r.from, kind: r.kind, plan: r.plan })}>{u ? "Paid · grant" : "Paid · create account"}</button>{u && <button className="kf-btn ghost auto sm" onClick={() => msg(r.from)}><KIcon n="chat" s={14}></KIcon>Message</button>}<button className="kf-link" onClick={() => decline(r)}>Decline</button></div>
    </div>; })}</div> : <div className="kf-card kf-empty"><p className="kf-body sm">No open requests. New ones also arrive as a message to {eugene ? eugene.first : "Eugene"}.</p></div>}
  </section>
  <section className="kf-sec"><KSecH label="Renewals"><div className="kf-seg">{[["due", "Due · " + soon.length], ["all", "All · " + rows.length]].map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div></KSecH>
   <div className="kf-card kf-list">{list.map(r => { const s = kfSt(r.until); return <div key={r.k + r.kind} className="kf-li kf-renew">
    <KAvatar u={r.u} s={40}></KAvatar><button className="kf-renew-m" onClick={() => ctx.push({ t: "driver", id: r.k, tab: "billing" })}><b>{r.u.name}</b><small>{kfItem(r.kind, r.plan)} · {kfMoney(r.kind === "membership" ? r.u.bill.rate : kfAcadPrice(db, r.u, r.plan))}</small></button>
    <VerdictChip label={s.label} tone={s.tone}></VerdictChip><button className="kf-btn ghost auto sm" onClick={() => setJob({ k: r.k, kind: r.kind, plan: r.plan })}>Renew</button></div>; })}
    {!list.length && <p className="kf-hint" style={{ padding: "18px 0" }}>Nothing due in the next 14 days.</p>}</div>
  </section>
  <section className="kf-sec"><KSecH label="Recent payments"><button className="kf-link" onClick={() => kfCSV(db)}><KIcon n="dl" s={14}></KIcon>Export CSV</button></KSecH>
   <div className="kf-card kf-list">{recent.map(p => { const u = db.users[p.k]; return <div key={p.id} className="kf-li"><span className="kf-date">{kfDate(p.at).split(" ")[0]}<b>{kfDate(p.at).split(" ")[1]}</b></span><div><b>{u ? u.name : "—"}</b><small>{p.what} · {p.method}</small></div><span className={"kf-mono" + (p.status === "refunded" ? " dim" : "")}>{kfMoney(+p.amt || 0)}</span></div>; })}
    {!recent.length && <p className="kf-hint" style={{ padding: "18px 0" }}>No payments yet.</p>}</div></section>
  <GrantSheet ctx={ctx} job={job} onClose={() => setJob(null)}></GrantSheet>
 </div>;
}

function BillingPane({ ctx, id }) {
 const db = useDB(), u = db.users[id], o = db.owned[id], list = [...((db.payments || {})[id] || [])].sort((a, b) => b.at - a.at), [job, setJob] = useStateK(null);
 const [p, setP] = useStateK({ amt: "", what: "", method: "Zelle", date: kfISO(Date.now()) }), [ok, setOk] = useStateK(false);
 const total = list.filter(x => x.status === "paid").reduce((s, x) => s + (+x.amt || 0), 0), isMem = u.role === "member" || (u.bill && u.bill.due);
 const record = e => { e.preventDefault(); const amt = +p.amt; if (!amt) return; KFDB.update(d => { d.payments[id] = [{ id: KFDB.uid(), at: kfFromISO(p.date) || Date.now(), amt, what: p.what.trim() || "Payment", method: p.method.trim() || "Zelle", status: "paid", by: ctx.key }, ...(d.payments[id] || [])]; }); setP({ ...p, amt: "", what: "" }); setOk(true); setTimeout(() => setOk(false), 2200); };
 const setUntil = (kind, v) => { const t = kfFromISO(v); if (!t) return; KFDB.update(d => { if (kind === "membership") d.users[id].bill = { ...(d.users[id].bill || { plan: "Membership · Yearly", rate: kfMemPrice(d), per: "yr", status: "active", method: "Zelle" }), due: t }; else d.owned[id] = { ...(d.owned[id] || { plan: "yearly", at: Date.now() }), until: t }; }); };
 const end = kind => confirm("End " + (kind === "membership" ? "membership" : "Academy access") + " for " + u.name + " now?") && KFDB.update(d => { if (kind === "membership") { if (d.users[id].bill) d.users[id].bill.due = Date.now() - 1000; } else delete d.owned[id]; });
 const setSt = (x, s) => KFDB.update(d => { const r = (d.payments[id] || []).find(y => y.id === x.id); if (r) r.status = s; });
 const del = x => confirm("Delete this payment record?") && KFDB.update(d => { d.payments[id] = (d.payments[id] || []).filter(y => y.id !== x.id); });
 const Acc = ({ kind, until, plan, price }) => { const s = kfSt(until); return <div className="kf-card kf-stack g12">
  <div className="kf-rowb kf-wrap"><span className="kf-lbl lilac">{kind === "membership" ? "Membership" : "Academy"}</span><VerdictChip label={s.label} tone={s.tone}></VerdictChip></div>
  <div className="kf-g2"><div><span className="kf-lbl">Plan</span><b>{until ? kfPlanL(plan) + " · " + kfMoney(price) : "—"}</b></div>
   <label className="kf-field"><span className="kf-lbl">Valid until</span><input type="date" value={kfISO(until)} onChange={e => setUntil(kind, e.target.value)}></input></label></div>
  <div className="kf-row"><button className="kf-btn solid auto sm" onClick={() => setJob({ k: id, kind, plan: plan || "yearly" })}>{until ? "Renew · paid" : "Grant · paid"}</button>{until && s.st !== "expired" && <button className="kf-btn ghost auto sm" onClick={() => end(kind)}>End now</button>}</div>
 </div>; };
 return <div className="kf-stack">
  <div className="kf-card kf-stats n3"><Stat label="Paid to date" main={kfMoney(total)} decimal=""></Stat><Stat label="Payments" main={String(list.length)} decimal=""></Stat><Stat label="Last paid" main={list[0] ? kfLong(list[0].at) : "—"} decimal=""></Stat></div>
  <div className="kf-cols">
   {isMem && <Acc kind="membership" until={u.bill && u.bill.due} plan="yearly" price={u.bill ? u.bill.rate : kfMemPrice(db)}></Acc>}
   {!kfStaff(u) && <Acc kind="academy" until={o && o.until} plan={o && o.plan} price={kfAcadPrice(db, u, (o && o.plan) || "yearly")}></Acc>}
  </div>
  <form className="kf-card kf-stack g12" onSubmit={record}>
   <span className="kf-lbl lilac">Log another payment · race entry, tyres, parts</span>
   <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Amount · USD</span><input inputMode="decimal" value={p.amt} onChange={e => setP({ ...p, amt: e.target.value.replace(/[^\d.]/g, "") })}></input></label>
    <label className="kf-field"><span className="kf-lbl">Date</span><input type="date" value={p.date} onChange={e => setP({ ...p, date: e.target.value })}></input></label></div>
   <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">For</span><input value={p.what} onChange={e => setP({ ...p, what: e.target.value })} placeholder="Race entry · Rd 1"></input></label>
    <label className="kf-field"><span className="kf-lbl">Method</span><input value={p.method} onChange={e => setP({ ...p, method: e.target.value })}></input></label></div>
   <button className="kf-btn solid" disabled={!+p.amt}>{ok ? "Logged" : "Log payment"}</button>
  </form>
  <section className="kf-sec"><KSecH label={"History · " + list.length}></KSecH>
   <div className="kf-card kf-list">{list.map(x => <div key={x.id} className="kf-li kf-payrow"><span className="kf-date">{kfDate(x.at).split(" ")[0]}<b>{kfDate(x.at).split(" ")[1]}</b></span><div><b>{x.what}</b><small>{x.method} · {new Date(x.at).getFullYear()}{x.status === "refunded" ? " · refunded" : ""}</small></div>
    <span className={"kf-mono" + (x.status === "refunded" ? " dim" : "")}>{kfMoney(+x.amt || 0)}</span>
    <span className="kf-row" style={{ gap: 6 }}><button className="kf-pill" onClick={() => setSt(x, x.status === "refunded" ? "paid" : "refunded")}>{x.status === "refunded" ? "Undo" : "Refund"}</button><button className="kf-icbtn sm" onClick={() => del(x)} aria-label="Delete"><KIcon n="trash" s={16}></KIcon></button></span></div>)}
    {!list.length && <p className="kf-hint" style={{ padding: "18px 0" }}>No payments recorded.</p>}</div>
  </section>
  <GrantSheet ctx={ctx} job={job} onClose={() => setJob(null)}></GrantSheet>
 </div>;
}

const KF_INFO = [["dob", "Date of birth", "date"], ["email", "Email", "email"], ["phone", "Phone", "tel"], ["guardian", "Parent / guardian"], ["gphone", "Guardian phone", "tel"], ["emergency", "Emergency contact"], ["address", "Address"], ["license", "Racing licence no."], ["transponder", "Transponder no."], ["kartno", "Kart number"]];

function InfoPane({ ctx, id }) {
 const db = useDB(), u = db.users[id], init = () => ({ name: u.name, cls: u.cls, valid: u.valid, since: u.since, ...(u.info || {}) });
 const [f, setF] = useStateK(init), [ok, setOk] = useStateK(false), dirty = JSON.stringify(f) !== JSON.stringify(init());
 const save = e => { e.preventDefault(); const { name, cls, valid, since, ...info } = f; KFDB.update(d => { Object.assign(d.users[id], { name: name.trim() || u.name, first: (name.trim() || u.name).split(" ")[0], cls, valid, since, info }); }); setOk(true); setTimeout(() => setOk(false), 2200); };
 const photo = async () => { const [file] = await kfPick("image/*"); if (!file) return; const src = await kfPhoto(file); KFDB.update(d => { d.users[id].photo = src; }); };
 const resetPc = async () => { const p = (prompt("New passcode for " + u.name + " (" + (kfStaff(u) ? 8 : 6) + "+ digits). Their old passcode stops working.") || "").replace(/\D/g, ""); if (!p) return; if (p.length < (kfStaff(u) ? 8 : 6)) { alert("Too short."); return; }
  try { const v = (u.login_v || 1) + (u.auth_id ? 1 : 0), auth = await KFDB.createLogin(u.id, v, p); await KFDB.update(d => { Object.assign(d.users[id], { auth_id: auth, login_v: v }); }); alert("Passcode set. Give it to " + u.first + " privately."); } catch (er) { alert(er.message); } };
 const remove = () => { if (prompt("Type DELETE to permanently remove " + u.name + "'s account, notes, files and payments.") !== "DELETE") return; ctx.pop(); KFDB.update(d => { delete d.users[id]; ["notes", "skills", "sessions", "setup", "folders", "photos", "owned", "done", "quiz", "req", "payments"].forEach(k => d[k] && delete d[k][id]); }); };
 return <form className="kf-stack" onSubmit={save}>
  <div className="kf-card kf-rowb kf-wrap"><div className="kf-row" style={{ gap: 16 }}><KAvatar u={u} s={64}></KAvatar><div className="kf-stack g8"><span className="kf-lbl">Profile photo</span><span className="kf-body sm">Shows on the ID card, roster and chat.</span></div></div>
   <div className="kf-row"><button type="button" className="kf-btn ghost auto sm" onClick={photo}><KIcon n="camera" s={16}></KIcon>{u.photo ? "Replace" : "Upload"}</button>{u.photo && <button type="button" className="kf-btn ghost auto sm" onClick={() => KFDB.update(d => { d.users[id].photo = null; })}>Remove</button>}</div></div>
  <div className="kf-card kf-rowb kf-wrap"><div className="kf-stack g8"><span className="kf-lbl">{u.type === "academy" ? "Login ID · type it at sign-in" : "Member ID · scan the printed card"}</span><b className="kf-loginid">{u.id}</b></div><div className="kf-row">{u.type === "academy" && <button type="button" className="kf-btn ghost auto sm" onClick={() => navigator.clipboard && navigator.clipboard.writeText(u.id)}>Copy</button>}{KF_LIVE && <button type="button" className="kf-btn ghost auto sm" onClick={resetPc}><KIcon n="lock" s={14}></KIcon>{u.auth_id ? "New passcode" : "Set passcode"}</button>}</div></div>
  <div className="kf-cols">
   <div className="kf-card kf-stack g12"><span className="kf-lbl lilac">Account</span>
    <label className="kf-field"><span className="kf-lbl">Full name</span><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })}></input></label>
    <label className="kf-field"><span className="kf-lbl">Class</span><input value={f.cls} onChange={e => setF({ ...f, cls: e.target.value })}></input></label>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Member since</span><input value={f.since} onChange={e => setF({ ...f, since: e.target.value })}></input></label><label className="kf-field"><span className="kf-lbl">Card valid thru</span><input value={f.valid} onChange={e => setF({ ...f, valid: e.target.value })}></input></label></div>
   </div>
   <div className="kf-card kf-stack g12"><span className="kf-lbl lilac">Contact & racing</span>
    <div className="kf-g2 kf-g2f">{KF_INFO.map(([k, l, t]) => <label key={k} className="kf-field"><span className="kf-lbl">{l}</span><input type={t || "text"} value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })}></input></label>)}</div>
   </div>
  </div>
  <button className="kf-btn solid" disabled={!dirty && !ok}>{ok ? "Saved" : "Save driver info"}</button>
  <button type="button" className="kf-link bad" style={{ alignSelf: "flex-start" }} onClick={remove}>Delete account</button>
 </form>;
}

Object.assign(window, { BillingTab, BillingPane, InfoPane, GrantSheet, kfBill, kfLong, kfISO });
