function renderHR(){
const s = DB.settings || {};
const months = ['August 2026', 'September 2026', 'October 2026', 'July 2026', 'June 2026', 'May 2026'];

const rows = (DB.employees || []).map(e => {
return `
<tr>
<td><strong style="font-family:var(--font-mono);color:var(--harbor);">${esc(e.code)}</strong></td>
<td><strong>${esc(e.name)}</strong></td>
<td>${esc(e.department || 'Operations')}</td>
<td>${esc(e.designation || 'Staff')}</td>
<td style="font-family:var(--font-mono);font-weight:700;">LKR ${fmt(e.basicSalary)}</td>
<td style="font-size:.8rem;color:var(--muted);">${esc(e.notes || '\u2014')}</td>
<td style="white-space:nowrap;">
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Process Individual Salary" onclick="openPayrollModal('${esc(e.code)}')">
?? Process Salary
</button>
<button class="btn-secondary" style="padding:6px 10px;margin-right:4px;" title="Edit Employee" onclick="openEmployeeForm('${esc(e.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
</button>
<button class="btn-secondary btn-danger" style="padding:6px 10px;" title="Delete Employee" onclick="deleteEmployee('${esc(e.code)}')">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
</button>
</td>
</tr>
`;
}).join('');

return `
<header id="top-bar">
<div class="top-bar-title">Salaried HR</div>
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
<strong style="font-size:.9rem;">Payroll Month:</strong>
<select onchange="currentHRMonth=this.value; render();" style="margin:0;height:38px;padding-right:30px;">
${months.map(m => '<option value="'+esc(m)+'" '+(currentHRMonth===m?'selected':'')+'>'+esc(m)+'</option>').join('')}
</select>
</div>
<div style="display:flex;gap:10px;">
<button class="btn-secondary" onclick="openMonthlyPayrollModal()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 18px;font-size:.9rem;font-weight:700;">
?? Run Monthly Payroll
</button>
<button class="btn-primary" onclick="openEmployeeForm()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
+ Add Employee
</button>
</div>
</div>

<!-- MAIN CARD -->
<div class="card">
<h3 style="margin-bottom:16px;">Salaried Employee Roster</h3>
<table>
<thead>
<tr>
<th>EMPLOYEE ID</th>
<th>FULL NAME</th>
<th>DEPARTMENT</th>
<th>DESIGNATION</th>
<th>MONTHLY BASIC SALARY (LKR)</th>
<th>PRIVATE NOTES</th>
<th>ACTIONS</th>
</tr>
</thead>
<tbody>
${rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px;">No salaried employees registered yet. Click "+ Add Employee" to add.</td></tr>'}
</tbody>
</table>
</div>
`;
}

function openEmployeeForm(code){
const e = code ? DB.employees.find(x => x.code === code) : null;
const eId = e ? e.code : nextCode('EMP-', 'employee', 3);

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Register Salaried Employee</h3>
</div>

<form onsubmit="saveEmployee(event, '${code?esc(code):''}')">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<div>
<label>Employee ID *</label>
<input required name="code" value="${esc(eId)}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Employee Full Name *</label>
<input required name="name" value="${e?esc(e.name):''}" placeholder="Employee Full Name *">
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Department</label>
<input name="department" value="${e?esc(e.department):''}" placeholder="Sales, Operations...">
</div>
<div>
<label>Designation</label>
<input name="designation" value="${e?esc(e.designation):''}" placeholder="Assistant, Driver...">
</div>
</div>

<div style="margin-top:8px;">
<label>Monthly Basic Salary (LKR) *</label>
<input type="number" step="0.01" required name="basicSalary" value="${e ? e.basicSalary : ''}" placeholder="0.00" style="font-family:var(--font-mono);font-weight:700;">
</div>

<div style="margin-top:8px;">
<label>Private Notes / Comments</label>
<textarea name="notes" rows="2" placeholder="Private internal notes...">${e?esc(e.notes):''}</textarea>
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Save Profile</button>
</div>
</form>
`);
}

function saveEmployee(ev, code){
ev.preventDefault();
const f = ev.target;
const data = {
code: f.code.value,
name: f.name.value,
department: f.department.value,
designation: f.designation.value,
basicSalary: parseFloat(f.basicSalary.value)||0,
notes: f.notes.value,
status: 'Active'
};

if(code){
const existing = DB.employees.find(x => x.code === code);
if(existing) Object.assign(existing, data);
} else {
DB.employees.push(data);
}

saveDB();
closeModal();
render();
}

function deleteEmployee(code){
if(!confirm('Delete employee record '+code+'?')) return;
DB.employees = DB.employees.filter(x => x.code !== code);
saveDB();
render();
}

function openPayrollModal(code){
const emp = DB.employees.find(x => x.code === code);
openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Process Salary Payout - ${esc(emp ? emp.name : 'Staff')}</h3>
</div>

<form onsubmit="savePayroll(event,'${esc(code)}')">
<label>Payroll Month *</label>
<input type="text" name="month" required value="${esc(currentHRMonth)}">

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
<div>
<label>Basic Salary (LKR)</label>
<input type="number" name="basic" value="${emp ? emp.basicSalary : 0}" readonly style="font-family:var(--font-mono);font-weight:700;">
</div>
<div>
<label>Allowances / Bonus (LKR)</label>
<input type="number" step="0.01" name="allowances" value="0" placeholder="0.00">
</div>
</div>

<div style="margin-top:8px;">
<label>Deductions (LKR)</label>
<input type="number" step="0.01" name="deductions" value="0" placeholder="0.00">
</div>

<div class="modal-actions" style="margin-top:20px;">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="submit" class="btn-primary" style="padding:9px 24px;">Pay Salary</button>
</div>
</form>
`);
}

