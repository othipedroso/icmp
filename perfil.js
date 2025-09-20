// js/perfil.js
import { getJSON } from "./utils.js";

const API = "http://localhost:3000";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const container = document.getElementById("perfil-container");

function moneyFormat(v) {
  if (!v && v !== 0) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderHeader(profile) {
  container.innerHTML = `
    <div class="profile-top" style="display:flex;gap:1.25rem;align-items:center;flex-wrap:wrap;">
      <img src="${profile.foto || "/photos/placeholder.jpg"}"
           alt="Foto de ${profile.nome}"
           style="width:140px;height:140px;border-radius:50%;object-fit:cover;border:4px solid var(--primary);">
      <div>
        <h2 style="margin-bottom:0.25rem;">${profile.nome}</h2>
        <p style="margin:0.25rem 0;color:var(--muted);">
          ${profile.cargo || ""} • ${profile.partido || ""} • ${profile.uf || ""} ${profile.municipio ? "• " + profile.municipio : ""}
        </p>
      </div>
    </div>

    <hr style="margin:1.25rem 0;">
    <h3>Atividades recentes</h3>
    <div id="timeline" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;"></div>
  `;
}

function renderPost(ev) {
  const date = ev.date ? new Date(ev.date).toLocaleDateString("pt-BR") : "";
  let icon = "📝";
  if (ev.type === "despesa") icon = "💸";
  if (ev.type === "proposicao") icon = "📜";
  if (ev.type === "discurso") icon = "🎤";
  if (ev.type === "noticia") icon = "📰";

  return `
    <article class="post-card" style="background:#fff;border-radius:10px;padding:1rem;box-shadow:var(--shadow);">
      <header style="display:flex;gap:0.75rem;align-items:center;">
        <div style="width:44px;height:44px;border-radius:8px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:20px;">
          ${icon}
        </div>
        <div>
          <strong style="display:block;">${ev.title}</strong>
          <small style="color:var(--muted);">${date}</small>
        </div>
      </header>
      <div style="margin-top:0.8rem;color:#222;">
        <p>${ev.body || ""}</p>
        ${ev.amount ? `<p style="margin-top:0.5rem;font-weight:bold;color:#b91c1c;">${moneyFormat(ev.amount)}</p>` : ""}
        ${ev.sourceUrl ? `<p style="margin-top:0.5rem;"><a href="${ev.sourceUrl}" target="_blank">Fonte ▶</a></p>` : ""}
      </div>
    </article>
  `;
}

async function carregarPerfil() {
  if (!id) {
    container.innerHTML = "<p>Político não encontrado.</p>";
    return;
  }

  // Primeiro post do feed vai servir como header (perfil)
  const posts = await getJSON(`${API}/api/politicos/${encodeURIComponent(id)}/posts`);
  if (!posts || posts.length === 0) {
    container.innerHTML = "<p>Nenhuma atividade encontrada para este político.</p>";
    return;
  }

  const perfilPost = posts.find(p => p.type === "perfil");
  const profile = {
    nome: perfilPost?.body?.split("(")[0]?.trim() || "Político",
    foto: perfilPost?.foto || "/photos/placeholder.jpg",
    cargo: perfilPost?.title || "",
    partido: perfilPost?.body?.match(/\((.*?)\)/)?.[1] || "",
    uf: "", // pode ser preenchido se vier no CSV
    municipio: "" // idem
  };

  renderHeader(profile);

  const timeline = document.getElementById("timeline");
  timeline.innerHTML = posts.map(renderPost).join("");
}

carregarPerfil();
