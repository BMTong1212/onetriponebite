// ============================================================
// Google Apps Script — Content Calendar 30 Ngày
// Version: 3.4
// Hướng dẫn:
//   1. Tạo Google Sheet mới, copy SHEET_ID vào biến bên dưới
//   2. Paste toàn bộ code này vào Apps Script
//   3. Deploy → New Deployment → Web App
//      - Execute as: Me
//      - Who has access: Anyone
//   4. Copy URL → paste vào index.html (GAS_URL)
// ============================================================

// ============================================================
// ⚙️ CẤU HÌNH — Chỉnh sửa các giá trị này
// ============================================================
const CONFIG = {
  SHEET_ID: '1sNVtWsh6bA8rklzp8fqMYlcH8m2OU3fUgTwyP1jfnU0',
  SHEET_ORDERS: 'Orders',

  PRODUCT_NAME: 'Content Calendar 30 Ngày Marketing',
  PRODUCT_PRICE_VND: '168,000đ',
  PRODUCT_PRICE_USD: '$7 USD',

  DOWNLOAD_LINK: 'https://drive.google.com/drive/folders/1xf5-8Of5eGaXv-nsnMpl9vZk4u_h5o9M?usp=sharing',

  SUPPORT_EMAIL: 'phukien168.com@gmail.com',
  SENDER_NAME: 'ContentPro',

  BANK_NAME: 'MB Bank',
  BANK_ACCOUNT: '468166168',
  BANK_OWNER: 'NGUYEN QUANG KHAI',
};

// ============================================================
// SCHEMA — Source of truth duy nhất cho cột sheet
// Thay đổi ở đây → tự động áp dụng khắp nơi
// ============================================================
const COLS = {
  TIMESTAMP:   1,  // A
  REF:         2,  // B
  NAME:        3,  // C
  EMAIL:       4,  // D
  PHONE:       5,  // E
  METHOD:      6,  // F
  STATUS:      7,  // G
  PAID_AT:     8,  // H
  TX_ID:       9,  // I
  CK_CONTENT: 10,  // J
};

const HEADER = [
  'Timestamp', 'Mã Ref', 'Họ Tên', 'Email', 'SĐT',
  'Phương Thức', 'Trạng Thái', 'Thời gian TT', 'Transaction ID', 'Nội Dung CK'
];

// ============================================================
// ENTRY POINTS
// ============================================================

function doGet(e) {
  const params = e.parameter;
  const action = params.action || '';

  try {
    if (action === 'check') {
      return handleCheckPayment(params.ref || '');
    }
    if (action === 'resend') {
      return handleResendDelivery(params.ref || '');
    }
    if (params.payload) {
      const payload = JSON.parse(decodeURIComponent(params.payload));
      return handleSepayWebhook(payload);
    }
    return jsonResponse({ status: 'ok', version: '3.4' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';

    if (action === 'register')        return handleRegister(body);
    if (action === 'paypal_complete') return handlePaypalComplete(body);
    if (action === 'sepay_webhook')   return handleSepayWebhook(body);

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// ACTION: REGISTER
// ============================================================

function handleRegister(body) {
  const { name, email, phone, method } = body;
  if (!name || !email) return jsonResponse({ success: false, error: 'Missing name or email' });

  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();

  // Idempotent: return existing ref if email already registered
  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][COLS.EMAIL - 1] || '').toString();
    if (rowEmail === email) {
      const existingRef = (data[i][COLS.REF - 1] || '').toString();
      Logger.log('Register duplicate: email=' + email + ' ref=' + existingRef);
      return jsonResponse({ success: true, refCode: existingRef });
    }
  }

  const refCode = generateRefCode(email);
  sheet.appendRow([
    new Date(),       // TIMESTAMP
    refCode,          // REF
    name,             // NAME
    email,            // EMAIL
    phone || '',      // PHONE
    method || 'bank', // METHOD
    'PENDING',        // STATUS
    '',               // PAID_AT
    '',               // TX_ID
    '',               // CK_CONTENT
  ]);

  return jsonResponse({ success: true, refCode });
}

// ============================================================
// ACTION: PAYPAL COMPLETE
// ============================================================

function handlePaypalComplete(body) {
  const { email, name, txId, amount } = body;
  Logger.log('PayPal complete: ' + JSON.stringify(body));

  if (!email) return jsonResponse({ success: false, error: 'Missing email' });

  const sheet = getSheet();
  const now   = new Date();
  const data  = sheet.getDataRange().getValues();
  let updated = false;

  let paidRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const rowEmail  = (data[i][COLS.EMAIL  - 1] || '').toString();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    if (rowEmail === email && rowStatus === 'PENDING') {
      sheet.getRange(i + 1, COLS.STATUS).setValue('PAID_PAYPAL');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(now);
      sheet.getRange(i + 1, COLS.TX_ID).setValue(txId || '');
      updated = true;
      paidRowIndex = i;
      break;
    }
  }

  // Delete remaining duplicate PENDING rows for same email
  if (paidRowIndex !== -1) {
    const toDelete = [];
    for (let j = paidRowIndex + 1; j < data.length; j++) {
      if ((data[j][COLS.EMAIL  - 1] || '').toString() === email &&
          (data[j][COLS.STATUS - 1] || '').toString() === 'PENDING') {
        toDelete.push(j + 1);
      }
    }
    for (let k = toDelete.length - 1; k >= 0; k--) {
      sheet.deleteRow(toDelete[k]);
    }
    if (toDelete.length > 0) Logger.log('Deleted ' + toDelete.length + ' duplicate PENDING rows for: ' + email);
  }

  if (!updated) {
    sheet.appendRow([
      now,
      'PP-' + (txId || '').toString().slice(-6),
      name || '', email, '', 'paypal', 'PAID_PAYPAL', now, txId || '', '',
    ]);
  }

  sendDeliveryEmail(email, name || 'Bạn', 'paypal', txId || '');
  return jsonResponse({ success: true });
}

