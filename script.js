const view = document.getElementById("view");
const modeBadge = document.getElementById("modeBadge");

let stopwatchInterval, stopwatchTime = 0;
let timerInterval, timerTime = 0;
let alarmInterval;

// Track current mode to prevent unnecessary reloads
let currentMode = null;
let orientationTimeout;

// Replace with your API key from https://home.openweathermap.org/api_keys
const API_KEY = "d28ddd879b19d6f865d804c007403af5";

// --- Alarm ---
function showAlarm() {
  modeBadge.textContent = "⏰ Alarm";
  view.innerHTML = `
    <h2>Set Alarm</h2>
    <input type="time" id="alarmTime">
    <button onclick="startAlarm()">Set Alarm</button>
    <p id="alarmStatus"></p>
  `;
}

function startAlarm() {
  const alarmTime = document.getElementById("alarmTime").value;
  const status = document.getElementById("alarmStatus");
  if (!alarmTime) return alert("Please select a time!");

  clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime === alarmTime) {
      alert("⏰ Alarm ringing!");
      clearInterval(alarmInterval);
    }
  }, 1000);
  status.textContent = `Alarm set for ${alarmTime}`;
}

// --- Stopwatch ---
function showStopwatch() {
  modeBadge.textContent = "⏱ Stopwatch";
  view.innerHTML = `
    <h2>Stopwatch</h2>
    <p id="stopwatchDisplay">0:00</p>
    <button onclick="startStopwatch()">Start</button>
    <button onclick="stopStopwatch()">Stop</button>
    <button onclick="resetStopwatch()">Reset</button>
  `;
}

function startStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchInterval = setInterval(() => {
    stopwatchTime++;
    document.getElementById("stopwatchDisplay").textContent =
      `${Math.floor(stopwatchTime / 60)}:${(stopwatchTime % 60).toString().padStart(2, "0")}`;
  }, 1000);
}

function stopStopwatch() {
  clearInterval(stopwatchInterval);
}

function resetStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchTime = 0;
  document.getElementById("stopwatchDisplay").textContent = "0:00";
}

// --- Timer ---
function showTimer() {
  modeBadge.textContent = "⌛ Timer";
  view.innerHTML = `
    <h2>Timer</h2>
    <input type="number" id="timerMinutes" placeholder="Minutes" min="1">
    <button onclick="startTimer()">Start Timer</button>
    <p id="timerDisplay"></p>
  `;
}

function startTimer() {
  const minutes = parseInt(document.getElementById("timerMinutes").value);
  if (isNaN(minutes) || minutes <= 0) return alert("Enter valid minutes");

  timerTime = minutes * 60;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timerTime <= 0) {
      clearInterval(timerInterval);
      alert("⌛ Time's up!");
    } else {
      timerTime--;
      document.getElementById("timerDisplay").textContent =
        `${Math.floor(timerTime / 60)}:${(timerTime % 60).toString().padStart(2, "0")}`;
    }
  }, 1000);
}

// --- Weather ---
function showWeather() {
  modeBadge.textContent = "🌦 Weather";
  view.innerHTML = `<p>Fetching weather...</p>`;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();
        view.innerHTML = `
          <h2>${data.name}</h2>
          <p>${data.weather[0].description}</p>
          <p>🌡 ${data.main.temp}°C</p>
        `;
      } catch (err) {
        view.innerHTML = `<p>Failed to fetch weather</p>`;
      }
    }, () => {
      view.innerHTML = `<p>Location access denied</p>`;
    });
  } else {
    view.innerHTML = `<p>Geolocation not supported</p>`;
  }
}

// --- Mode switching with debounce ---
function setMode(mode) {
  if (mode === currentMode) return; // Skip if already in this mode
  currentMode = mode;
  switch (mode) {
    case "alarm": showAlarm(); break;
    case "timer": showTimer(); break;
    case "stopwatch": showStopwatch(); break;
    case "weather": showWeather(); break;
  }
}

window.addEventListener("deviceorientation", (e) => {
  clearTimeout(orientationTimeout);
  orientationTimeout = setTimeout(() => {
    const beta = e.beta;  // front/back tilt
    const gamma = e.gamma; // left/right tilt

    if (Math.abs(gamma) < 30) {
      if (beta > 0 && beta < 100) {
        setMode("alarm");
      } else {
        setMode("timer");
      }
    } else {
      if (gamma > 0) {
        setMode("stopwatch");
      } else {
        setMode("weather");
      }
    }
  }, 200); // 200ms debounce
});

// --- Request Motion Permission (iOS requirement) ---
if (typeof DeviceMotionEvent.requestPermission === "function") {
  const btn = document.getElementById("enableMotionBtn");
  btn.hidden = false;
  btn.addEventListener("click", async () => {
    const response = await DeviceMotionEvent.requestPermission();
    if (response === "granted") {
      btn.hidden = true;
    }
  });
}
