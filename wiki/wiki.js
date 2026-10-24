// Game web wiki (name comes from scripts/brand.gd via the export). Hash-routed single page; every number comes
// from data/wiki-data.js, which tools/wiki/ exports from the game scripts.
"use strict";
const D = window.WIKI_DATA;
const G = D.game;
const C = G.catalog;
const B = G.brand;
const $ = (s, el = document) => el.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct = v => (v >= 0.1 || v === 0 ? Math.round(v * 100) : +(v * 100).toFixed(1)) + "%";
const enc = encodeURIComponent;

// ---------- labels ----------
const ZONE_TH = {"Arrival Meadow":"ทุ่งแสงแรก","Whispering Grove":"ป่ากระซิบ","Old Watch Ruins":"ซากป้อมเก่า","Sunfall Strand":"ชายหาดสุริยา","Mirrorlake Vale":"ทะเลสาบกระจก"};
const JOB_TH = {Novice:"ผู้เดินทาง",Swordsman:"นักดาบ",Mage:"นักเวท",Archer:"นักธนู",Acolyte:"ผู้เยียวยา",Merchant:"พ่อค้า",Thief:"โจร"};
const SIZE_TH = {Small:"เล็ก",Medium:"กลาง",Large:"ใหญ่"};
const TYPE_TH = {equipment:"อุปกรณ์",consumable:"ใช้ได้",material:"วัตถุดิบ",card:"การ์ด",quest:"ของเควสต์",cosmetic:"แฟชั่น"};
const SLOT_TH = {weapon:"อาวุธ",armor:"ชุดเกราะ",shield:"โล่",headgear:"หมวก",boots:"รองเท้า",cloak:"ผ้าคลุม",accessory1:"เครื่องประดับ",accessory2:"เครื่องประดับ",ammunition:"กระสุน"};
const SKILL_TYPE_TH = {passive:"ติดตัว",buff:"บัฟ",heal:"ฟื้นฟู",heal_aoe:"ฟื้นฟูเป็นวง",burst:"ท่าไม้ตาย",melee:"ประชิด",ranged:"ระยะไกล",magic:"เวทมนตร์",aoe:"โจมตีเป็นวง",slow:"ลดความเร็ว",guard:"ป้องกัน",taunt:"ยั่วยุ",evade:"หลบหลีก",poison:"พิษ",cleanse:"ล้างสถานะ"};
const PANEL_TH = {quests:"รับ–ส่งเควสต์และเส้นเรื่องหลัก",jobs:"เปลี่ยนอาชีพ · ดูสายสกิล",healer:"ฟื้น HP/SP เต็ม · บันทึกจุดเกิด",shop:"ซื้อ–ขายอุปกรณ์และยา",forge:"คราฟต์อาวุธ · ตีบวกอุปกรณ์",storage:"คลังฝากของ",event:"อีเวนต์ ระฆังที่ไม่เคยดัง",aid:"เหตุการณ์ช่วยผู้สำรวจในป่ากระซิบ",inscription:"จุดสำรวจจารึก",repair:"จุดซ่อมโคม",trial:"ทางเข้าลานบอสอารุน"};
const STAT_TH = {atk:"ATK",matk:"MATK",def:"DEF",mdef:"MDEF",hit:"HIT",flee:"FLEE",crit:"CRIT",max_hp:"Max HP",max_sp:"Max SP"};
const ART_STATUS = {current:["มีในเกม","jade"],planned:["วางแผนไว้","violet"],collection_only:["สมุดสะสมเท่านั้น","violet"]};
const elTh = e => G.elements.thai[G.elements.list.indexOf(e)] || e;
const elPill = e => `<span class="pill el-${esc(e)}">${esc(elTh(e))}</span>`;
const zoneName = z => ZONE_TH[z] ? `${z} · ${ZONE_TH[z]}` : z;
const zoneLevel = z => { const m = /Lv\.(\d+)/.exec(G.zones[z]?.range || ""); return m ? +m[1] : 0; };
const itemName = id => C.items[id]?.name || id;
const jobArtId = j => "job/" + j.toLowerCase();
const npcBaseName = n => n.split(" · ")[0];

// ---------- art helpers ----------
function icon(key, size = 40, cls = "") {
  const ic = D.icons[key];
  if (!ic) return `<span class="icon ph ${cls}" style="width:${size}px;height:${size}px" aria-hidden="true">◇</span>`;
  const sh = D.sheets[ic.sheet], [x, y, w, h] = ic.rect, k = size / Math.max(w, h);
  return `<span class="icon ${cls}" aria-hidden="true" style="width:${size}px;height:${size}px;background-image:url('${sh.file}');background-size:${sh.width * k}px ${sh.height * k}px;background-position:${-x * k + (size - w * k) / 2}px ${-y * k + (size - h * k) / 2}px"></span>`;
}
const art = id => D.art[id];
function thumb(artId, fallbackIcon) {
  const a = art(artId);
  if (a) return `<span class="thumb"><img src="${a.thumb}" alt="" loading="lazy" decoding="async"></span>`;
  return fallbackIcon ? icon(fallbackIcon, 44) : `<span class="thumb dim">◇</span>`;
}
function stage(artId, alt, fallbackIcon) {
  const a = art(artId);
  if (a) return `<div class="stage" data-zoom="${esc(artId)}" role="button" tabindex="0" aria-label="ดูภาพใหญ่ ${esc(alt)}"><img src="${a.thumb}" alt="${esc(alt)}" decoding="async"></div>`;
  return `<div class="stage noclick">${fallbackIcon && D.icons[fallbackIcon] ? icon(fallbackIcon, 220) : `<span class="noart">ยังไม่มีภาพตัวละคร</span>`}</div>`;
}
function artNote(artId) {
  const a = art(artId);
  if (!a) return "";
  const [label, tone] = ART_STATUS[a.status] || [a.status, ""];
  return `<span class="pill ${tone}">ภาพ: ${esc(label)}</span>`;
}

// ---------- derived indexes ----------
const monsterZones = {};
for (const [z, row] of Object.entries(G.zones)) for (const k of row.monsters) (monsterZones[k] ||= []).push(z);
const monsterFloors = {};
G.dungeon.floors.forEach((f, i) => f.spawns.forEach(([k, lv]) => { (monsterFloors[k] ||= new Map()).set(i, {floor: f.name, lv, elite: !!f.elite}); }));
const bossById = Object.fromEntries(G.bosses.map(b => [b.id, b]));
const cardById = Object.fromEntries(G.cards.map(c => [c.id, c]));
const npcZone = {};
for (const [z, row] of Object.entries(G.zones)) for (const n of row.npcs) npcZone[n] = z;

function sourcesOf(itemId) {
  const out = [];
  for (const [k, m] of Object.entries(G.monsters)) for (const d of m.drops) if (d.id === itemId) out.push({kind: "monster", id: k, name: m.name, chance: d.chance});
  for (const b of G.bosses) if (b.id === "aruun") for (const d of b.drops) if (d.id === itemId) out.push({kind: "boss", id: b.id, name: b.name, chance: d.chance});
  for (const b of G.bosses) for (const p of b.personal || []) if (p.id === itemId) out.push({kind: "boss", id: b.id, name: b.name + " (รางวัลส่วนตัว)", chance: 1});
  for (const [q, row] of Object.entries(C.quests)) if (row.items[itemId]) out.push({kind: "quest", id: q, name: row.name, qty: row.items[itemId]});
  if (G.dungeon.reward.items[itemId]) out.push({kind: "dungeon", name: "Bell Depths (เคลียร์รายวัน)", qty: G.dungeon.reward.items[itemId]});
  if (G.dungeon.reward.card === itemId) out.push({kind: "dungeon", name: "Bell Depths (เคลียร์รายวัน)", chance: G.dungeon.reward.card_chance});
  for (const [r, row] of Object.entries(C.recipes)) if (row.output === itemId) out.push({kind: "recipe", id: r, name: row.name, qty: row.qty});
  return out;
}
const usesOf = itemId => {
  const out = [];
  for (const row of Object.values(C.recipes)) if (row.inputs[itemId]) out.push(`วัตถุดิบ <b>${esc(row.name)}</b> ×${row.inputs[itemId]}`);
  for (const p of G.pets) if (p.egg === itemId) out.push(`ใช้ ${p.egg_qty} ชิ้นฟักสัตว์เลี้ยง <a href="#/pets">${esc(p.name)}</a>`);
  for (const q of Object.values(C.quests)) if (q.objectives[itemId]) out.push(`เป้าหมายเควสต์ <a href="#/quests">${esc(q.name)}</a> ×${q.objectives[itemId]}`);
  return out;
};

