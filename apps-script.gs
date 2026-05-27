/**
 * Sri Ponniamman Temple Trust – Donation Receipt System
 * Aadi Festival 2026
 *
 * DEPLOY STEPS (do this ONCE):
 * 1. In this editor → click Save (💾)
 * 2. Click Deploy → Manage deployments
 * 3. Click the ✏️ pencil on your existing deployment
 * 4. Version → "New version" → Deploy
 * Same URL, new code. Done.
 */

// ── Cash Donations sheet ───────────────────────────────────
var SPREADSHEET_ID = '12PgU-zwv8gBrFfxvJpoPIPcxUHWup-vsxMH3HWUigZ8';
var SHEET_NAME     = '💰 Donations';
var HEADER_ROW     = 3;
var DATA_START     = 4;

// ── In-Kind sheet ──────────────────────────────────────────
var IK_SHEET_NAME = '🌿 In-Kind';
var IK_HEADER_ROW = 3;
var IK_DATA_START = 4;

// ── Expenses sheet ─────────────────────────────────────────
var EX_SHEET_NAME = '💸 Expenses';
var EX_HEADER_ROW = 3;
var EX_DATA_START = 4;

// ── Auth token — must match API_TOKEN in index.html ────────
var AUTH_TOKEN = 'SPTT@1985';

function doGet(e) {
  try {
    var action = (e.parameter.action || '').trim();
    var token  = (e.parameter.token  || '').trim();

    if (token !== AUTH_TOKEN) {
      return ok({ status: 'error', message: 'Unauthorized' });
    }

    if (action === 'ping')              return ok({ status: 'ok', message: 'Connected ✓', version: 11 });
    if (action === 'addDonation')       return addDonation(e.parameter);
    if (action === 'addInKindDonation') return addInKindDonation(e.parameter);
    if (action === 'addExpense')        return addExpense(e.parameter);
    if (action === 'getReceipts')         return getReceipts();
    if (action === 'getInKindDonations') return getInKindDonations();
    if (action === 'getExpenses')        return getExpenses();
    if (action === 'getLastSeq')         return getLastSeq();
    if (action === 'getLastInKindSeq')  return getLastInKindSeq();
    if (action === 'getLastExpenseSeq') return getLastExpenseSeq();
    if (action === 'updateReceived')    return updateReceived(e.parameter);
    return ok({ message: 'unknown action' });
  } catch(err) {
    return ok({ status: 'error', message: err.toString() });
  }
}

function doPost(e) { return doGet(e); }

// ══════════════════════════════════════════════════════════
//  CASH DONATIONS
// ══════════════════════════════════════════════════════════

function addDonation(p) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found: ' + SHEET_NAME });

  var amount = parseFloat(p.amount) || 0;

  // Find last row with an actual donor name in col B
  var lastRow = sheet.getLastRow();
  var bVals   = lastRow >= DATA_START
    ? sheet.getRange(DATA_START, 2, lastRow - DATA_START + 1, 1).getValues()
    : [];
  var lastDataRow = DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = DATA_START + i;
  }
  var newRow = lastDataRow + 1;
  var seqNo  = newRow - HEADER_ROW;

  // Read header row → map name → column number
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c + 1;
  }

  // Insert row — immediately clear full width, then copy format only
  sheet.insertRowAfter(lastDataRow);
  var totalColsDon = Math.max(sheet.getLastColumn(), lastCol);
  sheet.getRange(newRow, 1, 1, totalColsDon).clearContent();
  var src = sheet.getRange(lastDataRow, 1, 1, lastCol);
  var dst = sheet.getRange(newRow,      1, 1, lastCol);
  src.copyTo(dst, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

  function set(name, val) {
    if (col[name]) sheet.getRange(newRow, col[name]).setValue(val);
  }

  var received = (p.received !== undefined && p.received !== '') ? parseFloat(p.received) : amount;
  var balance  = amount - received;
  var status   = p.status || (received >= amount ? 'Received' : received > 0 ? 'Partial' : 'Pending');

  set('#',                 p.receiptNo || seqNo);
  set('Donor Name',        p.donor     || '');
  set('Phone',             p.phone     || '');
  set('Total (₹)',         amount);
  set('Received (₹)',      received);
  set('Balance (₹)',       balance);
  set('Payment Mode',      p.mode      || 'Cash');
  set('Date Received',     received > 0 ? makeDate(p.date) : '');
  set('Received By',       p.receivedBy || '');
  set('Purpose / Notes',   p.notes || 'Towards Aadi Festival');
  set('Payment Status',    status);
  set('Expected Pay Date', '');

  return ok({ status: 'success', receiptNo: p.receiptNo, row: newRow, seq: seqNo });
}

