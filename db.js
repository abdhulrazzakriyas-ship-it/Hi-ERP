// ============================================================
// DATABASE & STORAGE LAYER (js/db.js)
// ============================================================
const STORAGE_KEY = 'importERP_v1';
let storageOK = true;

let DB = {
  seq: { product:0, supplier:0, purchase:0, shipment:0, sale:0, customer:0, laborer:0, delivery:0, quotation:0, employee:0 },
  products: [], suppliers: [], purchases: [], purchaseItems: [],
  shipments: [], shipmentLinks: [], stockLedger: [], sales: [], saleItems: [],
  customers: [], customerPayments: [], supplierPayments: [],
  expenses: [], laborers: [], laborAttendance: [], laborPayments: [], deliveries: [], scanLog: [],
  quotations: [], quoteItems: [], customerReturns: [], supplierReturns: [],
  employees: [], leaveRecords: [], payrollPayments: [], paymentVouchers: [],
  settings: { fxRate: 40, companyName:'NEXUZ LANKA LK CN', companyAddress:'123 Logistics Way, Colombo, Sri Lanka', companyPhone:'+94 11 234 5678', companyEmail:'info@importerp.com', vatNo:'123456789-7000', tinNo:'100200300', brn:'PV-123456', ssclNo:'SSCL-998877' }
};

const SUPABASE_PROJECT_URL = 'https://huhqzccyfgklxdgxbinm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aHF6Y2N5ZmdrbHhkZ3hiaW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTI0ODAsImV4cCI6MjEwMjcyODQ4MH0.2PGv-snR60gzk1w3sYLX2mpAWHlh8Eem3klWcxeK-gM';
let lastRemoteUpdatedAt = '';
let isSyncingToCloud = false;

function getItemKey(item, type) {
  if (!item || typeof item !== 'object') return null;
  if (item.code) return String(item.code);
  if (item.id) return String(item.id);
  if (item.purchaseNo) return String(item.purchaseNo) + (item.productCode ? '_' + item.productCode : '');
  if (item.saleNo) return String(item.saleNo) + (item.productCode ? '_' + item.productCode : '');
  if (item.shipmentNo) return String(item.shipmentNo) + (item.purchaseNo ? '_' + item.purchaseNo : '');
  if (item.quoteNo) return String(item.quoteNo) + (item.productCode ? '_' + item.productCode : '');
  if (item.returnNo) return String(item.returnNo);
  if (item.deliveryNo) return String(item.deliveryNo);
  if (item.voucherNo) return String(item.voucherNo);
  if (item.barcode) return String(item.barcode);
  if (item.name) return String(item.name);
  return JSON.stringify(item);
}

function mergeArrays(localArr, remoteArr, type) {
  const map = new Map();
  
  (localArr || []).forEach(item => {
    if (!item) return;
    const k = getItemKey(item, type);
    if (k) map.set(k, item);
  });
  
  (remoteArr || []).forEach(item => {
    if (!item) return;
    const k = getItemKey(item, type);
    if (k) {
      if (map.has(k)) {
        const existing = map.get(k);
        map.set(k, Object.assign({}, existing, item));
      } else {
        map.set(k, item);
      }
    }
  });
  
  return Array.from(map.values());
}

function mergeSeq(localSeq, remoteSeq) {
  const merged = Object.assign({}, localSeq || {}, remoteSeq || {});
  const keys = ['product','supplier','purchase','shipment','sale','customer','laborer','delivery','quotation','employee'];
  keys.forEach(k => {
    merged[k] = Math.max(
      Number((localSeq && localSeq[k]) || 0),
      Number((remoteSeq && remoteSeq[k]) || 0)
    );
  });
  return merged;
}

function mergeDatabases(localDB, remoteDB) {
  if (!remoteDB || typeof remoteDB !== 'object') return localDB || DB;
  if (!localDB || typeof localDB !== 'object') return remoteDB || DB;

  const mergedSettings = Object.assign({}, (localDB && localDB.settings) || {}, (remoteDB && remoteDB.settings) || {});
  mergedSettings.supabaseUrl = SUPABASE_PROJECT_URL;
  mergedSettings.supabaseKey = SUPABASE_ANON_KEY;

  const merged = {
    seq: mergeSeq(localDB ? localDB.seq : null, remoteDB ? remoteDB.seq : null),
    settings: mergedSettings
  };

  const arrayKeys = [
    'products', 'suppliers', 'purchases', 'purchaseItems',
    'shipments', 'shipmentLinks', 'stockLedger', 'sales', 'saleItems',
    'customers', 'customerPayments', 'supplierPayments',
    'expenses', 'laborers', 'laborAttendance', 'laborPayments', 'deliveries', 'scanLog',
    'quotations', 'quoteItems', 'customerReturns', 'supplierReturns',
    'employees', 'leaveRecords', 'payrollPayments', 'paymentVouchers'
  ];

  arrayKeys.forEach(k => {
    merged[k] = mergeArrays(localDB ? localDB[k] : [], remoteDB ? remoteDB[k] : [], k);
  });

  return merged;
}