const LM_TH = {waypoint:"จุดวาร์ป",statue:"รูปปั้นลูนาร่า",chest:"หีบสมบัติ",mote:"Lunar Mote",viewpoint:"จุดชมวิว",camp:"แคมป์มอนสเตอร์",puzzle:"ปริศนา",brazier:"เตาไฟปริศนา",discovery:"จุดค้นพบ",gate:"ประตูดันเจี้ยน"};
const TIER_TH = {common:"ธรรมดา",exquisite:"ประณีต",precious:"ล้ำค่า"};
const landmarksIn = z => G.landmarks.filter(l => l.region === z);
const rewardText = r => [r.lumen ? `${r.lumen} Lumen` : "", r.base ? `Base ${r.base}` : "", r.job ? `Job ${r.job}` : "", ...Object.entries(r.items || {}).map(([k, n]) => `<a href="#/item/${k}">${esc(itemName(k))} ×${n}</a>`)].filter(Boolean).join(" · ");
function landmarkSummary(z) {
  const rows = landmarksIn(z); if (!rows.length) return "";
  const count = {}; rows.forEach(l => count[l.kind] = (count[l.kind] || 0) + 1);
  const chests = rows.filter(l => l.kind === "chest"), camps = rows.filter(l => l.kind === "camp"), views = rows.filter(l => l.kind === "viewpoint");
  return `<section class="section"><h2>สำรวจ <small>${rows.length} จุดในพื้นที่</small></h2>
    <div class="tags">${Object.entries(count).map(([k, n]) => `<span class="pill gold">${esc(LM_TH[k] || k)} ×${n}</span>`).join("")}</div>
    ${chests.length ? `<p class="muted">หีบ: ${Object.entries(chests.reduce((a, c) => (a[c.tier] = (a[c.tier] || 0) + 1, a), {})).map(([t, n]) => `${TIER_TH[t] || t} ×${n}`).join(" · ")}${chests.some(c => c.camp) ? " · บางหีบล็อกจนกว่าจะเคลียร์แคมป์" : ""}${chests.some(c => c.puzzle) ? " · บางหีบซ่อนจนกว่าจะไขปริศนา" : ""}</p>` : ""}
    ${camps.map(c => `<p class="note">แคมป์ <b style="color:var(--ink)">${esc(c.id)}</b>: ${c.spawns.map(([k, , lv]) => `<a href="#/monster/${k}">${esc(G.monsters[k]?.name || k)} Lv.${lv}</a>`).join(", ")} · เคลียร์แล้วเปิดหีบล้ำค่าได้</p>`).join("")}
    ${views.map(v => `<div class="note">${esc(v.lore)}</div>`).join("")}
    ${G.open_world.region_cards[z] ? `<p class="muted">การ์ดประจำพื้นที่: <a href="#/item/${G.open_world.region_cards[z]}">${esc(itemName(G.open_world.region_cards[z]))}</a></p>` : ""}</section>`;
}

function monsterHp(kind, level) {
  if (kind === "moonfang") return "1,450";
  if (kind === "aruun") return "1,100 (+480/ผู้เล่นเพิ่ม)";
  return (55 + level * 12).toLocaleString();
}
const monsterExp = lv => ({base: 18 + lv * 18, job: 15 + lv * 5, lumen: 5 + lv * 2});

// ---------- search ----------
const INDEX = [];
function addIndex(title, sub, href, pic, extra = "") { INDEX.push({title, sub, href, pic, hay: (title + " " + sub + " " + extra).toLowerCase()}); }
for (const [j, row] of Object.entries(C.jobs)) addIndex(`${JOB_TH[j]} / ${j}`, "อาชีพ", `#/job/${j}`, thumb(jobArtId(j)), row.skills.join(" "));
for (const [id, s] of Object.entries(C.skills)) addIndex(s.name, `สกิล · ${s.job}`, `#/skill/${id}`, icon("skill/" + id, 44), id);
for (const [k, m] of Object.entries(G.monsters)) addIndex(m.name, `มอนสเตอร์ Lv.${m.level}`, `#/monster/${k}`, thumb("monster/" + k, "monster/" + k), k + " " + (art("monster/" + k)?.name || ""));
for (const b of G.bosses) if (!G.monsters[b.id]) addIndex(b.name, `บอส Lv.${b.level} · ${b.live ? "มีในเกม" : "วางแผนไว้"}`, `#/bosses`, thumb("monster/" + b.id), b.id);
for (const [id, it] of Object.entries(C.items)) addIndex(it.name, TYPE_TH[it.type] + (it.slot ? " · " + SLOT_TH[it.slot] : ""), `#/item/${id}`, icon("item/" + id, 44), id);
for (const z of Object.keys(G.zones)) addIndex(zoneName(z), `แผนที่ · ${G.zones[z].range}`, `#/map/${enc(z)}`, `<span class="thumb">${D.icons["region/" + z] ? icon("region/" + z, 44) : "◈"}</span>`);
for (const n of G.npcs) addIndex(n.name, "NPC / จุดกิจกรรม", `#/npcs`, thumb("npc/" + n.id, "npc/" + n.id), n.id);
for (const p of G.pets) addIndex(p.name, "สัตว์เลี้ยง", `#/pets`, thumb("pet/" + p.id), p.id);
for (const [q, row] of Object.entries(C.quests)) addIndex(row.name, `เควสต์ · ${row.zone}`, `#/quests`, `<span class="thumb">❖</span>`, q);

let hit = -1;
function runSearch(text) {
  const box = $("#results"), q = text.trim().toLowerCase();
  if (!q) { box.hidden = true; return; }
  const found = INDEX.filter(r => r.hay.includes(q)).slice(0, 14);
  hit = found.length ? 0 : -1;
  box.innerHTML = found.length ? found.map((r, i) => `<a href="${r.href}" class="${i ? "" : "on"}">${r.pic}<span><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></a>`).join("")
    : `<div class="none">ไม่พบ “${esc(text)}”</div>`;
  box.hidden = false;
}
function wireSearch(input) {
  input.addEventListener("input", () => { $("#q").value = input.value; runSearch(input.value); });
  input.addEventListener("keydown", e => {
    const links = [...$("#results").querySelectorAll("a")];
    if (e.key === "Escape") { $("#results").hidden = true; return; }
    if (!links.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); hit = (hit + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
      links.forEach((a, i) => a.classList.toggle("on", i === hit)); links[hit].scrollIntoView({block: "nearest"});
    }
    if (e.key === "Enter" && hit >= 0) { location.hash = links[hit].getAttribute("href"); }
  });
}
document.addEventListener("click", e => { if (!e.target.closest(".results,.top-search,.hero")) $("#results").hidden = true; });

// ---------- tabs ----------
const TABS = [
  ["", "หน้าหลัก"], ["jobs", "อาชีพ", Object.keys(C.jobs).length], ["skills", "สกิล", Object.keys(C.skills).length],
  ["monsters", "มอนสเตอร์", Object.keys(G.monsters).length], ["bosses", "บอส", G.bosses.length],
  ["items", "ไอเทม", Object.keys(C.items).length], ["cards", "การ์ด", G.cards.length], ["maps", "แผนที่", Object.keys(G.zones).length],
  ["npcs", "NPC", G.npcs.length], ["pets", "สัตว์เลี้ยง", G.pets.length], ["quests", "เควสต์", Object.keys(C.quests).length], ["systems", "ระบบ"]];
const TAB_OF = {job: "jobs", skill: "skills", monster: "monsters", item: "items", map: "maps"};
$("#tabs").innerHTML = TABS.map(([r, l, n]) => `<a class="tab" href="#/${r}" data-tab="${r}">${l}${n ? `<small>${n}</small>` : ""}</a>`).join("");