function getLastSeq() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found' });

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return ok({ status: 'success', lastSeq: 0 });

  // Find last row with actual donor name in col B
  var bVals = sheet.getRange(DATA_START, 2, lastRow - DATA_START + 1, 1).getValues();
  var lastDataRow = DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = DATA_START + i;
  }
  if (lastDataRow < DATA_START) return ok({ status: 'success', lastSeq: 0 });

  // Find '#' column dynamically
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var seqCol = 1;
  for (var c = 0; c < hdrVals.length; c++) {
    if ((hdrVals[c] || '').toString().trim() === '#') { seqCol = c + 1; break; }
  }

  var rawSeq  = sheet.getRange(lastDataRow, seqCol).getValue().toString();
  var lastPart = rawSeq.split('/').pop(); // handles "2026/155" → "155", plain "155" → "155"
  var lastSeq  = parseInt(lastPart.replace(/^[A-Za-z\-]+/, '')) || 0;
  return ok({ status: 'success', lastSeq: lastSeq });
}

// ══════════════════════════════════════════════════════════
//  IN-KIND DONATIONS
// ══════════════════════════════════════════════════════════

function addInKindDonation(p) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(IK_SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found: ' + IK_SHEET_NAME });

  // Find last row with an actual donor name in col B
  var lastRow = sheet.getLastRow();
  var bVals   = lastRow >= IK_DATA_START
    ? sheet.getRange(IK_DATA_START, 2, lastRow - IK_DATA_START + 1, 1).getValues()
    : [];
  var lastDataRow = IK_DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = IK_DATA_START + i;
  }
  var newRow = lastDataRow + 1;
  var seqNo  = newRow - IK_HEADER_ROW;

  // Read header row → map name → column number (cols A–I only)
  var IK_WRITE_COL = 9; // column I — app writes only up to here
  var hdrVals = sheet.getRange(IK_HEADER_ROW, 1, 1, IK_WRITE_COL).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c + 1;
  }

  // Insert row — immediately clear full width, then copy format only (cols A–I)
  sheet.insertRowAfter(lastDataRow);
  var totalColsIk = Math.max(sheet.getLastColumn(), IK_WRITE_COL);
  sheet.getRange(newRow, 1, 1, totalColsIk).clearContent();
  var src = sheet.getRange(lastDataRow, 1, 1, IK_WRITE_COL);
  var dst = sheet.getRange(newRow,      1, 1, IK_WRITE_COL);
  src.copyTo(dst, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

  function set(name, val) {
    if (col[name]) sheet.getRange(newRow, col[name]).setValue(val);
  }

  set('#',                p.receiptNo || ('2026/IK/' + seqNo));
  set('Donor Name',       p.donor      || '');
  set('Item Description', p.itemDesc   || '');
  set('Qty',              p.qty        || '');
  set('Est. Value (₹)',   parseFloat(p.estValue) || '');
  set('Category',         p.category   || '');
  set('Date Received',    makeDate(p.date));
  set('Received By',      p.receivedBy || '');
  set('Status',           'In Stock');

  return ok({ status: 'success', receiptNo: p.receiptNo, row: newRow, seq: seqNo });
}

function getLastInKindSeq() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(IK_SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'In-Kind sheet not found' });

  var lastRow = sheet.getLastRow();
  if (lastRow < IK_DATA_START) return ok({ status: 'success', lastSeq: 0 });

  // Find last row with actual donor name in col B
  var bVals = sheet.getRange(IK_DATA_START, 2, lastRow - IK_DATA_START + 1, 1).getValues();
  var lastDataRow = IK_DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = IK_DATA_START + i;
  }
  if (lastDataRow < IK_DATA_START) return ok({ status: 'success', lastSeq: 0 });

  // Find '#' column dynamically
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(IK_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var seqCol = 1;
  for (var c = 0; c < hdrVals.length; c++) {
    if ((hdrVals[c] || '').toString().trim() === '#') { seqCol = c + 1; break; }
  }

  // Handle both plain numbers (1) and prefixed strings (IK-1)
  var rawSeq   = sheet.getRange(lastDataRow, seqCol).getValue().toString();
  var lastPart = rawSeq.split('/').pop(); // handles "IK-2026/1" → "1", "EX-2026/1" → "1", old "IK-1" → "IK-1"
  var lastSeq  = parseInt(lastPart.replace(/^[A-Za-z\-]+/, '')) || 0;
  return ok({ status: 'success', lastSeq: lastSeq });
}