function loadDB(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object') {
        DB = parsed;
        migrateDB();
      }
    }
  }catch(e){
    console.error("Local storage load warning:", e);
    try {
      const snapshot = localStorage.getItem('importERP_emergency_snapshot');
      if(snapshot){
        DB = JSON.parse(snapshot);
        migrateDB();
      }
    } catch(backupErr){}
  }

  if(!DB.settings) DB.settings = {};
  DB.settings.supabaseUrl = SUPABASE_PROJECT_URL;
  DB.settings.supabaseKey = SUPABASE_ANON_KEY;

  pullLatestFromSupabase(true);
  startSupabaseAutoPullLoop();
}

let lastLocalSaveTime = 0;

function clearDatabase(confirmedToken){
  if(confirmedToken !== 'CONFIRMED_ERASE_DATABASE'){
    console.warn("clearDatabase blocked: Requires explicit confirmation token.");
    return false;
  }
  // Always create an emergency snapshot before clearing
  try {
    localStorage.setItem('importERP_emergency_backup_' + Date.now(), JSON.stringify(DB));
  } catch(e){}

  const savedSettings = Object.assign({}, DB ? DB.settings : {});

  DB = {
    seq: { product:0, supplier:0, purchase:0, shipment:0, sale:0, customer:0, laborer:0, delivery:0, quotation:0, employee:0 },
    products: [], suppliers: [], purchases: [], purchaseItems: [],
    shipments: [], shipmentLinks: [], stockLedger: [], sales: [], saleItems: [],
    customers: [], customerPayments: [], supplierPayments: [],
    expenses: [], laborers: [], laborAttendance: [], laborPayments: [], deliveries: [], scanLog: [],
    quotations: [], quoteItems: [], customerReturns: [], supplierReturns: [],
    employees: [], leaveRecords: [], payrollPayments: [], paymentVouchers: [],
    settings: savedSettings
  };
  saveDB();
  autoSyncToSupabase();
  if(typeof render === 'function') render();
  return true;
}

