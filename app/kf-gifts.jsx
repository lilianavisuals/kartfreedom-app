// Gift certificates · Arrive & Drive. Create, number, download (print → PDF) and track use.
const kfGLabel = p => { const x = KF.gifts[p]; return x ? x.eng + " · " + x.st + " · " + x.d + " training day" + (x.d > 1 ? "s" : "") : "—"; };
const kfGToday = () => new Date().toLocaleDateString("en-CA");
const kfGDate = s => s ? new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const kfGNo = (y, n) => "KF-GC-" + y + "-" + String(n).padStart(3, "0");
const kfGNext = (db, y) => Math.max(0, ...(db.gifts || []).filter(g => g.year === y).map(g => g.seq || 0)) + 1;
const kfGState = g => { const n = (KF.gifts[g.pkg] || { d: 1 }).d, u = (g.days || []).filter(Boolean).length; return u === 0 ? "unused" : u >= n ? "used" : "partial"; };
const kfGStateL = g => { const s = kfGState(g), n = KF.gifts[g.pkg].d; return s === "unused" ? "Unused" : s === "used" ? "Used" : (g.days || []).filter(Boolean).length + " of " + n + " used"; };
const kfGURL = (g, mode) => "gift-cert.html?" + mode + "#" + encodeURIComponent(JSON.stringify({ no: g.no, pkg: g.pkg, ed: g.ed, to: g.to, from: g.from, issued: kfGDate(g.issued) }));
const kfGFrame = (url, fn) => { const fr = document.createElement("iframe"); fr.style.cssText = "position:fixed;left:-12000px;top:0;width:1000px;height:800px;border:0"; fr.src = url; fr.onload = () => setTimeout(() => fn(fr.contentWindow, () => setTimeout(() => fr.remove(), 60000)), 300); document.body.appendChild(fr); };
const kfGDl = (u, n) => { const a = document.createElement("a"); a.href = u; a.download = n; document.body.appendChild(a); a.click(); a.remove(); };
const kfGOut = (g, m) => kfGFrame(kfGURL(g, "view"), async (w, done) => { try { if (m === "png") { const fs = await w.kfPNG(); for (const x of fs) { kfGDl(x.url, x.name); await new Promise(r => setTimeout(r, 500)); } } else { await w.document.fonts.ready; w.focus(); w.print(); } } catch (e) { alert("Export failed: " + e.message); } done(); });
const kfGPrint = g => kfGOut(g, "print");
const kfGPrintBlank = (pkg, m) => kfGOut({ no: "", pkg, ed: "night", to: "", from: "", issued: "" }, m);
function GiftBlank({ onClose }) {
 return <div className="kf-stack g12">
  <div className="kf-rowb"><span className="kf-lbl">Blank certificate</span><button type="button" className="kf-icbtn" onClick={onClose}><KIcon n="x"></KIcon></button></div>
  <p className="kf-body sm">No number, names or date · fill in by hand. Not added to the list. PNG saves front and back.</p>
  {Object.keys(KF.gifts).map(k => <div key={k} className="kf-rowb"><span className="kf-body sm">{kfGLabel(k)}</span><div className="kf-row"><button className="kf-btn solid auto sm" onClick={() => kfGPrintBlank(k, "png")}><KIcon n="dl" s={16}></KIcon>PNG</button><button className="kf-btn ghost auto sm" onClick={() => kfGPrintBlank(k, "print")}>PDF</button></div></div>)}
 </div>;
}
const kfGBlank = () => ({ pkg: "lo206-1", ed: "night", to: "", from: "", issued: kfGToday(), buyer: { name: "", email: "", phone: "" }, ordered: kfGToday(), paid: "", days: [], note: "" });

