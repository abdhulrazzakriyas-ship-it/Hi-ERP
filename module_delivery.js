function renderDelivery(){
const s = DB.settings || {};
const q = deliverySearchFilter.toLowerCase();

const filtered = q ? DB.deliveries.filter(d => {
return (d.id && d.id.toLowerCase().indexOf(q)>=0) ||
(d.saleNo && d.saleNo.toLowerCase().indexOf(q)>=0) ||
(d.courier && d.courier.toLowerCase().indexOf(q)>=0) ||
(d.receiverName && d.receiverName.toLowerCase().indexOf(q)>=0) ||
(d.trackingNo && d.trackingNo.toLowerCase().indexOf(q)>=0);
}) : DB.deliveries;

const rows = filtered.map(d => {
const sale = DB.sales.find(x => x.saleNo === d.saleNo);
const cust = sale ? customerByCode(sale.customerCode) : null;
const isDelivered = d.status === 'Delivered';

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(d.id)}</strong></td>
<td><strong style="font-family:var(--font-mono);">${esc(d.saleNo)}</strong></td>
<td><strong>${esc(cust ? cust.name : '-- Walk-in Cash --')}</strong></td>
<td style="font-size:.84rem;">${esc(d.date)}</td>
<td>${esc(d.courier || 'Driver / Pronto Logistics')}</td>
<td>${esc(d.receiverName || cust ? (cust?cust.phone:'--') : '--')}</td>
<td><span class="badge ${isDelivered?'badge-ok':'badge-pending'}">${esc(d.status || 'Dispatched')}</span></td>
<td style="white-space:nowrap;">
${!isDelivered ? '<button type="button" class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Mark Delivered" onclick="markDelivered(\''+esc(d.id)+'\')">� Mark Delivered</button>' : ''}
<button type="button" class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Print Dispatch Note" onclick="printDocument('delivery','${esc(d.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
</button>
<button type="button" class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Delivery Note" onclick="deleteDelivery('${esc(d.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Deliveries</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<!-- CONTROL BAR -->
<div style="margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;background:var(--paper);border:1px solid var(--border-strong);padding:12px 18px;border-radius:10px;">
<div style="position:relative;flex:1;max-width:480px;">
<svg style="position:absolute;left:14px;top:10px;color:var(--muted);" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
<input type="text" placeholder="Search deliveries..." value="${esc(deliverySearchFilter)}" oninput="deliverySearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:38px;">
</div>
<button class="btn-primary" onclick="openDeliveryForm()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Dispatch Delivery Order
</button>
</div>

<!-- MAIN CARD -->
<div class="card">
<h3 style="margin-bottom:16px;">Delivery Order Logistics</h3>
<table>
<thead>
<tr>
<th>DELIVERY NO</th>
<th>SALE REF</th>
<th>CUSTOMER NAME</th>
<th>DELIVERY DATE</th>
<th>DRIVER / VEHICLE</th>
<th>RECEIVER NAME</th>
<th>STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No deliveries dispatched yet. Click "+ Dispatch Delivery Order" to add.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openDeliveryForm(){
const saleOpts = DB.sales.map(s => `<option value="${esc(s.saleNo)}">${esc(s.saleNo)} - Date: ${s.date} (Total: LKR ${fmt(s.grandTotal||0)})</option>`).join('');
const delId = nextCode('DEL-', 'delivery', 4);

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Create Delivery Dispatch Note</h3>
</div>

<form onsubmit="saveDelivery(event)">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Delivery No *</label>
<input required name="id" value="${esc(delId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Select Sales Invoice *</label>
<select required name="saleNo">${saleOpts || '<option value="">-- No Sales Invoices --</option>'}</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Dispatch Date *</label>
<input type="date" name="date" required value="${todayStr()}">
</div>
<div>
<label>Courier Service / Driver Name *</label>
<input required name="courier" value="Pronto Logistics / Driver" placeholder="Driver or courier name...">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Receiver Name / Contact</label>
<input name="receiverName" placeholder="Receiver full name & phone...">
</div>
<div>
<label>Tracking / Consignment No</label>
<input name="trackingNo" placeholder="TRK12345678">
</div>
</div>

<div style="margin-top:8px;">
<label>Delivery Address & Notes</label>
<textarea name="notes" rows="2" placeholder="Recipient address, special delivery instructions..."></textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Dispatch Delivery</button>
</div>
</form>
`);
}

function saveDelivery(e){
e.preventDefault();
const f = e.target;

DB.deliveries.push({
id: f.id.value,
saleNo: f.saleNo.value,
date: f.date.value,
courier: f.courier.value,
receiverName: f.receiverName.value,
trackingNo: f.trackingNo.value,
notes: f.notes.value,
status: 'Dispatched'
});

saveDB();
closeModal();
render();
showScanToast(`Delivery ${f.id.value} dispatched!`, 'success');
}

function markDelivered(id){
const d = DB.deliveries.find(x => x.id === id);
if(d){
d.status = 'Delivered';
saveDB();
render();
showScanToast(`Delivery ${id} marked as Delivered!`, 'success');
}
}

function deleteDelivery(id){
if(!confirm('Delete delivery note '+id+'?')) return;
DB.deliveries = DB.deliveries.filter(x => x.id !== id);
saveDB();
render();
}

// ============================================================
// RETURNS (EXACT SCREENSHOT REDESIGN)
// ============================================================
