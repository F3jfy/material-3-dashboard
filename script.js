/**
 * =============================================================================
 * GLOBAL CONFIGURATION & STATE
 * =============================================================================
 */
const CONFIG = {
  defaultCity: encodeURIComponent("Prague"),
  mobulaKey: "099a2759-ede8-44f6-b195-9b8c0c251c2f",
  weatherKey: "dc99d6329ddd199a51fc74e0eb5d78d9",
  btcCacheKey: "btcPriceData_v1",
  btcCacheTime: "btcPriceTime_v1",
  cacheDuration: 30 * 60 * 1000, // 30 minutes
};

// State variables
let todos = JSON.parse(localStorage.getItem("todos") || "[]");
let editMode = false;
let draggedItem = null;
let currentEditElement = null;

/**
 * =============================================================================
 * 1. UTILITIES & UI EFFECTS
 * =============================================================================
 */

// Helper: Material Design Ripple Effect
document.addEventListener("click", (e) => {
  const target = e.target.closest(
    ".md-button, .m3-button, .m3-icon-button, .custom-file-upload, #remove-bg"
  );
  if (!target || target.disabled) return;

  const circle = document.createElement("span");
  circle.classList.add("ripple");
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  circle.style.width = circle.style.height = `${size}px`;
  circle.style.left = `${e.clientX - rect.left - size / 2}px`;
  circle.style.top = `${e.clientY - rect.top - size / 2}px`;
  
  target.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
});

// Helper: Normalize URLs
const normalizeUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:/.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return "https:" + trimmed;
  return "https://" + trimmed.replace(/^\/+/, "");
};

/**
 * =============================================================================
 * 2. CLOCK & GREETING
 * =============================================================================
 */
function initClock() {
  const update = () => {
    const now = new Date();
    const timeEl = document.getElementById("time");
    const greetingEl = document.getElementById("greeting");

    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (greetingEl) {
      const hour = now.getHours();
      let greeting = "Hello";
      if (hour < 12) greeting = "Good morning ☀️";
      else if (hour < 18) greeting = "Good afternoon 🌤️";
      else greeting = "Good evening 🌙";
      greetingEl.textContent = greeting;
    }
  };

  update();
  setInterval(update, 1000);
}

/**
 * =============================================================================
 * 3. WEATHER & CRYPTO (DATA FETCHING)
 * =============================================================================
 */
function initDataWidgets() {
  // --- Weather ---
  const updateWeather = () => {
    const key = localStorage.getItem("weather-api-key") || CONFIG.weatherKey;
    
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.defaultCity},CZ&units=metric&appid=${key}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cod !== 200) return;
        
        const els = {
          temp: document.getElementById("temp"),
          desc: document.getElementById("description"),
          icon: document.getElementById("weather-icon"),
        };

        if (els.temp) els.temp.textContent = `${Math.round(data.main.temp)}°C`;
        if (els.desc) els.desc.textContent = data.weather[0].description;
        if (els.icon) els.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      })
      .catch((err) => console.error("Weather Error:", err));
  };

  // --- Bitcoin ---
  const fetchBtcPrice = async () => {
    const now = Date.now();
    const cached = localStorage.getItem(CONFIG.btcCacheKey);
    const cachedTime = Number(localStorage.getItem(CONFIG.btcCacheTime) || 0);

    // Use Cache if fresh
    if (cached && now - cachedTime < CONFIG.cacheDuration) {
      try { return JSON.parse(cached); } catch {}
    }

    // Fetch Live
    const userKey = localStorage.getItem("crypto-api-key");
    const apiKey = (userKey && userKey !== 'YOUR_API_KEY_HERE') ? userKey : CONFIG.mobulaKey;
    
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = apiKey;

    try {
      const res = await fetch('https://production-api.mobula.io/api/1/market/data?asset=Bitcoin', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      const d = json?.data || {};
      
      const payload = {
        price: Number(d.price),
        change24h: Number(d.price_change_24h),
        ts: now
      };

      localStorage.setItem(CONFIG.btcCacheKey, JSON.stringify(payload));
      localStorage.setItem(CONFIG.btcCacheTime, String(now));
      return payload;
    } catch (err) {
      console.warn('Crypto fetch failed, using cache:', err);
      if (cached) try { return JSON.parse(cached); } catch {}
      return { price: NaN, change24h: NaN, ts: now };
    }
  };

  const renderBtc = (data) => {
    const els = {
      price: document.getElementById('btc-price'),
      change: document.getElementById('btc-change'),
      updated: document.getElementById('btc-updated')
    };
    if (!els.price) return;

    const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    els.price.textContent = Number.isFinite(data.price) ? fmt.format(data.price) : 'N/A';

    const v = Number(data.change24h);
    const sign = Number.isFinite(v) ? (v > 0 ? '+' : '') : '';
    
    els.change.textContent = Number.isFinite(v) ? `${sign}${v.toFixed(2)}%` : '—';
    els.change.classList.toggle('gain', v > 0);
    els.change.classList.toggle('loss', v < 0);

    const cachedTime = Number(localStorage.getItem(CONFIG.btcCacheTime) || 0);
    const isFresh = (Date.now() - cachedTime) < CONFIG.cacheDuration;
    const timeStr = new Date(data.ts || Date.now()).toLocaleTimeString();
    els.updated.textContent = isFresh ? `Updated ${timeStr}` : `Loaded (cached) ${timeStr}`;
  };

  // Run immediately
  updateWeather();
  fetchBtcPrice().then(renderBtc);

  // Refresh BTC when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const cachedTime = Number(localStorage.getItem(CONFIG.btcCacheTime) || 0);
      if (Date.now() - cachedTime >= CONFIG.cacheDuration) fetchBtcPrice().then(renderBtc);
    }
  });
}

