// ============================================================
// UTILITY FUNCTIONS & SVG GENERATORS (js/utils.js)
// ============================================================
function esc(s){ return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(n){ n=Number(n)||0; return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtShort(n){
  n = Number(n)||0;
  if(Math.abs(n)>=1000000){ const v=n/1000000; return (v%1===0?v.toFixed(0):v.toFixed(1))+'M'; }
  if(Math.abs(n)>=1000){ const v=n/1000; return (v%1===0?v.toFixed(0):v.toFixed(1))+'k'; }
  return Math.round(n).toString();
}
function todayStr(){ return new Date().toISOString().slice(0,10); }

function uid(prefix){ return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function nextCode(prefix, seqKey, pad){
  pad = pad || 4;
  let maxNum = 0;

  const extractNum = (str) => {
    if(!str) return 0;
    const match = String(str).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  if(seqKey === 'purchase' && DB.purchases){
    DB.purchases.forEach(p => { maxNum = Math.max(maxNum, extractNum(p.purchaseNo)); });
  } else if(seqKey === 'quotation' && DB.quotations){
    DB.quotations.forEach(q => { maxNum = Math.max(maxNum, extractNum(q.quoteNo)); });
  } else if(seqKey === 'sale' && DB.sales){
    DB.sales.forEach(s => { maxNum = Math.max(maxNum, extractNum(s.saleNo)); });
  } else if(seqKey === 'product' && DB.products){
    DB.products.forEach(p => { maxNum = Math.max(maxNum, extractNum(p.code)); });
  } else if(seqKey === 'supplier' && DB.suppliers){
    DB.suppliers.forEach(s => { maxNum = Math.max(maxNum, extractNum(s.code)); });
  } else if(seqKey === 'customer' && DB.customers){
    DB.customers.forEach(c => { maxNum = Math.max(maxNum, extractNum(c.code)); });
  } else if(seqKey === 'shipment' && DB.shipments){
    DB.shipments.forEach(s => { maxNum = Math.max(maxNum, extractNum(s.id)); });
  } else if(seqKey === 'delivery' && DB.deliveries){
    DB.deliveries.forEach(d => { maxNum = Math.max(maxNum, extractNum(d.id)); });
  } else if(seqKey === 'laborer' && DB.laborers){
    DB.laborers.forEach(l => { maxNum = Math.max(maxNum, extractNum(l.code)); });
  } else if(seqKey === 'employee' && DB.employees){
    DB.employees.forEach(e => { maxNum = Math.max(maxNum, extractNum(e.code)); });
  } else if(seqKey === 'paymentVoucher' && DB.paymentVouchers){
    DB.paymentVouchers.forEach(pv => { maxNum = Math.max(maxNum, extractNum(pv.id)); });
  } else if(seqKey === 'expense' && DB.expenses){
    DB.expenses.forEach(e => { maxNum = Math.max(maxNum, extractNum(e.id)); });
  } else if(seqKey === 'customerReturn' && DB.customerReturns){
    DB.customerReturns.forEach(r => { maxNum = Math.max(maxNum, extractNum(r.id)); });
  } else {
    maxNum = DB.seq ? (DB.seq[seqKey] || 0) : 0;
  }

  const nextNum = maxNum + 1;
  return prefix + String(nextNum).padStart(pad, '0');
}

function productByCode(code){ return DB.products.find(p=>p.code===code); }
function customerByCode(code){ return (DB.customers||[]).find(c => c && c.code===code); }
function supplierByCode(code){ return (DB.suppliers||[]).find(s => s && s.code===code); }
function productName(code){ const p=productByCode(code); return p?p.name:'(deleted product)'; }
function isStockLow(p){ if(!p) return false; return (p.stock||0) < (p.minStock||0); }

function lookupProductByBarcode(value){
  if(!value) return null;
  let raw = String(value).trim();
  if(!raw) return null;

  // 1. Extract raw code from JSON or URL if QR code contains structured payload
  if(raw.startsWith('{') && raw.endsWith('}')){
    try {
      const parsed = JSON.parse(raw);
      raw = String(parsed.barcode || parsed.code || parsed.sku || parsed.id || raw).trim();
    } catch(e){}
  } else if(raw.includes('/') && (raw.startsWith('http://') || raw.startsWith('https://'))){
    const parts = raw.split('/');
    raw = decodeURIComponent(parts[parts.length - 1] || raw).trim();
  }

  // Strip GS1 hardware gun prefix codes like ]C1, ]e0, etc.
  raw = raw.replace(/^\][a-zA-Z0-9]{2}/, '').trim();

  const cleanVal = raw.toLowerCase();
  const cleanAlphaNum = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const digitsOnly = raw.replace(/\D/g, '');

  if(!cleanVal && !digitsOnly) return null;

  // PASS 1: Exact match on Barcode or Product Code SKU
  let p = DB.products.find(function(x){
    if(!x) return false;
    const b = String(x.barcode||'').trim().toLowerCase();
    const c = String(x.code||'').trim().toLowerCase();
    return b === cleanVal || c === cleanVal;
  });
  if(p) return p;

  // PASS 2: Match stripped alphanumeric characters (ignores dashes, spaces, slashes)
  p = DB.products.find(function(x){
    if(!x) return false;
    const bAlpha = String(x.barcode||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cAlpha = String(x.code||'').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return (bAlpha && bAlpha === cleanAlphaNum) || (cAlpha && cAlpha === cleanAlphaNum);
  });
  if(p) return p;

  // PASS 3: Numeric EAN-13 / UPC-A / EAN-8 digit matching (handles leading zeros)
  if(digitsOnly){
    const unpadded = digitsOnly.replace(/^0+/, '');
    p = DB.products.find(function(x){
      if(!x) return false;
      const bDigits = String(x.barcode||'').replace(/\D/g, '');
      const cDigits = String(x.code||'').replace(/\D/g, '');

      if(bDigits === digitsOnly || cDigits === digitsOnly) return true;

      const bUnpadded = bDigits.replace(/^0+/, '');
      const cUnpadded = cDigits.replace(/^0+/, '');
      return (unpadded && ((bUnpadded && bUnpadded === unpadded) || (cUnpadded && cUnpadded === unpadded)));
    });
    if(p) return p;
  }

  // PASS 4: Substring match for barcode or SKU code
  if(cleanVal.length >= 3){
    p = DB.products.find(function(x){
      if(!x) return false;
      const b = String(x.barcode||'').trim().toLowerCase();
      const c = String(x.code||'').trim().toLowerCase();
      return (b && (b.includes(cleanVal) || cleanVal.includes(b))) ||
             (c && (c.includes(cleanVal) || cleanVal.includes(c)));
    });
  }

  return p || null;
}

function logScan(value, matched, context){
  DB.scanLog.push({ id:uid('SC-'), date:new Date().toISOString(), value:value, productCode:matched?matched.code:null, found:!!matched, context:context });
  if(DB.scanLog.length>500) DB.scanLog = DB.scanLog.slice(-500);
}

function ean13CheckDigit(digits12){
  let sum = 0;
  for(let i=0;i<12;i++){ sum += digits12[i] * (i%2===0?1:3); }
  const mod = sum % 10;
  return mod===0?0:10-mod;
}

function isValidEAN13(value){
  if(!/^\d{13}$/.test(value)) return false;
  const digits = value.split('').map(Number);
  return ean13CheckDigit(digits.slice(0,12))===digits[12];
}

function generateUniqueBarcode(format){
  let value, attempts=0;
  do{
    if(format==='ean13'){
      const digits=[]; for(let i=0;i<12;i++) digits.push(Math.floor(Math.random()*10));
      value = digits.join('')+ean13CheckDigit(digits);
    } else {
      value = 'PRD'+Date.now().toString().slice(-9)+Math.floor(Math.random()*10);
    }
    attempts++;
  } while(DB.products.some(function(p){ return p.barcode===value; }) && attempts<20);
  return value;
}

let qrLibLoading=false, qrLibLoaded=false;
function loadQRLibrary(onReady, onError){
  if(qrLibLoaded){ if(onReady) onReady(); return; }
  if(qrLibLoading){ setTimeout(function(){ loadQRLibrary(onReady, onError); }, 200); return; }
  qrLibLoading = true;
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload = function(){ qrLibLoaded=true; qrLibLoading=false; if(onReady) onReady(); };
  script.onerror = function(){ qrLibLoading=false; if(onError) onError(); };
  document.head.appendChild(script);
}

function renderQRCodeInto(containerId, text, size){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = '';
  if(typeof QRCode==='undefined'){
    loadQRLibrary(function(){
      new QRCode(el, { text:String(text), width:size||90, height:size||90, correctLevel:QRCode.CorrectLevel.M });
    }, function(){
      el.innerHTML = '<p style="color:#c0392b;font-size:.7rem;">QR offline mode</p>';
    });
    return;
  }
  new QRCode(el, { text:String(text), width:size||90, height:size||90, correctLevel:QRCode.CorrectLevel.M });
}

function renderBarcodeSVG(text, scale, height){
  text = String(text||'').trim();
  if(!text) return '';
  scale = scale || 1.5;
  height = height || 36;

  // Use official JsBarcode library if loaded
  if(typeof JsBarcode !== 'undefined'){
    try {
      const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svgEl, text, {
        format: "CODE128",
        width: scale,
        height: height,
        displayValue: true,
        font: "monospace",
        fontSize: 11,
        margin: 2
      });
      return svgEl.outerHTML;
    } catch(e){}
  }

  // Native Vector SVG Generator Fallback
  let bars = '11010010000';
  for(let i=0; i<text.length; i++){
    const code = text.charCodeAt(i);
    const pattern = ((code * 13 + i * 7) % 64).toString(2).padStart(6, '0');
    bars += '1' + pattern + '0';
  }
  bars += '1100011101011';

  const barWidth = 2 * scale;
  const svgWidth = bars.length * barWidth;
  let rects = '';
  for(let i=0; i<bars.length; i++){
    if(bars[i] === '1'){
      rects += `<rect x="${(i * barWidth).toFixed(1)}" y="0" width="${barWidth.toFixed(1)}" height="${height}" fill="#000"/>`;
    }
  }

  return `<svg width="${svgWidth}" height="${height + 14}" viewBox="0 0 ${svgWidth} ${height + 14}">
    ${rects}
    <text x="${(svgWidth/2).toFixed(1)}" y="${height + 11}" font-size="10" font-family="monospace" text-anchor="middle" fill="#152233">${esc(text)}</text>
  </svg>`;
}

function renderBarChartSVG(data, opts){
  opts = opts||{};
  const width = opts.width||520, height = opts.height||190;
  const padding = {top:24, right:8, bottom:34, left:8};
  const chartW = width-padding.left-padding.right;
  const chartH = height-padding.top-padding.bottom;
  const maxVal = Math.max.apply(null, data.map(function(d){ return d.value; }).concat([0]));
  const gap = chartW/Math.max(data.length,1);
  const barW = Math.min(gap*0.55, 42);
  const color = opts.color||'#0088FF';

  if(maxVal === 0){
    return `
      <div style="height:${height}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);text-align:center;background:var(--paper);border-radius:8px;border:1px dashed var(--border-strong);padding:20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="opacity:.6;margin-bottom:8px;"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        <div style="font-size:.85rem;font-weight:600;color:var(--text);">No Sales Activity Recorded Yet</div>
        <div style="font-size:.76rem;margin-top:4px;">Sales trend chart will update automatically as POS transactions occur.</div>
      </div>
    `;
  }

  let bars='', labels='';
  data.forEach(function(d,i){
    const barH = maxVal>0 ? (d.value/maxVal)*chartH : 0;
    const x = padding.left + i*gap + (gap-barW)/2;
    const y = padding.top + (chartH-barH);
    if(d.value > 0){
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(barH,2).toFixed(1)}" rx="4" fill="${color}"/>`;
      bars += `<text x="${(x+barW/2).toFixed(1)}" y="${(y-6).toFixed(1)}" font-size="9.5" text-anchor="middle" fill="var(--text)" font-weight="700" font-family="var(--font-number)">${esc(fmtShort(d.value))}</text>`;
    }
    labels += `<text x="${(x+barW/2).toFixed(1)}" y="${height-padding.bottom+16}" font-size="9" text-anchor="middle" fill="var(--muted)" font-family="var(--font-body)">${esc(d.label)}</text>`;
  });
  const gridY = padding.top+chartH;
  return `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet" style="max-width:${width}px;">
    <line x1="${padding.left}" y1="${gridY}" x2="${width-padding.right}" y2="${gridY}" stroke="var(--border-strong)" stroke-width="1"/>
    ${bars}${labels}
  </svg>`;
}

// ============================================================
// LANDED COST CALCULATION ENGINE & RECEIVE SHIPMENT WORKFLOW
// ============================================================
function calculateShipmentLandedCost(shipmentId){
  const shipment = DB.shipments.find(s=>s.id===shipmentId);
  if(!shipment) return [];
  const links = DB.shipmentLinks.filter(l=>l.shipmentId===shipmentId);
  const fx = shipment.fxRate || DB.settings.fxRate || 40;

  const items = links.map(function(link){
    const pi = DB.purchaseItems.find(function(x){ return x.id===link.itemId; });
    if(!pi) return null;
    const item = Object.assign({}, pi);
    item._cartons = link.cartons || 0;
    item._cbm = link.cbm || 0;
    item._chargeMethod = link.chargeMethod || shipment.chargeMethod || 'cbm';
    item._cbmRateLKR = (link.cbmRateLKR !== undefined && link.cbmRateLKR !== 0) ? link.cbmRateLKR : (shipment.cbmRateLKR || 0);
    item._lumpSumLKR = (link.lumpSumLKR !== undefined && link.lumpSumLKR !== 0) ? link.lumpSumLKR : 0;
    return item;
  }).filter(function(x){ return x; });

  items.forEach(it => {
    it._directCostLKR = it.qty * it.unitPriceRMB * fx;
    if(it._chargeMethod === 'lump'){
      it._cargoFreightLKR = it._lumpSumLKR || 0;
    } else {
      it._cargoFreightLKR = (it._cbm || 0) * (it._cbmRateLKR || 0);
    }
  });

  const purchaseNos = Array.from(new Set(links.map(function(l){ return l.purchaseNo; })));
  const totalLocalDeliveryLKR = purchaseNos.reduce(function(sum, pn){
    const purchase = DB.purchases.find(function(p){ return p.purchaseNo===pn; });
    return sum + ((purchase ? purchase.localDeliveryChargeRMB : 0) || 0) * fx;
  }, 0);

  const totalCBM = items.reduce((sum,it)=>sum+(it._cbm||0), 0);
  const totalQty = items.reduce((sum,it)=>sum+(it.qty||0), 0);
  const totalDirectValueLKR = items.reduce((s,it)=>s+it._directCostLKR, 0);
  const customsDutyLKR = ((shipment.customsDutyPercent||0)/100) * totalDirectValueLKR;
  const additionalCostLKR = shipment.additionalCostLKR || 0;

  // Non-freight overhead (China domestic delivery RMB->LKR + customs duty + port clearance)
  const nonFreightOverheadLKR = totalLocalDeliveryLKR + customsDutyLKR + additionalCostLKR;

  items.forEach(it => {
    let nonFreightAlloc = 0;
    if(shipment.allocationMethod === 'cbm' && totalCBM > 0){
      nonFreightAlloc = (it._cbm / totalCBM) * nonFreightOverheadLKR;
    } else if(shipment.allocationMethod === 'qty' && totalQty > 0){
      nonFreightAlloc = (it.qty / totalQty) * nonFreightOverheadLKR;
    } else if(totalDirectValueLKR > 0) {
      nonFreightAlloc = (it._directCostLKR / totalDirectValueLKR) * nonFreightOverheadLKR;
    }
    
    // Distribute local delivery RMB for reporting
    if(totalDirectValueLKR > 0){
      it._localDeliveryLKR = (it._directCostLKR / totalDirectValueLKR) * totalLocalDeliveryLKR;
    } else {
      it._localDeliveryLKR = 0;
    }

    it._allocatedOverheadLKR = it._cargoFreightLKR + nonFreightAlloc;
    it._totalLandedCostLKR = it._directCostLKR + it._allocatedOverheadLKR;
    it._landedCostPerUnit = it.qty > 0 ? it._totalLandedCostLKR / it.qty : 0;
  });

  return items;
}

function receiveShipment(shipmentId){
const items = calculateShipmentLandedCost(shipmentId);
const shipment = DB.shipments.find(s=>s.id===shipmentId);
if(!shipment || shipment.status==='Received') return;

items.forEach(it=>{
const product = productByCode(it.productCode);
if(!product) return;
const oldStock = product.stock||0, oldCost = product.avgLandedCost||0;
const newQty = it.qty, newCost = it._landedCostPerUnit;
const totalQty = oldStock+newQty;
product.avgLandedCost = totalQty>0 ? ((oldStock*oldCost)+(newQty*newCost))/totalQty : newCost;
product.stock = totalQty;
DB.stockLedger.push({ id:uid('SL-'), date:new Date().toISOString(), productCode:it.productCode, type:'IN', qty:newQty, unitCost:newCost, refType:'shipment', refNo:shipmentId });
});

shipment.status = 'Received';
shipment.receivedDate = new Date().toISOString();
const linkedPurchaseNos = Array.from(new Set(DB.shipmentLinks.filter(l=>l.shipmentId===shipmentId).map(function(l){ return l.purchaseNo; })));
linkedPurchaseNos.forEach(function(pn){
const purchase = DB.purchases.find(function(p){ return p.purchaseNo===pn; });
if(purchase) purchase.status = 'Received';
});
saveDB();
}

// ============================================================
// UI HELPERS & NAVIGATION
// ============================================================
function openModal(html){ document.getElementById('modal-root').innerHTML = '<div class="modal-overlay" onclick="if(event.target===this) closeModal()"><div class="modal">'+html+'</div></div>'; }
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }
