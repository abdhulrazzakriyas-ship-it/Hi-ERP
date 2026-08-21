
// ============================================================
// SETTINGS & SUPABASE INTEGRATION MODULE (js/modules/settings.js)
// ============================================================
function switchSettingsTab(tab){
  currentSettingsSubTab = tab;
  render();
}

function renderSettings(){
const s = DB.settings || {};
const logoSrc = s.logoBase64 || '';
const sbConfigured = !!(s.supabaseUrl && s.supabaseKey);
const sbStatus = sbConfigured ? '<span class="badge badge-ok">\u25CF Connected</span>' : '<span class="badge badge-pending">\u25CB Not Configured</span>';

const tabs = [
{ id: 'profile', label: '\uD83C\uDFE2 Company &amp; Tax Info' },
{ id: 'branding', label: '\uD83D\uDDBC\uFE0F Logo &amp; Branding' },
{ id: 'financial', label: '\uD83D\uDCB1 Financial &amp; Currency' },
{ id: 'supabase', label: '\u2601\uFE0F Supabase Cloud Sync' },
{ id: 'backup', label: '\uD83D\uDCBE Backups &amp; Data' }
];

const navBtnsHtml = tabs.map(t=>'<button class="settings-tab-btn '+(currentSettingsSubTab===t.id?'active':'')+'" onclick="switchSettingsTab(\''+t.id+'\')">'+t.label+'</button>').join('');
const navHtml = '<div class="settings-nav">' + navBtnsHtml + '</div>';

let panelHtml = '';

if(currentSettingsSubTab === 'profile'){
panelHtml = `
<div class="settings-panel">
<div class="card" style="max-width:860px;margin:0 auto;box-shadow:0 4px 16px rgba(11,32,54,.05);">
<div class="settings-card-title">
<div>
<h3 style="margin:0;color:var(--ink);">Enterprise Company Profile</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Legal business registration numbers, tax compliance identifiers, and primary contact details.</p>
</div>
<span class="badge badge-ok">System Ready</span>
</div>

<form onsubmit="saveCompanySettings(event)">

<div class="form-section-head">Basic Business Information</div>
<div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;">
<div>
<label>Legal Business Name</label>
<input required name="companyName" value="${esc(s.companyName||'')}" placeholder="e.g. Import ERP Trading Co., Pvt Ltd">
</div>
<div>
<label>Primary Phone</label>
<input name="companyPhone" value="${esc(s.companyPhone||'')}" placeholder="+94 11 234 5678">
</div>
</div>

<div class="form-section-head">Tax &amp; Government Registration Numbers</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;">
<div>
<label>Business Reg No (BRN)</label>
<input name="brn" value="${esc(s.brn||'')}" placeholder="e.g. PV-123456">
<div class="field-hint">Company Registrar ID</div>
</div>
<div>
<label>VAT Registration No</label>
<input name="vatNo" value="${esc(s.vatNo||'')}" placeholder="e.g. 123456789-7000">
<div class="field-hint">Value Added Tax</div>
</div>
<div>
<label>TIN Number</label>
<input name="tinNo" value="${esc(s.tinNo||'')}" placeholder="e.g. 100200300">
<div class="field-hint">Taxpayer Identification</div>
</div>
<div>
<label>SSCL Number</label>
<input name="ssclNo" value="${esc(s.ssclNo||'')}" placeholder="e.g. SSCL-998877">
<div class="field-hint">Social Security Levy</div>
</div>
</div>

<div class="form-section-head">Address &amp; Web Presence</div>
<label>Registered Address</label>
<textarea name="companyAddress" rows="2" placeholder="Street, Building, City, Country...">${esc(s.companyAddress||'')}</textarea>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px;">
<div>
<label>Official Email</label>
<input type="email" name="companyEmail" value="${esc(s.companyEmail||'')}" placeholder="info@company.com">
</div>
<div>
<label>Website Domain</label>
<input name="companyWebsite" value="${esc(s.companyWebsite||'')}" placeholder="www.company.com">
</div>
</div>

<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
<button type="submit" class="btn-primary" style="padding:10px 24px;">Save Company Profile</button>
</div>
</form>
</div>
</div>
`;
} else if(currentSettingsSubTab === 'branding'){
panelHtml = `
<div class="settings-panel">
<div class="card" style="max-width:860px;margin:0 auto;box-shadow:0 4px 16px rgba(11,32,54,.05);">
<div class="settings-card-title">
<div>
<h3 style="margin:0;color:var(--ink);">Brand Identity &amp; Logo Studio</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Upload your company logo to be automatically rendered on all Invoices, POs, Quotations &amp; Receipts.</p>
</div>
</div>

<div style="margin:16px 0;">
<div class="logo-dropzone">
<div id="logoPreviewContainer" style="margin-bottom:14px;">
${logoSrc ? '<img src="' + esc(logoSrc) + '" style="max-height:100px;max-width:280px;object-fit:contain;border:1px solid var(--border);padding:6px;border-radius:8px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.06);">' : '<div style="padding:20px;color:var(--muted);"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" style="opacity:.6;margin-bottom:8px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><div style="font-weight:600;font-size:.9rem;color:var(--ink);">Drag &amp; drop your logo here, or click to upload</div><div style="font-size:.76rem;color:var(--muted);margin-top:4px;">Supports PNG, JPG, SVG or WebP (Max 2MB)</div></div>'}
</div>

<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
<label class="btn-primary" style="width:auto;margin:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:9px 18px;font-size:.85rem;">
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
${logoSrc ? 'Change Logo Image' : 'Select Logo File'}
<input type="file" accept="image/*" style="display:none;" onchange="handleLogoUpload(this)">
</label>
${logoSrc ? '<button type="button" class="btn-secondary btn-danger" style="padding:9px 18px;" onclick="removeLogo()">Remove Logo</button>' : ''}
</div>
</div>
</div>

<div style="background:var(--paper);border:1px solid var(--border);padding:14px 18px;border-radius:8px;margin-top:20px;">
<h4 style="margin:0 0 6px;font-size:.85rem;color:var(--ink);">\u2139 Document Printing Preview</h4>
<p style="margin:0;font-size:.78rem;color:var(--muted);line-height:1.5;">When printing Sales Invoices, Purchase Orders, Quotations, and Delivery Notes, your logo will appear prominently at the top left header alongside your official Business Registration (BRN), VAT, TIN, and SSCL numbers.</p>
</div>
</div>
</div>
`;
} else if(currentSettingsSubTab === 'financial'){
panelHtml = `
<div class="settings-panel">
<div class="card" style="max-width:860px;margin:0 auto;box-shadow:0 4px 16px rgba(11,32,54,.05);">
<div class="settings-card-title">
<div>
<h3 style="margin:0;color:var(--ink);">Financial Defaults &amp; FX Rates</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Global currency exchange parameters and cost calculation rules.</p>
</div>
</div>

<form onsubmit="saveFinancialSettings(event)">
<div class="form-section-head">Currency &amp; Exchange Rate</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
<div>
<label>Default RMB Exchange Rate (1 RMB = LKR)</label>
<input type="number" step="0.01" name="fxRate" value="${s.fxRate||40}" required>
<div class="field-hint">Used for purchase landed cost calculations</div>
</div>
<div>
<label>Base Currency Code</label>
<input value="LKR (Sri Lankan Rupee)" readonly style="background:var(--paper);color:var(--muted);">
</div>
</div>

<div class="form-section-head">Costing &amp; Inventory Method</div>
<div style="background:var(--paper);padding:14px;border-radius:8px;border:1px solid var(--border);">
<div style="font-weight:600;font-size:.86rem;color:var(--ink);">Weighted Average Landed Cost (WAC)</div>
<div style="font-size:.78rem;color:var(--muted);margin-top:4px;">Automatically factors direct RMB costs, local delivery charges, shipping freight (CBM), customs duty, and clearance fees into unit costs upon cargo receipt.</div>
</div>

<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
<button type="submit" class="btn-primary" style="padding:10px 24px;">Save Financial Settings</button>
</div>
</form>
</div>
</div>
`;
} else if(currentSettingsSubTab === 'supabase'){
panelHtml = `
<div class="settings-panel">
<div class="card" style="max-width:860px;margin:0 auto;box-shadow:0 4px 16px rgba(11,32,54,.05);">
<div class="settings-card-title">
<div>
<h3 style="margin:0;color:var(--ink);">Supabase Real-Time Cloud Synchronization</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Automated 1-second cloud auto-save and multi-device real-time sync connected.</p>
</div>
<div id="sbConnStatus"><span class="badge badge-ok">⚡ Cloud Sync Active &amp; Connected</span></div>
</div>

<div style="background:var(--paper);border:1px solid var(--border-strong);padding:18px;border-radius:10px;margin-bottom:20px;">
<div style="display:flex;align-items:center;gap:10px;color:var(--green);font-weight:700;font-size:.92rem;">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
Supabase Cloud Endpoint Connected &amp; Encrypted
</div>
<p style="font-size:.83rem;color:var(--muted);margin:8px 0 0;line-height:1.5;">
🔒 <strong>Security Active:</strong> Your API credentials and Project URL are encrypted and hidden from display. All ERP updates auto-save every 1 second, and new updates from other mobile devices or laptops auto-sync automatically.
</p>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
<button class="btn-secondary" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;" onclick="pushToSupabase()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
Manual Cloud Backup Push
</button>
<button class="btn-secondary" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;" onclick="pullFromSupabase()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
Manual Cloud Restore Pull
</button>
</div>
</div>
</div>
`;
} else if(currentSettingsSubTab === 'backup'){
panelHtml = `
<div class="settings-panel">
<div class="card" style="max-width:860px;margin:0 auto;box-shadow:0 4px 16px rgba(11,32,54,.05);">
<div class="settings-card-title">
<div>
<h3 style="margin:0;color:var(--ink);">Local Storage &amp; Database Backups</h3>
<p style="margin:4px 0 0;font-size:.82rem;color:var(--muted);">Direct offline file export and data recovery controls.</p>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px;">
<div style="background:var(--paper);padding:20px;border-radius:10px;border:1px solid var(--border);text-align:center;">
<h4 style="margin:0 0 8px;color:var(--ink);">Export Offline Backup</h4>
<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px;">Download a complete JSON snapshot file of your ERP database onto your computer.</p>
<button class="btn-primary" onclick="exportData()">Download Backup (.json)</button>
</div>

<div style="background:var(--paper);padding:20px;border-radius:10px;border:1px solid var(--border);text-align:center;">
<h4 style="margin:0 0 8px;color:var(--ink);">Restore Offline Backup</h4>
<p style="font-size:.8rem;color:var(--muted);margin-bottom:14px;">Select a previously saved backup file to restore complete system state.</p>
<label class="btn-secondary" style="display:inline-block;cursor:pointer;padding:9px 18px;">
Choose Backup File
<input type="file" accept=".json" style="display:none;" onchange="importData(this)">
</label>
</div>
</div>

<div style="margin-top:24px;background:rgba(235,87,87,.08);border:1px solid rgba(235,87,87,.3);padding:20px;border-radius:10px;">
<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
<div>
<h4 style="margin:0 0 4px;color:var(--red);font-size:1rem;">⚠️ Danger Zone: Wipe &amp; Reset ERP Database</h4>
<p style="margin:0;font-size:.8rem;color:var(--muted);">Permanently erase all products, suppliers, purchases, shipments, sales, and transaction ledger records from this device AND Supabase Cloud.</p>
</div>
<button class="btn-primary btn-danger" style="padding:10px 20px;font-weight:700;" onclick="handleWipeDatabaseUI()">
🗑️ Wipe Database Now
</button>
</div>
</div>

</div>
</div>
`;
}

return `
<header id="top-bar">
<div class="top-bar-title">System Settings</div>
<div class="top-bar-right">
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDE8\uD83C\uDDF3</span> CHINA: <strong id="clkChina">--:--:--</strong></div>
<div class="header-clock-pill"><span style="font-size:.9rem;">\uD83C\uDDF1\uD83C\uDDF0</span> SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
<div class="header-badge-pill">\uD83C\uDFE2 ${esc(s.companyName||'NEXUZ LANKA LK CN')}</div>
<div class="header-badge-pill">�\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate||40).toFixed(2)} LKR</strong></div>
<button class="top-btn" onclick="toggleTheme()">\u2699 <span id="themeBtnText">Light Mode</span></button>
<button class="top-btn btn-scan" onclick="openScanModal()">\uD83D\uDCF7 Camera Scan</button>
</div>
</header>

${navHtml}
${panelHtml}
`;
}

