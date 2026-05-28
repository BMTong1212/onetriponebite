// ============================================================
// CONTENT CALENDAR 30 NGÀY — GOOGLE APPS SCRIPT BACKEND
// ============================================================
// SETUP:
// 1. Tạo Google Sheet với 2 sheets: "Orders" và "Logs"
// 2. Paste toàn bộ code này vào Apps Script (Extensions > Apps Script)
// 3. Cập nhật CONFIG bên dưới
// 4. Deploy: Deploy > New deployment > Web App > Execute as Me > Anyone
// 5. Copy URL dán vào index.html (GAS_URL)
// ============================================================

// ============================================================
// CONFIG — BẮT BUỘC CẬP NHẬT
// ============================================================
const CONFIG = {
  SHEET_ID:       'YOUR_GOOGLE_SHEET_ID',          // ID của Google Sheet
  PRODUCT_LINK:   'YOUR_GOOGLE_DRIVE_FILE_LINK',   // Link file Excel trên Drive (anyone with link)
  SELLER_NAME:    'ContentPro',                     // Tên người bán
  SUPPORT_EMAIL:  'support@yourdomain.com',          // Email hỗ trợ
  SEPAY_SECRET:   'YOUR_SEPAY_WEBHOOK_SECRET',       // Secret từ SePay dashboard
  BANK_ACC:       'YOUR_BANK_ACCOUNT_NUMBER',        // Số tài khoản ngân hàng
  BANK_NAME:      'YOUR_BANK_NAME',                  // Tên ngân hàng (VD: Techcombank)
  PRODUCT_PRICE:  168000,                             // Giá sản phẩm (VND)
};

// ============================================================
// MAIN ENTRY POINT
// ============================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    let result;

    // SePay gửi webhook trực tiếp — không có field "action"
    // Detect bằng các field đặc trưng của SePay
    const isSepayDirect = !action && (
      body.transferAmount !== undefined ||
      body.content !== undefined ||
      body.id !== undefined
    );

    if (isSepayDirect)                    result = handleSepayWebhook(body);
    else if (action === 'register')        result = handleRegister(body);
    else if (action === 'paypal_complete') result = handlePaypalComplete(body);
    else if (action === 'sepay_webhook')   result = handleSepayWebhook(body); // fallback nếu wrap
    else result = { success: false, error: 'Unknown action' };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    logError('doPost', err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // SePay webhook verification (GET ping)
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'ContentCalendar30' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HANDLER: Register (lưu đơn hàng pending)
// ============================================================
function handleRegister(body) {
  const { name, email, phone, method } = body;
  if (!name || !email) return { success: false, error: 'Missing name or email' };

  const sheet = getSheet('Orders');
  const timestamp = new Date().toISOString();
  const refCode = 'CC30-' + email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);

  // Check if already registered
  const existing = findRowByEmail(sheet, email);
  if (existing && existing[5] === 'COMPLETED') {
    return { success: true, message: 'Already completed', refCode };
  }

  // Insert or update row
  if (!existing) {
    sheet.appendRow([timestamp, name, email, phone || '', method, 'PENDING', refCode, '']);
  }

  return { success: true, refCode };
}

// ============================================================
// HANDLER: PayPal Complete
// ============================================================
function handlePaypalComplete(body) {
  const { email, name, txId, amount } = body;
  if (!email || !txId) return { success: false, error: 'Missing params' };

  const sheet = getSheet('Orders');
  const row = findRowByEmail(sheet, email);

  if (row && row[5] === 'COMPLETED') {
    return { success: true, message: 'Already sent' };
  }

  // Mark as completed
  markCompleted(sheet, email, 'paypal', txId);

  // Send product email
  sendProductEmail(name || email, email, 'PayPal', txId);
  logInfo('paypal_complete', `Sent to ${email}, txId: ${txId}`);

  return { success: true, message: 'File sent' };
}

