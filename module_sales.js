function renderSales(){
const s = DB.settings || {};
const dateStr = todayStr();

const now = new Date();
let hours = now.getHours();
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');
const ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12 || 12;
const timeStr = `${String(hours).padStart(2,'0')}:${minutes}:${seconds} ${ampm}`;

const custOpts = '<option value="">-- Walk-in Cash Customer --</option>' + DB.customers.map(c=>`<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.phone||'No Phone')})</option>`).join('');
const productOptions = DB.products.filter(p=>p.status==='Active').map(p=>`<option value="${esc(p.code)}" data-price="${p.sellingPrice||0}" data-wprice="${p.wholesalePrice||0}">${esc(p.code)} - ${esc(p.name)} (Stock: ${p.stock})</option>`).join('');

const subtotal = activeSalesCartItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
const grandTotal = Math.max(0, subtotal - salesRegisterDiscount);

const rows = DB.sales.map(sal=>{
const cust = customerByCode(sal.customerCode);
const items = DB.saleItems.filter(i=>i.saleNo===sal.saleNo);
const total = items.reduce((t,i)=>t+i.qty*i.unitPrice,0);
const paid = sal.amountPaid || total;
const isPaid = paid >= total;

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(sal.saleNo)}</strong></td>
<td><strong>${esc(cust?cust.name:'-- Walk-in Cash Customer --')}</strong></td>
<td style="font-size:.84rem;">${esc(sal.date)} ${esc(sal.time||'')}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(sal.grandTotal || total)}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(paid)}</td>
<td><span class="badge ${isPaid?'badge-ok':'badge-pending'}">${isPaid?'Paid':'Partial'}</span></td>
<td><span class="badge badge-ok">Dispatched</span></td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Print Receipt / Invoice" onclick="printDocument('sale','${esc(sal.saleNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Invoice" onclick="deleteSale('${esc(sal.saleNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Sales Register</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal('sale')">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<!-- TOP NOTIFICATION BANNER -->
<div style="background:rgba(0,136,255,.12);border:1px solid rgba(0,136,255,.3);color:var(--harbor);padding:10px 16px;border-radius:10px;margin-bottom:18px;font-size:.84rem;font-weight:700;display:flex;align-items:center;gap:10px;">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
<span>? SCAN-TO-CART SIMULATOR (CLICK ITEM BELOW TO SCAN OR USE USB GUN / CAMERA)</span>
</div>

<!-- MAIN SPLIT GRID -->
<form onsubmit="saveSalesRegisterInvoice(event)">
<div style="display:grid;grid-template-columns:2.2fr 1fr;gap:18px;margin-bottom:24px;">

<!-- LEFT COLUMN: NEW SALES REGISTER VOUCHERS -->
<div class="card" style="margin:0;">
<h3 style="margin:0 0 16px;font-size:1.05rem;">New Sales Register Vouchers</h3>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
<div>
<label>Sale Type</label>
<select name="customerType" id="srSaleType" onchange="salesRegisterTypeChanged(this.value)">
<option value="Retail">Retail Sale</option>
<option value="Wholesale">Wholesale Sale</option>
</select>
</div>
<div>
<label>Customer Account</label>
<select name="customerCode">${custOpts}</select>
</div>
<div>
<label>Posting Date</label>
<input type="date" name="date" required value="${dateStr}">
</div>
</div>

<!-- BARCODE & SKU SEARCH BAR -->
<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:14px;margin-bottom:16px;">
<label style="margin:0 0 6px;display:flex;align-items:center;gap:6px;">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
<span>Scan Barcode / Search Product SKU</span>
</label>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
<input type="text" id="sale-barcode-input" placeholder="⚡ Barcode Gun Input (Scan here)..." style="flex:1.5;min-width:200px;font-family:var(--font-mono);font-size:0.95rem;font-weight:700;margin:0;" onkeydown="if(event.key==='Enter'){ event.preventDefault(); routeScannedBarcode(this.value, 'sales_gun'); this.value=''; }">
<select id="srSelProduct" style="flex:2;min-width:200px;margin:0;" onchange="salesRegisterProductSelected(this)">
<option value="">Or select product from catalog...</option>
${productOptions}
</select>
<div style="width:90px;">
<label style="margin:0 0 2px;font-size:.7rem;">Quantity</label>
<input type="number" id="srSelQty" value="1" min="1" style="margin:0;">
</div>
<input type="hidden" id="srSelPrice" value="0">
<button type="button" class="btn-primary" style="padding:10px 18px;font-weight:700;white-space:nowrap;margin-top:14px;" onclick="addSalesRegisterCartItem()">+ Add to Invoice</button>
<button type="button" class="btn-secondary" style="padding:10px 14px;white-space:nowrap;margin-top:14px;" onclick="openScanModal('sale')">\uD83D\uDCF7 Camera</button>
</div>
</div>

<!-- CART ITEMS TABLE -->
<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:14px;min-height:180px;">
<h4 style="margin:0 0 10px;">Cart items</h4>
<table>
<thead>
<tr>
<th>PRODUCT</th>
<th style="width:80px;">QTY</th>
<th style="width:120px;">UNIT PRICE (LKR)</th>
<th style="width:130px;">TOTAL (LKR)</th>
<th style="width:70px;text-align:right;">ACTION</th>
</tr>
</thead>
<tbody id="srCartItemsTableBody">
${renderSalesCartTableRowsHtml()}
</tbody>
</table>
</div>
</div>

<!-- RIGHT COLUMN: CHECKOUT SUMMARIES -->
<div class="card" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;">
<div>
<h3 style="margin:0 0 16px;font-size:1.05rem;">Checkout Summaries</h3>

<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px dashed var(--border);">
<span style="font-weight:600;color:var(--muted);">Cart Subtotal:</span>
<strong id="srTextSubtotal" style="font-family:var(--font-mono);font-size:1.1rem;">${fmt(subtotal)} LKR</strong>
</div>

<div style="margin:12px 0;">
<label>Discount (LKR)</label>
<input type="number" step="0.01" name="discount" id="srInputDiscount" value="${salesRegisterDiscount}" placeholder="0" oninput="salesRegisterDiscount=parseFloat(this.value)||0; updateSalesCheckoutSummary();" style="font-family:var(--font-mono);font-weight:700;">
</div>

<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:2px solid var(--border-strong);border-bottom:2px solid var(--border-strong);margin:14px 0;">
<span style="font-weight:800;font-size:1.1rem;">Grand Total:</span>
<strong id="srTextGrandTotal" style="font-family:var(--font-mono);font-size:1.35rem;color:var(--harbor);">${fmt(grandTotal)} LKR</strong>
</div>

<div style="margin-bottom:12px;">
<label>Amount Paid (LKR)</label>
<input type="number" step="0.01" name="amountPaid" id="srInputPaid" value="${grandTotal}" placeholder="0.00" style="font-family:var(--font-mono);font-weight:700;">
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
<div>
<label>Invoice Date *</label>
<input type="date" required name="invDate" value="${dateStr}">
</div>
<div>
<label>Invoice Time (12-Hour) *</label>
<input type="text" required name="invTime" value="${timeStr}">
</div>
</div>

<div>
<label>Voucher Notes</label>
<textarea name="notes" rows="3" placeholder="Private internal note..."></textarea>
</div>
</div>

<div style="margin-top:20px;">
<button type="submit" class="btn-primary" style="width:100%;padding:14px;font-size:1.05rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(0,136,255,.4);">
� Complete &amp; Print Invoice
</button>
</div>
</div>

</div>
</form>

<!-- BOTTOM CARD: SALES INVOICE RECORDS -->
<div class="card">
<h3 style="margin-bottom:16px;">Sales Invoice Records</h3>
<table>
<thead>
<tr>
<th>INVOICE NO</th>
<th>CUSTOMER</th>
<th>DATE &amp; TIME (12H)</th>
<th>GRAND TOTAL</th>
<th>PAID</th>
<th>PAYMENT STATUS</th>
<th>DELIVERY STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No sales recorded yet.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function addToSalesCart(pCode){
  const p = productByCode(pCode);
  if(!p) return false;

  const typeEl = document.getElementById('srSaleType');
  const type = typeEl ? typeEl.value : 'Retail';
  const price = type==='Wholesale' ? (p.wholesalePrice||0) : (p.sellingPrice||0);

  const existing = activeSalesCartItems.find(i=>i.productCode===pCode);
  if(existing){
    existing.qty += 1;
  } else {
    activeSalesCartItems.push({
      productCode: pCode,
      name: p.name,
      qty: 1,
      unitPrice: price
    });
  }

  updateSalesCheckoutSummary();
  return true;
}

function salesRegisterTypeChanged(type){
activeSalesCartItems.forEach(item=>{
const p = productByCode(item.productCode);
if(p){
item.unitPrice = type==='Wholesale' ? (p.wholesalePrice||0) : (p.sellingPrice||0);
}
});
updateSalesCheckoutSummary();
}

function salesRegisterProductSelected(sel){
const opt = sel.options[sel.selectedIndex];
const typeEl = document.getElementById('srSaleType');
const type = typeEl ? typeEl.value : 'Retail';
if(opt && opt.dataset.price){
const price = type==='Wholesale' ? parseFloat(opt.dataset.wprice||0) : parseFloat(opt.dataset.price||0);
document.getElementById('srSelPrice').value = price;
}
}

function addSalesRegisterCartItem(){
const sel = document.getElementById('srSelProduct');
const qtyEl = document.getElementById('srSelQty');
const priceEl = document.getElementById('srSelPrice');

if(!sel || !sel.value){ alert('Please select a product.'); return; }
const pCode = sel.value;
const p = productByCode(pCode);
const qty = parseInt(qtyEl.value)||1;

const typeEl = document.getElementById('srSaleType');
const type = typeEl ? typeEl.value : 'Retail';
const defaultPrice = type==='Wholesale' ? (p ? p.wholesalePrice : 0) : (p ? p.sellingPrice : 0);
const price = parseFloat(priceEl.value) || defaultPrice;

const existing = activeSalesCartItems.find(i=>i.productCode===pCode);
if(existing){
existing.qty += qty;
existing.unitPrice = price;
} else {
activeSalesCartItems.push({
productCode: pCode,
name: p ? p.name : pCode,
qty: qty,
unitPrice: price
});
}

updateSalesCheckoutSummary();
sel.value = '';
qtyEl.value = '1';
}

function removeSalesRegisterCartItem(idx){
activeSalesCartItems.splice(idx, 1);
updateSalesCheckoutSummary();
}

function renderSalesCartTableRowsHtml(){
if(!activeSalesCartItems.length){
return `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No items in cart. Scan barcode or select product above to add.</td></tr>`;
}

return activeSalesCartItems.map((item, idx)=>`
<tr>
<td><strong>${esc(item.productCode)}</strong> - ${esc(item.name)}</td>
<td style="font-family:var(--font-mono);">${item.qty}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(item.unitPrice)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(item.qty * item.unitPrice)}</td>
<td style="text-align:right;">
<button type="button" class="btn-secondary btn-danger" style="padding:4px 8px;font-size:.78rem;" onclick="removeSalesRegisterCartItem(${idx})">\u2715</button>
</td>
</tr>
`).join('');
}

function updateSalesCheckoutSummary(){
const tbody = document.getElementById('srCartItemsTableBody');
if(tbody){
tbody.innerHTML = renderSalesCartTableRowsHtml();
}

const subtotal = activeSalesCartItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
const grandTotal = Math.max(0, subtotal - salesRegisterDiscount);

const subEl = document.getElementById('srTextSubtotal');
const gtEl = document.getElementById('srTextGrandTotal');
const paidEl = document.getElementById('srInputPaid');

if(subEl) subEl.innerText = `${fmt(subtotal)} LKR`;
if(gtEl) gtEl.innerText = `${fmt(grandTotal)} LKR`;
if(paidEl && (!paidEl.value || parseFloat(paidEl.value) === 0 || parseFloat(paidEl.value) === subtotal)){
paidEl.value = grandTotal;
}
}

function saveSalesRegisterInvoice(e){
e.preventDefault();
const f = e.target;
const sNo = nextCode('INV-', 'sale');

if(!activeSalesCartItems.length){
alert('Please add at least one product item to the sales register cart.');
return;
}

const discount = parseFloat(f.discount.value)||0;
const paid = parseFloat(f.amountPaid.value)||0;
const subtotal = activeSalesCartItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
const grandTotal = Math.max(0, subtotal - discount);

const sale = {
saleNo: sNo,
customerCode: f.customerCode.value || null,
date: f.invDate.value,
time: f.invTime.value,
customerType: f.customerType.value,
discount: discount,
grandTotal: grandTotal,
amountPaid: paid,
paymentStatus: paid >= grandTotal ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
notes: f.notes.value || ''
};

activeSalesCartItems.forEach(item=>{
const p = productByCode(item.productCode);
DB.saleItems.push({
id: uid('SI-'),
saleNo: sNo,
productCode: item.productCode,
qty: item.qty,
unitPrice: item.unitPrice,
landedCostAtSale: p ? p.avgLandedCost : 0
});

if(p){
p.stock = Math.max(0, p.stock - item.qty);
DB.stockLedger.push({
id: uid('SL-'),
date: new Date().toISOString(),
productCode: item.productCode,
type: 'OUT',
qty: item.qty,
unitCost: p.avgLandedCost,
refType: 'sale',
refNo: sNo
});
}
});

DB.sales.push(sale);
saveDB();

activeSalesCartItems = [];
salesRegisterDiscount = 0;

render();
showScanToast(`Sales Invoice ${sNo} completed!`, 'success');
printDocument('sale', sNo);
}

function deleteSale(sNo){
if(!confirm('Delete sales invoice '+sNo+'?')) return;
DB.sales = DB.sales.filter(s=>s.saleNo!==sNo);
DB.saleItems = DB.saleItems.filter(i=>i.saleNo!==sNo);
saveDB();
render();
}

function saleCustomerTypeChanged(type){
currentSaleFormItems.forEach(item=>{
const p = productByCode(item.productCode);
if(p){
item.unitPrice = type==='Wholesale' ? (p.wholesalePrice||0) : (p.sellingPrice||0);
}
});
renderSaleFormItemsTable();
}

function saleProductSelected(sel){
const opt = sel.options[sel.selectedIndex];
const custTypeEl = document.querySelector('select[name="customerType"]');
const custType = custTypeEl ? custTypeEl.value : 'Retail';
if(opt && opt.dataset.price){
document.getElementById('saleSelPrice').value = custType==='Wholesale' ? opt.dataset.wprice : opt.dataset.price;
}
}

function addSaleFormItem(){
const sel = document.getElementById('saleSelProduct');
const qtyEl = document.getElementById('saleSelQty');
const priceEl = document.getElementById('saleSelPrice');

if(!sel || !sel.value){ alert('Please select a product.'); return; }
const pCode = sel.value;
const p = productByCode(pCode);
const qty = parseInt(qtyEl.value)||1;
const price = parseFloat(priceEl.value)||0;

const existing = currentSaleFormItems.find(i=>i.productCode===pCode);
if(existing){
existing.qty += qty;
existing.unitPrice = price;
} else {
currentSaleFormItems.push({
productCode: pCode,
name: p ? p.name : pCode,
qty: qty,
unitPrice: price
});
}

renderSaleFormItemsTable();
}

function removeSaleFormItem(idx){
currentSaleFormItems.splice(idx, 1);
renderSaleFormItemsTable();
}

function renderSaleFormItemsTable(){
const tbody = document.getElementById('saleFormItemsTableBody');
if(!tbody) return;
if(!currentSaleFormItems.length){
tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items added to cart yet. Scan or select products above.</td></tr>`;
return;
}

tbody.innerHTML = currentSaleFormItems.map((item, idx)=>`
<tr>
<td><strong>${esc(item.productCode)}</strong> - ${esc(item.name)}</td>
<td style="font-family:var(--font-mono);">${item.qty}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(item.unitPrice)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(item.qty * item.unitPrice)}</td>
<td style="text-align:right;">
<button type="button" class="btn-secondary btn-danger" style="padding:4px 8px;font-size:.78rem;" onclick="removeSaleFormItem(${idx})">\u2715</button>
</td>
</tr>
`).join('');
}

function saveSale(e){
e.preventDefault();
const f = e.target;
const sNo = nextCode('INV-','sale');

if(!currentSaleFormItems.length){
alert('Please add at least one item to the sales invoice.');
return;
}

const sale = {
saleNo: sNo,
customerCode: f.customerCode.value || null,
date: f.date.value,
customerType: f.customerType.value,
paymentStatus: 'Paid',
amountPaid: 0
};

let totalAmt = 0;
currentSaleFormItems.forEach(item=>{
const p = productByCode(item.productCode);
totalAmt += item.qty * item.unitPrice;
DB.saleItems.push({
id: uid('SI-'),
saleNo: sNo,
productCode: item.productCode,
qty: item.qty,
unitPrice: item.unitPrice,
landedCostAtSale: p ? p.avgLandedCost : 0
});

if(p){
p.stock = Math.max(0, p.stock - item.qty);
DB.stockLedger.push({
id: uid('SL-'),
date: new Date().toISOString(),
productCode: item.productCode,
type: 'OUT',
qty: item.qty,
unitCost: p.avgLandedCost,
refType: 'sale',
refNo: sNo
});
}
});

sale.amountPaid = totalAmt;
DB.sales.push(sale);
saveDB(); closeModal(); render();
}

// ============================================================
// DELIVERIES & LOGISTICS (EXACT SCREENSHOT REDESIGN)
// ============================================================
