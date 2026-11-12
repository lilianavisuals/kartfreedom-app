const { Stat, VerdictChip, Tag } = window.KartFreedomDesignSystem_a6b48b;

function kfAcademyStats(ctx) {
 const total = KF.allLessons.length, ok = l => (ctx.quiz[l.id] || 0) >= KF.pass.topic, done = KF.allLessons.filter(ok).length;
 const next = KF.allLessons.find(l => !ok(l)), exams = KF.modules.filter(m => (ctx.quiz["exam:" + m.id] || 0) >= KF.pass.exam).length;
 const examDue = !next ? null : null;
 const pendingExam = KF.modules.find(m => m.lessons.every(ok) && (ctx.quiz["exam:" + m.id] || 0) < KF.pass.exam);
 return { total, done, next, exams, pendingExam, pct: Math.round((done + exams) / Math.max(1, total + KF.modules.length) * 100) };
}

function KSecH({ label, children }) {
 return <div className="kf-sech"><span className="kf-lbl">{label}</span><i></i>{children}</div>;
}

function ContinueCard({ ctx }) {
 const a = kfAcademyStats(ctx), P = KF.plans;
 if (!ctx.owns) { const mr = ctx.user.role === "member", exp = !!(ctx.db && ctx.db.owned[ctx.key]); return <div className="kf-card hi kf-cont a-cont">
  <div className="kf-cont-head kf-stack g12"><span className="kf-eyebrow">{exp ? "Academy · access expired" : "KartFreedom Academy" + (mr ? " · member rate" : "")}</span><h2 className="kf-h2">{exp ? <>Renew your<br></br>Academy access</> : <>Learn to race<br></br>the KartFreedom way</>}</h2><p className="kf-body sm">{KF.modules.length} units of reading, video and quizzes. The same curriculum our coaches use.</p></div>
  <div className="kf-stack g8"><div className="kf-price"><b>${mr ? P.monthly.member : P.monthly.regular}</b>{mr && <s>${P.monthly.regular}</s>}<span>per month</span></div><span className="kf-lbl">or ${(mr ? P.yearly.member : P.yearly.regular).toLocaleString()} / year · Zelle</span></div>
  <div className="kf-cont-foot"><button className="kf-btn solid" onClick={() => ctx.push(exp ? { t: "checkout", plan: ctx.db.owned[ctx.key].plan } : { t: "store" })}>{exp ? "Request renewal" : "Explore the Academy"}<KIcon n="right" s={18}></KIcon></button></div>
 </div>; }
 const ex = a.pendingExam, n = a.next, m = n && KF.modules.find(x => x.id === n.m);
 const title = ex ? "Unit " + (KF.modules.indexOf(ex) + 1) + " exam" : n ? n.t : "Course complete";
 const meta = ex ? ex.t + " · " + ex.exam.length + " questions · pass " + KF.pass.exam + "/" + ex.exam.length : n ? "Unit " + (KF.modules.indexOf(m) + 1) + " · " + m.t + " — topic " + (m.lessons.findIndex(l => l.id === n.id) + 1) + " of " + m.lessons.length : "Every unit passed. Your certificate is ready.";
 const go = () => ex ? ctx.push({ t: "quiz", kind: "exam", id: ex.id }) : n ? ctx.push({ t: "lesson", id: n.id }) : ctx.push({ t: "cert" });
 return <div className="kf-card hi kf-cont a-cont">
  <div className="kf-cont-head kf-stack g10"><span className="kf-eyebrow">{n || ex ? "Continue · Academy" : "Academy"}</span><h2 className="kf-h2">{title}</h2><span className="kf-cont-meta">{meta}</span></div>
  <div className="kf-cont-prog"><b>{a.pct}<small>%</small></b><div><KBar v={a.pct} max={100} fluo></KBar><span className="kf-lbl">{a.done}/{a.total} topics · {a.exams}/{KF.modules.length} exams</span></div></div>
  <div className="kf-cont-foot"><button className="kf-btn solid" onClick={go}>{n || ex ? <><KIcon n="play" s={15} fill></KIcon>{ex ? "Start exam" : "Continue"}</> : <><KIcon n="award" s={18}></KIcon>Certificate</>}</button><button className="kf-btn ghost auto" onClick={() => ctx.go("academy")}>Course</button></div>
 </div>;
}
const AcademyMini = ContinueCard;

