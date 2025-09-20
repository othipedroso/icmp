// server.js — unified proxy for BR gov APIs + news
// Requires Node 18+ (global fetch). Install: npm i express cors xml2js csv-parser

import express from "express";
import cors from "cors";
import { parseStringPromise } from "xml2js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ---- Helpers ----
const H = {
  ok: (res, data) => res.json({ ok: true, data }),
  bad: (res, err, code = 500) => {
    console.error(err);
    res.status(code).json({ ok: false, error: String(err?.message || err) });
  },
};

// Basic in-memory cache (ms)
const cache = new Map();
const getCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  const { exp, data } = hit;
  if (Date.now() > exp) {
    cache.delete(key);
    return null;
  }
  return data;
};
const setCache = (key, data, ttlMs = 60_000) =>
  cache.set(key, { exp: Date.now() + ttlMs, data });

// Small fetch wrapper with cache and JSON/XML detection
async function cachedFetch(
  url,
  { ttlMs = 120_000, headers = {}, as = "auto" } = {}
) {
  const key = `${as}:${url}`;
  const hit = getCache(key);
  if (hit) return hit;

  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Upstream ${resp.status} for ${url}`);

  let data;
  const ct = resp.headers.get("content-type") || "";
  if (as === "xml" || ct.includes("xml")) {
    const txt = await resp.text();
    try {
      data = await parseStringPromise(txt, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
        strict: false, // 🔹 tolerante a XML malformado
      });
    } catch (err) {
      console.error("❌ Erro ao parsear XML:", err);
      console.log("🔎 XML recebido (primeiras linhas):", txt.slice(0, 500));
      throw err;
    }
  } else {
    data = await resp.json();
  }
  setCache(key, data, ttlMs);
  return data;
}

// ============== IBGE =================
app.get("/api/estados", async (_, res) => {
  try {
    const data = await cachedFetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
    );
    const estados = (Array.isArray(data) ? data : [])
      .map((e) => ({ id: e.id, sigla: e.sigla, nome: e.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    H.ok(res, estados);
  } catch (e) {
    H.bad(res, e);
  }
});

app.get("/api/cidades/:estadoId", async (req, res) => {
  try {
    const { estadoId } = req.params;
    const data = await cachedFetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(
        estadoId
      )}/municipios`
    );
    const municipios = (Array.isArray(data) ? data : [])
      .map((m) => ({ id: m.id, nome: m.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    H.ok(res, municipios);
  } catch (e) {
    H.bad(res, e);
  }
});

// ============== CÂMARA =================
const CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2";

app.get("/api/camara/deputados", async (req, res) => {
  try {
    const { siglaUf, siglaPartido, nome, pagina = 1, itens = 100 } = req.query;
    const params = new URLSearchParams({ pagina, itens });
    if (siglaUf) params.set("siglaUf", String(siglaUf));
    if (siglaPartido) params.set("siglaPartido", String(siglaPartido));
    if (nome) params.set("nome", String(nome));
    const url = `${CAMARA_BASE}/deputados?${params}`;
    const json = await cachedFetch(url, { ttlMs: 120_000 });
    H.ok(res, json?.dados ?? []);
  } catch (e) {
    H.bad(res, e);
  }
});

// Notícias RSS da Câmara
app.get("/api/camara/noticias-rss", async (req, res) => {
  try {
    const tema = String(req.query.tema || "ULTIMAS").toUpperCase();
    const map = {
      ULTIMAS: "https://www.camara.leg.br/noticias/rss",
      POLITICA: "https://www.camara.leg.br/noticias/rss/dinamico/POLITICA",
      ECONOMIA: "https://www.camara.leg.br/noticias/rss/dinamico/ECONOMIA",
    };
    const rssUrl = map[tema] || map.ULTIMAS;
    console.log("🔎 Buscando RSS:", rssUrl);

    const xml = await cachedFetch(rssUrl, { as: "xml", ttlMs: 60_000 });
    const items = [].concat(xml?.rss?.channel?.item || []).map((i) => ({
      title: i.title,
      link: i.link,
      pubDate: i.pubDate,
      description: i.description,
    }));
    H.ok(res, items);
  } catch (e) {
    console.error("❌ Erro na rota /api/camara/noticias-rss:", e);
    H.bad(res, e);
  }
});