function migrateDB(){
  if(!DB.products || !Array.isArray(DB.products)) DB.products = [];
  if(!DB.suppliers || !Array.isArray(DB.suppliers)) DB.suppliers = [];
  if(!DB.purchases || !Array.isArray(DB.purchases)) DB.purchases = [];
  if(!DB.purchaseItems || !Array.isArray(DB.purchaseItems)) DB.purchaseItems = [];
  if(!DB.shipments || !Array.isArray(DB.shipments)) DB.shipments = [];
  if(!DB.shipmentLinks || !Array.isArray(DB.shipmentLinks)) DB.shipmentLinks = [];
  if(!DB.stockLedger || !Array.isArray(DB.stockLedger)) DB.stockLedger = [];
  if(!DB.sales || !Array.isArray(DB.sales)) DB.sales = [];
  if(!DB.saleItems || !Array.isArray(DB.saleItems)) DB.saleItems = [];
  if(!DB.customers || !Array.isArray(DB.customers)) DB.customers = [];
  if(!DB.customerPayments || !Array.isArray(DB.customerPayments)) DB.customerPayments = [];
  if(!DB.supplierPayments || !Array.isArray(DB.supplierPayments)) DB.supplierPayments = [];
  if(!DB.expenses || !Array.isArray(DB.expenses)) DB.expenses = [];
  if(!DB.laborers || !Array.isArray(DB.laborers)) DB.laborers = [];
  if(!DB.laborAttendance || !Array.isArray(DB.laborAttendance)) DB.laborAttendance = [];
  if(!DB.laborPayments || !Array.isArray(DB.laborPayments)) DB.laborPayments = [];
  if(!DB.deliveries || !Array.isArray(DB.deliveries)) DB.deliveries = [];
  if(!DB.scanLog || !Array.isArray(DB.scanLog)) DB.scanLog = [];
  if(!DB.quotations || !Array.isArray(DB.quotations)) DB.quotations = [];
  if(!DB.quoteItems || !Array.isArray(DB.quoteItems)) DB.quoteItems = [];
  if(!DB.customerReturns || !Array.isArray(DB.customerReturns)) DB.customerReturns = [];
  if(!DB.supplierReturns || !Array.isArray(DB.supplierReturns)) DB.supplierReturns = [];
  if(!DB.employees || !Array.isArray(DB.employees)) DB.employees = [];
  if(!DB.leaveRecords || !Array.isArray(DB.leaveRecords)) DB.leaveRecords = [];
  if(!DB.payrollPayments || !Array.isArray(DB.payrollPayments)) DB.payrollPayments = [];
  if(!DB.paymentVouchers || !Array.isArray(DB.paymentVouchers)) DB.paymentVouchers = [];
  if(!DB.settings || typeof DB.settings !== 'object') DB.settings = {};
  if(DB.settings.fxRate===undefined) DB.settings.fxRate = 40;
  if(DB.settings.companyName===undefined) DB.settings.companyName = 'NEXUZ LANKA LK CN';
  if(DB.settings.logoBase64===undefined) DB.settings.logoBase64 = '';
  if(DB.settings.brn===undefined) DB.settings.brn = 'PV-123456';
  if(DB.settings.vatNo===undefined) DB.settings.vatNo = '123456789-7000';
  if(DB.settings.tinNo===undefined) DB.settings.tinNo = '100200300';
  if(DB.settings.ssclNo===undefined) DB.settings.ssclNo = 'SSCL-998877';
  if(DB.settings.companyAddress===undefined) DB.settings.companyAddress = '123 Logistics Way, Colombo, Sri Lanka';
  if(DB.settings.companyPhone===undefined) DB.settings.companyPhone = '+94 11 234 5678';
  if(DB.settings.companyEmail===undefined) DB.settings.companyEmail = 'info@importerp.com';
  if(!DB.seq) DB.seq = {};
  ['product','supplier','purchase','shipment','sale','customer','laborer','delivery','quotation','employee'].forEach(k=>{
    if(DB.seq[k]===undefined) DB.seq[k]=0;
  });
  (DB.sales||[]).forEach(function(s){
    if(s && s.paymentStatus===undefined) s.paymentStatus='Paid';
    if(s && s.amountPaid===undefined){
      const items = (DB.saleItems||[]).filter(function(i){ return i && i.saleNo===s.saleNo; });
      s.amountPaid = items.reduce(function(t,i){ return t+i.qty*i.unitPrice; }, 0);
    }
  });
  (DB.purchases||[]).forEach(function(p){
    if(p && p.paymentStatus===undefined) p.paymentStatus='Paid';
    if(p && p.localDeliveryChargeRMB===undefined) p.localDeliveryChargeRMB = 0;
    if(p && p.amountPaidRMB===undefined){
      const items = (DB.purchaseItems||[]).filter(function(i){ return i && i.purchaseNo===p.purchaseNo; });
      p.amountPaidRMB = items.reduce(function(t,i){ return t+i.qty*i.unitPriceRMB; }, 0) + (p.localDeliveryChargeRMB||0);
    }
  });
  (DB.shipmentLinks||[]).forEach(function(l){
    if(l && l.cbmRateLKR===undefined) l.cbmRateLKR = 0;
    if(l && l.lumpSumLKR===undefined) l.lumpSumLKR = 0;
    if(l && l.chargeMethod===undefined) l.chargeMethod = 'cbm';
  });
}

let _supabaseSyncDebounce = null;
function saveDB(){
  lastLocalSaveTime = Date.now();
  try{
    const json = JSON.stringify(DB);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem('importERP_emergency_snapshot', json);
  } catch(e){ storageOK = false; }

  clearTimeout(_supabaseSyncDebounce);
  _supabaseSyncDebounce = setTimeout(autoSyncToSupabase, 20);
}

