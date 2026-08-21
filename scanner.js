// ============================================================
// BARCODE SCANNER ENGINE & CAMERA INTEGRATION (js/scanner.js)
// ============================================================
let isTorchOn = false;

// Spec-Compliant Camera Reader Initializer (#reader)
async function initializeCameraScanReader(elementId, callback){
  elementId = elementId || 'reader';
  const el = document.getElementById(elementId);
  if(!el) return null;

  if(typeof Html5Qrcode !== 'undefined'){
    try {
      const scanner = new Html5Qrcode(elementId);
      const config = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };
      await scanner.start(
        { facingMode: "environment" },
        config,
        function(decodedText, result){
          if(callback) callback(decodedText, result);
          else routeScannedBarcode(decodedText);
        },
        function(errorMessage){}
      );
      return scanner;
    } catch(err){
      console.warn("initializeCameraScanReader error:", err);
    }
  }
  return null;
}

// Router function for scanned barcodes
function routeScannedBarcode(decodedText, context){
  processScannedBarcode(decodedText, context || 'camera_reader');
}

function stopDeviceCamera(){
  isTorchOn = false;
  if(html5QrCodeScanner){
    try {
      html5QrCodeScanner.stop().catch(()=>{});
    } catch(e){}
    html5QrCodeScanner = null;
  }
  if(cameraDetectAnimFrame){
    cancelAnimationFrame(cameraDetectAnimFrame);
    cameraDetectAnimFrame = null;
  }
  if(currentCameraStream){
    currentCameraStream.getTracks().forEach(track => track.stop());
    currentCameraStream = null;
  }
}

async function toggleCameraTorch(){
  if(!currentCameraStream){
    if(html5QrCodeScanner && html5QrCodeScanner.applyVideoConstraints){
      try {
        isTorchOn = !isTorchOn;
        await html5QrCodeScanner.applyVideoConstraints({ torch: isTorchOn });
        return;
      } catch(e){}
    }
  }
  if(currentCameraStream){
    const track = currentCameraStream.getVideoTracks()[0];
    if(track && track.applyConstraints){
      try {
        isTorchOn = !isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
      } catch(e){
        alert('Flashlight torch is not available on this camera device.');
      }
    }
  }
}

function openModal(html){
  const root = document.getElementById('modal-root');
  if(!root) return;
  root.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this) closeModal();"><div class="modal">${html}</div></div>`;
}

function closeModal(){
  stopDeviceCamera();
  const root = document.getElementById('modal-root');
  if(root) root.innerHTML = '';
}

