export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.VC_API_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.TEAM_ID;

  if (!token || !edgeConfigId) {
    return res.status(500).json({ error: 'Configuração de banco na nuvem ausente.' });
  }

  const readUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/item/products?teamId=${teamId}`;
  const patchUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items?teamId=${teamId}`;

  async function getProducts() {
    try {
      const response = await fetch(readUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data.value) ? data.value : [];
      }
    } catch (e) {
      console.error('Erro ao ler Edge Config:', e);
    }
    return [];
  }

  async function saveProducts(products) {
    try {
      const response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'products',
              value: products
            }
          ]
        })
      });
      return response.ok;
    } catch (e) {
      console.error('Erro ao salvar no Edge Config:', e);
      return false;
    }
  }

  if (req.method === 'GET') {
    const products = await getProducts();
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    body = body || {};

    let products = await getProducts();

    if (body.id && body.id.trim() !== '') {
      const idx = products.findIndex(p => p.id === body.id);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...body };
      } else {
        products.unshift(body);
      }
    } else {
      body.id = `prod_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
      body.createdAt = new Date().toISOString();
      products.unshift(body);
    }

    const success = await saveProducts(products);
    if (success) {
      return res.status(200).json({ success: true, product: body });
    } else {
      return res.status(500).json({ success: false, error: 'Falha ao gravar no banco na nuvem.' });
    }
  }

  if (req.method === 'DELETE') {
    let id = req.query.id;
    if (!id && req.body) {
      let b = req.body;
      if (typeof b === 'string') {
        try { b = JSON.parse(b); } catch (e) {}
      }
      id = b.id;
    }

    let products = await getProducts();
    products = products.filter(p => p.id !== id);
    const success = await saveProducts(products);
    return res.status(200).json({ success: success });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
