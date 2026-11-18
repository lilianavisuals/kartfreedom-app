// Access requests. Drivers (or new people with no ID) request Membership or Academy access. The request lands in
// Eugene's and HQ's Payments inbox (plus a DM to Eugene). Payment happens separately by Zelle; staff then grant access
// for one period. Monthly access is renewed by staff every month, yearly once a year.
const kfAdd = (t, plan) => { const d = new Date(t); plan === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1); return d.getTime(); };
const kfAcadPrice = (db, u, plan) => u && u.role === "member" ? db.academy.plans[plan].member : db.academy.plans[plan].regular;
const kfMemPrice = db => db.membership.yearly.rate;
const kfPlanL = p => p === "monthly" ? "Monthly" : "Yearly";
const kfItem = (kind, plan) => (kind === "membership" ? "Membership" : "Academy") + " · " + kfPlanL(kind === "membership" ? "yearly" : plan);
const kfReqLabel = r => kfItem(r.kind, r.plan) + (r.renew ? " · renewal" : "");
const kfOpenReq = (db, key, kind) => (db.requests || []).find(r => r.status === "open" && r.from === key && (!kind || r.kind === kind));
const kfOpenReqs = db => (db.requests || []).filter(r => r.status === "open");
function kfSt(until) {
 if (!until) return { st: "none", label: "No access", tone: "info" };
 const d = (until - Date.now()) / 864e5;
 return d < 0 ? { st: "expired", label: "Expired " + kfDate(until), tone: "danger" } : d <= 7 ? { st: "due", label: "Renew by " + kfDate(until), tone: "warning" } : { st: "ok", label: "Active to " + kfDate(until), tone: "success" };
}
function kfSendReq(key, kind, plan, renew) {
 const db = KFDB.state, u = db.users[key], price = kind === "membership" ? kfMemPrice(db) : kfAcadPrice(db, u, plan);
 const r = { id: KFDB.uid(), kind, plan: kind === "membership" ? "yearly" : plan, renew: !!renew, from: key, price, at: Date.now(), status: "open" };
 const text = (renew ? "Renewal request · " : "Access request · ") + kfReqLabel(r) + " · " + kfMoney(price) + ". Please send me the Zelle details.";
 KFDB.update(d => { d.requests = [r, ...(d.requests || [])]; const id = kfDM(key, KFDB.EUG); d.msgs[id] = [...(d.msgs[id] || []), { id: KFDB.uid(), from: key, text, at: Date.now() }]; });
}
// Grant / renew one period, paid by Zelle. Extends from the current end date if still active.
function kfGrantIn(d, key, kind, plan, amt, by) {
 const now = Date.now(), u = d.users[key]; let until;
 if (kind === "membership") { const b = u.bill || {}; until = kfAdd(b.due && b.due > now ? b.due : now, "yearly"); u.bill = { plan: "Membership · Yearly", rate: +amt || 0, per: "yr", due: until, status: "active", method: "Zelle" }; if (u.role === "academy") u.role = "member"; }
 else { const o = d.owned[key]; until = kfAdd(o && o.until > now ? o.until : now, plan); d.owned[key] = { plan, at: (o && o.at) || now, until, by }; }
 d.payments = d.payments || {}; d.payments[key] = [{ id: KFDB.uid(), at: now, amt: +amt || 0, what: kfItem(kind, plan), method: "Zelle", status: "paid", by }, ...(d.payments[key] || [])];
 return until;
}
function kfNotify(d, from, to, text) { const id = kfDM(from, to); d.msgs[id] = [...(d.msgs[id] || []), { id: KFDB.uid(), from, text, at: Date.now() }]; }

function KPlans({ list, value, set }) {
 return <div className="kf-plans">{list.map(([k, label, price, per, sub]) => <button type="button" key={k} className={"kf-plan" + (value === k ? " on" : "")} onClick={() => set(k)}>
  <span className="kf-radio"></span><div><b>{label}</b><small>{sub}</small></div><div className="kf-plan-p"><b className="kf-mono">{kfMoney(price)}</b><small>/{per}</small></div></button>)}</div>;
}
const kfAcadPlans = (db, u) => { const m = kfAcadPrice(db, u, "monthly"), y = kfAcadPrice(db, u, "yearly"); return [["monthly", "Monthly", m, "mo", "Renewed by the team each month"], ["yearly", "Yearly", y, "yr", m * 12 - y > 0 ? "Save " + kfMoney(m * 12 - y) + " a year" : "Renewed once a year"]]; };

function KHowItWorks({ who = "Eugene" }) {
 return <ol className="kf-steps">
  <li><b>Send the request.</b> {who} is notified straight away.</li>
  <li><b>Pay by Zelle.</b> {who} messages you the payment details.</li>
  <li><b>Access unlocks</b> once payment is confirmed. The team renews it each period.</li>
 </ol>;
}