/**
 * =============================================================================
 * 4. TO-DO LIST MODULE
 * =============================================================================
 */
function initTodoList() {
  const elements = {
    input: document.getElementById("todo-text"),
    list: document.getElementById("todo-list"),
    addBtn: document.getElementById("add-todo"),
  };

  if (!elements.list) return;

  const save = () => localStorage.setItem("todos", JSON.stringify(todos));

  const createItemElement = (text, index) => {
    const li = document.createElement("li");
    li.textContent = text;

    const btn = document.createElement("button");
    const icon = document.createElement("span");
    icon.className = "material-icons-round";
    icon.textContent = "delete";
    btn.appendChild(icon);

    btn.onclick = () => {
      li.classList.add("removing");
      li.addEventListener('animationend', () => {
        todos.splice(todos.indexOf(text), 1); // Use indexOf to be safe against reorders
        save();
        render();
      }, { once: true });
    };

    li.appendChild(btn);
    return li;
  };

  const render = () => {
    elements.list.innerHTML = "";
    if (todos.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "All tasks done! 🎉";
      empty.style.justifyContent = "center";
      empty.style.color = "var(--on-surface-variant)";
      elements.list.appendChild(empty);
      return;
    }
    todos.forEach((text, i) => elements.list.appendChild(createItemElement(text, i)));
  };

  const addItem = () => {
    const text = elements.input.value.trim();
    if (!text) return;

    todos.push(text);
    save();
    
    // Optimistic UI update
    if (todos.length === 1) elements.list.innerHTML = ""; // Clear empty message
    const li = createItemElement(text, todos.length - 1);
    li.classList.add("adding");
    elements.list.appendChild(li);
    
    li.addEventListener('animationend', () => li.classList.remove("adding"), { once: true });
    elements.input.value = "";
  };

  if (elements.addBtn) elements.addBtn.onclick = addItem;

  // NEW: Press "Enter" to add task
  if (elements.input) {
    elements.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addItem();
    });
  }

  render();
}

/**
 * =============================================================================
 * 5. SHORTCUTS (DRAG & DROP, EDITING)
 * =============================================================================
 */
