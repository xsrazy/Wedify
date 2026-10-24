// ============================================================
// WEDIFY — undangan digital ala aplikasi streaming musik.
// Semua konten halaman ini datang dari backend (GET /api/config)
// dan diatur lewat dashboard (/dashboard). Nilai DEFAULT di bawah
// hanya cadangan kalau API sedang tidak bisa dihubungi.
// ============================================================
const DEFAULT_SITE = {
  groom_name: "Rahmatul Usra", bride_name: "Azizi Asadel",
  album_title: "USRA & ZEE",
  music_title: "River Flows in You", music_artist: "Usra & Zee",
  groom_short: "Usra", bride_short: "Zee",
  groom_parents: "Bapak ... & Ibu ...", groom_listeners: "1.205",
  bride_parents: "Bapak ... & Ibu ...", bride_listeners: "1.748",
  album_subtitle: "The Wedding Album • 2050",
  album_art: "/assets/images/album.webp",
  groom_photo: "/assets/images/cowo.webp", bride_photo: "/assets/images/cewe.webp",
  music_url: "/assets/music/sound.mp3",
  wedding_iso: "2050-01-17T10:00:00+07:00",
  date_label: "Senin, 17 Januari 2050",
  akad_time: "10.00 WIB", akad_desc: "Akad Nikah",
  resepsi_time: "13.00 WIB", resepsi_desc: "Resepsi",
  venue_name: "Jam Gadang",
  venue_address: "Jl. Raya Bukittinggi - Payakumbuh, Benteng Pasar Atas, Bukittinggi, Sumatera Barat",
  maps_url: "https://www.google.com/maps/search/?api=1&query=Jam+Gadang+Bukittinggi",
  cal_start: "20500117T030000Z", cal_end: "20500117T040000Z",
  dress_1: "Batik", dress_2: "Dominasi warna hitam",
  lyrics_text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
  lyrics_source: "QS. Ar-Rum ayat 21",
  wrapped_match: "100%", wrapped_genre: "Takdir", wrapped_collab: "Usra × Zee",
  gift1_bank: "SeaBank", gift1_number: "123456784848", gift1_owner: "Rahmatul Usra",
  gift2_bank: "DANA", gift2_number: "081234561748", gift2_owner: "Rahmatul Usra",
  gallery_urls: [1, 2, 3, 4, 5, 6].map((n) => "https://picsum.photos/seed/wedify" + n + "/600/600").join("\n"),
  share_text: "",
};
let SITE = { ...DEFAULT_SITE };
let ACCESS_KEY = "";
let followState = { groom: false, bride: false };
let followCounts = { groom: 0, bride: 0 };

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const setText = (sel, txt) => { const el = $(sel); if (el && txt !== undefined && txt !== null) el.textContent = txt; };

// ---- Nama tamu dari ?to=Nama ----
const params = new URLSearchParams(location.search);
const guest = (params.get("to") || "").trim();
if (guest) {
  $("#coverGuest").hidden = false;
  $("#guestName").textContent = guest;
  $("#npGuest").textContent = guest;
  $("#topGuest").textContent = "Untuk: " + guest;
  $("#wishName").value = guest;
}

