const API = "http://localhost:3000";
const newsContainer = document.getElementById("news-container");

async function getJSON(url) {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return j.data || [];
  } catch (err) {
    console.error("Erro:", err);
    return [];
  }
}

// Junta e ordena notícias
function mergeAndSortNews(camara, senado) {
  const all = [...camara, ...senado];
  return all.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

function renderNews(items) {
  if (!items.length) {
    newsContainer.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  newsContainer.innerHTML = items
    .map(
      (n) => `
      <a class="news-card-horizontal" href="${n.link}" target="_blank" rel="noopener">
        <div class="news-thumb">
          <img src="https://via.placeholder.com/150x100.png?text=Notícia" alt="thumb">
        </div>
        <div class="news-content">
          <h3>${n.title}</h3>
          <p class="news-date">${new Date(n.pubDate).toLocaleDateString("pt-BR")}</p>
          <p class="news-desc">${n.description || ""}</p>
        </div>
      </a>
    `
    )
    .join("");
}

async function loadLatest() {
  const [camara, senado] = await Promise.all([
    getJSON(`${API}/api/camara/noticias-rss?tema=ULTIMAS`),
    getJSON(`${API}/api/senado/noticias-rss`),
  ]);

  const all = mergeAndSortNews(camara, senado);
  renderNews(all);
}

// inicia mostrando últimas
loadLatest();
