function renderLandedCost(){
const s = DB.settings || {};
const shipments = DB.shipments;
const selectOpts = shipments.map(shp=>`<option value="${esc(shp.id)}">${esc(shp.id)} - ${esc(shp.trackingNo||'Shipment')} (${shp.status})</option>`).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Landed Cost Calculator</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<div class="card" style="margin-bottom:18px;">
<label style="font-weight:600;font-size:.85rem;">Select Cargo Shipment to Inspect:</label>
<select id="lcShipmentSelect" onchange="renderLandedCostDetails(this.value)" style="padding:9px 12px;font-size:.9rem;border-radius:7px;border:1px solid var(--border-strong);margin-top:6px;width:100%;max-width:400px;">
<option value="">-- Choose Shipment --</option>
${selectOpts}
</select>
</div>
<div id="landedCostDetailsContainer">
<div class="card" style="color:var(--muted);text-align:center;padding:40px;">Select a shipment above to see its complete landed cost breakdown table.</div>
</div>
`;
}
function renderLandedCostDetails(sId){
const container = document.getElementById('landedCostDetailsContainer');
if(!container) return;
if(!sId){ container.innerHTML = '<div class="card" style="color:var(--muted);text-align:center;padding:40px;">Select a shipment above to see its complete landed cost breakdown table.</div>'; return; }

const shipment = DB.shipments.find(s=>s.id===sId);
const items = calculateShipmentLandedCost(sId);
if(!items.length){ container.innerHTML = '<div class="card">No items linked to this shipment.</div>'; return; }

const totalDirectLKR = items.reduce((s,i)=>s+i._directCostLKR,0);
const totalOverheadLKR = items.reduce((s,i)=>s+(i._allocatedOverheadLKR||0),0);
const totalLandedLKR = items.reduce((s,i)=>s+i._totalLandedCostLKR,0);

const rows = items.map(i=>{
const p = productByCode(i.productCode);
const multiplier = i._directCostLKR>0 ? (i._totalLandedCostLKR/i._directCostLKR) : 1;
const freightDisplay = i._chargeMethod === 'lump' ? `Lump Rs ${fmt(i._cargoFreightLKR)}` : `${i._cbm} CBM @ Rs ${fmt(i._cbmRateLKR)}/CBM`;
return `<tr>
<td><strong>${esc(i.productCode)}</strong></td>
<td>${esc(p?p.name:'Item')}<br><small style="color:var(--muted);">${esc(i.purchaseNo)}</small></td>
<td>${i.qty}</td>
<td>¥${fmt(i.unitPriceRMB)}</td>
<td>Rs ${fmt(i._directCostLKR)}</td>
<td>
  <div style="font-size:.82rem;font-weight:600;">Rs ${fmt(i._cargoFreightLKR)}</div>
  <small style="color:var(--muted);">${freightDisplay}</small>
</td>
<td>
  <div style="font-size:.82rem;">Rs ${fmt(i._localDeliveryLKR||0)}</div>
</td>
<td>Rs ${fmt((i._allocatedOverheadLKR||0) - (i._cargoFreightLKR||0))}</td>
<td><strong>Rs ${fmt(i._totalLandedCostLKR)}</strong></td>
<td><strong style="color:var(--harbor-dark);font-size:.92rem;">Rs ${fmt(i._landedCostPerUnit)}</strong></td>
<td><span class="badge badge-ok">${multiplier.toFixed(2)}x</span></td>
</tr>`;
}).join('');

container.innerHTML = `
<div class="metric-grid" style="margin-bottom:18px;">
<div class="card metric-card"><div class="metric-label">Direct Goods Cost (LKR)</div><div class="metric-value">Rs ${fmt(totalDirectLKR)}</div></div>
<div class="card metric-card"><div class="metric-label">Freight, Delivery &amp; Duty</div><div class="metric-value">Rs ${fmt(totalOverheadLKR)}</div></div>
<div class="card metric-card"><div class="metric-label">Total Landed Cost</div><div class="metric-value" style="color:var(--harbor-dark);">Rs ${fmt(totalLandedLKR)}</div></div>
<div class="card metric-card"><div class="metric-label">Cost Multiplier</div><div class="metric-value">${totalDirectLKR>0?(totalLandedLKR/totalDirectLKR).toFixed(2):'1.00'}x</div></div>
</div>
<div class="card">
<h3>Item-by-Item Landed Cost Allocation Table (${shipment.allocationMethod.toUpperCase()} Non-Freight Allocation)</h3>
<table>
<thead>
<tr>
<th>SKU</th>
<th>Product &amp; PO</th>
<th>Qty</th>
<th>Cost RMB</th>
<th>Direct Cost (LKR)</th>
<th>Item Cargo Freight</th>
<th>China Local Freight</th>
<th>Duty &amp; Port Fees</th>
<th>Total Landed Cost</th>
<th>Unit Landed Cost</th>
<th>Multiplier</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>
</div>
`;
}

// ============================================================
// INVENTORY & STOCK LEDGER
// ============================================================