function HeroPhoto({ user }) {
 const ac = user.type === "academy";
 return <div className="kf-hero a-hero">
  {user.hero ? <div className="kf-duo"><img src={user.hero} alt=""></img></div> : <div className="kf-duo none"><img className="kf-heroletters" src="assets/kf-letters-white.png" alt=""></img></div>}
  <div className="kf-hero-t">
   <span className="kf-eyebrow" style={ac ? { color: "var(--orchid)" } : null}>{ac ? "Academy driver" : "KartFreedom member"}</span>
   <h1 className="kf-h1">{user.name.split(" ").map((w, i) => <React.Fragment key={i}>{i ? <br></br> : null}{w}</React.Fragment>)}</h1>
   <div className="kf-hero-meta"><span>{user.id}</span><span>{user.cls}</span>{user.coach && <span>Coach {user.coach}</span>}</div>
  </div>
 </div>;
}

function kfSplit(v) { const [a, b] = String(v).split("."); return { main: a, decimal: b ? "." + b : "" }; }

function MemberHome({ ctx }) {
 const db = ctx.db, notes = db.notes[ctx.key] || [], n = notes[0], S = db.sessions[ctx.key] || [], best = S[S.length - 1], prev = S[S.length - 2], a = kfAcademyStats(ctx);
 const dl = best && prev ? (+best.best - +prev.best).toFixed(2) : null;
 const coach = db.users[KFDB.EUG];
 return <div className="kf-pad"><div className="kf-home">
  <HeroPhoto user={ctx.user}></HeroPhoto>
  {["expired", "due"].includes(kfBill(ctx.user).st) && <button className={"kf-card kf-dlrow kf-billrow" + (kfBill(ctx.user).st === "expired" ? " bad" : "")} onClick={() => ctx.push({ t: "sub" })}><KIcon n="card"></KIcon><div><b>{kfBill(ctx.user).st === "expired" ? "Membership expired" : "Membership renewal due"}</b><small>{kfOpenReq(ctx.db, ctx.key, "membership") ? "Renewal requested · waiting for Eugene" : kfMoney(kfMemPrice(ctx.db)) + "/yr by Zelle · " + kfBill(ctx.user).label}</small></div><KIcon n="right" s={18}></KIcon></button>}
  <ContinueCard ctx={ctx}></ContinueCard>
  <div className="kf-card kf-stats n3 a-stats">
   <Stat label="Best lap" {...(best ? kfSplit(best.best) : { main: "—", decimal: "" })} unit={best ? "s" : ""}></Stat>
   <Stat label="vs last session" {...(dl ? kfSplit(dl) : { main: "—", decimal: "" })} unit={dl ? "s" : ""}></Stat>
   <Stat label="Academy" main={ctx.owns ? String(a.pct) : "—"} decimal="" unit={ctx.owns ? "%" : ""}></Stat>
  </div>
  <section className="kf-sec a-coach">
   <KSecH label={"Latest from " + ((n && db.users[n.by]) || coach || { name: "your coach" }).name}><button className="kf-link" onClick={() => ctx.push({ t: "coach" })}>All notes · {notes.length}<KIcon n="right" s={14}></KIcon></button></KSecH>
   {n ? <div className={"kf-card kf-note" + (Date.now() - n.at < 864e5 ? " fresh" : "")}>
    <div className="kf-rowb" style={{ width: "100%" }}><VerdictChip label={n.verdict} tone={n.tone}></VerdictChip><span className="kf-lbl">{n.session} · {kfAgo(n.at)}</span></div>
    <p className="kf-body">{n.text}</p>
    {n.focus && n.focus.length > 0 && <><span className="kf-lbl lilac">Focus</span><ul className="kf-focus">{n.focus.map(f => <li key={f}>{f}</li>)}</ul></>}
   </div> : <div className="kf-card kf-empty"><p className="kf-body sm">No coach notes yet. They appear here the moment your coach posts one.</p></div>}
  </section>
  <section className="kf-sec a-next">
   <KSecH label="Next up"><button className="kf-link" onClick={() => ctx.go("progress")}>Progress<KIcon n="right" s={14}></KIcon></button></KSecH>
   <div className="kf-card kf-list">{KF.upcoming.map(u => <div key={u.date} className="kf-li"><span className="kf-date">{u.date.split(" ")[0]}<b>{u.date.split(" ")[1]}</b></span><div><b>{u.title}</b><small>{u.where} · {u.note}</small></div></div>)}</div>
  </section>
 </div></div>;
}