// ============================================================
// ACTION: SEPAY WEBHOOK
// ============================================================

function handleSepayWebhook(payload) {
  Logger.log('SePay raw payload: ' + JSON.stringify(payload));

  const content = (payload.transferContent || payload.content || payload.description || '').toUpperCase();
  Logger.log('SePay content: ' + content);

  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  const now   = new Date();

  for (let i = 1; i < data.length; i++) {
    const ref       = (data[i][COLS.REF    - 1] || '').toString().toUpperCase();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();

    if (!ref || rowStatus !== 'PENDING') continue;

    // MBBank có thể gửi: "CC30-546237474", "CC30546237474", hoặc "CC30 546237474"
    // Strip cả dash lẫn space để match mọi format
    const refNorm    = ref.replace(/[-\s]/g, '');
    const contentNorm = content.replace(/[-\s]/g, '');
    const matched = content.includes(ref) || contentNorm.includes(refNorm);

    Logger.log('Row ' + i + ': ref=' + ref + ' refStripped=' + refStripped + ' matched=' + matched + ' status=' + rowStatus);

    if (matched) {
      sheet.getRange(i + 1, COLS.STATUS).setValue('PAID_BANK');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(now);
      sheet.getRange(i + 1, COLS.TX_ID).setValue(payload.id || '');
      sheet.getRange(i + 1, COLS.CK_CONTENT).setValue(content);

      const toEmail = (data[i][COLS.EMAIL - 1] || '').toString();
      const toName  = (data[i][COLS.NAME  - 1] || '').toString();
      sendDeliveryEmail(toEmail, toName, 'bank', ref);
      Logger.log('Confirmed PAID_BANK: ref=' + ref + ' email=' + toEmail);

      // Delete remaining duplicate PENDING rows with same ref
      const toDelete = [];
      for (let j = i + 1; j < data.length; j++) {
        const jRef    = (data[j][COLS.REF    - 1] || '').toString().toUpperCase();
        const jStatus = (data[j][COLS.STATUS - 1] || '').toString();
        if ((jRef === ref || jRef.replace(/-/g, '') === ref.replace(/-/g, '')) && jStatus === 'PENDING') {
          toDelete.push(j + 1);
        }
      }
      for (let k = toDelete.length - 1; k >= 0; k--) {
        sheet.deleteRow(toDelete[k]);
      }
      if (toDelete.length > 0) Logger.log('Deleted ' + toDelete.length + ' duplicate PENDING rows for ref: ' + ref);
      break;
    }
  }

  return jsonResponse({ success: true });
}

// ============================================================
// ACTION: RESEND DELIVERY EMAIL (manual trigger)
// GET ?action=resend&ref=CC30-XXXXXX
// ============================================================

