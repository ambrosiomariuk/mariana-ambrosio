// Gerenciamento da Vitrine de Achadinhos da Mariana Ambrosio
let allProducts = [];
let activeCategory = 'Todos';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupSearchEvents();
  await loadProducts();
}

const DEFAULT_INITIAL_PRODUCTS = [
  {
    "id": "prod_1",
    "code": "221",
    "title": "Vaso de Planta Auto-irrigável com Sensor Inteligente",
    "category": "Casa & Decoração",
    "price": "R$ 49,90",
    "tag": "Destaque",
    "link": "https://shopee.com.br",
    "image": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80",
    "featured": true
  },
  {
    "id": "prod_2",
    "code": "220",
    "title": "Limpador de Superfície de Alta Pressão em Aço Inox Potente",
    "category": "Cozinha",
    "price": "R$ 68,00",
    "tag": "Viral TikTok",
    "link": "https://shopee.com.br",
    "image": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80",
    "featured": true
  },
  {
    "id": "prod_3",
    "code": "219",
    "title": "Organizador Acrílico Giratório 360° para Maquiagem e Skincare",
    "category": "Beleza & Cuidados",
    "price": "R$ 39,90",
    "tag": "Favorito",
    "link": "https://amazon.com.br",
    "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    "featured": false
  },
  {
    "id": "prod_4",
    "code": "218",
    "title": "Mini Selador Térmico Portátil de Embalagens a Vácuo",
    "category": "Cozinha",
    "price": "R$ 22,50",
    "tag": "Prático",
    "link": "https://shopee.com.br",
    "image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    "featured": false
  },
  {
    "id": "prod_5",
    "code": "217",
    "title": "Lâmpada LED Sem Fio com Sensor de Presença para Armários",
    "category": "Tecnologia",
    "price": "R$ 34,90",
    "tag": "Indispensável",
    "link": "https://mercadolivre.com.br",
    "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
    "featured": false
  }
];

async function loadProducts() {
  try {
    // 1. Tenta carregar da API do servidor local
    const res = await fetch('/api/products');
    if (res.ok) {
      allProducts = await res.json();
    } else {
      throw new Error('API não disponível');
    }
  } catch (err) {
    // 2. Fallback: localStorage (armazena os produtos mais recentes)
    const cached = localStorage.getItem('mari_products');
    if (cached) {
      try {
        allProducts = JSON.parse(cached);
      } catch (e) {}
    }

    // 3. Fallback: arquivo estático ou produtos padrão
    if (!allProducts || allProducts.length === 0) {
      try {
        const staticRes = await fetch('data/products.json');
        if (staticRes.ok) {
          allProducts = await staticRes.json();
        }
      } catch (e) {}
    }
  }

  if (!allProducts || allProducts.length === 0) {
    allProducts = [...DEFAULT_INITIAL_PRODUCTS];
  }

  // Se tiver produtos carregados, salva em cache local para agilidade
  if (allProducts.length > 0) {
    localStorage.setItem('mari_products', JSON.stringify(allProducts));
  }

  renderCategories();
  renderProducts();
}

function setupSearchEvents() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClearBtn');

  if (input) {
    input.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (clearBtn) {
        clearBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
      }
      renderProducts();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      searchQuery = '';
      clearBtn.style.display = 'none';
      input.focus();
      renderProducts();
    });
  }
}

function renderCategories() {
  const categoriesList = document.getElementById('categoriesList');
  if (!categoriesList) return;

  // Extrair categorias únicas
  const categoriesSet = new Set();
  allProducts.forEach(p => {
    if (p.category && p.category.trim()) {
      categoriesSet.add(p.category.trim());
    }
  });

  const categories = ['Todos', ...Array.from(categoriesSet)];

  categoriesList.innerHTML = categories.map(cat => `
    <button class="category-pill ${cat === activeCategory ? 'active' : ''}" 
            onclick="selectCategory('${escapeHtml(cat)}')">
      ${escapeHtml(cat)}
    </button>
  `).join('');
}

function selectCategory(category) {
  activeCategory = category;
  renderCategories();
  renderProducts();
}

function getFilteredProducts() {
  return allProducts.filter(p => {
    // Filtro por Categoria
    if (activeCategory !== 'Todos' && p.category !== activeCategory) {
      return false;
    }

    // Filtro por Busca (Código, Título, Categoria ou Tag)
    if (searchQuery) {
      const code = (p.code || '').toString().toLowerCase();
      const title = (p.title || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const tag = (p.tag || '').toLowerCase();

      const matches = code.includes(searchQuery) ||
                      title.includes(searchQuery) ||
                      category.includes(searchQuery) ||
                      tag.includes(searchQuery);

      if (!matches) return false;
    }

    return true;
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countDisplay = document.getElementById('resultsCount');
  if (!grid) return;

  const filtered = getFilteredProducts();

  if (countDisplay) {
    const total = filtered.length;
    countDisplay.textContent = total === 1 ? '1 achadinho encontrado' : `${total} achadinhos encontrados`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-bag-shopping"></i>
        <h3>Nenhum achadinho encontrado</h3>
        <p>Tente buscar por outra palavra-chave ou ver outra categoria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const code = product.code ? `#${escapeHtml(product.code)}` : '';
    const tag = product.tag ? `<span class="tag-badge">${escapeHtml(product.tag)}</span>` : '';
    const price = product.price ? `<div class="card-price">${escapeHtml(product.price)}</div>` : '';
    const category = product.category ? `<span class="card-category">${escapeHtml(product.category)}</span>` : '';
    const imageSrc = product.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
    const link = product.link || '#';

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="card-media">
          ${code ? `<span class="code-badge">${code}</span>` : ''}
          ${tag}
          <img src="${escapeHtml(imageSrc)}" 
               alt="${escapeHtml(product.title)}" 
               loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'">
        </div>
        <div class="card-content">
          ${category}
          <h2 class="card-title">${escapeHtml(product.title)}</h2>
          ${price}
          <div class="card-actions">
            <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="btn-buy">
              <span>Ver na Loja</span>
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="btn-copy" onclick="copyProductLink('${escapeHtml(link)}')" title="Copiar link">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function copyProductLink(url) {
  if (!url || url === '#') {
    showToast('Link não cadastrado para este produto.');
    return;
  }
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copiado com sucesso! 🔗');
  }).catch(() => {
    // Fallback
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('Link copiado com sucesso! 🔗');
  });
}

function showToast(message) {
  let toast = document.getElementById('toastMsg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>${escapeHtml(message)}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