function AcademyHome({ ctx }) {
 const a = kfAcademyStats(ctx), plan = KF.plans[(ctx.owns && ctx.owns.plan) || "yearly"];
 return <div className="kf-pad"><div className="kf-home">
  <HeroPhoto user={ctx.user}></HeroPhoto>
  <ContinueCard ctx={ctx}></ContinueCard>
  <div className="kf-card kf-stats a-stats">
   <Stat label="Topics passed" main={String(a.done)} decimal="" unit={"/" + a.total}></Stat>
   <Stat label="Unit exams" main={String(a.exams)} decimal="" unit={"/" + KF.modules.length}></Stat>
   <Stat label="Course" main={String(a.pct)} decimal="" unit="%"></Stat>
   <Stat label="Plan" main={plan.label} decimal=""></Stat>
  </div>
  <section className="kf-sec a-coach">
   <KSecH label="Units"><button className="kf-link" onClick={() => ctx.go("academy")}>Full course<KIcon n="right" s={14}></KIcon></button></KSecH>
   <div className="kf-card kf-list">{KF.modules.map((m, i) => { const d = m.lessons.filter(l => (ctx.quiz[l.id] || 0) >= KF.pass.topic).length, ex = ctx.quiz["exam:" + m.id]; return <button key={m.id} className="kf-li" onClick={() => ctx.go("academy")}><span className="kf-num">{String(i + 1).padStart(2, "0")}</span><div><b>{m.t}</b><small>{d}/{m.lessons.length} topics{ex != null ? " · exam " + ex + "/" + m.exam.length : ""}</small></div>{ex >= KF.pass.exam ? <span className="kf-tick"><KIcon n="check" s={14}></KIcon></span> : <KIcon n="right" s={18}></KIcon>}</button>; })}</div>
  </section>
  <section className="kf-sec a-next">
   <KSecH label="Member features"></KSecH>
   <div className="kf-card kf-locked">
    {[["coach", "Coach notes after every session"], ["trend", "Skill ratings & lap times"], ["image", "Race-day photo gallery"], ["flag", "Race-day support at the track"]].map(([ic, t]) => <div key={t} className="kf-lockrow" onClick={() => ctx.push({ t: "join" })}><KIcon n={ic} s={18}></KIcon><span>{t}</span><KIcon n="lock" s={15}></KIcon></div>)}
    <button className="kf-btn" onClick={() => ctx.push({ t: "join" })}>Become a member · {kfMoney(kfMemPrice(ctx.db))}/yr</button>
   </div>
  </section>
 </div></div>;
}

function CoachView({ ctx }) {
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Coach notes"></KHeader><div className="kf-scroll"><div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">From your coach</span><h1 className="kf-h1">Coach <em>notes</em></h1></div>
  <div className="kf-stack g12">{(ctx.db.notes[ctx.key] || []).map((n, i) => { const by = ctx.db.users[n.by]; return <div key={n.id} className={"kf-card kf-note" + (i === 0 ? " hi" : "")}>
   <div className="kf-rowb" style={{ width: "100%" }}><span className="kf-lbl">{n.date} · {n.session}</span><span className="kf-lbl">{kfAgo(n.at)}</span></div>
   <VerdictChip label={n.verdict} tone={n.tone}></VerdictChip>
   <p className="kf-body">{n.text}</p>
   {n.focus && n.focus.length > 0 && <ul className="kf-focus">{n.focus.map(f => <li key={f}>{f}</li>)}</ul>}
   <span className="kf-lbl">{by ? by.name : "Coach"}</span>
  </div>; })}</div>
 </div></div></div>;
}

