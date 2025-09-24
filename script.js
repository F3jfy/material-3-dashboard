// API KEYS

// Load keys from localStorage, fallback to defaults
const MOBULA_API_KEY = localStorage.getItem("crypto-api-key") || "099a2759-ede8-44f6-b195-9b8c0c251c2f";
const WEATHER_API_KEY = localStorage.getItem("weather-api-key") || "dc99d6329ddd199a51fc74e0eb5d78d9";

// Example default city (can also make this user-editable later)
const city = encodeURIComponent("Prague");







const weatherInput = document.getElementById("weather-api-key");
const cryptoInput = document.getElementById("crypto-api-key");
const saveApiBtn = document.getElementById("save-api-keys");
const resetApiBtn = document.getElementById("reset-api-keys");

// Restore on load
weatherInput.value = localStorage.getItem("weather-api-key") || "";
cryptoInput.value = localStorage.getItem("crypto-api-key") || "";

saveApiBtn.addEventListener("click", () => {
  localStorage.setItem("weather-api-key", weatherInput.value.trim());
  localStorage.setItem("crypto-api-key", cryptoInput.value.trim());
  alert("API keys saved locally ✅ Refresh to apply.");
});

resetApiBtn.addEventListener("click", () => {
  localStorage.removeItem("weather-api-key");
  localStorage.removeItem("crypto-api-key");
  alert("API keys cleared ❌ Refresh to use defaults.");
});



document.addEventListener("click", function(e) {
  const target = e.target.closest(".md-button");
  if (!target) return;
  const circle = document.createElement("span");
  circle.classList.add("ripple");
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.width = circle.style.height = size + "px";
  circle.style.left = e.clientX - rect.left - size / 2 + "px";
  circle.style.top = e.clientY - rect.top - size / 2 + "px";
  target.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
});

// Time + Greeting
function updateTime() {
  const now = new Date();
  document.getElementById("time").textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  const hour = now.getHours();
  let greeting = "Hello";
  if (hour < 12) greeting = "Good morning ☀️";
  else if (hour < 18) greeting = "Good afternoon 🌤️";
  else greeting = "Good evening 🌙";
  document.getElementById("greeting").textContent = greeting;
}
setInterval(updateTime, 1000);
updateTime();



