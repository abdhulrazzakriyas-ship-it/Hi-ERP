function renderLabels(){
if(!selectedProductCode && DB.products.length) selectedProductCode = DB.products[0].code;
const pOpts = DB.products.map(p=>`<option value="${esc(p.code)}" ${p.code===selectedProductCode?'selected':''}>${esc(p.code)} - ${esc(p.name)}</option>`).join('');
const product = productByCode(selectedProductCode);

let labelHtmls = '';
if(product){
for(let i=0; i<labelQty; i++){
labelHtmls += `
<div class="label label-${labelSize}">
<div class="label-name">${esc(product.name)}</div>
<div>${renderBarcodeSVG(product.barcode||product.code, 1, 24)}</div>
<div class="label-sku">SKU: ${esc(product.code)}</div>
<div class="label-price">Rs ${fmt(product.sellingPrice)}</div>
</div>
`;
}
}

const s = DB.settings || {};
return `
<header id="top-bar">
<div class="top-bar-title">Barcode &amp; QR Labels</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<div style="margin-bottom:18px;display:flex;justify-content:flex-end;">
<button class="btn-primary" onclick="printLabels()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
&#x1F5A8;&#xFE0F; Print Label Sheet
</button>
</div>
<div class="card" style="margin-bottom:18px;">
<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
<div style="flex:2;min-width:240px;">
<label style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Select Product</label>
<select onchange="selectedProductCode=this.value; render();" style="width:100%;padding:9px;border-radius:7px;border:1px solid var(--border-strong);margin-top:4px;">${pOpts}</select>
</div>
<div style="flex:1;min-width:120px;">
<label style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Label Size</label>
<select onchange="labelSize=this.value; render();" style="width:100%;padding:9px;border-radius:7px;border:1px solid var(--border-strong);margin-top:4px;">
<option value="small" ${labelSize==='small'?'selected':''}>Small (150px)</option>
<option value="medium" ${labelSize==='medium'?'selected':''}>Medium (220px)</option>
<option value="large" ${labelSize==='large'?'selected':''}>Large (300px)</option>
</select>
</div>
<div style="flex:1;min-width:100px;">
<label style="font-size:.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;">Quantity</label>
<input type="number" min="1" max="100" value="${labelQty}" onchange="labelQty=parseInt(this.value)||1; render();" style="width:100%;padding:9px;border-radius:7px;border:1px solid var(--border-strong);margin-top:4px;">
</div>
</div>
</div>
<div class="card">
<h3>Sheet Preview</h3>
<div class="label-sheet" id="labelPreviewSheet">${labelHtmls||'<p>Select a product to view labels.</p>'}</div>
</div>
`;
}
function printLabels(){
const sheet = document.getElementById('labelPreviewSheet');
if(!sheet) return;
const printArea = document.getElementById('print-area');
printArea.innerHTML = `<div class="print-page"><div class="label-sheet">${sheet.innerHTML}</div></div>`;
window.print();
}

// ============================================================
// QUOTATIONS (EXACT SCREENSHOT REDESIGN)
// ============================================================
quotationSearchFilter = '';
currentQuoteFormItems = [];

