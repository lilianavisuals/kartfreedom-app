const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

function kfDecode(img, w, h) {
 const d = img.data, cls = new Uint8Array(w * h);
 for (let i = 0, p = 0; i < w * h; i++, p += 4) { const r = d[p], g = d[p + 1], b = d[p + 2];
  if (Math.min(r, g) - b > 38 && r > 75 && g > 85) cls[i] = 1; else if (b - g > 55 && r - g > 40 && r > 120) cls[i] = 3; else if (r > 165 && g > 165 && b > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 50) cls[i] = 2; }
 const row = new Float32Array(h); for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) if (cls[y * w + x]) c++; row[y] = c; }
 let mn = Infinity, mx = 0; for (const c of row) { mn = Math.min(mn, c); mx = Math.max(mx, c); }
 if (mx - mn < w * .08) return { err: "none" };
 const th = mn + (mx - mn) * .22; let bands = [], s = -1;
 for (let y = 0; y <= h; y++) { const on = y < h && row[y] > th; if (on && s < 0) s = y; if (!on && s >= 0) { bands.push({ y0: s, y1: y - 1 }); s = -1; } }
 bands = bands.filter(b => b.y1 - b.y0 < h * .12);
 for (let i = 1; i < bands.length; i++) if (bands[i].y0 - bands[i - 1].y1 <= 1) { bands[i - 1].y1 = bands[i].y1; bands.splice(i--, 1); }
 if (bands.length !== 9) return { err: "Found " + bands.length + " of 9 lines" };
 const minRun = Math.max(4, w * .04);
 const leftOf = y => { for (let x = 0; x < w; x++) { if (!cls[y * w + x]) continue; let e = x, gap = 0; for (let k = x; k < w && gap <= 2; k++) { if (cls[y * w + k]) { e = k; gap = 0; } else gap++; } if (e - x >= minRun) return x; } return -1; };
 const rightOf = (y, x0) => { let e = x0, gap = 0; for (let k = x0; k < w && gap <= 3; k++) { if (cls[y * w + k] === 1 || cls[y * w + k] === 3) { e = k; gap = 0; } else gap++; } return e; };
 const med = a => { a = a.filter(n => n >= 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : -1; };
 const L = [], R = [];
 bands.forEach((b, i) => { const ls = [], rs = []; for (let y = b.y0; y <= b.y1; y++) { const l = leftOf(y); ls.push(l); if (i > 0 && i < 8 && l >= 0) rs.push(rightOf(y, l)); } L.push(med(ls)); if (i > 0 && i < 8) R.push(Math.max(...rs, -1)); });
 if (L.some(n => n < 0)) return { err: "Line edge not found" };
 const right = med(R), ref0 = right - L[0], ref8 = right - L[8];
 if (ref0 < w * .25 || ref8 < w * .25) return { err: "Move closer" };
 if (Math.abs(ref0 - ref8) / Math.max(ref0, ref8) > .25) return { err: "Hold the phone straight" };
 const digits = []; let worst = 0;
 for (let i = 1; i < 8; i++) { const ref = ref0 + (ref8 - ref0) * i / 8, r = (right - L[i]) / ref, f = (r * 100 - 30) / 7, n = Math.round(f); worst = Math.max(worst, Math.abs(f - n)); digits.push(Math.min(9, Math.max(0, n))); }
 const body = digits.slice(0, 6), chk = digits[6], sum = body.reduce((a, b) => a + b, 0);
 let yl = 0, vl = 0; for (let i = 0; i < w * h; i++) { if (cls[i] === 1) yl++; else if (cls[i] === 3) vl++; }
 const kind = vl > yl ? "academy" : "member";
 return { digits, body: body.join(""), kind, ok: chk === sum % 10 && worst < .42 };
}

function kfSynth(cv, code, kind) {
 const W = 640, H = 200, x = cv.getContext("2d", { willReadFrequently: true }); cv.width = W; cv.height = H;
 x.fillStyle = "#2a0b3a"; x.fillRect(0, 0, W, H);
 const right = 560, ref = 420, top = 30, step = (H - 60) / 8; x.fillStyle = "#0a0208"; x.fillRect(right, 0, W - right, H);
 kfBars(code, kind).forEach((b, i) => { const len = ref * b / 100 * (1 + .04 * (i / 8 - .5)), y = top + i * step, g = x.createLinearGradient(right - len, 0, right, 0);
  if (i === 0 || i === 8) { g.addColorStop(0, "#fff"); g.addColorStop(1, "rgba(255,255,255,.35)"); } else { const c = kind === "academy" ? "232,121,249" : "215,255,58"; g.addColorStop(0, "rgb(" + c + ")"); g.addColorStop(1, "rgba(" + c + ",.5)"); }
  x.fillStyle = g; x.fillRect(right - len, y, len, i === 0 || i === 8 ? 4 : 6); });
 const im = x.getImageData(0, 0, W, H); for (let p = 0; p < im.data.length; p += 4) { const n = (Math.random() - .5) * 30; im.data[p] += n; im.data[p + 1] += n; im.data[p + 2] += n; }
 x.putImageData(im, 0, 0); return kfDecode(im, W, H);
}

