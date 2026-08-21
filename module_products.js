// ============================================================
// PRODUCTS (PRODUCT MASTER REDESIGN)
// ============================================================
productSearchFilter = '';
currentProductImageBase64 = '';

function handleProductImageUpload(input){
const file = input.files[0];
if(!file) return;
if(file.size > 2 * 1024 * 1024){ alert('Product image size must be less than 2MB.'); return; }
const reader = new FileReader();
reader.onload = function(e){
currentProductImageBase64 = e.target.result;
const prevContainer = document.getElementById('productImagePreviewFrame');
if(prevContainer){
prevContainer.innerHTML = `<img src="${currentProductImageBase64}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1px solid var(--border-strong);">`;
}
};
reader.readAsDataURL(file);
}

function removeProductImage(){
currentProductImageBase64 = '';
const prevContainer = document.getElementById('productImagePreviewFrame');
if(prevContainer){
prevContainer.innerHTML = `<div style="width:70px;height:70px;background:var(--paper);border:1px dashed var(--border-strong);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
}
}

function renderProducts(){
const s = DB.settings || {};
const q = productSearchFilter.toLowerCase();
const filtered = q ? DB.products.filter(function(p){
return (p.code&&p.code.toLowerCase().indexOf(q)>=0) || (p.name&&p.name.toLowerCase().indexOf(q)>=0) || (p.barcode&&p.barcode.toLowerCase().indexOf(q)>=0) || (p.category&&p.category.toLowerCase().indexOf(q)>=0);
}) : DB.products;

const rows = filtered.map(p=>{
const imgHtml = p.image ? `<img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">` : `<div style="width:40px;height:40px;background:var(--paper);border:1px solid var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--muted);margin:0 auto;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

return `
<tr>
<td style="width:50px;text-align:center;">${imgHtml}</td>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(p.code)}</strong></td>
<td><strong>${esc(p.name)}</strong><br><small style="color:var(--muted);">${esc(p.brand||'Generic')}</small></td>
<td style="font-family:var(--font-mono);">${esc(p.barcode||'\u2014')}</td>
<td>${esc(p.category)}</td>
<td style="font-family:var(--font-mono);">&#165;${fmt(p.purchasePriceRMB)}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(p.avgLandedCost)}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(p.sellingPrice)}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(p.wholesalePrice)}</td>
<td><span class="badge ${p.stock<p.minStock?'badge-low':'badge-ok'}">${p.stock} ${esc(p.unit||'Pcs')}</span></td>
<td><span class="badge ${p.status==='Active'?'badge-ok':'badge-pending'}">${esc(p.status)}</span></td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;" onclick="openProductForm('${esc(p.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" onclick="deleteProduct('${esc(p.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Product Master</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<div style="margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
<div style="position:relative;flex:1;max-width:480px;">
<svg style="position:absolute;left:14px;top:12px;color:var(--muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
<input type="text" id="prod-search-input" placeholder="Search by SKU, Name, Barcode..." value="${esc(productSearchFilter)}" oninput="productSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openProductForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ New Product
</button>
</div>

<div style="background:rgba(0,136,255,.12);border:1px solid rgba(0,136,255,.3);color:var(--harbor);padding:12px 18px;border-radius:10px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
<div>
<strong style="font-size:.85rem;letter-spacing:.03em;text-transform:uppercase;">BARCODE SCANNER / KEYBOARD EMULATOR</strong>
<div style="font-size:.76rem;color:var(--text);margin-top:2px;">Ready for USB barcode scanners or keyboard emulation</div>
</div>
</div>

<div class="card">
<h3 style="margin-bottom:16px;">Product Catalog</h3>
<table>
<thead>
<tr>
<th style="text-align:center;">IMAGE</th>
<th>SKU</th>
<th>PRODUCT NAME</th>
<th>BARCODE</th>
<th>CATEGORY</th>
<th>COST (RMB)</th>
<th>LANDED COST (LKR)</th>
<th>SELLING PRICE</th>
<th>WHOLESALE PRICE</th>
<th>STOCK</th>
<th>STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:30px;">No products found matching search filter.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openProductForm(code){
const p = code ? productByCode(code) : null;
currentProductImageBase64 = p ? (p.image || '') : '';
const cats = ['Stationery','Hardware','Household','General Merchandise','Electronics','Textiles'];
const supplierOptions = DB.suppliers.map(s=>`<option value="${esc(s.code)}" ${p&&p.supplierCode===s.code?'selected':''}>${esc(s.name)}</option>`).join('');

const imgFrame = currentProductImageBase64 ?
`<img src="${currentProductImageBase64}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1px solid var(--border-strong);">` :
`<div style="width:70px;height:70px;background:var(--paper);border:1px dashed var(--border-strong);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

openModal(`
<h3>${p?'Edit':'New'} Product Master</h3>
<form onsubmit="saveProduct(event,'${code?esc(code):''}')">

<!-- IMAGE UPLOAD CONTAINER -->
<div style="background:var(--paper);border:1px solid var(--border-strong);padding:14px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;gap:16px;">
<div id="productImagePreviewFrame">${imgFrame}</div>
<div>
<label style="margin-top:0;display:block;margin-bottom:6px;">Product Image</label>
<div style="display:flex;gap:8px;flex-wrap:wrap;">
<label class="btn-primary" style="width:auto;margin:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-size:.8rem;">
Choose Image
<input type="file" accept="image/*" style="display:none;" onchange="handleProductImageUpload(this)">
</label>
<button type="button" class="btn-secondary" style="padding:6px 12px;font-size:.8rem;" onclick="removeProductImage()">Remove</button>
</div>
<div style="font-size:.72rem;color:var(--muted);margin-top:4px;">PNG, JPG, SVG or WebP (Max 2MB)</div>
</div>
</div>

<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
<div>
<label>Product Name</label>
<input required name="name" value="${p?esc(p.name):''}" placeholder="e.g. 902 - 60 HB Eraser">
</div>
<div>
<label>Category</label>
<select name="category">${cats.map(c=>'<option '+(p&&p.category===c?'selected':'')+'>'+c+'</option>').join('')}</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Brand Name</label>
<input name="brand" value="${p?esc(p.brand):'Generic'}" placeholder="e.g. Deli / M&amp;G">
</div>
<div>
<label>Unit of Measure</label>
<input name="unit" value="${p?esc(p.unit):'pcs'}" placeholder="pcs, box, set, kg...">
</div>
</div>

<label>Barcode / SKU Identification</label>
<div style="display:flex;gap:6px;">
<input name="barcode" id="pfBarcode" value="${p?esc(p.barcode):''}" style="flex:1;" placeholder="e.g. 6936096902604" oninput="document.getElementById('pfBarcodePreview').innerHTML=this.value?renderBarcodeSVG(this.value,1,26):''">
<select id="pfBarcodeFormat" style="flex:0 0 auto;width:auto;"><option value="code128">Code128</option><option value="ean13">EAN-13</option></select>
<button type="button" class="btn-secondary" style="white-space:nowrap;" onclick="document.getElementById('pfBarcode').value=generateUniqueBarcode(document.getElementById('pfBarcodeFormat').value);document.getElementById('pfBarcode').dispatchEvent(new Event('input'))">Generate</button>
</div>
<div id="pfBarcodePreview" style="margin-top:6px;">${p&&p.barcode?renderBarcodeSVG(p.barcode,1,26):''}</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:10px;">
<div>
<label>Purchase Price (RMB)</label>
<input type="number" step="0.01" name="purchasePriceRMB" value="${p?p.purchasePriceRMB:''}" placeholder="�0.00">
</div>
<div>
<label>Selling Price - Retail (LKR)</label>
<input type="number" step="0.01" name="sellingPrice" value="${p?p.sellingPrice:''}" placeholder="Rs 0.00">
</div>
<div>
<label>Wholesale Price (LKR)</label>
<input type="number" step="0.01" name="wholesalePrice" value="${p?p.wholesalePrice:''}" placeholder="Rs 0.00">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:10px;">
<div>
<label>Minimum Stock Alert</label>
<input type="number" name="minStock" value="${p?p.minStock:0}">
</div>
<div>
<label>Primary Supplier</label>
<select name="supplierCode"><option value="">-- none --</option>${supplierOptions}</select>
</div>
<div>
<label>Status</label>
<select name="status"><option ${!p||p.status==='Active'?'selected':''}>Active</option><option ${p&&p.status==='Inactive'?'selected':''}>Inactive</option></select>
</div>
</div>

<div class="modal-actions" style="margin-top:24px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Product</button>
</div>
</form>
`);
}