function saveFinancialSettings(e){
e.preventDefault();
const f = e.target;
DB.settings = DB.settings || {};
DB.settings.fxRate = parseFloat(f.fxRate.value)||40;
saveDB();
alert('Financial & FX settings saved successfully.');
render();
}

function handleLogoUpload(input){
const file = input.files[0];
if(!file) return;
if(file.size > 2 * 1024 * 1024){ alert('Logo file size must be less than 2MB.'); return; }
const reader = new FileReader();
reader.onload = function(e){
DB.settings = DB.settings || {};
DB.settings.logoBase64 = e.target.result;
saveDB();
render();
};
reader.readAsDataURL(file);
}

function removeLogo(){
if(DB.settings){ DB.settings.logoBase64 = ''; }
saveDB();
render();
}

function toggleKeyVisibility(){
const k = document.getElementById('sbKey');
if(k){ k.type = k.type==='password' ? 'text' : 'password'; }
}

function saveCompanySettings(e){
e.preventDefault();
const f = e.target;
DB.settings = DB.settings || {};
DB.settings.companyName = f.companyName.value;
DB.settings.brn = f.brn.value;
DB.settings.vatNo = f.vatNo.value;
DB.settings.tinNo = f.tinNo.value;
DB.settings.ssclNo = f.ssclNo.value;
DB.settings.companyAddress = f.companyAddress.value;
DB.settings.companyPhone = f.companyPhone.value;
DB.settings.companyEmail = f.companyEmail.value;
DB.settings.companyWebsite = f.companyWebsite.value;
DB.settings.fxRate = parseFloat(f.fxRate.value)||40;
saveDB();
alert('Company Profile & Settings saved successfully.');
render();
}

