// Academy editor: units, topics, video, key points, quizzes, exams, pass marks and pricing. Live for every driver on save.
const kfAcUp = fn => KFDB.update(d => fn(d.academy));
const kfMv = (arr, i, dir) => { const j = i + dir; if (i < 0 || j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
const kfFindL = (a, id) => { for (const m of a.modules) { const i = m.lessons.findIndex(l => l.id === id); if (i > -1) return { m, i, l: m.lessons[i] }; } return null; };

function KDraft({ value, onSave, placeholder, className, type, multi, rows }) {
 const [v, setV] = useStateK(value ?? ""), [foc, setFoc] = useStateK(false);
 useEffectK(() => { if (!foc) setV(value ?? ""); }, [value]);
 const done = () => { setFoc(false); if (String(v) !== String(value ?? "")) onSave(v); };
 const p = { className: "kf-draft " + (className || ""), value: v, placeholder, onFocus: () => setFoc(true), onBlur: done, onChange: e => setV(e.target.value) };
 return multi ? <textarea rows={rows || 3} {...p}></textarea> : <input type={type || "text"} {...p} onKeyDown={e => e.key === "Enter" && e.target.blur()}></input>;
}

function KTools({ up, down, del, label }) {
 return <div className="kf-edtools">
  <button type="button" className="kf-step" disabled={!up} onClick={up} aria-label={"Move " + label + " up"}><KIcon n="au" s={14}></KIcon></button>
  <button type="button" className="kf-step" disabled={!down} onClick={down} aria-label={"Move " + label + " down"}><KIcon n="ad" s={14}></KIcon></button>
  <button type="button" className="kf-step" onClick={del} aria-label={"Delete " + label}><KIcon n="trash" s={14}></KIcon></button>
 </div>;
}

function AcademyTab({ ctx }) {
 const [mode, setMode] = useStateK("edit");
 if (!kfCan(ctx.user, "academy:edit")) return <CourseTab ctx={ctx}></CourseTab>;
 return <>
  <div className="kf-pad kf-modebar"><div className="kf-seg">{[["edit", "Edit"], ["preview", "Driver view"]].map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>)}</div></div>
  {mode === "edit" ? <AcademyEditor ctx={ctx}></AcademyEditor> : <CourseTab ctx={ctx}></CourseTab>}
 </>;
}

function AcademyEditor({ ctx }) {
 const db = useDB(), A = db.academy, mods = A.modules;
 const nQ = mods.reduce((s, m) => s + m.lessons.reduce((x, l) => x + (l.quiz || []).length, 0) + (m.exam || []).length, 0);
 const addUnit = () => kfAcUp(a => a.modules.push({ id: "m" + KFDB.uid(), t: "New unit", sub: "", lessons: [], exam: [] }));
 const addTopic = mid => { const id = "l" + KFDB.uid(); kfAcUp(a => { const m = a.modules.find(x => x.id === mid); m && m.lessons.push({ id, t: "New topic", min: 5, body: [], pts: [], quiz: [], worksheet: "New topic worksheet" }); }); ctx.push({ t: "topicedit", id }); };
 const setM = (mid, p) => kfAcUp(a => { const m = a.modules.find(x => x.id === mid); if (m) Object.assign(m, p); });
 const num = (path, v) => { const n = Math.max(0, Math.round(+v || 0)); kfAcUp(a => { const [k1, k2, k3] = path; if (k3) a[k1][k2][k3] = n; else a[k1][k2] = n; }); };
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Academy editor · saves live to every driver</span><h1 className="kf-h1">Edit the <em>academy</em></h1></div>
  <div className="kf-card kf-stats n3"><Stat label="Units" main={String(mods.length)} decimal=""></Stat><Stat label="Topics" main={String(KF.allLessons.length)} decimal=""></Stat><Stat label="Questions" main={String(nQ)} decimal=""></Stat></div>
  <div className="kf-edgrid">
   <section className="kf-sec"><KSecH label="Pass marks · correct answers"></KSecH>
    <div className="kf-card kf-g2">
     <label className="kf-field"><span className="kf-lbl">Topic quiz</span><KDraft type="number" value={A.pass.topic} onSave={v => num(["pass", "topic"], v)}></KDraft></label>
     <label className="kf-field"><span className="kf-lbl">Unit exam</span><KDraft type="number" value={A.pass.exam} onSave={v => num(["pass", "exam"], v)}></KDraft></label>
    </div></section>
   <section className="kf-sec"><KSecH label="Academy pricing · USD"></KSecH>
    <div className="kf-card kf-g2">{["monthly", "yearly"].flatMap(p => [["regular", "Regular"], ["member", "Member"]].map(([k, l]) => <label key={p + k} className="kf-field"><span className="kf-lbl">{A.plans[p].label} · {l}</span><KDraft type="number" value={A.plans[p][k]} onSave={v => num(["plans", p, k], v)}></KDraft></label>))}</div></section>
  </div>
  <section className="kf-sec"><KSecH label="Units & topics"><button className="kf-link" onClick={addUnit}><KIcon n="plus" s={14}></KIcon>Add unit</button></KSecH>
   <div className="kf-stack g12">{mods.map((m, mi) => <div key={m.id} className="kf-card kf-edunit">
    <div className="kf-edunit-h"><span className="kf-num">{String(mi + 1).padStart(2, "0")}</span>
     <div className="kf-stack g8 kf-grow"><KDraft className="t" value={m.t} placeholder="Unit title" onSave={v => setM(m.id, { t: v.trim() || "Untitled unit" })}></KDraft><KDraft value={m.sub} placeholder="Short description" onSave={v => setM(m.id, { sub: v })}></KDraft></div>
     <KTools label="unit" up={mi > 0 ? () => kfAcUp(a => kfMv(a.modules, a.modules.findIndex(x => x.id === m.id), -1)) : null} down={mi < mods.length - 1 ? () => kfAcUp(a => kfMv(a.modules, a.modules.findIndex(x => x.id === m.id), 1)) : null} del={() => confirm("Delete unit “" + m.t + "” and its " + m.lessons.length + " topics?") && kfAcUp(a => { a.modules = a.modules.filter(x => x.id !== m.id); })}></KTools></div>
    <div className="kf-edlist">
     {m.lessons.map((l, k) => <div key={l.id} className="kf-edrow"><span className="kf-num">{k + 1}</span>
      <button className="kf-edrow-m" onClick={() => ctx.push({ t: "topicedit", id: l.id })}><b>{l.t}</b><small>{l.min} min · {(l.quiz || []).length} questions{l.video ? " · video" : ""}</small></button>
      <KTools label="topic" up={k > 0 ? () => kfAcUp(a => { const f = kfFindL(a, l.id); kfMv(f.m.lessons, f.i, -1); }) : null} down={k < m.lessons.length - 1 ? () => kfAcUp(a => { const f = kfFindL(a, l.id); kfMv(f.m.lessons, f.i, 1); }) : null} del={() => confirm("Delete topic “" + l.t + "”?") && kfAcUp(a => { const f = kfFindL(a, l.id); f.m.lessons.splice(f.i, 1); })}></KTools></div>)}
     <div className="kf-edrow ex"><span className="kf-num"><KIcon n="award" s={16}></KIcon></span><button className="kf-edrow-m" onClick={() => ctx.push({ t: "examedit", id: m.id })}><b>Unit exam</b><small>{(m.exam || []).length} questions · pass {A.pass.exam}</small></button><KIcon n="right" s={18}></KIcon></div>
    </div>
    <button className="kf-btn ghost auto sm" onClick={() => addTopic(m.id)}><KIcon n="plus" s={14}></KIcon>Add topic</button>
   </div>)}</div>
   <button className="kf-btn solid" onClick={addUnit}><KIcon n="plus" s={16}></KIcon>Add unit</button>
  </section>
  <button className="kf-link" style={{ alignSelf: "flex-start" }} onClick={() => confirm("Restore the original curriculum? Your edits to units, topics and quizzes will be replaced.") && kfAcUp(a => { const o = JSON.parse(JSON.stringify(KFDB.AC0)); a.modules = o.modules; a.pass = o.pass; a.plans = o.plans; })}>Restore original curriculum</button>
 </div>;
}

function QuizEditor({ qs, setQs, need, label }) {
 const ch = (i, fn) => setQs(qs.map((q, k) => { if (k !== i) return q; const c = [q[0], [...q[1]], q[2]]; fn(c); return c; }));
 const mv = (i, d) => { const x = [...qs]; kfMv(x, i, d); setQs(x); };
 return <section className="kf-sec"><KSecH label={label + " · " + qs.length + " questions"}><button type="button" className="kf-link" onClick={() => setQs([...qs, ["", ["", ""], 0]])}><KIcon n="plus" s={14}></KIcon>Add question</button></KSecH>
  {qs.length < need && <p className="kf-warn">Pass mark is {need}. Add at least {need} questions or lower the pass mark in the editor.</p>}
  <div className="kf-stack g12">{qs.map((q, i) => <div key={i} className="kf-card kf-q">
   <div className="kf-rowb"><span className="kf-lbl lilac">Question {i + 1}</span><KTools label="question" up={i > 0 ? () => mv(i, -1) : null} down={i < qs.length - 1 ? () => mv(i, 1) : null} del={() => setQs(qs.filter((_, k) => k !== i))}></KTools></div>
   <label className="kf-field"><textarea rows="2" value={q[0]} placeholder="Type the question" onChange={e => ch(i, c => { c[0] = e.target.value; })}></textarea></label>
   <div className="kf-stack g8">{q[1].map((o, k) => <div key={k} className={"kf-qopt" + (q[2] === k ? " on" : "")}>
    <button type="button" className="kf-qmark" onClick={() => ch(i, c => { c[2] = k; })} aria-label="Mark correct">{q[2] === k ? <KIcon n="check" s={14}></KIcon> : String.fromCharCode(65 + k)}</button>
    <input value={o} placeholder={"Answer " + String.fromCharCode(65 + k)} onChange={e => ch(i, c => { c[1][k] = e.target.value; })}></input>
    <button type="button" className="kf-icbtn sm" disabled={q[1].length <= 2} onClick={() => ch(i, c => { c[1].splice(k, 1); if (c[2] === k) c[2] = 0; else if (c[2] > k) c[2]--; })} aria-label="Remove answer"><KIcon n="x" s={16}></KIcon></button></div>)}</div>
   <div className="kf-rowb">{q[1].length < 6 ? <button type="button" className="kf-link" onClick={() => ch(i, c => { c[1].push(""); })}><KIcon n="plus" s={14}></KIcon>Add answer</button> : <span></span>}<span className="kf-lbl">Tap a letter to set the right answer</span></div>
  </div>)}</div>
  {!qs.length && <div className="kf-card kf-empty"><p className="kf-body sm">No questions yet.</p></div>}
  <button type="button" className="kf-btn ghost" onClick={() => setQs([...qs, ["", ["", ""], 0]])}><KIcon n="plus" s={16}></KIcon>Add question</button>
 </section>;
}

const kfCleanQs = qs => qs.filter(q => q[0].trim()).map(q => { const o = q[1].map(x => x.trim()), right = o[q[2]]; const opts = o.filter(Boolean); return [q[0].trim(), opts, Math.max(0, opts.indexOf(right))]; }).filter(q => q[1].length >= 2);

function KSaveBar({ dirty, saved, onSave, onBack }) {
 return <div className="kf-savebar"><span className="kf-lbl">{saved ? "Saved · live for drivers" : dirty ? "Unsaved changes" : "No changes"}</span><span className="kf-grow"></span><button className="kf-btn ghost auto sm" onClick={onBack}>Close</button><button className="kf-btn solid auto sm" disabled={!dirty} onClick={onSave}>Save</button></div>;
}

function TopicEditView({ ctx, id }) {
 const db = useDB(), A = db.academy, f0 = kfFindL(A, id);
 const init = () => f0 ? { t: f0.l.t, min: f0.l.min, body: (f0.l.body || []).join("\n\n"), pts: (f0.l.pts || []).join("\n"), quiz: JSON.parse(JSON.stringify(f0.l.quiz || [])), video: f0.l.video || null, mid: f0.m.id } : null;
 const [f, setF] = useStateK(init), [orig, setOrig] = useStateK(() => JSON.stringify(init())), [saved, setSaved] = useStateK(false), [busy, setBusy] = useStateK(false);
 if (!f0 || !f) return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Edit topic"></KHeader><p className="kf-hint">Topic not found.</p></div>;
 const dirty = JSON.stringify(f) !== orig, S = p => { setF({ ...f, ...p }); setSaved(false); };
 const save = () => { const quiz = kfCleanQs(f.quiz), t = f.t.trim() || "Untitled topic";
  kfAcUp(a => { const x = kfFindL(a, id); if (!x) return; const L = Object.assign(x.l, { t, min: Math.max(1, +f.min || 1), body: f.body.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean), pts: f.pts.split("\n").map(s => s.trim()).filter(Boolean), quiz, video: f.video || undefined, worksheet: t + " worksheet" });
   if (f.mid !== x.m.id) { x.m.lessons.splice(x.i, 1); const to = a.modules.find(m => m.id === f.mid); if (to) to.lessons.push(L); } });
  const nf = { ...f, t, quiz }; setF(nf); setOrig(JSON.stringify(nf)); setSaved(true); };
 const back = () => (!dirty || confirm("Discard unsaved changes?")) && ctx.pop();
 const vid = async () => { const [file] = await kfPick("video/*"); if (!file) return; setBusy(true); const blob = await KFDB.putBlob(file); setBusy(false); S({ video: { blob, kind: "video", name: file.name } }); };
 return <div className="kf-screen"><KHeader onBack={back} label="Edit topic" right={<span className="kf-hdr-k">{f0.m.t}</span>}></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   <div className="kf-stack g8"><span className="kf-eyebrow">Topic editor</span><h1 className="kf-h1">{f.t || "Untitled"}</h1></div>
   <div className="kf-card kf-stack g12">
    <label className="kf-field"><span className="kf-lbl">Title</span><input value={f.t} onChange={e => S({ t: e.target.value })}></input></label>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Length · minutes</span><input type="number" value={f.min} onChange={e => S({ min: e.target.value })}></input></label>
     <label className="kf-field"><span className="kf-lbl">Unit</span><span className="kf-select"><select value={f.mid} onChange={e => S({ mid: e.target.value })}>{A.modules.map((m, i) => <option key={m.id} value={m.id}>{i + 1}. {m.t}</option>)}</select></span></label></div>
   </div>
   <section className="kf-sec"><KSecH label="Video lesson"></KSecH>
    {f.video ? <div className="kf-stack g10"><KMedia m={f.video} className="kf-video vid" controls key={f.video.blob || f.video.src}></KMedia><div className="kf-row"><button className="kf-btn ghost auto sm" onClick={vid} disabled={busy}><KIcon n="up" s={16}></KIcon>Replace</button><button className="kf-btn ghost auto sm" onClick={() => S({ video: null })}><KIcon n="trash" s={16}></KIcon>Remove</button></div></div>
     : <button className="kf-card kf-dlrow" onClick={vid} disabled={busy}><KIcon n="video"></KIcon><div><b>{busy ? "Uploading…" : "Upload a video"}</b><small>MP4 or MOV · plays at the top of the topic</small></div></button>}
   </section>
   <section className="kf-sec"><KSecH label="Lesson text"></KSecH>
    <label className="kf-field"><span className="kf-lbl">Body · blank line between paragraphs</span><textarea rows="8" value={f.body} onChange={e => S({ body: e.target.value })}></textarea></label>
    <label className="kf-field"><span className="kf-lbl">Key points · one per line</span><textarea rows="4" value={f.pts} onChange={e => S({ pts: e.target.value })}></textarea></label>
   </section>
   <QuizEditor qs={f.quiz} setQs={quiz => S({ quiz })} need={A.pass.topic} label="Topic quiz"></QuizEditor>
  </div></div>
  <KSaveBar dirty={dirty} saved={saved} onSave={save} onBack={back}></KSaveBar>
 </div>;
}

