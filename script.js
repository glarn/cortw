//images
const img = (name) => "img/" + name;

//fade in de las imagenes cuando cargan
function markLoaded(el) {
  if (el.complete && el.naturalWidth > 0) el.classList.add("loaded");
  else el.addEventListener("load", () => el.classList.add("loaded"));
}

//hero y about
document.getElementById("heroBg").src = "img/hero.jpg";
document.getElementById("aboutImg").src = img("IMG_0315.jpeg");

//lightbox
const lb = document.getElementById("lb");

function openLb(src) {
  document.getElementById("lbImg").src = src;
  lb.classList.add("on");
  document.body.style.overflow = "hidden";
}

function closeLb() {
  lb.classList.remove("on");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLb();
    closeM();
  }
});

//menu mobile
function togM() {
  document.getElementById("navMenu").classList.toggle("open");
  document.getElementById("ham").classList.toggle("on");
}

function closeM() {
  document.getElementById("navMenu").classList.remove("open");
  document.getElementById("ham").classList.remove("on");
}

//carrusel fotos
let PROJECTS = [];

const reel = document.getElementById("reel");
let dragDist = 0;

//crear cards (los datos vienen de data.json)
function buildReel() {
  PROJECTS.forEach((p, i) => {
  const card = document.createElement("div");
  card.className = "reel-card" + (p.portrait ? " portrait" : "");
  card.dataset.idx = i;
  card.innerHTML = `
    <div class="reel-card-img">
      <img src="${img(p.file)}" alt="${p.title}" draggable="false" loading="lazy">
    </div>
    <div class="reel-card-info">
      <span class="reel-card-tag">${p.cat}</span>
      <div class="reel-card-title">${p.title}</div>
      <div class="reel-card-sub">${p.sub}</div>
    </div>`;
  //animacion de entrada
  card.style.animation = "reelCardIn .5s " + 0.05 * i + "s both";
  reel.appendChild(card);
});
  //copia de las cards al final para que el loop no tenga salto
  reel.querySelectorAll(".reel-card").forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    reel.appendChild(clone);
  });
  reel.querySelectorAll("img").forEach(markLoaded);
}

//click en card abre el lightbox (si no fue drag)
reel.addEventListener("click", (e) => {
  if (dragDist > 8) return;
  const card = e.target.closest(".reel-card");
  if (!card) return;
  openLb(img(PROJECTS[card.dataset.idx].file));
});

//drag con mouse y touch
let isDown = false;
let startX = 0;
let startScroll = 0;

function dragStart(x) {
  isDown = true;
  dragDist = 0;
  startX = x;
  startScroll = reel.scrollLeft;
  reel.style.scrollSnapType = "none";
}

function dragMove(x) {
  if (!isDown) return;
  dragDist = Math.abs(x - startX);
  reel.scrollLeft = startScroll - (x - startX);
}

function dragEnd() {
  if (!isDown) return;
  isDown = false;
  reel.style.cursor = "grab";
  setTimeout(() => {
    reel.style.scrollSnapType = "x mandatory";
  }, 100);
}

reel.addEventListener("mousedown", (e) => {
  dragStart(e.clientX);
  reel.style.cursor = "grabbing";
});
document.addEventListener("mousemove", (e) => dragMove(e.clientX));
document.addEventListener("mouseup", dragEnd);

reel.addEventListener("touchstart", (e) => dragStart(e.touches[0].clientX), { passive: true });
reel.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), { passive: true });
reel.addEventListener("touchend", dragEnd);

//carrusel automatico: se mueve solo, constante y en loop
const REEL_SPEED = 90; //pixeles por segundo
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let reelHover = false;
let reelPausedUntil = 0;
let reelVisible = false;
let reelPos = 0;
let reelLast = 0;

function reelLoopWidth() {
  //ancho de un set completo de cards (distancia entre la primera card y su copia)
  const cards = reel.querySelectorAll(".reel-card");
  const n = cards.length / 2;
  if (!n) return 0;
  return cards[n].offsetLeft - cards[0].offsetLeft;
}

if (!reducedMotion) {
  const wrap = reel.closest(".reel-wrap");
  wrap.addEventListener("mouseenter", () => (reelHover = true));
  wrap.addEventListener("mouseleave", () => (reelHover = false));
  //en celular: si toca, pausa 3s
  reel.addEventListener("touchstart", () => (reelPausedUntil = Date.now() + 3000), { passive: true });

  //solo se mueve cuando la galeria se ve en pantalla
  new IntersectionObserver((entries) => entries.forEach((x) => (reelVisible = x.isIntersecting)), { threshold: 0.2 }).observe(wrap);

  //si la persona arrastra hasta el final de las copias, volvemos al inicio sin que se note
  reel.addEventListener("scroll", () => {
    const loop = reelLoopWidth();
    if (loop && reel.scrollLeft >= loop) reel.scrollLeft -= loop;
  });

  function reelTick(t) {
    requestAnimationFrame(reelTick);
    const dt = Math.min(t - reelLast, 50) / 1000;
    reelLast = t;

    const blocked =
      document.hidden || !reelVisible || reelHover || isDown || Date.now() < reelPausedUntil || lb.classList.contains("on");
    if (blocked) {
      reelPos = reel.scrollLeft;
      return;
    }
    const loop = reelLoopWidth();
    if (!loop) return;
    reelPos += REEL_SPEED * dt;
    if (reelPos >= loop) reelPos -= loop;
    reel.scrollLeft = reelPos;
  }
  requestAnimationFrame(reelTick);
}

