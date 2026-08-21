function renderQuotations(){
const s = DB.settings || {};
const q = quotationSearchFilter.toLowerCase();

const filtered = q ? DB.quotations.filter(qt=>{
const cust = customerByCode(qt.customerCode);
const custName = cust ? cust.name.toLowerCase() : '';
return (qt.quoteNo && qt.quoteNo.toLowerCase().indexOf(q)>=0) ||
(custName.indexOf(q)>=0);
}) : DB.quotations;

const rows = filtered.map(qt=>{
const cust = customerByCode(qt.customerCode);
const items = DB.quoteItems.filter(i=>i.quoteNo===qt.quoteNo);
const total = items.reduce((sum,i)=>sum+i.qty*i.unitPrice,0);

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(qt.quoteNo)}</strong></td>
<td style="font-size:.84rem;">${esc(qt.date)}</td>
<td style="font-size:.84rem;">${esc(qt.validUntil||'\u2014')}</td>
<td><strong>${esc(cust?cust.name:'-- Walk-in Customer --')}</strong></td>
<td>${items.length} items</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(total)}</td>
<td><span class="badge ${qt.status==='Converted'?'badge-ok':'badge-pending'}">${esc(qt.status||'Draft')}</span></td>
<td style="white-space:nowrap;">
${qt.status!=='Converted'?'<button class="btn-primary" style="padding:4px 10px;font-size:.78rem;margin-right:4px;" onclick="convertQuoteToSale(\''+esc(qt.quoteNo)+'\')">Convert to Sale</button>':''}
<button class="btn-secondary" style="padding:6px 10px;" title="Print Quotation" onclick="printDocument('quotation','${esc(qt.quoteNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Quotation" onclick="deleteQuotation('${esc(qt.quoteNo)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Quotations</div>
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
<input type="text" placeholder="Search quotations..." value="${esc(quotationSearchFilter)}" oninput="quotationSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openQuotationForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Create Quotation
</button>
</div>

<div class="card">
<h3 style="margin-bottom:16px;">Customer Quotations (Proforma Invoices)</h3>
<table>
<thead>
<tr>
<th>QUOTE NO</th>
<th>POSTING DATE</th>
<th>VALIDITY DATE</th>
<th>CUSTOMER</th>
<th>ITEMS</th>
<th>TOTAL (LKR)</th>
<th>STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No quotations created yet.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openQuotationForm(code){
currentQuoteFormItems = [];
const qNo = code || nextCode('QT-', 'quotation');
const dateStr = todayStr();

const validDate = new Date();
validDate.setDate(validDate.getDate() + 14);
const validStr = validDate.toISOString().slice(0,10);

const custOpts = DB.customers.map(c=>`<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.phone||'No Phone')})</option>`).join('');
const productOptions = DB.products.filter(p=>p.status==='Active').map(p=>`<option value="${esc(p.code)}" data-price="${p.sellingPrice||0}">${esc(p.code)} - ${esc(p.name)} (LKR ${fmt(p.sellingPrice||0)})</option>`).join('');

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Generate Customer Quotation</h3>
</div>

<form onsubmit="saveQuotation(event)">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Quotation No</label>
<input required name="quoteNo" value="${esc(qNo)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Select Customer Account *</label>
<select required name="customerCode">
<option value="">-- Select Customer Account --</option>
${custOpts}
</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Posting Date *</label>
<input type="date" required name="date" value="${dateStr}">
</div>
<div>
<label>Validity Limit Date *</label>
<input type="date" required name="validUntil" value="${validStr}">
</div>
</div>

<label style="margin-top:14px;margin-bottom:6px;display:block;">Select Product</label>
<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
<select id="qtSelProduct" style="flex:2;" onchange="quoteProductSelected(this)">
<option value="">-- Select Product --</option>
${productOptions}
</select>
<input type="number" step="0.01" id="qtSelPrice" placeholder="Price (LKR)" style="flex:1;min-width:120px;">
<input type="number" id="qtSelQty" value="1" min="1" placeholder="1" style="width:90px;">
<button type="button" class="btn-primary" style="padding:9px 20px;font-weight:700;" onclick="addQuoteFormItem()">Add</button>
</div>

<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:14px;margin-bottom:14px;">
<h4 style="margin:0 0 10px;">Quotation Products Cart</h4>
<table>
<thead>
<tr>
<th>PRODUCT</th>
<th style="width:80px;">QTY</th>
<th style="width:120px;">PRICE (LKR)</th>
<th style="width:130px;">TOTAL (LKR)</th>
<th style="width:70px;text-align:right;">ACTIONS</th>
</tr>
</thead>
<tbody id="quoteFormItemsTableBody">
<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items added to quotation yet.</td></tr>
</tbody>
</table>
</div>

<div>
<label>Private Notes</label>
<textarea name="notes" rows="3" placeholder="Discount conditions, special delivery, validity details..."></textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Generate Quote</button>
</div>
</form>
`);
}

function quoteProductSelected(sel){
const opt = sel.options[sel.selectedIndex];
if(opt && opt.dataset.price){
document.getElementById('qtSelPrice').value = opt.dataset.price;
}
}

function addQuoteFormItem(){
const sel = document.getElementById('qtSelProduct');
const qtyEl = document.getElementById('qtSelQty');
const priceEl = document.getElementById('qtSelPrice');

if(!sel || !sel.value){ alert('Please select a product.'); return; }
const pCode = sel.value;
const p = productByCode(pCode);
const qty = parseInt(qtyEl.value)||1;
const price = parseFloat(priceEl.value)||0;

const existing = currentQuoteFormItems.find(i=>i.productCode===pCode);
if(existing){
existing.qty += qty;
existing.unitPrice = price;
} else {
currentQuoteFormItems.push({
productCode: pCode,
name: p ? p.name : pCode,
qty: qty,
unitPrice: price
});
}

renderQuoteFormItemsTable();
}

function removeQuoteFormItem(idx){
currentQuoteFormItems.splice(idx, 1);
renderQuoteFormItemsTable();
}

function renderQuoteFormItemsTable(){
const tbody = document.getElementById('quoteFormItemsTableBody');
if(!tbody) return;
if(!currentQuoteFormItems.length){
tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:18px;">No items added to quotation yet.</td></tr>`;
return;
}

tbody.innerHTML = currentQuoteFormItems.map((item, idx)=>`
<tr>
<td><strong>${esc(item.productCode)}</strong> - ${esc(item.name)}</td>
<td style="font-family:var(--font-mono);">${item.qty}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(item.unitPrice)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(item.qty * item.unitPrice)}</td>
<td style="text-align:right;">
<button type="button" class="btn-secondary btn-danger" style="padding:4px 8px;font-size:.78rem;" onclick="removeQuoteFormItem(${idx})">\u2715</button>
</td>
</tr>
`).join('');
}

