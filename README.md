# NEXUZ LANKA LK CN - China Import Business ERP & POS Web App

A modern, high-performance, modular **Web Application ERP** tailored specifically for China-to-Sri Lanka import trading businesses, inventory management, landed cost allocation, daily laborer tracking, and retail/wholesale point-of-sale (POS).

---

## 📂 Flat Web Application Architecture (1-Click GitHub Drag & Drop Upload)

All files live directly in the root folder without subdirectories so you can upload all files directly via the **GitHub Web UI** or **Git CLI**:

```
d:/Claude China Biz/
├── index.html                   # Semantic HTML5 Container
├── styles.css                   # Design system, CSS variables & mobile UI styles
├── db.js                        # Database storage layer, localStorage & Supabase auto-sync
├── utils.js                     # Formatting helpers, barcode SVG, chart SVG & Landed Cost Engine
├── scanner.js                   # Ultra-fast 40 FPS Camera & Hardware USB/Bluetooth Barcode Engine
├── app.js                       # Application Router & Controller
├── module_dashboard.js          # Dashboard KPIs & 14-day sales trend chart
├── module_products.js           # Product Master, SKU generator & inventory levels
├── module_suppliers.js          # Suppliers directory & RMB payables ledger
├── module_purchases.js          # Purchase Orders (PO) & PO builder
├── module_cargo.js              # Cargo & Shipments tracking (Sea/Air LCL/FCL)
├── module_landedcost.js         # Landed cost allocation matrix (CBM/Value/Qty)
├── module_inventory.js          # Stock list & stock ledger movement
├── module_labels.js             # Barcode & price label studio
├── module_quotations.js         # Quotations & convert-to-sale
├── module_sales.js              # Sales Register, POS cart & invoice printer
├── module_customers.js          # Customer accounts & credit limit tracker
├── module_delivery.js           # Delivery dispatch notes & tracking
├── module_payments.js           # Customer & supplier payment vouchers
├── module_returns.js            # Customer & supplier returns log
├── module_expenses.js           # Operating expenses log
├── module_labor.js              # Daily laborers attendance roster & OT wages
├── module_hr.js                 # Salaried staff HR & EPF/ETF payroll
├── module_financial.js          # Financial statements & P&L report
├── module_reports.js            # Reports & analytics dashboard
├── module_settings.js           # Enterprise company settings & Supabase Cloud Sync
└── README.md                    # Setup & GitHub deployment guide
```

---

## 🚀 How to Upload to GitHub in 1 Click (Web UI or Git CLI)

### Method A: Upload Directly via GitHub Web Browser (No Git Required)
1. Go to your GitHub repository in your web browser.
2. Click **Add file ➔ Upload files**.
3. Open `d:\Claude China Biz\` on your PC, select **ALL 27 files** at once, and drag & drop them into GitHub!
4. Click **Commit Changes** — Done!

### Method B: Deploy via Terminal / Git CLI
```bash
git init
git add .
git commit -m "Upload Nexuz Lanka ERP Web App"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git branch -M main
git push -u origin main
```

---

## 🌐 Enable Free GitHub Pages Web Hosting
1. Go to GitHub repository **Settings**.
2. Scroll to **Pages** on the left sidebar.
3. Under **Source**, choose `Deploy from a branch`, select `main` branch, and click **Save**.
4. Your Web App will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

---

## ⚡ Supabase Cloud Real-Time Auto-Sync Connected
Your ERP is pre-connected to Supabase project `https://huhqzccyfgklxdgxbinm.supabase.co` with automated 1-second cloud auto-save and multi-device real-time sync across iPhones, iPads, and PCs.