function GiftSheet({ ctx, id, onClose }) {
 const db = useDB(), cur = id && id !== "new" ? (db.gifts || []).find(g => g.id === id) : null;
 const [f, setF] = useStateK(() => cur ? JSON.parse(JSON.stringify(cur)) : kfGBlank()), [saved, setSaved] = useStateK(null);
 const yr = new Date().getFullYear(), no = cur ? cur.no : kfGNo(yr, kfGNext(db, yr)), pk = KF.gifts[f.pkg];
 const fr = useRefK(null), prev = { ...f, no };
 useEffectK(() => { const w = fr.current && fr.current.contentWindow; if (w && w.kfRender) w.kfRender(JSON.parse(decodeURIComponent(kfGURL(prev, "embed").split("#")[1]))); });
 const up = p => setF(o => ({ ...o, ...p })), upB = p => setF(o => ({ ...o, buyer: { ...o.buyer, ...p } }));
 const setDay = (i, v) => setF(o => { const d = [...(o.days || [])]; d[i] = v; return { ...o, days: d.slice(0, KF.gifts[o.pkg].d) }; });
 const save = dl => {
  if (!f.to.trim()) return;
  let rec;
  KFDB.update(d => { d.gifts = d.gifts || [];
   if (cur) { rec = { ...cur, ...f, days: (f.days || []).slice(0, pk.d) }; d.gifts = d.gifts.map(g => g.id === cur.id ? rec : g); }
   else { const y = new Date().getFullYear(), seq = kfGNext(d, y); rec = { ...f, id: KFDB.uid(), seq, year: y, no: kfGNo(y, seq), days: [], by: ctx.key, at: Date.now() }; d.gifts.push(rec); } });
  if (dl) kfGPrint(rec);
  if (cur) onClose(); else setSaved(rec);
 };
 const del = () => { if (!confirm("Delete certificate " + cur.no + "? The number won't be reused.")) return; KFDB.update(d => { d.gifts = (d.gifts || []).filter(g => g.id !== cur.id); }); onClose(); };
 if (saved) return <div className="kf-stack g12">
  <span className="kf-ok"><i></i>Certificate created</span><h2 className="kf-h2">{saved.no}</h2>
  <p className="kf-body sm">For {saved.to} · {kfGLabel(saved.pkg)}. It's saved in the list, where you can mark the day(s) it's used.</p>
  <button className="kf-btn solid" onClick={() => kfGPrint(saved)}><KIcon n="dl" s={18}></KIcon>Download PDF</button>
  <div className="kf-row"><button className="kf-btn ghost auto sm" onClick={() => { setSaved(null); setF(kfGBlank()); }}>Create another</button><button className="kf-btn ghost auto sm" onClick={onClose}>Done</button></div>
 </div>;
 return <form className="kf-stack g12 kf-gform" onSubmit={e => { e.preventDefault(); save(false); }}>
  <div className="kf-rowb"><span className="kf-lbl">{cur ? "Edit certificate" : "New certificate"}</span><button type="button" className="kf-icbtn" onClick={onClose}><KIcon n="x"></KIcon></button></div>
  <div className="kf-rowb"><h2 className="kf-h2 kf-mono" style={{ fontFamily: "var(--font-mono)" }}>{no}</h2>{!cur && <span className="kf-hint">Next number · set automatically</span>}{cur && <span className={"kf-pill" + (kfGState(f) === "used" ? "" : " on")}>{kfGStateL(f)}</span>}</div>
  <div className="kf-gprev"><iframe ref={fr} src={kfGURL(prev, "embed")} title="Certificate preview"></iframe></div>
  <label className="kf-field"><span className="kf-lbl">Package</span><div className="kf-gpk">{Object.keys(KF.gifts).map(k => <button type="button" key={k} className={"kf-pill" + (f.pkg === k ? " on" : "")} onClick={() => up({ pkg: k })}>{kfGLabel(k)}</button>)}</div></label>
  <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">To</span><input value={f.to} onChange={e => up({ to: e.target.value })} placeholder="Recipient's name"></input></label>
   <label className="kf-field"><span className="kf-lbl">From</span><input value={f.from} onChange={e => up({ from: e.target.value })} placeholder="With love, …"></input></label></div>
  <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Issued</span><input type="date" value={f.issued} onChange={e => up({ issued: e.target.value })}></input></label>
   </div>
  <span className="kf-lbl" style={{ marginTop: 8 }}>Ordered by</span>
  <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Name</span><input value={f.buyer.name} onChange={e => upB({ name: e.target.value })}></input></label>
   <label className="kf-field"><span className="kf-lbl">Order date</span><input type="date" value={f.ordered} onChange={e => up({ ordered: e.target.value })}></input></label></div>
  <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Email</span><input value={f.buyer.email} onChange={e => upB({ email: e.target.value })}></input></label>
   <label className="kf-field"><span className="kf-lbl">Phone</span><input value={f.buyer.phone} onChange={e => upB({ phone: e.target.value })}></input></label></div>
  <label className="kf-field"><span className="kf-lbl">Paid · USD · optional</span><input inputMode="decimal" value={f.paid || ""} onChange={e => up({ paid: e.target.value.replace(/[^\d.]/g, "") })}></input></label>
  {cur && <><span className="kf-lbl" style={{ marginTop: 8 }}>Use · {pk.d} training day{pk.d > 1 ? "s" : ""}</span>
   <div className="kf-g2">{Array.from({ length: pk.d }, (_, i) => <label key={i} className="kf-field"><span className="kf-lbl">Day {i + 1} · used on</span><div className="kf-inline"><input type="date" value={(f.days || [])[i] || ""} onChange={e => setDay(i, e.target.value)}></input>{(f.days || [])[i] && <button type="button" className="kf-icbtn" aria-label="Clear" onClick={() => setDay(i, "")}><KIcon n="x" s={16}></KIcon></button>}</div></label>)}</div></>}
  <label className="kf-field"><span className="kf-lbl">Note · optional</span><textarea rows="2" value={f.note || ""} onChange={e => up({ note: e.target.value })}></textarea></label>
  <div className="kf-row"><button className="kf-btn solid auto" disabled={!f.to.trim()}>{cur ? "Save changes" : "Create certificate"}</button><button type="button" className="kf-btn ghost auto" disabled={!f.to.trim()} onClick={() => save(true)}><KIcon n="dl" s={16}></KIcon>{cur ? "Save & download PDF" : "Create & download PDF"}</button>{cur && <button type="button" className="kf-link bad" onClick={del}>Delete</button>}</div>
 </form>;
}