//before after
let BA = [];

const baProjects = document.getElementById("baProjects");
const baDots = document.getElementById("baDots");
let baIdx = 0;

function buildBA() {
  baIdx = 0;
  BA.forEach((p, i) => {
  const box = document.createElement("div");
  box.className = "ba-project" + (i === 0 ? " on" : "");
  //las imagenes se cargan despues con data-k (lazy)
  box.innerHTML = `
    <div class="ba-compare" style="position:relative">
      <div class="ba-side">
        <span class="ba-side-tag before">Before</span>
        <img data-k="${p.before}" alt="Before" draggable="false">
        <div class="ba-side-caption"><h4>${p.beforeCap}</h4></div>
      </div>
      <div class="ba-side">
        <span class="ba-side-tag after">After</span>
        <img data-k="${p.after}" alt="After" draggable="false">
        <div class="ba-side-caption"><h4>${p.afterCap}</h4></div>
      </div>
    </div>
    <div class="ba-info">
      <div class="ba-info-left">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
      </div>
      <div class="ba-nav">
        <button onclick="baGo(-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button onclick="baGo(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
    </div>`;
  baProjects.appendChild(box);

  const dot = document.createElement("div");
  dot.className = "ba-dot" + (i === 0 ? " on" : "");
  dot.onclick = () => baGoTo(i);
  baDots.appendChild(dot);
});
  baProjects.querySelectorAll("img").forEach(markLoaded);
  loadBA(0);

  //precargar las siguientes fotos al pasar el mouse por las flechas
  document.querySelectorAll(".ba-nav button").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      loadBA((baIdx + 1) % BA.length);
      loadBA((baIdx - 1 + BA.length) % BA.length);
    });
  });
}

function loadBA(n) {
  const box = document.querySelectorAll(".ba-project")[n];
  if (!box) return;
  box.querySelectorAll("img[data-k]").forEach((el) => {
    if (!el.getAttribute("src")) el.src = img(el.dataset.k);
  });
}

function baGoTo(n) {
  const slides = document.querySelectorAll(".ba-project");
  const dots = document.querySelectorAll(".ba-dot");
  slides[baIdx].classList.remove("on");
  dots[baIdx].classList.remove("on");
  baIdx = n;
  slides[baIdx].classList.add("on");
  dots[baIdx].classList.add("on");
  loadBA(n);
}

function baGo(dir) {
  baGoTo((baIdx + dir + BA.length) % BA.length);
}

//cargar datos con fetch (data.json) y armar carrusel + before/after
async function loadData() {
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    PROJECTS = data.projects;
    BA = data.beforeAfter;
    buildReel();
    buildBA();
  } catch (err) {
    console.error("No se pudo cargar la galeria", err);
    reel.innerHTML = '<p style="color:var(--text);padding:2rem;text-align:center;width:100%">Could not load photos. Please try again later.</p>';
  }
}
loadData();

//particles del hero
const particles = document.getElementById("particles");
if (particles) {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("div");
    const size = 1 + Math.random() * 2;
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.top = Math.random() * 100 + "%";
    p.style.animationDuration = 8 + Math.random() * 12 + "s";
    p.style.animationDelay = Math.random() * 8 + "s";
    p.style.width = p.style.height = size + "px";
    particles.appendChild(p);
  }
}

//services (abrir y cerrar cards)
document.querySelectorAll(".svc").forEach((card) => {
  card.addEventListener("click", () => {
    const wasOpen = card.classList.contains("expanded");
    document.querySelectorAll(".svc").forEach((c) => c.classList.remove("expanded"));
    if (!wasOpen) card.classList.add("expanded");
  });
});

//ticker
const tickerTrack = document.getElementById("tickerTrack");
if (tickerTrack) {
  const items = ["Tree Removal", "Deck Building", "Remodels", "Stump Grinding", "Fencing", "Landscaping", "Emergency Service", "Custom Shops", "Tile", "Sod", "Stone", "Flooring"];
  let html = "";
  //se repite 2 veces para que el loop no se corte
  for (let r = 0; r < 2; r++) {
    items.forEach((text) => {
      html += `<div class="ticker-item"><span class="ticker-dot"></span><span>${text}</span></div>`;
    });
  }
  tickerTrack.innerHTML = html;
}

//counters de la trust bar
let counted = false;