// ============== SENADO =================
app.get("/api/senado/noticias-rss", async (_req, res) => {
  try {
    const rssUrl = "https://www12.senado.leg.br/noticias/feed/todasnoticias";
    console.log("🔎 Buscando RSS Senado:", rssUrl);

    const xml = await cachedFetch(rssUrl, { as: "xml", ttlMs: 60_000 });
    const items = [].concat(xml?.rss?.channel?.item || []).map((i) => ({
      title: i.title,
      link: i.link,
      pubDate: i.pubDate,
      description: i.description,
    }));
    H.ok(res, items);
  } catch (e) {
    console.error("❌ Erro na rota /api/senado/noticias-rss:", e);
    H.bad(res, e);
  }
});

// ================== PREFEITOS e VEREADORES (TSE) ==================
let candidatos = [];

// Carregar CSV do TSE
(async () => {
  console.log("⏳ Carregando candidatos TSE 2024...");
  const file = path.join(
    __dirname,
    "..",
    "dados-tse",
    "2024",
    "consulta_cand_2024_BRASIL.csv"
  );

  if (fs.existsSync(file)) {
    const results = [];
    fs.createReadStream(file)
      .pipe(
        csv({
          separator: ";",
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("data", (row) => {
        if (row.DS_SIT_TOT_TURNO === "ELEITO") {
          const uf = row.SG_UF;
          const sq = row.SQ_CANDIDATO; // id único
          const fotoPath = `/fotos2024/foto_cand2024_${uf}_div/${sq}.jpg`;

          results.push({
            id: sq,
            nome: row.NM_URNA_CANDIDATO,
            cargo: row.DS_CARGO,
            partido: row.SG_PARTIDO,
            uf,
            municipio: row.NM_UE,
            foto: fotoPath,
          });
        }
      })
      .on("end", () => {
        candidatos = results;
        console.log(`✅ ${candidatos.length} candidatos carregados`);
        if (candidatos.length > 0) {
          console.log("🔎 Exemplo de candidato:", candidatos[0]);
        }
      });
  } else {
    console.warn("⚠️ Arquivo de candidatos não encontrado:", file);
  }
})();

// Prefeitos por UF + cidade
app.get("/api/prefeitos/:uf/:cidade", (req, res) => {
  const { uf, cidade } = req.params;
  const normalize = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lista = candidatos.filter(
    (c) =>
      c.uf.toLowerCase() === uf.toLowerCase() &&
      c.cargo === "PREFEITO" &&
      normalize(c.municipio) === normalize(decodeURIComponent(cidade))
  );

  res.json({ ok: true, data: lista });
});

// Vereadores por UF + cidade
app.get("/api/vereadores/:uf/:cidade", (req, res) => {
  const { uf, cidade } = req.params;
  const normalize = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lista = candidatos.filter(
    (c) =>
      c.uf.toLowerCase() === uf.toLowerCase() &&
      c.cargo === "VEREADOR" &&
      normalize(c.municipio) === normalize(decodeURIComponent(cidade))
  );

  res.json({ ok: true, data: lista });
});

// Governadores por UF
app.get("/api/governadores/:uf", (req, res) => {
  const { uf } = req.params;
  const lista = candidatos.filter(
    c => c.uf.toLowerCase() === uf.toLowerCase() && c.cargo === "GOVERNADOR"
  );
  res.json({ ok: true, data: lista });
});

// Vice-Governadores por UF
app.get("/api/vicegovernadores/:uf", (req, res) => {
  const { uf } = req.params;
  const lista = candidatos.filter(
    c => c.uf.toLowerCase() === uf.toLowerCase() && c.cargo === "VICE-GOVERNADOR"
  );
  res.json({ ok: true, data: lista });
});

// Vice-Prefeitos por cidade
app.get("/api/viceprefeitos/:uf/:cidade", (req, res) => {
  const { uf, cidade } = req.params;
  const normalize = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lista = candidatos.filter(
    c =>
      c.uf.toLowerCase() === uf.toLowerCase() &&
      c.cargo === "VICE-PREFEITO" &&
      normalize(c.municipio) === normalize(decodeURIComponent(cidade))
  );
  res.json({ ok: true, data: lista });
});


// ================== FRONTEND STATIC ==================
app.use(express.static(path.join(__dirname, "..")));

// -------------- Start --------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
