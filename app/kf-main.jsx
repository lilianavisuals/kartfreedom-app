const KF_UI = "kfui.v1";
const kfQS = new URLSearchParams(location.search);
const KF_AS = KF_LIVE ? undefined : { member: "member:270001", academy: "academy:270002", coach: "member:000001", owner: "member:000001", manager: "member:000002" }[kfQS.get("as")];
const KF_SCAN = kfQS.get("as") === "scan", KF_TAB = kfQS.get("tab");
const kfLoadUI = () => { try { return JSON.parse(sessionStorage.getItem(KF_UI)) || {}; } catch (e) { return {}; } };
const KF_DBKEYS = ["owned", "done", "quiz", "req"];
const KF_TABS = {
 owner: [["drivers", "Drivers", "users"], ["chat", "Chat", "chat"], ["academy", "Academy", "cap"], ["billing", "Payments", "card"], ["team", "Accounts", "shield"]],
 manager: [["drivers", "Drivers", "users"], ["billing", "Payments", "card"], ["team", "Accounts", "shield"], ["academy", "Academy", "cap"], ["chat", "Chat", "chat"]],
 coach: [["drivers", "Drivers", "users"], ["chat", "Chat", "chat"], ["academy", "Academy", "cap"]],
 staff: [["drivers", "Drivers", "users"], ["chat", "Chat", "chat"], ["academy", "Academy", "cap"]],
 member: [["home", "Home", "home"], ["progress", "Progress", "trend"], ["photos", "Photos", "image"], ["academy", "Academy", "cap"], ["chat", "Chat", "chat"]],
 academy: [["home", "Home", "home"], ["academy", "Academy", "cap"], ["chat", "Chat", "chat"], ["progress", "Progress", "trend", 1], ["photos", "Photos", "image", 1]]
};

