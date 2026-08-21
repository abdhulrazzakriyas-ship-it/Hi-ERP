function renderInventory(){
const s = DB.settings || {};
const rows = DB.products.map(p=>{
const totalVal = p.stock * p.avgLandedCost;
return `<tr>
<td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td>
<td><strong>${p.stock}</strong> ${esc(p.unit)}</td><td>${p.minStock}</td>
<td>${p.stock<p.minStock?'<span class="badge badge-low">LOW STOCK</span>':'<span class="badge badge-ok">OK</span>'}</td>
<td>Rs ${fmt(p.avgLandedCost)}</td><td>Rs ${fmt(totalVal)}</td>
<td><button class="btn-link" onclick="openStockAdjustForm('${esc(p.code)}')">Adjust Stock</button></td>
</tr>`;
}).join('');

const ledgerRows = DB.stockLedger.slice(-15).reverse().map(l=>{
const p = productByCode(l.productCode);
return `<tr>
<td>${l.date.slice(0,10)}</td><td>${esc(p?p.name:l.productCode)}</td>
<td><span class="badge ${l.type==='IN'?'badge-ok':'badge-low'}">${esc(l.type)}</span></td>
<td>${l.qty}</td><td>Rs ${fmt(l.unitCost||0)}</td><td>${esc(l.refType)} (${esc(l.refNo)})</td>
</tr>`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Inventory &amp; Stock Ledger</div>
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
<button class="btn-primary" onclick="openStockAdjustForm()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Manual Stock Adjustment
</button>
</div>
<div class="card" style="margin-bottom:20px;">
<h3>Current Stock Levels</h3>
<table>
<thead><tr><th>SKU</th><th>Product Name</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Status</th><th>Avg Landed Cost</th><th>Stock Value</th><th>Action</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</div>
<div class="card">
<h3>Recent Stock Movements Ledger</h3>
<table>
<thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Unit Cost</th><th>Reference</th></tr></thead>
<tbody>${ledgerRows||'<tr><td colspan="6">No stock movements logged.</td></tr>'}</tbody>
</table>
</div>
`;
}

function openStockAdjustForm(productCode){
const pOpts = DB.products.map(p=>`<option value="${esc(p.code)}" ${p.code===productCode?'selected':''}>${esc(p.code)} - ${esc(p.name)} (Current: ${p.stock})</option>`).join('');
openModal(`
<h3>Manual Stock Adjustment</h3>
<form onsubmit="saveStockAdjust(event)">
<label>Product</label><select name="productCode" required>${pOpts}</select>
<label>Adjustment Type</label><select name="type"><option value="IN">Stock IN (Receive / Found)</option><option value="OUT">Stock OUT (Damaged / Missing / Adjustment)</option></select>
<label>Quantity</label><input type="number" min="1" required name="qty" value="10">
<label>Reason / Remarks</label><input name="remarks" placeholder="Stock count discrepancy, damaged item, etc.">
<div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn-primary">Apply Adjustment</button></div>
</form>
`);
}
function saveStockAdjust(e){
e.preventDefault();
const f = e.target;
const pCode = f.productCode.value;
const p = productByCode(pCode);
if(!p) return;
const type = f.type.value;
const qty = parseInt(f.qty.value)||0;
if(type==='IN') p.stock += qty;
else p.stock = Math.max(0, p.stock - qty);

DB.stockLedger.push({
id: uid('SL-'), date: new Date().toISOString(), productCode: pCode, type: type, qty: qty, unitCost: p.avgLandedCost, refType: 'manual_adjust', refNo: f.remarks.value||'manual'
});
saveDB(); closeModal(); render();
}

// ============================================================
// LABELS (Barcode & QR Code Printing)
// ============================================================
labelQty = 12, labelSize = 'medium', selectedProductCode = '';
