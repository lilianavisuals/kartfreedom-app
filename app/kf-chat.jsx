// Team chat: channels by access level + direct messages. Text, photos, videos and files.
const kfDM = (a, b) => "dm:" + [a, b].sort().join("|");
function kfConvs(db, key, owns) {
 const u = db.users[key]; if (!u) return [];
 const ch = Object.entries(db.channels).filter(([, c]) => c.who.includes(u.role) || (c.academyOwners && owns)).map(([id, c]) => ({ id, t: c.t, sub: c.sub, ch: true }));
 const dms = Object.keys(db.msgs).filter(id => id.startsWith("dm:") && id.slice(3).split("|").includes(key)).map(id => { const o = id.slice(3).split("|").find(k => k !== key) || key, ou = db.users[o]; return { id, t: ou ? ou.name : "Unknown", other: o, dm: true }; });
 const last = id => { const m = db.msgs[id] || []; return m.length ? m[m.length - 1].at : 0; };
 return [...ch, ...dms.sort((a, b) => last(b.id) - last(a.id))];
}
function kfUnread(db, key, owns) {
 const r = db.reads[key] || {};
 return kfConvs(db, key, owns).reduce((n, c) => n + Math.max(0, (db.msgs[c.id] || []).filter(m => m.from !== key).length - (r[c.id] || 0)), 0);
}

