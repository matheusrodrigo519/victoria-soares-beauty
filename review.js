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
  let activeIndex = 0;
  let playing = false;
  let timer;

  function showSlide(index) {
    if (index === activeIndex) return;
    const previousIndex = activeIndex;
    activeIndex = index;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.setAttribute("aria-hidden", String(!active));
      if (active) slide.dataset.slide = "incoming";
      else if (position === previousIndex) slide.dataset.slide = "outgoing";
      else delete slide.dataset.slide;
      dots[position].setAttribute("aria-pressed", String(active));
    });
    effect.textContent = slides[index].dataset.effect;
    scheduleSlide();
  }

  function scheduleSlide() {
    window.clearTimeout(timer);
    if (!playing) return;
    timer = window.setTimeout(() => {
      showSlide((activeIndex + 1) % slides.length);
    }, 4000);
  }

  function setPlaying(value) {
    playing = value;
    const label = playing ? "Pausar carrossel" : "Reproduzir carrossel";
    playButton.setAttribute("aria-label", label);
    playButton.title = label;
    playIcon.textContent = playing ? "Ⅱ" : "▶";
    scheduleSlide();
  }

  playButton.addEventListener("click", () => setPlaying(!playing));
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => showSlide(index));
  });
  setPlaying(true);
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

const bookingEndpoint = "https://victoria-soares-beauty.matheusrodrigo519.chatgpt.site/api/agendar";
const form = document.querySelector("#agendar form");
const bookingFields = form.querySelector(".booking-fields");
const sendButton = form.querySelector('button[type="submit"]');
const sendLabel = form.querySelector(".booking-button-label");
const bookingError = form.querySelector(".feedback");
const receipt = document.querySelector("#agendar .booking-success");
const receiptWhatsapp = receipt.querySelector(".booking-whatsapp");
const contactWhatsapp = document.querySelector("#agendar .whatsapp-contact");
const calendar = form.querySelector(".calgrid");
const monthLabel = form.querySelector(".calbar strong");
const previousMonth = form.querySelector('[aria-label="Mês anterior"]');
const nextMonth = form.querySelector('[aria-label="Próximo mês"]');
const dateLabel = form.querySelector(".selected-date strong");
const timeField = form.elements.namedItem("time");
const studioTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const effectField = form.elements.namedItem("effect");
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
let requestId = "";
let sending = false;

function formattedDate(date) {
  return date.split("-").reverse().join("/");
}

function resetBooking() {
  requestId = "";
  bookingError.textContent = "";
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
  resetBooking();
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
});
form.addEventListener("input", resetBooking);
form.addEventListener("change", resetBooking);
for (const link of document.querySelectorAll("[data-select-effect]")) {
  link.addEventListener("click", () => {
    if (sending || form.hidden) return;
    effectField.value = link.dataset.selectEffect;
    resetBooking();
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (sending) return;
  if (!selectedDate) {
    bookingError.textContent = "Selecione um dia no calendário.";
    return;
  }
  if (!studioTimePattern.test(timeField.value)) {
    bookingError.textContent = "Digite um horário válido, como 14:30.";
    timeField.focus();
    return;
  }
  if (selectedDate + " " + timeField.value <= studioClock.format(new Date())) {
    bookingError.textContent = "Escolha uma data e um horário futuros.";
    return;
  }

  requestId ||= crypto.randomUUID();
  const data = { ...Object.fromEntries(new FormData(form)), date: selectedDate, id: requestId };
  sending = true;
  bookingFields.disabled = true;
  sendButton.disabled = true;
  sendLabel.textContent = "Enviando…";
  form.setAttribute("aria-busy", "true");
  bookingError.textContent = "";
  let whatsapp = null;
  try {
    const response = await fetch(bookingEndpoint, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      bookingError.textContent = result?.error || "Não foi possível enviar agora. Tente novamente.";
      return;
    }
    whatsapp = result.whatsappUrl;
    if (whatsapp) {
      receiptWhatsapp.href = whatsapp;
      receiptWhatsapp.hidden = false;
    }
    receipt.querySelector(".booking-receipt").textContent = `${formattedDate(data.date)} às ${data.time} · ${data.effect}`;
    form.hidden = true;
    receipt.hidden = false;
    receipt.querySelector("h2").focus();
  } catch {
    bookingError.textContent = "Não foi possível enviar agora. Tente novamente.";
  } finally {
    sending = false;
    bookingFields.disabled = false;
    sendButton.disabled = false;
    sendLabel.textContent = "Solicitar horário";
    form.setAttribute("aria-busy", "false");
  }
  if (whatsapp) window.location.assign(whatsapp);
});

renderMonth();
sendButton.disabled = false;
fetch(bookingEndpoint, { credentials: "omit" })
  .then(response => response.ok ? response.json() : null)
  .then(settings => {
    if (!settings?.whatsappUrl) return;
    contactWhatsapp.href = settings.whatsappUrl;
    contactWhatsapp.hidden = false;
  }).catch(() => {});