function saveProduct(e, code){
e.preventDefault();
const f = e.target;
const barcode = f.barcode.value.trim();
if(barcode){
const dup = DB.products.find(function(x){ return x.barcode===barcode && x.code!==code; });
if(dup){ alert('That barcode is already used by "'+dup.name+'" ('+dup.code+').'); return; }
}
const data = {
image: currentProductImageBase64 || '',
name: f.name.value,
category: f.category.value,
brand: f.brand.value,
unit: f.unit.value,
barcode: barcode,
purchasePriceRMB: parseFloat(f.purchasePriceRMB.value)||0,
sellingPrice: parseFloat(f.sellingPrice.value)||0,
wholesalePrice: parseFloat(f.wholesalePrice.value)||0,
minStock: parseInt(f.minStock.value)||0,
supplierCode: f.supplierCode.value,
status: f.status.value
};
if(code){
Object.assign(productByCode(code), data);
} else {
DB.products.push(Object.assign({ code:nextCode('PRD-','product'), stock:0, avgLandedCost:0 }, data));
}
saveDB();
closeModal();
render();
}
function deleteProduct(code){
const p = productByCode(code);
if(!p) return;
if(!confirm('Delete product "'+p.name+'"? This cannot be undone.')) return;
DB.products = DB.products.filter(x=>x.code!==code);
saveDB(); render();
}

