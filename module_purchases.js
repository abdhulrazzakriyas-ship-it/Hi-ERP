function renderPurchases(){
const s = DB.settings || {};
const currentFx = s.fxRate || 40;
const q = purchaseSearchFilter.toLowerCase();

const filtered = q ? DB.purchases.filter(p=>{
const sup = supplierByCode(p.supplierCode);
const supName = sup ? sup.name.toLowerCase() : '';
return (p.purchaseNo && p.purchaseNo.toLowerCase().indexOf(q)>=0) ||
(p.invoiceNo && p.invoiceNo.toLowerCase().indexOf(q)>=0) ||
(supName.indexOf(q)>=0);
}) : DB.purchases;

const rows = filtered.map(p=>{
const sup = supplierByCode(p.supplierCode);
const items = DB.purchaseItems.filter(i=>i.purchaseNo===p.purchaseNo);
const totalRMB = items.reduce((sum,i)=>sum+i.qty*i.unitPriceRMB,0) + (p.localDeliveryChargeRMB||0);
const fxRate = p.lockedFxRate || currentFx;
const totalLKR = totalRMB * fxRate;
const dateTimeDisplay = `${p.date || ''} ${p.time || ''}`.trim() || '-';

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(p.purchaseNo)}</strong></td>
<td><strong>${esc(sup?sup.name:'-- Unassigned --')}</strong></td>
<td style="font-family:var(--font-mono);">${esc(p.invoiceNo||'\u2014')}</td>
<td style="font-size:.82rem;white-space:nowrap;">${esc(dateTimeDisplay)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">
  &#165;${fmt(totalRMB)}
  ${(p.localDeliveryChargeRMB > 0) ? `<div style="font-size:.73rem;color:var(--muted);font-weight:normal;">(incl. &#165;${fmt(p.localDeliveryChargeRMB)} Delivery)</div>` : ''}
</td>
<td><span class="badge badge-ok">RMB 1 = ${fxRate.toFixed(2)} LKR</span></td>
<td style="font-family:var(--font-mono);font-weight:700;color:var(--ink);">LKR ${fmt(totalLKR)}</td>
<td><span class="badge ${p.paymentStatus==='Paid'?'badge-ok':(p.paymentStatus==='Partial'?'badge-pending':'badge-low')}">${esc(p.paymentStatus||'Unpaid')}</span></td>
<td><span class="badge ${p.status==='Received'?'badge-ok':(p.status==='In Transit'?'badge-pending':'badge-low')}">${esc(p.status||'Pending')}</span></td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Edit Purchase Order" onclick="openPurchaseForm('${esc(p.purchaseNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Print Purchase Order" onclick="printDocument('purchase','${esc(p.purchaseNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Invoice" onclick="deletePurchase('${esc(p.purchaseNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Purchases</div>
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
<input type="text" placeholder="Search purchase invoices..." value="${esc(purchaseSearchFilter)}" oninput="purchaseSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openPurchaseForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Create Purchase Order
</button>
</div>

<div class="card">
<h3 style="margin-bottom:16px;">Purchase Records (RMB Costing)</h3>
<table>
<thead>
<tr>
<th>PO NUMBER</th>
<th>SUPPLIER</th>
<th>INVOICE #</th>
<th>DATE &amp; TIME (12H)</th>
<th>TOTAL (RMB)</th>
<th>LOCKED RATE</th>
<th>TOTAL (LKR)</th>
<th>PAYMENT</th>
<th>SHIPMENT</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:30px;">No purchase records created yet.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openPurchaseForm(code){
const existingPo = code ? DB.purchases.find(x=>x.purchaseNo===code) : null;
if(existingPo){
  currentPoFormItems = DB.purchaseItems.filter(i=>i.purchaseNo===code).map(i=>({
    productCode: i.productCode,
    name: productByCode(i.productCode) ? productByCode(i.productCode).name : i.productCode,
    qty: i.qty,
    unitPriceRMB: i.unitPriceRMB
  }));
} else {
  currentPoFormItems = [];
}

const s = DB.settings || {};
const lockedFx = existingPo ? (existingPo.lockedFxRate || s.fxRate || 40) : (s.fxRate || 40);
const poNo = code || nextCode('PO-', 'purchase');
const now = new Date();
const dateStr = existingPo ? (existingPo.date || todayStr()) : todayStr();
const timeStr = existingPo ? (existingPo.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })) : now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

const supplierOptions = DB.suppliers.filter(sup=>sup.status==='Active').map(sup=>{
  const sel = existingPo && existingPo.supplierCode===sup.code ? 'selected' : '';
  return `<option value="${esc(sup.code)}" ${sel}>${esc(sup.name)} (${esc(sup.city||'Yiwu')})</option>`;
}).join('');
const productOptions = DB.products.filter(p=>p.status==='Active').map(p=>`<option value="${esc(p.code)}" data-price="${p.purchasePriceRMB||0}">${esc(p.code)} - ${esc(p.name)} (¥${fmt(p.purchasePriceRMB||0)})</option>`).join('');

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">${existingPo ? 'Edit' : 'Create'} Purchase Invoice (RMB Order)</h3>
</div>

<form onsubmit="savePurchase(event)">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>PO Number *</label>
<input required name="purchaseNo" value="${esc(poNo)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Supplier Account *</label>
<select required name="supplierCode">
<option value="">-- Select Supplier Account --</option>
${supplierOptions}
</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Invoice Number</label>
<input name="invoiceNo" value="${esc(existingPo ? existingPo.invoiceNo||'' : '')}" placeholder="INV-2026-X">
</div>
<div>
<label>Order Date *</label>
<input type="date" required name="date" value="${dateStr}">
</div>
<div>
<label>Order Time (12-Hour) *</label>
<input type="text" required name="time" value="${timeStr}">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Payment Term</label>
<select name="paymentTerm">
<option value="On Credit" ${existingPo && existingPo.paymentTerm==='On Credit'?'selected':''}>On Credit</option>
<option value="Pre-payment" ${existingPo && existingPo.paymentTerm==='Pre-payment'?'selected':''}>Pre-payment (100% TT)</option>
<option value="30% Advance / 70% Delivery" ${existingPo && existingPo.paymentTerm==='30% Advance / 70% Delivery'?'selected':''}>30% Advance / 70% Delivery</option>
<option value="Cash on Delivery" ${existingPo && existingPo.paymentTerm==='Cash on Delivery'?'selected':''}>Cash on Delivery</option>
</select>
</div>
<div>
<label>China Local Delivery Charge (RMB) *</label>
<input type="number" step="0.01" min="0" name="localDeliveryChargeRMB" value="${existingPo ? (existingPo.localDeliveryChargeRMB || 0) : 0}" placeholder="0.00" title="Delivery charge from China Supplier warehouse to Cargo Agent warehouse in RMB">
<small style="color:var(--muted);display:block;margin-top:2px;">Supplier Warehouse → Cargo Agent Warehouse (RMB)</small>
</div>
</div>

<div style="background:rgba(0,136,255,.1);border:1px solid rgba(0,136,255,.25);color:var(--harbor);padding:10px 14px;border-radius:8px;margin:14px 0;font-size:.8rem;display:flex;align-items:center;gap:8px;">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
<span><strong>Historical Exchange Rate Lock: RMB 1 = ${lockedFx.toFixed(2)} LKR</strong> (This rate will be permanently locked to this PO; changing settings later won't affect it)</span>
</div>

<button type="button" class="btn-secondary" style="width:100%;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(0,136,255,.12);border:1px solid rgba(0,136,255,.3);color:var(--harbor);font-weight:700;margin-bottom:16px;" onclick="openScanModal()">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
? SCAN ITEMS INTO PURCHASE REGISTER
</button>

<label style="margin-bottom:6px;display:block;">Select Product, Quantity &amp; Unit Price (RMB)</label>
<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
<select id="poSelProduct" style="flex:1;" onchange="poProductSelected(this)">
<option value="">-- Select Product --</option>
${productOptions}
</select>
<input type="number" id="poSelQty" value="1" min="1" placeholder="1" style="width:110px;">
<input type="number" step="0.01" id="poSelPrice" value="0.00" placeholder="0.00" style="width:120px;">
<button type="button" class="btn-primary" style="padding:9px 18px;" onclick="addPoFormItem()">+ Add Item</button>
</div>

<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:14px;">
<h4 style="margin:0 0 10px;">Consolidated Items</h4>
<table>
<thead>
<tr>
<th>PRODUCT</th>
<th style="width:80px;">QTY</th>
<th style="width:110px;">UNIT RMB</th>
<th style="width:120px;">TOTAL RMB</th>
<th style="width:70px;text-align:right;">ACTIONS</th>
</tr>
</thead>
<tbody id="poFormItemsTableBody">
<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items added to order yet.</td></tr>
</tbody>
</table>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Invoice</button>
</div>
</form>
`);
}

function poProductSelected(sel){
const opt = sel.options[sel.selectedIndex];
if(opt && opt.dataset.price){
document.getElementById('poSelPrice').value = opt.dataset.price;
}
}

function addPoFormItem(){
const sel = document.getElementById('poSelProduct');
const qtyEl = document.getElementById('poSelQty');
const priceEl = document.getElementById('poSelPrice');

if(!sel || !sel.value){ alert('Please select a product.'); return; }
const pCode = sel.value;
const p = productByCode(pCode);
const qty = parseInt(qtyEl.value)||1;
const price = parseFloat(priceEl.value)||0;

const existing = currentPoFormItems.find(i=>i.productCode===pCode);
if(existing){
existing.qty += qty;
existing.unitPriceRMB = price;
} else {
currentPoFormItems.push({
productCode: pCode,
name: p ? p.name : pCode,
qty: qty,
unitPriceRMB: price
});
}

renderPoFormItemsTable();
}

function addPoItemByCode(pCode){
  const p = productByCode(pCode);
  if(!p) return false;

  const price = p.costRMB || 0;
  const existing = currentPoFormItems.find(i=>i.productCode===pCode);
  if(existing){
    existing.qty += 1;
  } else {
    currentPoFormItems.push({
      productCode: pCode,
      name: p.name,
      qty: 1,
      unitPriceRMB: price
    });
  }

  renderPoFormItemsTable();
  return true;
}

function removePoFormItem(idx){
currentPoFormItems.splice(idx, 1);
renderPoFormItemsTable();
}

function renderPoFormItemsTable(){
const tbody = document.getElementById('poFormItemsTableBody');
if(!tbody) return;
if(!currentPoFormItems.length){
tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items added to order yet.</td></tr>`;
return;
}

tbody.innerHTML = currentPoFormItems.map((item, idx)=>`
<tr>
<td><strong>${esc(item.productCode)}</strong> - ${esc(item.name)}</td>
<td style="font-family:var(--font-mono);">${item.qty}</td>
<td style="font-family:var(--font-mono);">&#165;${fmt(item.unitPriceRMB)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">&#165;${fmt(item.qty * item.unitPriceRMB)}</td>
<td style="text-align:right;">
<button type="button" class="btn-secondary btn-danger" style="padding:4px 8px;font-size:.78rem;" onclick="removePoFormItem(${idx})">\u2715</button>
</td>
</tr>
`).join('');
}

function savePurchase(e){
e.preventDefault();
const f = e.target;
const s = DB.settings || {};
const pNo = f.purchaseNo.value;

if(!currentPoFormItems.length){
alert('Please add at least one product item to the purchase invoice.');
return;
}

const localDeliveryRMB = parseFloat(f.localDeliveryChargeRMB ? f.localDeliveryChargeRMB.value : 0) || 0;

const po = {
purchaseNo: pNo,
supplierCode: f.supplierCode.value,
invoiceNo: f.invoiceNo.value || '',
date: f.date.value,
time: f.time.value,
paymentTerm: f.paymentTerm.value,
lockedFxRate: s.fxRate || 40,
localDeliveryChargeRMB: localDeliveryRMB,
status: 'Pending',
paymentStatus: 'Unpaid',
amountPaidRMB: 0
};

const idx = DB.purchases.findIndex(x=>x.purchaseNo===pNo);
if(idx>=0) DB.purchases[idx] = Object.assign(DB.purchases[idx], po);
else DB.purchases.push(po);

DB.purchaseItems = DB.purchaseItems.filter(i=>i.purchaseNo!==pNo);

currentPoFormItems.forEach(item=>{
DB.purchaseItems.push({
id: uid('PI-'),
purchaseNo: pNo,
productCode: item.productCode,
qty: item.qty,
unitPriceRMB: item.unitPriceRMB
});
});

saveDB();
closeModal();
render();
}
function deletePurchase(pNo){
if(!confirm('Delete PO "'+pNo+'"?')) return;
DB.purchases = DB.purchases.filter(p=>p.purchaseNo!==pNo);
DB.purchaseItems = DB.purchaseItems.filter(i=>i.purchaseNo!==pNo);
saveDB(); render();
}

// ============================================================
// CARGO & SHIPMENTS
// ============================================================
