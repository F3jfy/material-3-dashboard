/**
 * =============================================================================
 * GLOBAL CONFIGURATION & STATE
 * =============================================================================
 */
const CONFIG = {
  defaultCity: encodeURIComponent("Prague"),
  weatherKey: "dc99d6329ddd199a51fc74e0eb5d78d9",
};

// State variables
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
  // `.icon-disc` sits inside `.m3-button`, so closest() finds it first and the
  // ripple stays inside the shortcut's circle instead of washing over the label.
  const target = e.target.closest(
    ".md-button, .icon-disc, .m3-icon-button, .m3-button-filled, .m3-button-text, .custom-file-upload, #remove-bg"
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
    const dateEl = document.getElementById("date");
    const greetingEl = document.getElementById("greeting");

    if (timeEl) {
      // 24-hour, so the clock reads like a Pixel lock screen (no AM/PM)
      timeEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
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
 * 3. WEATHER
 * =============================================================================
 */
function initWeather() {
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

      if (els.temp) els.temp.textContent = `${Math.round(data.main.temp)}°`;
      if (els.desc) els.desc.textContent = data.weather[0].description;
      if (els.icon) els.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    })
    .catch((err) => console.error("Weather Error:", err));
}

/**
 * =============================================================================
 * 4. SHORTCUTS (DRAG & DROP, EDITING)
 * =============================================================================
 */
// Fallback icon for a new shortcut with no image yet — a simple globe.
const DEFAULT_ICON = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1b1b1f" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>'
);