function initShortcuts() {
  const list = document.getElementById("shortcuts-list");
  const editBtn = document.getElementById("edit-shortcuts");
  const modal = document.getElementById("shortcut-editor");
  
  if (!list) return;

  // --- Persistence ---
  const save = () => {
    const data = [...list.children].map(el => ({
      id: el.dataset.id,
      name: el.querySelector(".shortcut-name")?.textContent?.trim() || "",
      link: el.getAttribute("href"),
      img: el.querySelector("img")?.getAttribute("src") || "",
    }));
    localStorage.setItem("shortcutsData", JSON.stringify(data));
  };

  const load = () => {
    const saved = JSON.parse(localStorage.getItem("shortcutsData") || "null");
    if (saved && Array.isArray(saved)) {
      saved.forEach(d => {
        const el = list.querySelector(`[data-id="${d.id}"]`);
        if (!el) return;
        el.querySelector(".shortcut-name").textContent = d.name;
        el.querySelector("img").src = d.img;
        el.setAttribute("href", d.link);
        list.appendChild(el); // Reorder DOM
      });
    }
  };
  load();

  // --- Drag & Drop ---
  const getDragAfterElement = (y) => {
    const draggableElements = [...list.querySelectorAll("a:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };

  list.addEventListener("dragstart", (e) => {
    if (!editMode) return;
    draggedItem = e.target.closest("a");
    setTimeout(() => draggedItem.classList.add("dragging"), 0);
  });

  list.addEventListener("dragend", () => {
    if (draggedItem) draggedItem.classList.remove("dragging");
    draggedItem = null;
    save();
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!editMode || !draggedItem) return;
    const afterElement = getDragAfterElement(e.clientY);
    if (afterElement) list.insertBefore(draggedItem, afterElement);
    else list.appendChild(draggedItem);
  });

  // --- Toggle Edit Mode ---
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      editMode = !editMode;
      editBtn.classList.toggle("active", editMode);
      [...list.children].forEach(a => {
        a.draggable = editMode;
        a.classList.toggle("editing", editMode);
      });
    });
  }

  // --- Modal Logic ---
  const inputs = {
    name: document.getElementById("edit-name"),
    link: document.getElementById("edit-link"),
    imgUrl: document.getElementById("edit-img-url"),
    file: document.getElementById("edit-file"),
    preview: document.getElementById("edit-preview"),
    save: document.getElementById("editor-save"),
    cancel: document.getElementById("editor-cancel")
  };

  const closeEditor = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    inputs.file.value = "";
    inputs.imgUrl.value = "";
    currentEditElement = null;
  };

  // Open Editor
  list.addEventListener("click", (e) => {
    if (!editMode) return;
    e.preventDefault();
    const target = e.target.closest("a");
    if (!target) return;

    currentEditElement = target;
    inputs.name.value = target.querySelector(".shortcut-name").textContent;
    inputs.link.value = target.getAttribute("href");
    inputs.preview.src = target.querySelector("img").src;
    
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    inputs.name.focus();
  });

  // Save changes
  if (inputs.save) {
    inputs.save.addEventListener("click", (e) => {
      e.preventDefault();
      if (!currentEditElement) return;

      const name = inputs.name.value.trim() || "Shortcut";
      const link = normalizeUrl(inputs.link.value);
      const imgSrc = inputs.preview.src;

      currentEditElement.querySelector(".shortcut-name").textContent = name;
      currentEditElement.setAttribute("href", link);
      currentEditElement.querySelector("img").src = imgSrc;
      currentEditElement.querySelector("img").alt = name;

      save();
      closeEditor();
    });
  }

  // Cancel / Close
  if (inputs.cancel) inputs.cancel.addEventListener("click", closeEditor);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeEditor(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.classList.contains("hidden")) closeEditor(); });

  // Image Previews
  inputs.file?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => inputs.preview.src = ev.target.result;
      reader.readAsDataURL(file);
    }
  });
  inputs.imgUrl?.addEventListener("change", () => {
    if (inputs.imgUrl.value.trim()) inputs.preview.src = inputs.imgUrl.value.trim();
  });
}

/**
 * =============================================================================
 * 6. SETTINGS & THEMES
 * =============================================================================
 */
function initSettings() {
  const panel = document.getElementById('settings-panel');
  const openBtn = document.getElementById('open-settings');
  const closeBtn = document.getElementById('close-settings');

  if (openBtn) openBtn.addEventListener('click', () => panel.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('active'));

  // --- Themes ---
  const applyTheme = (theme) => {
    if (theme && theme !== 'default') document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  };

  const savedTheme = localStorage.getItem("colorTheme");
  if (savedTheme) {
    applyTheme(savedTheme);
    document.querySelector(`.swatch[data-theme="${savedTheme}"]`)?.classList.add('selected');
  }

  document.querySelectorAll(".swatch").forEach(swatch => {
    swatch.addEventListener("click", () => {
      const theme = swatch.dataset.theme;
      applyTheme(theme);
      localStorage.setItem("colorTheme", theme);
      document.querySelectorAll(".swatch").forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
    });
  });

  // --- API Keys ---
  const weatherInput = document.getElementById("weather-api-key");
  const cryptoInput = document.getElementById("crypto-api-key");
  
  if (weatherInput) weatherInput.value = localStorage.getItem("weather-api-key") || "";
  if (cryptoInput) cryptoInput.value = localStorage.getItem("crypto-api-key") || "";

  document.getElementById("save-api-keys")?.addEventListener("click", () => {
    localStorage.setItem("weather-api-key", weatherInput.value.trim());
    localStorage.setItem("crypto-api-key", cryptoInput.value.trim());
    alert("API keys saved locally ✅ Refresh to apply.");
  });

  document.getElementById("reset-api-keys")?.addEventListener("click", () => {
    localStorage.removeItem("weather-api-key");
    localStorage.removeItem("crypto-api-key");
    alert("Defaults restored. Refresh page.");
  });
}