function kfParseId(t) {
 const m = t.trim().toUpperCase().match(/^(KFA|KF)[\s-]?(\d{2})[\s-]?(\d{4})$/);
 return m ? { body: m[2] + m[3], kind: m[1] === "KFA" ? "academy" : "member" } : null;
}

function ScanScreen({ onEnter }) {
 const [phase, setPhase] = useStateS("start");
 const [msg, setMsg] = useStateS("");
 const [hit, setHit] = useStateS(null);
 const [locked, setLocked] = useStateS(false);
 const [manual, setManual] = useStateS("");
 const [mErr, setMErr] = useStateS("");
 const vRef = useRefS(), gRef = useRefS(), demoCv = useRefS(), R = useRefS({ on: false, hist: [], last: 0, paused: false, stream: null, work: document.createElement("canvas") });

 const [pass, setPass] = useStateS(""), [pErr, setPErr] = useStateS(""), [busy, setBusy] = useStateS(false);
 const found = async (body, kind) => {
  R.current.paused = true;
  const id = (kind === "academy" ? "KFA-" : "KF-") + body.slice(0, 2) + "-" + body.slice(2); let key = kind + ":" + body, user = null;
  try { const L = await KFDB.lookup(id); if (L) { key = L.key; user = { name: L.name || L.first, cls: L.cls, status: L.status, role: L.role, type: L.type }; } } catch (e) { setMsg("Can't reach the server. Check your connection."); setMErr("Can't reach the server. Check your connection."); R.current.paused = false; return; }
  setPass(""); setPErr(""); setHit({ key, user, id, kind }); if (navigator.vibrate) navigator.vibrate(60);
 };
 const stop = () => { const r = R.current; r.on = false; if (r.stream) r.stream.getTracks().forEach(t => t.stop()); r.stream = null; };
 useEffectS(() => stop, []);

 const frame = t => { const r = R.current; if (!r.on) return; requestAnimationFrame(frame);
  const v = vRef.current, g = gRef.current; if (r.paused || t - r.last < 90 || !v || !v.videoWidth) return; r.last = t;
  const vw = v.videoWidth, vh = v.videoHeight, cw = v.clientWidth, ch = v.clientHeight, s = Math.max(cw / vw, ch / vh), ox = (cw - vw * s) / 2, oy = (ch - vh * s) / 2;
  const gb = g.getBoundingClientRect(), vr = v.getBoundingClientRect(), sx = (gb.left - vr.left - ox) / s, sy = (gb.top - vr.top - oy) / s, sw = gb.width / s, sh = gb.height / s;
  const W = 640, H = Math.round(W * sh / sw), wk = r.work, wc = wk.getContext("2d", { willReadFrequently: true }); wk.width = W; wk.height = H; wc.drawImage(v, sx, sy, sw, sh, 0, 0, W, H);
  const res = kfDecode(wc.getImageData(0, 0, W, H), W, H);
  if (res.err) { setMsg(res.err === "none" ? "" : res.err + "…"); setLocked(false); r.hist = []; return; }
  if (!res.ok) { setMsg("Almost. Hold steady…"); r.hist = []; return; }
  setLocked(true); setMsg("Reading " + res.body.slice(0, 2) + "-" + res.body.slice(2) + "…");
  r.hist.push(res.kind + res.body); if (r.hist.length > 3) r.hist.shift();
  if (r.hist.length === 3 && r.hist.every(x => x === r.hist[0])) found(res.body, res.kind);
 };

 const startCam = async () => { setPhase("camera"); setMsg(""); R.current.paused = false;
  try { const st = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
   R.current.stream = st; vRef.current.srcObject = st; await vRef.current.play(); R.current.on = true; requestAnimationFrame(frame);
  } catch (e) { setMsg("Camera unavailable. Open the app over https on your phone and allow camera access, or enter your ID."); }
 };
 const demo = (code, kind) => { stop(); setPhase("demo"); setLocked(false); setMsg("Reading demo card…"); setHit(null);
  setTimeout(() => { const res = kfSynth(demoCv.current, code, kind); setLocked(true); setTimeout(() => res.ok ? found(res.body, res.kind) : setMsg("Checksum failed"), 650); }, 350);
 };
 const submitManual = e => { e.preventDefault(); const p = kfParseId(manual); if (!p) { setMErr("Use your Academy login ID, e.g. KFA-27-0002"); return; } if (p.kind !== "academy" && !p.body.startsWith("00")) { setMErr("Member and staff IDs can't be typed in. Scan your printed KartFreedom card instead."); return; } setMErr(""); found(p.body, p.kind); };
 const reset = () => { setHit(null); setLocked(false); R.current.hist = []; R.current.paused = false; if (phase === "demo") setPhase("start"); };

 const scanning = phase === "camera" || phase === "demo";
 return <div className="kf-screen kf-scan">
  {phase === "camera" && <video ref={vRef} playsInline muted autoPlay></video>}
  {phase === "demo" && <div className="kf-demobg"></div>}
  <KHeader label="KartFreedom" right={<span className="kf-hdr-k">{scanning ? "Scan" : "Sign in"}</span>}></KHeader>
  {scanning && <>
   <div ref={gRef} className={"kf-guide" + (locked ? " ok" : "")}><div className="edge"></div>{phase === "demo" && <canvas ref={demoCv}></canvas>}</div>
   <div className="kf-scanbot">
    <p className="kf-lead">{msg || <>Fit the <em>speed lines</em> (yellow or lilac) inside the frame. Line up the card's right edge with the dashed line.</>}</p>
    <div className="kf-row"><button className="kf-btn ghost" onClick={() => { stop(); setPhase("start"); }}>Cancel</button><button className="kf-btn ghost" onClick={() => { stop(); setPhase("manual"); }}><KIcon n="keys" s={16}></KIcon>Academy ID</button></div>
   </div>
  </>}
  {phase === "start" && <div className="kf-start">
   <img src="assets/kf-letters-white.png" alt="" className="kf-bgletters"></img>
   <div className="kf-stack">
    <span className="kf-eyebrow">Members · Academy · Team</span>
    <h1 className="kf-h1">Scan your<br></br><em>card</em></h1>
    <p className="kf-lead">Hold the speed lines on the back of your KartFreedom card inside the frame. Your dashboard opens when it verifies.</p>
   </div>
   <div className="kf-stack g12">
    <button className="kf-btn solid" onClick={startCam}><KIcon n="camera" s={18}></KIcon>Start camera</button>
    <button className="kf-btn" onClick={() => setPhase("manual")}><KIcon n="keys" s={18}></KIcon>Enter Academy ID</button>
   </div>
   <button className="kf-card kf-dlrow kf-buyrow" onClick={() => setPhase("buy")}><KIcon n="cap"></KIcon><div><b>No ID? Get the Academy</b><small>For drivers who aren't members · from {kfMoney(KF.plans.monthly.regular)}/mo</small></div><KIcon n="right" s={18}></KIcon></button>
   {!KF_LIVE && <div className="kf-stack g10">
    <span className="kf-lbl">Demo cards</span>
    <div className="kf-chips"><button onClick={() => demo("270001", "member")}>Member · KF-27-0001</button><button onClick={() => demo("270002", "academy")}>Academy · KFA-27-0002</button><button onClick={() => demo("000001", "member")}>Coach · KF-00-0001</button><button onClick={() => demo("000002", "member")}>Owner · Media · KF-00-0002</button><button onClick={() => demo("279990", "member")}>Unknown card</button></div>
   </div>}
  </div>}
  {phase === "buy" && <GuestBuyView onBack={() => setPhase("start")}></GuestBuyView>}
  {phase === "manual" && <form className="kf-start" onSubmit={submitManual}>
   <div className="kf-stack">
    <span className="kf-eyebrow" style={{ color: "var(--orchid)" }}>Academy drivers</span>
    <h1 className="kf-h1">Enter your<br></br><em>login ID</em></h1>
    <p className="kf-lead">The KFA number the team sent you. Members sign in by scanning their printed card.</p>
   </div>
   <label className="kf-field"><span className="kf-lbl">Academy login ID</span><input value={manual} onChange={e => setManual(e.target.value)} placeholder="KFA-27-0002" autoCapitalize="characters" autoComplete="off" spellCheck="false"></input>{mErr && <small>{mErr}</small>}</label>
   <div className="kf-stack g12"><button className="kf-btn solid" type="submit">Verify</button><button className="kf-btn ghost" type="button" onClick={() => setPhase("start")}>Back to scan</button></div>
  </form>}
  <KSheet open={!!hit} onClose={reset}>
   {hit && (hit.user && hit.user.status === "suspended" ? <>
    <span className="kf-ok bad"><i></i>Access paused</span>
    <div><span className="kf-lbl">Driver</span><h2 className="kf-h2">{hit.user.name}</h2></div>
    <p className="kf-lead">This account is paused. Contact the KartFreedom team to restore access.</p>
    <button className="kf-btn ghost" onClick={reset}>Back</button>
   </> : hit.user ? <>
    <span className={"kf-ok" + (hit.kind === "academy" ? " lilac" : "")}><i></i>{kfStaff(hit.user) ? KF.roles[hit.user.role].label + " verified" : hit.kind === "academy" ? "Academy access verified" : "Member verified"}</span>
    <div><span className="kf-lbl">Driver</span><h2 className="kf-h2">{hit.user.name}</h2></div>
    <div className="kf-g2"><div><span className="kf-lbl">{hit.kind === "academy" ? "Academy no." : "Member no."}</span><b>{hit.id}</b></div><div><span className="kf-lbl">Class</span><b>{hit.user.cls}</b></div></div>
    {KF_LIVE ? <form className="kf-stack g12" onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setPErr(""); try { await KFDB.signIn(hit.id, pass); stop(); onEnter(hit.key); } catch (er) { setPErr(er.message); } setBusy(false); }}>
     <label className="kf-field"><span className="kf-lbl">Passcode</span><input type="password" inputMode="numeric" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="••••••" autoFocus></input>{pErr && <small>{pErr}</small>}</label>
     <button className="kf-btn solid" disabled={pass.length < 6 || busy}>{busy ? "Signing in…" : "Sign in"}<KIcon n="right" s={18}></KIcon></button>
     <p className="kf-hint">Forgot it? Ask Eugene to set a new passcode.</p></form>
    : <button className="kf-btn solid" onClick={() => { stop(); onEnter(hit.key); }}>Open dashboard<KIcon n="right" s={18}></KIcon></button>}
    <button className="kf-btn ghost" onClick={reset}>Scan again</button>
   </> : <>
    <span className="kf-ok bad"><i></i>Card not on file</span>
    <div><span className="kf-lbl">Code read</span><h2 className="kf-h2">{hit.id}</h2></div>
    <p className="kf-lead">The code is valid but no driver is registered to it. Contact the team.</p>
    <button className="kf-btn" onClick={() => { reset(); setPhase("buy"); }}>Get the Academy</button>
    <button className="kf-btn ghost" onClick={reset}>Try again</button>
   </>)}
  </KSheet>
 </div>;
}

