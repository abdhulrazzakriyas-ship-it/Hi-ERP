// ============================================================
// MAIN WEB APP ROUTER & CONTROLLER (js/app.js)
// ============================================================

// GLOBAL SYSTEM STATE VARIABLES
let activeSalesCartItems = [];
let salesRegisterDiscount = 0;
let currentPoFormItems = [];
let currentQuoteFormItems = [];
let barcodeSpotlightTimer = null;
let spotlightSecondsLeft = 120;
let lastScannedCode = '';
let lastScanTime = 0;
let currentHRMonth = 'August 2026';
let currentLaborAttendanceDate = todayStr();
let deliverySearchFilter = '';
let quotationSearchFilter = '';
let purchaseSearchFilter = '';
let supplierSearchFilter = '';
let customerSearchFilter = '';
let productSearchFilter = '';
let currentSettingsSubTab = 'profile';
let activeScannerMode = 'camera';
let currentCameraStream = null;
let cameraDetectAnimFrame = null;
let html5QrCodeScanner = null;
let barcodeBuffer = '';
let lastKeyTime = 0;
let labelQty = 12, labelSize = 'medium', selectedProductCode = '';
let currentProductImageBase64 = '';

let currentTab = 'dashboard';

function toggleMobileSidebar(){
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('mobile-drawer-backdrop');
  if(sb) sb.classList.toggle('mobile-open');
  if(bd) bd.classList.toggle('mobile-open');
}

function closeMobileSidebar(){
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('mobile-drawer-backdrop');
  if(sb) sb.classList.remove('mobile-open');
  if(bd) bd.classList.remove('mobile-open');
}

function showTab(tab){
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active', el.dataset.tab===tab));
  closeMobileSidebar();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render(){
  try {
    const vc = document.getElementById('view-container');
    if(!vc) return;
    const map = {
      dashboard: typeof renderDashboard === 'function' ? renderDashboard : null,
      products: typeof renderProducts === 'function' ? renderProducts : null,
      suppliers: typeof renderSuppliers === 'function' ? renderSuppliers : null,
      customers: typeof renderCustomers === 'function' ? renderCustomers : null,
      purchases: typeof renderPurchases === 'function' ? renderPurchases : null,
      cargo: typeof renderCargo === 'function' ? renderCargo : null,
      landedcost: typeof renderLandedCost === 'function' ? renderLandedCost : null,
      inventory: typeof renderInventory === 'function' ? renderInventory : null,
      labels: typeof renderLabels === 'function' ? renderLabels : null,
      quotations: typeof renderQuotations === 'function' ? renderQuotations : null,
      sales: typeof renderSales === 'function' ? renderSales : null,
      delivery: typeof renderDelivery === 'function' ? renderDelivery : null,
      payments: typeof renderPayments === 'function' ? renderPayments : null,
      expenses: typeof renderExpenses === 'function' ? renderExpenses : null,
      labor: typeof renderLabor === 'function' ? renderLabor : null,
      hr: typeof renderHR === 'function' ? renderHR : null,
      returns: typeof renderReturns === 'function' ? renderReturns : null,
      financial: typeof renderFinancial === 'function' ? renderFinancial : null,
      reports: typeof renderReports === 'function' ? renderReports : null,
      settings: typeof renderSettings === 'function' ? renderSettings : null
    };
    const renderFunc = map[currentTab] || renderDashboard;
    if(typeof renderFunc === 'function'){
      vc.innerHTML = renderFunc();
    }
    updateHeaderClocks();
  } catch(err){
    console.error('Render error in tab "' + currentTab + '":', err);
    const errContainer = document.getElementById('view-container');
    if(errContainer){
      errContainer.innerHTML = `
        <div class="card" style="margin:20px;padding:30px;border-left:4px solid var(--red);">
          <h3 style="color:var(--red);margin-top:0;">⚠️ Module View Notice (${esc(currentTab)})</h3>
          <p style="color:var(--muted);font-size:.9rem;">A rendering notice occurred: <code>${esc(err.message)}</code></p>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button class="btn-primary" onclick="showTab('dashboard')">🏠 Return to Dashboard</button>
          </div>
        </div>
      `;
    }
  }
}

function updateHeaderClocks(){
  const chinaEl = document.getElementById('clkChina');
  const slEl = document.getElementById('clkSriLanka');
  if(!chinaEl && !slEl) return;

  const now = new Date();
  if(chinaEl){
    chinaEl.textContent = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }
  if(slEl){
    slEl.textContent = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Colombo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }
}
setInterval(updateHeaderClocks, 1000);

function toggleTheme(){
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  const btnText = document.getElementById('themeBtnText');
  if(btnText) btnText.textContent = isLight ? 'Dark Mode' : 'Light Mode';
}

function printDocument(type, id){
  const comp = DB.settings || {};
  const logoHtml = comp.logoBase64 ? `<img src="${comp.logoBase64}" style="max-height:54px;margin-bottom:8px;">` : '';
  const headerContact = `${esc(comp.companyAddress||'')} | ${esc(comp.companyPhone||'')} | ${esc(comp.companyEmail||'')}`;
  const regStr = `<div style="font-size:.72rem;color:#5C7080;margin-top:2px;">BRN: ${esc(comp.brn||'--')} | VAT: ${esc(comp.vatNo||'--')} | TIN: ${esc(comp.tinNo||'--')}</div>`;

  let html = '';
  if(type === 'invoice'){
    const s = DB.sales.find(x=>x.saleNo===id);
    if(!s) return;
    const cust = customerByCode(s.customerCode);
    const items = DB.saleItems.filter(i=>i.saleNo===id);
    const total = items.reduce((t,i)=>t+i.qty*i.unitPrice,0);
    html = `
      <div class="print-page">
        <div class="print-header">
          <div>
            ${logoHtml}
            <h1>${esc(comp.companyName||'Import ERP')}</h1>
            <p>${headerContact}</p>
            ${regStr}
          </div>
          <div class="print-meta">
            <div class="doc-type">TAX INVOICE</div>
            <div class="doc-ref">${esc(s.saleNo)}</div>
            <div class="doc-date">Date: ${esc(s.date)}</div>
          </div>
        </div>
        <p><strong>Billed To:</strong> ${esc(cust?cust.name:'Walk-in Customer')}<br>Contact: ${esc(cust?cust.phone:'--')}</p>
        <table>
          <thead><tr><th>SKU</th><th>Item Description</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${items.map(i=>'<tr><td>'+esc(i.productCode)+'</td><td>'+esc(productByCode(i.productCode)?productByCode(i.productCode).name:'Item')+'</td><td>'+i.qty+'</td><td>Rs '+fmt(i.unitPrice)+'</td><td>Rs '+fmt(i.qty*i.unitPrice)+'</td></tr>').join('')}
          </tbody>
        </table>
        <div class="print-total-band"><span class="label">Invoice Total Amount</span><span class="amount">Rs ${fmt(total)}</span></div>
        <div class="print-signature"><div>Authorized Signature</div><div>Customer Signature</div></div>
      </div>`;
  }

  const el = document.getElementById('print-area');
  if(el){
    el.innerHTML = html;
    window.print();
  }
}

// Robust instant initialization for local file:// & web server loads
function initApp(){
  try {
    loadDB();
    if(document.getElementById('view-container')){
      render();
    } else {
      setTimeout(initApp, 30);
    }
  } catch(err) {
    console.error("Init error:", err);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp);
  window.addEventListener('load', initApp);
}