function updateWeather() {
  const key = localStorage.getItem("weather-api-key") || WEATHER_API_KEY;
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},CZ&units=metric&appid=${key}`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) return;
      document.getElementById("temp").textContent = `${Math.round(data.main.temp)}°C`;
      document.getElementById("description").textContent = data.weather[0].description;
      document.getElementById("weather-icon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    })
    .catch(err => console.error(err));
}

// Call on load
updateWeather();



// To-Do List
const todoInput = document.getElementById("todo-text");
const todoList = document.getElementById("todo-list");
let todos = JSON.parse(localStorage.getItem("todos") || "[]");

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";
  if (todos.length === 0) {
    // Optional: Show a message when the list is empty
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "All tasks done! 🎉";
    emptyLi.style.justifyContent = "center";
    emptyLi.style.color = "var(--on-surface-variant)";
    todoList.appendChild(emptyLi);
    return;
  }
  
  todos.forEach((todoText, index) => {
    const li = document.createElement("li");
    li.textContent = todoText;
    
    const btn = document.createElement("button");
    const icon = document.createElement("span");
    icon.className = "material-icons-round";
    icon.textContent = "delete";
    btn.appendChild(icon);

    btn.onclick = () => {
      // Animate OUT
      li.classList.add("removing");
      
      // Wait for animation to finish, then remove from data and re-render
      li.addEventListener('animationend', () => {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
      }, { once: true }); // Important: listener runs only once
    };
    
    li.appendChild(btn);
    todoList.appendChild(li);
  });
}

document.getElementById("add-todo").onclick = () => {
  const taskText = todoInput.value.trim();
  if (taskText) {
    // Add to data
    todos.push(taskText);
    saveTodos();

    // Optimistically render the new item with an animation
    if (todos.length === 1 && todoList.querySelector("li").textContent.includes("All tasks done")) {
      todoList.innerHTML = ""; // Clear the "empty" message
    }

    const li = document.createElement("li");
    li.textContent = taskText;
    li.classList.add("adding"); // Add class for IN animation

    const btn = document.createElement("button");
    const icon = document.createElement("span");
    icon.className = "material-icons-round";
    icon.textContent = "delete";
    btn.appendChild(icon);
    
    // We need to re-assign the click handler logic here
    btn.onclick = () => {
      li.classList.add("removing");
      li.addEventListener('animationend', () => {
        // Find the correct index before splicing
        const currentIndex = todos.indexOf(taskText);
        if (currentIndex > -1) {
            todos.splice(currentIndex, 1);
        }
        saveTodos();
        renderTodos();
      }, { once: true });
    };

    li.appendChild(btn);
    todoList.appendChild(li);
    
    // Clean up animation class after it finishes
    li.addEventListener('animationend', () => {
      li.classList.remove("adding");
    }, { once: true });
    
    todoInput.value = "";
  }
};

// Initial render
renderTodos();
  // Overlay toggle
// --- Settings Panel Toggle ---
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsPanel = document.getElementById('settings-panel');

openSettingsBtn.addEventListener('click', () => {
  settingsPanel.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('active');
});


// --- Theme Swatches ---
document.querySelectorAll(".swatch").forEach(swatch => {
  swatch.addEventListener("click", () => {
    const theme = swatch.dataset.theme;

    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
      createOrbs('default');
      container.style.background = '#1c1b1f';
    } else {
      document.documentElement.setAttribute('data-theme', theme); 

      if(theme === 'purple') container.style.background = '#2c1a3f';
      if(theme === 'blue')   container.style.background = '#0b1e33';
      if(theme === 'green')  container.style.background = '#0d250e';
    }
  });
});
// --- Background Uploader with Preview & localStorage ---
const bgUpload = document.getElementById("bg-upload");
const removeBg = document.getElementById("remove-bg");

// Create preview elements
let bgPreview = document.getElementById("bg-preview");
if (!bgPreview) {
  bgPreview = document.createElement("div");
  bgPreview.id = "bg-preview";
  bgPreview.style.display = "flex";
  bgPreview.style.alignItems = "center";
  bgPreview.style.gap = "0.5rem";
  bgPreview.style.marginTop = "0.5rem";

  const bgThumb = document.createElement("img");
  bgThumb.id = "bg-thumb";
  bgThumb.style.width = "50px";
  bgThumb.style.height = "50px";
  bgThumb.style.objectFit = "cover";
  bgThumb.style.borderRadius = "0.75rem";
  bgThumb.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

  const bgName = document.createElement("span");
  bgName.id = "bg-name";
  bgName.style.font = "var(--font-body)";
  bgName.style.color = "var(--on-surface-variant)";
  bgName.style.maxWidth = "150px";
  bgName.style.overflow = "hidden";
  bgName.style.textOverflow = "ellipsis";
  bgName.style.whiteSpace = "nowrap";

  bgPreview.appendChild(bgThumb);
  bgPreview.appendChild(bgName);

  const container = document.querySelector(".background-controls");
  container.appendChild(bgPreview);
}

const bgThumb = document.getElementById("bg-thumb");
const bgName = document.getElementById("bg-name");

// Load saved background if it exists
window.addEventListener("DOMContentLoaded", () => {
  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    
    bgThumb.src = savedBg;
    bgName.textContent = "Saved Background";
    bgPreview.style.display = "flex";
  }
});

bgUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const bgData = ev.target.result;

      // Apply background
      document.body.style.backgroundImage = `url(${bgData})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";

      // Save to localStorage
      localStorage.setItem("customBackground", bgData);

      // Show preview
      bgThumb.src = bgData;
      bgName.textContent = file.name;
      bgPreview.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }
});