function SetupScreen() {
 const [f, setF] = useStateS({ hq: "KartFreedom HQ", e1: "", e2: "", h1: "", h2: "" }), [err, setErr] = useStateS(""), [busy, setBusy] = useStateS(false);
 const P = k => e => setF({ ...f, [k]: e.target.value.replace(/\D/g, "").slice(0, 12) });
 const ok = f.hq.trim() && f.e1.length >= 8 && f.e1 === f.e2 && f.h1.length >= 8 && f.h1 === f.h2 && f.e1 !== f.h1;
 const go = async e => { e.preventDefault(); if (!ok || busy) return; setBusy(true); setErr(""); try { await KFDB.bootstrap({ hqName: f.hq.trim(), eugPass: f.e1, hqPass: f.h1 }); } catch (er) { setErr(er.message || String(er)); setBusy(false); } };
 return <div className="kf-screen"><KHeader label="KartFreedom" right={<span className="kf-hdr-k">Setup</span>}></KHeader>
  <form className="kf-start kf-buy" onSubmit={go}>
   <div className="kf-stack"><span className="kf-eyebrow">First-time setup</span><h1 className="kf-h1">Create the<br></br><em>owners</em></h1><p className="kf-lead">The database is empty. Set passcodes for the two owner accounts. Everyone else is added from Accounts afterwards.</p></div>
   <div className="kf-card kf-stack g12"><span className="kf-lbl lilac">Eugene Panenko · KF-00-0001 · Owner · Coach</span>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Passcode · 8+ digits</span><input type="password" inputMode="numeric" value={f.e1} onChange={P("e1")}></input></label><label className="kf-field"><span className="kf-lbl">Repeat</span><input type="password" inputMode="numeric" value={f.e2} onChange={P("e2")}></input></label></div></div>
   <div className="kf-card kf-stack g12"><span className="kf-lbl lilac">KF-00-0002 · Owner · Media</span>
    <label className="kf-field"><span className="kf-lbl">Account name</span><input value={f.hq} onChange={e => setF({ ...f, hq: e.target.value })}></input></label>
    <div className="kf-g2"><label className="kf-field"><span className="kf-lbl">Passcode · 8+ digits</span><input type="password" inputMode="numeric" value={f.h1} onChange={P("h1")}></input></label><label className="kf-field"><span className="kf-lbl">Repeat</span><input type="password" inputMode="numeric" value={f.h2} onChange={P("h2")}></input></label></div></div>
   {err && <p className="kf-warn">{err}</p>}
   <button className="kf-btn solid" disabled={!ok || busy}>{busy ? "Setting up…" : "Create owner accounts"}</button>
   <p className="kf-hint">You'll be signed in as KF-00-0002. Eugene signs in by scanning his card (or KF-00-0001) with his passcode.</p>
  </form></div>;
}

Object.assign(window, { ScanScreen, SetupScreen, kfDecode });
