// ============================================================
// CARGO & SHIPMENTS MODULE (js/modules/cargo.js)
// ============================================================
function renderCargo(){
  const s = DB.settings || {};
  const rows = DB.shipments.map(sh => {
    const items = calculateShipmentLandedCost(sh.id);
    const totalQty = items.reduce((q,i) => q + i.qty, 0);
    return `<tr>
      <td>${esc(sh.id)}</td>
      <td>${esc(sh.trackingNo || '--')}</td>
      <td>${esc(sh.carrier || 'Freight Forwarder')}</td>
      <td>${esc(sh.shippingDate || '--')}</td>
      <td>${esc((sh.allocationMethod || 'cbm').toUpperCase())}</td>
      <td>LKR ${fmt(sh.cbmRateLKR || sh.lumpSumLKR || 0)}</td>
      <td>${totalQty} units</td>
      <td><span class="badge ${sh.status === 'Received' ? 'badge-ok' : 'badge-pending'}">${esc(sh.status)}</span></td>
      <td>
        ${sh.status !== 'Received' ? '<button class="btn-primary" style="padding:4px 10px;font-size:.78rem;" onclick="receiveShipmentAction(\'' + esc(sh.id) + '\')">Receive Cargo</button>' : ''}
        <button class="btn-link" onclick="viewShipmentLandedCost('${esc(sh.id)}')">Landed Details</button>
        <button class="btn-link btn-danger" onclick="deleteShipment('${esc(sh.id)}')">Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `
    <header id="top-bar">
      <div class="top-bar-title">Cargo &amp; Shipments</div>
      <div class="top-bar-right">
        <div class="header-clock-pill">🇨🇳 CHINA: <strong id="clkChina">--:--:--</strong></div>
        <div class="header-clock-pill">🇱🇰 SRI LANKA: <strong id="clkSriLanka">--:--:--</strong></div>
        <div class="header-badge-pill">🏢 ${esc(s.companyName || 'NEXUZ LANKA LK CN')}</div>
        <div class="header-badge-pill">💱\uD83D\uDCB1 RMB Rate: <strong>${(s.fxRate || 40).toFixed(2)} LKR</strong></div>
        <button class="top-btn" onclick="toggleTheme()">⚙ <span id="themeBtnText">Light Mode</span></button>
        <button class="top-btn btn-scan" onclick="openScanModal()">📷 Camera Scan</button>
      </div>
    </header>

    <div class="view-header">
      <div><h2>Cargo &amp; Logistics Tracking</h2><small style="color:var(--muted);">Manage sea/air freight containers, customs clearance, CBM/Value landed cost allocation, and stock arrival receipt.</small></div>
      <div style="display:flex;gap:10px;">
        <button class="btn-primary" onclick="openShipmentForm()" style="height:38px;display:inline-flex;align-items:center;gap:8px;padding:0 22px;font-size:.9rem;font-weight:700;">
          + New Shipment
        </button>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr><th>Shipment ID</th><th>Container / Waybill #</th><th>Carrier</th><th>Ship Date</th><th>Allocation</th><th>Rate / Freight</th><th>Qty</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;">No shipments created yet. Click "+ New Shipment" to create one.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function applyDefaultFreightRateToAllItems(val){
  const inputs = document.querySelectorAll('.shipment-item-rate');
  inputs.forEach(inp => { inp.value = val; });
}

function openShipmentForm(){
  const unlinkedItems = DB.purchaseItems.filter(pi => !DB.shipmentLinks.some(l => l.itemId === pi.id));
  const unlinkedItemsHtml = unlinkedItems.length ? unlinkedItems.map((item, idx) => {
    const p = productByCode(item.productCode);
    const purchase = DB.purchases.find(po => po.purchaseNo === item.purchaseNo);
    const delRMB = purchase && purchase.localDeliveryChargeRMB ? purchase.localDeliveryChargeRMB : 0;
    return `
      <tr style="background:var(--paper);border-bottom:1px solid var(--border);">
        <td style="text-align:center;"><input type="checkbox" name="item_${item.id}" value="1" checked style="width:auto;"></td>
        <td style="font-size:.84rem;">
          <strong>${esc(item.purchaseNo)}</strong>: ${esc(p ? p.name : 'Item')} (${item.qty} units)
          ${delRMB > 0 ? `<div style="font-size:.72rem;color:var(--harbor);">🇨🇳 Supplier Local Freight: ¥${delRMB}</div>` : ''}
        </td>
        <td><input type="number" placeholder="Cartons" name="cartons_${item.id}" value="5" style="width:75px;" title="Cartons"></td>
        <td><input type="number" step="0.01" placeholder="CBM" name="cbm_${item.id}" value="0.5" style="width:75px;" title="CBM"></td>
        <td>
          <select name="chargeMethod_${item.id}" style="width:105px;padding:4px;font-size:.78rem;">
            <option value="cbm">Per CBM Rate</option>
            <option value="lump">Lump Charge</option>
          </select>
        </td>
        <td>
          <input type="number" step="0.01" class="shipment-item-rate" name="itemRateLKR_${item.id}" value="35000" style="width:100px;font-size:.82rem;" placeholder="Rate / Lump (LKR)" title="CBM Rate or Lump Sum Freight in LKR for this specific item">
        </td>
      </tr>`;
  }).join('') : '<tr><td colspan="6" style="color:var(--muted);font-size:.85rem;text-align:center;padding:16px;">All purchase items have already been assigned to shipments!</td></tr>';

  openModal(`
    <h3>Create Cargo Shipment</h3>
    <form onsubmit="saveShipment(event)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label>Container / Tracking Number</label><input name="trackingNo" placeholder="e.g. COSU123456789"></div>
        <div><label>Carrier / Logistics Forwarder</label><input name="carrier" value="Yiwu Shipping Agent"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:6px;">
        <div><label>Shipping Date</label><input type="date" name="shippingDate" value="${todayStr()}"></div>
        <div><label>ETA Date</label><input type="date" name="etaDate" value="${todayStr()}"></div>
        <div><label>Exchange Rate (1 RMB to LKR)</label><input type="number" step="0.01" name="fxRate" value="${DB.settings.fxRate || 40}" required></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;">
        <div>
          <label>Non-Freight Cost Allocation Method</label>
          <select name="allocationMethod">
            <option value="cbm">By Volume (CBM)</option>
            <option value="value">By Value (Direct RMB Cost)</option>
            <option value="qty">By Unit Quantity</option>
          </select>
        </div>
        <div>
          <label>Global Default CBM Rate (LKR)</label>
          <input type="number" step="0.01" id="globalCbmRateInput" value="35000">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;">
        <div><label>Customs Duty %</label><input type="number" step="0.1" name="customsDutyPercent" value="15"></div>
        <div><label>Local Port &amp; Clearance Charges (LKR)</label><input type="number" step="0.01" name="additionalCostLKR" value="25000"></div>
      </div>

      <div style="margin-top:16px;background:var(--paper);border:1px solid var(--border-strong);border-radius:8px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h4 style="margin:0;">Select Purchase Items &amp; Configure Item-Level Freight Rates</h4>
          <button type="button" class="btn-secondary" style="padding:4px 10px;font-size:.78rem;" onclick="applyDefaultFreightRateToAllItems(document.getElementById('globalCbmRateInput').value)">
            ⚡ Fill Default Rate to All Items
          </button>
        </div>
        <table style="font-size:.82rem;margin:0;">
          <thead>
            <tr>
              <th style="width:30px;">INC</th>
              <th>PURCHASE / PRODUCT</th>
              <th style="width:80px;">CTNS</th>
              <th style="width:80px;">CBM</th>
              <th style="width:110px;">CHARGE TYPE</th>
              <th style="width:110px;">RATE / LKR</th>
            </tr>
          </thead>
          <tbody>
            ${unlinkedItemsHtml}
          </tbody>
        </table>
      </div>

      <div class="modal-actions" style="margin-top:20px;">
        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn-primary">Create Shipment</button>
      </div>
    </form>
  `);
}

function saveShipment(e){
  e.preventDefault();
  const f = e.target;
  const sId = nextCode('SHP-', 'shipment');
  const globalRate = parseFloat(f.globalCbmRateInput ? f.globalCbmRateInput.value : 35000) || 0;
  
  const shipment = {
    id: sId,
    trackingNo: f.trackingNo.value,
    carrier: f.carrier.value,
    shippingDate: f.shippingDate.value,
    etaDate: f.etaDate.value,
    fxRate: parseFloat(f.fxRate.value) || 40,
    allocationMethod: f.allocationMethod.value,
    chargeMethod: 'cbm',
    cbmRateLKR: globalRate,
    lumpSumLKR: 0,
    customsDutyPercent: parseFloat(f.customsDutyPercent.value) || 0,
    additionalCostLKR: parseFloat(f.additionalCostLKR.value) || 0,
    status: 'In Transit'
  };
  DB.shipments.push(shipment);

  const unlinkedItems = DB.purchaseItems.filter(pi => !DB.shipmentLinks.some(l => l.itemId === pi.id));
  unlinkedItems.forEach(item => {
    const chk = f[`item_${item.id}`];
    if(chk && chk.checked){
      const cbm = parseFloat(f[`cbm_${item.id}`].value) || 0;
      const cartons = parseInt(f[`cartons_${item.id}`].value) || 0;
      const chargeMethod = f[`chargeMethod_${item.id}`] ? f[`chargeMethod_${item.id}`].value : 'cbm';
      const itemRateVal = parseFloat(f[`itemRateLKR_${item.id}`] ? f[`itemRateLKR_${item.id}`].value : 0) || 0;

      DB.shipmentLinks.push({
        shipmentId: sId,
        itemId: item.id,
        purchaseNo: item.purchaseNo,
        productCode: item.productCode,
        cbm: cbm,
        cartons: cartons,
        chargeMethod: chargeMethod,
        cbmRateLKR: chargeMethod === 'cbm' ? itemRateVal : 0,
        lumpSumLKR: chargeMethod === 'lump' ? itemRateVal : 0
      });
    }
  });
  saveDB();
  closeModal();
  render();
}

function receiveShipmentAction(sId){
  if(!confirm('Confirm receipt of cargo shipment ' + sId + '? This will add stock and calculate final Landed Costs.')) return;
  receiveShipment(sId);
  render();
}

function deleteShipment(sId){
  const s = DB.shipments.find(x => x.id === sId);
  if(!s) return;
  
  const isReceived = s.status === 'Received';
  const confirmMsg = isReceived 
    ? `Delete shipment ${sId}? This shipment was marked Received. Deleting it will reverse the added stock ledger entries and restore linked purchase orders to Pending.`
    : `Delete shipment ${sId}? Linked purchase items will be released back to pending status.`;

  if(!confirm(confirmMsg)) return;

  // 1. If Received, reverse stock and stock ledger entries created by this shipment
  if(isReceived){
    const items = calculateShipmentLandedCost(sId);
    items.forEach(it => {
      const product = productByCode(it.productCode);
      if(product){
        product.stock = Math.max(0, (product.stock || 0) - it.qty);
      }
    });
    DB.stockLedger = (DB.stockLedger || []).filter(sl => !(sl.refType === 'shipment' && sl.refNo === sId));
  }

  // 2. Reset status of linked Purchase Orders back to 'Pending'
  const linkedLinks = (DB.shipmentLinks || []).filter(l => l.shipmentId === sId);
  const linkedPurchaseNos = Array.from(new Set(linkedLinks.map(l => l.purchaseNo)));

  // Remove shipment links for this shipment
  DB.shipmentLinks = (DB.shipmentLinks || []).filter(l => l.shipmentId !== sId);

  linkedPurchaseNos.forEach(pn => {
    const po = DB.purchases.find(p => p.purchaseNo === pn);
    if(po){
      const hasOtherShipment = (DB.shipmentLinks || []).some(l => l.purchaseNo === pn);
      if(!hasOtherShipment){
        po.status = 'Pending';
      }
    }
  });

  // 3. Remove shipment from DB.shipments
  DB.shipments = (DB.shipments || []).filter(x => x.id !== sId);

  saveDB();
  render();
}

function viewShipmentLandedCost(sId){
  showTab('landedcost');
  setTimeout(() => {
    const sel = document.getElementById('lcShipmentSelect');
    if(sel){
      sel.value = sId;
      sel.dispatchEvent(new Event('change'));
    }
  }, 50);
}