// ---------- pages ----------
const crumbs = (...parts) => `<nav class="crumbs" aria-label="ตำแหน่ง"><a href="#/">วิกิ</a>${parts.map(p => ` › ${p}`).join("")}</nav>`;
const pageHead = (eyebrow, title, lead) => `<div class="eyebrow">${eyebrow}</div><h1 style="font-size:clamp(26px,3vw,36px);margin-top:6px">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}`;

function home() {
  const zones = Object.keys(G.zones).filter(z => G.zones[z].monsters.length).sort((a, b) => zoneLevel(a) - zoneLevel(b));
  const tiles = [
    ["jobs", "อาชีพ", "นักดาบ นักเวท นักธนู …", `${Object.keys(C.jobs).length} อาชีพ`],
    ["skills", "สกิลอาชีพ", "ค่าแต่ละเลเวล SP คูลดาวน์", `${Object.keys(C.skills).length} สกิล`],
    ["monsters", "มอนสเตอร์", "ธาตุ ขนาด ของดรอป แผนที่ที่พบ", `${Object.keys(G.monsters).length} ตัว`],
    ["bosses", "บอส", "ท่าโจมตี เวลาเกิด ของรางวัล", `${G.bosses.length} ตัว`],
    ["items", "ไอเทม", "อุปกรณ์ ยา วัตถุดิบ", `${Object.keys(C.items).length} รายการ`],
    ["cards", "สมุดการ์ด", "ค่าสะสม ค่าใส่ช่อง โบนัสชุด", `${G.cards.length} ใบ · ${G.card_sets.length} ชุด`],
    ["maps", "แผนที่", "เลเวลแนะนำ NPC เส้นทาง", `${Object.keys(G.zones).length} พื้นที่`],
    ["npcs", "NPC", "ผู้คนในเมืองและจุดกิจกรรม", `${G.npcs.length} จุด`],
    ["pets", "สัตว์เลี้ยง", "ไข่ ระยะเก็บของอัตโนมัติ", `${G.pets.length} ตัว`],
    ["quests", "เควสต์", "สายเควสต์หลักและรางวัล", `${Object.keys(C.quests).length} เควสต์`],
    ["systems", "ระบบเกม", "ธาตุ ตีบวก ดันเจี้ยน โลกเปิด", "6 หัวข้อ"]];
  return `
  <section class="hero panel">
    <div>
      <div class="eyebrow">${esc(B.title)} · Game Wiki</div>
      <h1>วิกิ ${esc(B.name)}</h1>
      <p class="lead">ค้นหาอาชีพ สกิล มอนสเตอร์ ไอเทม แผนที่ และของดรอปทั้งหมดในเกม — ทุกตัวเลขส่งออกจาก source ของเกมโดยตรง ไม่ได้พิมพ์มือ</p>
      <input class="field" id="hero-q" type="search" placeholder="พิมพ์ชื่อไอเทม มอน หรือแผนที่…" aria-label="ค้นหาทั้งวิกิ" autocomplete="off">
      <div class="stats"><span class="pill gold">Lv สูงสุด ${G.formulas.base_cap}</span><span class="pill">${Object.keys(C.jobs).length} อาชีพ</span><span class="pill">${Object.keys(G.monsters).length} มอนสเตอร์</span><span class="pill">${Object.keys(G.zones).length} พื้นที่</span><span class="pill jade">ภาพตัวละครใหม่ ${Object.keys(D.art).length} แบบ</span></div>
    </div>
    <div class="hero-art" aria-hidden="true">${["job/swordsman", "job/mage", "npc/guide"].map(id => art(id) ? `<img src="${art(id).thumb}" alt="">` : "").join("")}</div>
  </section>
  <section class="section"><h2>หมวดทั้งหมด</h2>
    <div class="grid g-tiles">${tiles.map(([r, t, s, n]) => `<a class="tile panel" href="#/${r}"><b>${t}</b><span class="muted">${s}</span><span class="count">${n}</span></a>`).join("")}</div>
  </section>
  <section class="section"><h2>ไปล่าที่ไหนดี <small>แผนที่ตามเลเวล</small></h2>
    <div class="grid g-wide">${zones.map(zoneCard).join("")}</div>
  </section>
  <section class="section"><h2>อาชีพ <small>เลือกสายที่ใช่</small></h2>
    <div class="grid g-cards">${Object.keys(C.jobs).map(jobCard).join("")}</div>
  </section>`;
}

function zoneCard(z) {
  const row = G.zones[z], ic = D.icons["region/" + z];
  let pic = `<span class="pic ph" aria-hidden="true">◈</span>`;
  if (ic) { const sh = D.sheets[ic.sheet], [x, y, w, h] = ic.rect; pic = `<span class="pic" style="background-image:url('${sh.file}');background-size:${sh.width / w * 100}% ${sh.height / h * 100}%;background-position:${x / (sh.width - w) * 100}% ${y / (sh.height - h) * 100}%"></span>`; }
  const mons = row.monsters.map(k => G.monsters[k]?.name || k).join(", ");
  return `<a class="zone panel" href="#/map/${enc(z)}">${pic}<span class="body"><b>${esc(z)}</b>${ZONE_TH[z] ? `<span class="muted" style="font-size:13px">${ZONE_TH[z]}</span>` : ""}<span class="lv">${esc(row.range)}</span><small class="muted" style="display:block;font-size:12.5px">${esc(mons || row.npcs.map(npcBaseName).join(", ") || "เขตปลอดภัย")}</small></span></a>`;
}

function jobCard(j) {
  const a = art(jobArtId(j));
  return `<a class="ccard panel" href="#/job/${j}"><span class="stage">${a ? `<img src="${a.thumb}" alt="" loading="lazy" decoding="async">` : ""}</span><span class="info"><b>${JOB_TH[j]} · ${j}</b><span class="muted">${esc(a?.role || "")}</span></span></a>`;
}

function jobs() {
  return crumbs("อาชีพ") + pageHead("Classes", "อาชีพ", "เริ่มเกมเป็น Novice แล้วเปลี่ยนอาชีพที่ Aren สมาคมอาชีพ (Guild Quarter) แต่ละสายมีสกิล 6 อย่างและท่าไม้ตาย 1 ท่า") +
    `<div class="grid g-cards section">${Object.keys(C.jobs).map(jobCard).join("")}</div>`;
}

function skillRow(id) {
  const s = C.skills[id];
  return `<tr><td><a class="cell" href="#/skill/${id}">${icon("skill/" + id, 36)}<span><b>${esc(s.name)}</b>${C.jobs[s.job]?.signature === id ? ` <span class="pill gold">ท่าไม้ตาย</span>` : ""}</span></a></td>
    <td>${esc(SKILL_TYPE_TH[s.type] || s.type)}</td><td class="num">${s.type === "passive" ? "—" : s.cost}</td><td class="num">${s.type === "passive" ? "—" : s.cooldown.toFixed(1) + " วิ"}</td><td class="num">${esc(G.skill_wiki[id].effect_values[0])}</td></tr>`;
}
const skillTable = ids => `<div class="tablewrap"><table><thead><tr><th>สกิล</th><th>ประเภท</th><th class="num">SP</th><th class="num">คูลดาวน์</th><th class="num">ค่าพลัง Lv1</th></tr></thead><tbody>${ids.map(skillRow).join("")}</tbody></table></div>`;

