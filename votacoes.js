async function carregarVotacoes() {
  const camaraDiv = document.getElementById("camara-votacoes");
  const senadoDiv = document.getElementById("senado-votacoes");

  try {
    // 📊 Câmara
    const camaraResp = await fetch("/api/camara/votacoes");
    const camara = await camaraResp.json();

    camaraDiv.innerHTML = "";
    (camara.data || []).slice(0, 10).forEach(v => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <h3>${v.descricao || "Votação"}</h3>
        <p><strong>Data:</strong> ${v.dataHoraRegistro || v.data || "—"}</p>
        <p><strong>Resultado:</strong> ${v.resultado || "Em andamento"}</p>
      `;
      camaraDiv.appendChild(card);
    });

    if (!camara.data || camara.data.length === 0) {
      camaraDiv.innerHTML = "<p>Nenhuma votação encontrada na Câmara.</p>";
    }

    // 🏛️ Senado
    const senadoResp = await fetch("/api/senado/votacoes");
    const senado = await senadoResp.json();

    senadoDiv.innerHTML = "";
    (senado.data || []).slice(0, 10).forEach(v => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <h3>${v.descricao || "Votação"}</h3>
        <p><strong>Data:</strong> ${v.data || "—"}</p>
        <p><strong>Resultado:</strong> ${v.resultado || "—"}</p>
        <p>${v.resumo || ""}</p>
      `;
      senadoDiv.appendChild(card);
    });

    if (!senado.data || senado.data.length === 0) {
      senadoDiv.innerHTML = "<p>Nenhuma votação encontrada no Senado.</p>";
    }

  } catch (e) {
    console.error("❌ Erro ao carregar votações:", e);
    camaraDiv.innerHTML = "<p>Erro ao carregar votações da Câmara.</p>";
    senadoDiv.innerHTML = "<p>Erro ao carregar votações do Senado.</p>";
  }
}

// inicializa
document.addEventListener("DOMContentLoaded", carregarVotacoes);