function KReqSent({ ctx, r }) {
 return <div className="kf-card hi kf-stack g12"><span className="kf-ok"><i></i>Request sent · {kfAgo(r.at)}</span>
  <b style={{ fontSize: 17, fontWeight: 500 }}>{kfReqLabel(r)} · {kfMoney(r.price)}</b>
  <p className="kf-body sm">Eugene will message you with Zelle details. Access unlocks once payment is confirmed.</p>
  <button className="kf-btn ghost" onClick={() => { ctx.set({ chatOpen: kfDM(ctx.key, KFDB.EUG) }); ctx.reset(); ctx.go("chat"); }}><KIcon n="chat" s={16}></KIcon>Message Eugene</button></div>;
}

// Academy purchase (replaces card checkout)
function CheckoutView({ ctx, plan: p0 }) {
 const db = useDB(), [plan, setPlan] = useStateK(p0 || "yearly"), open = kfOpenReq(db, ctx.key, "academy"), mem = ctx.user.role === "member", o = db.owned[ctx.key], renew = !!o;
 const P = KF.plans[plan], pr = kfAcadPrice(db, ctx.user, plan);
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label={renew ? "Renew Academy" : "Academy access"}></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   <div className="kf-stack"><span className="kf-eyebrow">KartFreedom Academy</span><h1 className="kf-h1">{renew ? <>Renew<br></br><em>access</em></> : <>Request<br></br><em>access</em></>}</h1></div>
   {open ? <KReqSent ctx={ctx} r={open}></KReqSent> : <>
    <KPlans list={kfAcadPlans(db, ctx.user)} value={plan} set={setPlan}></KPlans>
    <div className="kf-card kf-list">
     <div className="kf-li"><div><b>Academy · {P.label}</b><small>Full access for one {plan === "monthly" ? "month" : "year"}</small></div><span className="kf-mono">{kfMoney(P.regular)}</span></div>
     {mem && P.regular > pr && <div className="kf-li"><div><b>Member rate</b><small>{ctx.user.id}</small></div><span className="kf-mono fluo">−{kfMoney(P.regular - pr)}</span></div>}
     <div className="kf-li tot"><div><b>Pay by Zelle</b></div><span className="kf-mono">{kfMoney(pr)}</span></div>
    </div>
    <KHowItWorks></KHowItWorks>
    <button className="kf-btn solid" onClick={() => kfSendReq(ctx.key, "academy", plan, renew)}>Send request · {kfMoney(pr)}</button>
   </>}
  </div></div>
 </div>;
}

// My access (members + academy drivers): status, renewals, receipts
function SubView({ ctx }) {
 const db = useDB(), u = db.users[ctx.key], b = u.bill, o = db.owned[ctx.key], mine = [...((db.payments || {})[ctx.key] || [])].sort((a, z) => z.at - a.at);
 const ms = kfSt(b && b.due), as = kfSt(o && o.until), mOpen = kfOpenReq(db, ctx.key, "membership"), aOpen = kfOpenReq(db, ctx.key, "academy");
 const isMem = u.role === "member";
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="My access"></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   <div className="kf-stack"><span className="kf-eyebrow">{u.id}</span><h1 className="kf-h1">Your <em>access</em></h1><p className="kf-lead">Payments are made by Zelle. The team renews your access each period once payment is confirmed.</p></div>
   {isMem && <section className="kf-sec"><KSecH label="Membership"><VerdictChip label={ms.label} tone={ms.tone}></VerdictChip></KSecH>
    <div className="kf-card kf-list"><div className="kf-li"><div><small>Plan</small><b>Membership · Yearly</b></div><span className="kf-mono">{kfMoney(b ? b.rate : kfMemPrice(db))}/yr</span></div>
     <div className="kf-li"><div><small>{ms.st === "expired" ? "Expired" : "Valid until"}</small><b>{b && b.due ? kfLong(b.due) : "—"}</b></div></div></div>
    {mOpen ? <KReqSent ctx={ctx} r={mOpen}></KReqSent> : ["expired", "due"].includes(ms.st) && <button className="kf-btn solid" onClick={() => kfSendReq(ctx.key, "membership", "yearly", true)}>Request renewal · {kfMoney(kfMemPrice(db))}</button>}
   </section>}
   <section className="kf-sec"><KSecH label="Academy">{o && <VerdictChip label={as.label} tone={as.tone}></VerdictChip>}</KSecH>
    {o ? <div className="kf-card kf-list"><div className="kf-li"><div><small>Plan</small><b>Academy · {kfPlanL(o.plan)}</b></div><span className="kf-mono">{kfMoney(kfAcadPrice(db, u, o.plan))}/{o.plan === "monthly" ? "mo" : "yr"}</span></div>
     <div className="kf-li"><div><small>{as.st === "expired" ? "Expired" : "Valid until"}</small><b>{kfLong(o.until)}</b></div></div></div>
     : <div className="kf-card kf-empty"><p className="kf-body sm">No Academy access yet.</p></div>}
    {aOpen ? <KReqSent ctx={ctx} r={aOpen}></KReqSent> : (!o || ["expired", "due"].includes(as.st)) && <button className={"kf-btn" + (o ? " solid" : "")} onClick={() => ctx.push({ t: "checkout", plan: (o && o.plan) || "yearly" })}>{o ? "Renew Academy" : "Get the Academy"}</button>}
   </section>
   {mine.length > 0 && <section className="kf-sec"><KSecH label="Receipts"></KSecH><div className="kf-card kf-list">{mine.map(x => <div key={x.id} className="kf-li"><span className="kf-date">{kfDate(x.at).split(" ")[0]}<b>{kfDate(x.at).split(" ")[1]}</b></span><div><b>{x.what}</b><small>{x.method} · {new Date(x.at).getFullYear()}{x.status === "refunded" ? " · refunded" : ""}</small></div><span className={"kf-mono" + (x.status === "refunded" ? " dim" : "")}>{kfMoney(+x.amt || 0)}</span></div>)}</div></section>}
  </div></div>
 </div>;
}

