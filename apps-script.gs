/**
 * Sri Ponniamman Temple Trust (R)
 * Google Apps Script – Sheet + Drive Integration
 * Aadi Festival 2026 – Donation Receipt System
 *
 * SETUP:
 * 1. Open the Google Sheet → Extensions → Apps Script → paste this code
 * 2. Deploy → New Deployment → Web App
 *    Execute as: Me  |  Access: Anyone
 * 3. Copy the Web App URL → paste in PWA Settings tab
 *
 * SHEET COLUMNS (💰 Donations):
 *  A  Receipt No.      B  Date           C  Donor Name
 *  D  Total (₹)        E  Received (₹)   F  Balance (₹)
 *  G  Payment Mode     H  Date Received  I  Received By
 *  J  Payment Status   K  Phone          L  Drive Link
 *  M  Timestamp
 */

const SHEET_NAME   = '💰 Donations';
const DRIVE_FOLDER = 'SPTT Donation Receipts';

const HEADERS = [
  'Receipt No.',
  'Date',
  'Donor Name',
  'Total (₹)',
  'Received (₹)',
  'Balance (₹)',
  'Payment Mode',
  'Date Received',
  'Received By',
  'Payment Status',
  'Phone',
  'Drive Link',
  'Timestamp'
];

// ═══════════════════════════════════════════════════════════
//  ENTRY POINTS
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    if (action === 'ping')          return ok({ message: 'Connected ✓' });
    if (action === 'addDonation')   return addDonation(e.parameter);
    if (action === 'saveToDrive')   return saveReceiptToDrive(e.parameter);
    if (action === 'getReceipts')   return getReceipts();
    return ok({ message: 'Unknown action' });
  } catch (err) {
    return ok({ status: 'error', message: err.toString() });
  }
}

function doPost(e) { return doGet(e); }

// ═══════════════════════════════════════════════════════════
//  ADD ROW TO SHEET
// ═══════════════════════════════════════════════════════════
function addDonation(p) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const amount   = parseFloat(p.amount)   || 0;
  const received = parseFloat(p.received) || amount;   // if not supplied, full amount received
  const balance  = amount - received;

  const row = [
    p.receiptNo      || '',           // A – Receipt No.
    formatDate(p.date),               // B – Date
    p.donor          || '',           // C – Donor Name
    amount,                           // D – Total (₹)
    received,                         // E – Received (₹)
    balance,                          // F – Balance (₹)
    p.mode           || 'Cash',       // G – Payment Mode
    formatDate(p.date),               // H – Date Received
    p.receivedBy     || '',           // I – Received By
    balance <= 0 ? 'Paid' : 'Partial',// J – Payment Status
    p.phone          || '',           // K – Phone
    p.driveLink      || '',           // L – Drive Link
    new Date()                        // M – Timestamp
  ];

  sheet.appendRow(row);

  const lr = sheet.getLastRow();

  // Number formatting
  sheet.getRange(lr, 4).setNumberFormat('₹#,##,##0.00');   // Total
  sheet.getRange(lr, 5).setNumberFormat('₹#,##,##0.00');   // Received
  sheet.getRange(lr, 6).setNumberFormat('₹#,##,##0.00');   // Balance
  sheet.getRange(lr, 13).setNumberFormat('dd/MM/yyyy HH:mm:ss'); // Timestamp

  // Alternating row colours
  const bg = lr % 2 === 0 ? '#FFFDE7' : '#FFFFFF';
  sheet.getRange(lr, 1, 1, HEADERS.length).setBackground(bg);

  // Colour-code Payment Status
  const statusCell = sheet.getRange(lr, 10);
  if (balance <= 0) {
    statusCell.setBackground('#C8E6C9').setFontColor('#1B5E20'); // green – Paid
  } else {
    statusCell.setBackground('#FFF9C4').setFontColor('#F57F17'); // amber – Partial
  }

  return ok({ status: 'success', receiptNo: p.receiptNo, row: lr });
}

// ═══════════════════════════════════════════════════════════
//  SAVE RECEIPT HTML TO GOOGLE DRIVE
// ═══════════════════════════════════════════════════════════
function saveReceiptToDrive(p) {
  const folder = getOrCreateFolder(DRIVE_FOLDER);

  const [y, m, d] = (p.date || '2026-01-01').split('-');
  const safeName   = (p.donor || 'Donor').split(',')[0].trim().replace(/\s+/g, '_');
  const fileName   = `Receipt_${p.receiptNo}_${safeName}_${d}${m}${y}.html`;

  const html = p.receiptHtml || buildFallbackHTML(p);
  const blob = Utilities.newBlob(html, 'text/html', fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const link = file.getUrl();

  // Record in sheet with drive link
  p.driveLink = link;
  addDonation(p);

  return ok({ status: 'success', fileName: fileName, link: link });
}

// ═══════════════════════════════════════════════════════════
//  GET ALL RECEIPTS (for PWA history)
// ═══════════════════════════════════════════════════════════
function getReceipts() {
  const sheet = getSheet();
  if (sheet.getLastRow() <= 1) return ok({ status: 'success', data: [] });

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const rows = data.map(r => ({
    receiptNo   : r[0],
    date        : r[1],
    donor       : r[2],
    total       : r[3],
    received    : r[4],
    balance     : r[5],
    mode        : r[6],
    dateReceived: r[7],
    receivedBy  : r[8],
    status      : r[9],
    phone       : r[10],
    driveLink   : r[11],
    timestamp   : r[12]
  }));

  return ok({ status: 'success', data: rows });
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function getOrCreateFolder(name) {
  const iter = DriveApp.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(name);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    const hr = sheet.getRange(1, 1, 1, HEADERS.length);
    hr.setBackground('#1A0010');
    hr.setFontColor('#E8D5A3');
    hr.setFontWeight('bold');
    hr.setFontSize(10);
    sheet.setFrozenRows(1);

    const widths = [100, 90, 200, 110, 110, 100, 110, 110, 150, 110, 120, 200, 150];
    widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildFallbackHTML(p) {
  const [y, m, d] = (p.date || '').split('-');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Receipt #${p.receiptNo}</title></head>
<body style="font-family:Georgia;background:#fffde7;padding:20px;">
<h2 style="color:#7B0D3E;">Sri Ponniamman Temple Trust (R)</h2>
<p><b>Receipt No:</b> ${p.receiptNo} &nbsp;&nbsp; <b>Date:</b> ${d}/${m}/${y}</p>
<p><b>Donor:</b> ${p.donor}</p>
<p><b>Amount:</b> ₹${parseFloat(p.amount || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
<p><b>In Words:</b> ${p.amountWords}</p>
<p><b>Payment Mode:</b> ${p.mode}</p>
<p><b>Received By:</b> ${p.receivedBy}</p>
</body></html>`;
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