// ---- Audio / player ----
const audio = $("#audio");
const playBtn = $("#playBtn");
const heroPlay = $("#heroPlay");
const playerBar = $("#playerBar");
const curTime = $("#curTime");
const durTime = $("#durTime");

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + String(s).padStart(2, "0");
}
function setPlayIcon() {
  const glyph = audio.paused ? "▶" : "❚❚";
  playBtn.textContent = glyph;
  if (heroPlay) heroPlay.textContent = glyph;
  const t1 = $("#track1Row");
  if (t1) t1.classList.toggle("eq", !audio.paused);
}
playBtn.addEventListener("click", () => {
  if (audio.paused) audio.play(); else audio.pause();
});
if (heroPlay) {
  heroPlay.addEventListener("click", () => {
    if (audio.paused) audio.play(); else audio.pause();
  });
}
audio.addEventListener("play", setPlayIcon);
audio.addEventListener("pause", setPlayIcon);
audio.addEventListener("loadedmetadata", () => { durTime.textContent = fmt(audio.duration); });
audio.addEventListener("durationchange", () => { durTime.textContent = fmt(audio.duration); });
if (audio.readyState >= 1 && isFinite(audio.duration) && audio.duration > 0) durTime.textContent = fmt(audio.duration);
audio.addEventListener("timeupdate", () => {
  curTime.textContent = fmt(audio.currentTime);
  if (audio.duration) playerBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
});
$("#likeBtn").addEventListener("click", (e) => {
  e.currentTarget.classList.toggle("liked");
  e.currentTarget.textContent = e.currentTarget.classList.contains("liked") ? "♥" : "♡";
});

// ---- Buka undangan ----
$("#openBtn").addEventListener("click", () => {
  const cover = $("#cover");
  cover.classList.add("opening");
  $("#app").hidden = false;
  document.body.style.overflow = "";
  audio.play().catch(() => {});
  setTimeout(() => cover.remove(), 750);
  window.scrollTo(0, 0);
});
document.body.style.overflow = "hidden"; // kunci scroll selama cover tampil

// ---- Countdown ----
// An empty/invalid wedding_iso must never turn the cells into NaN: keep
// the previous (or default) target instead (audit fix).
const toTargetMs = (iso, fallback) => {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : fallback;
};
let targetMs = toTargetMs(SITE.wedding_iso, new Date(DEFAULT_SITE.wedding_iso).getTime());
function tickCountdown() {
  const diff = Math.max(0, targetMs - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;
  $("#cdDays").textContent = d;
  $("#cdHours").textContent = h;
  $("#cdMins").textContent = m;
  $("#cdSecs").textContent = s;
  $("#wDays").textContent = d.toLocaleString("id-ID");
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ---- Follow artis (beneran, kesimpen di backend) ----
let currentArtist = "groom";
function renderFollows() {
  $$(".follow-btn").forEach((btn) => {
    const artist = btn.dataset.artist;
    if (!artist) return;
    const on = Boolean(followState[artist]);
    btn.classList.toggle("following", on);
    btn.textContent = on ? "Following" : "Follow";
    const fans = document.getElementById(artist === "groom" ? "fansGroom" : "fansBride");
    if (fans) fans.textContent = followCounts[artist].toLocaleString("id-ID") + " penggemar";
  });
  const avFans = $("#avFans");
  if (avFans && currentArtist) {
    avFans.textContent = followCounts[currentArtist].toLocaleString("id-ID") + " penggemar";
  }
}
$$(".follow-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const artist = btn.dataset.artist;
    if (!artist || !ACCESS_KEY) { // fallback kosmetik kalau API mati
      const on = btn.classList.toggle("following");
      btn.textContent = on ? "Following" : "Follow";
      return;
    }
    btn.disabled = true;
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-key": ACCESS_KEY },
        body: JSON.stringify({ artist }),
      });
      const json = await res.json();
      if (json && json.data) {
        followState[artist] = json.data.following;
        followCounts[artist] = json.data.count;
        renderFollows();
      }
    } catch (e) { /* abaikan, status tombol tetap */ }
    btn.disabled = false;
  });
});

