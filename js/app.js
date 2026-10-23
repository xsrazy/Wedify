// ============================================================
// WEDIFY — undangan digital ala aplikasi streaming musik.
// Semua konten halaman ini datang dari backend (GET /api/config)
// dan diatur lewat dashboard (/dashboard). Nilai DEFAULT di bawah
// hanya cadangan kalau API sedang tidak bisa dihubungi.
// ============================================================
const DEFAULT_SITE = {
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
  playBtn.textContent = audio.paused ? "▶" : "❚❚";
}
playBtn.addEventListener("click", () => {
  if (audio.paused) audio.play(); else audio.pause();
});
audio.addEventListener("play", setPlayIcon);
audio.addEventListener("pause", setPlayIcon);
audio.addEventListener("loadedmetadata", () => { durTime.textContent = fmt(audio.duration); });
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
let targetMs = new Date(SITE.wedding_iso).getTime();
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
function renderWishes() {
  const box = $("#wishList");
  $("#wishEmpty").classList.toggle("off", wishes.length > 0);
  box.innerHTML = wishes.map((w) => {
    const absent = w.presence === false;
    const badge = absent ? "Berhalangan" : "Datang";
    return '<div class="wish"><div class="wish-head"><span class="wish-name">' + esc(w.name) +
      '</span><span class="wish-badge' + (absent ? " absent" : "") + '">' + badge +
      '</span></div><div class="wish-msg">' + esc(w.comment) +
      '</div><div class="wish-time">' + esc(w.created_at || "") + "</div></div>";
  }).join("");
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
$("#wishForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#wishName").value.trim();
  const msg = $("#wishMsg").value.trim();
  if (!name || !msg) return;
  if (!ACCESS_KEY) { alert("Buku tamu lagi tidak tersedia, coba lagi nanti."); return; }
  const presence = $("#wishPresence").value === "Berhalangan" ? 2 : 1;
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
  if (ct) ct.innerHTML = esc(duo) + ":<br>" + esc(String(SITE.album_subtitle || "").split("•")[0].trim());
  setText("#coverArtist", "Album • " + duo);
  setText("#coverMeta", SITE.wrapped_match + " match • 2 tracks • 1 hari spesial");
  $$('img[data-album-art]').forEach((img) => { img.src = SITE.album_art; });
  setText("#npArtist", duo);
  setText("#npMetaText", SITE.wrapped_match + " match • " + year + " • Single • Untuk: ");
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
  const gn = $("#groomName"); if (gn) gn.childNodes[0].textContent = SITE.groom_short + " ";
  const bn = $("#brideName"); if (bn) bn.childNodes[0].textContent = SITE.bride_short + " ";
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
  targetMs = new Date(SITE.wedding_iso).getTime();
  tickCountdown();
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