// ══════════════════════════════════════════════════════════
//  EXPENSES
// ══════════════════════════════════════════════════════════

function addExpense(p) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(EX_SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found: ' + EX_SHEET_NAME });

  var lastRow = sheet.getLastRow();
  var bVals   = lastRow >= EX_DATA_START
    ? sheet.getRange(EX_DATA_START, 2, lastRow - EX_DATA_START + 1, 1).getValues()
    : [];
  var lastDataRow = EX_DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = EX_DATA_START + i;
  }
  var newRow = lastDataRow + 1;
  var seqNo  = newRow - EX_HEADER_ROW;

  var EX_WRITE_COL = 8; // columns A–H
  var hdrVals = sheet.getRange(EX_HEADER_ROW, 1, 1, EX_WRITE_COL).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c + 1;
  }

  sheet.insertRowAfter(lastDataRow);
  // 1. Clear the ENTIRE new row first (full sheet width) — prevents any values
  //    inherited from the adjacent row during insertion from leaking through.
  var totalColsEx = Math.max(sheet.getLastColumn(), EX_WRITE_COL);
  sheet.getRange(newRow, 1, 1, totalColsEx).clearContent();
  // 2. Copy formatting only from the previous data row (keeps visual style)
  sheet.getRange(lastDataRow, 1, 1, EX_WRITE_COL)
       .copyTo(sheet.getRange(newRow, 1, 1, EX_WRITE_COL),
               SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);

  function set(name, val) {
    if (col[name]) sheet.getRange(newRow, col[name]).setValue(val);
  }

  set('#',             p.voucherNo  || ('2026/EX/' + seqNo));
  set('Date',          makeDate(p.date));
  set('Vendor/Payee',  p.vendor     || '');
  set('Description',   p.description || '');
  set('Category',      p.category   || '');
  set('Amount(₹)',     parseFloat(p.amount) || 0);
  set('Mode',          p.mode       || 'Cash');
  set('Paid By',       p.paidBy     || '');

  return ok({ status: 'success', voucherNo: p.voucherNo, row: newRow, seq: seqNo });
}

function getLastExpenseSeq() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EX_SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Expenses sheet not found' });

  var lastRow = sheet.getLastRow();
  if (lastRow < EX_DATA_START) return ok({ status: 'success', lastSeq: 0 });

  var bVals = sheet.getRange(EX_DATA_START, 2, lastRow - EX_DATA_START + 1, 1).getValues();
  var lastDataRow = EX_DATA_START - 1;
  for (var i = 0; i < bVals.length; i++) {
    if (bVals[i][0] !== '') lastDataRow = EX_DATA_START + i;
  }
  if (lastDataRow < EX_DATA_START) return ok({ status: 'success', lastSeq: 0 });

  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(EX_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var seqCol = 1;
  for (var c = 0; c < hdrVals.length; c++) {
    if ((hdrVals[c] || '').toString().trim() === '#') { seqCol = c + 1; break; }
  }

  var rawSeq   = sheet.getRange(lastDataRow, seqCol).getValue().toString();
  var lastPart = rawSeq.split('/').pop(); // handles "IK-2026/1" → "1", "EX-2026/1" → "1", old "IK-1" → "IK-1"
  var lastSeq  = parseInt(lastPart.replace(/^[A-Za-z\-]+/, '')) || 0;
  return ok({ status: 'success', lastSeq: lastSeq });
}

// ══════════════════════════════════════════════════════════
//  SHARED HELPERS
// ══════════════════════════════════════════════════════════

function getReceipts() {
  var sheet   = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'success', data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return ok({ status: 'success', data: [] });

  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c;
  }

  var vals = sheet.getRange(DATA_START, 1, lastRow - DATA_START + 1, lastCol).getValues();
  var rows = vals.filter(function(r){ return r[col['Donor Name'] || 1] !== ''; }).map(function(r){
    return {
      receiptNo  : r[col['#']               || 0],
      donor      : r[col['Donor Name']      || 1],
      total      : r[col['Total (₹)']       || 2],
      received   : r[col['Received (₹)']    || 3],
      balance    : r[col['Balance (₹)']     || 4],
      mode       : r[col['Payment Mode']    || 5],
      date       : r[col['Date Received']   || 6],
      receivedBy : r[col['Received By']     || 7],
      status     : r[col['Payment Status']  || 8],
      notes      : r[col['Purpose / Notes'] || 10]
    };
  });
  return ok({ status: 'success', data: rows });
}