function job(j) {
  const row = C.jobs[j];
  if (!row) return notFound();
  const a = art(jobArtId(j)), sig = row.signature && C.skills[row.signature];
  const weapons = Object.entries(C.items).filter(([, it]) => it.jobs?.includes(j));
  return crumbs(`<a href="#/jobs">อาชีพ</a>`, esc(j)) + `<div class="page">
    ${stage(jobArtId(j), `${JOB_TH[j]} / ${j}`)}
    <div>
      <div class="eyebrow">Class</div><h1>${JOB_TH[j]} · ${esc(j)}</h1>
      <div class="tags"><span class="pill gold">${esc(a?.role || "")}</span>${artNote(jobArtId(j))}</div>
      <dl class="kv"><div><dt>อาวุธเริ่มต้น</dt><dd><a href="#/item/${row.weapon}">${esc(itemName(row.weapon))}</a></dd></div><div><dt>จำนวนสกิล</dt><dd>${row.skills.length}</dd></div>${sig ? `<div><dt>ท่าไม้ตาย</dt><dd><a href="#/skill/${row.signature}">${esc(sig.name)}</a></dd></div>` : ""}</dl>
      ${sig ? `<p class="note">${esc(sig.description)}</p>` : ""}
      <section class="section"><h2>สกิล</h2>${skillTable(row.skills)}</section>
      <section class="section"><h2>อุปกรณ์ที่ใส่ได้ <small>${weapons.length} ชิ้น · อุปกรณ์ที่ไม่ระบุอาชีพใส่ได้ทุกอาชีพ</small></h2>
        <div class="tags">${weapons.map(([id, it]) => `<a class="pill" href="#/item/${id}">${esc(it.name)}</a>`).join("")}</div></section>
      ${a ? `<p class="dim" style="font-size:13px">แนวทางภาพ: ${esc(a.design)}</p>` : ""}
    </div></div>`;
}

let skillJob = "all";
function skills() {
  const jobsList = ["all", ...Object.keys(C.jobs)];
  const ids = Object.keys(C.skills).filter(id => skillJob === "all" || C.skills[id].job === skillJob);
  return crumbs("สกิล") + pageHead("Skills", "สกิลอาชีพ", "สกิลทุกอาชีพ อัปได้สูงสุด Lv.5 ด้วยแต้มสกิล ค่าพลังเพิ่ม 12% ต่อเลเวล") +
    `<div class="chips section" role="group" aria-label="กรองตามอาชีพ">${jobsList.map(j => `<button class="chip" data-skilljob="${j}" aria-pressed="${skillJob === j}">${j === "all" ? "ทุกอาชีพ" : JOB_TH[j]}</button>`).join("")}</div>` + skillTable(ids);
}

function skill(id) {
  const s = C.skills[id], w = G.skill_wiki[id];
  if (!s) return notFound();
  return crumbs(`<a href="#/skills">สกิล</a>`, esc(s.name)) + `
    <div class="head">${icon("skill/" + id, 84)}<div><div class="eyebrow">${esc(JOB_TH[s.job] || s.job)} · ${esc(SKILL_TYPE_TH[s.type] || s.type)}</div><h1>${esc(s.name)}</h1>
    <div class="tags"><a class="pill gold" href="#/job/${s.job}">${esc(s.job)}</a>${s.element ? elPill(s.element) : ""}${C.jobs[s.job]?.signature === id ? `<span class="pill gold">ท่าไม้ตาย</span>` : ""}</div></div></div>
    ${s.description ? `<p class="note">${esc(s.description)}</p>` : ""}
    <ul class="facts">${w.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
    <section class="section"><h2>ค่าแต่ละเลเวล <small>${esc(w.effect_label)}</small></h2>
    <div class="tablewrap"><table><thead><tr><th>Lv</th><th class="num">ค่าพลัง</th><th class="num">SP</th><th class="num">คูลดาวน์</th></tr></thead>
    <tbody>${w.rows.map((r, i) => `<tr><td>${r.rank}</td><td class="num">${esc(w.effect_values[i])}</td><td class="num">${s.type === "passive" ? "—" : r.cost}</td><td class="num">${s.type === "passive" ? "—" : r.cooldown.toFixed(1) + " วิ"}</td></tr>`).join("")}</tbody></table></div></section>`;
}

