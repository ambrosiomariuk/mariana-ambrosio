// Lógica do Painel Administrativo de Achadinhos da Mariana Ambrosio

const ADMIN_PASS = 'mariana2026'; // Senha padrão de acesso
let products = [];
let currentEditId = null;
let currentImageFile = null;
let currentImageDataUrl = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initAdmin();
});

// --- Autenticação Simples ---
function checkAuth() {
  const isAuth = sessionStorage.getItem('mari_admin_logged');
  const authOverlay = document.getElementById('authOverlay');
  if (isAuth === 'true') {
    if (authOverlay) authOverlay.style.display = 'none';
  } else {
    if (authOverlay) authOverlay.style.display = 'flex';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const passInput = document.getElementById('authPassword');
  const errorMsg = document.getElementById('authError');
  
  if (passInput.value.trim() === ADMIN_PASS) {
    sessionStorage.setItem('mari_admin_logged', 'true');
    document.getElementById('authOverlay').style.display = 'none';
    showToast('Login realizado com sucesso!');
  } else {
    errorMsg.style.display = 'block';
    passInput.value = '';
    passInput.focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem('mari_admin_logged');
  window.location.reload();
}

// --- Inicialização ---
async function initAdmin() {
  setupUploadDropzone();
  setupFormEvents();
  setupFilterEvents();
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

// --- Carregamento de Produtos ---
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      products = await res.json();
    } else {
      throw new Error('API offline');
    }
  } catch (err) {
    // Fallback: localStorage
    const cached = localStorage.getItem('mari_products');
    if (cached) {
      try {
        products = JSON.parse(cached);
      } catch (e) {}
    }

    if (!products || products.length === 0) {
      try {
        const staticRes = await fetch('data/products.json');
        if (staticRes.ok) {
          products = await staticRes.json();
        }
      } catch (e) {}
    }
  }

  if (!products || products.length === 0) {
    products = [...DEFAULT_INITIAL_PRODUCTS];
  }

  // Ordenar por data ou código decrescente
  products.sort((a, b) => {
    const numA = parseInt(a.code, 10) || 0;
    const numB = parseInt(b.code, 10) || 0;
    return numB - numA;
  });

  updateStats();
  updateCategoryDropdowns();
  renderProductsTable();
  suggestNextCode();
}

// --- Estatísticas ---
function updateStats() {
  const totalCount = document.getElementById('statTotal');
  const catCount = document.getElementById('statCategories');
  const featCount = document.getElementById('statFeatured');

  if (totalCount) totalCount.textContent = products.length;

  const categories = new Set(products.map(p => p.category).filter(Boolean));
  if (catCount) catCount.textContent = categories.size;

  const featured = products.filter(p => p.featured).length;
  if (featCount) featCount.textContent = featured;
}

// --- Dropdowns de Categoria ---
function updateCategoryDropdowns() {
  const formSelect = document.getElementById('productCategory');
  const tableFilter = document.getElementById('filterCategory');

  const defaultCategories = [
    'Casa & Decoração',
    'Cozinha',
    'Beleza & Cuidados',
    'Tecnologia',
    'Organização',
    'Moda & Acessórios'
  ];

  const existingCategories = new Set(defaultCategories);
  products.forEach(p => {
    if (p.category) existingCategories.add(p.category.trim());
  });

  const sortedCats = Array.from(existingCategories).sort();

  if (formSelect) {
    const currentVal = formSelect.value;
    formSelect.innerHTML = `
      <option value="">Selecione uma categoria...</option>
      ${sortedCats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
      <option value="__NEW__">+ Nova Categoria...</option>
    `;
    if (currentVal && sortedCats.includes(currentVal)) {
      formSelect.value = currentVal;
    }
  }

  if (tableFilter) {
    tableFilter.innerHTML = `
      <option value="ALL">Todas as Categorias</option>
      ${sortedCats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
    `;
  }
}

// --- Gerenciador de Upload de Imagem ---
function setupUploadDropzone() {
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('fileInput');
  const previewImg = document.getElementById('previewImg');
  const placeholder = document.getElementById('uploadPlaceholder');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#262423';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#E5DED8';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#E5DED8';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });
}