function animCounters() {
  if (counted) return;
  counted = true;

  document.querySelectorAll(".trust-num").forEach((el) => {
    const text = el.textContent;
    let n = 0;

    if (text === "100%") {
      const timer = setInterval(() => {
        n += 4;
        el.textContent = n + "%";
        if (n >= 100) clearInterval(timer);
      }, 30);
    } else if (text === "8+") {
      const timer = setInterval(() => {
        n++;
        el.textContent = n + "+";
        if (n >= 8) clearInterval(timer);
      }, 80);
    } else if (text === "24/7") {
      el.textContent = "0/0";
      setTimeout(() => (el.textContent = "24/7"), 400);
    }
  });

  //glow cuando terminan
  setTimeout(() => {
    document.querySelectorAll(".trust-num").forEach((el) => el.classList.add("counted"));
  }, 1500);
}

const trustBar = document.querySelector(".trust-bar");
if (trustBar) {
  new IntersectionObserver(
    (entries) => {
      entries.forEach((x) => {
        if (x.isIntersecting) animCounters();
      });
    },
    { threshold: 0.3 }
  ).observe(trustBar);
}

//faq
function togFaq(el) {
  const item = el.parentElement;
  const wasOpen = item.classList.contains("open");
  document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
  if (!wasOpen) item.classList.add("open");
}

//form
const validators = {
  fName: (v) => v.trim().length >= 2,
  fPhone: (v) => v.replace(/\D/g, "").length >= 7,
  fEmail: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  fLoc: () => true,
};
const fields = ["fName", "fPhone", "fEmail", "fLoc"];

function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;

  const group = el.closest(".f-g");
  const empty = !el.value.trim();
  group.classList.remove("valid", "invalid");

  //campo vacio y no obligatorio, no marcamos nada
  if (empty && !el.required) return true;
  if (empty && el.required) {
    group.classList.add("invalid");
    return false;
  }

  const ok = validators[id](el.value);
  group.classList.add(ok ? "valid" : "invalid");
  return ok;
}

function validateAll() {
  let ok = true;
  let first = null;
  fields.forEach((id) => {
    if (!validateField(id)) {
      ok = false;
      if (!first) first = document.getElementById(id);
    }
  });
  if (first) first.focus();
  return ok;
}

fields.forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("blur", () => validateField(id));
  el.addEventListener("input", () => {
    if (el.closest(".f-g").classList.contains("invalid")) validateField(id);
  });
});

//formato del telefono (555) 123-4567
const phone = document.getElementById("fPhone");
if (phone) {
  phone.addEventListener("input", () => {
    const n = phone.value.replace(/\D/g, "");
    if (!n) phone.value = "";
    else if (n.length <= 3) phone.value = "(" + n;
    else if (n.length <= 6) phone.value = "(" + n.slice(0, 3) + ") " + n.slice(3);
    else phone.value = "(" + n.slice(0, 3) + ") " + n.slice(3, 6) + "-" + n.slice(6, 10);
  });
}

//enviar form
const form = document.getElementById("quoteForm");
if (form) {
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const btn = document.getElementById("submitBtn");
    if (form.dataset.submitted) {
      btn.textContent = "Already sent";
      return;
    }

    btn.textContent = "Sending...";
    btn.disabled = true;
    form.dataset.submitted = "true";
// cambiar fail messgsss
    const fail = () => {
      btn.textContent = "Error - Try Again";
      btn.disabled = false;
      form.dataset.submitted = "";
    };

    //armamos un objeto con los datos del formulario
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      location: fd.get("location"),
      details: fd.get("details"),
      services: fd.getAll("svc[]"),
    };

    //POST a nuestro servidor (se guarda en la base de datos)
    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (r.ok) {
          //tambien mandamos el aviso por correo con Formspree (si falla, no importa)
          fetch(form.action, { method: "POST", body: fd, headers: { Accept: "application/json" } }).catch(() => {});
          form.style.display = "none";
          document.getElementById("formOk").style.display = "block";
        } else {
          fail();
        }
      })
      .catch(fail);
  };
}

//scroll (nav y boton de subir)
let scrollTicking = false;
window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      document.getElementById("nav").classList.toggle("pinned", y > 60);
      const btt = document.getElementById("btt");
      if (btt) btt.classList.toggle("show", y > 600);
      scrollTicking = false;
    });
  },
  { passive: true }
);

//scroll suave en los links con # (70 es lo que mide el nav)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 70, behavior: "smooth" });
  });
});

//reveal al hacer scroll
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("vis");
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll(".reveal, .a-divider").forEach((el) => revealObs.observe(el));

//loader
window.addEventListener("load", () => {
  setTimeout(() => document.getElementById("pageLoader").classList.add("done"), 400);
});

//fade in de las imagenes que ya estan en el html
document.querySelectorAll("img").forEach(markLoaded);

//si tiene data saver quitamos animaciones pesadas
if (navigator.connection && navigator.connection.saveData) {
  document.querySelectorAll(".particle").forEach((p) => p.remove());
  const track = document.querySelector(".ticker-track");
  if (track) track.style.animationDuration = "60s";
}