function KFApp() {
 const db = useDB();
 const [ui, setUI] = useStateK(() => ({ session: null, tab: null, stack: [], chatOpen: null, ...kfLoadUI(), ...(KF_AS ? { session: KF_AS, tab: KF_TAB, stack: [] } : KF_SCAN ? { session: null, stack: [] } : {}) }));
 useEffectK(() => { sessionStorage.setItem(KF_UI, JSON.stringify(ui)); }, [ui]);
 const [toast, setToast] = useStateK(null), prev = useRefK(null);
 const key = KF_LIVE ? KFDB.me : ui.session, user = key && db.users[key];
 const acc = user && db.owned[key], accLive = acc && (!acc.until || acc.until > Date.now());
 const owns = user ? (kfStaff(user) ? (acc || { plan: "yearly" }) : accLive ? acc : null) : null;
 const memExp = !!(user && user.role === "member" && user.bill && user.bill.due < Date.now());
 const isBill = user && kfCan(user, "billing"), openReq = isBill ? kfOpenReqs(db).length : 0;
 const [tick, setTick] = useStateK(0);
 useEffectK(() => { if (!isBill) return; const t = setInterval(() => setTick(x => x + 1), 6e4); return () => clearInterval(t); }, [isBill]);
 const overdue = isBill ? kfAccessRows(db).filter(r => r.until < Date.now()) : [];
 const myOk = user ? (db.requests || []).filter(r => r.from === key && r.status === "approved").length : 0;

 useEffectK(() => {
  if (!user) { prev.current = null; return; }
  const notes = (db.notes[key] || []).length, conv = kfUnread(db, key, owns), p = prev.current;
  const odT = n => n + (n === 1 ? " payment overdue" : " payments overdue"), odB = overdue.slice(0, 3).map(r => r.u.first + " · " + kfItem(r.kind, r.plan)).join(", ") + (overdue.length > 3 ? " +" + (overdue.length - 3) : "");
  if ((!p || p.key !== key) && overdue.length) setToast({ t: odT(overdue.length), b: odB, tab: "billing", bad: 1 });
  if (p && p.key === key) {
   if (overdue.length > p.overdue) setToast({ t: odT(overdue.length), b: odB, tab: "billing", bad: 1 });
   else if (openReq > p.openReq) { const r = kfOpenReqs(db)[0], ru = r.from && db.users[r.from]; setToast({ t: "New access request", b: (ru ? ru.name : r.guest.name) + " · " + kfReqLabel(r) + " · " + kfMoney(r.price), tab: "billing" }); }
   else if (myOk > p.myOk) { setToast({ t: "Access confirmed", b: "Payment received. Your access is active.", go: { t: "sub" } }); }
   else if (notes > p.notes && user.role === "member") { const n = db.notes[key][0], by = db.users[n.by]; setToast({ t: "New note from " + (by ? by.name : "your coach"), b: n.text, go: { t: "coach" } }); }
   else if (conv > p.conv) { setToast({ t: "New message", b: "Open chat to reply.", tab: "chat" }); }
  }
  prev.current = { key, notes, conv, openReq, myOk, overdue: overdue.length };
 }, [db.v, key, tick]);
 useEffectK(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); }, [toast]);

 const setUi = p => setUI(o => ({ ...o, ...p }));
 const out = () => { setUi({ session: null, stack: [], tab: null, chatOpen: null }); if (KF_LIVE) KFDB.signOut(); };
 if (KF_LIVE && KFDB.loading) return <div className="kf"><div className="kf-screen"><KHeader></KHeader><p className="kf-hint" style={{ marginTop: 40 }}>Loading…</p></div></div>;
 if (KF_LIVE && !user && KFDB.needsSetup) return <div className="kf"><SetupScreen></SetupScreen></div>;
 if (!user) return <div className="kf"><ScanScreen onEnter={k => setUi({ session: k, tab: null, stack: [], chatOpen: null })}></ScanScreen></div>;
 if (user.status === "suspended") return <div className="kf"><div className="kf-screen"><KHeader></KHeader><div className="kf-start"><div className="kf-stack"><span className="kf-ok bad"><i></i>Access paused</span><h1 className="kf-h1">{user.name}</h1><p className="kf-lead">Your account has been paused by the team. Contact KartFreedom to restore access.</p></div><button className="kf-btn ghost" onClick={out}>Sign out</button></div></div></div>;

 const tabs = (KF_TABS[user.role] || KF_TABS.member).map(t => memExp && (t[0] === "progress" || t[0] === "photos") ? [t[0], t[1], t[2], 1] : t), tab = tabs.some(t => t[0] === ui.tab && !t[3]) ? ui.tab : tabs[0][0];
 const s = { ...ui, owned: db.owned, done: db.done, quiz: db.quiz, req: db.req };
 const set = p => { const dbp = {}, up = {}; Object.entries(p).forEach(([k, v]) => (KF_DBKEYS.includes(k) ? dbp : up)[k] = v); if (Object.keys(dbp).length) KFDB.update(d => Object.assign(d, dbp)); if (Object.keys(up).length) setUi(up); };
 const ctx = { s, db, set, user, key, owns, done: db.done[key] || {}, quiz: db.quiz[key] || {},
  go: t => setUi({ tab: t, stack: [] }), push: v => setUI(o => ({ ...o, stack: [...o.stack, v] })), pop: () => setUI(o => ({ ...o, stack: o.stack.slice(0, -1) })),
  replace: v => setUI(o => ({ ...o, stack: [...o.stack.slice(0, -1), v] })), reset: () => setUi({ stack: [] }), signOut: out };

 const isMem = user.role === "member", unread = kfUnread(db, key, owns);
 const body = tab === "home" ? (isMem ? <MemberHome ctx={ctx}></MemberHome> : <AcademyHome ctx={ctx}></AcademyHome>)
  : tab === "drivers" ? <RosterTab ctx={ctx}></RosterTab> : tab === "team" ? <TeamTab ctx={ctx}></TeamTab>
  : tab === "progress" ? <ProgressTab ctx={ctx}></ProgressTab> : tab === "photos" ? <PhotosTab ctx={ctx}></PhotosTab>
  : tab === "billing" ? <BillingTab ctx={ctx}></BillingTab>
  : tab === "academy" ? <AcademyTab ctx={ctx}></AcademyTab> : <ChatTab ctx={ctx}></ChatTab>;
 const top = ui.stack[ui.stack.length - 1];
 const V = top && ({ store: StoreView, checkout: CheckoutView, lesson: LessonView, quiz: QuizView, cert: CertView, id: IdView, join: JoinView, coach: CoachView, driver: DriverView, topicedit: TopicEditView, examedit: ExamEditView, sub: SubView })[top.t];
 const hdr = tab === "home" ? (isMem ? "Driver dashboard" : "Academy dashboard") : tabs.find(t => t[0] === tab)[1];

 return <div className={"kf role-" + user.role}>
  <div className="kf-screen kf-main">
   <nav className="kf-tabs">
    <div className="kf-rail-brand"><img src="assets/kf-mark.png" alt=""></img><b>KartFreedom</b></div>
    {tabs.map(([k, l, ic, lock]) => <button key={k} className={"kf-tab" + (tab === k ? " on" : "") + (lock ? " locked" : "")} onClick={() => lock ? ctx.push({ t: memExp ? "sub" : "join" }) : ctx.go(k)}>
     <span className="kf-tabic"><KIcon n={ic} s={22}></KIcon>{lock && <i><KIcon n="lock" s={10}></KIcon></i>}{k === "chat" && unread > 0 && <em className="kf-badge">{unread}</em>}{k === "billing" && openReq + overdue.length > 0 && <em className={"kf-badge" + (overdue.length ? " bad" : "")}>{openReq + overdue.length}</em>}</span><span>{l}</span></button>)}
    <button className="kf-rail-foot" onClick={() => ctx.push({ t: "id" })}><KAvatar u={user} s={36}></KAvatar><span><b>{user.name}</b><small>{KF.roles[user.role].label} · {user.id}</small></span></button>
   </nav>
   <div className="kf-content">
    <KHeader label={hdr} right={<button className="kf-idbtn" onClick={() => ctx.push({ t: "id" })}><KAvatar u={user} s={30}></KAvatar><span>{user.id}</span></button>}></KHeader>
    <div className={"kf-scroll" + (tab === "chat" ? " flex" : "")} key={tab}>{body}</div>
   </div>
  </div>
  {V && <div className="kf-over" key={ui.stack.length + top.t + (top.id || "")}><V ctx={ctx} {...top}></V></div>}
  {toast && <button className={"kf-toast" + (toast.bad ? " bad" : "")} onClick={() => { setToast(null); toast.go ? ctx.push(toast.go) : ctx.go(toast.tab); }}><span className={"kf-ok" + (toast.bad ? " bad" : "")}><i></i>{toast.t}</span><p>{toast.b}</p></button>}
 </div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<KFApp></KFApp>);
