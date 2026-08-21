function renderLabor(){
const s = DB.settings || {};
const dateStr = currentLaborAttendanceDate || todayStr();

const activeWorkers = DB.laborers.filter(l => l.status !== 'Inactive');

const attendanceRows = activeWorkers.map(l => {
const currentStatus = getWorkerAttendanceStatusOnDate(l.code, dateStr);

return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(l.code)}</strong></td>
<td>
<strong>${esc(l.name)}</strong>
<div style="font-size:.78rem;color:var(--muted);">${esc(l.role||'Laborer')}</div>
</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(l.dailyRate)}</td>
<td>
<select name="status_${esc(l.code)}" style="margin:0;padding:6px 10px;font-size:.85rem;">
<option value="Present" ${currentStatus==='Present'?'selected':''}>Present</option>
<option value="Half-Day" ${currentStatus==='Half-Day'?'selected':''}>Half-Day</option>
<option value="Absent" ${currentStatus==='Absent'?'selected':''}>Absent</option>
</select>
</td>
<td style="white-space:nowrap;">
<button type="button" class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Pay Wages" onclick="openLaborPaymentForm('${esc(l.code)}')">
?? Pay Wage
</button>
<button type="button" class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Edit Worker" onclick="openLaborerForm('${esc(l.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button type="button" class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Worker" onclick="deleteLaborer('${esc(l.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

const paymentHistoryRows = (DB.laborPayments || []).map(p => {
const worker = DB.laborers.find(l => l.code === p.laborerCode);

return `
<tr>
<td><strong>${esc(worker ? worker.name : p.laborerCode)}</strong></td>
<td style="font-size:.84rem;">${esc(p.date)}</td>
<td style="font-family:var(--font-mono);font-weight:700;color:var(--green);">LKR ${fmt(p.amount)}</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Daily Labor</div>
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
<div style="display:flex;align-items:center;gap:10px;">
<strong style="font-size:.9rem;">Attendance Date:</strong>
<input type="date" value="${dateStr}" onchange="currentLaborAttendanceDate=this.value; render();" style="margin:0;height:38px;">
</div>
<button class="btn-primary" onclick="openLaborerForm()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Add Worker Profile
</button>
</div>

<!-- MAIN SPLIT GRID -->
<form onsubmit="saveDailyLaborAttendanceGrid(event)">
<input type="hidden" name="attendanceDate" value="${dateStr}">

<div style="display:grid;grid-template-columns:2.2fr 1fr;gap:18px;">

<!-- LEFT CARD: DAILY LABOR ATTENDANCE GRID -->
<div class="card" style="margin:0;display:flex;flex-direction:column;justify-content:space-between;">
<div>
<h3 style="margin-bottom:16px;">Daily Labor Attendance Grid &amp; Wage Calculation</h3>
<table>
<thead>
<tr>
<th>WORKER ID</th>
<th>WORKER NAME</th>
<th>DAILY WAGE (LKR)</th>
<th>TODAY'S ATTENDANCE STATUS</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${attendanceRows || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px;">No daily labor workers registered yet. Click "+ Add Worker Profile" to add.</td></tr>'}
</tbody>
</table>
</div>

<div style="margin-top:20px;text-align:right;">
<button type="submit" class="btn-primary" style="padding:12px 24px;font-size:.95rem;font-weight:800;display:inline-flex;align-items:center;gap:8px;">
?? Save &amp; Accrue Labor Wages
</button>
</div>
</div>

<!-- RIGHT CARD: WAGE PAYMENT HISTORY LOGS -->
<div class="card" style="margin:0;">
<h3 style="margin-bottom:16px;">Wage Payment History Logs</h3>
<table>
<thead>
<tr>
<th>WORKER</th>
<th>DATE</th>
<th>WAGE PAY</th>
</tr>
</thead>
<tbody>
${paymentHistoryRows || '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:30px;">No wage payments recorded yet.</td></tr>'}
</tbody>
</table>
</div>

</div>
</form>
`;
}

function getWorkerAttendanceStatusOnDate(workerCode, dateStr){
const rec = (DB.laborAttendance||[]).find(a => a.laborerCode === workerCode && a.date === dateStr);
return rec ? rec.status : 'Present';
}

function saveDailyLaborAttendanceGrid(e){
e.preventDefault();
const f = e.target;
const dt = f.attendanceDate.value || todayStr();
const activeWorkers = DB.laborers.filter(l => l.status !== 'Inactive');

activeWorkers.forEach(l => {
const stEl = f[`status_${l.code}`];
const st = stEl ? stEl.value : 'Present';

DB.laborAttendance = (DB.laborAttendance||[]).filter(a => !(a.date === dt && a.laborerCode === l.code));
DB.laborAttendance.push({
id: uid('LA-'),
date: dt,
laborerCode: l.code,
status: st,
overtimeHours: 0
});
});

saveDB();
render();
showScanToast(`Attendance and wages accrued for ${dt}!`, 'success');
}

function openLaborerForm(code){
const l = code ? DB.laborers.find(x => x.code === code) : null;
const lId = l ? l.code : nextCode('LAB-', 'laborer', 3);

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Create Worker Profile</h3>
</div>

<form onsubmit="saveLaborer(event, '${code?esc(code):''}')">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Worker ID *</label>
<input required name="code" value="${esc(lId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Full Worker Name *</label>
<input required name="name" value="${l?esc(l.name):''}" placeholder="Full Worker Name *">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Role / Function *</label>
<input name="role" value="${l?esc(l.role):'Warehouse Unloader'}" placeholder="Unloader / Cargo Helper">
</div>
<div>
<label>Phone Number</label>
<input name="phone" value="${l?esc(l.phone):''}" placeholder="Phone Number">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Daily Wage Rate (LKR) *</label>
<input type="number" step="0.01" required name="dailyRate" value="${l ? l.dailyRate : 2500}" placeholder="2500" style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Overtime Rate per Hour (LKR)</label>
<input type="number" step="0.01" name="otRatePerHour" value="${l ? l.otRatePerHour : 400}" placeholder="400" style="font-family:var(--font-mono);">
</div>
</div>

<div style="margin-top:8px;">
<label>Status *</label>
<select name="status">
<option value="Active" ${!l||l.status==='Active'?'selected':''}>Active</option>
<option value="Inactive" ${l&&l.status==='Inactive'?'selected':''}>Inactive</option>
</select>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Worker</button>
</div>
</form>
`);
}

function saveLaborer(e, code){
e.preventDefault();
const f = e.target;
const data = {
code: f.code.value,
name: f.name.value,
role: f.role.value,
dailyRate: parseFloat(f.dailyRate.value)||0,
otRatePerHour: parseFloat(f.otRatePerHour.value)||0,
phone: f.phone.value,
status: f.status.value
};

if(code){
const existing = DB.laborers.find(x => x.code === code);
if(existing) Object.assign(existing, data);
} else {
DB.laborers.push(data);
}

saveDB();
closeModal();
render();
}

function openLaborPaymentForm(lCode){
const l = DB.laborers.find(x => x.code === lCode);
const bal = laborerBalance(lCode);

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
<div>
<h3 style="margin:0;">Pay Wages to ${esc(l ? l.name : 'Worker')}</h3>
<div style="font-size:.82rem;color:var(--muted);">ID: ${esc(lCode)} | Daily Rate: LKR ${fmt(l?l.dailyRate:0)}</div>
</div>
<div style="text-align:right;">
<div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;">Outstanding Wages Due</div>
<div style="font-size:1.2rem;font-weight:800;color:var(--red);">LKR ${fmt(bal)}</div>
</div>
</div>

<form onsubmit="saveLaborPayment(event,'${esc(lCode)}')">
<label>Payment Date *</label>
<input type="date" name="date" required value="${todayStr()}">

<label style="margin-top:8px;">Amount Paid (LKR) *</label>
<input type="number" step="0.01" required name="amount" value="${bal>0?bal:''}" placeholder="0.00" style="font-family:var(--font-mono);font-weight:700;">

<label style="margin-top:8px;">Payment Method *</label>
<select name="method">
<option value="Cash">Cash (Physical Cash)</option>
<option value="Bank Transfer">Bank Transfer / Online</option>
</select>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Record Wage Payment</button>
</div>
</form>
`);
}

function saveLaborPayment(e, lCode){
e.preventDefault();
const f = e.target;

DB.laborPayments.push({
id: uid('LP-'),
laborerCode: lCode,
date: f.date.value,
amount: parseFloat(f.amount.value)||0,
method: f.method.value
});

saveDB();
closeModal();
render();
}

function deleteLaborer(lCode){
if(!confirm('Delete worker profile '+lCode+'?')) return;
DB.laborers = DB.laborers.filter(x => x.code !== lCode);
saveDB();
render();
}

// ============================================================
// SALARIED HR (EXACT SCREENSHOT REDESIGN)
// ============================================================
currentHRMonth = 'August 2026';

