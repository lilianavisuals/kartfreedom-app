const { useState: useStateK, useEffect: useEffectK, useRef: useRefK } = React;

const KF_ICONS = {
 home:"M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z", coach:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
 trend:"M3 17l6-6 4 4 8-8M14 7h7v7", image:"M3 5h18v14H3zM21 15l-5-5L5 19M9 9.5a1 1 0 1 0 0 .01", cap:"M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 2 9 2 12 0v-5",
 lock:"M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4", right:"M9 6l6 6-6 6", back:"M15 6l-6 6 6 6", check:"M5 12l5 5 9-10", play:"M8 5v14l11-7z",
 x:"M6 6l12 12M18 6 6 18", camera:"M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", keys:"M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
 id:"M3 5h18v14H3zM7 15h5M14 9h4M14 12h4", cal:"M4 5h16v16H4zM4 10h16M9 3v4M15 3v4", out:"M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10",
 users:"M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", shield:"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", clip:"M21 11.5l-8.5 8.5a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5", plus:"M12 5v14M5 12h14", folder:"M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z", trash:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13", search:"M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5", up:"M12 20V9M7 14l5-5 5 5M5 4h14", edit:"M4 20h4L19 9l-4-4L4 16zM14 6l4 4", dot:"M12 12h.01",
 chat:"M7 18l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M9 11h10a2 2 0 0 1 2 2v6l-3-2H9a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z", wrench:"M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z", dl:"M12 4v11M7 10l5 5 5-5M5 20h14", send:"M4 12l16-8-6 16-3-7z", book:"M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6", award:"M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8", flag:"M5 21V4h11l-2 4 2 4H5", card:"M3 6h18v12H3zM3 10h18M7 15h4", doc:"M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7", au:"M12 19V5M6 11l6-6 6 6", ad:"M12 5v14M6 13l6 6 6-6", video:"M3 6h13v12H3zM16 10l5-3v10l-5-3"
};
function KIcon({ n, s = 20, fill }) {
 return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={KF_ICONS[n]}></path></svg>;
}

function KHeader({ right, label = "KartFreedom", onBack }) {
 return <div className="kf-hdr">
  {onBack ? <button className="kf-icbtn" onClick={onBack} aria-label="Back"><KIcon n="back"></KIcon></button> : <img src="assets/kf-mark.png" alt="" className="kf-mark"></img>}
  <b>{label}</b><i></i>{right}
 </div>;
}

function kfBars(code, kind) {
 const dg = code.split("").map(Number), sum = dg.reduce((a, b) => a + b, 0);
 dg.push(sum % 10);
 return [100, ...dg.map(n => 30 + 7 * n), 100];
}

function KCard({ user, side = "front", onFlip }) {
 const code = user.id.replace(/\D/g, ""), ac = user.type === "academy";
 return <div className={"kf-idcard " + (ac ? "ac " : "") + (side === "back" ? "flip" : "")} onClick={onFlip}>
  <div className="face front">
   <div className="ic-top"><img src="assets/kf-mark.png" alt=""></img><span>{ac ? "Academy" : "Member"}</span></div>
   <div className="ic-ph">{user.photo ? <img src={user.photo} alt=""></img> : <b>{user.name.split(" ").map(w => w[0]).join("")}</b>}</div>
   <div className="ic-body">
    <h3>{user.name}</h3><i></i>
    <div className="ic-g"><div><span>{ac ? "Academy no." : "Member no."}</span><b>{user.id}</b></div><div><span>Class</span><b>{user.cls}</b></div><div><span>Valid thru</span><b>{user.valid}</b></div></div>
   </div>
  </div>
  <div className="face back">
   <img src="assets/kf-mark.png" alt="" className="ic-bm"></img>
   <p className="ic-slogan">Racing is in our <em>blood</em></p>
   <div className="ic-code">{kfBars(code, user.type).map((b, i) => <span key={i} className={i === 0 || i === 8 ? "ref" : ""} style={{ width: b + "%" }}></span>)}</div>
  </div>
 </div>;
}

function KSheet({ open, children, onClose }) {
 return <>
  <div className={"kf-scrim" + (open ? " on" : "")} onClick={onClose}></div>
  <div className={"kf-sheet" + (open ? " on" : "")}>{children}</div>
 </>;
}

function KBar({ v, max = 1, fluo }) {
 return <div className="kf-bar"><span style={{ width: Math.min(100, (v / max) * 100) + "%", background: fluo ? "var(--kf-fluo)" : undefined }}></span></div>;
}

function useDB() { const [, f] = useStateK(0); useEffectK(() => KFDB.subscribe(() => f(x => x + 1)), []); return KFDB.state; }
const kfInit = n => (n || "?").split(" ").map(w => w[0]).join("").slice(0, 2);
function KAvatar({ u, s = 36 }) {
 return <span className="kf-av" style={{ width: s, height: s, fontSize: s * .34 }}>{u && u.photo ? <img src={u.photo} alt=""></img> : kfInit(u && u.name)}</span>;
}
function kfAgo(t) {
 const d = (Date.now() - t) / 1000;
 if (d < 60) return "just now"; if (d < 3600) return Math.floor(d / 60) + " min ago"; if (d < 86400) return Math.floor(d / 3600) + " h ago";
 if (d < 7 * 86400) return Math.floor(d / 86400) + " d ago";
 return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
const kfDate = t => new Date(t).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
function KMedia({ m, className, controls, onClick }) {
 const [url, setUrl] = useStateK(m.src || null);
 useEffectK(() => { let on = true; if (!m.src) KFDB.mediaURL(m).then(u => on && setUrl(u)); return () => { on = false; }; }, [m.blob, m.src]);
 if (m.kind === "file") return <span className={"kf-filetile " + (className || "")} onClick={onClick}><KIcon n="doc" s={30}></KIcon><em>{((m.name || "").split(".").pop() || "file").slice(0, 5)}</em></span>;
 if (!url) return <span className={"kf-media-wait " + (className || "")}></span>;
 return m.kind === "video" ? <video className={className} src={url} controls={controls} playsInline muted={!controls} preload="metadata" onClick={onClick}></video> : <img className={className} src={url} alt={m.name || ""} onClick={onClick}></img>;
}
async function kfDownload(m) {
 const b = await KFDB.mediaBlob(m), a = document.createElement("a");
 a.href = URL.createObjectURL(b); a.download = m.name || "kartfreedom-media"; document.body.appendChild(a); a.click(); a.remove();
}
function kfPick(accept, multi) {
 return new Promise(res => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.multiple = !!multi; i.onchange = () => res([...i.files]); i.click(); });
}
const kfCan = (u, p) => !!u && (KF.roles[u.role] || {}).can && KF.roles[u.role].can.includes(p);
const kfStaff = u => !!u && ["owner", "manager", "coach", "staff"].includes(u.role);

Object.assign(window, { useDB, KAvatar, kfAgo, kfDate, KMedia, kfDownload, kfPick, kfCan, kfStaff, kfInit, useStateK, useEffectK, useRefK, KIcon, KHeader, KCard, KSheet, KBar, kfBars });