function handleResendDelivery(ref) {
  if (!ref) return jsonResponse({ success: false, error: 'Missing ref' });

  const sheet   = getSheet();
  const data    = sheet.getDataRange().getValues();
  const refUpper = ref.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const rowRef = (data[i][COLS.REF - 1] || '').toString().toUpperCase();
    if (rowRef !== refUpper) continue;

    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    const toEmail   = (data[i][COLS.EMAIL  - 1] || '').toString();
    const toName    = (data[i][COLS.NAME   - 1] || '').toString();

    // Update PAID_BANK nếu vẫn PENDING
    if (rowStatus === 'PENDING') {
      sheet.getRange(i + 1, COLS.STATUS).setValue('PAID_BANK');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(new Date());
    }

    sendDeliveryEmail(toEmail, toName, 'bank', rowRef);
    Logger.log('Resend delivery: ref=' + rowRef + ' email=' + toEmail);
    return jsonResponse({ success: true, email: toEmail, ref: rowRef, status: 'PAID_BANK' });
  }

  return jsonResponse({ success: false, error: 'Ref not found: ' + ref });
}

// ============================================================
// ACTION: CHECK PAYMENT (polling)
// ============================================================

function handleCheckPayment(ref) {
  if (!ref) return jsonResponse({ paid: false });

  const sheet    = getSheet();
  const data     = sheet.getDataRange().getValues();
  const refUpper = ref.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const rowRef    = (data[i][COLS.REF    - 1] || '').toString().toUpperCase();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    if (rowRef === refUpper && rowStatus.startsWith('PAID')) {
      return jsonResponse({ paid: true, status: rowStatus });
    }
  }

  return jsonResponse({ paid: false });
}

// ============================================================
// EMAIL DELIVERY
// ============================================================

function sendDeliveryEmail(toEmail, toName, method, ref) {
  try {
    const subject = '🎉 [ContentPro] File của bạn đã sẵn sàng tải về!';
    const methodLabel = method === 'paypal'
      ? 'PayPal (Mã GD: ' + ref + ')'
      : 'Chuyển khoản MB Bank (Mã: ' + ref + ')';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;font-size:16px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(6,20,47,.12);">'
      + '<tr><td style="background:linear-gradient(135deg,#06142f,#0b3778);padding:40px 32px;text-align:center;">'
      + '<div style="font-size:48px;margin-bottom:14px;">🗓️</div>'
      + '<h1 style="color:#fff;margin:0;font-size:30px;font-weight:900;letter-spacing:-0.5px;">ContentPro</h1>'
      + '<p style="color:rgba(255,255,255,.75);margin:10px 0 0;font-size:16px;">Cảm ơn bạn đã tin tưởng!</p>'
      + '</td></tr>'
      + '<tr><td style="padding:36px 32px;">'
      + '<h2 style="color:#06142f;font-size:24px;font-weight:900;margin:0 0 10px;">Xin chào ' + escapeHtml(toName) + '! 🎉</h2>'
      + '<p style="color:#4a5568;font-size:17px;line-height:1.7;margin:0 0 28px;">Thanh toán đã được xác nhận. File <strong style="color:#06142f;">' + CONFIG.PRODUCT_NAME + '</strong> đã sẵn sàng để tải về.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td align="center">'
      + '<a href="' + CONFIG.DOWNLOAD_LINK + '" style="display:inline-block;background:linear-gradient(135deg,#1d6fe3,#0f55c8);color:#fff;text-decoration:none;padding:20px 48px;border-radius:14px;font-weight:900;font-size:18px;box-shadow:0 8px 24px rgba(21,94,208,.35);letter-spacing:-0.3px;">'
      + '📥 Tải Xuống File Ngay</a>'
      + '</td></tr></table>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#eaf3ff;border-radius:14px;margin-bottom:28px;"><tr><td style="padding:22px 26px;">'
      + '<p style="margin:0 0 14px;color:#06142f;font-weight:800;font-size:16px;">📋 Thông tin đơn hàng</p>'
      + '<table width="100%" style="border-collapse:collapse;">'
      + '<tr><td style="color:#4a5568;font-size:15px;padding:6px 0;border-bottom:1px solid #d0e4f7;">Sản phẩm</td><td style="color:#06142f;font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid #d0e4f7;">' + CONFIG.PRODUCT_NAME + '</td></tr>'
      + '<tr><td style="color:#4a5568;font-size:15px;padding:6px 0;border-bottom:1px solid #d0e4f7;">Email nhận file</td><td style="color:#06142f;font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid #d0e4f7;">' + escapeHtml(toEmail) + '</td></tr>'
      + '<tr><td style="color:#4a5568;font-size:15px;padding:6px 0;">Phương thức</td><td style="color:#06142f;font-size:15px;font-weight:700;text-align:right;">' + methodLabel + '</td></tr>'
      + '</table></td></tr></table>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;margin-bottom:28px;"><tr><td style="padding:22px 26px;">'
      + '<p style="margin:0 0 14px;color:#06142f;font-weight:800;font-size:16px;">✅ Bộ file gồm 9 sheets</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">📖 Hướng Dẫn Sử Dụng</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">📊 Dashboard 90 Bài Đăng</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">🗓 Lịch 30 Ngày Hoàn Chỉnh</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">📝 10 Caption Facebook Ready</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">🎨 10 Visual Concepts Cinematic</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">🔄 Hệ Thống Đa Kênh (5 nền tảng)</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">🏆 Top 10 Siêu Phẩm Viral</p>'
      + '<p style="margin:7px 0;color:#4a5568;font-size:15px;line-height:1.5;">🪝 Hook Bank 20 Mẫu</p>'
      + '</td></tr></table>'
      + '<p style="color:#4a5568;font-size:15px;line-height:1.7;margin:0;">💬 Cần hỗ trợ? Liên hệ <a href="mailto:' + CONFIG.SUPPORT_EMAIL + '" style="color:#1d6fe3;font-weight:700;">' + CONFIG.SUPPORT_EMAIL + '</a></p>'
      + '</td></tr>'
      + '<tr><td style="background:#f0f4f8;padding:24px 32px;text-align:center;border-top:1px solid #dbe5f2;">'
      + '<p style="color:#718096;font-size:14px;margin:0;">© 2026 ContentPro · <a href="mailto:' + CONFIG.SUPPORT_EMAIL + '" style="color:#718096;">' + CONFIG.SUPPORT_EMAIL + '</a></p>'
      + '<p style="color:#718096;font-size:13px;margin:8px 0 0;">🔒 Bảo đảm hoàn tiền 7 ngày nếu không hài lòng</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: html,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.SUPPORT_EMAIL,
    });

    Logger.log('Email sent OK to: ' + toEmail);
    return true;
  } catch (err) {
    Logger.log('sendDeliveryEmail ERROR: ' + err.toString());
    return false;
  }
}

