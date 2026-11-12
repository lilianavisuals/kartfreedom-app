const kfMoney = n => "$" + n.toLocaleString("en-US");
const kfPrice = (ctx, pl) => ctx.user.type === "member" ? KF.plans[pl].member : KF.plans[pl].regular;

function kfWorksheet(l, user) {
 const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${l.worksheet}</title><style>body{font:14px/1.6 Montserrat,Arial,sans-serif;max-width:680px;margin:40px auto;color:#18061F}h1{font-size:22px;text-transform:uppercase;letter-spacing:.04em}small{letter-spacing:.24em;text-transform:uppercase;color:#702F8E}li{margin:6px 0}.ln{border-bottom:1px solid #ccc;height:30px}</style></head><body><small>KartFreedom Academy · ${l.mt}</small><h1>${l.t}</h1><p>Driver: ${user.name} · ${user.id}</p><h3>Key points</h3><ol>${l.pts.map(p => "<li>" + p + "</li>").join("")}</ol><h3>On track: what I'll try</h3>${"<div class=ln></div>".repeat(4)}<h3>After the session: what happened</h3>${"<div class=ln></div>".repeat(4)}</body></html>`;
 const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = "KF Academy - " + l.t + ".html"; document.body.appendChild(a); a.click(); a.remove();
}

function PlanPicker({ ctx, plan, setPlan }) {
 const mem = ctx.user.type === "member";
 return <div className="kf-plans">{Object.entries(KF.plans).map(([k, p]) => { const pr = kfPrice(ctx, k), save = k === "yearly" ? kfPrice(ctx, "monthly") * 12 - pr : 0;
  return <button key={k} className={"kf-plan" + (plan === k ? " on" : "")} onClick={() => setPlan(k)}>
   <span className="kf-radio"></span>
   <div><b>{p.label}</b><small>{save ? "Save " + kfMoney(save) + " a year" : "Cancel any time"}</small></div>
   <div className="kf-plan-p"><b className="kf-mono">{kfMoney(pr)}</b><small>/{p.per}{mem ? " · was " + kfMoney(p.regular) : ""}</small></div>
  </button>; })}</div>;
}

function StoreView({ ctx }) {
 const [plan, setPlan] = useStateK("yearly"), mem = ctx.user.type === "member", tq = KF.allLessons.length;
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Academy"></KHeader>
  <div className="kf-scroll"><div className="kf-pad">
   <div className="kf-stack"><span className="kf-eyebrow">KartFreedom Academy</span><h1 className="kf-h1">Learn to<br></br><em>race</em></h1>
    <p className="kf-lead">The curriculum our coaches use with every KartFreedom driver. Read, watch, quiz, then prove it in each unit exam.</p></div>
   <div className="kf-card kf-incl">{[[KF.modules.length, "units"], [tq, "topics"], [tq + KF.modules.length, "quizzes"]].map(([a, b]) => <div key={b}><b className="kf-mono">{a}</b><span className="kf-lbl">{b}</span></div>)}</div>
   <div className="kf-card kf-list">{[["book", "Written topics + video lessons"], ["check", "Quiz after every topic"], ["award", "Unit exams and a completion certificate"], ["dl", "Downloadable worksheets"], ["chat", "Academy chat with other drivers"]].map(([i, t]) => <div key={t} className="kf-li"><KIcon n={i} s={18}></KIcon><div><b>{t}</b></div></div>)}</div>
   <div className="kf-stack g10"><span className="kf-lbl">{mem ? "Member pricing" : "Choose a plan"}</span><PlanPicker ctx={ctx} plan={plan} setPlan={setPlan}></PlanPicker></div>
   <button className="kf-btn solid" onClick={() => ctx.push({ t: "checkout", plan })}>Continue · {kfMoney(kfPrice(ctx, plan))}/{KF.plans[plan].per}</button>
  </div></div>
 </div>;
}

function CourseTab({ ctx }) {
 const a = kfAcademyStats(ctx), [open, setOpen] = useStateK(() => (a.next || {}).m || "m1");
 const examsOk = KF.modules.every(m => (ctx.quiz["exam:" + m.id] || 0) >= KF.pass.exam);
 if (!ctx.owns) return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">KartFreedom Academy</span><h1 className="kf-h1">Learn to <em>race</em></h1></div>
  <div className="kf-course"><div className="kf-course-side"><AcademyMini ctx={ctx}></AcademyMini></div>
  <div className="kf-card kf-list">{KF.modules.map((m, i) => <div key={m.id} className="kf-li"><span className="kf-num">{String(i + 1).padStart(2, "0")}</span><div><b>{m.t}</b><small>{m.lessons.length} topics · unit exam</small></div><KIcon n="lock" s={16}></KIcon></div>)}</div></div>
 </div>;
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">KartFreedom Academy · {a.pct}% complete</span><h1 className="kf-h1">The <em>course</em></h1></div>
  <div className="kf-course"><div className="kf-course-side kf-stack g12"><AcademyMini ctx={ctx}></AcademyMini>
  <button className={"kf-card kf-certrow" + (examsOk ? " hi" : "")} disabled={!examsOk} onClick={() => ctx.push({ t: "cert" })}><KIcon n={examsOk ? "award" : "lock"}></KIcon><div><b>Certificate</b><small>{examsOk ? "Ready to view" : "Pass every unit exam to unlock"}</small></div></button></div>
  <div className="kf-stack g12">{KF.modules.map((m, i) => { const d = m.lessons.filter(l => (ctx.quiz[l.id] || 0) >= KF.pass.topic).length, ex = ctx.quiz["exam:" + m.id], isO = open === m.id, exOpen = d === m.lessons.length, exOk = ex >= KF.pass.exam;
   return <div key={m.id} className={"kf-card kf-mod" + (isO ? " open" : "")}>
    <button className="kf-modh" onClick={() => setOpen(isO ? null : m.id)}><span className="kf-num">{String(i + 1).padStart(2, "0")}</span><div><b>{m.t}</b><small>{d}/{m.lessons.length} topics{ex != null ? " · exam " + ex + "/" + m.exam.length : ""}</small></div>{exOk ? <span className="kf-tick"><KIcon n="check" s={14}></KIcon></span> : <span className="kf-chev"><KIcon n="right" s={18}></KIcon></span>}</button>
    {isO && <div className="kf-modb">
     {m.lessons.map((l, k) => { const sc = ctx.quiz[l.id], ok = sc >= KF.pass.topic; return <button key={l.id} className="kf-les" onClick={() => ctx.push({ t: "lesson", id: l.id })}><span className={"kf-dot" + (ok ? " on" : "")}>{ok ? <KIcon n="check" s={12}></KIcon> : null}</span><span>{k + 1}. {l.t}</span><small>{sc != null ? "quiz " + sc + "/" + l.quiz.length : l.min + " min"}</small></button>; })}
     <button className="kf-les quiz" disabled={!exOpen} onClick={() => ctx.push({ t: "quiz", kind: "exam", id: m.id })}><span className={"kf-dot" + (exOk ? " on" : "")}>{exOk ? <KIcon n="check" s={12}></KIcon> : exOpen ? null : <KIcon n="lock" s={11}></KIcon>}</span><span>Unit exam</span><small>{ex != null ? ex + "/" + m.exam.length : exOpen ? m.exam.length + " questions" : "Pass all topics"}</small></button>
    </div>}
   </div>; })}</div></div>
 </div>;
}

function LessonView({ id, ctx }) {
 const l = KF.allLessons.find(x => x.id === id), m = l && KF.modules.find(x => x.id === l.m), sc = ctx.quiz[id];
 if (!l) return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Academy"></KHeader><p className="kf-hint">This topic was removed.</p></div>;
 const nq = (l.quiz || []).length;
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label={"Unit " + (KF.modules.indexOf(m) + 1) + " · " + m.t} right={<span className="kf-hdr-k">{m.lessons.indexOf(l) + 1} / {m.lessons.length}</span>}></KHeader>
  <div className="kf-scroll" key={id}><div className="kf-pad narrow">
   {l.video ? <KMedia m={l.video} className="kf-video vid" controls key={l.video.blob || l.video.src}></KMedia> : <div className="kf-video"><span className="kf-play lg"><KIcon n="play" s={22} fill></KIcon></span><span className="kf-lbl">Video lesson · {l.min} min</span></div>}
   <div className="kf-stack g10"><div className="kf-row"><Tag label={"Topic " + (m.lessons.indexOf(l) + 1)}></Tag>{sc >= KF.pass.topic && <VerdictChip label={"Quiz passed · " + sc + "/" + nq} tone="success"></VerdictChip>}</div><h2 className="kf-h2">{l.t}</h2></div>
   {l.body.map((p, i) => <p key={i} className="kf-body">{p}</p>)}
   <div className="kf-card hi kf-stack g10"><span className="kf-lbl lilac">Key points</span><ul className="kf-focus">{l.pts.map(p => <li key={p}>{p}</li>)}</ul></div>
   <button className="kf-card kf-dlrow" onClick={() => kfWorksheet(l, ctx.user)}><KIcon n="dl"></KIcon><div><b>{l.worksheet}</b><small>Printable · key points + session notes</small></div></button>
   {nq > 0 && <button className="kf-btn solid" onClick={() => { ctx.set({ done: { ...ctx.s.done, [ctx.key]: { ...ctx.done, [id]: 1 } } }); ctx.replace({ t: "quiz", kind: "topic", id }); }}>{sc != null ? "Retake topic quiz" : "Take topic quiz · " + nq + " questions"}<KIcon n="right" s={18}></KIcon></button>}
  </div></div>
 </div>;
}

function QuizView({ kind, id, ctx }) {
 const isEx = kind === "exam", m = isEx ? KF.modules.find(x => x.id === id) : KF.modules.find(x => x.lessons.some(l => l.id === id));
 const l = isEx || !m ? null : m.lessons.find(x => x.id === id), qs = (isEx ? m && m.exam : l && l.quiz) || [], need = Math.min(isEx ? KF.pass.exam : KF.pass.topic, qs.length), sk = isEx ? "exam:" + id : id;
 const [i, setI] = useStateK(0), [pick, setPick] = useStateK(null), [score, setScore] = useStateK(0), [end, setEnd] = useStateK(false);
 if (!qs.length) return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Quiz"></KHeader><div className="kf-pad narrow"><div className="kf-card kf-empty"><p className="kf-body sm">No questions yet.</p></div></div></div>;
 const q = qs[i];
 const next = () => { const s = score + (pick === q[2] ? 1 : 0); setScore(s); setPick(null);
  if (i + 1 < qs.length) setI(i + 1); else { setEnd(true); ctx.set({ quiz: { ...ctx.s.quiz, [ctx.key]: { ...ctx.quiz, [sk]: Math.max(s, ctx.quiz[sk] || 0) } } }); } };
 const retry = () => { setI(0); setScore(0); setPick(null); setEnd(false); };
 const pass = score >= need, li = l ? m.lessons.indexOf(l) : -1, nextL = l && m.lessons[li + 1], nextM = KF.modules[KF.modules.indexOf(m) + 1];
 const after = !pass ? <button className="kf-btn solid" onClick={retry}>Retry</button>
  : !isEx ? (nextL ? <button className="kf-btn solid" onClick={() => ctx.replace({ t: "lesson", id: nextL.id })}>Next topic · {nextL.t}<KIcon n="right" s={18}></KIcon></button>
   : <button className="kf-btn solid" onClick={() => ctx.replace({ t: "quiz", kind: "exam", id: m.id })}>Take the unit exam<KIcon n="right" s={18}></KIcon></button>)
  : nextM ? <button className="kf-btn solid" onClick={() => ctx.replace({ t: "lesson", id: nextM.lessons[0].id })}>Start Unit {KF.modules.indexOf(nextM) + 1} · {nextM.t}<KIcon n="right" s={18}></KIcon></button>
   : <button className="kf-btn solid" onClick={() => ctx.replace({ t: "cert" })}><KIcon n="award" s={18}></KIcon>View certificate</button>;
 const ttl = isEx ? "Unit " + (KF.modules.indexOf(m) + 1) + " exam" : "Topic quiz";
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label={ttl} right={!end && <span className="kf-hdr-k">{i + 1} / {qs.length}</span>}></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   {!end ? <>
    <KBar v={i + (pick != null ? 1 : 0)} max={qs.length} fluo></KBar>
    <span className="kf-lbl">{(isEx ? m.t : l.t) + " · pass " + need + "/" + qs.length}</span>
    <h2 className="kf-h2 q">{q[0]}</h2>
    <div className="kf-stack g10">{q[1].map((o, k) => { const st = pick == null ? "" : k === q[2] ? " right" : k === pick ? " wrong" : " dim";
     return <button key={k} className={"kf-opt" + st} disabled={pick != null} onClick={() => setPick(k)}><span>{String.fromCharCode(65 + k)}</span>{o}</button>; })}</div>
    {pick != null && <button className="kf-btn solid" onClick={next}>{i + 1 < qs.length ? "Next question" : "See result"}</button>}
   </> : <>
    <div className="kf-stack"><span className={"kf-ok" + (pass ? "" : " bad")}><i></i>{pass ? "Passed" : "Not yet"}</span><h1 className="kf-h1">{score} / {qs.length}<br></br><em>{pass ? "correct" : "try again"}</em></h1>
     <p className="kf-lead">{pass ? (isEx ? "Unit " + (KF.modules.indexOf(m) + 1) + " complete." : "Topic complete.") : "Pass mark is " + need + " of " + qs.length + ". Review the key points and try again."}</p></div>
    {after}
    <button className="kf-btn ghost" onClick={() => { ctx.reset(); ctx.go("academy"); }}>Back to course</button>
   </>}
  </div></div>
 </div>;
}

function CertView({ ctx }) {
 const ok = KF.modules.every(m => (ctx.quiz["exam:" + m.id] || 0) >= KF.pass.exam);
 const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
 return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Certificate"></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   {ok ? <div className="kf-cert">
    <img src="assets/kf-mark.png" alt=""></img>
    <span className="kf-lbl">Certificate of completion</span>
    <h2 className="kf-h2">{ctx.user.name}</h2><i></i>
    <p className="kf-body">has completed every unit of the KartFreedom Academy curriculum.</p>
    <div className="kf-g2"><div><span className="kf-lbl">Date</span><b>{d}</b></div><div><span className="kf-lbl">ID</span><b className="kf-mono">{ctx.user.id}</b></div></div>
   </div> : <div className="kf-card kf-stack g10"><span className="kf-lbl">Locked</span><p className="kf-body">Pass all {KF.modules.length} unit exams to unlock your certificate.</p></div>}
  </div></div>
 </div>;
}

Object.assign(window, { StoreView, CourseTab, LessonView, QuizView, CertView });
