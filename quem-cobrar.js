import { getJSON, card, normalize } from "./utils.js";

const API_BASE = "";

const ufInput = document.getElementById("uf-input");
const cidadeInput = document.getElementById("cidade-input");
const ufList = ufInput.nextElementSibling;
const cidadeList = cidadeInput.nextElementSibling;

const governadorContainer = document.getElementById("governador-container");
const viceGovernadorContainer = document.getElementById("vicegovernador-container");
const prefeitoContainer = document.getElementById("prefeito-container");
const vicePrefeitoContainer = document.getElementById("viceprefeito-container");
const vereadoresContainer = document.getElementById("vereadores-container");

let estados = [];
let cidades = [];
let estadoSelecionado = null;

function renderMessage(container, message) {
  container.innerHTML = `<p>${message}</p>`;
}

function renderCards(container, items, emptyMessage, { onlyFirst = false } = {}) {
  if (!items || items.length === 0) {
    renderMessage(container, emptyMessage);
    return;
  }

  if (onlyFirst) {
    container.innerHTML = card(items[0]);
    return;
  }

  container.innerHTML = items.map(card).join("");
}

function limparMunicipio() {
  renderMessage(prefeitoContainer, "Selecione uma cidade.");
  renderMessage(vicePrefeitoContainer, "Selecione uma cidade.");
  renderMessage(vereadoresContainer, "Selecione uma cidade.");
}

function limparEstado() {
  renderMessage(governadorContainer, "Selecione um estado.");
  renderMessage(viceGovernadorContainer, "Selecione um estado.");
  limparMunicipio();
}

function esconderSugestoes(listEl) {
  listEl.innerHTML = "";
}

function mostrarSugestoes(listEl, itens, onSelect) {
  listEl.innerHTML = "";
  itens.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.rotulo;
    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      onSelect(item);
      esconderSugestoes(listEl);
    });
    listEl.appendChild(li);
  });
}

async function carregarEstado(uf) {
  renderMessage(governadorContainer, "Carregando...");
  renderMessage(viceGovernadorContainer, "Carregando...");

  const [governadores, viceGovernadores] = await Promise.all([
    getJSON(`${API_BASE}/api/governadores/${uf}`),
    getJSON(`${API_BASE}/api/vicegovernadores/${uf}`),
  ]);

  renderCards(
    governadorContainer,
    governadores,
    "Governador não encontrado.",
    { onlyFirst: true }
  );

  renderCards(
    viceGovernadorContainer,
    viceGovernadores,
    "Vice-Governador não encontrado.",
    { onlyFirst: true }
  );
}

async function carregarMunicipio(uf, cidade) {
  renderMessage(prefeitoContainer, "Carregando...");
  renderMessage(vicePrefeitoContainer, "Carregando...");
  renderMessage(vereadoresContainer, "Carregando...");

  const [prefeitos, vicePrefeitos, vereadores] = await Promise.all([
    getJSON(`${API_BASE}/api/prefeitos/${uf}/${encodeURIComponent(cidade)}`),
    getJSON(`${API_BASE}/api/viceprefeitos/${uf}/${encodeURIComponent(cidade)}`),
    getJSON(`${API_BASE}/api/vereadores/${uf}/${encodeURIComponent(cidade)}`),
  ]);

  renderCards(
    prefeitoContainer,
    prefeitos,
    "Prefeito não encontrado.",
    { onlyFirst: true }
  );

  renderCards(
    vicePrefeitoContainer,
    vicePrefeitos,
    "Vice-Prefeito não encontrado.",
    { onlyFirst: true }
  );

  renderCards(
    vereadoresContainer,
    vereadores,
    "Nenhum vereador encontrado."
  );
}

function handleUfInput() {
  const consulta = normalize(ufInput.value);
  if (!consulta) {
    esconderSugestoes(ufList);
    return;
  }

  const resultados = estados
    .filter(
      (estado) =>
        normalize(estado.nome).includes(consulta) ||
        normalize(estado.sigla).includes(consulta)
    )
    .slice(0, 10)
    .map((estado) => ({
      ...estado,
      rotulo: `${estado.nome} (${estado.sigla})`,
    }));

  if (resultados.length === 0) {
    esconderSugestoes(ufList);
    return;
  }

  mostrarSugestoes(ufList, resultados, async (estado) => {
    ufInput.value = estado.rotulo;
    estadoSelecionado = estado;
    cidadeInput.disabled = true;
    cidadeInput.value = "";
    esconderSugestoes(cidadeList);
    limparMunicipio();

    await carregarEstado(estado.sigla);

    cidades = await getJSON(`${API_BASE}/api/cidades/${estado.sigla}`);
    cidadeInput.disabled = false;
    cidadeInput.focus();
  });
}

function handleCidadeInput() {
  const consulta = normalize(cidadeInput.value);
  if (!consulta) {
    esconderSugestoes(cidadeList);
    return;
  }

  const resultados = cidades
    .filter((cidade) => normalize(cidade.nome).includes(consulta))
    .slice(0, 10)
    .map((cidade) => ({ ...cidade, rotulo: cidade.nome }));

  if (resultados.length === 0) {
    esconderSugestoes(cidadeList);
    return;
  }

  mostrarSugestoes(cidadeList, resultados, (cidade) => {
    cidadeInput.value = cidade.nome;
    esconderSugestoes(cidadeList);
    if (estadoSelecionado) {
      carregarMunicipio(estadoSelecionado.sigla, cidade.nome);
    }
  });
}

ufInput.addEventListener("input", handleUfInput);
ufInput.addEventListener("focus", () => {
  if (ufInput.value) {
    handleUfInput();
  }
});

cidadeInput.addEventListener("input", handleCidadeInput);
cidadeInput.addEventListener("focus", () => {
  if (cidadeInput.value) {
    handleCidadeInput();
  }
});

[ufInput.parentElement, cidadeInput.parentElement].forEach((wrapper, index) => {
  const listEl = index === 0 ? ufList : cidadeList;
  wrapper.addEventListener("mouseleave", () => esconderSugestoes(listEl));
});

document.addEventListener("click", (event) => {
  if (!ufInput.parentElement.contains(event.target)) {
    esconderSugestoes(ufList);
  }
  if (!cidadeInput.parentElement.contains(event.target)) {
    esconderSugestoes(cidadeList);
  }
});

(async function init() {
  limparEstado();
  estados = await getJSON(`${API_BASE}/api/estados`);
})();