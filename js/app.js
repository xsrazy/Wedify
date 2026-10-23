// ============================================================
// WEDIFY — template undangan digital ala aplikasi streaming musik
// EDIT BAGIAN INI untuk memakai template ini:
// ============================================================
const CONFIG = {
  groomShort: "Usra",
  brideShort: "Zee",
  weddingDateISO: "2050-01-17T10:00:00+07:00", // tanggal + jam akad (WIB)
  storageKey: "wedify_wishes_v1",
};
// ============================================================

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

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
const target = new Date(CONFIG.weddingDateISO).getTime();
function tickCountdown() {
  const diff = Math.max(0, target - Date.now());
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

// ---- Follow artis ----
$$(".follow-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const on = btn.classList.toggle("following");
    btn.textContent = on ? "Following" : "Follow";
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

// ---- Buku tamu (demo: localStorage) ----
// Template note: ganti penyimpanan ini dengan backend kamu sendiri untuk produksi.
function loadWishes() {
  try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || []; }
  catch (e) { return []; }
}
function esc(t) {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function renderWishes() {
  const list = loadWishes();
  const box = $("#wishList");
  $("#wishEmpty").classList.toggle("off", list.length > 0);
  box.innerHTML = list.map((w) => {
    const absent = w.presence === "Berhalangan";
    const when = new Date(w.ts).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    return '<div class="wish"><div class="wish-head"><span class="wish-name">' + esc(w.name) +
      '</span><span class="wish-badge' + (absent ? " absent" : "") + '">' + esc(w.presence) +
      '</span></div><div class="wish-msg">' + esc(w.msg) +
      '</div><div class="wish-time">' + when + "</div></div>";
  }).join("");
}
renderWishes();

$("#wishForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#wishName").value.trim();
  const msg = $("#wishMsg").value.trim();
  if (!name || !msg) return;
  const list = loadWishes();
  list.unshift({ name, presence: $("#wishPresence").value, msg, ts: Date.now() });
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(list.slice(0, 200)));
  $("#wishMsg").value = "";
  renderWishes();
  $("#wishList").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---- Bagikan ----
(function buildShare() {
  const url = encodeURIComponent(location.href);
  const text = encodeURIComponent("Dengerin album pernikahan Usra & Zee di Wedify: undangan digital ala Spotify, gratis & open source!");
  $("#shareWa").href = "https://wa.me/?text=" + text + "%20" + url;
  $("#shareTg").href = "https://t.me/share/url?url=" + url + "&text=" + text;
  $("#shareFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + url;
  $("#shareX").href = "https://twitter.com/intent/tweet?url=" + url + "&text=" + text;
})();
