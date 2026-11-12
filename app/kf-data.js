// KartFreedom app data. Prices, people and results are editable placeholders.
window.KF = (function(){
// Academy pricing. Member rates are placeholders: set your real member discount here.
const plans = {
 monthly: { label:"Monthly", regular:150, member:120, per:"mo" },
 yearly: { label:"Yearly", regular:1500, member:1200, per:"yr" }
};
const users = {
 "member:270001": { type:"member", id:"KF-27-0001", name:"Jude Ellison", first:"Jude", cls:"Micro", since:"2026", valid:"12 / 27", photo:"assets/jude-id-photo.jpg", hero:"assets/jude-action.jpg", coach:"Eugene" },
 "academy:270002": { type:"academy", id:"KFA-27-0002", name:"Avery Cole", first:"Avery", cls:"KA100 Jr", since:"2026", valid:"Lifetime", photo:null },
 "member:000001": { type:"staff", role:"owner", id:"KF-00-0001", name:"Eugene Panenko", first:"Eugene", cls:"Coach · Owner", since:"2020", valid:"Staff", photo:null },
 "member:000002": { type:"staff", role:"manager", id:"KF-00-0002", name:"KartFreedom HQ", first:"HQ", cls:"Owner · Media", since:"2020", valid:"Staff", photo:null },
 "member:270003": { type:"member", id:"KF-27-0003", name:"Rizvan Choudhry", first:"Rizvan", cls:"Micro", since:"2026", valid:"12 / 27", photo:null, coach:"Eugene" },
 "member:270004": { type:"member", id:"KF-27-0004", name:"Emmanuel", first:"Emmanuel", cls:"Shifter", since:"2026", valid:"12 / 27", photo:null, coach:"Eugene" },
 "member:270005": { type:"member", id:"KF-27-0005", name:"Alexander", first:"Alexander", cls:"X30 Sr", since:"2026", valid:"12 / 27", photo:null, coach:"Eugene" },
 "member:270006": { type:"member", id:"KF-27-0006", name:"Jeff Schaefer", first:"Jeff", cls:"KA100 Sr", since:"2026", valid:"12 / 27", photo:null, coach:"Eugene" }
};
const coachNotes = [
 { date:"Nov 08", session:"Practice · Jacksonville", verdict:"Gaining · −0.31 s on best", tone:"success", text:"Braking is cleaner. You released the brake earlier into T4 and kept 2 km/h more at the apex. Exit of T7 is still early on throttle: the kart scrubs and you lose the run to T8.", focus:["Brake release into T4: keep it","Wait one beat before throttle at T7","Look further up the road through T8"] },
 { date:"Nov 01", session:"Race day · Round 9", verdict:"Start · lost 2 places L1", tone:"warning", text:"Pace was there from L4, but the start cost you. Throttle came in late at the green and you were boxed on the inside. We drill starts this week.", focus:["Starts: 10 reps per session","Pick a lane before the flag"] },
 { date:"Oct 25", session:"Practice · Orlando", verdict:"Consistent · 0.18 s spread", tone:"info", text:"Best consistency this season. Ten laps inside two tenths. Next step is to find the extra tenth in the slow corners without losing that rhythm.", focus:["Slow corners: later turn-in","Keep the rhythm, add one change at a time"] }
];
const skills = [
 { k:"Braking", v:7.4, d:+0.6 }, { k:"Corner entry", v:6.8, d:+0.3 }, { k:"Corner exit", v:6.2, d:-0.1 },
 { k:"Racecraft", v:7.1, d:+0.4 }, { k:"Starts", v:5.9, d:+0.2 }, { k:"Consistency", v:8.2, d:+0.5 }, { k:"Feedback", v:7.0, d:+0.2 }
];
const sessions = [
 { date:"Sep 13", track:"Jacksonville", type:"Practice", best:"48.912" },
 { date:"Sep 27", track:"Jacksonville", type:"Practice", best:"48.704" },
 { date:"Oct 11", track:"Jacksonville", type:"Race", best:"48.655", pos:"P6" },
 { date:"Oct 25", track:"Jacksonville", type:"Practice", best:"48.531" },
 { date:"Nov 01", track:"Jacksonville", type:"Race", best:"48.488", pos:"P5" },
 { date:"Nov 08", track:"Jacksonville", type:"Practice", best:"48.177" }
];
const upcoming = [
 { date:"Nov 21", title:"Practice day", where:"Jacksonville", note:"Starts + T7 exit" },
 { date:"Dec 05", title:"Winter Series · Rd 1", where:"Jacksonville", note:"Race weekend · arrive Fri" }
];
const photos = [
 { src:"assets/jude-action.jpg", cap:"On track · Jacksonville" },
 { src:"assets/music-city-kart.jpg", cap:"Music City" },
 { src:"assets/jude-id-photo.jpg", cap:"Team portrait · 2026" }
];
const L = (id,t,min,body,pts)=>({id,t,min,body,pts});
const modules = [
 { id:"m1", t:"Foundations", sub:"Seat, controls, flags and your first clean lap.", lessons:[
  L("m1l1","Seating & controls",6,["Your seat position decides how much feel you get from the kart. Arms slightly bent at the top of the wheel, legs bent with the pedals at full travel.","Hands at a quarter to three. Grip light: a tight grip hides what the front tyres are telling you."],["Arms bent at the top of the wheel","Quarter to three, light grip","Pedals at full travel without locking the knee"]),
  L("m1l2","Flags & track etiquette",7,["Flags are instructions, not suggestions. Yellow means no passing and be ready to stop. Blue means a faster kart is coming: hold your line.","Raise a hand when you slow down or come into the pits. The driver behind can't read your mind."],["Yellow: no passing","Blue: hold your line, let them by","Hand up when slowing or pitting"]),
  L("m1l3","Your first clean lap",8,["A clean lap is smooth before it is fast. Use the full width of the track, one input at a time: brake, turn, then throttle.","Count reference points. A clean lap you can repeat ten times beats one fast lap you can't explain."],["One input at a time","Use the full track width","Repeat it ten times"])]},
 { id:"m2", t:"The racing line", sub:"Geometry, apexes and linking corners.", lessons:[
  L("m2l1","Outside, inside, outside",7,["The basic line opens the corner up: start wide, clip the inside, let the kart run wide again on exit. A bigger radius means more speed for the same grip.","The track is yours from kerb to kerb. Use all of it."],["Wide entry, inside apex, wide exit","Bigger radius = more speed","Kerb to kerb"]),
  L("m2l2","Apex types",8,["A late apex trades entry speed for a better exit. Use it before a straight. An early apex carries speed in but pushes you wide on exit.","Most kart corners reward a slightly late apex, because exit speed carries all the way down the next straight."],["Late apex before straights","Early apex costs the exit","Exit speed pays twice"]),
  L("m2l3","Linking corners",9,["In a sequence, the corner that leads onto the longest straight matters most. Give up a little in the first corner to be perfect in the last.","Think of the sequence as one shape, not three corners."],["Prioritise the last corner","Sacrifice early, gain late","One shape, not three corners"])]},
 { id:"m3", t:"Braking", sub:"Threshold, markers and trail braking.", lessons:[
  L("m3l1","Threshold braking",7,["Peak pressure comes first, then it bleeds off as speed drops. A kart only brakes the rear axle, so a lock-up shows up as the rear stepping out.","Find the limit by building up, lap by lap, not by stamping on the pedal."],["Peak first, then bleed off","Rear lock = rear steps out","Build up lap by lap"]),
  L("m3l2","Brake markers",6,["Pick a fixed marker: a kerb, a board, a seam in the tarmac. Move it a metre at a time.","Markers change with grip, fuel and tyres. Re-check them every session."],["Fixed, repeatable marker","Move it a metre at a time","Re-check every session"]),
  L("m3l3","Trail braking in a kart",9,["Releasing the brake gradually as you turn in loads the front tyres and helps the kart rotate. Release too fast and the kart pushes; too slow and it slides.","Smooth release is the skill. Practise it in one corner until it's automatic."],["Release as you turn in","Fast release = push, slow = slide","Master one corner first"])]},
 { id:"m4", t:"Kart setup", sub:"Tyres, gearing and chassis basics.", lessons:[
  L("m4l1","Tyre pressures",8,["Set pressures cold, check them hot. Higher pressure warms the tyre faster but reduces the contact patch.","Write every change down: pressure, temperature, lap time. Setup without notes is guessing."],["Set cold, check hot","Higher = faster warm-up, less grip","Log every change"]),
  L("m4l2","Gearing",7,["A bigger rear sprocket gives more acceleration and less top speed. Gear for the slowest corner that leads onto the longest straight.","Watch the RPM at the end of the main straight. Hitting the limit early means you need a smaller sprocket."],["Bigger sprocket = more pull","Gear for the key straight","Read RPM at the end of the straight"]),
  L("m4l3","Chassis adjustments",9,["Track width, ride height and seat position change how the kart transfers weight. Make one change at a time and run three laps before judging it.","If you can't feel the change, it was too small or the wrong one."],["One change at a time","Three laps before you judge","No feel = wrong change"])]},
 { id:"m5", t:"Racecraft", sub:"Starts, overtakes and defending.", lessons:[
  L("m5l1","Starts",7,["Pick your lane before the green. Watch the leader's kart, not the flag: you will react faster.","The first corner is won by exit speed, not by braking latest."],["Choose a lane early","Watch the leader, not the flag","Win the exit of T1"]),
  L("m5l2","Overtaking",8,["Set up the pass a corner early. Get a better exit, pull alongside on the straight and own the inside at the next braking zone.","A pass is only done when you're clear on exit."],["Set it up a corner early","Exit first, then the move","Done only when clear"]),
  L("m5l3","Defending",7,["Cover the inside once, early and clearly. Late or repeated moves are dangerous and get penalised.","Defending costs lap time. Sometimes the faster answer is to pull a gap."],["One clear move","Never late, never twice","Defending costs time"])]},
 { id:"m6", t:"Data & mindset", sub:"Reading data, debriefs and race-day routine.", lessons:[
  L("m6l1","Reading lap data",9,["Start with sector times: they show where the time is, before any graphs. Then compare speed traces corner by corner against your best lap.","Look for the biggest single loss first. Fix one thing."],["Sectors before graphs","Compare against your best lap","Fix the biggest loss first"]),
  L("m6l2","The debrief",6,["After each session: what the kart did, what you did, what you'll change. Three lines, every time.","Honest notes beat memory. Your coach can only help with what you tell them."],["Kart · driver · change","Three lines, every session","Tell the coach everything"]),
  L("m6l3","Race-day routine",8,["Same routine every event: sleep, food, water, walk the track, visualise a lap. Routine removes decisions so your head is free to race.","Nerves are normal. Breathe out longer than you breathe in before you strap in."],["Same routine every event","Walk the track, visualise a lap","Long breath out before the start"])]}
];
// Quizzes: each topic gets 5 questions, each unit a 10-question exam.
// Placeholder questions are generated from key points. To use your own, add quiz:[[question,[options],correctIndex],...] to a topic, or exam:[...] to a unit.
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const rng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const shuf = (arr, r) => { const x = arr.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const q = (text, right, wrong, r) => { const o = shuf([right, ...wrong], r); return [text, o, o.indexOf(right)]; };
const pool = modules.flatMap(m => m.lessons.flatMap(l => l.pts.map(p => ({ p, l: l.id }))));
modules.forEach(m => {
 m.lessons.forEach(l => {
  l.worksheet = l.t + " worksheet";
  if (l.quiz) return;
  const r = rng(hash(l.id)), others = shuf(pool.filter(x => x.l !== l.id), r).map(x => x.p);
  const sib = m.lessons.filter(x => x.id !== l.id);
  l.quiz = [
   ...l.pts.map((p, k) => q("Which is a key point of “" + l.t + "”?", p, [others[k * 2], others[k * 2 + 1]], r)),
   ...sib.map(s => q("“" + s.pts[0] + "” belongs to which topic?", s.t, m.lessons.filter(x => x.id !== s.id).map(x => x.t), r))
  ].slice(0, 5);
 });
 if (!m.exam) { const r = rng(hash(m.id)); m.exam = shuf(m.lessons.flatMap(l => l.quiz), r).slice(0, 10); }
});
const pass = { topic: 4, exam: 8 };
const allLessons = modules.flatMap(m=>m.lessons.map(l=>({...l,m:m.id,mt:m.t})));
const setup = [
 { date:"Nov 08", track:"Jacksonville", gear:"10 / 81", tyres:"9.5 / 9.0 psi cold", chassis:"Rear width 1,385 mm · seat std", note:"Better rotation in T4. Slight push mid T7." },
 { date:"Nov 01", track:"Jacksonville", gear:"10 / 80", tyres:"10.0 / 9.5 psi cold", chassis:"Rear width 1,390 mm", note:"Good top speed, weak off the hairpin." },
 { date:"Oct 25", track:"Orlando", gear:"10 / 82", tyres:"9.5 / 9.0 psi cold", chassis:"Front ride height +5 mm", note:"Stable. Kept for next round." }
];
const chat = {
 general: { t:"General", who:"all", msgs:[ { u:"Coach Eugene", m:"Practice day Nov 21 at Jacksonville. Gates 7:30, first session 9:00." }, { u:"Mia R.", m:"Is anyone bringing a spare 10-tooth sprocket?" }, { u:"Carter J.", m:"I have two. Find me in the paddock." } ] },
 academy: { t:"Academy", who:"academy", msgs:[ { u:"Leo P.", m:"Unit 3 exam: the trail braking questions are the tricky ones." }, { u:"Sam K.", m:"Re-read the key points before it. Passed second try." } ] },
 members: { t:"Members", who:"member", msgs:[ { u:"Coach Eugene", m:"Winter Series Rd 1 entries close Nov 28. Confirm with me by then." }, { u:"Rizvan C.", m:"Confirmed for Micro." } ] }
};
// Access levels. rank decides who can manage whom; can[] lists features.
const roles = {
 owner:{ label:"Owner · Coach", rank:5, can:["admin","coach","roster","academy","academy:edit","media","billing","chat:all"] },
 manager:{ label:"Owner · Media", rank:5, can:["admin","roster","academy","academy:edit","media","billing","chat:all"] },
 coach:{ label:"Coach", rank:4, can:["coach","roster","academy","academy:edit","media","chat:all"] },
 staff:{ label:"Team staff", rank:3, can:["roster","academy","chat:all"] },
 member:{ label:"Member", rank:2, can:["dashboard","photos"] },
 academy:{ label:"Academy", rank:1, can:[] }
};
const membership = { label:"Membership", rate:777, per:"yr" }; // yearly membership, paid by Zelle
return { roles, membership, plans, setup, chat, pass, users, coachNotes, skills, sessions, upcoming, photos, modules, allLessons };
})();