async function autoSyncToSupabase(){
  if(isSyncingToCloud) return;
  const url = (DB && DB.settings && DB.settings.supabaseUrl ? DB.settings.supabaseUrl : SUPABASE_PROJECT_URL).trim().replace(/\/+$/, '');
  const key = (DB && DB.settings && DB.settings.supabaseKey ? DB.settings.supabaseKey : SUPABASE_ANON_KEY).trim();
  if(!url || !key) return;

  isSyncingToCloud = true;
  try {
    const nowIso = new Date().toISOString();
    lastRemoteUpdatedAt = nowIso;
    const payload = [{ id: 'latest_backup', data: DB, updated_at: nowIso }];
    await fetch(`${url}/rest/v1/erp_backups`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch(err){
    console.warn("Supabase background push error:", err);
  } finally {
    isSyncingToCloud = false;
  }
}

async function pullLatestFromSupabase(forceRender){
  if(isSyncingToCloud) return;
  if(!forceRender && (Date.now() - lastLocalSaveTime < 4000)) return;

  const url = (DB && DB.settings && DB.settings.supabaseUrl ? DB.settings.supabaseUrl : SUPABASE_PROJECT_URL).trim().replace(/\/+$/, '');
  const key = (DB && DB.settings && DB.settings.supabaseKey ? DB.settings.supabaseKey : SUPABASE_ANON_KEY).trim();
  if(!url || !key) return;

  try {
    const res = await fetch(`${url}/rest/v1/erp_backups?id=eq.latest_backup&select=data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if(res.ok){
      const rows = await res.json();
      if(rows && rows.length && rows[0].data){
        const remoteTime = rows[0].updated_at || '';
        const remoteDB = rows[0].data;
        if(remoteTime !== lastRemoteUpdatedAt || forceRender){
          lastRemoteUpdatedAt = remoteTime;

          if(Date.now() - lastLocalSaveTime < 4000){
            autoSyncToSupabase();
            return;
          }

          DB = remoteDB;
          migrateDB();
          try{
            const json = JSON.stringify(DB);
            localStorage.setItem(STORAGE_KEY, json);
            localStorage.setItem('importERP_emergency_snapshot', json);
          }catch(e){}

          if(typeof render === 'function') render();
        }
      }
    }
  } catch(err){
    console.warn("Supabase background pull error:", err);
  }
}

function startSupabaseAutoPullLoop(){
  setInterval(function(){
    pullLatestFromSupabase(false);
  }, 2000);
}

// Instant wake-up sync when opening app tab or unlocking mobile phone screen
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible'){
      pullLatestFromSupabase(true);
    }
  });
}
if (typeof window !== 'undefined') {
  window.addEventListener('focus', function(){
    pullLatestFromSupabase(true);
  });
}

function seedData(){
  // Demo database seeding disabled for clean production mode
  return;
}

function exportData(){
  const blob = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'import-erp-backup-'+todayStr()+'.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const data = JSON.parse(e.target.result);
      if(!confirm('This will merge backup data into your ERP database. Continue?')) return;
      
      // Save emergency snapshot before import
      try { localStorage.setItem('importERP_pre_import_backup_' + Date.now(), JSON.stringify(DB)); } catch(err){}
      
      DB = mergeDatabases(DB, data);
      migrateDB();
      saveDB();
      render();
      alert('Data imported and merged successfully.');
    }catch(err){ alert('That file could not be read as a backup.'); }
  };
  reader.readAsText(file);
  input.value = '';
}

function customerBalance(customerCode){
  if(!customerCode) return 0;
  return (DB.sales||[]).filter(function(s){ return s && s.customerCode===customerCode; }).reduce(function(sum, s){
    const items = (DB.saleItems||[]).filter(function(i){ return i && i.saleNo===s.saleNo; });
    const total = items.reduce(function(t,i){ return t + (i.qty * i.unitPrice); }, 0);
    return sum + (total - (s.amountPaid||0));
  }, 0);
}
const customerOutstandingBalance = customerBalance;

function supplierOutstandingBalance(supplierCode){
  if(!supplierCode) return 0;
  return (DB.purchases||[]).filter(function(p){ return p && p.supplierCode===supplierCode; }).reduce(function(sum, p){
    const items = (DB.purchaseItems||[]).filter(function(i){ return i && i.purchaseNo===p.purchaseNo; });
    const total = items.reduce(function(t,i){ return t + (i.qty * i.unitPriceRMB); }, 0) + (p.localDeliveryChargeRMB||0);
    return sum + (total - (p.amountPaidRMB||0));
  }, 0);
}

function laborerBalance(laborerCode){
  const laborer = DB.laborers.find(function(l){ return l.code===laborerCode; });
  if(!laborer) return 0;
  const earned = DB.laborAttendance.filter(function(a){ return a.laborerCode===laborerCode; }).reduce(function(sum,a){
    const dayPay = a.status==='Present'?laborer.dailyRate:(a.status==='Half-Day'?laborer.dailyRate/2:0);
    const otPay = (a.overtimeHours||0)*(laborer.otRatePerHour||0);
    return sum + dayPay + otPay;
  },0);
  const paid = DB.laborPayments.filter(function(p){ return p.laborerCode===laborerCode; }).reduce(function(s,p){ return s+p.amount; },0);
  return earned - paid;
}

function calculateAccountBookBalances(){
  let cashIn = 0, cashOut = 0, bankIn = 0, bankOut = 0;

  (DB.paymentVouchers || []).forEach(v => {
    const isReceipt = v.voucherType && v.voucherType.indexOf('Receipt') >= 0;
    const isCash = v.method && v.method.indexOf('Cash') >= 0;
    const amt = v.amountLKR || 0;

    if(isCash){
      if(isReceipt) cashIn += amt;
      else cashOut += amt;
    } else {
      if(isReceipt) bankIn += amt;
      else bankOut += amt;
    }
  });

  (DB.sales || []).forEach(s => {
    const paid = s.amountPaid || 0;
    cashIn += paid;
  });

  (DB.expenses || []).forEach(e => {
    const amt = e.amount || 0;
    if(e.paymentMethod === 'Cash') cashOut += amt;
    else bankOut += amt;
  });

  const cashBalance = cashIn - cashOut;
  const bankBalance = bankIn - bankOut;

  return { cashBalance, bankBalance };
}