function initShortcuts() {
  const list = document.getElementById("shortcuts-list");
  const editBtn = document.getElementById("edit-shortcuts");
  const modal = document.getElementById("shortcut-editor");

  if (!list) return;

  let editorMode = "edit"; // "edit" | "add"

  const genId = () => "sc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  // --- Persistence: the real shortcuts are the <a data-id> children ---
  const readItems = () => [...list.querySelectorAll("a[data-id]")].map(el => ({
    id: el.dataset.id,
    name: el.querySelector(".shortcut-name")?.textContent?.trim() || "",
    link: el.getAttribute("href"),
    img: el.querySelector("img")?.getAttribute("src") || "",
  }));

  const save = () => localStorage.setItem("shortcutsData", JSON.stringify(readItems()));

  // Build one shortcut element (icon disc + label + delete badge)
  const createShortcutEl = (d) => {
    const a = document.createElement("a");
    a.className = "m3-button";
    a.href = d.link || "#";
    a.dataset.id = d.id;

    const disc = document.createElement("span");
    disc.className = "icon-disc";
    const img = document.createElement("img");
    img.className = "shortcut-icon";
    img.src = d.img || DEFAULT_ICON;
    img.alt = d.name || "";
    disc.appendChild(img);

    const name = document.createElement("span");
    name.className = "shortcut-name";
    name.textContent = d.name || "Shortcut";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "sc-delete";
    del.title = "Remove";
    del.setAttribute("aria-label", `Remove ${d.name || "shortcut"}`);
    const dicon = document.createElement("span");
    dicon.className = "material-icons-round";
    dicon.textContent = "close";
    del.appendChild(dicon);

    a.append(disc, name, del);
    a.draggable = editMode;
    a.classList.toggle("editing", editMode);
    return a;
  };

  // The "+" tile that appears at the end of the row in edit mode
  const addTile = document.createElement("button");
  addTile.type = "button";
  addTile.className = "m3-button add-shortcut";
  addTile.title = "Add shortcut";
  addTile.innerHTML =
    '<span class="add-disc"><span class="material-icons-round">add</span></span>' +
    '<span class="shortcut-name">Add</span>';

  // --- Build the list: saved data if present, else the defaults from markup ---
  const defaults = readItems();
  const saved = JSON.parse(localStorage.getItem("shortcutsData") || "null");
  const initial = Array.isArray(saved) ? saved : defaults;

  list.innerHTML = "";
  initial.forEach(d => list.appendChild(createShortcutEl(d)));
  list.appendChild(addTile);

  // --- Drag & Drop (grid can wrap, but nearest-by-X reads fine per row) ---
  const getDragAfterElement = (x, y) => {
    const els = [...list.querySelectorAll("a[data-id]:not(.dragging)")];
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      // Prefer items on the same row as the cursor
      const sameRow = y >= box.top && y <= box.bottom;
      const offset = x - box.left - box.width / 2;
      if (sameRow && offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  };

  list.addEventListener("dragstart", (e) => {
    if (!editMode) return;
    draggedItem = e.target.closest("a[data-id]");
    if (draggedItem) setTimeout(() => draggedItem.classList.add("dragging"), 0);
  });

  list.addEventListener("dragend", () => {
    if (draggedItem) draggedItem.classList.remove("dragging");
    draggedItem = null;
    save();
  });

  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!editMode || !draggedItem) return;
    const after = getDragAfterElement(e.clientX, e.clientY);
    if (after) list.insertBefore(draggedItem, after);
    else list.insertBefore(draggedItem, addTile); // keep the + tile last
  });

  // --- Toggle Edit Mode ---
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      editMode = !editMode;
      editBtn.classList.toggle("active", editMode);
      list.classList.toggle("editing", editMode);
      list.querySelectorAll("a[data-id]").forEach(a => {
        a.draggable = editMode;
        a.classList.toggle("editing", editMode);
      });
    });
  }

  // --- Editor modal ---
  const inputs = {
    title: document.getElementById("editor-title"),
    name: document.getElementById("edit-name"),
    link: document.getElementById("edit-link"),
    imgUrl: document.getElementById("edit-img-url"),
    file: document.getElementById("edit-file"),
    preview: document.getElementById("edit-preview"),
    save: document.getElementById("editor-save"),
    cancel: document.getElementById("editor-cancel")
  };

  const openEditor = (mode, el) => {
    editorMode = mode;
    currentEditElement = el;
    if (inputs.title) inputs.title.textContent = mode === "add" ? "Add shortcut" : "Edit shortcut";

    if (mode === "add") {
      inputs.name.value = "";
      inputs.link.value = "";
      inputs.preview.src = DEFAULT_ICON;
    } else {
      inputs.name.value = el.querySelector(".shortcut-name").textContent;
      inputs.link.value = el.getAttribute("href");
      inputs.preview.src = el.querySelector("img").src;
    }
    inputs.imgUrl.value = "";
    inputs.file.value = "";

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    inputs.name.focus();
  };

  const closeEditor = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    inputs.file.value = "";
    inputs.imgUrl.value = "";
    currentEditElement = null;
  };

  // Clicks inside the list: delete, add, or open the editor
  list.addEventListener("click", (e) => {
    const del = e.target.closest(".sc-delete");
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      del.closest("a[data-id]")?.remove();
      save();
      return;
    }

    if (e.target.closest(".add-shortcut")) {
      e.preventDefault();
      openEditor("add", null);
      return;
    }

    if (!editMode) return;
    e.preventDefault();
    const target = e.target.closest("a[data-id]");
    if (target) openEditor("edit", target);
  });

  // Save (create in add mode, update in edit mode)
  if (inputs.save) {
    inputs.save.addEventListener("click", (e) => {
      e.preventDefault();
      const name = inputs.name.value.trim() || "Shortcut";
      const link = normalizeUrl(inputs.link.value);
      let imgSrc = inputs.preview.src;

      if (editorMode === "add") {
        // No custom icon? Fall back to the site's favicon.
        if ((!imgSrc || imgSrc === DEFAULT_ICON) && link) {
          try {
            imgSrc = `https://www.google.com/s2/favicons?domain=${new URL(link).hostname}&sz=64`;
          } catch {}
        }
        const el = createShortcutEl({ id: genId(), name, link, img: imgSrc });
        list.insertBefore(el, addTile);
      } else if (currentEditElement) {
        currentEditElement.querySelector(".shortcut-name").textContent = name;
        currentEditElement.setAttribute("href", link);
        const img = currentEditElement.querySelector("img");
        img.src = imgSrc;
        img.alt = name;
      }

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
 * 4b. SHORTCUT LAYOUT (per-row count + spacing sliders)
 * =============================================================================
 */
function initLayout() {
  const root = document.documentElement;
  const cols = document.getElementById("sc-cols");
  const gap = document.getElementById("sc-gap");
  const colsVal = document.getElementById("sc-cols-val");
  const gapVal = document.getElementById("sc-gap-val");

  const savedCols = localStorage.getItem("sc-cols") || "6";
  const savedGap = localStorage.getItem("sc-gap") || "16";

  const apply = (c, g) => {
    root.style.setProperty("--sc-cols", c);
    root.style.setProperty("--sc-gap", g + "px");
    if (colsVal) colsVal.textContent = c;
    if (gapVal) gapVal.textContent = g;
  };

  apply(savedCols, savedGap);

  if (cols) {
    cols.value = savedCols;
    cols.addEventListener("input", () => {
      localStorage.setItem("sc-cols", cols.value);
      apply(cols.value, gap ? gap.value : savedGap);
    });
  }
  if (gap) {
    gap.value = savedGap;
    gap.addEventListener("input", () => {
      localStorage.setItem("sc-gap", gap.value);
      apply(cols ? cols.value : savedCols, gap.value);
    });
  }
}

/**
 * =============================================================================
 * 5. SETTINGS & THEMES
 * =============================================================================
 */
function initSettings() {
  const panel = document.getElementById('settings-panel');
  const openBtn = document.getElementById('open-settings');
  const closeBtn = document.getElementById('close-settings');

  if (openBtn) openBtn.addEventListener('click', () => panel.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.remove('active'));

  // Dismiss the dialog by clicking the scrim
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (e.target === panel) panel.classList.remove('active');
    });
  }

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

  // --- API Key ---
  const weatherInput = document.getElementById("weather-api-key");

  if (weatherInput) weatherInput.value = localStorage.getItem("weather-api-key") || "";

  document.getElementById("save-api-keys")?.addEventListener("click", () => {
    localStorage.setItem("weather-api-key", weatherInput.value.trim());
    alert("API key saved locally ✅ Refresh to apply.");
  });

  document.getElementById("reset-api-keys")?.addEventListener("click", () => {
    localStorage.removeItem("weather-api-key");
    alert("Defaults restored. Refresh page.");
  });
}

