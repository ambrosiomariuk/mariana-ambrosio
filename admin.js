// Admin de Achadinhos — GitHub Pages
const ADMIN_PASS = 'mariana2026';
let products = [], currentEditId = null, currentImageDataUrl = null;

document.addEventListener('DOMContentLoaded', () => { checkAuth(); initAdmin(); });

function checkAuth() {
  const el = document.getElementById('authOverlay');
  if (el) el.style.display = sessionStorage.getItem('mari_admin_logged') === 'true' ? 'none' : 'flex';
}
function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById('authPassword'), err = document.getElementById('authError');
  if (input.value.trim() === ADMIN_PASS) {
    sessionStorage.setItem('mari_admin_logged','true'); document.getElementById('authOverlay').style.display='none'; showToast('Login realizado!');
  } else { err.style.display='block'; input.value=''; input.focus(); }
}
function handleLogout(){ sessionStorage.removeItem('mari_admin_logged'); location.reload(); }

async function initAdmin(){
  setupUploadDropzone(); setupFormEvents(); setupFilterEvents();
  try {
    const r = await fetch(`./products.json?v=${Date.now()}`, {cache:'no-store'});
    if (!r.ok) throw new Error('products.json não encontrado');
    const published = await r.json();
    products = Array.isArray(published) ? published : [];
    persist();
  } catch(e) {
    const cached = localStorage.getItem('mari_products');
    if (cached) { try { products = JSON.parse(cached); } catch(err) { products = []; } }
  }
  if (!Array.isArray(products)) products=[];
  refresh();
}

function persist(){ localStorage.setItem('mari_products',JSON.stringify(products)); }
function refresh(){ products.sort((a,b)=>(parseInt(b.code)||0)-(parseInt(a.code)||0)); updateStats(); updateCategoryDropdowns(); renderProductsTable(); suggestNextCode(); }