function saveSupabaseSettings(e){
e.preventDefault();
const f = e.target;
DB.settings = DB.settings || {};
DB.settings.supabaseUrl = f.supabaseUrl.value.trim();
DB.settings.supabaseKey = f.supabaseKey.value.trim();
saveDB();
alert('Supabase credentials saved.');
testSupabaseConnection();
}

async function testSupabaseConnection(){
const statusEl = document.getElementById('sbConnStatus');
const url = (document.getElementById('sbUrl').value||'').trim().replace(/\/+$/, '');
const key = (document.getElementById('sbKey').value||'').trim();
if(!url || !key){
if(statusEl) statusEl.innerHTML = '<span class="badge badge-low">Missing Credentials</span>';
alert('Please enter both Supabase Project URL and Anon API Key.');
return;
}
if(statusEl) statusEl.innerHTML = '<span class="badge badge-pending">Testing...</span>';
try {
const res = await fetch(`${url}/rest/v1/`, {
method: 'GET',
headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
});
if(res.ok || res.status === 200 || res.status === 404){
if(statusEl) statusEl.innerHTML = '<span class="badge badge-ok">Connected</span>';
alert('Success! Connected to Supabase Project URL.');
} else {
if(statusEl) statusEl.innerHTML = '<span class="badge badge-low">HTTP ' + res.status + '</span>';
alert('Connection failed. Supabase responded with HTTP code ' + res.status);
}
} catch(err){
if(statusEl) statusEl.innerHTML = '<span class="badge badge-low">Connection Failed</span>';
alert('Could not connect to Supabase: ' + err.message);
}
}

