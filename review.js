"use strict";

const themeSwitch = document.querySelector(".theme");
const themeKey = "victoria-review-theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeSwitch.setAttribute("aria-checked", String(theme === "dark"));
  themeSwitch.title = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
}

try {
  applyTheme(localStorage.getItem(themeKey) === "dark" ? "dark" : "light");
} catch {
  applyTheme("light");
}

themeSwitch.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try { localStorage.setItem(themeKey, theme); } catch {}
});

const heroPhoto = document.querySelector(".hero-photo");
const slides = Array.from(heroPhoto.querySelectorAll(".hero-slides img"));

if (slides.length > 1) {
  const controls = heroPhoto.querySelector(".hero-controls");
  const playButton = controls.querySelector(".hero-play");
  const playIcon = playButton.querySelector("span");
  const dots = Array.from(controls.querySelectorAll(".hero-dot"));
  const effect = heroPhoto.querySelector(".hero-effect");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let playing = false;
  let hovered = false;
  let timer;

  function showSlide(index) {
    activeIndex = index;
    slides.forEach((slide, position) => {
      slide.setAttribute("aria-hidden", String(position !== index));
      dots[position].setAttribute("aria-pressed", String(position === index));
    });
    effect.textContent = slides[index].dataset.effect;
  }

  function scheduleSlide() {
    window.clearTimeout(timer);
    if (!playing || hovered) return;
    timer = window.setTimeout(() => {
      showSlide((activeIndex + 1) % slides.length);
      scheduleSlide();
    }, 5000);
  }

  function setPlaying(value) {
    playing = value;
    const label = playing ? "Pausar carrossel" : "Reproduzir carrossel";
    playButton.setAttribute("aria-label", label);
    playButton.title = label;
    playIcon.textContent = playing ? "Ⅱ" : "▶";
    scheduleSlide();
  }

  heroPhoto.addEventListener("pointerenter", event => {
    if (event.pointerType !== "mouse") return;
    hovered = true;
    scheduleSlide();
  });
  heroPhoto.addEventListener("pointerleave", () => {
    hovered = false;
    scheduleSlide();
  });
  heroPhoto.addEventListener("focusin", event => {
    if (event.target.matches(":focus-visible")) setPlaying(false);
  });
  playButton.addEventListener("click", () => setPlaying(!playing));
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      setPlaying(false);
    });
  });
  preference.addEventListener("change", () => setPlaying(!preference.matches));
  setPlaying(!preference.matches);
  controls.hidden = false;
}

const filterButtons = document.querySelectorAll("[data-filter]");
const albums = document.querySelectorAll("[data-album]");

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    for (const item of filterButtons) item.setAttribute("aria-pressed", String(item === button));
    for (const album of albums) album.hidden = !!button.dataset.filter && album.dataset.album !== button.dataset.filter;
  });
}

const lightbox = document.querySelector(".lightbox");
const enlargedPhoto = lightbox.querySelector("img");
const photoTitle = lightbox.querySelector("strong");
const photoDescription = lightbox.querySelector("figcaption p");

document.querySelector("#galeria").addEventListener("click", event => {
  const button = event.target.closest(".gallery-photo");
  if (!button) return;

  const technique = button.closest("[data-album]").dataset.album;
  enlargedPhoto.src = button.querySelector("img").src;
  enlargedPhoto.alt = "Resultado de " + technique;
  photoTitle.textContent = technique;
  photoDescription.textContent = button.dataset.description;
  lightbox.setAttribute("aria-label", technique);
  lightbox.showModal();
});

lightbox.querySelector("button").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", event => {
  if (event.target === lightbox) lightbox.close();
});

const form = document.querySelector("#agendar form");
const calendar = form.querySelector(".calgrid");
const monthLabel = form.querySelector(".calbar strong");
const previousMonth = form.querySelector('[aria-label="Mês anterior"]');
const nextMonth = form.querySelector('[aria-label="Próximo mês"]');
const dateLabel = form.querySelector(".selected-date strong");
const timeField = form.elements.namedItem("time");
const studioTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const effectField = form.elements.namedItem("effect");
const summary = form.querySelector(".preview-summary");
const steps = document.querySelectorAll("#agendar .booking-steps li");
const studioClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const monthFormat = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const today = studioClock.format(new Date()).slice(0, 10);
const month = new Date(today.slice(0, 7) + "-01T12:00:00Z");
const weekdays = Array.from(calendar.children).slice(0, 7);
let selectedDate = "";

function formattedDate(date) {
  return date.split("-").reverse().join("/");
}

function showStep(active) {
  steps.forEach((step, index) => {
    step.classList.toggle("step-active", index === active);
    if (index === active) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function resetSummary() {
  summary.hidden = true;
  showStep(0);
}

function renderMonth() {
  const monthKey = month.toISOString().slice(0, 7);
  const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  monthLabel.textContent = monthFormat.format(month);
  previousMonth.disabled = monthKey <= today.slice(0, 7);
  calendar.replaceChildren(...weekdays);

  for (let day = 0; day < month.getUTCDay(); day++) {
    const blank = document.createElement("span");
    blank.setAttribute("aria-hidden", "true");
    calendar.append(blank);
  }

  for (let day = 1; day <= lastDay; day++) {
    const key = monthKey + "-" + String(day).padStart(2, "0");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(day);
    button.dataset.day = key;
    button.disabled = key < today;
    button.setAttribute("aria-label", formattedDate(key));
    button.setAttribute("aria-pressed", String(key === selectedDate));
    if (key === today) button.setAttribute("aria-current", "date");
    calendar.append(button);
  }
}

previousMonth.addEventListener("click", () => {
  month.setUTCMonth(month.getUTCMonth() - 1);
  renderMonth();
});
nextMonth.addEventListener("click", () => {
  month.setUTCMonth(month.getUTCMonth() + 1);
  renderMonth();
});

calendar.addEventListener("click", event => {
  const button = event.target.closest("[data-day]");
  if (!button) return;
  selectedDate = button.dataset.day;
  dateLabel.textContent = formattedDate(selectedDate);
  for (const day of calendar.querySelectorAll("[data-day]")) {
    day.setAttribute("aria-pressed", String(day === button));
  }
  resetSummary();
});

timeField.addEventListener("input", () => {
  const value = timeField.value.replace(/[^\d:]/g, "");
  if (/^\d{4}$/.test(value)) {
    timeField.value = value.slice(0, 2) + ":" + value.slice(2);
  } else if (/^\d:\d{2}$/.test(value)) {
    timeField.value = "0" + value;
  } else {
    timeField.value = value;
  }
  resetSummary();
});
form.addEventListener("change", resetSummary);
for (const link of document.querySelectorAll("[data-select-effect]")) {
  link.addEventListener("click", () => {
    effectField.value = link.dataset.selectEffect;
    resetSummary();
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!studioTimePattern.test(timeField.value)) {
    showStep(0);
    summary.textContent = "Digite um horário válido, como 14:30.";
  } else if (!selectedDate || selectedDate + " " + timeField.value <= studioClock.format(new Date())) {
    showStep(0);
    summary.textContent = "Escolha uma data e um horário futuros.";
  } else {
    showStep(1);
    summary.textContent = `Exemplo de pedido para ${formattedDate(selectedDate)} às ${timeField.value} · ${effectField.value}.`;
  }
  summary.hidden = false;
});

renderMonth();
