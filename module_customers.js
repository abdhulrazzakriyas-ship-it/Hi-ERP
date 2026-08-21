function renderCustomers(){
const s = DB.settings || {};
const q = customerSearchFilter.toLowerCase();

const filtered = q ? DB.customers.filter(c=>{
return (c.code && c.code.toLowerCase().indexOf(q)>=0) ||
(c.name && c.name.toLowerCase().indexOf(q)>=0) ||
(c.phone && c.phone.toLowerCase().indexOf(q)>=0) ||
(c.email && c.email.toLowerCase().indexOf(q)>=0);
}) : DB.customers;

const rows = filtered.map(c=>{
const balance = customerOutstandingBalance(c.code);

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(c.code)}</strong></td>
<td><strong>${esc(c.name)}</strong></td>
<td style="font-family:var(--font-mono);">${esc(c.phone||'\u2014')}</td>
<td>${esc(c.email||'\u2014')}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(c.creditLimit||0)}</td>
<td style="font-family:var(--font-mono);font-weight:700;color:${balance>0?'var(--red)':'var(--green)'};">
LKR ${fmt(balance)}
</td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="View Customer Ledger & Statement" onclick="openCustomerLedgerModal('${esc(c.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
</button>
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Edit Customer" onclick="openCustomerForm('${esc(c.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Customer" onclick="deleteCustomer('${esc(c.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Customers</div>
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
<input type="text" placeholder="Search customers..." value="${esc(customerSearchFilter)}" oninput="customerSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openCustomerForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Add New Customer
</button>
</div>

<div class="card">
<h3 style="margin-bottom:16px;">Customer Master Index</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>CUSTOMER NAME</th>
<th>PHONE</th>
<th>EMAIL ADDRESS</th>
<th>CREDIT LIMIT (LKR)</th>
<th>OUTSTANDING BALANCE</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px;">No customers found matching search filter.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openCustomerForm(code){
const c = code ? customerByCode(code) : null;
const cId = c ? c.code : nextCode('CUST-', 'customer', 3);

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Create Customer Profile</h3>
</div>

<form onsubmit="saveCustomer(event, '${code?esc(code):''}')">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Customer ID *</label>
<input required name="code" value="${esc(cId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Full Customer Name *</label>
<input required name="name" value="${c?esc(c.name):''}" placeholder="Full Customer Name *">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Phone Number</label>
<input name="phone" value="${c?esc(c.phone):''}" placeholder="Phone Number">
</div>
<div>
<label>Email Address</label>
<input type="email" name="email" value="${c?esc(c.email):''}" placeholder="Email Address">
</div>
</div>

<div style="margin-top:8px;">
<label>Credit Account Limit (LKR) *</label>
<input type="number" required name="creditLimit" value="${c ? (c.creditLimit||0) : 0}" placeholder="0" style="font-family:var(--font-mono);font-weight:700;">
</div>

<div style="margin-top:8px;">
<label>Billing Address</label>
<textarea name="address" rows="2" placeholder="Street address, city...">${c?esc(c.address):''}</textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Profile</button>
</div>
</form>
`);
}

function saveCustomer(e, code){
e.preventDefault();
const f = e.target;
const data = {
code: f.code.value,
name: f.name.value,
phone: f.phone.value,
email: f.email.value,
creditLimit: parseFloat(f.creditLimit.value)||0,
address: f.address.value,
status: 'Active'
};

if(code){
Object.assign(customerByCode(code), data);
} else {
DB.customers.push(data);
}
saveDB();
closeModal();
render();
}

function deleteCustomer(code){
const c = customerByCode(code);
if(!c) return;
if(!confirm('Delete customer "'+c.name+'"?')) return;
DB.customers = DB.customers.filter(x=>x.code!==code);
saveDB();
render();
}

function openCustomerLedgerModal(custCode){
const cust = customerByCode(custCode);
if(!cust) return;

const sales = DB.sales.filter(s=>s.customerCode===custCode);
const balance = customerOutstandingBalance(custCode);

const salesRows = sales.map(s=>{
const items = DB.saleItems.filter(i=>i.saleNo===s.saleNo);
const total = items.reduce((t,i)=>t+i.qty*i.unitPrice,0);
return `<tr>
<td>${esc(s.saleNo)}</td><td>${esc(s.date)}</td><td>${items.length} items</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(total)}</td>
<td><span class="badge ${s.paymentStatus==='Paid'?'badge-ok':'badge-pending'}">${esc(s.paymentStatus)}</span></td>
</tr>`;
}).join('');

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
<div>
<h3 style="margin:0;">Financial Statement: ${esc(cust.name)}</h3>
<div style="font-size:.82rem;color:var(--muted);">ID: ${esc(cust.code)} | Phone: ${esc(cust.phone||'N/A')}</div>
</div>
<div style="text-align:right;">
<div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;">Outstanding Balance</div>
<div style="font-size:1.2rem;font-weight:800;color:${balance>0?'var(--red)':'var(--green)'};">LKR ${fmt(balance)}</div>
</div>
</div>

<div class="card" style="margin-bottom:14px;background:var(--paper);">
<h4 style="margin:0 0 10px;">Sales Invoices History</h4>
<table>
<thead><tr><th>INVOICE NO</th><th>DATE</th><th>ITEMS</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
<tbody>${salesRows || '<tr><td colspan="5" style="text-align:center;color:var(--muted);">No sales invoices.</td></tr>'}</tbody>
</table>
</div>

<div class="modal-actions">
<button type="button" class="btn-secondary" onclick="closeModal()">Close</button>
<button type="button" class="btn-primary" onclick="closeModal(); openCustomerPaymentForm('${esc(custCode)}');">+ Record Payment</button>
</div>
`);
}

function openCustomerPaymentForm(customerCode){
const cust = customerByCode(customerCode);
const balance = customerOutstandingBalance(customerCode);
const sales = DB.sales.filter(s=>s.customerCode===customerCode);
openModal(`
<h3>Receive Payment from ${esc(cust.name)}</h3>
<p style="font-size:.88rem;color:var(--muted);">Outstanding Receivables: <strong>Rs ${fmt(balance)}</strong></p>
<form onsubmit="saveCustomerPayment(event,'${esc(customerCode)}')">
<label>Sale Invoice (Optional)</label>
<select name="saleNo">
<option value="">-- General Account Payment --</option>
${sales.map(s=>'<option value="'+esc(s.saleNo)+'">'+esc(s.saleNo)+' - Date: '+s.date+' (Paid: Rs '+fmt(s.amountPaid||0)+')</option>').join('')}
</select>
<label>Payment Date</label><input type="date" required name="date" value="${todayStr()}">
<label>Amount Received (LKR Rs)</label><input type="number" step="0.01" required name="amount" value="${balance>0?balance:''}">
<label>Payment Method</label><select name="method"><option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Card</option></select>
<label>Reference / Cheque No</label><input name="refNo" placeholder="Cheque # or Transfer Ref">
<div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn-primary">Record Payment</button></div>
</form>
`);
}
function saveCustomerPayment(e, customerCode){
e.preventDefault();
const f = e.target;
const amt = parseFloat(f.amount.value)||0;
const sNo = f.saleNo.value;
DB.customerPayments.push({
id: uid('CPAY-'), customerCode: customerCode, saleNo: sNo, date: f.date.value, amount: amt, method: f.method.value, refNo: f.refNo.value
});
if(sNo){
const s = DB.sales.find(x=>x.saleNo===sNo);
if(s){
s.amountPaid = (s.amountPaid||0) + amt;
const items = DB.saleItems.filter(i=>i.saleNo===sNo);
const total = items.reduce((t,i)=>t+i.qty*i.unitPrice,0);
if(s.amountPaid>=total) s.paymentStatus='Paid';
else if(s.amountPaid>0) s.paymentStatus='Partial';
}
}
saveDB(); closeModal(); render();
}

// ============================================================
// PURCHASES (EXACT SCREENSHOT REDESIGN)
// ============================================================
purchaseSearchFilter = '';
currentPoFormItems = [];