function compressImage(file, maxWidth = 600, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleFileSelected(file) {
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
    return;
  }

  currentImageFile = file;
  currentImageDataUrl = await compressImage(file);

  const previewImg = document.getElementById('previewImg');
  const placeholder = document.getElementById('uploadPlaceholder');
  if (previewImg && placeholder) {
    previewImg.src = currentImageDataUrl;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
  }
}

function resetImageUpload(existingUrl = null) {
  const previewImg = document.getElementById('previewImg');
  const placeholder = document.getElementById('uploadPlaceholder');
  const fileInput = document.getElementById('fileInput');

  currentImageFile = null;
  currentImageDataUrl = null;
  if (fileInput) fileInput.value = '';

  if (existingUrl) {
    if (previewImg) {
      previewImg.src = existingUrl;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
  }
}

// --- Sugerir Próximo Número de Achadinho ---
function suggestNextCode() {
  const codeInput = document.getElementById('productCode');
  if (!codeInput || currentEditId) return;

  let maxCode = 0;
  products.forEach(p => {
    const num = parseInt(p.code, 10);
    if (!isNaN(num) && num > maxCode) {
      maxCode = num;
    }
  });

  const next = maxCode > 0 ? (maxCode + 1).toString() : '222';
  codeInput.value = next;
}

// --- Eventos do Formulário ---
function setupFormEvents() {
  const form = document.getElementById('productForm');
  const catSelect = document.getElementById('productCategory');
  const cancelBtn = document.getElementById('btnCancelEdit');

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      if (e.target.value === '__NEW__') {
        const newCat = prompt('Digite o nome da nova categoria:');
        if (newCat && newCat.trim()) {
          const opt = document.createElement('option');
          opt.value = newCat.trim();
          opt.textContent = newCat.trim();
          opt.selected = true;
          catSelect.insertBefore(opt, catSelect.lastElementChild);
        } else {
          catSelect.value = '';
        }
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetForm();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveProduct();
    });
  }
}

