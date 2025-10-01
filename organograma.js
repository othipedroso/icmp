// js/organograma.js
import { getJSON, card, normalize } from "./utils.js";

const API_BASE = "";

const estadoInput = document.getElementById("estado-input");
const estadoSugestoes = document.getElementById("estado-sugestoes");
const cidadeInput = document.getElementById("cidade-input");
const cidadeSugestoes = document.getElementById("cidade-sugestoes");

const federalContainer = document.getElementById("federal-container");
const estadualContainer = document.getElementById("estadual-container");
const municipalContainer = document.getElementById("municipal-container");

let estados = [];
let cidades = [];

// Carregar estados no início
async function carregarEstados() {
  estados = await getJSON(`${API_BASE}/api/estados`);
}

// Sugestões de estados
estadoInput.addEventListener("input", () => {
  const q = normalize(estadoInput.value);
  estadoSugestoes.innerHTML = "";
  if (!q) return;

  const matches = estados.filter(e =>
    normalize(e.nome).includes(q) || normalize(e.sigla).includes(q)
  ).slice(0, 10);

  matches.forEach(e => {
    const div = document.createElement("div");
    div.textContent = `${e.nome} (${e.sigla})`;
    div.addEventListener("click", async () => {
      estadoInput.value = e.sigla;
      estadoSugestoes.innerHTML = "";
      cidades = await getJSON(`${API_BASE}/api/cidades/${e.sigla}`);
      cidadeInput.disabled = false;

      carregarFederais(e.sigla);
      carregarSenadores(e.sigla);
    });
    estadoSugestoes.appendChild(div);
  });
});

// Sugestões de cidades
cidadeInput.addEventListener("input", () => {
  const q = normalize(cidadeInput.value);
  cidadeSugestoes.innerHTML = "";
  if (!q) return;

  const matches = cidades
    .filter(c => normalize(c.nome).includes(q))
    .slice(0, 10);

  matches.forEach(c => {
    const div = document.createElement("div");
    div.textContent = c.nome;
    div.addEventListener("click", () => {
      cidadeInput.value = c.nome;
      cidadeSugestoes.innerHTML = "";
      carregarMunicipais(estadoInput.value, c.nome);
    });
    cidadeSugestoes.appendChild(div);
  });
});

// Deputados Federais
async function carregarFederais(uf) {
  federalContainer.innerHTML = "<p>Carregando...</p>";
  const deputados = await getJSON(`${API_BASE}/api/camara/deputados?siglaUf=${uf}`);

  const tratados = deputados.map(d => ({
    id: d.id,
    nome: d.nome,
    cargo: "Deputado Federal",
    partido: d.siglaPartido || d.ultimoStatus?.siglaPartido || "",
    uf: d.siglaUf || d.ultimoStatus?.siglaUf || uf,
    foto: d.urlFoto || d.ultimoStatus?.urlFoto,
    tipo: "camara",
  }));

  federalContainer.innerHTML = tratados.length
    ? tratados.map(card).join("")
    : "<p>Nenhum deputado encontrado.</p>";
}

// Senadores
async function carregarSenadores(uf) {
  estadualContainer.innerHTML = "<p>Carregando...</p>";
  const senadores = await getJSON(`${API_BASE}/api/senado/senadores`);
  const lista = senadores.filter(s => s.uf.toLowerCase() === uf.toLowerCase());

  estadualContainer.innerHTML = lista.length
    ? lista.map(card).join("")
    : "<p>Nenhum senador encontrado.</p>";
}

// Prefeitos + Vereadores
async function carregarMunicipais(uf, cidade) {
  municipalContainer.innerHTML = "<p>Carregando...</p>";

  const prefeitos = await getJSON(`${API_BASE}/api/prefeitos/${uf}/${encodeURIComponent(cidade)}`);
  const vereadores = await getJSON(`${API_BASE}/api/vereadores/${uf}/${encodeURIComponent(cidade)}`);

  const prefeito = prefeitos.length
    ? card({ ...prefeitos[0], tipo: prefeitos[0].tipo || "tse" })
    : "<p>Prefeito não encontrado.</p>";
  const vereadoresHtml = vereadores.length
    ? vereadores
        .map(v => card({ ...v, tipo: v.tipo || "tse" }))
        .join("")
    : "<p>Nenhum vereador encontrado.</p>";

  municipalContainer.innerHTML = `
    <h3>Prefeito</h3>
    ${prefeito}
    <h3>Vereadores</h3>
    ${vereadoresHtml}
  `;
}

// Inicialização
carregarEstados();
