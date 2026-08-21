function renderReturns(){
const s = DB.settings || {};
const dateStr = todayStr();

const custOpts = DB.customers.map(c => `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.phone||'No Phone')})</option>`).join('');
const productOpts = DB.products.map(p => `<option value="${esc(p.code)}">${esc(p.code)} - ${esc(p.name)}</option>`).join('');

const logsRows = (DB.customerReturns || []).map(r => {
return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(r.id)}</strong></td>
<td><strong>${esc(r.customerName || r.customerCode)}</strong></td>
<td><strong style="font-family:var(--font-mono);">${esc(r.productCode)}</strong> - ${esc(r.productName||'')}</td>
<td style="font-family:var(--font-mono);">${r.qty}</td>
<td style="font-size:.8rem;color:var(--muted);">${esc(r.reason||'\u2014')}</td>
<td style="white-space:nowrap;">
<button type="button" class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Print Return Note" onclick="printDocument('return','${esc(r.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button type="button" class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Return" onclick="deleteCustomerReturn('${esc(r.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Returns</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<!-- MAIN SPLIT GRID -->
<div style="display:grid;grid-template-columns:1.8fr 1fr;gap:18px;">

<!-- LEFT CARD: CUSTOMER RETURNS REGISTRY -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Customer Returns Registry (Sales Inward)</h3>

<form onsubmit="saveCustomerReturnDirect(event)">
<div style="display:grid;grid-template-columns:1fr 1fr 90px;gap:12px;margin-bottom:14px;">
<div>
<label>Select Customer</label>
<select name="customerCode" required>
<option value="">-- Select Customer --</option>
${custOpts}
</select>
</div>
<div>
<label>Product to Return</label>
<select name="productCode" required>
<option value="">-- Select Product --</option>
${productOpts}
</select>
</div>
<div>
<label>Quantity</label>
<input type="number" name="qty" value="1" min="1" required style="margin:0;">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;align-items:center;">
<div>
<label>Refund/Credit Amount (LKR)</label>
<input type="number" step="0.01" name="refundAmount" value="0" placeholder="0" style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Return Date</label>
<div style="display:flex;align-items:center;gap:10px;">
<input type="date" name="returnDate" required value="${dateStr}" style="flex:1;margin:0;">
<label style="margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;font-size:.85rem;font-weight:700;">
<input type="checkbox" name="restock" checked style="width:16px;height:16px;margin:0;">
Restock Returned Goods
</label>
</div>
</div>
</div>

<div style="margin-bottom:20px;">
<label>Reason for Return</label>
<textarea name="reason" rows="3" placeholder="Damaged packaging, wrong size, etc..."></textarea>
</div>

<div>
<button type="submit" class="btn-primary" style="padding:12px 24px;font-size:.95rem;font-weight:800;display:inline-flex;align-items:center;gap:8px;">
� Register Customer Return
</button>
</div>
</form>
</div>

<!-- RIGHT CARD: RETURNS REGISTER LOGS -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Returns Register Logs</h3>
<table>
<thead>
<tr>
<th>NO</th>
<th>CUSTOMER</th>
<th>SKU</th>
<th>QTY</th>
<th>REASON</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${logsRows || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px;">No returns registered yet.</td></tr>'}
</tbody>
</table>
</div>

</div>
`;
}

function saveCustomerReturnDirect(e){
e.preventDefault();
const f = e.target;
const retId = nextCode('RET-', 'customerReturn', 4);

const custCode = f.customerCode.value;
const pCode = f.productCode.value;
const qty = parseInt(f.qty.value) || 1;
const creditAmt = parseFloat(f.refundAmount.value) || 0;
const retDate = f.returnDate.value || todayStr();
const shouldRestock = f.restock.checked;
const reason = f.reason.value || '';

const cust = customerByCode(custCode);
const p = productByCode(pCode);

const retRecord = {
id: retId,
customerCode: custCode,
customerName: cust ? cust.name : custCode,
productCode: pCode,
productName: p ? p.name : pCode,
qty: qty,
creditAmount: creditAmt,
date: retDate,
restock: shouldRestock,
reason: reason
};

if(shouldRestock && p){
p.stock += qty;
DB.stockLedger.push({
id: uid('SL-'),
date: new Date().toISOString(),
productCode: pCode,
type: 'IN',
qty: qty,
unitCost: p.avgLandedCost,
refType: 'customerReturn',
refNo: retId
});
}

DB.customerReturns.push(retRecord);
saveDB();
render();
showScanToast(`Customer return ${retId} registered successfully!`, 'success');
}

function deleteCustomerReturn(id){
if(!confirm('Delete return record '+id+'?')) return;
DB.customerReturns = DB.customerReturns.filter(r => r.id !== id);
saveDB();
render();
}

// ============================================================
// PAYMENTS & BOOKS (EXACT SCREENSHOT REDESIGN)
// ============================================================
let paymentSearchFilter = '';

function calculateAccountBookBalances(){
let cashIn = 0, cashOut = 0, bankIn = 0, bankOut = 0;

(DB.paymentVouchers || []).forEach(v => {
const isReceipt = v.voucherType && v.voucherType.indexOf('Receipt') >= 0;
const isCash = v.method && v.method.indexOf('Cash') >= 0;
const amt = v.amountLKR || 0;

if(isCash){
if(isReceipt) cashIn += amt;
else cashOut += amt;
} else {
if(isReceipt) bankIn += amt;
else bankOut += amt;
}
});

(DB.sales || []).forEach(s => {
const paid = s.amountPaid || 0;
cashIn += paid;
});

(DB.expenses || []).forEach(e => {
const amt = e.amount || 0;
if(e.paymentMethod === 'Cash') cashOut += amt;
else bankOut += amt;
});

const cashBalance = cashIn - cashOut;
const bankBalance = bankIn - bankOut;

return { cashBalance, bankBalance };
}

