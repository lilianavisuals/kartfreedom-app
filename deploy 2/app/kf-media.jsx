// Photo & video folders, stored per driver account. Download single files or whole folders (zip).
async function kfZip(name, items) {
 if (!window.JSZip) { for (const m of items) await kfDownload(m); return; }
 const z = new JSZip(), f = z.folder(name);
 for (const m of items) { const b = await KFDB.mediaBlob(m); f.file(m.name || m.id, b); }
 const blob = await z.generateAsync({ type: "blob" }), a = document.createElement("a");
 a.href = URL.createObjectURL(blob); a.download = name + ".zip"; document.body.appendChild(a); a.click(); a.remove();
}

async function kfUpload(files, driver, folder, by) {
 const items = [];
 for (const f of files) { const kind = f.type.startsWith("video") ? "video" : f.type.startsWith("image") ? "image" : "file"; const blob = await KFDB.putBlob(f); items.push({ id: KFDB.uid(), folder, blob, name: f.name, kind, by, at: Date.now() }); }
 KFDB.update(d => { d.photos[driver] = [...(d.photos[driver] || []), ...items]; });
}

function MediaViewer({ list, i, setI, canDel, onDel }) {
 const m = list[i];
 useEffectK(() => { const k = e => { if (e.key === "Escape") setI(null); if (e.key === "ArrowRight") setI(Math.min(list.length - 1, i + 1)); if (e.key === "ArrowLeft") setI(Math.max(0, i - 1)); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [i, list.length]);
 if (!m) return null;
 return <div className="kf-viewer">
  <div className="kf-viewer-top"><button className="kf-icbtn" onClick={() => setI(null)} aria-label="Close"><KIcon n="x"></KIcon></button><span className="kf-viewer-n">{m.name}<small>{i + 1} / {list.length} · {kfDate(m.at)}</small></span>
   {canDel && <button className="kf-icbtn" aria-label="Delete" onClick={() => { if (confirm("Delete this file?")) { onDel(m); setI(list.length > 1 ? Math.max(0, i - 1) : null); } }}><KIcon n="trash"></KIcon></button>}
   <button className="kf-btn solid auto sm" onClick={() => kfDownload(m)}><KIcon n="dl" s={16}></KIcon>Download</button></div>
  <div className="kf-viewer-stage">
   {i > 0 && <button className="kf-viewer-nav l" onClick={() => setI(i - 1)} aria-label="Previous"><KIcon n="back"></KIcon></button>}
   <KMedia m={m} className="kf-viewer-media" controls key={m.id}></KMedia>
   {i < list.length - 1 && <button className="kf-viewer-nav r" onClick={() => setI(i + 1)} aria-label="Next"><KIcon n="right"></KIcon></button>}
  </div>
 </div>;
}

function FolderBrowser({ ctx, driver, canEdit }) {
 const db = useDB(), [open, setOpen] = useStateK(null), [vi, setVi] = useStateK(null), [busy, setBusy] = useStateK(false), [naming, setNaming] = useStateK(false), [nm, setNm] = useStateK("");
 const folders = db.folders[driver] || [], photos = db.photos[driver] || [], u = db.users[driver];
 const inF = id => photos.filter(p => p.folder === id).sort((a, b) => b.at - a.at);
 const mkFolder = e => { e.preventDefault(); const name = nm.trim(); if (!name) return; const id = "f" + KFDB.uid(); KFDB.update(d => { d.folders[driver] = [{ id, name, at: Date.now() }, ...(d.folders[driver] || [])]; }); setNm(""); setNaming(false); setOpen(id); };
 const add = async () => { const fs = await kfPick("", true); if (!fs.length) return; setBusy(true); await kfUpload(fs, driver, open, ctx.key); setBusy(false); };
 const del = m => { KFDB.update(d => { d.photos[driver] = (d.photos[driver] || []).filter(p => p.id !== m.id); }); if (m.blob) KFDB.delBlob(m.blob); };
 const delFolder = f => { if (!confirm("Delete folder “" + f.name + "” and everything in it?")) return; inF(f.id).forEach(m => m.blob && KFDB.delBlob(m.blob)); KFDB.update(d => { d.folders[driver] = d.folders[driver].filter(x => x.id !== f.id); d.photos[driver] = (d.photos[driver] || []).filter(p => p.folder !== f.id); }); setOpen(null); };
 const F = folders.find(f => f.id === open);
 if (F) { const list = inF(F.id);
  return <div className="kf-stack">
   <div className="kf-folderbar"><button className="kf-link" onClick={() => setOpen(null)}><KIcon n="back" s={14}></KIcon>All folders</button><span className="kf-grow"></span>
    {list.length > 0 && <button className="kf-btn ghost auto sm" onClick={() => kfZip(F.name, list)}><KIcon n="dl" s={16}></KIcon>Download all</button>}
    {canEdit && <button className="kf-btn solid auto sm" onClick={add} disabled={busy}><KIcon n="up" s={16}></KIcon>{busy ? "Uploading…" : "Upload"}</button>}</div>
   <div className="kf-rowb"><div className="kf-stack g8"><h2 className="kf-h2">{F.name}</h2><span className="kf-lbl">{list.length} files · {kfDate(F.at)}</span></div>{canEdit && <button className="kf-icbtn" aria-label="Delete folder" onClick={() => delFolder(F)}><KIcon n="trash" s={18}></KIcon></button>}</div>
   {list.length ? <div className="kf-gal">{list.map((m, i) => <button key={m.id} className="kf-ph" onClick={() => setVi(i)}><KMedia m={m}></KMedia>{m.kind === "video" && <span className="kf-ph-play"><KIcon n="play" s={14} fill></KIcon></span>}<span>{m.name}</span></button>)}</div>
    : <div className="kf-card kf-empty"><KIcon n="image" s={28}></KIcon><p className="kf-body sm">No photos, videos or files yet.</p>{canEdit && <button className="kf-btn auto" onClick={add}>Upload files</button>}</div>}
   {vi != null && <MediaViewer list={list} i={vi} setI={setVi} canDel={canEdit} onDel={del}></MediaViewer>}
  </div>; }
 return <div className="kf-stack">
  <div className="kf-folderbar"><span className="kf-lbl">{folders.length} folders · {photos.length} files</span><span className="kf-grow"></span>{canEdit && <button className="kf-btn ghost auto sm" onClick={() => setNaming(true)}><KIcon n="plus" s={16}></KIcon>New folder</button>}</div>
  {naming && <form className="kf-inline" onSubmit={mkFolder}><input autoFocus value={nm} onChange={e => setNm(e.target.value)} placeholder="Folder name, e.g. Winter Series Rd 1"></input><button className="kf-btn solid auto sm" type="submit">Create</button><button className="kf-btn ghost auto sm" type="button" onClick={() => setNaming(false)}>Cancel</button></form>}
  {folders.length ? <div className="kf-folders">{folders.map(f => { const l = inF(f.id); return <button key={f.id} className="kf-folder" onClick={() => setOpen(f.id)}>
   <span className="kf-folder-cv">{l.slice(0, 3).map(m => <KMedia key={m.id} m={m}></KMedia>)}{!l.length && <KIcon n="folder" s={28}></KIcon>}</span>
   <b>{f.name}</b><small>{l.length} files</small></button>; })}</div>
   : <div className="kf-card kf-empty"><KIcon n="folder" s={28}></KIcon><p className="kf-body sm">{u ? u.first || u.name : "This driver"} has no folders yet.</p>{canEdit && <button className="kf-btn auto" onClick={() => setNaming(true)}>Create a folder</button>}</div>}
 </div>;
}

function PhotosTab({ ctx }) {
 return <div className="kf-pad">
  <div className="kf-stack"><span className="kf-eyebrow">Your account</span><h1 className="kf-h1">Photos <em>& files</em></h1><p className="kf-lead">Photos, video and documents from the team, sorted by folder. Download any file or a whole folder.</p></div>
  <FolderBrowser ctx={ctx} driver={ctx.key} canEdit={true}></FolderBrowser>
 </div>;
}

Object.assign(window, { FolderBrowser, PhotosTab, MediaViewer, kfUpload });