// ---- Halaman artis (view kedua, ala profil artis) ----
function fillArtistView(artist) {
  currentArtist = artist;
  const isGroom = artist === "groom";
  const name = isGroom ? (SITE.groom_name || SITE.groom_short) : (SITE.bride_name || SITE.bride_short);
  const photo = isGroom ? SITE.groom_photo : SITE.bride_photo;
  const parents = isGroom ? SITE.groom_parents : SITE.bride_parents;
  const listeners = isGroom ? SITE.groom_listeners : SITE.bride_listeners;
  const role = isGroom ? "Putra" : "Putri";
  const duo = SITE.groom_short + " & " + SITE.bride_short;
  setText("#avName", name);
  const ph = $("#avPhoto"); if (ph) ph.src = photo;
  setText("#avSub", role + " dari " + parents + " • " + listeners + " pendengar bulanan");
  setText("#avAbout", role + " dari " + parents + " • " + listeners + " pendengar bulanan. Separuh dari duo " + duo + ", bintang utama album pernikahan ini.");
  const fb = $("#avFollow"); if (fb) fb.dataset.artist = artist;
  setText("#avTrack1Title", SITE.akad_desc);
  setText("#avTrack1Meta", SITE.date_label + " • " + SITE.akad_time + " • " + SITE.venue_name);
  setText("#avTrack2Title", SITE.resepsi_desc);
  setText("#avTrack2Meta", SITE.date_label + " • " + SITE.resepsi_time + " • " + SITE.venue_name);
  const d1 = $(".av-dur-1"); if (d1) d1.textContent = durLabel(SITE.akad_time);
  const d2 = $(".av-dur-2"); if (d2) d2.textContent = durLabel(SITE.resepsi_time);
  renderFollows();
}
function openArtist(artist) {
  if (artist !== "groom" && artist !== "bride") return;
  fillArtistView(artist);
  $("#albumView").hidden = true;
  $("#artistView").hidden = false;
  window.scrollTo(0, 0);
}
function closeArtist() {
  $("#artistView").hidden = true;
  $("#albumView").hidden = false;
  window.scrollTo(0, 0);
}
$$(".artist-open").forEach((el) => {
  el.addEventListener("click", () => openArtist(el.dataset.artist));
});
const avBackBtn = $("#avBack");
if (avBackBtn) avBackBtn.addEventListener("click", closeArtist);

// ---- Tombol salin ----
function copyText(text, btn) {
  const done = () => {
    const old = btn.textContent;
    btn.textContent = "Disalin ✓";
    setTimeout(() => { btn.textContent = old; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  ta.remove(); done();
}
$$(".salin-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.copyLink) copyText(location.href, btn);
    else copyText(btn.dataset.copy || "", btn);
  });
});

// ---- Buku tamu (backend: GET/POST /api/comment) ----
function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
let wishes = [];
const OWN_KEY = "wedify_own_v1";
const LIKE_KEY = "wedify_likes_v1";
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* abaikan */ } },
};
let replyOpenFor = null;
let editingFor = null;

function findWish(list, uuid) {
  for (const w of list) {
    if (w.uuid === uuid) return w;
    const hit = findWish(Array.isArray(w.comments) ? w.comments : [], uuid);
    if (hit) return hit;
  }
  return null;
}

