/**
 * =========================================================================
 * AI LOAN ELIGIBILITY CHECKER - GOOGLE APPS SCRIPT BACKEND (INDIA / INR)
 * =========================================================================
 * 
 * This Google Apps Script connects your "AI Loan Eligibility Checker" web app
 * to Google Sheets for persistent, real-time logging and retrieval of all
 * Indian BFSI assessments, CIBIL diagnostics, EMI schedules, and financial plans.
 * 
 * All monetary amounts are recorded in Indian Rupees (INR, ₹).
 * 
 * -------------------------------------------------------------------------
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * -------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.new) and name the spreadsheet:
 *    "AI Loan Eligibility Checker Submissions (India)"
 * 
 * 2. In the top menu, go to:
 *    Extensions > Apps Script
 * 
 * 3. Delete any default code in Code.gs, and paste this entire file content.
 * 
 * 4. (Optional) Run the `initialSetup()` function once from the editor to
 *    format the header row with dark styling, frozen top row, and column widths.
 * 
 * 5. Click "Deploy" (top right) > "New deployment"
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: "AI Loan Eligibility Web API v1 (India)"
 *    - Execute as: "Me (<your-email>)"
 *    - Who has access: "Anyone"  <-- CRITICAL: Choose "Anyone" so the app can submit data
 * 
 * 6. Click "Deploy", authorize permissions when prompted.
 * 
 * 7. Copy the "Web app URL" (it looks like:
 *    https://script.google.com/macros/s/AKfycb.../exec)
 * 
 * 8. Open the web app, click "Settings" (or paste into SHEETS_WEBAPP_URL in script.js),
 *    and paste your Web App URL.
 * =========================================================================
 */

const SHEET_NAME = 'Submissions';

/**
 * Handle HTTP GET Requests:
 * Returns the past history of submissions formatted as JSON.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = setupSheet(ss);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      // Only header or empty
      return createJsonResponse({
        status: 'success',
        currency: 'INR',
        records: []
      });
    }
    
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // skip blank rows
      
      let parsedPayload = {};
      try {
        if (row[5]) {
          parsedPayload = JSON.parse(row[5]);
        }
      } catch (err) {
        parsedPayload = { raw: row[5] };
      }
      
      records.push({
        id: 'rec_' + i,
        timestamp: row[0],
        tool: row[1],
        userName: row[2],
        inputsSummary: row[3],
        resultSummary: row[4],
        payload: parsedPayload
      });
    }
    
    // Sort descending by timestamp (newest first)
    records.reverse();
    
    return createJsonResponse({
      status: 'success',
      currency: 'INR',
      total: records.length,
      records: records
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST Requests:
 * Appends a new submission record (timestamp, tool, inputs, result, JSON payload).
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = setupSheet(ss);
    }
    
    const timestamp = payload.timestamp || new Date().toISOString();
    const tool = payload.tool || 'Unknown Tool';
    const userName = payload.userName || payload.inputs?.fullName || payload.inputs?.name || 'Applicant';
    
    // Build human-readable summaries for quick spreadsheet reading
    const inputsSummary = typeof payload.inputs === 'object' 
      ? Object.entries(payload.inputs).map(([k, v]) => k + ': ' + v).join(' | ')
      : String(payload.inputs || '');
      
    const resultSummary = typeof payload.result === 'object'
      ? buildResultSummary(tool, payload.result)
      : String(payload.result || '');
      
    const fullJson = JSON.stringify(payload);
    
    // Append the row
    sheet.appendRow([
      timestamp,
      tool,
      userName,
      inputsSummary,
      resultSummary,
      fullJson
    ]);
    
    return createJsonResponse({
      status: 'success',
      currency: 'INR',
      message: 'Record saved successfully to Google Sheets (Currency: INR)',
      timestamp: timestamp,
      tool: tool
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Helper to build a clean string summary for the result column in Indian context
 */
function buildResultSummary(tool, result) {
  if (!result) return 'No result';
  if (tool === 'Loan Eligibility Checker') {
    const maxAmt = typeof result.max_eligible_amount === 'number' 
      ? '₹' + result.max_eligible_amount.toLocaleString('en-IN')
      : (result.max_eligible_amount || 'N/A');
    return 'Decision: ' + (result.eligible || 'N/A') + 
           ' | Score: ' + (result.eligibility_score ?? 'N/A') + '/100' +
           ' | Max Loan: ' + maxAmt +
           ' | FOIR: ' + (result.foir_percent ? result.foir_percent + '%' : 'N/A') +
           ' | Risk: ' + (result.risk_level || 'N/A');
  } else if (tool === 'Credit Score Analyzer') {
    return 'CIBIL Rating: ' + (result.rating || 'N/A') +
           ' | Timeline: ' + (result.estimated_improvement_timeline || 'N/A');
  } else if (tool === 'EMI Calculator') {
    return 'Monthly EMI: ₹' + (result.emi ? Number(result.emi).toLocaleString('en-IN') : 'N/A') +
           ' | Total Interest: ₹' + (result.totalInterest ? Number(result.totalInterest).toLocaleString('en-IN') : 'N/A') +
           ' | Total Outflow: ₹' + (result.totalPayment ? Number(result.totalPayment).toLocaleString('en-IN') : 'N/A');
  } else if (tool === 'AI Financial Tips') {
    return 'Savings Target: ' + (result.savings_target || 'N/A') +
           ' | Instruments: ' + (Array.isArray(result.suggested_instruments) ? result.suggested_instruments.join(', ') : 'N/A');
  }
  return JSON.stringify(result).substring(0, 150);
}

/**
 * Creates or initializes the Submissions sheet with headers and formatting
 */
function setupSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  const headers = [
    'Timestamp (IST)',
    'Tool Used',
    'User / Ref',
    'Input Parameters (Amounts in INR ₹)',
    'Result Summary (Currency: INR ₹)',
    'Full Payload (JSON)'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format Header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0b1329');
  headerRange.setFontColor('#f8fafc');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setWrap(true);
  
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 180); // Timestamp
  sheet.setColumnWidth(2, 180); // Tool
  sheet.setColumnWidth(3, 140); // User / Ref
  sheet.setColumnWidth(4, 300); // Inputs (INR)
  sheet.setColumnWidth(5, 320); // Result (INR)
  sheet.setColumnWidth(6, 350); // Full JSON
  
  return sheet;
}

/**
 * Manual test / initialization trigger
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheet(ss);
  SpreadsheetApp.getActiveSpreadsheet().toast('Sheet setup complete with INR columns and styling!', 'Success');
}

/**
 * Formats JSON response with CORS headers
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