// ============================================================
// UTILS
// ============================================================

function generateRefCode(email) {
  const hash = [...email].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
  return 'CC30-' + Math.abs(hash).toString().padStart(6, '0');
}

// getSheet luôn ghi đè header row 1 — không bao giờ để header cũ sai tồn tại
function getSheet() {
  const ss    = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let   sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_ORDERS);
  }
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function escapeHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// TEST / MANUAL TOOLS — Chạy trực tiếp trong GAS Editor
// ============================================================

function testEmail() {
  sendDeliveryEmail('quangkhaipk@gmail.com', 'Khai Test', 'bank', 'CC30-TEST');
}

// Gửi lại email cho đơn đã thanh toán nhưng chưa nhận file
function manualResend() {
  sendDeliveryEmail('quangkhaipk@gmail.com', 'Quang Khải', 'bank', 'CC30-914779609');
}

// Kiểm tra header sheet đã đúng chưa
function testHeader() {
  const sheet = getSheet();
  Logger.log('Header row 1: ' + JSON.stringify(sheet.getRange(1, 1, 1, HEADER.length).getValues()[0]));
}

// Resend delivery email cho khách đã PAID nhưng chưa nhận file — truyền vào email đầy đủ
function manualResendByEmail(email) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowEmail  = (data[i][COLS.EMAIL  - 1] || '').toString();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    if (rowEmail === email && rowStatus.startsWith('PAID')) {
      const name   = (data[i][COLS.NAME - 1] || '').toString();
      const method = rowStatus === 'PAID_PAYPAL' ? 'paypal' : 'bank';
      const ref    = (data[i][COLS.REF  - 1] || '').toString();
      sendDeliveryEmail(rowEmail, name, method, ref);
      Logger.log('manualResendByEmail: sent to ' + email + ' ref=' + ref);
      return;
    }
  }
  Logger.log('manualResendByEmail: no PAID row found for ' + email);
}
