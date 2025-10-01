// js/utils.js

// Fetch com tratamento de erro
export async function getJSON(url) {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return j.data || [];
  } catch (err) {
    console.error("Erro em getJSON:", err);
    return [];
  }
}

// Normaliza texto (lowercase, sem acento)
export function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Gera card de político
export function card(p) {
  const params = new URLSearchParams();
  if (p?.id !== undefined && p?.id !== null) {
    params.set("id", p.id);
  }
  const tipoInferido = (() => {
    if (p?.tipo) return p.tipo;
    const cargo = (p?.cargo || "").toLowerCase();
    if (cargo.includes("senador")) return "senado";
    if (cargo.includes("deputado")) return "camara";
    return undefined;
  })();
  if (tipoInferido) {
    params.set("tipo", tipoInferido);
  }

  const href = `perfil.html?${params.toString()}`;

  return `
    <a class="role-card" href="${href}">
      <img src="${p.foto}" alt="Foto de ${p.nome}" onerror="this.src='/photos/placeholder.jpg'">
      <div class="role-body">
        <h5>${p.nome}</h5>
        <p>${p.cargo}</p>
        <p>${p.partido || ""} • ${p.municipio ? p.municipio + "/" + p.uf : p.uf}</p>
      </div>
    </a>
  `;
}