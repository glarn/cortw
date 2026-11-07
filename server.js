// Servidor de la pagina: sirve el sitio, entrega la galeria (GET) y guarda cotizaciones (POST)
const express = require("express");
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 4000;

// base de datos SQLite (viene incluida en node, no hay que instalar nada): se guarda en el archivo quotes.db dentro del proyecto
const db = new DatabaseSync(path.join(__dirname, "quotes.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    email      TEXT,
    location   TEXT,
    services   TEXT,
    details    TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
const insertQuote = db.prepare(
  "INSERT INTO quotes (name, phone, email, location, services, details) VALUES (?, ?, ?, ?, ?, ?)"
);

// permite leer el JSON que manda el formulario
app.use(express.json({ limit: "50kb" }));

// GET /api/gallery -> devuelve las fotos (lee data.json)
app.get("/api/gallery", (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "data.json"), "utf-8");
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: "No se pudo leer la galeria" });
  }
});

// POST /api/quotes -> valida y guarda una cotizacion en la base de datos
app.post("/api/quotes", (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "").trim().slice(0, 100);
  const phone = String(body.phone || "").trim().slice(0, 30);
  const email = String(body.email || "").trim().slice(0, 120);
  const location = String(body.location || "").trim().slice(0, 120);
  const details = String(body.details || "").trim().slice(0, 2000);
  const services = Array.isArray(body.services) ? body.services.map(String).join(", ").slice(0, 500) : "";

  // la validacion tambien se hace en el servidor (no solo en el navegador)
  const errors = [];
  if (name.length < 2) errors.push("name");
  if (phone.replace(/\D/g, "").length < 7) errors.push("phone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const info = insertQuote.run(name, phone, email, location, services, details);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// GET /api/quotes -> lista las cotizaciones guardadas (solo desde tu propio computador)
app.get("/api/quotes", (req, res) => {
  const ip = req.socket.remoteAddress;
  const isLocal = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip);
  if (!isLocal) return res.status(403).json({ error: "Forbidden" });
  res.json(db.prepare("SELECT * FROM quotes ORDER BY id DESC").all());
});

// archivos del sitio (solo los publicos, no server.js ni la base de datos)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
["styles.css", "theme.css", "script.js", "favicon.ico"].forEach((file) => {
  app.get("/" + file, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/dist", express.static(path.join(__dirname, "dist")));

app.listen(PORT, () => {
  console.log("Servidor listo en http://localhost:" + PORT);
});