function ExamEditView({ ctx, id }) {
 const db = useDB(), A = db.academy, m = A.modules.find(x => x.id === id);
 const [qs, setQs] = useStateK(() => JSON.parse(JSON.stringify((m && m.exam) || []))), [orig, setOrig] = useStateK(() => JSON.stringify((m && m.exam) || [])), [saved, setSaved] = useStateK(false);
 if (!m) return <div className="kf-screen"><KHeader onBack={ctx.pop} label="Unit exam"></KHeader><p className="kf-hint">Unit not found.</p></div>;
 const dirty = JSON.stringify(qs) !== orig, S = x => { setQs(x); setSaved(false); };
 const save = () => { const c = kfCleanQs(qs); kfAcUp(a => { const x = a.modules.find(y => y.id === id); if (x) x.exam = c; }); setQs(c); setOrig(JSON.stringify(c)); setSaved(true); };
 const back = () => (!dirty || confirm("Discard unsaved changes?")) && ctx.pop();
 const pull = () => { const all = m.lessons.flatMap(l => l.quiz || []).map(q => JSON.parse(JSON.stringify(q))); for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } S(all.slice(0, 10)); };
 return <div className="kf-screen"><KHeader onBack={back} label="Edit unit exam" right={<span className="kf-hdr-k">Unit {A.modules.indexOf(m) + 1}</span>}></KHeader>
  <div className="kf-scroll"><div className="kf-pad narrow">
   <div className="kf-stack g8"><span className="kf-eyebrow">Unit exam · pass {A.pass.exam}</span><h1 className="kf-h1">{m.t}</h1></div>
   <button className="kf-card kf-dlrow" onClick={() => (!qs.length || confirm("Replace these questions with 10 drawn from this unit's topic quizzes?")) && pull()}><KIcon n="book"></KIcon><div><b>Build from topic quizzes</b><small>Draws up to 10 questions from this unit's topics</small></div></button>
   <QuizEditor qs={qs} setQs={S} need={A.pass.exam} label="Exam"></QuizEditor>
  </div></div>
  <KSaveBar dirty={dirty} saved={saved} onSave={save} onBack={back}></KSaveBar>
 </div>;
}

Object.assign(window, { AcademyTab, AcademyEditor, TopicEditView, ExamEditView, QuizEditor, KDraft, KTools });