removeBg.addEventListener("click", () => {
  document.body.style.backgroundImage = "";
  localStorage.removeItem("customBackground");

  // Hide preview
  bgThumb.src = "";
  bgName.textContent = "";
  bgPreview.style.display = "none";
});


// --- Theme Color Picker with localStorage ---
const swatches = document.querySelectorAll(".swatch");

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    const theme = swatch.dataset.theme; 
    applyTheme(theme);
    localStorage.setItem("colorTheme", theme);
  });
});

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
  }); 
});

window.addEventListener("DOMContentLoaded", () => {
  // --- Load background ---
  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";

    bgThumb.src = savedBg;
    bgName.textContent = "Saved Background";
    bgPreview.style.display = "flex";
  }

  // --- Load theme ---
  const savedTheme = localStorage.getItem("colorTheme");
  if (savedTheme) {
    applyTheme(savedTheme);
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
    const selected = document.querySelector(`.swatch[data-theme="${savedTheme}"]`);
    if (selected) selected.classList.add('selected');
  }
});

// ===== Shortcuts: edit mode + reorder + edit name/link/icon + persistence =====
const editBtn = document.getElementById("edit-shortcuts");
const shortcutsList = document.getElementById("shortcuts-list");

const modal = document.getElementById("shortcut-editor");
const inputName = document.getElementById("edit-name");
const inputLink = document.getElementById("edit-link");
const inputImgUrl = document.getElementById("edit-img-url");
const inputFile = document.getElementById("edit-file");
const previewImg = document.getElementById("edit-preview");
const btnSave = document.getElementById("editor-save");
const btnCancel = document.getElementById("editor-cancel");

let editMode = false;
let dragged = null;
let placeholder = null;
let currentEl = null;

// ---- helpers
function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  // if it already has a scheme like http:, https:, mailto:, etc — keep it
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return trimmed;
  // if it starts with // (protocol-relative), add https:
  if (/^\/\//.test(trimmed)) return "https:" + trimmed;
  // otherwise, assume https
  return "https://" + trimmed.replace(/^\/+/, "");
}

function getDataFromDOM() {
  return [...shortcutsList.children].map(el => ({
    id: el.dataset.id,
    name: el.querySelector(".shortcut-name")?.textContent?.trim() || el.textContent.trim(),
    link: el.getAttribute("href"),
    img: el.querySelector("img")?.getAttribute("src") || "",
  }));
}

function applyDataToDOM(arr) {
  arr.forEach(d => {
    const el = shortcutsList.querySelector(`[data-id="${d.id}"]`);
    if (!el) return;
    const nameEl = el.querySelector(".shortcut-name");
    const imgEl = el.querySelector("img");
    if (nameEl) nameEl.textContent = d.name || "";
    if (imgEl && d.img) imgEl.src = d.img;
    if (d.link) el.setAttribute("href", d.link);
    shortcutsList.appendChild(el); // re-order
  });
}

function saveShortcuts() {
  localStorage.setItem("shortcutsData", JSON.stringify(getDataFromDOM()));
}

function loadShortcuts() {
  const saved = JSON.parse(localStorage.getItem("shortcutsData") || "null");
  if (saved && Array.isArray(saved)) applyDataToDOM(saved);
  // upgrade: ensure <span.shortcut-name> exists
  [...shortcutsList.children].forEach(el => {
    if (!el.querySelector(".shortcut-name")) {
      const text = (el.textContent || "").trim();
      // clear and rebuild: img + span
      const img = el.querySelector("img");
      el.textContent = "";
      if (img) el.appendChild(img);
      const s = document.createElement("span");
      s.className = "shortcut-name";
      s.textContent = text;
      el.appendChild(s);
    }
  });
}
loadShortcuts();