function wishHtml(w) {
  const absent = w.presence === false;
  const unsure = w.presence === 'ragu';
  const badge = absent ? "Berhalangan" : unsure ? "Masih Ragu" : "Datang";
  const ownMap = store.get(OWN_KEY);
  const likeMap = store.get(LIKE_KEY);
  const liked = Boolean(likeMap[w.uuid]);
  const love = (w.like && w.like.love) || 0;
  const kids = Array.isArray(w.comments) ? w.comments : [];
  let h = '<div class="wish" data-uuid="' + w.uuid + '">';
  h += '<div class="wish-head"><span class="wish-name">' + esc(w.name) +
    (w.is_admin ? ' <span class="wish-admin">Admin</span>' : "") +
    '</span><span class="wish-badge' + (absent ? " absent" : unsure ? " unsure" : "") + '">' + badge + "</span></div>";
  if (editingFor === w.uuid) {
    h += '<form class="wish-edit-form" data-edit-form="' + w.uuid + '">' +
      '<textarea class="f-in" name="emsg" rows="3" maxlength="500" required>' + esc(w.comment) + "</textarea>" +
      '<span class="wish-form-btns"><button class="btn btn-green" type="submit">Simpan</button>' +
      '<button class="btn btn-ghost" type="button" data-cancel-edit="1">Batal</button></span></form>';
  } else {
    h += '<div class="wish-msg">' + esc(w.comment) + "</div>";
  }
  h += '<div class="wish-foot"><span class="wish-time">' + esc(w.created_at || "") + '</span>' +
    '<span class="wish-actions">' +
    '<button type="button" class="wish-act wish-like' + (liked ? " liked" : "") + '" data-like="' + w.uuid + '">♥ <span>' + love + "</span></button>" +
    '<button type="button" class="wish-act" data-reply="' + w.uuid + '">Balas</button>' +
    (ownMap[w.uuid] ? '<button type="button" class="wish-act" data-edit="' + w.uuid + '">Edit</button>' +
      '<button type="button" class="wish-act" data-del="' + w.uuid + '">Hapus</button>' : "") +
    "</span></div>";
  if (replyOpenFor === w.uuid) {
    h += '<form class="wish-reply-form" data-reply-form="' + w.uuid + '">' +
      '<input class="f-in" name="rname" type="text" placeholder="Nama kamu" maxlength="60" required>' +
      '<textarea class="f-in" name="rmsg" rows="2" placeholder="Tulis balasan..." maxlength="500" required></textarea>' +
      '<span class="wish-form-btns"><button class="btn btn-green" type="submit">Kirim Balasan</button>' +
      '<button class="btn btn-ghost" type="button" data-cancel-reply="1">Batal</button></span></form>';
  }
  if (kids.length) {
    h += '<div class="wish-replies">' + kids.map((k) => wishHtml(k)).join("") + "</div>";
  }
  h += "</div>";
  return h;
}

function renderWishes() {
  const box = $("#wishList");
  $("#wishEmpty").classList.toggle("off", wishes.length > 0);
  box.innerHTML = wishes.map((w) => wishHtml(w)).join("");
}

async function loadWishes() {
  if (!ACCESS_KEY) return;
  try {
    const res = await fetch("/api/comment?per=50&next=0", { headers: { "x-access-key": ACCESS_KEY } });
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      wishes = json.data;
      renderWishes();
    }
  } catch (e) { /* biarkan kosong */ }
}

async function toggleLike(uuid, btn) {
  const likeMap = store.get(LIKE_KEY);
  const w = findWish(wishes, uuid);
  if (!w) return;
  btn.disabled = true;
  try {
    if (likeMap[uuid]) {
      const res = await fetch("/api/comment/" + encodeURIComponent(likeMap[uuid]), {
        method: "PATCH", headers: { "x-access-key": ACCESS_KEY },
      });
      if (res.ok) {
        delete likeMap[uuid];
        w.like = w.like || { love: 0 };
        w.like.love = Math.max(0, (w.like.love || 0) - 1);
      }
    } else {
      const res = await fetch("/api/comment/" + encodeURIComponent(uuid), {
        method: "POST", headers: { "x-access-key": ACCESS_KEY },
      });
      const json = await res.json();
      if (res.ok && json.data && json.data.uuid) {
        likeMap[uuid] = json.data.uuid;
        w.like = w.like || { love: 0 };
        w.like.love = (w.like.love || 0) + 1;
      }
    }
    store.set(LIKE_KEY, likeMap);
    renderWishes();
  } catch (e) { /* abaikan */ } finally {
    btn.disabled = false;
  }
}

