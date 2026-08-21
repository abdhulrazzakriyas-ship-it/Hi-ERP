// ============================================================
// DASHBOARD MODULE RENDERER (js/modules/dashboard.js)
// ============================================================
function renderDashboard(){
  const sysSettings = DB.settings || {};
  const compName = sysSettings.companyName || 'NEXUZ LANKA LK CN';
  const fxRate = sysSettings.fxRate || 40;

  const today = todayStr();
  const salesToday = (DB.sales||[]).filter(x=>x && x.date===today);
  const saleItemsToday = (DB.saleItems||[]).filter(si=>si && salesToday.some(st=>st.saleNo===si.saleNo));
  const todayTotalSales = saleItemsToday.reduce((sum,i)=>sum+(i.qty||0)*(i.unitPrice||0),0);
  const todayTxCount = salesToday.length;

  const thisMonth = today.slice(0,7);
  const salesMonth = (DB.sales||[]).filter(x=>x && (x.date||'').slice(0,7)===thisMonth);
  const saleItemsMonth = (DB.saleItems||[]).filter(si=>si && salesMonth.some(sm=>sm.saleNo===si.saleNo));
  const monthlySales = saleItemsMonth.reduce((sum,i)=>sum+(i.qty||0)*(i.unitPrice||0),0);

  const totalAllSales = (DB.saleItems||[]).reduce((sum,i)=>sum+(i.qty||0)*(i.unitPrice||0),0);
  const totalAllCOGS = (DB.saleItems||[]).reduce((sum,i)=>sum+(i.qty||0)*(i.landedCostAtSale||i.unitPrice||0),0);
  const grossProfit = totalAllSales - totalAllCOGS;
  const totalExpenses = (DB.expenses||[]).reduce((sum,e)=>sum+(e.amount||0),0);
  const totalLaborPaid = (DB.laborPayments||[]).reduce((sum,l)=>sum+(l.amount||0),0);
  const netProfit = grossProfit - totalExpenses - totalLaborPaid;

  const receivables = (DB.customers||[]).reduce((sum,c)=>sum+(c?customerBalance(c.code):0),0);
  const payablesRMB = (DB.suppliers||[]).reduce((sum,sup)=>sum+(sup?supplierOutstandingBalance(sup.code):0),0);
  const payablesLKR = payablesRMB * fxRate;

  const stockValue = (DB.products||[]).reduce((sum,p)=>sum+(p?(p.stock||0)*(p.avgLandedCost||(p.purchasePriceRMB||0)*fxRate||0):0),0);

  const todayAttendance = (DB.laborAttendance||[]).filter(a=>a && a.date===today);
  const presentToday = todayAttendance.filter(a=>a && (a.status==='Present'||a.status==='Half-Day'));
  const todayWagesLKR = presentToday.reduce((sum,a)=>{
    const l = (DB.laborers||[]).find(x=>x && x.code===a.laborerCode);
    if(!l) return sum;
    const dayPay = a.status==='Present'?(l.dailyRate||0):(a.status==='Half-Day'?(l.dailyRate||0)/2:0);
    const otPay = (a.overtimeHours||0)*(l.otRatePerHour||0);
    return sum + dayPay + otPay;
  },0);

  const lowStock = (DB.products||[]).filter(p=>p && isStockLow(p));
  const activeShipments = (DB.shipments||[]).filter(s=>s && s.status!=='Received');

  const recentInvoices = (DB.sales||[]).slice(-6).reverse().map(s=>{
    const cust = (DB.customers||[]).find(c=>c.code===s.customerCode);
    const items = (DB.saleItems||[]).filter(si=>si.saleNo===s.saleNo);
    const total = items.reduce((sum,i)=>sum+i.qty*i.unitPrice,0);
    return {
      saleNo: s.saleNo,
      date: s.date,
      custName: cust ? cust.name : (s.customerCode || 'Walk-in Retail'),
      customerType: s.customerType,
      total: total
    };
  });

  const saleDateMap = {};
  (DB.sales||[]).forEach(x=>{ saleDateMap[x.saleNo]=x.date; });
  const dailyTotals = {};
  (DB.saleItems||[]).forEach(si=>{ const d=saleDateMap[si.saleNo]; if(d) dailyTotals[d]=(dailyTotals[d]||0)+si.qty*si.unitPrice; });
  const chartData = [];
  for(let i=13;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const dateStr = d.toISOString().slice(0,10);
    chartData.push({ label:(d.getMonth()+1)+'/'+d.getDate(), value: dailyTotals[dateStr]||0 });
  }

  const lowStockRowsHtml = lowStock.length ? lowStock.map(p=>'<tr><td><strong>'+esc(p.code)+'</strong><br><small>'+esc(p.name)+'</small></td><td style="color:#FF4D4D;font-weight:700;">'+p.stock+'</td><td>'+p.minStock+'</td></tr>').join('') : '<tr><td colspan="3" style="color:var(--green);text-align:center;padding:24px 12px;font-weight:500;">✓ All product stock levels optimal.</td></tr>';

  const activeShipmentsRowsHtml = activeShipments.length ? activeShipments.map(sh=>'<tr><td><strong>'+esc(sh.shipmentNo||sh.id)+'</strong><br><small style="color:var(--muted);">'+esc(sh.trackingNo||'No Tracking')+'</small></td><td>'+esc(sh.shippingLine||'Sea Cargo')+'<br><small style="color:var(--muted);">'+esc(sh.method||'Sea LCL')+'</small></td><td><span class="badge '+(sh.status==='In Transit'?'badge-pending':(sh.status==='Customs'?'badge-low':'badge-ok'))+'">'+esc(sh.status)+'</span></td><td style="font-family:var(--font-number);">'+(sh.cbm?sh.cbm.toFixed(2)+' CBM':'\u2014')+'</td><td>'+esc(sh.eta||'TBD')+'</td></tr>').join('') : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No active cargo shipments in transit. <button class="btn-link" onclick="openShipmentForm()">+ Create Shipment</button></td></tr>';

  const recentInvoicesRowsHtml = recentInvoices.length ? recentInvoices.map(inv=>'<tr><td><strong>'+esc(inv.saleNo)+'</strong></td><td>'+esc(inv.date)+'</td><td>'+esc(inv.custName)+'</td><td><span class="badge '+(inv.customerType==='Wholesale'?'badge-ok':'badge-pending')+'">'+esc(inv.customerType||'Retail')+'</span></td><td style="text-align:right;font-family:var(--font-number);font-weight:700;color:var(--ink);">LKR '+fmt(inv.total)+'</td></tr>').join('') : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No recent sales invoices recorded. <button class="btn-link" onclick="openSalesForm()">+ New Sale</button></td></tr>';

  setTimeout(()=>{
    const sb = document.getElementById('sbBrandName');
    if(sb && sysSettings.companyName) sb.innerHTML = `${esc(sysSettings.companyName)} <span class="brand-badge">LK CN</span>`;
    updateHeaderClocks();
  }, 10);

  return `
    <header id="top-bar">
      <div class="top-bar-title">Dashboard</div>
      <div class="top-bar-right">
        <div class="header-clock-pill">🇨🇳 CHINA: <strong id="clkChina">--:--:--</strong></div>
        <div class="header-clock-pill">🇱🇰 SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
        <div class="header-badge-pill">🏢 ${esc(compName)}</div>
        <div class="header-badge-pill">💱 RMB Rate: <strong>${fxRate.toFixed(2)} LKR</strong></div>
        <button class="top-btn" onclick="toggleTheme()">⚙ <span id="themeBtnText">Light Mode</span></button>
        <button class="top-btn btn-scan" onclick="openScanModal()">📷 Camera Scan</button>
      </div>
    </header>

    <div>
      <!-- 8 METRIC CARDS GRID -->
      <div class="metric-grid-8">

        <!-- CARD 1: TODAY'S SALES -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">TODAY'S SALES</div>
            <div class="val">LKR ${fmt(todayTotalSales)}</div>
            <div class="sub">${todayTxCount} Transactions</div>
          </div>
          <div class="metric-icon-badge" style="color:#0088FF;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </div>
        </div>

        <!-- CARD 2: MONTHLY SALES -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">MONTHLY SALES</div>
            <div class="val">LKR ${fmt(monthlySales)}</div>
            <div class="sub">Current calendar month</div>
          </div>
          <div class="metric-icon-badge" style="color:#2ECC71;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>
          </div>
        </div>

        <!-- CARD 3: GROSS PROFIT -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">GROSS PROFIT</div>
            <div class="val">LKR ${fmt(grossProfit)}</div>
            <div class="sub">Sales Revenue - Landed Cost</div>
          </div>
          <div class="metric-icon-badge" style="color:#16A085;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>

        <!-- CARD 4: NET PROFIT -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">NET PROFIT</div>
            <div class="val">LKR ${fmt(netProfit)}</div>
            <div class="sub">Gross - Expenses</div>
          </div>
          <div class="metric-icon-badge" style="color:#27AE60;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>
          </div>
        </div>

        <!-- CARD 5: RECEIVABLES -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">RECEIVABLES</div>
            <div class="val" style="color:${receivables>0?'#F39C12':'var(--ink)'};">LKR ${fmt(receivables)}</div>
            <div class="sub">Owed by customers</div>
          </div>
          <div class="metric-icon-badge" style="color:#F39C12;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
        </div>

        <!-- CARD 6: PAYABLES -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">PAYABLES</div>
            <div class="val" style="color:${payablesLKR>0?'#FF4D4D':'var(--ink)'};">LKR ${fmt(payablesLKR)}</div>
            <div class="sub">Owed to suppliers (¥${fmt(payablesRMB)})</div>
          </div>
          <div class="metric-icon-badge" style="color:#E74C3C;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>

        <!-- CARD 7: WAREHOUSE VALUATION -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">WAREHOUSE VALUATION</div>
            <div class="val">LKR ${fmt(stockValue)}</div>
            <div class="sub">Valued at Landed Cost</div>
          </div>
          <div class="metric-icon-badge" style="color:#1ABC9C;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
        </div>

        <!-- CARD 8: TODAY'S WAGES -->
        <div class="metric-card-nexuz">
          <div class="metric-info">
            <div class="label">TODAY'S WAGES</div>
            <div class="val">${fmt(todayWagesLKR)} LKR</div>
            <div class="sub">${presentToday.length} Present today</div>
          </div>
          <div class="metric-icon-badge" style="color:#F1C40F;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
        </div>

      </div>

      <!-- CHART & ALERTS GRID -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:18px;">
        <div class="card">
          <h3 style="margin-bottom:14px;">14-Day Sales Revenue Chart</h3>
          ${renderBarChartSVG(chartData, {color:'#0088FF', height:220})}
        </div>

        <div class="card">
          <h3 style="color:#FF4D4D;display:flex;align-items:center;gap:6px;">⚠️ Low Stock Alerts</h3>
          <table>
            <thead><tr><th>SKU</th><th>STOCK</th><th>MIN</th></tr></thead>
            <tbody>
              ${lowStockRowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOTTOM DASHBOARD PANELS -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px;margin-top:18px;">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--harbor)" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Active Cargo Shipments
            </h3>
            <button class="btn-link" onclick="showTab('cargo')">View All Cargo &rarr;</button>
          </div>
          <table>
            <thead><tr><th>SHIPMENT #</th><th>CARRIER / LINE</th><th>STATUS</th><th>VOLUME</th><th>ETA</th></tr></thead>
            <tbody>
              ${activeShipmentsRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3 style="margin:0;display:flex;align-items:center;gap:8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Recent Sales Invoices
            </h3>
            <button class="btn-link" onclick="showTab('sales')">View Sales Register &rarr;</button>
          </div>
          <table>
            <thead><tr><th>INVOICE #</th><th>DATE</th><th>CUSTOMER</th><th>TYPE</th><th style="text-align:right;">AMOUNT</th></tr></thead>
            <tbody>
              ${recentInvoicesRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
