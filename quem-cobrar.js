const ufInput = document.getElementById("uf-input");
const cidadeInput = document.getElementById("cidade-input");

const prefeitoContainer = document.getElementById("prefeito-container");
const vereadoresContainer = document.getElementById("vereadores-container");

let estados = [];
let cidades = [];

// Normaliza texto para ignorar acentos/maiúsculas
function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Fetch com tratamento de erro
async function getJSON(url) {
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    console.error("Erro:", e);
    return [];
  }
}

// Cria lista de autocomplete
function createAutocomplete(inputEl, data, onSelect) {
  let listEl = inputEl.nextElementSibling;
  if (!listEl || !listEl.classList.contains("autocomplete-list")) {
    listEl = document.createElement("ul");
    listEl.className = "autocomplete-list";
    inputEl.parentNode.appendChild(listEl);
  }

  inputEl.addEventListener("input", () => {
    const query = normalize(inputEl.value);
    listEl.innerHTML = "";

    if (!query) return;

    const results = data.filter(item =>
      normalize(item.nome).includes(query) ||
      normalize(item.sigla || "").includes(query)
    ).slice(0, 10);

    results.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.nome;
      li.addEventListener("click", () => {
        inputEl.value = item.nome;
        listEl.innerHTML = "";
        onSelect(item);
      });
      listEl.appendChild(li);
    });
  });
}

// Buscar prefeito e vereadores
async function carregarMunicipio(uf, cidade) {
  prefeitoContainer.innerHTML = "<p>Carregando...</p>";
  vereadoresContainer.innerHTML = "<p>Carregando...</p>";

  const prefeitos = await getJSON(`${API}/api/prefeitos/${uf}/${encodeURIComponent(cidade)}`);
  const vereadores = await getJSON(`${API}/api/vereadores/${uf}/${encodeURIComponent(cidade)}`);

  if (prefeitos.length) {
    prefeitoContainer.innerHTML = card(prefeitos[0]); // só 1 prefeito eleito
  } else {
    prefeitoContainer.innerHTML = "<p>Prefeito não encontrado.</p>";
  }

  vereadoresContainer.innerHTML =
    vereadores.length ? vereadores.map(card).join("") : "<p>Nenhum vereador encontrado.</p>";
}
// Carregar governador
const governadores = await getJSON(`${API}/api/governadores/${uf}`);
governadorContainer.innerHTML =
  governadores.length ? governadores.map(card).join("") : "<p>Governador não encontrado.</p>";

// Carregar vice-governador
const vicegovernadores = await getJSON(`${API}/api/vicegovernadores/${uf}`);
vicegovernadorContainer.innerHTML =
  vicegovernadores.length ? vicegovernadores.map(card).join("") : "<p>Vice-Governador não encontrado.</p>";

// Carregar vice-prefeito
const viceprefeitos = await getJSON(`${API}/api/viceprefeitos/${uf}/${encodeURIComponent(cidade)}`);
viceprefeitoContainer.innerHTML =
  viceprefeitos.length ? viceprefeitos.map(card).join("") : "<p>Vice-Prefeito não encontrado.</p>";


// ---- Inicialização ----
(async () => {
  estados = await getJSON("/api/estados");

  createAutocomplete(ufInput, estados, async (estado) => {
    cidadeInput.disabled = false;
    cidadeInput.value = "";
    cidades = await getJSON(`/api/cidades/${estado.sigla}`);
    createAutocomplete(cidadeInput, cidades, (cidade) => {
      carregarMunicipio(estado.sigla, cidade.nome);
    });
  });
})();