$("#wishList").addEventListener("click", async (e) => {
  const likeBtn = e.target.closest("[data-like]");
  if (likeBtn) { toggleLike(likeBtn.dataset.like, likeBtn); return; }
  const replyBtn = e.target.closest("[data-reply]");
  if (replyBtn) {
    replyOpenFor = replyOpenFor === replyBtn.dataset.reply ? null : replyBtn.dataset.reply;
    editingFor = null;
    renderWishes();
    const ta = $("#wishList").querySelector("[data-reply-form] textarea");
    if (ta) ta.focus();
    return;
  }
  if (e.target.closest("[data-cancel-reply]")) { replyOpenFor = null; renderWishes(); return; }
  if (e.target.closest("[data-cancel-edit]")) { editingFor = null; renderWishes(); return; }
  const editBtn = e.target.closest("[data-edit]");
  if (editBtn) { editingFor = editBtn.dataset.edit; replyOpenFor = null; renderWishes(); return; }
  const delBtn = e.target.closest("[data-del]");
  if (delBtn) {
    const uuid = delBtn.dataset.del;
    const ownMap = store.get(OWN_KEY);
    if (!ownMap[uuid]) return;
    if (!delBtn.dataset.armed) {
      delBtn.dataset.armed = "1";
      delBtn.textContent = "Yakin hapus?";
      delBtn.classList.add("armed");
      setTimeout(() => {
        if (delBtn.isConnected) {
          delete delBtn.dataset.armed;
          delBtn.textContent = "Hapus";
          delBtn.classList.remove("armed");
        }
      }, 3500);
      return;
    }
    try {
      const res = await fetch("/api/comment/" + encodeURIComponent(ownMap[uuid]), {
        method: "DELETE", headers: { "x-access-key": ACCESS_KEY },
      });
      if (res.ok) {
        delete ownMap[uuid];
        store.set(OWN_KEY, ownMap);
        loadWishes();
      } else {
        alert("Gagal menghapus ucapan.");
      }
    } catch (err) { alert("Koneksi bermasalah, coba lagi."); }
  }
});

$("#wishList").addEventListener("submit", async (e) => {
  const replyForm = e.target.closest("[data-reply-form]");
  const editForm = e.target.closest("[data-edit-form]");
  if (!replyForm && !editForm) return;
  e.preventDefault();
  const fd = new FormData(e.target);
  if (replyForm) {
    const parentUuid = replyForm.dataset.replyForm;
    const name = String(fd.get("rname") || "").trim();
    const msg = String(fd.get("rmsg") || "").trim();
    if (!name || !msg) return;
    const presenceVal = $("#wishPresence").value;
    const presence = presenceVal === "Berhalangan" ? 2 : presenceVal === "Masih Ragu" ? 3 : 1;
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-key": ACCESS_KEY },
        body: JSON.stringify({ name, presence, comment: msg, id: parentUuid }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) { alert((json.error && json.error[0]) || "Gagal mengirim balasan."); return; }
      const ownMap = store.get(OWN_KEY);
      ownMap[json.data.uuid] = json.data.own;
      store.set(OWN_KEY, ownMap);
      replyOpenFor = null;
      loadWishes();
    } catch (err) { alert("Koneksi bermasalah, coba lagi."); }
  }
  if (editForm) {
    const uuid = editForm.dataset.editForm;
    const ownMap = store.get(OWN_KEY);
    const msg = String(fd.get("emsg") || "").trim();
    if (!ownMap[uuid] || !msg) return;
    try {
      const res = await fetch("/api/comment/" + encodeURIComponent(ownMap[uuid]), {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-access-key": ACCESS_KEY },
        body: JSON.stringify({ comment: msg }),
      });
      const json = await res.json();
      if (!res.ok) { alert((json.error && json.error[0]) || "Gagal menyimpan perubahan."); return; }
      const w = findWish(wishes, uuid);
      if (w) w.comment = msg;
      editingFor = null;
      renderWishes();
    } catch (err) { alert("Koneksi bermasalah, coba lagi."); }
  }
});