function saveQuotation(e){
e.preventDefault();
const f = e.target;
const qNo = f.quoteNo.value;

if(!currentQuoteFormItems.length){
alert('Please add at least one product item to the quotation.');
return;
}

const qt = {
quoteNo: qNo,
customerCode: f.customerCode.value,
date: f.date.value,
validUntil: f.validUntil.value,
notes: f.notes.value || '',
status: 'Draft'
};

const idx = DB.quotations.findIndex(x=>x.quoteNo===qNo);
if(idx>=0) DB.quotations[idx] = Object.assign(DB.quotations[idx], qt);
else DB.quotations.push(qt);

DB.quoteItems = DB.quoteItems.filter(i=>i.quoteNo!==qNo);

currentQuoteFormItems.forEach(item=>{
DB.quoteItems.push({
id: uid('QI-'),
quoteNo: qNo,
productCode: item.productCode,
qty: item.qty,
unitPrice: item.unitPrice
});
});

saveDB();
closeModal();
render();
}
function convertQuoteToSale(qNo){
const q = DB.quotations.find(x=>x.quoteNo===qNo);
if(!q) return;
const items = DB.quoteItems.filter(i=>i.quoteNo===qNo);
const sNo = nextCode('INV-','sale');
const sale = {
saleNo: sNo, customerCode: q.customerCode, date: todayStr(), customerType: 'Wholesale', paymentStatus: 'Unpaid', amountPaid: 0
};
DB.sales.push(sale);
items.forEach(item=>{
const p = productByCode(item.productCode);
DB.saleItems.push({
id: uid('SI-'), saleNo: sNo, productCode: item.productCode, qty: item.qty, unitPrice: item.unitPrice, landedCostAtSale: p?p.avgLandedCost:0
});
if(p){
p.stock = Math.max(0, p.stock - item.qty);
DB.stockLedger.push({ id: uid('SL-'), date: new Date().toISOString(), productCode: item.productCode, type: 'OUT', qty: item.qty, unitCost: p.avgLandedCost, refType: 'sale', refNo: sNo });
}
});
q.status = 'Converted';
saveDB(); render();
alert('Quotation '+qNo+' converted to Sales Invoice '+sNo+'!');
}
function deleteQuotation(qNo){
if(!confirm('Delete quotation '+qNo+'?')) return;
DB.quotations = DB.quotations.filter(x=>x.quoteNo!==qNo);
DB.quoteItems = DB.quoteItems.filter(i=>i.quoteNo!==qNo);
saveDB(); render();
}

// ============================================================
// SALES REGISTER (EXACT SCREENSHOT REDESIGN)
// ============================================================
activeSalesCartItems = [];
salesRegisterDiscount = 0;