// monsters: list + detail split, filters survive selection
const mf = {q: "", zone: "all", el: "all", size: "all", mode: "all", sort: "lv"};
function monsterList() {
  let rows = Object.entries(G.monsters).filter(([k, m]) =>
    (!mf.q || (m.name + " " + k).toLowerCase().includes(mf.q)) &&
    (mf.zone === "all" || (monsterZones[k] || []).includes(mf.zone) || (mf.zone === "dungeon" && monsterFloors[k])) &&
    (mf.el === "all" || m.element === mf.el) && (mf.size === "all" || m.size === mf.size) &&
    (mf.mode === "all" || (mf.mode === "boss" ? bossById[k] : G.monster_profiles[k]?.mode === mf.mode)));
  rows.sort((a, b) => mf.sort === "lv" ? a[1].level - b[1].level : mf.sort === "lvd" ? b[1].level - a[1].level : a[1].name.localeCompare(b[1].name));
  return rows;
}
function renderMonsterRows(sel) {
  const rows = monsterList();
  $("#mcount").textContent = `${rows.length} ตัว`;
  $("#mlist").innerHTML = rows.map(([k, m]) => `<a class="row" href="#/monster/${k}" aria-current="${k === sel}">${thumb("monster/" + k, "monster/" + k)}<span class="grow"><b>${esc(m.name)}</b><small>Lv.${m.level} · HP ${monsterHp(k, m.level)} · ${esc((monsterZones[k] || []).join(", ") || (bossById[k] ? "บอส" : "—"))}</small></span>${elPill(m.element)}</a>`).join("") || `<p class="muted" style="padding:10px">ไม่พบมอนสเตอร์ตามตัวกรอง</p>`;
}
function monsters(sel) {
  const opt = (v, l, cur) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(l)}</option>`;
  return crumbs("มอนสเตอร์") + `<div class="split">
    <div>
      <div class="filters">
        <input class="field" id="mq" type="search" placeholder="ค้นหาชื่อมอนหรือ ID…" value="${esc(mf.q)}" aria-label="ค้นหามอนสเตอร์">
        <label>แผนที่<select data-mf="zone">${opt("all", "ทุกแผนที่", mf.zone)}${Object.keys(G.zones).filter(z => G.zones[z].monsters.length).map(z => opt(z, `${z} (${G.zones[z].range})`, mf.zone)).join("")}${opt("dungeon", "Bell Depths (ดันเจี้ยน)", mf.zone)}</select></label>
        <label>ธาตุ<select data-mf="el">${opt("all", "ทุกธาตุ", mf.el)}${G.elements.list.map(e => opt(e, elTh(e), mf.el)).join("")}</select></label>
        <label>ขนาด<select data-mf="size">${opt("all", "ทุกขนาด", mf.size)}${Object.keys(SIZE_TH).map(s => opt(s, SIZE_TH[s], mf.size)).join("")}</select></label>
        <label>นิสัย<select data-mf="mode">${opt("all", "ทั้งหมด", mf.mode)}${opt("aggressive", "ดุ (โจมตีก่อน)", mf.mode)}${opt("passive", "เฉย (ไม่โจมตีก่อน)", mf.mode)}${opt("boss", "บอส", mf.mode)}</select></label>
        <label style="grid-column:1/-1">เรียง<select data-mf="sort">${opt("lv", "เลเวล น้อย→มาก", mf.sort)}${opt("lvd", "เลเวล มาก→น้อย", mf.sort)}${opt("name", "ชื่อ A→Z", mf.sort)}</select></label>
      </div>
      <div class="listcount" id="mcount"></div>
      <div class="list panel" id="mlist"></div>
    </div>
    <article class="detail panel${sel ? "" : " empty"}" id="mdetail">${sel ? monsterDetail(sel) : "เลือกมอนสเตอร์เพื่อดูค่าสถานะ ของดรอป และแผนที่ที่พบ"}</article>
  </div>`;
}
function monsterDetail(k) {
  const m = G.monsters[k];
  if (!m) return `<p class="muted">ไม่พบมอนสเตอร์ “${esc(k)}”</p>`;
  const p = G.monster_profiles[k], ex = monsterExp(m.level), boss = bossById[k], a = art("monster/" + k);
  const floors = monsterFloors[k] ? [...monsterFloors[k].values()] : [];
  return `<div class="page" style="grid-template-columns:minmax(200px,280px) 1fr;gap:20px">
    ${a ? stage("monster/" + k, m.name).replace('class="stage"', 'class="stage" style="height:340px"') : `<div class="stage noclick" style="height:340px">${icon("monster/" + k, 200)}</div>`}
    <div>
      <div class="eyebrow">${boss ? "Boss" : "Monster"} · ${esc(k)}</div><h1>${esc(m.name)}</h1>
      <div class="tags">${elPill(m.element)}<span class="pill">${esc(SIZE_TH[m.size] || m.size)}</span>${p ? `<span class="pill ${p.mode === "aggressive" ? "rose" : "jade"}">${p.mode === "aggressive" ? "ดุ · โจมตีก่อน" : "เฉย · ไม่โจมตีก่อน"}</span>` : ""}${p?.assist ? `<span class="pill">ช่วยพวก</span>` : ""}${boss ? `<a class="pill gold" href="#/bosses">บอส</a>` : ""}${artNote("monster/" + k)}</div>
      <dl class="kv"><div><dt>เลเวล</dt><dd>${m.level}</dd></div><div><dt>HP</dt><dd>${monsterHp(k, m.level)}</dd></div>
        ${boss ? "" : `<div><dt>Base EXP</dt><dd>${ex.base}</dd></div><div><dt>Job EXP</dt><dd>${ex.job}</dd></div><div><dt>Lumen</dt><dd>${ex.lumen}</dd></div>`}
        ${p ? `<div><dt>ระยะมองเห็น</dt><dd>${p.sight}</dd></div><div><dt>ความเร็วไล่</dt><dd>${p.chase}</dd></div><div><dt>หน่วงโจมตี</dt><dd>${p.delay} วิ</dd></div>` : ""}</dl>
      <p class="dim" style="font-size:12.5px">HP/EXP คิดจากสูตรใน main.gd ที่เลเวลฐาน · เลเวลจริงขึ้นกับจุดเกิดในแผนที่</p>
      <h3 style="margin-top:18px">ของดรอป</h3>
      <div class="tablewrap" style="margin-top:8px"><table><tbody>${m.drops.map(d => `<tr><td><a class="cell" href="#/item/${d.id}">${icon("item/" + d.id, 32)}${esc(itemName(d.id))}</a></td><td class="num">${pct(d.chance)}</td><td style="width:30%"><div class="bar"><i style="width:${Math.max(3, d.chance * 100)}%"></i></div></td></tr>`).join("")}</tbody></table></div>
      <h3 style="margin-top:18px">พบที่</h3>
      <div class="tags">${(monsterZones[k] || []).map(z => `<a class="pill gold" href="#/map/${enc(z)}">${esc(z)} · ${esc(G.zones[z].range)}</a>`).join("")}${floors.map(f => `<span class="pill violet">Bell Depths ${esc(f.floor)} · Lv.${f.lv}${f.elite ? " · Elite" : ""}</span>`).join("")}${boss ? `<span class="pill gold">${esc(boss.zone)}</span>` : ""}${!(monsterZones[k] || []).length && !floors.length && !boss ? `<span class="muted">—</span>` : ""}</div>
      ${a ? `<p class="dim" style="font-size:12.5px;margin-top:16px">${esc(a.role)} · ${esc(a.design)}</p>` : ""}
    </div></div>`;
}

function bosses() {
  return crumbs("บอส") + pageHead("Boss board", "บอส", "บอสที่ “มีในเกม” เกิดจริงใน build ตอนนี้ ส่วน “วางแผนไว้” คือบอสที่ประกาศไว้แต่ยังไม่เปิด — วิกิไม่ทำเหมือนว่าเล่นได้แล้ว") +
    `<div class="grid section" style="gap:18px">${G.bosses.map(b => {
      const a = art("monster/" + b.id), note = a?.integration_note;
      return `<article class="panel page boss">
        ${a ? stage("monster/" + b.id, b.name).replace('class="stage"', 'class="stage" style="height:300px"') : `<div class="stage noclick" style="height:300px">${icon("monster/" + b.id, 180)}</div>`}
        <div><div class="eyebrow">Lv.${b.level} · ${esc(b.zone)}</div><h2 style="font-size:24px;margin-top:4px">${esc(b.name)}</h2>
        <div class="tags">${b.live ? `<span class="pill jade">มีในเกม</span>` : `<span class="pill violet">วางแผนไว้ · ยังไม่เกิด</span>`}${b.respawn ? `<span class="pill">เกิดใหม่ ${b.respawn} วิ</span>` : ""}${G.monsters[b.id] ? elPill(G.monsters[b.id].element) : ""}${G.monsters[b.id] ? `<a class="pill gold" href="#/monster/${b.id}">ดูค่าสถานะ</a>` : ""}</div>
        <h3 style="margin-top:12px;font-size:15px">ท่าโจมตี</h3><div class="tags">${b.moves.map(m => `<span class="pill">${esc(m)}</span>`).join("")}</div>
        <h3 style="margin-top:12px;font-size:15px">ของรางวัล</h3><div class="tags">${b.drops.map(d => `<a class="pill gold" href="#/item/${d.id}">${esc(itemName(d.id))} · ${pct(d.chance)}</a>`).join("")}${(b.personal || []).map(d => `<a class="pill jade" href="#/item/${d.id}">${esc(itemName(d.id))} ×${d.qty} (ส่วนตัว)</a>`).join("")}</div>
        ${b.id === "aruun" ? `<p class="note">อีเวนต์ “ระฆังที่ไม่เคยดัง” · เริ่มจากมีราในตลาด · HP ${monsterHp("aruun")} · มี 3 เฟส (เกราะวงจรเมื่อเหลือ 70% และประสานแกนเมื่อเหลือ 10%)</p>` : ""}
        ${note ? `<p class="note warn">${esc(note)}</p>` : ""}</div></article>`;
    }).join("")}</div>`;
}

// items: list + detail split
const itf = {q: "", cat: "all"};
const ITEM_CATS = [["all", "ทั้งหมด"], ["weapon", "อาวุธ"], ["gear", "ชุดเกราะ/ประดับ"], ["consumable", "ใช้ได้"], ["material", "วัตถุดิบ"], ["card", "การ์ด"], ["special", "เควสต์/แฟชั่น"]];
function itemCat(it) {
  if (it.type === "equipment") return it.slot === "weapon" || it.slot === "ammunition" ? "weapon" : "gear";
  if (it.type === "quest" || it.type === "cosmetic") return "special";
  return it.type;
}
function renderItemRows(sel) {
  const rows = Object.entries(C.items).filter(([id, it]) => (itf.cat === "all" || itemCat(it) === itf.cat) && (!itf.q || (it.name + " " + id).toLowerCase().includes(itf.q)));
  $("#icount").textContent = `${rows.length} รายการ`;
  $("#ilist").innerHTML = rows.map(([id, it]) => `<a class="row" href="#/item/${id}" aria-current="${id === sel}">${icon("item/" + id, 44)}<span class="grow"><b>${esc(it.name)}</b><small>${esc(TYPE_TH[it.type])}${it.slot ? " · " + SLOT_TH[it.slot] : ""}${it.price ? " · " + it.price + " Lumen" : ""}</small></span>${it.rarity === "rare" ? `<span class="pill gold">หายาก</span>` : ""}</a>`).join("") || `<p class="muted" style="padding:10px">ไม่พบไอเทม</p>`;
}
function items(sel) {
  return crumbs("ไอเทม") + `<div class="split"><div>
    <div class="filters"><input class="field" id="iq" type="search" placeholder="ค้นหาไอเทม…" value="${esc(itf.q)}" aria-label="ค้นหาไอเทม"></div>
    <div class="chips" role="group" aria-label="หมวดไอเทม">${ITEM_CATS.map(([c, l]) => `<button class="chip" data-itemcat="${c}" aria-pressed="${itf.cat === c}">${l}</button>`).join("")}</div>
    <div class="listcount" id="icount"></div><div class="list panel" id="ilist"></div></div>
    <article class="detail panel${sel ? "" : " empty"}" id="idetail">${sel ? itemDetail(sel) : "เลือกไอเทมเพื่อดูแหล่งที่ได้และการใช้งาน"}</article></div>`;
}
function itemDetail(id) {
  const it = C.items[id];
  if (!it) return `<p class="muted">ไม่พบไอเทม “${esc(id)}”</p>`;
  const src = sourcesOf(id), uses = usesOf(id), card = cardById[id];
  const srcHtml = src.map(s => {
    const what = s.chance !== undefined ? pct(s.chance) : "×" + s.qty;
    const link = s.kind === "monster" ? `#/monster/${s.id}` : s.kind === "boss" ? "#/bosses" : s.kind === "quest" ? "#/quests" : s.kind === "dungeon" ? "#/systems" : "#/npcs";
    const label = {monster: "มอนสเตอร์", boss: "บอส", quest: "รางวัลเควสต์", dungeon: "ดันเจี้ยน", recipe: "คราฟต์ที่ Borin"}[s.kind];
    return `<tr><td><a class="cell" href="${link}">${s.kind === "monster" ? thumb("monster/" + s.id, "monster/" + s.id) : ""}<span><b>${esc(s.name)}</b><small class="muted" style="display:block;font-size:12px">${label}</small></span></a></td><td class="num">${what}</td></tr>`;
  }).join("");
  return `<div class="head">${icon("item/" + id, 92)}<div><div class="eyebrow">${esc(TYPE_TH[it.type])}${it.slot ? " · " + SLOT_TH[it.slot] : ""}</div><h1>${esc(it.name)}</h1>
    <div class="tags">${it.rarity === "rare" ? `<span class="pill gold">หายาก</span>` : `<span class="pill">ทั่วไป</span>`}${it.bound ? `<span class="pill rose">ผูกตัวละคร · แลกเปลี่ยนไม่ได้</span>` : ""}<code>${esc(id)}</code></div></div></div>
    <dl class="kv"><div><dt>ราคาซื้อ</dt><dd>${it.price ? it.price + " L" : "—"}</dd></div><div><dt>ราคาขาย</dt><dd>${it.sell ? it.sell + " L" : "—"}</dd></div><div><dt>น้ำหนัก</dt><dd>${it.weight}</dd></div>
      ${it.type === "equipment" ? `<div><dt>พลัง</dt><dd>${it.power}</dd></div><div><dt>ช่องการ์ด</dt><dd>${it.sockets}</dd></div><div><dt>เลเวลใส่</dt><dd>${it.level}</dd></div>` : ""}</dl>
    ${it.type === "equipment" ? `<p class="muted">อาชีพที่ใส่ได้: ${it.jobs.length ? it.jobs.map(j => `<a href="#/job/${j}">${JOB_TH[j]}</a>`).join(", ") : "ทุกอาชีพ"} · ตีบวกได้ถึง +${G.refine.max} (${it.slot === "weapon" ? "ATK" : "DEF"} +${it.slot === "weapon" ? G.refine.weapon.per : G.refine.armor.per}/ระดับ)</p>` : ""}
    ${card ? `<p class="note">สะสม: ${STAT_TH[card.stat] || card.stat} +${card.value} · ใส่ช่อง: ${STAT_TH[card.socket_stat] || card.socket_stat} +${card.socket_value} · ชุด <a href="#/cards">${esc(G.card_sets.find(s => s.id === card.set)?.name || card.set)}</a></p>` : ""}
    <h3 style="margin-top:18px">ได้จาก</h3>
    ${srcHtml ? `<div class="tablewrap" style="margin-top:8px"><table><tbody>${srcHtml}</tbody></table></div>` : `<p class="muted">${it.price ? `ซื้อจาก <a href="#/npcs">Milo · ร้านอุปกรณ์</a>` : "ยังไม่มีแหล่งที่บันทึกไว้"}</p>`}
    ${uses.length ? `<h3 style="margin-top:18px">ใช้ทำอะไร</h3><ul class="facts">${uses.map(u => `<li>${u}</li>`).join("")}</ul>` : ""}`;
}

