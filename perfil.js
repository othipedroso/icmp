import { getJSON } from "./utils.js";

const API_BASE = "";
const PLACEHOLDER_FOTO = "https://via.placeholder.com/160x160.png?text=Sem+Foto";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const tipoParam = (params.get("tipo") || "").toLowerCase();
const container = document.getElementById("perfil-container");

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function moneyFormat(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "R$ 0,00";
  }
  return moneyFormatter.format(Number(value));
}

function formatDate(value) {
  if (!value) return "";
  const raw = String(value);
  const formats = [raw, `${raw}T00:00:00`, raw.replace(/\s+/, "T")];
  for (const candidate of formats) {
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }
  }
  return value;
}

function buildHeader(perfil, tipo) {
  const gabinete = perfil?.gabinete || {};
  const contatos = [];
  if (perfil?.email) {
    contatos.push(`<a href="mailto:${perfil.email}">${perfil.email}</a>`);
  }
  if (gabinete?.telefone) {
    contatos.push(`Gabinete: ${gabinete.telefone}`);
  }
  if (gabinete?.sala) {
    contatos.push(`Sala ${gabinete.sala}`);
  }
  if (gabinete?.predio) {
    contatos.push(`Prédio ${gabinete.predio}`);
  }
  if (perfil?.urlPerfilOficial) {
    contatos.push(`<a href="${perfil.urlPerfilOficial}" target="_blank" rel="noopener">Página oficial</a>`);
  }

  return `
    <section class="profile-header" style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;">
      <img src="${perfil?.foto || PLACEHOLDER_FOTO}" alt="Foto de ${perfil?.nome || "Político"}" style="width:160px;height:160px;border-radius:50%;object-fit:cover;border:4px solid var(--primary, #0f766e);" onerror="this.onerror=null;this.src='${PLACEHOLDER_FOTO}';">
      <div style="flex:1;min-width:240px;">
        <h2 style="margin:0 0 0.5rem;">${perfil?.nome || "Político"}</h2>
        <p style="margin:0;color:var(--muted,#475569);">
          ${perfil?.cargo || ""} ${perfil?.partido ? "• " + perfil.partido : ""} ${perfil?.uf ? "• " + perfil.uf : ""}
        </p>
        ${perfil?.situacao ? `<p style="margin:0.5rem 0;color:var(--muted,#475569);">Situação: ${perfil.situacao}</p>` : ""}
        ${contatos.length ? `<p style="margin:0.75rem 0 0;color:var(--muted,#475569);display:flex;flex-direction:column;gap:0.25rem;">${contatos.join("<br>")}</p>` : ""}
        ${tipo === "tse" ? `<p style="margin:0.75rem 0 0;color:var(--muted,#475569);">Informações fornecidas pelo TSE.</p>` : ""}
      </div>
    </section>
  `;
}

function buildResumoCards(data) {
  const cards = [];
  if (data?.gastos) {
    cards.push({
      titulo: "Gasto total",
      valor: moneyFormat(data.gastos.total || 0),
      detalhe: `${data.gastos.quantidade || 0} registros`,
    });
  }
  if (data?.proposicoes) {
    cards.push({
      titulo: "Projetos apresentados",
      valor: data.proposicoes.total || 0,
      detalhe: `${(data.proposicoes.itens || []).length} exibidos`,
    });
  }
  if (data?.votacoes) {
    cards.push({
      titulo: "Votações registradas",
      valor: data.votacoes.total || 0,
      detalhe: `${(data.votacoes.itens || []).length} recentes`,
    });
  }

  if (!cards.length) return "";

  const htmlCards = cards
    .map(
      (card) => `
        <div class="stat-card" style="background:#fff;border-radius:12px;padding:1rem;box-shadow:var(--shadow,0 10px 30px rgba(15,118,110,0.1));">
          <p style="margin:0;color:var(--muted,#475569);font-size:0.85rem;">${card.titulo}</p>
          <strong style="display:block;font-size:1.4rem;margin-top:0.35rem;color:#0f172a;">${card.valor}</strong>
          <span style="display:block;margin-top:0.25rem;color:var(--muted,#475569);font-size:0.8rem;">${card.detalhe}</span>
        </div>
      `
    )
    .join("");

  return `
    <section class="profile-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
      ${htmlCards}
    </section>
  `;
}