/**
 * =============================================================================
 * 7. BACKGROUNDS (UPLOAD & PRESETS)
 * =============================================================================
 */
// Exposed Global function for HTML onclick attributes
window.setPresetBg = function(number) {
  const path = `backgrounds/${number}.webp`;
  localStorage.setItem("customBackground", path);
  updateBackgroundUI(path, `Preset ${number}`);
};

function updateBackgroundUI(bgData, fileName) {
  const els = {
    thumb: document.getElementById("bg-thumb"),
    name: document.getElementById("bg-name"),
    preview: document.getElementById("bg-preview"),
    icon: document.getElementById("bg-empty-icon")
  };

  document.body.style.backgroundImage = `url('${bgData}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";

  if (els.thumb) els.thumb.src = bgData;
  if (els.name) els.name.textContent = fileName;
  if (els.preview) els.preview.classList.remove("hidden");
  if (els.icon) els.icon.style.display = "none";
}

function initBackgrounds() {
  const upload = document.getElementById("bg-upload");
  const removeBtn = document.getElementById("remove-bg");

  // Load Saved
  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) updateBackgroundUI(savedBg, "Saved Background");

  // Upload
  if (upload) {
    upload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          localStorage.setItem("customBackground", ev.target.result);
          updateBackgroundUI(ev.target.result, file.name);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Remove
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      document.body.style.backgroundImage = "";
      localStorage.removeItem("customBackground");
      const preview = document.getElementById("bg-preview");
      const icon = document.getElementById("bg-empty-icon");
      if (preview) preview.classList.add("hidden");
      if (icon) icon.style.display = "flex";
    });
  }
}

/**
 * =============================================================================
 * 8. IMPORT / EXPORT & KEYBOARD SHORTCUTS
 * =============================================================================
 */
function initExtras() {
  // --- Export ---
  const exportBtn = document.getElementById("export-settings");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const list = document.getElementById("shortcuts-list");
      const shortcuts = [...list.children].map(el => ({
        id: el.dataset.id,
        name: el.querySelector(".shortcut-name").textContent,
        link: el.getAttribute("href"),
        img: el.querySelector("img").src,
      }));

      const data = {
        theme: localStorage.getItem("colorTheme"),
        bg: localStorage.getItem("customBackground"),
        weatherApiKey: localStorage.getItem("weather-api-key"),
        cryptoApiKey: localStorage.getItem("crypto-api-key"),
        shortcuts: shortcuts,
        todos: todos
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-settings-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // --- Import ---
  const importInput = document.getElementById("import-settings");
  if (importInput) {
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.theme) localStorage.setItem("colorTheme", data.theme);
          if (data.bg) localStorage.setItem("customBackground", data.bg);
          if (data.weatherApiKey) localStorage.setItem("weather-api-key", data.weatherApiKey);
          if (data.cryptoApiKey) localStorage.setItem("crypto-api-key", data.cryptoApiKey);
          if (data.shortcuts) localStorage.setItem("shortcutsData", JSON.stringify(data.shortcuts));
          if (data.todos) localStorage.setItem("todos", JSON.stringify(data.todos));
          alert("Import successful! Reloading...");
          location.reload();
        } catch (err) {
          alert("Invalid settings file");
        }
      };
      reader.readAsText(file);
    });
  }

  // --- Keyboard Shortcuts ---
  const modal = document.getElementById("shortcuts-modal");
  const openBtn = document.getElementById("open-shortcuts");
  const closeBtn = document.getElementById("close-shortcuts");

  if (openBtn) openBtn.addEventListener("click", () => modal.classList.add("active"));
  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("active"));

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

    if (e.key === "/") {
      e.preventDefault();
      document.querySelector("#search-input")?.focus();
    }
    if (e.key.toLowerCase() === "t") {
      e.preventDefault();
      document.getElementById("todo-text")?.focus();
    }
    if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      document.getElementById("settings-panel")?.classList.add("active");
    }
    if (e.key === "?") {
      e.preventDefault();
      modal?.classList.add("active");
    }
    if (e.key === "Escape") {
      modal?.classList.remove("active");
      document.getElementById("settings-panel")?.classList.remove("active");
    }
  });
}

/**
 * =============================================================================
 * INITIALIZATION
 * =============================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initDataWidgets();
  initTodoList();
  initShortcuts();
  initSettings();
  initBackgrounds();
  initExtras();
});