function cards() {
  return crumbs("การ์ด") + pageHead("Card book", "สมุดการ์ด", "เก็บการ์ดครั้งแรกได้ค่าสะสมถาวร ใส่ช่องอุปกรณ์ได้ค่าใส่ช่องเพิ่ม และสะสมครบชุดได้โบนัสชุด") +
    G.card_sets.map(set => `<section class="section"><h2>${esc(set.name)} <small>ครบชุด: ${esc(set.bonus)}</small></h2>
    <div class="tablewrap"><table><thead><tr><th>การ์ด</th><th>ค่าสะสม</th><th>ใส่ช่อง</th><th>ดรอปจาก</th><th class="num">โอกาส</th></tr></thead><tbody>
    ${G.cards.filter(c => c.set === set.id).map(c => {
      const chance = Object.values(G.monsters).flatMap(m => m.drops).find(d => d.id === c.id)?.chance ?? 0;
      return `<tr><td><a class="cell" href="#/item/${c.id}">${thumb(c.id === "bell_shade_card" ? "monster/bell_shade" : "monster/" + c.id.replace("_card", ""), "item/" + c.id)}<b>${esc(c.name)}</b></a></td><td>${STAT_TH[c.stat] || c.stat} +${c.value}</td><td>${STAT_TH[c.socket_stat] || c.socket_stat} +${c.socket_value}</td><td><a href="#/monster/${c.drop}">${esc(G.monsters[c.drop]?.name || c.drop)}</a></td><td class="num">${pct(chance)}</td></tr>`;
    }).join("")}</tbody></table></div></section>`).join("");
}

function maps() {
  const order = Object.keys(G.zones).sort((a, b) => zoneLevel(a) - zoneLevel(b));
  return crumbs("แผนที่") + pageHead("World", "แผนที่", "พื้นที่ทั้งหมดในโลก Lunaris เรียงตามเลเวลแนะนำ · เขตเมืองปลอดภัยและไม่มีมอนสเตอร์") +
    `<div class="grid g-wide section">${order.map(zoneCard).join("")}</div>`;
}

function map(name) {
  const z = decodeURIComponent(name), row = G.zones[z];
  if (!row) return notFound();
  const quests = Object.entries(C.quests).filter(([, q]) => q.zone === z);
  const disc = G.discoveries.filter(d => d.region === z);
  return crumbs(`<a href="#/maps">แผนที่</a>`, esc(z)) + `
    <div class="head">${D.icons["region/" + z] ? icon("region/" + z, 120) : ""}<div><div class="eyebrow">Region</div><h1>${esc(z)}</h1>${ZONE_TH[z] ? `<p class="lead" style="margin:0">${ZONE_TH[z]}</p>` : ""}<div class="tags"><span class="pill gold">${esc(row.range)}</span></div></div></div>
    <section class="section"><h2>มอนสเตอร์ <small>${row.monsters.length || "ไม่มี — เขตปลอดภัย"}</small></h2>
      ${row.monsters.length ? `<div class="grid g-cards">${row.monsters.map(k => { const m = G.monsters[k], a = art("monster/" + k); return `<a class="ccard panel" href="#/monster/${k}"><span class="stage">${a ? `<img src="${a.thumb}" alt="" loading="lazy">` : icon("monster/" + k, 140)}</span><span class="info"><b>${esc(m.name)}</b><span class="muted">Lv.${m.level} · ${esc(elTh(m.element))}</span></span></a>`; }).join("")}</div>` : ""}</section>
    ${row.npcs.length ? `<section class="section"><h2>NPC และจุดสำคัญ</h2><div class="tags">${row.npcs.map(n => `<a class="pill" href="#/npcs">${esc(n)}</a>`).join("")}</div></section>` : ""}
    ${quests.length ? `<section class="section"><h2>เควสต์ในพื้นที่</h2><div class="tags">${quests.map(([, q]) => `<a class="pill gold" href="#/quests">${esc(q.name)}</a>`).join("")}</div></section>` : ""}
    ${disc.length ? `<section class="section"><h2>จุดค้นพบ</h2>${disc.map(d => `<div class="note"><b style="color:var(--ink)">${esc(d.name)}</b> — ${esc(d.lore)}<br><small>รางวัลครั้งแรก: ${d.reward.lumen} Lumen · Base ${d.reward.base} · Job ${d.reward.job}</small></div>`).join("")}</section>` : ""}
    ${landmarkSummary(z)}
    <section class="section"><h2>เชื่อมต่อกับ</h2><div class="grid g-wide">${row.links.filter(l => G.zones[l]).map(zoneCard).join("")}</div></section>`;
}