// ============================================================
// HANDLER: SePay Webhook (Bank Transfer)
// ============================================================
function handleSepayWebhook(body) {
  // Verify secret
  const secret = body.secret || body.apiKey || '';
  if (secret !== CONFIG.SEPAY_SECRET) {
    logError('sepay_webhook', 'Invalid secret');
    return { success: false, error: 'Unauthorized' };
  }

  const amount    = parseInt(body.transferAmount || body.amount || 0);
  const content   = (body.content || body.description || '').toUpperCase();
  const txId      = body.id || body.referenceCode || Date.now().toString();

  // Check amount
  if (amount < CONFIG.PRODUCT_PRICE) {
    logInfo('sepay_webhook', `Amount ${amount} < ${CONFIG.PRODUCT_PRICE}, skip`);
    return { success: true, message: 'Amount too low' };
  }

  // Extract email ref from content: CC30-XXXXXXXX
  const refMatch = content.match(/CC30-([A-Z0-9]{1,8})/);
  if (!refMatch) {
    logInfo('sepay_webhook', `No refcode in: ${content}`);
    return { success: true, message: 'No refcode found' };
  }

  // Find order by refCode
  const sheet = getSheet('Orders');
  const refCode = 'CC30-' + refMatch[1];
  const row = findRowByRef(sheet, refCode);

  if (!row) {
    logInfo('sepay_webhook', `Ref ${refCode} not found`);
    return { success: true, message: 'Ref not found' };
  }

  // Idempotency check
  if (row[5] === 'COMPLETED') {
    return { success: true, message: 'Already processed' };
  }

  const email = row[2];
  const name  = row[1];

  // Mark completed & send email
  markCompleted(sheet, email, 'bank', txId);
  sendProductEmail(name, email, 'Chuyển khoản', txId);
  logInfo('sepay_webhook', `Sent to ${email}, ref: ${refCode}`);

  return { success: true, message: 'Processed' };
}

// ============================================================
// SEND PRODUCT EMAIL
// ============================================================
function sendProductEmail(name, email, method, txId) {
  const subject = `✅ [ContentPro] File của bạn đã sẵn sàng — Content Calendar 30 Ngày`;
  const body = `
Xin chào ${name}!

Cảm ơn bạn đã tin tưởng mua bộ Content Calendar 30 Ngày Marketing.

🎁 TẢI FILE TẠI ĐÂY:
${CONFIG.PRODUCT_LINK}

──────────────────────────────
📋 THÔNG TIN ĐƠN HÀNG
• Sản phẩm: Content Calendar 30 Ngày Marketing
• Phương thức: ${method}
• Mã giao dịch: ${txId}
• Email: ${email}
──────────────────────────────

🚀 HƯỚNG DẪN SỬ DỤNG NHANH:
1. Mở file Excel trên Google Sheets (miễn phí)
2. Đọc sheet "Hướng Dẫn Sử Dụng" trước
3. Chọn sheet "Lịch 30 Ngày FINAL" để bắt đầu
4. Copy hook từ "Hook Bank" vào nội dung của bạn

📞 HỖ TRỢ:
Nếu cần giúp đỡ, reply email này hoặc liên hệ: ${CONFIG.SUPPORT_EMAIL}

Chúc bạn content thành công!

${CONFIG.SELLER_NAME}
  `.trim();

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

// ============================================================
// SHEET UTILITIES
// ============================================================
function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Orders') {
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Method', 'Status', 'RefCode', 'TxId']);
    }
  }
  return sheet;
}

function findRowByEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) return data[i];
  }
  return null;
}

function findRowByRef(sheet, refCode) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === refCode) return data[i];
  }
  return null;
}

function markCompleted(sheet, email, method, txId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      sheet.getRange(i + 1, 6).setValue('COMPLETED');
      sheet.getRange(i + 1, 5).setValue(method);
      sheet.getRange(i + 1, 8).setValue(txId);
      return;
    }
  }
}

function logInfo(fn, msg) {
  try {
    const sheet = getSheet('Logs');
    sheet.appendRow([new Date().toISOString(), 'INFO', fn, msg]);
  } catch(e) {}
}

function logError(fn, msg) {
  try {
    const sheet = getSheet('Logs');
    sheet.appendRow([new Date().toISOString(), 'ERROR', fn, msg]);
  } catch(e) {}
}