/**
 * =============================================================================
 * 6. BACKGROUNDS (UPLOAD & PRESETS)
 * =============================================================================
 */
// Exposed Global function for HTML onclick attributes
window.setPresetBg = function(number) {
  const path = `backgrounds/${number}.webp`;
  localStorage.setItem("customBackground", path);
  // The presets are 8K; show the small copy in the settings preview so the
  // dialog never decodes a 33-megapixel image just to fill a 40px thumbnail.
  updateBackgroundUI(path, `Preset ${number}`, `backgrounds/thumbs/${number}.webp`);
};

function updateBackgroundUI(bgData, fileName, thumbSrc = bgData) {
  const els = {
    thumb: document.getElementById("bg-thumb"),
    name: document.getElementById("bg-name"),
    preview: document.getElementById("bg-preview"),
    icon: document.getElementById("bg-empty-icon")
  };

  document.body.style.backgroundImage = `url('${bgData}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";

  if (els.thumb) els.thumb.src = thumbSrc;
  if (els.name) els.name.textContent = fileName;
  if (els.preview) els.preview.classList.remove("hidden");
  if (els.icon) els.icon.style.display = "none";
}

function initBackgrounds() {
  const upload = document.getElementById("bg-upload");
  const removeBtn = document.getElementById("remove-bg");

  // A saved preset is a full-size 8K file; pair it with its thumbnail.
  const thumbFor = (bg) => {
    const preset = /^backgrounds\/(\d+)\.webp$/.exec(bg || "");
    return preset ? `backgrounds/thumbs/${preset[1]}.webp` : bg;
  };

  // Load Saved
  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) updateBackgroundUI(savedBg, "Saved Background", thumbFor(savedBg));

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
 * 7. IMPORT / EXPORT & KEYBOARD SHORTCUTS
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
        scCols: localStorage.getItem("sc-cols"),
        scGap: localStorage.getItem("sc-gap"),
        shortcuts: shortcuts,
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
          if (data.scCols) localStorage.setItem("sc-cols", data.scCols);
          if (data.scGap) localStorage.setItem("sc-gap", data.scGap);
          if (data.shortcuts) localStorage.setItem("shortcutsData", JSON.stringify(data.shortcuts));
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
  initWeather();
  initShortcuts();
  initLayout();
  initSettings();
  initBackgrounds();
  initExtras();
});