function buildGastosSection(gastos) {
  if (!gastos || !Array.isArray(gastos.itens) || gastos.itens.length === 0) {
    return `
      <section class="profile-section">
        <h3>Gastos com Cota Parlamentar</h3>
        <p>Nenhum gasto recente disponível para este político.</p>
      </section>
    `;
  }

  const linhas = gastos.itens
    .map(
      (item) => `
        <tr>
          <td>${item.mes?.toString().padStart(2, "0")}/${item.ano || ""}</td>
          <td>${item.tipo || ""}</td>
          <td>${item.fornecedor || ""}</td>
          <td style="text-align:right;">${moneyFormat(item.valor)}</td>
          <td>${item.documento ? `<a href="${item.documento}" target="_blank" rel="noopener">Documento</a>` : ""}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="profile-section">
      <h3>Gastos com Cota Parlamentar</h3>
      <p style="color:var(--muted,#475569);">Total declarado: <strong>${moneyFormat(gastos.total || 0)}</strong> (${gastos.quantidade || 0} registros).</p>
      <div class="table-wrapper" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:640px;">
          <thead>
            <tr style="background:var(--bg,#f8fafc);text-align:left;">
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Competência</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Tipo</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Fornecedor</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;text-align:right;">Valor</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Comprovante</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildProjetosSection(proposicoes) {
  if (!proposicoes || !Array.isArray(proposicoes.itens) || proposicoes.itens.length === 0) {
    return `
      <section class="profile-section">
        <h3>Projetos e proposições</h3>
        <p>Nenhuma proposição recente encontrada.</p>
      </section>
    `;
  }

  const itens = proposicoes.itens
    .map((p) => {
      const titulo = [p.sigla, p.numero && `${p.numero}/${p.ano || ""}`]
        .filter(Boolean)
        .join(" ");
      return `
        <li style="padding:1rem;border:1px solid #e2e8f0;border-radius:10px;background:#fff;">
          <strong style="display:block;font-size:1rem;color:#0f172a;">${titulo || "Proposição"}</strong>
          ${p.dataApresentacao ? `<small style="display:block;color:var(--muted,#475569);">Apresentação: ${formatDate(p.dataApresentacao)}</small>` : ""}
          <p style="margin:0.5rem 0 0;color:#1e293b;">${p.ementa || "Sem descrição disponível."}</p>
          ${p.status ? `<p style="margin:0.5rem 0 0;color:var(--muted,#475569);">Situação: ${p.status}</p>` : ""}
          ${p.uri ? `<a href="${p.uri}" target="_blank" rel="noopener" style="display:inline-block;margin-top:0.5rem;color:#0f766e;">Ver no portal oficial</a>` : ""}
        </li>
      `;
    })
    .join("");

  return `
    <section class="profile-section">
      <h3>Projetos e proposições</h3>
      <ul style="list-style:none;padding:0;display:grid;gap:1rem;">
        ${itens}
      </ul>
    </section>
  `;
}

function buildResumoVotos(resumo) {
  if (!resumo || typeof resumo !== "object") return "";
  const entries = Object.entries(resumo);
  if (!entries.length) return "";

  return `
    <ul style="list-style:none;padding:0;display:flex;gap:1rem;flex-wrap:wrap;">
      ${entries
        .map(
          ([label, value]) => `
            <li style="background:var(--bg,#f1f5f9);padding:0.5rem 0.75rem;border-radius:999px;font-size:0.85rem;color:#0f172a;">
              <strong>${label}:</strong> ${value}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function buildVotacoesSection(votacoes) {
  if (!votacoes || !Array.isArray(votacoes.itens) || votacoes.itens.length === 0) {
    return `
      <section class="profile-section">
        <h3>Votações</h3>
        <p>Nenhuma votação registrada para este período.</p>
      </section>
    `;
  }

  const linhas = votacoes.itens
    .map((v) => {
      const materia = [v.proposicaoSigla, v.proposicaoNumero && `${v.proposicaoNumero}/${v.proposicaoAno || ""}`]
        .filter(Boolean)
        .join(" ");
      return `
        <tr>
          <td>${formatDate(v.data)}${v.hora ? ` ${v.hora}` : ""}</td>
          <td>${materia || ""}</td>
          <td>${v.descricao || ""}</td>
          <td>${v.voto || ""}</td>
          <td>${v.orientacao || ""}</td>
          <td>${v.resultado || ""}</td>
          <td>${v.url ? `<a href="${v.url}" target="_blank" rel="noopener">Detalhes</a>` : ""}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="profile-section">
      <h3>Votações</h3>
      ${buildResumoVotos(votacoes.resumo)}
      <div class="table-wrapper" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:760px;">
          <thead>
            <tr style="background:var(--bg,#f8fafc);text-align:left;">
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Data</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Matéria</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Resumo</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Voto</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Orientação</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Resultado</th>
              <th style="padding:0.75rem;border-bottom:1px solid #e2e8f0;">Fonte</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function buildFontesSection(fontes) {
  if (!fontes || typeof fontes !== "object") return "";
  const links = Object.entries(fontes)
    .filter(([, url]) => !!url)
    .map(
      ([label, url]) => {
        const texto = label
          ? label.charAt(0).toUpperCase() + label.slice(1)
          : "Fonte oficial";
        return `
        <li>
          <a href="${url}" target="_blank" rel="noopener">${texto}</a>
        </li>
      `;
      }
    )
    .join("");

  if (!links) return "";

  return `
    <section class="profile-section">
      <h3>Fontes oficiais</h3>
      <ul style="padding-left:1.2rem;display:grid;gap:0.5rem;">
        ${links}
      </ul>
    </section>
  `;
}

function buildAvisos(avisos) {
  if (!Array.isArray(avisos) || !avisos.length) return "";
  return `
    <section class="profile-section" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:1rem;">
      <h3 style="margin-top:0;">Avisos</h3>
      <ul style="margin:0;padding-left:1.25rem;color:#7f1d1d;">
        ${avisos.map((aviso) => `<li>${aviso}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderPerfilCamara(data) {
  container.innerHTML = `
    ${buildHeader(data.perfil, "camara")}
    ${buildResumoCards(data)}
    ${buildGastosSection(data.gastos)}
    ${buildProjetosSection(data.proposicoes)}
    ${buildVotacoesSection(data.votacoes)}
    ${buildFontesSection(data.fontes)}
  `;
}

function renderPerfilSenado(data) {
  container.innerHTML = `
    ${buildHeader(data.perfil, "senado")}
    ${buildResumoCards(data)}
    ${buildGastosSection(data.gastos)}
    ${buildProjetosSection(data.proposicoes)}
    ${buildVotacoesSection(data.votacoes)}
    ${buildFontesSection(data.fontes)}
  `;
}

function renderPerfilTse(data) {
  container.innerHTML = `
    ${buildHeader(data.perfil, "tse")}
    ${buildAvisos(data.avisos)}
    ${buildFontesSection(data.fontes)}
  `;
}

async function carregarPerfil() {
  if (!id) {
    container.innerHTML = "<p>Político não encontrado.</p>";
    return;
  }

  container.innerHTML = "<p>Carregando dados oficiais...</p>";

  const tipo = tipoParam || undefined;
  let endpoint;
  switch (tipo) {
    case "senado":
      endpoint = `/api/politicos/senado/${encodeURIComponent(id)}`;
      break;
    case "tse":
      endpoint = `/api/politicos/tse/${encodeURIComponent(id)}`;
      break;
    case "camara":
    default:
      endpoint = `/api/politicos/camara/${encodeURIComponent(id)}`;
      break;
  }

  try {
    const data = await getJSON(`${API_BASE}${endpoint}`);
    if (!data || (Array.isArray(data) && !data.length)) {
      container.innerHTML = "<p>Não encontramos dados oficiais para este político.</p>";
      return;
    }

    if ((data.tipo || tipo) === "senado") {
      renderPerfilSenado(data);
      return;
    }

    if ((data.tipo || tipo) === "tse") {
      renderPerfilTse(data);
      return;
    }

    renderPerfilCamara(data);
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Ocorreu um erro ao carregar o perfil. Tente novamente mais tarde.</p>";
  }
}

carregarPerfil();