function ChatTab({ ctx }) {
 const db = useDB(), convs = kfConvs(db, ctx.key, ctx.owns);
 const [cur, setCur] = useStateK(() => ctx.s.chatOpen || null), [pick, setPick] = useStateK(false), [q, setQ] = useStateK("");
 useEffectK(() => { if (ctx.s.chatOpen && ctx.s.chatOpen !== cur) { setCur(ctx.s.chatOpen); } }, [ctx.s.chatOpen]);
 const open = id => { setCur(id); ctx.set({ chatOpen: id }); };
 const reads = db.reads[ctx.key] || {};
 const unread = c => Math.max(0, (db.msgs[c.id] || []).filter(m => m.from !== ctx.key).length - (reads[c.id] || 0));
 const people = Object.entries(db.users).filter(([k, u]) => k !== ctx.key && u.status !== "suspended" && u.name.toLowerCase().includes(q.toLowerCase()));
 const C = convs.find(c => c.id === cur) || (cur && cur.startsWith("dm:") ? { id: cur, dm: true, other: cur.slice(3).split("|").find(k => k !== ctx.key), t: "" } : null);
 const list = <div className="kf-convs">
  <div className="kf-folderbar"><span className="kf-lbl">Conversations</span><span className="kf-grow"></span><button className="kf-btn ghost auto sm" onClick={() => setPick(true)}><KIcon n="edit" s={15}></KIcon>New</button></div>
  <div className="kf-card kf-list">{convs.map(c => { const m = (db.msgs[c.id] || []).slice(-1)[0], ou = c.dm && db.users[c.other], n = unread(c);
   return <button key={c.id} className={"kf-li kf-conv" + (cur === c.id ? " on" : "")} onClick={() => open(c.id)}>
    {c.dm ? <KAvatar u={ou} s={40}></KAvatar> : <span className="kf-av ch">#</span>}
    <div><b>{c.t}</b><small>{m ? (m.from === ctx.key ? "You: " : c.dm ? "" : ((db.users[m.from] || {}).first || "") + ": ") + (m.text || (m.media && m.media.length ? (m.media[0].kind === "video" ? "Video" : m.media[0].kind === "image" ? "Photo" : "File") : "")) : c.sub}</small></div>
    <span className="kf-conv-r">{m && <small>{kfAgo(m.at)}</small>}{n > 0 && <i className="kf-badge">{n}</i>}</span></button>; })}</div>
 </div>;
 return <div className={"kf-chatw" + (C ? " has" : "")}>
  {list}
  {C ? <Thread key={C.id} ctx={ctx} conv={C} onBack={() => open(null)}></Thread> : <div className="kf-thread empty"><KIcon n="chat" s={30}></KIcon><p className="kf-body sm">Pick a conversation or start a new one.</p></div>}
  <KSheet open={pick} onClose={() => setPick(false)}>
   <div className="kf-rowb"><span className="kf-lbl">New message</span><button className="kf-icbtn" onClick={() => setPick(false)}><KIcon n="x"></KIcon></button></div>
   <label className="kf-field"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people"></input></label>
   <div className="kf-list kf-pick">{people.map(([k, u]) => <button key={k} className="kf-li" onClick={() => { setPick(false); setQ(""); open(kfDM(ctx.key, k)); }}><KAvatar u={u} s={38}></KAvatar><div><b>{u.name}</b><small>{KF.roles[u.role].label} · {u.cls}</small></div></button>)}</div>
  </KSheet>
 </div>;
}

function Thread({ ctx, conv, onBack }) {
 const db = useDB(), msgs = db.msgs[conv.id] || [], box = useRefK(), [txt, setTxt] = useStateK(""), [att, setAtt] = useStateK([]), [busy, setBusy] = useStateK(false), [vi, setVi] = useStateK(null);
 const ou = conv.dm && db.users[conv.other], ch = !conv.dm && db.channels[conv.id];
 const readOnly = ctx.user.status === "suspended";
 useEffectK(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; const n = msgs.filter(m => m.from !== ctx.key).length; if (((db.reads[ctx.key] || {})[conv.id] || 0) !== n) KFDB.update(d => { d.reads[ctx.key] = { ...(d.reads[ctx.key] || {}), [conv.id]: n }; }); }, [msgs.length]);
 const attach = async () => { const fs = await kfPick("image/*,video/*,.pdf", true); setAtt([...att, ...fs]); };
 const send = async e => { e.preventDefault(); const t = txt.trim(); if (!t && !att.length) return; setBusy(true);
  const media = []; for (const f of att) media.push({ blob: await KFDB.putBlob(f), kind: f.type.startsWith("video") ? "video" : f.type.startsWith("image") ? "image" : "file", name: f.name });
  KFDB.update(d => { d.msgs[conv.id] = [...(d.msgs[conv.id] || []), { id: KFDB.uid(), from: ctx.key, text: t, media, at: Date.now() }]; });
  setTxt(""); setAtt([]); setBusy(false); };
 const gallery = msgs.flatMap(m => (m.media || []).filter(x => x.kind !== "file").map(x => ({ ...x, id: x.blob, at: m.at })));
 const del = m => KFDB.update(d => { d.msgs[conv.id] = d.msgs[conv.id].filter(x => x.id !== m.id); });
 const canMod = kfCan(ctx.user, "admin");
 let lastDay = "";
 return <div className="kf-thread">
  <div className="kf-thread-h"><button className="kf-icbtn kf-thread-back" onClick={onBack} aria-label="Back"><KIcon n="back"></KIcon></button>
   {conv.dm ? <KAvatar u={ou} s={36}></KAvatar> : <span className="kf-av ch">#</span>}
   <div><b>{conv.dm ? (ou ? ou.name : "") : ch.t}</b><small>{conv.dm ? (ou ? KF.roles[ou.role].label + " · " + ou.cls : "") : ch.sub}</small></div></div>
  <div className="kf-msgs" ref={box}>
   {!msgs.length && <p className="kf-hint">No messages yet. Say hello.</p>}
   {msgs.map(m => { const u = db.users[m.from] || { name: "Unknown" }, me = m.from === ctx.key, dd = kfDate(m.at), sep = dd !== lastDay; lastDay = dd;
    return <React.Fragment key={m.id}>{sep && <div className="kf-daysep"><span>{dd}</span></div>}
     <div className={"kf-msg" + (me ? " me" : "") + (kfStaff(u) ? " coach" : "")}>
      {!me && <KAvatar u={u} s={30}></KAvatar>}
      <div className="kf-msg-b">
       {!me && <span className="kf-msg-n">{u.name}{kfStaff(u) && <em>{KF.roles[u.role].label}</em>}</span>}
       {(m.media || []).map((x, i) => x.kind === "file" ? <button key={i} className="kf-msg-file" onClick={() => kfDownload(x)}><KIcon n="dl" s={16}></KIcon>{x.name}</button>
        : <button key={i} className="kf-msg-media" onClick={() => setVi(gallery.findIndex(g => g.id === x.blob))}><KMedia m={x}></KMedia>{x.kind === "video" && <span className="kf-ph-play"><KIcon n="play" s={14} fill></KIcon></span>}</button>)}
       {m.text && <p>{m.text}</p>}
       <small>{new Date(m.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}{(me || canMod) && <button onClick={() => confirm("Delete message?") && del(m)}>Delete</button>}</small>
      </div>
     </div></React.Fragment>; })}
  </div>
  {att.length > 0 && <div className="kf-att">{att.map((f, i) => <span key={i}>{f.name}<button onClick={() => setAtt(att.filter((_, k) => k !== i))} aria-label="Remove"><KIcon n="x" s={12}></KIcon></button></span>)}</div>}
  {readOnly ? <p className="kf-hint kf-compose">Your account is paused. Contact the team.</p> :
  <form className="kf-compose" onSubmit={send}>
   <button type="button" className="kf-attach" onClick={attach} aria-label="Attach photo or video"><KIcon n="clip" s={18}></KIcon></button>
   <input value={txt} onChange={e => setTxt(e.target.value)} placeholder={"Message " + (conv.dm ? (ou ? ou.first || ou.name : "") : "#" + ch.t)}></input>
   <button aria-label="Send" disabled={busy || (!txt.trim() && !att.length)}><KIcon n="send" s={18}></KIcon></button>
  </form>}
  {vi != null && vi >= 0 && <MediaViewer list={gallery} i={vi} setI={setVi}></MediaViewer>}
 </div>;
}
Object.assign(window, { ChatTab, kfUnread, kfDM });
