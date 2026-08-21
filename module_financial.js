function renderFinancial(){
const s = DB.settings || {};

const grossSales = DB.sales.reduce((sum, sal) => {
const items = DB.saleItems.filter(i => i.saleNo === sal.saleNo);
return sum + items.reduce((t, i) => t + (i.qty * i.unitPrice), 0);
}, 0);

const totalDiscount = DB.sales.reduce((sum, sal) => sum + (sal.discount || 0), 0);
const netSales = Math.max(0, grossSales - totalDiscount);

const totalCOGS = DB.saleItems.reduce((sum, i) => sum + (i.qty * (i.landedCostAtSale || 0)), 0);
const grossProfit = netSales - totalCOGS;

const totalExpenses = DB.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
const totalLaborPaid = DB.laborPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
const totalHRPaid = DB.payrollPayments.reduce((sum, p) => sum + (p.netAmount || 0), 0);

const totalOpex = totalExpenses + totalLaborPaid + totalHRPaid;
const netProfit = grossProfit - totalOpex;

const stockVal = DB.products.reduce((sum, p) => sum + (p.stock * (p.avgLandedCost || 0)), 0);
const receivables = DB.customers.reduce((sum, c) => sum + customerOutstandingBalance(c.code), 0);
const payablesRMB = DB.suppliers.reduce((sum, sup) => sum + supplierOutstandingBalance(sup.code), 0);
const payablesLKR = payablesRMB * (s.fxRate || 40);

return `
<header id="top-bar">
<div class="top-bar-title">Financial Statements</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

<!-- TOP STATEMENT HEADER CARD -->
<div class="card" style="margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;padding:16px 20px;">
<div style="display:flex;align-items:center;gap:12px;">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
<h3 style="margin:0;font-size:1.1rem;">Company Financial &amp; Profit Statement</h3>
</div>
<button class="btn-primary" style="padding:10px 22px;font-weight:700;display:inline-flex;align-items:center;gap:8px;" onclick="window.print()">
??? Print Financial Statement
</button>
</div>

<!-- DETAILED INCOME STATEMENT CARD -->
<div class="card">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border-strong);">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
<h3 style="margin:0;font-size:1.15rem;">Detailed Income Statement (Profit &amp; Loss Breakdown)</h3>
</div>

<table style="width:100%;border-collapse:collapse;">
<tbody>
<!-- REVENUE SECTION -->
<tr style="background:rgba(0,136,255,.08);font-weight:700;">
<td colspan="2" style="padding:10px 14px;color:var(--harbor);text-transform:uppercase;letter-spacing:.04em;font-size:.84rem;">1. Revenue &amp; Sales Inflows</td>
</tr>
<tr>
<td style="padding:10px 16px;">Gross Sales Revenue</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);font-weight:700;">LKR ${fmt(grossSales)}</td>
</tr>
<tr>
<td style="padding:10px 16px;">Sales Discounts &amp; Customer Allowances</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(totalDiscount)}</td>
</tr>
<tr style="border-top:1px solid var(--border);border-bottom:2px solid var(--border-strong);font-weight:700;">
<td style="padding:10px 16px;">Net Sales Revenue</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);font-size:1.05rem;">LKR ${fmt(netSales)}</td>
</tr>

<!-- COGS SECTION -->
<tr style="background:rgba(0,136,255,.08);font-weight:700;">
<td colspan="2" style="padding:10px 14px;color:var(--harbor);text-transform:uppercase;letter-spacing:.04em;font-size:.84rem;margin-top:12px;">2. Cost of Sales</td>
</tr>
<tr>
<td style="padding:10px 16px;">Cost of Goods Sold (COGS at Landed Cost)</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(totalCOGS)}</td>
</tr>
<tr style="border-top:1px solid var(--border);border-bottom:2px solid var(--border-strong);font-weight:800;">
<td style="padding:12px 16px;font-size:1.05rem;">Gross Trading Profit</td>
<td style="padding:12px 16px;text-align:right;font-family:var(--font-mono);font-size:1.15rem;color:var(--harbor);">LKR ${fmt(grossProfit)}</td>
</tr>

<!-- OPEX SECTION -->
<tr style="background:rgba(0,136,255,.08);font-weight:700;">
<td colspan="2" style="padding:10px 14px;color:var(--harbor);text-transform:uppercase;letter-spacing:.04em;font-size:.84rem;">3. Operating Expenses (OPEX)</td>
</tr>
<tr>
<td style="padding:10px 16px;">Company Operating Expenses (Rent, Customs, Freight, Utilities...)</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(totalExpenses)}</td>
</tr>
<tr>
<td style="padding:10px 16px;">Daily Labor Wages Paid</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(totalLaborPaid)}</td>
</tr>
<tr>
<td style="padding:10px 16px;">Salaried HR Staff Payroll</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(totalHRPaid)}</td>
</tr>
<tr style="border-top:1px solid var(--border);font-weight:700;">
<td style="padding:10px 16px;">Total Operating Expenses</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">LKR ${fmt(totalOpex)}</td>
</tr>

<!-- NET OPERATING PROFIT BANNER -->
<tr style="background:${netProfit>=0?'rgba(46,204,113,.15)':'rgba(231,76,60,.15)'};border:2px solid ${netProfit>=0?'var(--green)':'var(--red)'};font-weight:800;">
<td style="padding:16px;font-size:1.15rem;color:${netProfit>=0?'var(--green)':'var(--red)'};">NET OPERATING PROFIT / (LOSS)</td>
<td style="padding:16px;text-align:right;font-family:var(--font-mono);font-size:1.35rem;color:${netProfit>=0?'var(--green)':'var(--red)'};">
LKR ${fmt(netProfit)}
</td>
</tr>

<!-- BALANCE SHEET ASSET & LIABILITY POSITION -->
<tr style="background:rgba(0,136,255,.08);font-weight:700;">
<td colspan="2" style="padding:10px 14px;color:var(--harbor);text-transform:uppercase;letter-spacing:.04em;font-size:.84rem;">4. Current Assets &amp; Liabilities Position</td>
</tr>
<tr>
<td style="padding:10px 16px;">Inventory Stock Asset Value (at Landed Cost)</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);font-weight:700;">LKR ${fmt(stockVal)}</td>
</tr>
<tr>
<td style="padding:10px 16px;">Customer Accounts Receivable (Outstanding Credit)</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);font-weight:700;">LKR ${fmt(receivables)}</td>
</tr>
<tr>
<td style="padding:10px 16px;">Supplier Accounts Payable (Payables In LKR - �${fmt(payablesRMB)} RMB)</td>
<td style="padding:10px 16px;text-align:right;font-family:var(--font-mono);color:var(--red);">- LKR ${fmt(payablesLKR)}</td>
</tr>
</tbody>
</table>
</div>
`;
}

// ============================================================
// REPORTS
// ============================================================