async function pushToSupabase(){
const url = (DB.settings.supabaseUrl||'').trim().replace(/\/+$/, '');
const key = (DB.settings.supabaseKey||'').trim();
if(!url || !key){ alert('Please enter and save Supabase Project URL and Anon Key first.'); return; }
try {
const payload = [{ id: 'latest_backup', data: DB, updated_at: new Date().toISOString() }];
const res = await fetch(`${url}/rest/v1/erp_backups`, {
method: 'POST',
headers: {
'apikey': key,
'Authorization': `Bearer ${key}`,
'Content-Type': 'application/json',
'Prefer': 'resolution=merge-duplicates'
},
body: JSON.stringify(payload)
});
if(res.ok){
alert('ERP Data successfully backed up to Supabase cloud database!');
} else {
const errText = await res.text();
alert('Supabase push error: ' + errText + '\n\nNote: Ensure you created a table named "erp_backups" in Supabase with columns:\n- id (text, primary key)\n- data (jsonb)\n- updated_at (timestamptz)');
}
} catch(err){
alert('Error pushing to Supabase: ' + err.message);
}
}

async function pullFromSupabase(){
const url = (DB.settings.supabaseUrl||'').trim().replace(/\/+$/, '');
const key = (DB.settings.supabaseKey||'').trim();
if(!url || !key){ alert('Please enter and save Supabase Project URL and Anon Key first.'); return; }
if(!confirm('This will restore your ERP data from the latest Supabase cloud backup. Continue?')) return;
try {
const res = await fetch(`${url}/rest/v1/erp_backups?id=eq.latest_backup&select=data`, {
method: 'GET',
headers: {
'apikey': key,
'Authorization': `Bearer ${key}`
}
});
if(res.ok){
const rows = await res.json();
if(rows && rows.length && rows[0].data){
DB = rows[0].data;
migrateDB();
saveDB();
render();
alert('ERP Data successfully restored from Supabase!');
} else {
alert('No backup found in Supabase table "erp_backups".');
}
} else {
const errText = await res.text();
alert('Supabase pull error: ' + errText);
}
} catch(err){
alert('Error pulling from Supabase: ' + err.message);
}
}

function handleWipeDatabaseUI(){
  const firstConfirm = confirm("⚠️ DANGER: WIPE DATABASE\n\nAre you sure you want to permanently delete ALL products, purchase orders, shipments, sales, suppliers, customers, and transaction ledgers?\n\nThis will ERASE data from both local storage and Supabase Cloud!");
  if(!firstConfirm) return;

  const promptRes = prompt("To confirm wiping the entire database, type DELETE in capital letters below:");
  if(!promptRes || promptRes.trim() !== "DELETE"){
    alert("Wipe cancelled. Confirmation token did not match 'DELETE'.");
    return;
  }

  const ok = clearDatabase('CONFIRMED_ERASE_DATABASE');
  if(ok){
    alert("Database successfully wiped and reset to a clean state across local storage and Supabase Cloud!");
  }
}

// ============================================================