// ---- edit mode toggle
editBtn.addEventListener("click", () => {
  editMode = !editMode;
  editBtn.classList.toggle("active", editMode);
  [...shortcutsList.children].forEach(a => {
    a.draggable = editMode;
    a.classList.toggle("editing", editMode);
  });
});

// prevent navigation while in edit mode
shortcutsList.addEventListener("click", e => {
  if (!editMode) return;
  e.preventDefault();
  const a = e.target.closest("a");
  if (!a) return;
  openEditor(a);
});

// ---- dnd reorder
shortcutsList.addEventListener("dragstart", e => {
  if (!editMode) return;
  const a = e.target.closest("a");
  if (!a) return;
  dragged = a;
  a.classList.add("dragging");

  placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  shortcutsList.insertBefore(placeholder, a.nextSibling);
});

shortcutsList.addEventListener("dragend", e => {
  if (!editMode) return;
  const a = e.target.closest("a");
  if (!a) return;
  a.classList.remove("dragging");
  if (placeholder) {
    shortcutsList.insertBefore(a, placeholder);
    placeholder.remove();
    placeholder = null;
  }
  dragged = null;
  saveShortcuts();
});

shortcutsList.addEventListener("dragover", e => {
  e.preventDefault();
  if (!editMode || !dragged) return;

  const y = e.clientY;
  const siblings = [...shortcutsList.querySelectorAll("a:not(.dragging)")];

  const afterElement = siblings.find(el => {
    const box = el.getBoundingClientRect();
    return y < box.top + box.height / 2;
  });

  if (afterElement) {
    shortcutsList.insertBefore(placeholder, afterElement);
  } else {
    shortcutsList.appendChild(placeholder);
  }
});

// ---- editor (modal) logic
function openEditor(el) {
  currentEl = el;
  const name = el.querySelector(".shortcut-name")?.textContent || "";
  const link = el.getAttribute("href") || "";
  const img = el.querySelector("img")?.getAttribute("src") || "";

  inputName.value = name;
  inputLink.value = link;
  inputImgUrl.value = "";
  previewImg.src = img || "";
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  inputName.focus();
}

function closeEditor() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  inputFile.value = "";
  inputImgUrl.value = "";
  currentEl = null;
}

btnCancel.addEventListener("click", e => {
  e.preventDefault();
  closeEditor();
});

modal.addEventListener("click", e => {
  if (e.target === modal) closeEditor(); // click outside to close
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeEditor();
});

// handle file -> preview
inputFile.addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { previewImg.src = ev.target.result; };
  reader.readAsDataURL(file);
});

// handle pasted image URL -> preview
inputImgUrl.addEventListener("change", () => {
  if (inputImgUrl.value.trim()) {
    previewImg.src = inputImgUrl.value.trim();
  }
});

// save edits
btnSave.addEventListener("click", e => {
  e.preventDefault();
  if (!currentEl) return;

  const name = inputName.value.trim() || "Shortcut";
  const link = normalizeUrl(inputLink.value);
  const imgSrc = previewImg.src || currentEl.querySelector("img")?.getAttribute("src") || "";

  // apply to DOM
  currentEl.querySelector(".shortcut-name").textContent = name;
  currentEl.setAttribute("href", link);
  const imgEl = currentEl.querySelector("img");
  if (imgEl && imgSrc) {
    imgEl.src = imgSrc;
    imgEl.alt = name;
  }

  saveShortcuts();
  closeEditor();
});



const BTC_CACHE_KEY  = 'btcPriceData_v1';
const BTC_CACHE_TIME = 'btcPriceTime_v1';
const CACHE_MS       = 30 * 60 * 1000; // 30 minutes