function npcs() {
  const people = G.npcs.filter(n => art("npc/" + n.id)), points = G.npcs.filter(n => !art("npc/" + n.id));
  const card = n => { const a = art("npc/" + n.id), z = npcZone[n.name]; return `<article class="ccard panel" style="cursor:default">
    ${a ? `<span class="stage" data-zoom="npc/${n.id}" role="button" tabindex="0" aria-label="ดูภาพใหญ่ ${esc(n.name)}"><img src="${a.thumb}" alt="${esc(n.name)}" loading="lazy"></span>` : `<span class="stage">${icon("npc/" + n.id, 150)}</span>`}
    <span class="info"><b>${esc(npcBaseName(n.name))}</b><span class="muted">${esc(PANEL_TH[n.panel] || n.panel)}</span>${z ? `<a class="pill" style="margin-top:6px" href="#/map/${enc(z)}">${esc(z)}</a>` : ""}</span></article>`; };
  return crumbs("NPC") + pageHead("People of Lunaris", "NPC และจุดกิจกรรม", "ผู้คนในเมืองที่ให้บริการ และจุดที่กด E เพื่อโต้ตอบในแผนที่") +
    `<section class="section"><h2>ผู้คน <small>${people.length}</small></h2><div class="grid g-cards">${people.map(card).join("")}</div></section>
     <section class="section"><h2>จุดกิจกรรม <small>วัตถุ ไม่ใช่ตัวละคร</small></h2><div class="grid g-cards">${points.map(card).join("")}</div></section>`;
}

function pets() {
  return crumbs("สัตว์เลี้ยง") + pageHead("Companions", "สัตว์เลี้ยง", `สัตว์เลี้ยงเก็บของที่ตกให้อัตโนมัติ ระยะที่ระบุคือรัศมีรวม (ไม่มีสัตว์เลี้ยง = ${G.pet_base_pickup} หน่วย) ฟักจากวัตถุดิบ`) +
    `<div class="grid g-cards section">${G.pets.map(p => { const a = art("pet/" + p.id); return `<article class="ccard panel" style="cursor:default">
      ${a ? `<span class="stage" data-zoom="pet/${p.id}" role="button" tabindex="0" aria-label="ดูภาพใหญ่ ${esc(p.name)}"><img src="${a.thumb}" alt="${esc(p.name)}" loading="lazy"></span>` : ""}
      <span class="info"><b>${esc(p.name)}</b><span class="muted">${esc(p.effect)}</span>
      <span class="tags"><span class="pill gold">ระยะ ${p.range}</span><a class="pill" href="#/item/${p.egg}">${esc(itemName(p.egg))} ×${p.egg_qty}</a></span></span></article>`; }).join("")}</div>`;
}

