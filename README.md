# 🗳️ ICMP - Iniciativa Cidadã de Monitoramento Político

> **Transparência para fortalecer a democracia.**  
> O ICMP é um projeto open-source que facilita o acesso do cidadão brasileiro a informações políticas **oficiais e imparciais**.

---

## 🚀 Funcionalidades

- ✅ **Quem Cobrar?** → Descubra quem são os **prefeitos e vereadores** eleitos em sua cidade.  
- ✅ **Organograma** → Veja a estrutura do poder político em nível **federal, estadual e municipal**.  
- ✅ **Notícias** → Acompanhe as últimas notícias oficiais da **Câmara dos Deputados** e do **Senado Federal**.  
- ✅ **Perfil do Político** → Consulte informações e atividade parlamentar (discursos, proposições).  

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (modular ES6)  
- **Backend:** Node.js + Express  
- **APIs Oficiais:**  
  - [IBGE](https://servicodados.ibge.gov.br) – Estados e Municípios  
  - [Câmara dos Deputados](https://dadosabertos.camara.leg.br/) – Deputados, discursos, proposições  
  - [Senado Federal](https://legis.senado.leg.br/dadosabertos/) – Senadores, notícias  
  - [TSE](https://dadosabertos.tse.jus.br/) – Candidatos eleitos (dados CSV 2024)  

---

## 📂 Estrutura de Pastas

icmp/
├─ backend/
│ └─ server.js # Servidor Node.js
├─ css/
│ ├─ style.css
│ ├─ news.css
│ └─ autocomplete.css
├─ js/
│ ├─ utils.js
│ ├─ quem-cobrar.js
│ ├─ organograma.js
│ └─ news.js
├─ dados-tse/
│ └─ 2024/
│ ├─ consulta_cand_2024_BRASIL.csv
│ └─ Fotos/ # Fotos oficiais dos candidatos por UF
├─ index.html
├─ quem-cobrar.html
├─ organograma.html
├─ noticias.html
├─ perfil.html
└─ missao.html

## ⚙️ Instalação e Uso

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/icmp.git
cd 

2. Instalar dependências
cd backend
npm install

3. Executar o servidor
npm start

4. Acessar no navegador
http://localhost:3000

📊 Dados do TSE (2024)

O projeto utiliza o arquivo:

dados-tse/2024/consulta_cand_2024_BRASIL.csv


E a pasta de fotos oficiais:

dados-tse/2024/Fotos/foto_cand2024_XX_div/


(onde XX é a sigla do estado, ex: SP, RJ, PR...)

Caso não tenha esses arquivos, você pode baixá-los diretamente do repositório oficial de dados do TSE:
👉 dadosabertos.tse.jus.br


🤝 Contribuição

Faça um fork do projeto

Crie uma branch para sua feature (git checkout -b feature/nova-feature)

Commit suas alterações (git commit -m 'feat: nova feature')

Push para a branch (git push origin feature/nova-feature)

Abra um Pull Request

📜 Licença

Este projeto está sob a licença MIT.
Você pode usar, copiar, modificar e distribuir livremente, desde que mantenha os créditos.

✨ Autor

Desenvolvido por Thiago Pedroso

📍 Brasil | 🌐 Projeto independente e sem viés político