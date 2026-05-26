# Sri Ponniamman Temple Trust (R)
## Aadi Festival 2026 — Donation Receipt PWA

A single-page Progressive Web App (PWA) for recording donations, generating printed receipts, and syncing entries to Google Sheets automatically.

---

## Folder Structure

```
Donation/
├── index.html            ← Main PWA (open this in browser)
├── apps-script.gs        ← Google Apps Script (paste in Sheet)
├── images/
│   ├── logo.png          ← Temple logo (replace with actual image)
│   └── watermark.jpg     ← Festival watermark (replace with actual image)
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

Alternatively, open the PWA → **Settings tab** → upload images directly from your device. They will be saved in the browser and used on the receipt.

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

6. Open the PWA → **Settings tab** → paste the URL into **Apps Script URL** → Save.

7. Click **Test Connection** — you should see "Connected ✓".

---

## Sheet Columns (💰 Donations)

| Col | Field | Description |
|-----|-------|-------------|
| A | Receipt No. | Auto-generated (e.g., SPTT-2026-001) |
| B | Date | Date on the receipt |
| C | Donor Name | Full name with Sri/Smt prefix |
| D | Total (₹) | Full donation amount |
| E | Received (₹) | Amount received at time of entry |
| F | Balance (₹) | Calculated: Total − Received |
| G | Payment Mode | Cash / UPI / Cheque / DD / NEFT |
| H | Date Received | Date payment was received |
| I | Received By | Temple volunteer/staff name |
| J | Payment Status | Paid / Partial (auto-coloured) |
| K | Phone | Donor WhatsApp number |
| L | Drive Link | Google Drive receipt HTML link |
| M | Timestamp | Date/time of data entry |

---

## Features

- **Auto Receipt Number** — Sequential numbering (configurable starting number)
- **Festival Motif** — Ribbon banner "Aadi Festival · 16 August 2026" on receipt
- **Design 4B** — Maroon (#7B0D3E) & Ivory Gold (#E8D5A3) temple colour scheme
- **Download as Image** — High-resolution PNG via html2canvas (scale 3×)
- **Print** — Browser print dialog with receipt styling
- **Auto-save to Sheet** — Runs silently in background when receipt is generated
- **WhatsApp Share** — Available in History tab; sends receipt link to donor
- **Offline Support** — Service Worker caches app for offline use
- **History Tab** — View all past receipts stored in browser

---

## Receipt Fields

| Field | Notes |
|-------|-------|
| Received from Sri/Smt | Donor name (prefix selectable) |
| Amount (₹) | Donation amount |
| Amount in Words | Auto-converted (Indian number system) |
| Payment Mode | Cash / UPI / Cheque / DD / NEFT |
| Received by | Volunteer/staff name |
| WhatsApp No. | For sharing receipt (not printed) |
| Date | Defaults to today |
| Receipt No. | Auto-generated, editable |

---

## Trust Details

**Sri Ponniamman Temple Trust (R)**  
54, Bhajanai Koil Street, Gundaleri Village, Ranipet Dt, Tamil Nadu

**Aadi Festival — 42nd Year | 16 August 2026**
