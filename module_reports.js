function renderReports(){
const s = DB.settings || {};
const topProducts = DB.products.map(p=>{
const sItems = DB.saleItems.filter(i=>i.productCode===p.code);
const qtySold = sItems.reduce((sum,i)=>sum+i.qty,0);
const rev = sItems.reduce((sum,i)=>sum+i.qty*i.unitPrice,0);
const cogs = sItems.reduce((sum,i)=>sum+i.qty*i.landedCostAtSale,0);
return { name: p.name, code: p.code, qty: qtySold, rev: rev, profit: rev - cogs };
}).sort((a,b)=>b.rev-a.rev).slice(0,5);

return `
<header id="top-bar">
<div class="top-bar-title">Analytics &amp; Executive Reports</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;">
<div class="card">
<h3>Top Revenue Generating Products</h3>
<table>
<thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Profit</th></tr></thead>
<tbody>
${topProducts.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+t.qty+'</td><td>Rs '+fmt(t.rev)+'</td><td style="color:var(--green);">Rs '+fmt(t.profit)+'</td></tr>').join('')}
</tbody>
</table>
</div>
<div class="card">
<h3>Quick Export</h3>
<p style="color:var(--muted);font-size:.88rem;">Download complete system state or print financial snapshots.</p>
<button class="btn-primary" onclick="exportData()">Export Full JSON Backup</button>
</div>
</div>
`;
}

// ============================================================
// UNIVERSAL PRINT ENGINE
