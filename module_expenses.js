function renderExpenses(){
const s = DB.settings || {};
const q = expenseSearchFilter.toLowerCase();

const filtered = q ? DB.expenses.filter(e => {
return (e.id && e.id.toLowerCase().indexOf(q)>=0) ||
(e.category && e.category.toLowerCase().indexOf(q)>=0) ||
(e.title && e.title.toLowerCase().indexOf(q)>=0) ||
(e.notes && e.notes.toLowerCase().indexOf(q)>=0) ||
(e.paymentMethod && e.paymentMethod.toLowerCase().indexOf(q)>=0);
}) : DB.expenses;

const rows = filtered.map(e => {
const isPaid = (e.status || 'Paid') === 'Paid';

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(e.id || ('EXP-' + String(e.code||'').padStart(4,'0')))}</strong></td>
<td><span class="badge badge-ok">${esc(e.category)}</span></td>
<td style="font-size:.84rem;">${esc(e.date)}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(e.amount)}</td>
<td>${esc(e.paymentMethod)}</td>
<td style="font-size:.8rem;color:var(--muted);">${esc(e.title || e.notes || '\u2014')}</td>
<td><span class="badge ${isPaid?'badge-ok':'badge-pending'}">${isPaid?'Paid':'Pending'}</span></td>
<td style="white-space:nowrap;">
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Expense" onclick="deleteExpense('${esc(e.id)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

// Calculate Monthly Category Summaries
const catTotals = {};
DB.expenses.forEach(e => {
const cat = e.category || 'Misc Operating Expenses';
catTotals[cat] = (catTotals[cat] || 0) + (e.amount || 0);
});

const catRows = Object.keys(catTotals).map(cat => `
<tr>
<td><strong>${esc(cat)}</strong></td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(catTotals[cat])}</td>
</tr>
`).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Expenses</div>
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
<input type="text" placeholder="Search expenses..." value="${esc(expenseSearchFilter)}" oninput="expenseSearchFilter=this.value; render();" autocomplete="off" style="padding-left:40px;margin:0;height:42px;">
</div>
<button class="btn-primary" onclick="openExpenseForm()" style="height:42px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ New Expense Entry
</button>
</div>

<!-- MAIN SPLIT GRID -->
<div style="display:grid;grid-template-columns:2.2fr 1fr;gap:18px;">

<!-- LEFT CARD: COMPANY OPERATING EXPENSES -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Company Operating Expenses</h3>
<table>
<thead>
<tr>
<th>ID</th>
<th>CATEGORY</th>
<th>DATE</th>
<th>AMOUNT (LKR)</th>
<th>PAYMENT METHOD</th>
<th>NOTES</th>
<th>STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;">No operating expenses recorded yet. Click "+ New Expense Entry" to add one.</td></tr>'}
</tbody>
</table>
</div>

<!-- RIGHT CARD: MONTHLY CATEGORY SUMMARIES -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Monthly Category Summaries</h3>
<table>
<thead>
<tr>
<th>CATEGORY</th>
<th>SUM (LKR)</th>
</tr>
</thead>
<tbody>
${catRows || '<tr><td colspan="2" style="text-align:center;color:var(--muted);padding:30px;">No expense categories recorded yet.</td></tr>'}
</tbody>
</table>
</div>

</div>
`;
}

function openExpenseForm(){
const expId = nextCode('EXP-', 'expense', 4);
const cats = [
'Rent & Warehouse',
'Customs & Clearance Charges',
'Transportation & Port Fees',
'Utilities & Electricity',
'Office & Administration',
'Marketing & Ads',
'Staff Meals & Refreshments',
'Misc Operating Expenses'
];

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Create Operating Expense Entry</h3>
</div>

<form onsubmit="saveExpense(event)">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Expense ID *</label>
<input required name="id" value="${esc(expId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Expense Category *</label>
<select required name="category">
${cats.map(c => '<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')}
</select>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Posting Date *</label>
<input type="date" required name="date" value="${todayStr()}">
</div>
<div>
<label>Amount (LKR) *</label>
<input type="number" step="0.01" required name="amount" placeholder="0.00" style="font-family:var(--font-mono);font-weight:700;">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Payment Method *</label>
<select required name="paymentMethod">
<option value="Cash">Cash (Physical Cash)</option>
<option value="Bank Transfer">Bank Transfer (TT / Online)</option>
<option value="Cheque">Cheque</option>
<option value="Card">Credit / Debit Card</option>
</select>
</div>
<div>
<label>Payment Status *</label>
<select required name="status">
<option value="Paid">Paid</option>
<option value="Pending">Pending</option>
</select>
</div>
</div>

<div style="margin-top:8px;">
<label>Expense Title / Description *</label>
<textarea required name="title" rows="2" placeholder="Expense description, invoice or voucher receipt reference..."></textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Expense</button>
</div>
</form>
`);
}

function saveExpense(e){
e.preventDefault();
const f = e.target;

const expense = {
id: f.id.value,
category: f.category.value,
date: f.date.value,
amount: parseFloat(f.amount.value) || 0,
paymentMethod: f.paymentMethod.value,
status: f.status.value,
title: f.title.value,
notes: f.title.value
};

DB.expenses.push(expense);
saveDB();
closeModal();
render();
}

function deleteExpense(id){
if(!confirm('Delete expense entry '+id+'?')) return;
DB.expenses = DB.expenses.filter(x => x.id !== id);
saveDB();
render();
}

// ============================================================
// DAILY LABOR (EXACT SCREENSHOT REDESIGN)
// ============================================================
currentLaborAttendanceDate = todayStr();