function quests() {
  const chain = Object.entries(C.quests);
  return crumbs("เควสต์") + pageHead("Story", "สายเควสต์หลัก", `รับจาก Liora ผู้แนะนำที่ ${esc(B.plaza)} ต้องทำต่อกันตามลำดับ`) +
    `<div class="chain section">${chain.map(([id, q]) => `<article class="panel"><div class="eyebrow">${esc(q.zone)}</div><h2 style="font-size:19px;margin:4px 0 8px">${esc(q.name)}</h2>
      <div class="tags">${Object.entries(q.objectives).map(([k, n]) => G.monsters[k] ? `<a class="pill rose" href="#/monster/${k}">กำจัด ${esc(G.monsters[k].name)} ×${n}</a>` : `<a class="pill jade" href="#/item/${k}">เก็บ ${esc(itemName(k))} ×${n}</a>`).join("")}</div>
      <div class="tags"><span class="pill gold">Base ${q.base}</span><span class="pill gold">Job ${q.job}</span><span class="pill gold">${q.lumen} Lumen</span>${Object.entries(q.items).map(([k, n]) => `<a class="pill" href="#/item/${k}">${esc(itemName(k))} ×${n}</a>`).join("")}</div>
      ${q.requires ? `<small class="dim">ต้องจบ ${esc(C.quests[q.requires]?.name)} ก่อน</small>` : `<small class="dim">เควสต์แรก</small>`}</article>`).join("")}</div>
    <section class="section"><h2>เส้นทางมือใหม่ <small>${G.journey.length} ขั้น · ทำแล้วได้รางวัลทันที</small></h2>
    <div class="tablewrap"><table><thead><tr><th>#</th><th>ขั้นตอน</th><th>ที่ไหน</th><th>รางวัล</th></tr></thead><tbody>
    ${G.journey.map((j, i) => `<tr><td>${i + 1}</td><td><b>${esc(j.title)}</b><small class="muted" style="display:block">${esc(j.text.replace("%d", G.refine.safe))}</small></td><td><a href="#/map/${enc(j.zone)}">${esc(j.zone)}</a></td><td>${rewardText(j.reward) || "—"}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function systems() {
  const E = G.elements, f = G.formulas;
  const cls = v => v > 1 ? "m-up" : v < 1 ? "m-down" : "m-same";
  return crumbs("ระบบ") + pageHead("Mechanics", "ระบบเกม", "ตัวเลขชุดเดียวกับที่โค้ดต่อสู้ใช้จริง") + `
  <section class="section" id="elements"><h2>ตารางธาตุ <small>แถว = ธาตุโจมตี · คอลัมน์ = ธาตุป้องกัน</small></h2>
    <div class="tablewrap"><table class="matrix"><thead><tr><th>โจมตี ＼ ป้องกัน</th>${E.list.map(e => `<th>${elPill(e)}</th>`).join("")}</tr></thead><tbody>
    ${E.list.map(a => `<tr><th>${elPill(a)}</th>${E.list.map(d => `<td class="${cls(E.table[a][d])}">×${E.table[a][d]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="muted">ชนะทาง ×1.3 · ธาตุเดียวกัน ×0.75 · โดนแพ้ทาง ×0.8 · ไร้ธาตุ ×1 เสมอ — ${Object.entries(E.advantage).map(([a, d]) => `${elTh(a)} ชนะ ${elTh(d)}`).join(" · ")}</p></section>
  <section class="section" id="refine"><h2>ตีบวก <small>ที่ Borin · ปลอดภัยถึง +${G.refine.safe}</small></h2>
    <div class="tablewrap"><table><thead><tr><th>ระดับ</th><th class="num">โอกาสสำเร็จ</th><th style="width:28%"></th><th class="num">ค่าใช้จ่าย</th><th>ถ้าล้มเหลว</th></tr></thead><tbody>
    ${G.refine.steps.map(s => `<tr><td>+${s.from} → +${s.to}</td><td class="num">${pct(s.chance)}</td><td><div class="bar"><i style="width:${s.chance * 100}%"></i></div></td><td class="num">${s.cost} L</td><td class="muted">${esc(s.outcome)}</td></tr>`).join("")}</tbody></table></div>
    <p class="muted">อาวุธ: ${esc(G.refine.weapon.label)} +${G.refine.weapon.per}/ระดับ · ชุดเกราะ: ${esc(G.refine.armor.label)} +${G.refine.armor.per}/ระดับ</p></section>
  <section class="section" id="dungeon"><h2>Bell Depths <small>ดันเจี้ยน 5 ชั้น · ชั้นละ ${G.dungeon.seconds} วิ · รับรางวัลวันละครั้ง</small></h2>
    <div class="tablewrap"><table><thead><tr><th>ชั้น</th><th>มอนสเตอร์</th></tr></thead><tbody>
    ${G.dungeon.floors.map(fl => `<tr><td><b>${esc(fl.name)}</b>${fl.elite ? ` <span class="pill rose">Elite</span>` : ""}</td><td><div class="tags" style="margin:0">${Object.entries(fl.spawns.reduce((acc, [k, lv]) => { const key = k + "|" + lv; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).map(([key, n]) => { const [k, lv] = key.split("|"); return `<a class="pill" href="#/monster/${k}">${esc(G.monsters[k].name)} Lv.${lv}${n > 1 ? " ×" + n : ""}</a>`; }).join("")}</div></td></tr>`).join("")}</tbody></table></div>
    <p class="note">รางวัลเคลียร์: ${G.dungeon.reward.lumen} Lumen · Base ${G.dungeon.reward.base} · Job ${G.dungeon.reward.job} · ${Object.entries(G.dungeon.reward.items).map(([k, n]) => `<a href="#/item/${k}">${esc(itemName(k))} ×${n}</a>`).join(" · ")} · <a href="#/item/${G.dungeon.reward.card}">${esc(itemName(G.dungeon.reward.card))}</a> ${pct(G.dungeon.reward.card_chance)}</p></section>
  <section class="section" id="formulas"><h2>สูตรเลเวลและรางวัล</h2>
    <dl class="kv"><div><dt>EXP ขึ้น Base Lv</dt><dd>${esc(f.base_next)}</dd></div><div><dt>EXP ขึ้น Job Lv</dt><dd>${esc(f.job_next)}</dd></div><div><dt>Base Lv สูงสุด</dt><dd>${f.base_cap}</dd></div>
    <div><dt>HP มอนสเตอร์</dt><dd style="font-size:14px">${esc(f.monster_hp)}</dd></div><div><dt>Base EXP ต่อตัว</dt><dd>${esc(f.base_exp)}</dd></div><div><dt>Job EXP ต่อตัว</dt><dd>${esc(f.job_exp)}</dd></div><div><dt>Lumen ต่อตัว</dt><dd>${esc(f.lumen)}</dd></div></dl></section>
  <section class="section" id="open-world"><h2>โลกเปิด <small>จุดวาร์ป · รูปปั้น · หีบ · Lunar Mote</small></h2>
    <dl class="kv">${["waypoint", "statue", "chest", "mote", "viewpoint", "camp", "puzzle"].map(k => `<div><dt>${LM_TH[k]}</dt><dd>${G.landmarks.filter(l => l.kind === k).length}</dd></div>`).join("")}</dl>
    <ul class="facts"><li>จุดวาร์ปตื่นเมื่อเดินเข้าใกล้ แล้ววาร์ปข้ามแผนที่ได้</li>
      <li>รูปปั้นลูนาร่าฟื้น HP เปิดแผนที่รอบข้าง และรับ Lunar Mote — ทุก ${G.open_world.motes_per_level} ลูกเพิ่มสตามินาสูงสุด +${G.open_world.stamina_per_level} (สูงสุด ${G.open_world.max_offer_level} ขั้น = ${100 + G.open_world.max_offer_level * G.open_world.stamina_per_level})</li>
      <li>ปริศนาเตาไฟต้องจุดครบภายใน ${G.open_world.puzzle_seconds} วินาที · เขตที่เปิดตั้งแต่เริ่ม: ${G.open_world.start_revealed.map(esc).join(", ")}</li></ul>
    <div class="tablewrap"><table><thead><tr><th>หีบ</th><th class="num">จำนวนในโลก</th><th>รางวัล</th></tr></thead><tbody>
    ${Object.entries(G.open_world.rewards).map(([t, r]) => `<tr><td><b>${TIER_TH[t] || t}</b></td><td class="num">${G.landmarks.filter(l => l.kind === "chest" && l.tier === t).length}</td><td>${rewardText(r)}</td></tr>`).join("")}</tbody></table></div></section>
  <section class="section" id="discoveries"><h2>จุดค้นพบ <small>เดินเข้าไปครั้งแรกได้รางวัล</small></h2>
    ${G.discoveries.map(d => `<div class="note"><b style="color:var(--ink)">${esc(d.name)}</b> · <a href="#/map/${enc(d.region)}">${esc(d.region)}</a> — ${esc(d.lore)}</div>`).join("")}</section>`;
}

function notFound() { return `<div class="panel" style="padding:40px;text-align:center"><h1>ไม่พบหน้านี้</h1><p class="muted"><a href="#/">กลับหน้าหลัก</a></p></div>`; }

// ---------- router ----------
const ROUTES = {"": home, jobs, job, skills, skill, monsters, monster: monsters, bosses, items, item: items, cards, maps, map, npcs, pets, quests, systems};
let current = {page: null, arg: null};
function route() {
  const [page = "", ...rest] = location.hash.replace(/^#\/?/, "").split("/");
  const arg = rest.join("/") || null;
  $("#results").hidden = true;
  const tab = TAB_OF[page] ?? page;
  document.querySelectorAll(".tab").forEach(t => t.toggleAttribute("aria-current", false) || (t.dataset.tab === tab && t.setAttribute("aria-current", "page")));
  // In a split view, picking another row only swaps the detail pane.
  const split = {monster: ["monsters", "#mdetail", monsterDetail, renderMonsterRows], monsters: ["monsters", "#mdetail", monsterDetail, renderMonsterRows], item: ["items", "#idetail", itemDetail, renderItemRows], items: ["items", "#idetail", itemDetail, renderItemRows]}[page];
  if (split && current.split === split[0] && $(split[1])) {
    const pane = $(split[1]);
    pane.classList.toggle("empty", !arg);
    if (arg) { pane.innerHTML = split[2](arg); if (matchMedia("(max-width:900px)").matches) pane.scrollIntoView({behavior: "smooth", block: "start"}); }
    split[3](arg);
    current = {page, arg, split: split[0]};
    setTitle(page, arg);
    return;
  }
  const view = ROUTES[page] || notFound;
  $("#view").innerHTML = view(arg);
  current = {page, arg, split: split?.[0]};
  if (split) split[3](arg);
  wirePage();
  setTitle(page, arg);
  window.scrollTo(0, 0);
}
function setTitle(page, arg) {
  const tab = TABS.find(t => t[0] === (TAB_OF[page] ?? page));
  const name = arg ? (C.items[arg]?.name || G.monsters[arg]?.name || C.skills[arg]?.name || decodeURIComponent(arg)) : null;
  document.title = [name, tab && tab[0] ? tab[1] : null, "วิกิ " + B.name].filter(Boolean).join(" · ");
}
function wirePage() {
  const hq = $("#hero-q"); if (hq) wireSearch(hq);
  const mq = $("#mq");
  if (mq) {
    mq.addEventListener("input", () => { mf.q = mq.value.trim().toLowerCase(); renderMonsterRows(current.arg); });
    document.querySelectorAll("[data-mf]").forEach(s => s.addEventListener("change", () => { mf[s.dataset.mf] = s.value; renderMonsterRows(current.arg); }));
  }
  const iq = $("#iq");
  if (iq) {
    iq.addEventListener("input", () => { itf.q = iq.value.trim().toLowerCase(); renderItemRows(current.arg); });
    document.querySelectorAll("[data-itemcat]").forEach(b => b.addEventListener("click", () => { itf.cat = b.dataset.itemcat; document.querySelectorAll("[data-itemcat]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderItemRows(current.arg); }));
  }
  document.querySelectorAll("[data-skilljob]").forEach(b => b.addEventListener("click", () => { skillJob = b.dataset.skilljob; $("#view").innerHTML = skills(); wirePage(); }));
}

// zoom viewer: opens the full-resolution original PNG
function openArt(id) {
  const a = art(id); if (!a) return;
  $("#viewer-img").src = a.original; $("#viewer-img").alt = a.name;
  $("#viewer-cap").textContent = `${a.name} · ${a.id} · ภาพต้นฉบับ ${a.width}×${a.height}`;
  $("#viewer").showModal();
}
document.addEventListener("click", e => { const z = e.target.closest("[data-zoom]"); if (z) openArt(z.dataset.zoom); });
document.addEventListener("keydown", e => { const z = e.target.closest?.("[data-zoom]"); if (z && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openArt(z.dataset.zoom); } });
$("#viewer-close").addEventListener("click", () => $("#viewer").close());
$("#viewer").addEventListener("click", e => { if (e.target === $("#viewer")) $("#viewer").close(); });

$("#brand-name").textContent = B.name.toUpperCase();
$("#brand-sub").textContent = B.subtitle.toUpperCase() + " · วิกิ";
$("#exported").textContent = "ส่งออกล่าสุด " + G.exported.replace("T", " ") + " UTC";
wireSearch($("#q"));
window.addEventListener("hashchange", route);
route();