// ============================================================
// SUPPLIERS (EXACT SCREENSHOT REDESIGN)
// ============================================================
supplierSearchFilter = '';

function supplierTotalPaidLKR(supplierCode){
const fxRate = (DB.settings && DB.settings.fxRate) || 40;
const pmts = DB.supplierPayments ? DB.supplierPayments.filter(p=>p.supplierCode===supplierCode) : [];
const totalRMB = pmts.reduce((sum,p)=>sum+(p.amountRMB||0),0);
return totalRMB * fxRate;
}

function openSupplierLedgerModal(supplierCode){
const sup = supplierByCode(supplierCode);
if(!sup) return;
const fxRate = (DB.settings && DB.settings.fxRate) || 40;
const balanceRMB = supplierOutstandingBalance(supplierCode);
const balanceLKR = balanceRMB * fxRate;
const totalPaidLKR = supplierTotalPaidLKR(supplierCode);
const purchases = DB.purchases.filter(p=>p.supplierCode===supplierCode);
const payments = DB.supplierPayments ? DB.supplierPayments.filter(p=>p.supplierCode===supplierCode) : [];

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
<div>
<h3 style="margin:0;">Supplier Statement &amp; Ledger: ${esc(sup.name)}</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Code: <strong>${esc(sup.code)}</strong> | Location: ${esc(sup.city||'')}, ${esc(sup.country||'')}</p>
</div>
<button class="btn-primary" onclick="openSupplierPaymentForm('${esc(sup.code)}')">+ Record Payment</button>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
<div style="background:var(--paper);padding:12px;border-radius:8px;border:1px solid var(--border);">
<div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;">Contact Info</div>
<div style="font-weight:600;margin-top:2px;">${esc(sup.contactPerson||'-')}</div>
<div style="font-size:.78rem;color:var(--muted);">${esc(sup.mobile||'')} ${esc(sup.email||'')}</div>
</div>
<div style="background:var(--paper);padding:12px;border-radius:8px;border:1px solid var(--border);">
<div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;">Total Paid</div>
<div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:var(--green);margin-top:2px;">LKR ${fmt(totalPaidLKR)}</div>
<div style="font-size:.74rem;color:var(--muted);">(&#165;${fmt(totalPaidLKR/fxRate)})</div>
</div>
<div style="background:var(--paper);padding:12px;border-radius:8px;border:1px solid var(--border);">
<div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;">Outstanding Payable</div>
<div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:${balanceLKR>0?'var(--red)':'var(--ink)'};margin-top:2px;">LKR ${fmt(balanceLKR)}</div>
<div style="font-size:.74rem;color:var(--muted);">(&#165;${fmt(balanceRMB)})</div>
</div>
</div>

<h4 style="margin:14px 0 8px;">Purchase Orders (${purchases.length})</h4>
<table>
<thead><tr><th>PO REF</th><th>DATE</th><th>STATUS</th><th>AMOUNT (RMB)</th><th>PAID (RMB)</th></tr></thead>
<tbody>
${purchases.length ? purchases.map(p=>'<tr><td><strong>'+esc(p.purchaseNo)+'</strong></td><td>'+esc(p.date)+'</td><td><span class="badge '+(p.status==='Received'?'badge-ok':'badge-pending')+'">'+esc(p.status)+'</span></td><td style="font-family:var(--font-mono);">&#165;'+fmt(p.amountRMB||0)+'</td><td style="font-family:var(--font-mono);color:var(--green);">&#165;'+fmt(p.amountPaidRMB||0)+'</td></tr>').join('') : '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:16px;">No purchases recorded yet.</td></tr>'}
</tbody>
</table>

<h4 style="margin:14px 0 8px;">Payment History (${payments.length})</h4>
<table>
<thead><tr><th>DATE</th><th>METHOD</th><th>REFERENCE</th><th>AMOUNT (RMB)</th><th>AMOUNT (LKR)</th></tr></thead>
<tbody>
${payments.length ? payments.map(pm=>'<tr><td>'+esc(pm.date)+'</td><td>'+esc(pm.method)+'</td><td>'+esc(pm.refNo||'\u2014')+'</td><td style="font-family:var(--font-mono);color:var(--green);">&#165;'+fmt(pm.amountRMB)+'</td><td style="font-family:var(--font-mono);color:var(--green);">LKR '+fmt(pm.amountRMB*fxRate)+'</td></tr>').join('') : '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:16px;">No payment records found.</td></tr>'}
</tbody>
</table>

<div class="modal-actions" style="margin-top:20px;">
<button class="btn-secondary" onclick="closeModal()">Close</button>
</div>
`);
}