$("#wishForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#wishName").value.trim();
  const msg = $("#wishMsg").value.trim();
  if (!name || !msg) return;
  if (!ACCESS_KEY) { alert("Buku tamu lagi tidak tersedia, coba lagi nanti."); return; }
  const presenceVal = $("#wishPresence").value;
  const presence = presenceVal === "Berhalangan" ? 2 : presenceVal === "Masih Ragu" ? 3 : 1;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-key": ACCESS_KEY },
      body: JSON.stringify({ name, presence, comment: msg }),
    });
    const json = await res.json();
    if (!res.ok || !json.data) {
      alert((json.error && json.error[0]) || "Gagal mengirim ucapan.");
      return;
    }
    const ownMap = store.get(OWN_KEY);
    ownMap[json.data.uuid] = json.data.own;
    store.set(OWN_KEY, ownMap);
    wishes.unshift(json.data);
    renderWishes();
    $("#wishMsg").value = "";
    $("#wishList").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert("Koneksi bermasalah, coba lagi.");
  } finally {
    btn.disabled = false;
  }
});

// ---- Terapkan konten dari backend ----
function maskNumber(num) {
  const last4 = String(num).slice(-4);
  return String(num).length > 8 ? "•••• •••• •••• " + last4 : "•••• •••• " + last4;
}
function durLabel(timeText) {
  return String(timeText || "").replace(" WIB", "").replace(".", ":");
}
function applySite() {
  const year = String(SITE.wedding_iso || "").slice(0, 4) || "2050";
  const duo = SITE.groom_short + " & " + SITE.bride_short;
  document.title = "Wedify — " + duo + ": " + String(SITE.album_subtitle || "").split("•")[0].trim();
  setText("#coverLabel", "WEDIFY ORIGINAL SOUNDTRACK • " + year);
  const ct = $("#coverTitle");
  if (ct) ct.innerHTML = esc(SITE.album_title || duo) + ":<br>" + esc(String(SITE.album_subtitle || "").split("•")[0].trim());
  const ht = $("#heroTitle");
  if (ht) ht.innerHTML = esc(SITE.album_title || duo) + ":<br>" + esc(String(SITE.album_subtitle || "").split("•")[0].trim());
  const hga = $("#heroGroomAva"); if (hga) hga.src = SITE.groom_photo;
  const hba = $("#heroBrideAva"); if (hba) hba.src = SITE.bride_photo;
  const hd = $(".hero-duo"); if (hd) hd.textContent = duo;
  setText("#coverArtist", "Album • " + duo);
  setText("#coverMeta", SITE.wrapped_match + " match • 2 tracks • 1 hari spesial");
  $$('img[data-album-art]').forEach((img) => { img.src = SITE.album_art; });
  setText("#npArtist", SITE.music_artist || duo);
  setText("#npTitle", SITE.music_title);
  setText("#playerTitle", SITE.music_title);
  setText("#playerArtist", SITE.music_artist || duo);
  setText("#npMetaText", SITE.wrapped_match + " match • " + year + " • Album • 2 tracks • Untuk: ");
  setText("#cdDate", SITE.date_label + " • " + SITE.venue_name);
  setText("#track1Title", SITE.akad_desc);
  setText("#track1Meta", SITE.date_label + " • " + SITE.akad_time + " • " + SITE.venue_name);
  setText("#track1Dur", durLabel(SITE.akad_time));
  setText("#track2Title", SITE.resepsi_desc);
  setText("#track2Meta", SITE.date_label + " • " + SITE.resepsi_time + " • " + SITE.venue_name);
  setText("#track2Dur", durLabel(SITE.resepsi_time));
  setText("#venueName", SITE.venue_name);
  setText("#venueAddr", SITE.venue_address);
  setText("#chip1", "Dress code: " + SITE.dress_1);
  setText("#chip2", SITE.dress_2);
  const maps = $("#mapsBtn"); if (maps) maps.href = SITE.maps_url;
  const cal = $("#calBtn");
  if (cal) {
    cal.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent(SITE.akad_desc + " " + duo) +
      "&dates=" + SITE.cal_start + "/" + SITE.cal_end +
      "&details=" + encodeURIComponent(SITE.akad_desc + " " + duo + " di " + SITE.venue_name) +
      "&location=" + encodeURIComponent(SITE.venue_name);
  }
  const ga = $("#groomAva"); if (ga) ga.src = SITE.groom_photo;
  const ba = $("#brideAva"); if (ba) ba.src = SITE.bride_photo;
  const gn = $("#groomName"); if (gn) gn.childNodes[0].textContent = (SITE.groom_name || SITE.groom_short) + " ";
  const bn = $("#brideName"); if (bn) bn.childNodes[0].textContent = (SITE.bride_name || SITE.bride_short) + " ";
  setText("#groomSub", "Putra dari " + SITE.groom_parents + " • " + SITE.groom_listeners + " pendengar bulanan");
  setText("#brideSub", "Putri dari " + SITE.bride_parents + " • " + SITE.bride_listeners + " pendengar bulanan");
  setText("#wMatch", SITE.wrapped_match);
  setText("#wGenre", SITE.wrapped_genre);
  setText("#wCollab", SITE.wrapped_collab);
  setText("#lyricsText", '"' + SITE.lyrics_text + '"');
  setText("#lyricsSrc", SITE.lyrics_source);
  const gal = $("#gallery");
  if (gal) {
    const urls = String(SITE.gallery_urls || "").split("\n").map((u) => u.trim()).filter(Boolean);
    if (urls.length) {
      gal.innerHTML = urls.map((u, i) => '<img src="' + esc(u) + '" alt="Galeri ' + (i + 1) + '" loading="lazy">').join("");
      const avGal = $("#avGallery");
      if (avGal) {
        avGal.innerHTML = urls.map((u, i) => '<figure class="av-tile"><img src="' + esc(u) + '" alt="Galeri ' + (i + 1) + '" loading="lazy"><figcaption>Galeri ' + (i + 1) + "</figcaption></figure>").join("");
      }
    }
  }
  setText("#gift1Name", SITE.gift1_bank);
  setText("#gift1Num", maskNumber(SITE.gift1_number));
  setText("#gift1Owner", "a.n. " + SITE.gift1_owner);
  setText("#gift2Name", SITE.gift2_bank);
  setText("#gift2Num", maskNumber(SITE.gift2_number));
  setText("#gift2Owner", "a.n. " + SITE.gift2_owner);
  const g1 = $("#gift1Btn"); if (g1) g1.dataset.copy = SITE.gift1_number;
  const g2 = $("#gift2Btn"); if (g2) g2.dataset.copy = SITE.gift2_number;
  if (audio && SITE.music_url && audio.getAttribute("src") !== SITE.music_url) {
    audio.src = SITE.music_url;
  }
  targetMs = toTargetMs(SITE.wedding_iso, targetMs);
  tickCountdown();
  fillArtistView(currentArtist);
  buildShare();
}

// ---- Bagikan ----
function buildShare() {
  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent(SITE.share_text ||
    ("Dengerin album pernikahan " + SITE.groom_short + " & " + SITE.bride_short + " di Wedify: undangan digital ala Spotify, gratis & open source!"));
  $("#shareWa").href = "https://wa.me/?text=" + text + "%20" + url;
  $("#shareTg").href = "https://t.me/share/url?url=" + url + "&text=" + text;
  $("#shareFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + url;
  $("#shareX").href = "https://twitter.com/intent/tweet?url=" + url + "&text=" + text;
}
buildShare();

// ---- Muat konfigurasi dari backend ----
(async function init() {
  try {
    const res = await fetch("/api/config");
    const json = await res.json();
    if (json && json.data) {
      if (json.data.site) SITE = { ...DEFAULT_SITE, ...json.data.site };
      ACCESS_KEY = json.data.access_key || "";
      if (json.data.follows) followCounts = json.data.follows;
      if (json.data.you_follow) followState = json.data.you_follow;
    }
  } catch (e) { /* pakai nilai bawaan */ }
  applySite();
  renderFollows();
  loadWishes();
})();