function openMonthlyPayrollModal(){
const active = DB.employees.filter(e => e.status !== 'Inactive');
if(!active.length){
alert('No active salaried employees to process payroll for.');
return;
}

const rowsHtml = active.map(e => `
<tr>
<td><strong>${esc(e.name)}</strong> (${esc(e.code)})</td>
<td style="font-family:var(--font-mono);">LKR ${fmt(e.basicSalary)}</td>
<td><input type="number" step="0.01" id="mAllow_${e.code}" value="0" style="width:100px;margin:0;"></td>
<td><input type="number" step="0.01" id="mDeduc_${e.code}" value="0" style="width:100px;margin:0;"></td>
</tr>
`).join('');

openModal(`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
<h3 style="margin:0;">Run Monthly Payroll - ${esc(currentHRMonth)}</h3>
</div>

<div style="background:var(--paper);border:1px solid var(--border-strong);border-radius:10px;padding:14px;margin-bottom:16px;">
<table>
<thead>
<tr>
<th>EMPLOYEE</th>
<th>BASIC SALARY</th>
<th>ALLOWANCE</th>
<th>DEDUCTION</th>
</tr>
</thead>
<tbody>${rowsHtml}</tbody>
</table>
</div>

<div class="modal-actions">
<button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
<button type="button" class="btn-primary" style="padding:9px 24px;" onclick="processAllMonthlySalaries()">Process All Salaries</button>
</div>
`);
}

function processAllMonthlySalaries(){
const active = DB.employees.filter(e => e.status !== 'Inactive');
active.forEach(e => {
const allowEl = document.getElementById(`mAllow_${e.code}`);
const deducEl = document.getElementById(`mDeduc_${e.code}`);
const allow = allowEl ? (parseFloat(allowEl.value)||0) : 0;
const deduc = deducEl ? (parseFloat(deducEl.value)||0) : 0;
const net = e.basicSalary + allow - deduc;

DB.payrollPayments.push({
id: uid('PAY-'),
employeeCode: e.code,
month: currentHRMonth,
basic: e.basicSalary,
allowance: allow,
deduction: deduc,
netAmount: net,
date: todayStr()
});
});

saveDB();
closeModal();
render();
showScanToast(`Payroll for ${currentHRMonth} processed successfully!`, 'success');
}

function savePayroll(e, code){
e.preventDefault();
const f = e.target;
const net = (parseFloat(f.basic.value)||0) + (parseFloat(f.allowances.value)||0) - (parseFloat(f.deductions.value)||0);

DB.payrollPayments.push({
id: uid('PAY-'),
employeeCode: code,
month: f.month.value,
netAmount: net,
date: todayStr()
});

saveDB();
closeModal();
render();
showScanToast(`Salary payout of LKR ${fmt(net)} recorded!`, 'success');
}

// ============================================================
// FINANCIAL STATEMENTS (EXACT SCREENSHOT REDESIGN)
// ============================================================
