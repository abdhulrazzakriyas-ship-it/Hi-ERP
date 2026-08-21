function renderPayments(){
const s = DB.settings || {};
const q = paymentSearchFilter.toLowerCase();
const { cashBalance, bankBalance } = calculateAccountBookBalances();

const filtered = q ? (DB.paymentVouchers||[]).filter(v => {
return (v.id && v.id.toLowerCase().indexOf(q)>=0) ||
(v.partyName && v.partyName.toLowerCase().indexOf(q)>=0) ||
(v.partyType && v.partyType.toLowerCase().indexOf(q)>=0) ||
(v.method && v.method.toLowerCase().indexOf(q)>=0);
}) : (DB.paymentVouchers || []);

const rows = filtered.map(v => {
const isReceipt = v.voucherType && v.voucherType.indexOf('Receipt') >= 0;

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(v.id)}</strong></td>
<td style="font-size:.84rem;">${esc(v.date)}</td>
<td><span class="badge badge-ok">${esc(v.partyType)}</span></td>
<td><strong>${esc(v.partyName)}</strong></td>
<td><span class="badge ${isReceipt?'badge-ok':'badge-pending'}">${esc(v.voucherType)}</span></td>
<td>${esc(v.method)}</td>
<td style="font-family:var(--font-mono);font-weight:700;color:${isReceipt?'var(--green)':'var(--red)'};">
${isReceipt?'+':'-'} LKR ${fmt(v.amountLKR)}
</td>
<td style="font-size:.8rem;color:var(--muted);">${esc(v.notes||v.refNo||'\u2014')}</td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Print Voucher" onclick="printDocument('payment','${esc(v.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Voucher" onclick="deletePaymentVoucher('${esc(v.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Payments &amp; Books</div>
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
<input type="text" placeholder="Search payments..." value="${esc(paymentSearchFilter)}" oninput="paymentSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openPaymentVoucherForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Create Payment Voucher
</button>
</div>

<!-- MAIN SPLIT GRID -->
<div style="display:grid;grid-template-columns:2.2fr 1fr;gap:18px;">

<!-- LEFT CARD: RECEIPTS AND PAYMENTS JOURNAL -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Receipts and Payments Journal</h3>
<table>
<thead>
<tr>
<th>VOUCHER ID</th>
<th>DATE</th>
<th>PARTY TYPE</th>
<th>PARTY NAME</th>
<th>VOUCHER TYPE</th>
<th>METHOD</th>
<th>AMOUNT (LKR)</th>
<th>NOTES</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;">No payment vouchers recorded yet. Click "+ Create Payment Voucher" to add one.</td></tr>'}
</tbody>
</table>
</div>

<!-- RIGHT CARD: ACCOUNT BOOKS SUMMARY -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Account Books Summary</h3>

<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:18px;margin-bottom:14px;">
<div style="font-size:.76rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">CASH BOOK BALANCE</div>
<div style="font-family:var(--font-mono);font-size:1.6rem;font-weight:800;color:var(--ink);margin-top:6px;">
${fmt(cashBalance)} LKR
</div>
</div>

<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:18px;">
<div style="font-size:.76rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">BANK BOOK BALANCE</div>
<div style="font-family:var(--font-mono);font-size:1.6rem;font-weight:800;color:var(--harbor);margin-top:6px;">
${fmt(bankBalance)} LKR
</div>
</div>
</div>

</div>
`;
}

function openPaymentVoucherForm(){
const pvId = nextCode('PV-', 'paymentVoucher');
const dateStr = todayStr();
const custOpts = DB.customers.map(c => `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.phone||'No Phone')})</option>`).join('');

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Create Payment Voucher</h3>
</div>

<form onsubmit="savePaymentVoucher(event)">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Voucher ID *</label>
<input required name="id" value="${esc(pvId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Voucher Type *</label>
<select required name="voucherType">
<option value="Receipt (IN)">Receipt (Money IN)</option>
<option value="Payment (OUT)">Payment (Money OUT)</option>
</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Posting Date *</label>
<input type="date" required name="date" value="${dateStr}">
</div>
<div>
<label>Party Type *</label>
<select required name="partyType" id="pvPartyTypeSelect" onchange="paymentPartyTypeChanged(this.value)">
<option value="Customer">Customer Account</option>
<option value="Supplier">Supplier Account</option>
<option value="Laborer">Laborer Account</option>
<option value="General">Operating Expense / Other</option>
</select>
</div>
</div>

<div style="margin-top:8px;">
<label>Party Account / Name *</label>
<select required name="partyCode" id="pvPartyCodeSelect">
${custOpts || '<option value="GENERAL">General Account</option>'}
</select>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Payment Method *</label>
<select required name="method">
<option value="Cash Book">Cash Book (Physical Cash)</option>
<option value="Bank Book (TT/Cheque)">Bank Book (TT / Cheque / Online)</option>
<option value="WeChat / Alipay">WeChat / Alipay</option>
</select>
</div>
<div>
<label>Amount (LKR) *</label>
<input type="number" step="0.01" required name="amountLKR" placeholder="0.00" style="font-family:var(--font-mono);font-weight:700;">
</div>
</div>

<div style="margin-top:8px;">
<label>Reference / Remittance Tx No</label>
<input name="refNo" placeholder="Cheque #, TT Slip #, Bank Ref...">
</div>

<div style="margin-top:8px;">
<label>Voucher Notes / Purpose</label>
<textarea name="notes" rows="2" placeholder="Payment description, invoice settlement details..."></textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Voucher</button>
</div>
</form>
`);
}