async function fetchBtcPrice() {
  const now = Date.now();
  const cached = localStorage.getItem(BTC_CACHE_KEY);
  const cachedTime = Number(localStorage.getItem(BTC_CACHE_TIME) || 0);

  // serve from cache if fresh
  if (cached && now - cachedTime < CACHE_MS) {
    try { return JSON.parse(cached); } catch {}
  }

  // fetch live
  const url = 'https://production-api.mobula.io/api/1/market/data?asset=Bitcoin';
  const headers = { 'Content-Type': 'application/json' };
  if (MOBULA_API_KEY && MOBULA_API_KEY !== 'YOUR_API_KEY_HERE') {
    headers['Authorization'] = MOBULA_API_KEY; // per Mobula docs (no "Bearer")
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Mobula returns { data: {...} }
    const d = json?.data || {};
    const payload = {
      price: Number(d.price),
      change24h: Number(d.price_change_24h),
      ts: now
    };

    // cache it
    localStorage.setItem(BTC_CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(BTC_CACHE_TIME, String(now));

    return payload;
  } catch (err) {
    console.warn('Mobula fetch failed, using stale cache if any:', err);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    // total failure fallback
    return { price: NaN, change24h: NaN, ts: now };
  }
}

function renderBtc({ price, change24h, ts }) {
  const priceEl  = document.getElementById('btc-price');
  const changeEl = document.getElementById('btc-change');
  const updEl    = document.getElementById('btc-updated');

  const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  priceEl.textContent = Number.isFinite(price) ? fmt.format(price) : 'N/A';

  // change chip
  const v = Number(change24h);
  const sign = Number.isFinite(v) ? (v > 0 ? '+' : '') : '';
  changeEl.textContent = Number.isFinite(v) ? `${sign}${v.toFixed(2)}%` : '—';
  changeEl.classList.toggle('gain', Number.isFinite(v) && v > 0);
  changeEl.classList.toggle('loss', Number.isFinite(v) && v < 0);

  // updated text (+ whether it was cached)
  const cachedTime = Number(localStorage.getItem(BTC_CACHE_TIME) || 0);
  const age = Date.now() - cachedTime;
  const isFresh = age < CACHE_MS;
  const timeStr = new Date(ts || Date.now()).toLocaleTimeString();
  updEl.textContent = isFresh ? `Updated ${timeStr}` : `Loaded (cached) ${timeStr}`;
}

async function loadBtc() {
  const data = await fetchBtcPrice();
  renderBtc(data);
}

// call on page load
loadBtc();

// optional: refresh when tab regains focus if cache expired
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const cachedTime = Number(localStorage.getItem(BTC_CACHE_TIME) || 0);
    if (Date.now() - cachedTime >= CACHE_MS) loadBtc();
  }
});
const bgEmptyIcon = document.getElementById("bg-empty-icon");

// When background is set
function showPreview(bgData, fileName = "Saved Background") {
  document.body.style.backgroundImage = `url(${bgData})`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";

  bgThumb.src = bgData;
  bgName.textContent = fileName;
  bgPreview.classList.remove("hidden");
  bgEmptyIcon.style.display = "none"; // hide icon
}

// When background is removed
removeBg.addEventListener("click", () => {
  document.body.style.backgroundImage = "";
  localStorage.removeItem("customBackground");

  bgThumb.src = "";
  bgName.textContent = "";
  bgPreview.classList.add("hidden");
  bgEmptyIcon.style.display = "flex"; // show icon again
});
// Apply ripple effect to Material You buttons
document.addEventListener("click", function (e) {
  const target = e.target.closest(
    ".m3-button, .m3-icon-button, .custom-file-upload, .api-buttons .m3-button, #remove-bg"
  );
  if (!target) return;

  const ripple = document.createElement("span");
  ripple.classList.add("ripple");

  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = e.clientX - rect.left - size / 2 + "px";
  ripple.style.top = e.clientY - rect.top - size / 2 + "px";

  target.appendChild(ripple);

  ripple.addEventListener("animationend", () => ripple.remove());
});
/* ============================
   Now Playing (YouTube Music via Last.fm)
   ============================ */