function updateStats(){
  document.getElementById('statTotal').textContent=products.length;
  document.getElementById('statCategories').textContent=new Set(products.map(p=>p.category).filter(Boolean)).size;
  document.getElementById('statFeatured').textContent=products.filter(p=>p.featured).length;
}
function updateCategoryDropdowns(){
  const f=document.getElementById('productCategory'), t=document.getElementById('filterCategory');
  const s=new Set(['Casa & Decoração','Cozinha','Beleza & Cuidados','Tecnologia','Organização','Moda & Acessórios']);
  products.forEach(p=>{if(p.category)s.add(p.category.trim())}); const cats=[...s].sort();
  if(f){const cur=f.value; f.innerHTML='<option value="">Selecione uma categoria...</option>'+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')+'<option value="__NEW__">+ Nova Categoria...</option>'; if(cats.includes(cur))f.value=cur;}
  if(t){const cur=t.value||'ALL'; t.innerHTML='<option value="ALL">Todas as Categorias</option>'+cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(''); if(cur==='ALL'||cats.includes(cur))t.value=cur;}
}
function setupUploadDropzone(){
  const d=document.getElementById('uploadDropzone'), f=document.getElementById('fileInput'); if(!d||!f)return;
  d.addEventListener('click',()=>f.click()); d.addEventListener('dragover',e=>e.preventDefault());
  d.addEventListener('drop',e=>{e.preventDefault();if(e.dataTransfer.files[0])handleFileSelected(e.dataTransfer.files[0])});
  f.addEventListener('change',e=>{if(e.target.files[0])handleFileSelected(e.target.files[0])});
}
function compressImage(file,max=600,q=.8){return new Promise(resolve=>{const r=new FileReader();r.onload=e=>{const im=new Image();im.onload=()=>{let w=im.width,h=im.height;if(w>max||h>max){if(w>h){h=Math.round(h*max/w);w=max}else{w=Math.round(w*max/h);h=max}}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);resolve(c.toDataURL('image/jpeg',q))};im.src=e.target.result};r.readAsDataURL(file)})}
async function handleFileSelected(file){
  if(!file.type.startsWith('image/'))return alert('Selecione uma imagem válida.');
  currentImageDataUrl=await compressImage(file); const im=document.getElementById('previewImg'), ph=document.getElementById('uploadPlaceholder');
  im.src=currentImageDataUrl; im.style.display='block'; ph.style.display='none';
}
function resetImageUpload(url=null){
  currentImageDataUrl=null; const im=document.getElementById('previewImg'),ph=document.getElementById('uploadPlaceholder'),fi=document.getElementById('fileInput'); if(fi)fi.value='';
  if(url){im.src=url;im.style.display='block';ph.style.display='none'}else{im.src='';im.style.display='none';ph.style.display='flex'}
}
function suggestNextCode(){const i=document.getElementById('productCode');if(!i||currentEditId)return;const m=products.reduce((x,p)=>Math.max(x,parseInt(p.code)||0),0);i.value=String(m?m+1:222)}
function setupFormEvents(){
  const form=document.getElementById('productForm'),cat=document.getElementById('productCategory'),cancel=document.getElementById('btnCancelEdit');
  cat.addEventListener('change',e=>{if(e.target.value==='__NEW__'){const n=prompt('Digite o nome da nova categoria:');if(n&&n.trim()){const o=document.createElement('option');o.value=o.textContent=n.trim();o.selected=true;cat.insertBefore(o,cat.lastElementChild)}else cat.value=''}});
  cancel.addEventListener('click',resetForm); form.addEventListener('submit',e=>{e.preventDefault();saveProduct()});
}
function saveProduct(){
  const v=id=>document.getElementById(id).value.trim(), code=v('productCode'),title=v('productTitle'),link=v('productLink');
  if(!code||!title||!link)return alert('Preencha código, título e link.');
  const old=currentEditId?products.find(p=>p.id===currentEditId):null;
  const p={id:currentEditId||'prod_'+Date.now(),code,title,category:v('productCategory')||'Geral',price:v('productPrice'),tag:v('productTag'),link,image:currentImageDataUrl||(old&&old.image)||'',featured:document.getElementById('productFeatured').checked,createdAt:(old&&old.createdAt)||new Date().toISOString()};
  if(currentEditId){const x=products.findIndex(a=>a.id===currentEditId);if(x>=0)products[x]=p}else products.unshift(p);
  persist(); showToast('Achadinho salvo.'); resetForm(); refresh();
}
function resetForm(){currentEditId=null;document.getElementById('productForm').reset();resetImageUpload();document.getElementById('formTitle').innerHTML='<i class="fa-solid fa-plus-circle"></i> Cadastrar Novo Achadinho';document.getElementById('btnSaveProduct').innerHTML='<i class="fa-solid fa-floppy-disk"></i> Salvar Achadinho';document.getElementById('btnCancelEdit').style.display='none';suggestNextCode()}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;currentEditId=id;[['productCode','code'],['productTitle','title'],['productCategory','category'],['productPrice','price'],['productTag','tag'],['productLink','link']].forEach(([a,b])=>document.getElementById(a).value=p[b]||'');document.getElementById('productFeatured').checked=!!p.featured;resetImageUpload(p.image);document.getElementById('formTitle').textContent=`Editando Achadinho #${p.code}`;document.getElementById('btnCancelEdit').style.display='inline-flex';scrollTo({top:150,behavior:'smooth'})}
function deleteProduct(id,code){if(!confirm(`Excluir achadinho #${code}?`))return;products=products.filter(p=>p.id!==id);persist();refresh();showToast('Achadinho excluído.')}
function renderProductsTable(){
  const tb=document.getElementById('productsTableBody'),q=(document.getElementById('searchTable').value||'').toLowerCase(),cat=document.getElementById('filterCategory').value;
  const a=products.filter(p=>(cat==='ALL'||p.category===cat)&&(!q||[p.code,p.title,p.category].some(v=>(v||'').toString().toLowerCase().includes(q))));
  tb.innerHTML=a.length?a.map(p=>`<tr><td><img src="${escapeHtml(p.image||'')}" class="table-thumb"></td><td><span class="table-code">#${escapeHtml(p.code)}</span></td><td><strong>${escapeHtml(p.title)}</strong>${p.price?`<div>${escapeHtml(p.price)}</div>`:''}</td><td>${escapeHtml(p.category||'Geral')}</td><td>${escapeHtml(p.tag||'-')}</td><td><a href="${escapeHtml(p.link)}" target="_blank" rel="noopener">Link ↗</a></td><td><div class="table-actions"><button class="btn-icon" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen-to-square"></i></button><button class="btn-icon delete" onclick="deleteProduct('${p.id}','${escapeHtml(p.code)}')"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:40px">Nenhum achadinho.</td></tr>';
}
function setupFilterEvents(){document.getElementById('searchTable').addEventListener('input',renderProductsTable);document.getElementById('filterCategory').addEventListener('change',renderProductsTable)}
function exportProductsJson(){
  const b=new Blob([JSON.stringify(products,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='products.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);showToast('products.json baixado. Substitua-o no GitHub.');
}
function exportBackup(){exportProductsJson()}
function showToast(m){const t=document.getElementById('adminToast');t.innerHTML=`<i class="fa-solid fa-circle-check"></i> <span>${escapeHtml(m)}</span>`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
function escapeHtml(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
