// Ripple effect
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

// Weather
const API_KEY = "dc99d6329ddd199a51fc74e0eb5d78d9";
const city = encodeURIComponent("Prague");

fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city},CZ&units=metric&appid=${API_KEY}`)
  .then(res => res.json())
  .then(data => {
    if (data.cod !== 200) {
      console.error("Weather API error:", data);
      document.getElementById("description").textContent = "Unable to fetch weather";
      return;
    }
    document.getElementById("temp").textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById("description").textContent = data.weather[0].description;
    document.getElementById("weather-icon").src =
      `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  })
  .catch(err => {
    console.error("Fetch failed:", err);
    document.getElementById("description").textContent = "Unable to fetch weather";
  });


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
      createOrbs(theme);

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