const npBar     = document.getElementById("nowplaying-bar");
const npThumb   = document.getElementById("np-thumb");
const npTitle   = document.getElementById("np-title");
const npArtist  = document.getElementById("np-artist");
const npStatus  = document.getElementById("np-status");
const npOpenBtn = document.getElementById("np-open");

const lastfmUserInput = document.getElementById("lastfm-user");
const lastfmKeyInput  = document.getElementById("lastfm-key");
const saveLastfmBtn   = document.getElementById("save-lastfm");
const resetLastfmBtn  = document.getElementById("reset-lastfm");

function getLastfmConfig() {
  return {
    user: localStorage.getItem("lastfmUser") || "",
    key:  localStorage.getItem("lastfmKey")  || "",
  };
}

function setLastfmConfig({ user, key }) {
  if (typeof user === "string") localStorage.setItem("lastfmUser", user.trim());
  if (typeof key  === "string") localStorage.setItem("lastfmKey",  key.trim());
}

function initLastfmSettingsUI() {
  const { user, key } = getLastfmConfig();
  lastfmUserInput && (lastfmUserInput.value = user);
  lastfmKeyInput  && (lastfmKeyInput.value  = key);

  saveLastfmBtn?.addEventListener("click", () => {
    setLastfmConfig({ user: lastfmUserInput.value, key: lastfmKeyInput.value });
    fetchNowPlaying();
  });

  resetLastfmBtn?.addEventListener("click", () => {
    localStorage.removeItem("lastfmUser");
    localStorage.removeItem("lastfmKey");
    lastfmUserInput.value = "";
    lastfmKeyInput.value  = "";
    clearNowPlayingUI();
  });
}

function clearNowPlayingUI() {
  if (npThumb)  npThumb.src = "";
  if (npTitle)  npTitle.textContent  = "—";
  if (npArtist) npArtist.textContent = "—";
  if (npStatus) npStatus.textContent = "Waiting for track…";
  if (npBar)    npBar.classList.add("hidden");
  npOpenBtn?.setAttribute("disabled", "true");
}

function timeAgoFromUTS(uts) {
  const secs = Math.max(0, Math.floor(Date.now()/1000 - Number(uts)));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs/60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs/24);
  return `${days}d ago`;
}

async function fetchNowPlaying() {
  const { user, key } = getLastfmConfig();
  if (!user || !key) { clearNowPlayingUI(); return; }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}&format=json&limit=1`;
    const res = await fetch(url);
    const json = await res.json();

    const track = json?.recenttracks?.track?.[0];
    if (!track) { clearNowPlayingUI(); return; }

    const title  = track?.name || "Unknown Title";
    const artist = track?.artist?.["#text"] || "Unknown Artist";
    const imgs   = track?.image || [];
    const imgUrl = (imgs.find(i => i.size === "extralarge") || imgs.find(i => i.size === "large") || imgs[imgs.length-1])?.["#text"] || "";

    const nowPlaying = track?.["@attr"]?.nowplaying === "true";
    const uts = track?.date?.uts;

    // Update UI
    npThumb.src = imgUrl || "";
    npTitle.textContent = title;
    npArtist.textContent = artist;

    if (nowPlaying) {
      npStatus.textContent = "Now playing";
    } else {
      npStatus.textContent = uts ? `Last played • ${timeAgoFromUTS(uts)}` : "Recently played";
    }

    // Open button: YouTube Music search for the track
    const q = encodeURIComponent(`${artist} ${title}`);
    npOpenBtn.removeAttribute("disabled");
    npOpenBtn.onclick = () => {
      window.open(`https://music.youtube.com/search?q=${q}`, "_blank");
    };

    // Show the bar
    npBar.classList.remove("hidden");
  } catch (err) {
    console.error("Last.fm fetch error:", err);
    if (npStatus) npStatus.textContent = "Unable to load Now Playing";
  }
}

// Init on load + poll every 30s
initLastfmSettingsUI();
fetchNowPlaying();
setInterval(fetchNowPlaying, 30000);
