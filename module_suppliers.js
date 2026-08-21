function renderSuppliers(){
const s = DB.settings || {};
const fxRate = s.fxRate || 40;
const q = supplierSearchFilter.toLowerCase();

const filtered = q ? DB.suppliers.filter(sup=>{
return (sup.code && sup.code.toLowerCase().indexOf(q)>=0) ||
(sup.name && sup.name.toLowerCase().indexOf(q)>=0) ||
(sup.contactPerson && sup.contactPerson.toLowerCase().indexOf(q)>=0) ||
(sup.email && sup.email.toLowerCase().indexOf(q)>=0) ||
(sup.mobile && sup.mobile.toLowerCase().indexOf(q)>=0);
}) : DB.suppliers;

const rows = filtered.map(sup=>{
const balanceRMB = supplierOutstandingBalance(sup.code);
const balanceLKR = balanceRMB * fxRate;
const totalPaidLKR = supplierTotalPaidLKR(sup.code);

const contactStr = sup.contactPerson || '-';
const contactDetail = [sup.email, sup.mobile].filter(Boolean).join(' / ') || '-';

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(sup.code)}</strong></td>
<td><strong>${esc(sup.name)}</strong></td>
<td>${esc(contactStr)}</td>
<td>${esc(contactDetail)}</td>
<td>${esc(sup.paymentTerms || 'Pre-payment')}</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(totalPaidLKR)}</td>
<td style="font-family:var(--font-mono);font-weight:700;color:${balanceLKR>0?'var(--red)':'var(--ink)'};">LKR ${fmt(balanceLKR)}</td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 12px;font-size:.78rem;display:inline-flex;align-items:center;gap:4px;" onclick="openSupplierLedgerModal('${esc(sup.code)}')">
<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
Ledger
</button>
<button class="btn-secondary" style="padding:6px 10px;" onclick="openSupplierForm('${esc(sup.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" onclick="deleteSupplier('${esc(sup.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Suppliers</div>
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
<input type="text" placeholder="Search suppliers..." value="${esc(supplierSearchFilter)}" oninput="supplierSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openSupplierForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ New Supplier
</button>
</div>

<div class="card">
<h3 style="margin-bottom:16px;">Supplier Master Register</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>SUPPLIER NAME</th>
<th>CONTACT PERSON</th>
<th>EMAIL / PHONE</th>
<th>PAYMENT TERMS</th>
<th>TOTAL PAID (LKR)</th>
<th>OUTSTANDING (LKR)</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No suppliers found matching search filter.</td></tr>'}
</tbody>
</table>
</div>
`;
}
function openSupplierForm(code){
const s = code ? supplierByCode(code) : null;
openModal(`
<h3>${s?'Edit':'New'} Supplier</h3>
<form onsubmit="saveSupplier(event,'${code?esc(code):''}')">
<label>Supplier Name</label><input required name="name" value="${s?esc(s.name):''}">
<label>Contact Person</label><input name="contactPerson" value="${s?esc(s.contactPerson):''}">
<label>Country</label><input name="country" value="${s?esc(s.country):'China'}">
<label>City</label><input name="city" value="${s?esc(s.city):'Yiwu'}">
<label>Mobile / WeChat</label><input name="mobile" value="${s?esc(s.mobile):''}">
<label>Email</label><input name="email" value="${s?esc(s.email):''}">
<label>Payment Terms</label><input name="paymentTerms" value="${s?esc(s.paymentTerms):'30% advance / 70% before shipment'}">
<label>Status</label><select name="status"><option ${!s||s.status==='Active'?'selected':''}>Active</option><option ${s&&s.status==='Inactive'?'selected':''}>Inactive</option></select>
<div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn-primary">Save Supplier</button></div>
</form>`);
}
function saveSupplier(e, code){
e.preventDefault();
const f = e.target;
const data = { name:f.name.value, contactPerson:f.contactPerson.value, country:f.country.value, city:f.city.value, mobile:f.mobile.value, email:f.email.value, paymentTerms:f.paymentTerms.value, status:f.status.value };
if(code){ Object.assign(supplierByCode(code), data); }
else{ DB.suppliers.push(Object.assign({ code:nextCode('SUP-','supplier') }, data)); }
saveDB(); closeModal(); render();
}
function deleteSupplier(code){
const s = supplierByCode(code);
if(!s) return;
if(!confirm('Delete supplier "'+s.name+'"?')) return;
DB.suppliers = DB.suppliers.filter(x=>x.code!==code);
saveDB(); render();
}

function openSupplierPaymentForm(supplierCode){
const sup = supplierByCode(supplierCode);
const balance = supplierOutstandingBalance(supplierCode);
const pos = DB.purchases.filter(p=>p.supplierCode===supplierCode);
openModal(`
<h3>Record Payment to ${esc(sup.name)}</h3>
<p style="font-size:.88rem;color:var(--muted);">Current Balance Payable: <strong>&#165;${fmt(balance)}</strong></p>
<form onsubmit="saveSupplierPayment(event,'${esc(supplierCode)}')">
<label>Purchase Order (Optional)</label>
<select name="purchaseNo">
<option value="">-- General Supplier Account Payment --</option>
${pos.map(p=>'<option value="'+esc(p.purchaseNo)+'">'+esc(p.purchaseNo)+' - Date: '+p.date+' (RMB '+fmt(p.amountPaidRMB||0)+')</option>').join('')}
</select>
<label>Payment Date</label><input type="date" required name="date" value="${todayStr()}">
<label>Amount (RMB &#165;)</label><input type="number" step="0.01" required name="amountRMB" value="${balance>0?balance:''}">
<label>Payment Method</label><select name="method"><option>Bank Transfer (TT)</option><option>Cash (RMB)</option><option>WeChat Pay / Alipay</option><option>Letter of Credit (LC)</option></select>
<label>Reference / Remittance Tx No</label><input name="refNo" placeholder="TT Ref # or Bank Slip #">
<div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn-primary">Record Payment</button></div>
</form>
`);
}
function saveSupplierPayment(e, supplierCode){
e.preventDefault();
const f = e.target;
const amt = parseFloat(f.amountRMB.value)||0;
const pNo = f.purchaseNo.value;
DB.supplierPayments.push({
id: uid('SPAY-'), supplierCode: supplierCode, purchaseNo: pNo, date: f.date.value, amountRMB: amt, method: f.method.value, refNo: f.refNo.value
});
if(pNo){
const po = DB.purchases.find(p=>p.purchaseNo===pNo);
if(po){
po.amountPaidRMB = (po.amountPaidRMB||0) + amt;
const items = DB.purchaseItems.filter(i=>i.purchaseNo===pNo);
const total = items.reduce((t,i)=>t+i.qty*i.unitPriceRMB,0)+(po.localDeliveryChargeRMB||0);
if(po.amountPaidRMB>=total) po.paymentStatus='Paid';
else if(po.amountPaidRMB>0) po.paymentStatus='Partial';
}
}
saveDB(); closeModal(); render();
}

// ============================================================
// CUSTOMERS (EXACT SCREENSHOT REDESIGN)
// ============================================================
customerSearchFilter = '';

