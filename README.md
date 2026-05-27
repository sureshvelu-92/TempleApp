# Sri Ponniamman Temple Trust (R)
## Aadi Festival 2026 — Donation & Expense PWA

A single-page Progressive Web App (PWA) for recording donations and expenses, generating printed receipts, and syncing entries to Google Sheets automatically.

---

## Folder Structure

```
TempleApp/
├── index.html            ← Main PWA (open this in browser)
├── apps-script.gs        ← Google Apps Script (paste in Sheet)
├── manifest.json         ← PWA manifest
├── sw.js                 ← Service Worker (offline support)
├── images/
│   ├── logo.png          ← Temple logo (replace with actual image)
│   ├── watermark.jpg     ← Festival watermark (replace with actual image)
│   └── icon-192.png      ← App icon for home screen
└── README.md
```

---

## GitHub Pages Setup

1. Push this entire folder to a GitHub repository.
2. Go to **Settings → Pages** → Source: `main` branch, `/ (root)`.
3. Your app will be live at:  
   `https://<your-username>.github.io/<repo-name>/`

### Replacing Images

After pushing to GitHub, replace the placeholder images with the actual temple images:

| File | Description |
|------|-------------|
| `images/logo.png` | Clean Ponniamman illustration (white/transparent background) |
| `images/watermark.jpg` | Festival decorated Amman photo (dark background) |
| `images/icon-192.png` | App icon shown on home screen and install banner |

Alternatively, open the PWA → **Settings panel (⚙️)** → upload images directly from your device. They will be saved in the browser and used on the receipt.

---

## Google Apps Script Setup

1. Open the Google Sheet:  
   `https://docs.google.com/spreadsheets/d/12PgU-zwv8gBrFfxvJpoPIPcxUHWup-vsxMH3HWUigZ8/`

2. Click **Extensions → Apps Script**.

3. Delete any existing code and paste the full contents of `apps-script.gs`.

4. Click **Deploy → New Deployment**:
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**

5. Click **Deploy** and copy the Web App URL.

6. Open the PWA → **Settings panel (⚙️)** → paste the URL into **Apps Script URL** → Save.

7. Click **Test Connection** — you should see "Connected ✓".

---

## Sheet Tabs

The Google Sheet has three tabs, each synced from the app:

### 💰 Donations

| Col | Field | Description |
|-----|-------|-------------|
| A | Receipt No. | Auto-generated (e.g., SPTT-2026-001) |
| B | Date | Date on the receipt |
| C | Donor Name | Full name with Sri/Smt prefix |
| D | Total (₹) | Full donation amount |
| E | Received (₹) | Amount received at time of entry |
| F | Balance (₹) | Calculated: Total − Received |
| G | Payment Mode | Cash / UPI |
| H | Date Received | Date payment was received |
| I | Received By | Temple volunteer/staff name |
| J | Payment Status | Paid / Partial (auto-coloured) |
| K | Phone | Donor WhatsApp number |
| L | Drive Link | Google Drive receipt HTML link |
| M | Timestamp | Date/time of data entry |

### 🌿 In-Kind Donations

| Col | Field | Description |
|-----|-------|-------------|
| A | Receipt No. | Auto-generated (e.g., IK-2026-001) |
| B | Date | Date of donation |
| C | Donor Name | Full name with Sri/Smt prefix |
| D | Item Description | What was donated |
| E | Quantity | Qty / unit |
| F | Category | Clothing / Food / Flowers / Vessels / Misc |
| G | Est. Value (₹) | Optional estimated value |
| H | Received By | Temple volunteer/staff name |
| I | Phone | Donor WhatsApp number |
| J | Timestamp | Date/time of data entry |

### 💸 Expenses

| Col | Field | Description |
|-----|-------|-------------|
| A | Voucher No. | Auto-generated (e.g., EXP-2026-001) |
| B | Date | Date of expense |
| C | Vendor / Payee | Who was paid |
| D | Amount (₹) | Expense amount |
| E | Description | What the payment was for |
| F | Category | Puja & Rituals / Decorations & Flowers / Food & Catering / Infrastructure & Logistics / Miscellaneous |
| G | Payment Mode | Cash / UPI / Bank Transfer |
| H | Paid By | Volunteer/staff who made the payment |
| I | Timestamp | Date/time of data entry |

---

## Features

- **PIN Login** — 4-digit PIN protects the app; configurable in Settings
- **Donation Tab** — Entry and Records sub-tabs
  - **Cash / UPI Donations** — Standard monetary donations with receipt
  - **In-Kind Donations** — Record item donations (sarees, food, flowers, etc.)
  - **Payment Pending** — Save a draft for donors who haven't paid yet; update later via Records
- **Expense Tab** — Entry and Records sub-tabs for tracking all festival expenditure
- **Auto Receipt / Voucher Numbers** — Sequential numbering per type (configurable starting number)
- **Records Search** — Search and paginate through past entries in both Donation and Expense tabs
- **Update Received** — Mark partial donations as paid from the Donation Records view
- **Festival Motif** — Ribbon banner "42nd Year Aadi Festival · 16 August 2026" on receipt
- **Design 4B** — Maroon (#7B0D3E) & Ivory Gold (#E8D5A3) temple colour scheme
- **Download as Image** — High-resolution PNG via html2canvas (scale 3×)
- **WhatsApp Share** — Share receipt image directly to donor from the Receipt tab
- **Auto-sync to Sheet** — Runs silently in background; connection status shown in header
- **Offline Support** — Service Worker caches the app for use without internet
- **Install as App** — PWA install banner on mobile for home screen access

---

## Receipt Fields

| Field | Notes |
|-------|-------|
| Receipt No. | Auto-generated, editable |
| Date | Defaults to today |
| Received from Sri/Smt. | Donor name (prefix selectable) |
| Amount (₹) | Donation amount (Cash/UPI mode) |
| Amount in Words | Auto-converted (Indian number system) |
| Item Description | Donated item (In-Kind mode) |
| Quantity | Qty/unit (In-Kind mode) |
| Payment Mode / Category | Cash, UPI (cash) or item category (in-kind) |
| Received by | Volunteer/staff name |
| WhatsApp No. | For sharing receipt (not printed) |

---

## Settings Panel (⚙️)

Accessible via the gear icon in the app header:

- **Volunteers / Receivers / Payers** — Manage the list of names shown in dropdowns
- **Logo Image** — Upload temple logo for the receipt header
- **Watermark Image** — Upload festival image for the receipt background
- **Apps Script URL** — Paste and test the Google Sheets Web App URL
- **Starting Receipt No.** — Set the first receipt number for the season
- **PIN** — Change the 4-digit app login PIN

---

## Trust Details

**Sri Ponniamman Temple Trust (R)**  
54, Bhajanai Koil Street, Gundaleri Village, Ranipet Dt, Tamil Nadu  
Branch: 39, Ramakrishna Mutt Road, Ulsoor, Bangalore – 560 008  
PAN: AAYTS1092E | Regd. No.: 64/2013 Dated 02/09/2013

**Aadi Festival — 42nd Year | 16 August 2026**