function getInKindDonations() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(IK_SHEET_NAME);
  if (!sheet) return ok({ status: 'success', data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow < IK_DATA_START) return ok({ status: 'success', data: [] });

  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(IK_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c;
  }

  var vals = sheet.getRange(IK_DATA_START, 1, lastRow - IK_DATA_START + 1, lastCol).getValues();
  var rows = vals.filter(function(r){ return r[col['Donor Name'] || 1] !== ''; }).map(function(r){
    return {
      receiptNo  : r[col['#']                || 0],
      donor      : r[col['Donor Name']       || 1],
      itemDesc   : r[col['Item Description'] || 2],
      qty        : r[col['Qty']              || 3],
      estValue   : r[col['Est. Value (₹)']   || 4],
      category   : r[col['Category']         || 5],
      date       : r[col['Date Received']    || 6],
      receivedBy : r[col['Received By']      || 7],
      status     : r[col['Status']           || 8]
    };
  });
  return ok({ status: 'success', data: rows });
}

function getExpenses() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EX_SHEET_NAME);
  if (!sheet) return ok({ status: 'success', data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow < EX_DATA_START) return ok({ status: 'success', data: [] });

  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(EX_HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c;
  }

  var vals = sheet.getRange(EX_DATA_START, 1, lastRow - EX_DATA_START + 1, lastCol).getValues();
  var vendorIdx = col['Vendor/Payee'] !== undefined ? col['Vendor/Payee'] : 2;
  var amtIdx    = col['Amount(₹)']    !== undefined ? col['Amount(₹)']    : 5;
  var rows = vals.filter(function(r){
    return r[vendorIdx] !== '' && (parseFloat(r[amtIdx]) || 0) > 0;
  }).map(function(r){
    return {
      voucherNo   : r[col['#']             || 0],
      date        : r[col['Date']          || 1],
      vendor      : r[col['Vendor/Payee']  || 2],
      description : r[col['Description']   || 3],
      category    : r[col['Category']      || 4],
      amount      : r[col['Amount(₹)']     || 5],
      mode        : r[col['Mode']          || 6],
      paidBy      : r[col['Paid By']       || 7]
    };
  });
  return ok({ status: 'success', data: rows });
}

// ══════════════════════════════════════════════════════════
//  UPDATE RECEIVED AMOUNT
// ══════════════════════════════════════════════════════════

function updateReceived(p) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found' });

  var receiptNo = (p.receiptNo || '').toString().trim();
  var amount    = parseFloat(p.amount) || 0;
  var date      = p.date || '';

  // Build column map
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c + 1;
  }

  // Find data row matching receipt number
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return ok({ status: 'error', message: 'No data' });
  var seqCol = col['#'] || 1;
  var seqVals = sheet.getRange(DATA_START, seqCol, lastRow - DATA_START + 1, 1).getValues();
  var targetRow = -1;
  for (var i = 0; i < seqVals.length; i++) {
    if (seqVals[i][0].toString().trim() === receiptNo) { targetRow = DATA_START + i; break; }
  }
  if (targetRow < 0) return ok({ status: 'error', message: 'Receipt not found: ' + receiptNo });

  var totalVal = parseFloat(sheet.getRange(targetRow, col['Total (₹)']).getValue()) || 0;
  var balance  = totalVal - amount;

  if (col['Received (₹)'])   sheet.getRange(targetRow, col['Received (₹)']).setValue(amount);
  if (col['Balance (₹)'])    sheet.getRange(targetRow, col['Balance (₹)']).setValue(Math.max(balance, 0));
  if (col['Payment Status']) sheet.getRange(targetRow, col['Payment Status']).setValue(balance <= 0 ? 'Received' : 'Partial');
  if (date && col['Date Received'])  sheet.getRange(targetRow, col['Date Received']).setValue(makeDate(date));
  if (p.mode && col['Payment Mode']) sheet.getRange(targetRow, col['Payment Mode']).setValue(p.mode);
  if (p.receivedBy && col['Received By']) sheet.getRange(targetRow, col['Received By']).setValue(p.receivedBy);

  return ok({ status: 'success', receiptNo: receiptNo, received: amount, balance: Math.max(balance, 0) });
}

function makeDate(iso) {
  if (!iso) return '';
  var p = iso.split('-');
  return p[2] + '-' + p[1] + '-' + p[0];  // DD-MM-YYYY
}

function ok(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