// --- Salvar Produto (Novo ou Edição) ---
async function handleSaveProduct() {
  const saveBtn = document.getElementById('btnSaveProduct');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

  try {
    const code = document.getElementById('productCode').value.trim();
    const title = document.getElementById('productTitle').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const tag = document.getElementById('productTag').value.trim();
    const link = document.getElementById('productLink').value.trim();
    const featured = document.getElementById('productFeatured').checked;

    if (!code || !title || !link) {
      alert('Por favor, preencha o código, título e link de afiliado.');
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
      return;
    }

    let finalImageUrl = '';

    // 1. Usar imagem comprimida ou existente
    if (currentImageDataUrl) {
      finalImageUrl = currentImageDataUrl;
    } else if (currentEditId) {
      const existing = products.find(p => p.id === currentEditId);
      finalImageUrl = existing ? existing.image : '';
    }

    // Se ainda não tiver imagem, usar foto padrão ilustrativa
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
    }

    const productData = {
      id: currentEditId || '',
      code: code,
      title: title,
      category: category || 'Geral',
      price: price,
      tag: tag,
      link: link,
      image: finalImageUrl,
      featured: featured
    };

    // 2. Envia para API salvar
    try {
      const apiRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (apiRes.ok) {
        showToast(currentEditId ? 'Achadinho atualizado com sucesso! ✨' : 'Novo achadinho publicado com sucesso! 🎉');
      } else {
        throw new Error('Falha na API');
      }
    } catch (err) {
      // Modo offline fallback: atualiza array e localStorage
      if (currentEditId) {
        const idx = products.findIndex(p => p.id === currentEditId);
        if (idx !== -1) products[idx] = { ...products[idx], ...productData };
      } else {
        productData.id = 'prod_' + Date.now();
        productData.createdAt = new Date().toISOString();
        products.unshift(productData);
      }
      localStorage.setItem('mari_products', JSON.stringify(products));
      showToast('Salvo localmente com sucesso!');
    }

    resetForm();
    await loadProducts();

  } catch (error) {
    console.error(error);
    alert('Erro ao salvar o produto: ' + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// --- Resetar Formulário ---
function resetForm() {
  currentEditId = null;
  document.getElementById('productForm').reset();
  resetImageUpload();

  document.getElementById('formTitle').textContent = 'Cadastrar Novo Achadinho';
  document.getElementById('btnSaveProduct').innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar Achadinho';
  document.getElementById('btnCancelEdit').style.display = 'none';

  suggestNextCode();
}

// --- Editar Produto ---
function editProduct(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  currentEditId = id;

  document.getElementById('productCode').value = prod.code || '';
  document.getElementById('productTitle').value = prod.title || '';
  document.getElementById('productCategory').value = prod.category || '';
  document.getElementById('productPrice').value = prod.price || '';
  document.getElementById('productTag').value = prod.tag || '';
  document.getElementById('productLink').value = prod.link || '';
  document.getElementById('productFeatured').checked = !!prod.featured;

  resetImageUpload(prod.image);

  document.getElementById('formTitle').textContent = `Editando Achadinho #${prod.code}`;
  document.getElementById('btnSaveProduct').innerHTML = '<i class="fa-solid fa-check"></i> Atualizar Achadinho';
  document.getElementById('btnCancelEdit').style.display = 'inline-flex';

  window.scrollTo({ top: 150, behavior: 'smooth' });
}

// --- Excluir Produto ---
async function deleteProduct(id, code) {
  if (!confirm(`Tem certeza que deseja excluir o achadinho #${code}?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      showToast(`Achadinho #${code} excluído com sucesso.`);
    } else {
      throw new Error('Falha ao excluir na API');
    }
  } catch (err) {
    // Offline fallback
    products = products.filter(p => p.id !== id);
    localStorage.setItem('mari_products', JSON.stringify(products));
    showToast(`Achadinho #${code} excluído.`);
  }

  if (currentEditId === id) {
    resetForm();
  }

  await loadProducts();
}

// --- Renderizar Tabela de Gestão ---
function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('searchTable').value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('filterCategory').value;

  const filtered = products.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

    if (search) {
      const code = (p.code || '').toString().toLowerCase();
      const title = (p.title || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return code.includes(search) || title.includes(search) || cat.includes(search);
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #706B66;">
          Nenhum achadinho encontrado com esses filtros.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const thumb = p.image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
    const tag = p.tag ? `<span style="background: #E8F3EE; color: #2C6B52; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${escapeHtml(p.tag)}</span>` : '-';
    const feat = p.featured ? '⭐ Sim' : 'Não';

    return `
      <tr>
        <td>
          <img src="${escapeHtml(thumb)}" alt="Foto" class="table-thumb" 
               onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'">
        </td>
        <td>
          <span class="table-code">#${escapeHtml(p.code || '-')}</span>
        </td>
        <td>
          <strong style="color: #242220;">${escapeHtml(p.title || '')}</strong>
          ${p.price ? `<div style="font-size: 12px; color: #554E48; font-weight: 600;">${escapeHtml(p.price)}</div>` : ''}
        </td>
        <td>${escapeHtml(p.category || 'Geral')}</td>
        <td>${tag}</td>
        <td>
          <a href="${escapeHtml(p.link)}" target="_blank" style="color: #8E5D47; text-decoration: none; font-size: 12px; font-weight: 600;">
            Link <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px;"></i>
          </a>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="editProduct('${p.id}')" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon delete" onclick="deleteProduct('${p.id}', '${escapeHtml(p.code)}')" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- Filtros da Tabela ---
function setupFilterEvents() {
  const searchInput = document.getElementById('searchTable');
  const catFilter = document.getElementById('filterCategory');

  if (searchInput) searchInput.addEventListener('input', () => renderProductsTable());
  if (catFilter) catFilter.addEventListener('change', () => renderProductsTable());
}

// --- Backup & Exportação ---
function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `achadinhos_mariana_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup baixado com sucesso!');
}

// --- Toast de Notificação ---
function showToast(message) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(message)}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
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