async function startDeviceCamera(deviceId, targetContext){
  stopDeviceCamera();
  const container = document.getElementById('cameraVideoContainer');
  const statusEl = document.getElementById('cameraScannerStatus');
  if(!container) return;

  container.innerHTML = `
    <div id="html5QrCodeReader" style="width:100%;height:100%;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96%;height:85%;max-height:280px;border:3px solid #0088FF;border-radius:16px;box-shadow:0 0 24px rgba(0,136,255,0.4);pointer-events:none;display:flex;align-items:center;justify-content:center;z-index:10;background:rgba(0,136,255,0.04);">
      <div style="width:96%;height:4px;background:#FF4D4D;box-shadow:0 0 18px #FF4D4D;animation:scanPulse 1.2s infinite ease-in-out;"></div>
    </div>
  `;

  if(typeof Html5Qrcode !== 'undefined'){
    try {
      html5QrCodeScanner = new Html5Qrcode("html5QrCodeReader");
      
      let supportedFormats = undefined;
      if(typeof Html5QrcodeSupportedFormats !== 'undefined'){
        supportedFormats = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.QR_CODE
        ];
      }

      const config = {
        fps: 30,
        qrbox: function(viewfinderWidth, viewfinderHeight){
          return {
            width: Math.floor(viewfinderWidth * 0.95),
            height: Math.floor(viewfinderHeight * 0.85)
          };
        },
        aspectRatio: 1.777778,
        formatsToSupport: supportedFormats,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      let cameraParam = deviceId ? deviceId : { facingMode: "environment" };

      if(statusEl) statusEl.innerHTML = `<span style="color:#2ECC71;font-weight:700;">⚡ Instant Camera Scanner Initializing...</span>`;

      try {
        await html5QrCodeScanner.start(
          cameraParam,
          config,
          function(decodedText, decodedResult){
            if(statusEl) statusEl.innerHTML = `<span style="color:#2ECC71;font-weight:700;">✓ Scanned Code: ${esc(decodedText)}</span>`;
            stopDeviceCamera();
            closeModal();
            processScannedBarcode(decodedText, targetContext || 'camera_scan');
          },
          function(errorMessage){}
        );
      } catch(firstErr) {
        // Fallback retry with basic camera parameter if facingMode: environment is overconstrained
        try {
          cameraParam = { facingMode: "user" };
          await html5QrCodeScanner.start(
            cameraParam,
            config,
            function(decodedText, decodedResult){
              if(statusEl) statusEl.innerHTML = `<span style="color:#2ECC71;font-weight:700;">✓ Scanned Code: ${esc(decodedText)}</span>`;
              stopDeviceCamera();
              closeModal();
              processScannedBarcode(decodedText, targetContext || 'camera_scan');
            },
            function(errorMessage){}
          );
        } catch(secondErr) {
          throw firstErr;
        }
      }

      if(statusEl) statusEl.innerHTML = `<span style="color:#2ECC71;font-weight:700;">⚡ High-Speed Camera Active</span>`;

      enumerateCameraDevices(deviceId);
      return;
    } catch(err){
      console.warn("Html5Qrcode engine initialization error:", err);
      const isFileProtocol = window.location.protocol === 'file:';
      const hint = isFileProtocol 
        ? `<div style="margin-top:6px;background:rgba(243,156,18,.15);color:var(--stamp);padding:8px 12px;border-radius:6px;font-size:.76rem;line-height:1.4;">💡 <strong>Browser Security Note:</strong> Cameras require an <code>https://</code> website link (like your live GitHub Pages link) or <code>http://localhost</code>. Browsers block cameras on local <code>file:///</code> links. Open your HTTPS GitHub Pages link or use USB/Bluetooth barcode gun / manual entry below!</div>` 
        : `<div style="margin-top:6px;font-size:.76rem;color:var(--muted);">Please grant camera permission in browser settings, or select a camera from dropdown.</div>`;

      if(statusEl) statusEl.innerHTML = `<span style="color:#FF4D4D;font-weight:600;">⚠️ Camera Error: ${esc(err.message||'Could not access camera.')}</span>${hint}`;
    }
  } else {
    if(statusEl) statusEl.innerHTML = `<span style="color:#FF4D4D;font-weight:600;">⚠️ Barcode Engine Library loading... Please retry.</span>`;
  }
}

async function captureCameraSnapshotAndDecode(targetContext){
  const statusEl = document.getElementById('cameraScannerStatus');
  const videoEl = document.querySelector('#html5QrCodeReader video') || document.getElementById('cameraScannerVideo');
  
  if(!videoEl){
    if(statusEl) statusEl.innerHTML = `<span style="color:#FF4D4D;">⚠️ Camera video element not active yet.</span>`;
    return;
  }

  try {
    if(statusEl) statusEl.innerHTML = `<span style="color:#0088FF;font-weight:700;">📸 Capturing high-resolution snapshot & analyzing...</span>`;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1280;
    canvas.height = videoEl.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async function(blob){
      if(!blob) return;
      const file = new File([blob], "barcode_snapshot.png", { type: "image/png" });
      
      try {
        if(html5QrCodeScanner){
          const result = await html5QrCodeScanner.scanFileV2(file);
          if(result && result.decodedText){
            if(statusEl) statusEl.innerHTML = `<span style="color:#2ECC71;font-weight:700;">✓ Scanned Code: ${esc(result.decodedText)}</span>`;
            stopDeviceCamera();
            closeModal();
            processScannedBarcode(result.decodedText, targetContext || 'camera_snapshot');
            return;
          }
        }
      } catch(err){
        console.warn("Snapshot scanFile error:", err);
        if(statusEl) statusEl.innerHTML = `<span style="color:#E74C3C;font-weight:600;">⚠️ Could not decode barcode from snapshot. Ensure barcode is clear.</span>`;
      }
    }, 'image/png');
  } catch(e){
    console.error("Snapshot error:", e);
  }
}

async function uploadBarcodeImage(input, targetContext){
  if(!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const statusEl = document.getElementById('cameraScannerStatus');
  
  try {
    if(statusEl) statusEl.innerHTML = `<span style="color:#0088FF;font-weight:700;">🖼️ Analyzing uploaded photo...</span>`;
    if(html5QrCodeScanner){
      const result = await html5QrCodeScanner.scanFileV2(file);
      if(result && result.decodedText){
        stopDeviceCamera();
        closeModal();
        processScannedBarcode(result.decodedText, targetContext || 'image_upload');
        return;
      }
    }
  } catch(err){
    alert('Could not detect a barcode in this image file. Please ensure the barcode is clear and well-lit.');
  }
}

async function enumerateCameraDevices(selectedId){
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    const selectEl = document.getElementById('cameraSelectDropdown');
    if(selectEl && videoInputs.length > 0){
      selectEl.innerHTML = videoInputs.map((d, i) => `<option value="${d.deviceId}" ${d.deviceId===selectedId ? 'selected' : ''}>${esc(d.label || 'Camera ' + (i+1))}</option>`).join('');
      selectEl.style.display = 'inline-block';
    }
  } catch(e){}
}