function LapChart({ sessions }) {
 const v = sessions.map(s => +s.best), mn = Math.min(...v) - .1, mx = Math.max(...v) + .1, W = 320, H = 120;
 const pts = v.map((t, i) => [16 + i * (W - 32) / Math.max(1, v.length - 1), 12 + (t - mn) / (mx - mn) * (H - 24)]);
 return <svg viewBox={"0 0 " + W + " " + H} className="kf-chart">
  {[0, .5, 1].map(f => <line key={f} x1="0" x2={W} y1={12 + f * (H - 24)} y2={12 + f * (H - 24)} stroke="rgba(255,255,255,.1)"></line>)}
  <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke="#D7FF3A" strokeWidth="2" strokeLinejoin="round"></polyline>
  {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4.5 : 3} fill={i === pts.length - 1 ? "#D7FF3A" : "#18061F"} stroke="#D7FF3A" strokeWidth="1.5"></circle>)}
 </svg>;
}

function ProgressTab({ ctx }) {
 const db = ctx.db, s = db.sessions[ctx.key] || [], sk = db.skills[ctx.key] || [], setup = db.setup[ctx.key] || [], gain = s.length > 1 ? (+s[0].best - +s[s.length - 1].best).toFixed(3) : null;
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Season 2026</span><h1 className="kf-h1">Your <em>progress</em></h1></div>
  <div className="kf-cols">
  <section className="kf-sec">
   <KSecH label="Best lap trend">{gain && <span className="kf-mono fluo">{gain >= 0 ? "−" : "+"}{Math.abs(gain).toFixed(3)} s</span>}</KSecH>
   {s.length > 1 ? <div className="kf-card"><LapChart sessions={s}></LapChart><div className="kf-rowb kf-axis"><span>{s[0].date}</span><span>↑ Faster</span><span>{s[s.length - 1].date}</span></div></div> : <div className="kf-card kf-empty"><p className="kf-body sm">Your trend appears after two logged sessions.</p></div>}
  </section>
  <section className="kf-sec">
   <KSecH label="Skill ratings"></KSecH>
   <div className="kf-card kf-skills">{!sk.length && <p className="kf-body sm">Your coach hasn't rated you yet.</p>}{sk.map(k => <div key={k.k} className="kf-skill"><div className="kf-rowb"><span>{k.k}</span><span className="kf-mono">{k.v.toFixed(1)}<small className={k.d >= 0 ? "up" : "dn"}>{k.d >= 0 ? "+" : "−"}{Math.abs(k.d).toFixed(1)}</small></span></div><KBar v={k.v} max={10}></KBar></div>)}</div>
  </section>
  <section className="kf-sec">
   <KSecH label="Kart setup log"></KSecH>
   <div className="kf-stack g10">{!setup.length && <div className="kf-card kf-empty"><p className="kf-body sm">No setups logged yet.</p></div>}{setup.map(x => <div key={x.date} className="kf-card kf-setup"><div className="kf-rowb"><span className="kf-lbl">{x.date} · {x.track}</span><KIcon n="wrench" s={16}></KIcon></div><div className="kf-g3"><div><small>Gearing</small><b className="kf-mono">{x.gear}</b></div><div><small>Tyres</small><b className="kf-mono">{x.tyres}</b></div><div><small>Chassis</small><b>{x.chassis}</b></div></div><p className="kf-body sm">{x.note}</p></div>)}</div>
  </section>
  <section className="kf-sec">
   <KSecH label="Sessions"></KSecH>
   <div className="kf-card kf-list">{!s.length && <p className="kf-hint" style={{ padding: "18px 0" }}>No sessions logged.</p>}{[...s].reverse().map((x, i) => <div key={i} className="kf-li"><span className="kf-date">{x.date.split(" ")[0]}<b>{x.date.split(" ")[1]}</b></span><div><b>{x.type}{x.pos ? " · " + x.pos : ""}</b><small>{x.track}</small></div><span className="kf-mono">{x.best}</span></div>)}</div>
  </section>
  </div>
 </div>;
}

function IdView({ ctx }) {
 const [side, setSide] = useStateK("front"), u = ctx.user, ac = u.type === "academy", st = kfStaff(u);
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label={st ? "Staff ID" : ac ? "Academy ID" : "Member ID"}></KHeader>
  <div className="kf-scroll"><div className="kf-pad">
   <div className="kf-idwrap"><div className="kf-stack"><KCard user={u} side={side} onFlip={() => setSide(side === "front" ? "back" : "front")}></KCard>
   <p className="kf-hint">Tap the card to flip. The back can be scanned at the track.</p></div>
   <div className="kf-stack"><div className="kf-card kf-list">
    <div className="kf-li"><div><small>Access level</small><b>{KF.roles[u.role].label}</b></div><VerdictChip label="Active" tone="success"></VerdictChip></div>
    <div className="kf-li"><div><small>{ac ? "Academy no." : "Member no."}</small><b className="kf-mono">{u.id}</b></div></div>
    <div className="kf-li"><div><small>Valid thru</small><b>{u.valid}</b></div></div>
    {!ac && !st && <div className="kf-li"><div><small>Member since</small><b>{u.since}{u.coach ? " · Coach " + u.coach : ""}</b></div></div>}
    {!st && u.role === "member" && <button className="kf-li" onClick={() => ctx.push({ t: "sub" })}><div><small>Membership</small><b>{u.bill && u.bill.due ? "Yearly · " + kfBill(u).label : "Not active"}</b></div><KIcon n="right" s={18}></KIcon></button>}
    {!st && <button className="kf-li" onClick={() => ctx.push({ t: "sub" })}><div><small>Academy</small><b>{ctx.db.owned[ctx.key] ? kfPlanL(ctx.db.owned[ctx.key].plan) + " · " + kfSt(ctx.db.owned[ctx.key].until).label : "Not subscribed"}</b></div><KIcon n="right" s={18}></KIcon></button>}
   </div>
   {u.role === "academy" && <button className="kf-btn" onClick={() => ctx.push({ t: "join" })}>Become a member</button>}
   {KF_LIVE && <button className="kf-btn ghost" onClick={async () => { const p = (prompt("New passcode (" + (st ? 8 : 6) + "+ digits)") || "").replace(/\D/g, ""); if (!p) return; if (p.length < (st ? 8 : 6)) { alert("Too short."); return; } if ((prompt("Repeat the new passcode") || "").replace(/\D/g, "") !== p) { alert("Passcodes didn't match."); return; } try { await KFDB.changePass(p); alert("Passcode changed."); } catch (er) { alert(er.message); } }}><KIcon n="lock" s={18}></KIcon>Change passcode</button>}
   <button className="kf-btn ghost" onClick={ctx.signOut}><KIcon n="out" s={18}></KIcon>Sign out</button></div></div>
  </div></div>
 </div>;
}

function JoinView({ ctx }) {
 const db = useDB(), sent = kfOpenReq(db, ctx.key, "membership"), price = kfMemPrice(db);
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Membership"></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   <div className="kf-stack"><span className="kf-eyebrow">KartFreedom membership</span><h1 className="kf-h1">Race with<br></br><em>the team</em></h1><p className="kf-lead">Membership adds a coach, race-day support and your progress tracked every session. You keep full Academy access.</p></div>
   <div className="kf-card hi kf-stack g10"><span className="kf-lbl lilac">Membership · Yearly</span><div className="kf-price"><b>{kfMoney(price)}</b><span>per year</span></div><small className="kf-body sm">Paid by Zelle · renewed once a year by the team</small></div>
   <div className="kf-card kf-list">{[["Coach notes", "After every practice and race"], ["Progress tracking", "Skill ratings and lap times"], ["Race-day support", "At the track, all weekend"], ["Photo gallery", "Every event, in your app"], ["Member ID card", "Physical card with speed code"]].map(([a, b]) => <div key={a} className="kf-li"><span className="kf-tick"><KIcon n="check" s={14}></KIcon></span><div><b>{a}</b><small>{b}</small></div></div>)}</div>
   {sent ? <KReqSent ctx={ctx} r={sent}></KReqSent> : <><KHowItWorks></KHowItWorks><button className="kf-btn solid" onClick={() => kfSendReq(ctx.key, "membership", "yearly", false)}>Request membership · {kfMoney(price)}/yr</button></>}
  </div></div>
 </div>;
}

Object.assign(window, { AcademyMini, ContinueCard, KSecH, HeroPhoto, MemberHome, AcademyHome, CoachView, ProgressTab, IdView, JoinView, kfAcademyStats });