function paymentPartyTypeChanged(partyType){
const partySel = document.getElementById('pvPartyCodeSelect');
if(!partySel) return;
if(partyType === 'Customer'){
partySel.innerHTML = DB.customers.length ? DB.customers.map(c => `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.phone||'No Phone')})</option>`).join('') : '<option value="GENERAL">-- No Customers --</option>';
} else if(partyType === 'Supplier'){
partySel.innerHTML = DB.suppliers.length ? DB.suppliers.map(s => `<option value="${esc(s.code)}">${esc(s.name)} (${esc(s.city||'Yiwu')})</option>`).join('') : '<option value="GENERAL">-- No Suppliers --</option>';
} else if(partyType === 'Laborer'){
partySel.innerHTML = DB.laborers.length ? DB.laborers.map(l => `<option value="${esc(l.code)}">${esc(l.name)} (${esc(l.role||'Laborer')})</option>`).join('') : '<option value="GENERAL">-- No Laborers --</option>';
} else {
partySel.innerHTML = `<option value="GENERAL">General / Operating Account</option>`;
}
}

function savePaymentVoucher(e){
e.preventDefault();
const f = e.target;
const pvId = f.id.value;
const partyType = f.partyType.value;
const partyCode = f.partyCode.value;

let partyName = 'General Account';
if(partyType === 'Customer'){
const c = customerByCode(partyCode);
if(c) partyName = c.name;
} else if(partyType === 'Supplier'){
const s = supplierByCode(partyCode);
if(s) partyName = s.name;
} else if(partyType === 'Laborer'){
const l = DB.laborers.find(x => x.code === partyCode);
if(l) partyName = l.name;
}

const voucher = {
id: pvId,
voucherType: f.voucherType.value,
date: f.date.value,
partyType: partyType,
partyCode: partyCode,
partyName: partyName,
method: f.method.value,
amountLKR: parseFloat(f.amountLKR.value) || 0,
refNo: f.refNo.value || '',
notes: f.notes.value || ''
};

DB.paymentVouchers.push(voucher);

if(partyType === 'Customer' && voucher.voucherType.indexOf('Receipt') >= 0){
DB.customerPayments.push({
id: uid('CPAY-'),
customerCode: partyCode,
date: voucher.date,
amount: voucher.amountLKR,
method: voucher.method,
refNo: voucher.refNo
});
}

if(partyType === 'Supplier' && voucher.voucherType.indexOf('Payment') >= 0){
const fx = DB.settings.fxRate || 40;
DB.supplierPayments.push({
id: uid('SPAY-'),
supplierCode: partyCode,
date: voucher.date,
amountRMB: voucher.amountLKR / fx,
method: voucher.method,
refNo: voucher.refNo
});
}

saveDB();
closeModal();
render();
}

function deletePaymentVoucher(id){
if(!confirm('Delete payment voucher '+id+'?')) return;
DB.paymentVouchers = (DB.paymentVouchers||[]).filter(v=>v.id!==id);
saveDB();
render();
}

// ============================================================
// EXPENSES (EXACT SCREENSHOT REDESIGN)
// ============================================================
let expenseSearchFilter = '';

