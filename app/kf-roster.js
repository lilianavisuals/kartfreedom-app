// Team roster from the ID cards. Bump KF_ROSTER_V after editing so open apps re-sync.
window.KF_ROSTER_V = 2;
window.KF_ROSTER = [
 { key: "member:270001", role: "member", id: "KF-27-0001", name: "Jude Ellison", cls: "Micro", dob: "2019-06-20" },
 { key: "member:270002", role: "member", id: "KF-27-0002", name: "John Dickson", cls: "X30 Masters", dob: "1970-10-29" },
 { key: "member:270003", role: "member", id: "KF-27-0003", name: "Tanner Dickson-Hooper", cls: "X30 Senior", dob: "2026-11-24", photo: "assets/tanner-hq.jpg" },
 { key: "member:270004", role: "member", id: "KF-27-0004", name: "Bailey Matthews", cls: "KA100 Junior" },
 { key: "member:270005", role: "member", id: "KF-27-0005", name: "Cooper Gardner", cls: "LO206 Senior" },
 { key: "member:270006", role: "member", id: "KF-27-0006", name: "Harrison Holden", cls: "Micro" },
 { key: "member:270007", role: "member", id: "KF-27-0007", name: "Jacob Abarca", cls: "LO206 Cadet", dob: "2017-01-06" },
 { key: "member:270008", role: "member", id: "KF-27-0008", name: "Jesse Frazier", cls: "KA100 Junior", dob: "2013-01-31" },
 { key: "member:000001", role: "owner", id: "KF-00-0001", name: "Eugene Panenko", cls: "Owner · Coach", dob: "1982-08-06" },
 { key: "member:000003", role: "office", id: "KF-00-0003", name: "Dariia Bear", cls: "Manager" },
 { key: "member:000004", role: "coach", id: "KF-00-0004", old: "KF-ST-0001", name: "Alex Stanfield", cls: "Coach", dob: "2005-10-26" },
 { key: "member:000005", role: "mechanic", id: "KF-00-0005", old: "KF-ST-0002", name: "Emmanuel Espinal", cls: "Mechanic" },
 { key: "member:000006", role: "mechanic", id: "KF-00-0006", old: "KF-ST-0003", name: "Jacob Spencer", cls: "Mechanic", dob: "2009-10-05" }
];
// Upsert the roster into a KFDB state draft. Matches existing accounts by ID, then by name; never changes an existing login ID or access level.
window.kfSyncRoster = function (d, demo) {
 const U = d.users, find = r => Object.keys(U).find(k => [r.id, r.old].includes((U[k].id || "").toUpperCase())) || Object.keys(U).find(k => (U[k].name || "").trim().toLowerCase() === r.name.toLowerCase());
 let added = 0, updated = 0;
 KF_ROSTER.forEach(r => {
  const first = r.name.split(" ")[0], staff = r.role !== "member"; let k = find(r);
  if (k) { const u = U[k]; Object.assign(u, { name: r.name, first, cls: r.cls }); if (/^KF-ST-/i.test(u.id || "") && !u.auth_id) u.id = r.id; u.info = { ...(u.info || {}) }; if (r.dob) u.info.dob = r.dob; if (!u.photo && r.photo) u.photo = r.photo; updated++; return; }
  k = U[r.key] ? "member:" + r.id.replace(/\W/g, "").toLowerCase() : r.key;
  U[k] = { type: staff ? "staff" : "member", role: r.role, id: r.id, name: r.name, first, cls: r.cls, since: "2026", valid: staff ? "Staff" : "12 / 27", photo: r.photo || null, status: "active", info: r.dob ? { dob: r.dob } : {}, ...(staff ? {} : { coach: "Eugene" }) };
  if (demo && !staff) U[k].bill = { plan: "Membership · Yearly", rate: KF.membership.rate, per: "yr", due: Date.now() + 300 * 864e5, status: "active", method: "Zelle" };
  added++;
 });
 // Public month-day list so everyone can see birthdays without seeing private info.
 const bd = {}; Object.entries(U).forEach(([k, u]) => { const m = /(\d{2})-(\d{2})$/.exec((u.info && u.info.dob) || ""); if (m) bd[k] = m[1] + "-" + m[2]; });
 d.reminders = { ...(d.reminders || {}), bdays: bd }; d._set = 1;
 return { added, updated };
};
