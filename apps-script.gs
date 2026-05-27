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

// ── Spreadsheet wired directly by ID ──────────────────────
var SPREADSHEET_ID = '12PgU-zwv8gBrFfxvJpoPIPcxUHWup-vsxMH3HWUigZ8';
var SHEET_NAME     = '💰 Donations';
var HEADER_ROW     = 3;
var DATA_START     = 4;

function doGet(e) {
  try {
    var action = (e.parameter.action || '').trim();
    if (action === 'ping')        return ok({ status: 'ok', message: 'Connected ✓', version: 5 });
    if (action === 'addDonation') return addDonation(e.parameter);
    if (action === 'getReceipts') return getReceipts();
    if (action === 'getLastSeq')  return getLastSeq();
    return ok({ message: 'unknown action' });
  } catch(err) {
    return ok({ status: 'error', message: err.toString() });
  }
}

function doPost(e) { return doGet(e); }

function addDonation(p) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'error', message: 'Sheet not found: ' + SHEET_NAME });

  var amount = parseFloat(p.amount) || 0;

  // ── Find last row with an actual donor name in col B ──────
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

  // ── Read header row → map name → column number ────────────
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c + 1;
  }

  // ── Insert row, copy full format+merges from last data row ──
  sheet.insertRowAfter(lastDataRow);
  var src = sheet.getRange(lastDataRow, 1, 1, lastCol);
  var dst = sheet.getRange(newRow,      1, 1, lastCol);
  src.copyTo(dst, SpreadsheetApp.CopyPasteType.PASTE_NORMAL, false);

  // ── Write values into the correct columns by header name ───
  function set(name, val) {
    if (col[name]) sheet.getRange(newRow, col[name]).setValue(val);
  }

  set('#',                 p.receiptNo || seqNo);
  set('Donor Name',        p.donor     || '');
  set('Phone',             p.phone     || '');
  set('Total (₹)',         amount);
  set('Received (₹)',      amount);
  set('Payment Mode',      p.mode      || 'Cash');
  set('Date Received',     makeDate(p.date));
  set('Received By',       p.receivedBy || '');
  set('Purpose / Notes',   'Towards Aadi Festival');
  set('Payment Status',    'Received');
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

  // Find the '#' column dynamically
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var seqCol = 1;
  for (var c = 0; c < hdrVals.length; c++) {
    if ((hdrVals[c] || '').toString().trim() === '#') { seqCol = c + 1; break; }
  }

  var lastSeq = sheet.getRange(lastDataRow, seqCol).getValue();
  return ok({ status: 'success', lastSeq: parseInt(lastSeq) || 0 });
}

function getReceipts() {
  var sheet   = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return ok({ status: 'success', data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return ok({ status: 'success', data: [] });

  // ── Dynamic header → column index map ──────────────────────
  var lastCol = sheet.getLastColumn();
  var hdrVals = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  var col = {};
  for (var c = 0; c < hdrVals.length; c++) {
    var k = (hdrVals[c] || '').toString().trim();
    if (k) col[k] = c; // 0-based index for array access
  }

  var vals = sheet.getRange(DATA_START, 1, lastRow - DATA_START + 1, lastCol).getValues();
  var rows = vals.filter(function(r){ return r[col['Donor Name'] || 1] !== ''; }).map(function(r){
    return {
      receiptNo  : r[col['#']                || 0],
      donor      : r[col['Donor Name']       || 1],
      total      : r[col['Total (₹)']        || 2],
      received   : r[col['Received (₹)']     || 3],
      balance    : r[col['Balance (₹)']      || 4],
      mode       : r[col['Payment Mode']     || 5],
      date       : r[col['Date Received']    || 6],
      receivedBy : r[col['Received By']      || 7],
      status     : r[col['Payment Status']     || 8],
      notes      : r[col['Purpose / Notes']  || 10]
    };
  });
  return ok({ status: 'success', data: rows });
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
