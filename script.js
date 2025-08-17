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


 const orbCount = 5; // how many orbs you want
  const container = document.querySelector('.background-container');

  // red-themed palette
  const colors = [
    '#ff1744', // vivid red
    '#d50000', // deep red
    '#ff5252', // soft red
    '#ff8a80', // light warm red
    '#ff7043'  // orange-red accent
  ];

  for (let i = 0; i < orbCount; i++) {
    const orb = document.createElement('div');
    orb.classList.add('orb');

    // random size
    const size = Math.floor(Math.random() * 200) + 200; // 200–400px
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;

    // random position
    orb.style.top = `${Math.random() * 80}%`;
    orb.style.left = `${Math.random() * 80}%`;

    // random red tone
    const color = colors[Math.floor(Math.random() * colors.length)];
    orb.style.background = `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`;

    // random animation speed & delay
    const duration = Math.random() * 20 + 30; // 30–50s
    const delay = Math.random() * -20;
    orb.style.animationDuration = `${duration}s`;
    orb.style.animationDelay = `${delay}s`;

    container.appendChild(orb);
  }