function GiftsTab({ ctx }) {
 const db = useDB(), all = db.gifts || [], [q, setQ] = useStateK(""), [flt, setFlt] = useStateK("all"), [ed, setEd] = useStateK(null);
 const n = s => all.filter(g => kfGState(g) === s).length;
 const list = all.filter(g => (flt === "all" || (flt === "open" ? kfGState(g) !== "used" : kfGState(g) === "used")) && [g.no, g.to, g.from, g.buyer && g.buyer.name].join(" ").toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.year - a.year || b.seq - a.seq);
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Arrive & Drive</span><h1 className="kf-h1">Gift <em>cards</em></h1><p className="kf-lead">Create a certificate, download it as a PDF and keep track of when it's used. Numbers are issued in order automatically.</p></div>
  <div className="kf-card kf-stats"><Stat label="Issued" main={String(all.length)} decimal=""></Stat><Stat label="Unused" main={String(n("unused"))} decimal=""></Stat><Stat label="Partly used" main={String(n("partial"))} decimal=""></Stat><Stat label="Used" main={String(n("used"))} decimal=""></Stat></div>
  <div className="kf-toolbar"><label className="kf-search"><KIcon n="search" s={18}></KIcon><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search number, name or buyer"></input></label><div className="kf-seg">{[["all", "All"], ["open", "Not used"], ["used", "Used"]].map(([k, l]) => <button key={k} className={flt === k ? "on" : ""} onClick={() => setFlt(k)}>{l}</button>)}</div><button className="kf-btn ghost auto" onClick={() => setEd("blank")}><KIcon n="dl" s={16}></KIcon>Blank</button><button className="kf-btn solid auto" onClick={() => setEd("new")}><KIcon n="plus" s={16}></KIcon>New certificate</button></div>
  <div className="kf-card kf-list">{list.map(g => <div key={g.id} className="kf-li kf-gift">
   <div><b className="kf-mono">{g.no}</b><small>{g.to || "—"} · {kfGLabel(g.pkg)}</small><small className="kf-gmeta">Ordered by {(g.buyer && g.buyer.name) || "—"} · {kfGDate(g.ordered) || "—"}{(g.days || []).filter(Boolean).length ? " · used " + g.days.filter(Boolean).map(kfGDate).join(", ") : ""}</small></div>
   <span className={"kf-pill" + (kfGState(g) === "used" ? "" : " on")}>{kfGStateL(g)}</span>
   <button className="kf-icbtn" aria-label="Download PDF" title="Download PDF" onClick={() => kfGPrint(g)}><KIcon n="dl" s={18}></KIcon></button>
   <button className="kf-icbtn" aria-label="Edit" title="Edit · mark use" onClick={() => setEd(g.id)}><KIcon n="edit" s={18}></KIcon></button>
  </div>)}{!list.length && <p className="kf-hint" style={{ padding: "22px 0" }}>{all.length ? "No certificates match." : "No certificates yet. Tap New certificate to create the first one."}</p>}</div>
  <KSheet open={!!ed} onClose={() => setEd(null)}>{ed === "blank" ? <GiftBlank onClose={() => setEd(null)}></GiftBlank> : ed && <GiftSheet key={ed} ctx={ctx} id={ed} onClose={() => setEd(null)}></GiftSheet>}</KSheet>
 </div>;
}

Object.assign(window, { GiftsTab });