function openScanModal(targetContext){
  try {
    activeScannerMode = 'camera';

    openModal(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;">📷 Multi-Device Barcode Scanner</h3>
        <button type="button" class="btn-secondary" onclick="closeModal()" style="padding:4px 10px;">✕ Close</button>
      </div>

      <!-- SOURCE TABS -->
      <div style="display:flex;gap:8px;background:var(--paper);padding:4px;border-radius:8px;margin-bottom:14px;border:1px solid var(--border-strong);">
        <button id="tabBtnCam" type="button" class="btn-primary" style="flex:1;padding:8px;font-size:.82rem;font-weight:700;" onclick="switchScannerMode('camera', '${targetContext||''}')">
          🎥 Device Camera (Webcam / Rear)
        </button>
        <button id="tabBtnHw" type="button" class="btn-secondary" style="flex:1;padding:8px;font-size:.82rem;font-weight:700;" onclick="switchScannerMode('hardware', '${targetContext||''}')">
          📡 USB / Bluetooth Scanner Gun
        </button>
      </div>

      <!-- MODE 1: DEVICE CAMERA VIEWFINDER -->
      <div id="scannerModeCamera">
        <div id="cameraVideoContainer" style="position:relative;background:#000;border-radius:12px;height:380px;max-height:55vh;overflow:hidden;margin-bottom:10px;border:1px solid var(--border-strong);">
        </div>

        <!-- CAMERA ACTIONS CONTROL ROW -->
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          <button type="button" class="btn-primary" style="flex:1;padding:8px 12px;font-size:.8rem;font-weight:700;" onclick="captureCameraSnapshotAndDecode('${targetContext||''}')">
            📸 Snap &amp; Decode Photo
          </button>
          <label class="btn-secondary" style="padding:8px 12px;font-size:.8rem;font-weight:700;margin:0;cursor:pointer;display:inline-flex;align-items:center;">
            🖼️ Upload Photo
            <input type="file" accept="image/*" style="display:none;" onchange="uploadBarcodeImage(this, '${targetContext||''}')">
          </label>
          <button type="button" class="btn-secondary" style="padding:8px 12px;font-size:.8rem;font-weight:700;" onclick="toggleCameraTorch()">
            🔦 Torch
          </button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
          <div id="cameraScannerStatus" style="font-size:.78rem;color:var(--muted);flex:1;">Starting high-speed camera scanner...</div>
          <select id="cameraSelectDropdown" style="display:none;padding:4px 8px;font-size:.75rem;border-radius:6px;border:1px solid var(--border);" onchange="startDeviceCamera(this.value, '${targetContext||''}')"></select>
        </div>
      </div>

      <!-- MODE 2: USB / BLUETOOTH HARDWARE GUN -->
      <div id="scannerModeHardware" style="display:none;">
        <div style="background:rgba(46,204,113,.12);border:1px solid rgba(46,204,113,.3);color:var(--green);padding:14px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;gap:12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
          <div>
            <strong style="font-size:.85rem;">USB / Bluetooth Hardware Gun Active</strong>
            <div style="font-size:.76rem;margin-top:2px;">Point your wireless/USB barcode gun at any barcode label. Keystrokes will be captured instantly.</div>
          </div>
        </div>
      </div>

      <!-- MANUAL SCAN FORM -->
      <form onsubmit="handleQuickScanSubmit(event, '${targetContext||''}');">
        <label style="font-size:.8rem;">Barcode / SKU Entry</label>
        <div style="display:flex;gap:8px;">
          <input id="quickScanInput" placeholder="Scan or type barcode number..." required style="flex:1;font-family:var(--font-mono);font-size:1.05rem;font-weight:700;">
          <button type="submit" class="btn-primary" style="padding:0 20px;">Process</button>
        </div>
        <div class="modal-actions" style="margin-top:16px;">
          <button type="button" class="btn-secondary" onclick="closeModal()">Close</button>
        </div>
      </form>
    `);

    setTimeout(()=>{
      try { startDeviceCamera(null, targetContext); } catch(e){}
      const input = document.getElementById('quickScanInput');
      if(input) input.focus();
    }, 100);
  } catch(err){
    console.error('Scan modal error:', err);
  }
}

function switchScannerMode(mode, targetContext){
  activeScannerMode = mode;
  const camDiv = document.getElementById('scannerModeCamera');
  const hwDiv = document.getElementById('scannerModeHardware');
  const btnCam = document.getElementById('tabBtnCam');
  const btnHw = document.getElementById('tabBtnHw');

  if(mode === 'camera'){
    if(camDiv) camDiv.style.display = 'block';
    if(hwDiv) hwDiv.style.display = 'none';
    if(btnCam){ btnCam.className = 'btn-primary'; }
    if(btnHw){ btnHw.className = 'btn-secondary'; }
    startDeviceCamera(null, targetContext);
  } else {
    stopDeviceCamera();
    if(camDiv) camDiv.style.display = 'none';
    if(hwDiv) hwDiv.style.display = 'block';
    if(btnCam){ btnCam.className = 'btn-secondary'; }
    if(btnHw){ btnHw.className = 'btn-primary'; }
    const input = document.getElementById('quickScanInput');
    if(input) input.focus();
  }
}

function handleQuickScanSubmit(e, targetContext){
  e.preventDefault();
  const input = document.getElementById('quickScanInput');
  if(!input) return;
  const val = input.value.trim();
  stopDeviceCamera();
  closeModal();
  if(val){
    processScannedBarcode(val, targetContext || 'manual_scan');
  }
}

function playBeepSound(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch(e){}
}

function triggerBarcodeSpotlight(product, scannedCode){
  lastScannedCode = scannedCode;
  spotlightSecondsLeft = 120;
  playBeepSound();
  if(barcodeSpotlightTimer) clearInterval(barcodeSpotlightTimer);
  barcodeSpotlightTimer = setInterval(function(){
    spotlightSecondsLeft--;
    const timerEl = document.getElementById('spotlightCountdownTimer');
    if(timerEl) timerEl.innerText = spotlightSecondsLeft + 's';
    if(spotlightSecondsLeft <= 0){
      clearInterval(barcodeSpotlightTimer);
      barcodeSpotlightTimer = null;
      render();
    }
  }, 1000);
  render();
}

function showBarcodeToast(msg){
  let toast = document.getElementById('barcodeToastNotification');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'barcodeToastNotification';
    toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;background:var(--card);color:var(--ink);border:1px solid var(--harbor);padding:12px 20px;border-radius:10px;font-weight:700;font-size:0.88rem;box-shadow:0 10px 30px rgba(0,136,255,0.4);transition:opacity 0.3s ease;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.style.opacity = '1';
  setTimeout(function(){
    if(toast) toast.style.opacity = '0';
  }, 2800);
}

function processScannedBarcode(val, context){
  val = String(val||'').trim();
  if(!val) return;

  // Check explicit spec input slots #sale-barcode-input or #prod-search-input if present
  const saleInput = document.getElementById('sale-barcode-input');
  if(saleInput){
    saleInput.value = val;
    saleInput.dispatchEvent(new Event('input', { bubbles: true }));
    saleInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const prodSearchInput = document.getElementById('prod-search-input');
  if(prodSearchInput){
    prodSearchInput.value = val;
    prodSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
    prodSearchInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const matched = lookupProductByBarcode(val);
  logScan(val, matched, context);
  saveDB();
  playBeepSound();

  // 1. SLOT AUTO-FILL: Check if user currently has an active input element focused on screen
  const activeEl = document.activeElement;
  if(activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') && activeEl.id !== 'quickScanInput'){
    activeEl.value = val;
    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    activeEl.dispatchEvent(new Event('change', { bubbles: true }));
    showBarcodeToast(`✓ Barcode auto-filled into slot: ${esc(val)}`);
    return;
  }

  // 2. CONTEXT-AWARE HIGH-SPEED MODULE ACTIONS
  if(currentTab === 'sales'){
    if(matched){
      if(typeof addToSalesCart === 'function') addToSalesCart(matched.code);
      const stockColor = (matched.stock <= (matched.minStock||5)) ? '#FF4D4D' : '#2ECC71';
      showBarcodeToast(`⚡ 1x ${esc(matched.name)} added to cart! &nbsp;|&nbsp; <span style="color:${stockColor};font-weight:800;">📦 Stock: ${matched.stock} Units</span>`);
    } else {
      showBarcodeToast(`⚠️ Unrecognized barcode: ${esc(val)}`);
    }
    return;
  }

  if(currentTab === 'purchases'){
    if(matched){
      if(typeof addPoItemByCode === 'function') addPoItemByCode(matched.code);
      showBarcodeToast(`⚡ 1x ${esc(matched.name)} added to PO! &nbsp;|&nbsp; <span style="font-weight:800;">📦 Current Stock: ${matched.stock} Units</span>`);
    } else {
      showBarcodeToast(`⚠️ Unrecognized barcode: ${esc(val)}`);
    }
    return;
  }

  if(currentTab === 'products'){
    productSearchFilter = val;
    render();
    const stockColor = (matched.stock <= (matched.minStock||5)) ? '#FF4D4D' : '#2ECC71';
    showBarcodeToast(`✓ Matched: ${esc(matched.name)} &nbsp;|&nbsp; <span style="color:${stockColor};font-weight:800;">📦 Live Inventory Stock: ${matched.stock} Units</span>`);
    return;
  }

  // 3. DEFAULT MATCHED SPOTLIGHT OR ADD PRODUCT PROMPT
  if(matched){
    triggerBarcodeSpotlight(matched, val);
    const stockColor = (matched.stock <= (matched.minStock||5)) ? '#FF4D4D' : '#2ECC71';
    const lowStockAlert = (matched.stock <= (matched.minStock||5)) ? `<span style="color:#FF4D4D;font-weight:800;"> ⚠️ LOW STOCK!</span>` : '';
    showBarcodeToast(`✓ ${esc(matched.name)} (${esc(matched.code)}) &nbsp;|&nbsp; <span style="color:${stockColor};font-weight:800;">📦 Warehouse Stock: ${matched.stock} Units Available</span>${lowStockAlert}`);
  } else {
    openModal(`
      <div style="text-align:center;padding:10px;">
        <div style="font-size:2.5rem;margin-bottom:8px;">⚠️</div>
        <h3>Unrecognized Barcode / SKU</h3>
        <p style="font-family:var(--font-mono);font-size:1.1rem;color:var(--harbor);font-weight:700;">${esc(val)}</p>
        <p style="color:var(--muted);font-size:.88rem;">This code is not assigned to any product in your Product Master catalog.</p>
        <div class="modal-actions" style="justify-content:center;margin-top:20px;">
          <button class="btn-secondary" onclick="closeModal()">Close</button>
          <button class="btn-primary" onclick="closeModal(); openProductForm('', '${esc(val)}');">+ Add New Product With This Barcode</button>
        </div>
      </div>
    `);
  }
}

// ============================================================
// UNIVERSAL HARDWARE USB / BLUETOOTH BARCODE GUN ENGINE
// ============================================================
let hardwareBarcodeBuffer = '';
let lastKeyTimestamp = 0;
let keyIntervals = [];

document.addEventListener('keydown', function(e){
  if(e.ctrlKey || e.altKey || e.metaKey) return;

  const now = Date.now();
  const timeDiff = now - lastKeyTimestamp;
  lastKeyTimestamp = now;

  if(timeDiff > 350){
    hardwareBarcodeBuffer = '';
    keyIntervals = [];
  } else {
    keyIntervals.push(timeDiff);
  }

  if(e.key === 'Enter' || e.key === 'Tab'){
    if(hardwareBarcodeBuffer.length >= 3){
      const scannedCode = hardwareBarcodeBuffer.trim();
      hardwareBarcodeBuffer = '';
      keyIntervals = [];
      
      e.preventDefault();
      e.stopPropagation();

      closeModal();
      processScannedBarcode(scannedCode, 'hardware_usb_gun');
    }
    hardwareBarcodeBuffer = '';
  } else if(e.key && e.key.length === 1){
    hardwareBarcodeBuffer += e.key;

    if(hardwareBarcodeBuffer.length >= 13){
      const avgSpeed = keyIntervals.length ? (keyIntervals.reduce((a,b)=>a+b,0) / keyIntervals.length) : 100;
      if(avgSpeed < 50){
        if(window._gunDebounceTimer) clearTimeout(window._gunDebounceTimer);
        window._gunDebounceTimer = setTimeout(function(){
          if(hardwareBarcodeBuffer.length >= 8){
            const code = hardwareBarcodeBuffer.trim();
            hardwareBarcodeBuffer = '';
            keyIntervals = [];
            processScannedBarcode(code, 'hardware_usb_gun_fast');
          }
        }, 120);
      }
    }
  }
}, true);