// Sign-in page: buy the Academy with no ID yet
function GuestBuyView({ onBack }) {
 const db = useDB(), [plan, setPlan] = useStateK("yearly"), [f, setF] = useStateK({ name: "", email: "", phone: "", cls: "" }), [sent, setSent] = useStateK(null);
 const ok = f.name.trim().split(" ").length >= 2 && /^\S+@\S+\.\S+$/.test(f.email) && f.phone.replace(/\D/g, "").length >= 10;
 const send = e => { e.preventDefault(); if (!ok) return; const r = { id: KFDB.uid(), kind: "academy", plan, from: null, guest: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), cls: f.cls.trim() }, price: db.academy.plans[plan].regular, at: Date.now(), status: "open" }; KFDB.update(d => { d.requests = [r, ...(d.requests || [])]; }); setSent(r); };
 if (sent) return <div className="kf-start"><div className="kf-stack"><span className="kf-ok lilac"><i></i>Request sent</span><h1 className="kf-h1">Thanks,<br></br><em>{sent.guest.name.split(" ")[0]}</em></h1>
  <p className="kf-lead">The team will text or email you within 48 h to arrange payment by Zelle ({kfReqLabel(sent)} · {kfMoney(sent.price)}).</p></div>
  <div className="kf-card kf-stack g10"><span className="kf-lbl lilac">What happens next</span><p className="kf-body sm">Once payment is confirmed you'll receive your Academy login ID, starting KFA. Enter it on this screen under "Enter Academy ID" to sign in.</p></div>
  <button className="kf-btn ghost" onClick={onBack}>Back to sign in</button></div>;
 return <form className="kf-start kf-buy" onSubmit={send}>
  <div className="kf-stack"><span className="kf-eyebrow" style={{ color: "var(--orchid)" }}>No ID yet</span><h1 className="kf-h1">Join the<br></br><em>academy</em></h1><p className="kf-lead">Six units of reading, video and quizzes. The curriculum our coaches use with every KartFreedom driver.</p></div>
  <KPlans list={kfAcadPlans(db, null)} value={plan} set={setPlan}></KPlans>
  <div className="kf-stack g12">
   <label className="kf-field"><span className="kf-lbl">Driver's full name</span><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="First Last" autoComplete="name"></input></label>
   <label className="kf-field"><span className="kf-lbl">Email</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="you@example.com" autoComplete="email"></input></label>
   <label className="kf-field"><span className="kf-lbl">Phone · for Zelle</span><input type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="(904) 555-0100" autoComplete="tel"></input></label>
   <label className="kf-field"><span className="kf-lbl">Class · optional</span><input value={f.cls} onChange={e => setF({ ...f, cls: e.target.value })} placeholder="Micro, KA100 Jr…"></input></label>
  </div>
  <KHowItWorks who="The team"></KHowItWorks>
  <div className="kf-stack g12"><button className="kf-btn solid" disabled={!ok}>Send request · {kfMoney(db.academy.plans[plan].regular)}</button><button type="button" className="kf-btn ghost" onClick={onBack}>Back to sign in</button></div>
 </form>;
}

Object.assign(window, { kfAdd, kfSt, kfItem, kfReqLabel, kfOpenReq, kfOpenReqs, kfSendReq, kfGrantIn, kfNotify, kfAcadPrice, kfMemPrice, kfPlanL, kfAcadPlans, KPlans, CheckoutView, SubView, GuestBuyView });
