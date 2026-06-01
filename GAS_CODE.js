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
  SHEET_ID: '1IFiNuC2bzt-VPPDS52tM2nPLpNVDksCfYGCbjMCo3_U',
  SHEET_ORDERS: 'Orders',

  PRODUCT_NAME: 'Matrix Shad "Glow" — 8 Baits',
  PRODUCT_PRICE_VND: '125,000đ',
  PRODUCT_PRICE_USD: '$4.99',

  DOWNLOAD_LINK: 'https://docs.google.com/spreadsheets/d/1IFiNuC2bzt-VPPDS52tM2nPLpNVDksCfYGCbjMCo3_U/edit?gid=0#gid=0',

  SUPPORT_EMAIL: 'support@onetriponebite.com',
  SENDER_NAME: 'One Trip One Bite',

  BANK_NAME: 'MB Bank',
  BANK_ACCOUNT: '468166168',
  BANK_OWNER: 'NGUYEN QUANG KHAI',

  // Set these in GAS PropertiesService instead of hardcoding here
  TELEGRAM_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
  TELEGRAM_CHAT_ID: PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID') || 'YOUR_TELEGRAM_CHAT_ID_HERE',
  PRODUCT_PRICE_RAW: 4.99,
};

// ============================================================
// SCHEMA — Source of truth duy nhất cho cột sheet
// Thay đổi ở đây → tự động áp dụng khắp nơi
// ============================================================
const COLS = {
  TIMESTAMP: 1,  // A
  REF: 2,  // B
  NAME: 3,  // C
  EMAIL: 4,  // D
  PHONE: 5,  // E
  METHOD: 6,  // F
  STATUS: 7,  // G
  PAID_AT: 8,  // H
  TX_ID: 9,  // I
  CK_CONTENT: 10,  // J
  PRODUCT: 11, // K
  AMOUNT: 12,  // L
  SHIPPING_ADDRESS: 13, // M
};

const HEADER = [
  'Timestamp', 'Ref Code', 'Name', 'Email', 'Phone',
  'Payment Method', 'Status', 'Payment Time', 'Transaction ID', 'Transfer Content', 'Product', 'Amount Paid', 'Shipping Address'
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
    if (action === 'test_telegram') {
      testTelegram();
      return jsonResponse({ status: 'ok', action: 'test_telegram' });
    }
    if (action === 'test_email') {
      const ok = sendDeliveryEmail('support@onetriponebite.com', 'Support Test', 'paypal', 'PAYID-TEST-12345');
      return jsonResponse({ success: ok });
    }
    if (action === 'setup_trigger') {
      setupDailyReportTrigger();
      return jsonResponse({ status: 'ok', action: 'setup_trigger' });
    }
    if (action === 'test_daily_report') {
      sendDailyReport();
      return jsonResponse({ status: 'ok', action: 'test_daily_report' });
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

    if (action === 'register') return handleRegister(body);
    if (action === 'subscribe') return handleSubscribe(body);
    if (action === 'paypal_complete') return handlePaypalComplete(body);
    if (action === 'sepay_webhook') return handleSepayWebhook(body);
    // Set SETUP_TRIGGER_SECRET in GAS PropertiesService before calling this action
    if (action === 'setup_trigger' && body.secret === (PropertiesService.getScriptProperties().getProperty('SETUP_TRIGGER_SECRET') || 'CHANGE_ME')) {
      setupDailyReportTrigger();
      return jsonResponse({ success: true, action: 'setup_trigger' });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// ACTION: SUBSCRIBE (Newsletter signup)
// ============================================================

function handleSubscribe(body) {
  const { name, email, phone } = body;
  if (!name || !email) return jsonResponse({ success: false, error: 'Missing name or email' });

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // Check if already subscribed or registered
  let existingRef = '';
  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][COLS.EMAIL - 1] || '').toString();
    if (rowEmail === email) {
      existingRef = (data[i][COLS.REF - 1] || '').toString();
      const status = (data[i][COLS.STATUS - 1] || '').toString();
      // If already subscribed, return success
      if (status === 'SUBSCRIBED') {
        return jsonResponse({ success: true, refCode: existingRef, message: 'Already subscribed' });
      }
      // If previously pending or anything, update status to SUBSCRIBED
      sheet.getRange(i + 1, COLS.STATUS).setValue('SUBSCRIBED');
      sheet.getRange(i + 1, COLS.METHOD).setValue('subscribe');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(new Date());
      
      sendWelcomeEmail(email, name);
      sendTelegramMessage('⛵ SUBSCRIBER UPDATE\n\n👤 Customer: ' + name + '\n📧 Email: ' + email + '\n📝 Updated status to SUBSCRIBED');
      return jsonResponse({ success: true, refCode: existingRef });
    }
  }

  const refCode = generateRefCode(email);
  const now = new Date();
  sheet.appendRow([
    now,              // TIMESTAMP
    refCode,          // REF
    name,             // NAME
    email,            // EMAIL
    phone || '',      // PHONE
    'subscribe',      // METHOD
    'SUBSCRIBED',     // STATUS
    now,              // PAID_AT (Subscribed time)
    '',               // TX_ID
    '',               // CK_CONTENT
    '',               // PRODUCT
    '',               // AMOUNT
    '',               // SHIPPING_ADDRESS
  ]);

  sendWelcomeEmail(email, name);
  sendTelegramMessage(
    '🎉 NEW SUBSCRIBER - JOIN THE JOURNEY\n\n' +
    '👤 Customer: ' + name + '\n' +
    '📧 Email: ' + email + '\n' +
    '📱 Phone: ' + (phone || 'N/A') + '\n' +
    '⛵ Method: Email Newsletter\n' +
    '⏰ Time: ' + Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm - MM/dd/yyyy')
  );

  return jsonResponse({ success: true, refCode });
}

function sendWelcomeEmail(toEmail, toName) {
  try {
    const subject = '⛵ Welcome to the Crew! - One Trip. One Bite.';
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif;font-size:16px;color:#1F2933;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,0.05);border: 1px solid #D8C3A5;">'
      + '<tr><td style="background:#2E5B76;padding:40px 32px;text-align:center;">'
      + '<div style="font-size:48px;margin-bottom:14px;">⛵</div>'
      + '<h1 style="color:#F7F4EE;margin:0;font-size:28px;font-family:\'Playfair Display\',Georgia,serif;font-weight:700;letter-spacing:1px;">ONE TRIP. ONE BITE.</h1>'
      + '<p style="color:rgba(247,244,238,0.8);margin:10px 0 0;font-size:15px;letter-spacing:0.5px;">Welcome to the Adventure Crew</p>'
      + '</td></tr>'
      + '<tr><td style="padding:36px 32px;">'
      + '<h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi ' + escapeHtml(toName) + ',</h2>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Thanks for joining the crew! You are now subscribed to **One Trip. One Bite.**</p>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Here is your free shipping code for your first order:</p>'
      + '<div style="background:#e6f4ea;border:1px solid #c2e7cd;color:#137333;padding:16px;border-radius:10px;font-weight:bold;text-align:center;margin:18px 0;font-size:18px;letter-spacing:1px;">🎁 Code: FREESHIP1</div>'
      + '<p style="line-height:1.7;margin:0 0 20px;">And here is your free copy of the **2026 Gulf Coast Fishing Regulations Guide** (includes license guides, species deep-dives, and seasonal calendars for Louisiana, Mississippi, and the Florida Panhandle):</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 24px;"><tr><td align="center">'
      + '<a href="https://www.onetriponebite.com/assets/OTOB_Gulf_Coast_Fishing_Regulations_2026.xlsx" style="display:inline-block;background:#2E5B76;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(46,91,118,0.25);">📥 Download 2026 Regulations Guide (.xlsx)</a>'
      + '</td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 20px;">We are excited to share our latest adventures with you—from kayak fishing trip reports to destination guides, local food spots, and gear reviews that we actually use and trust.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;border-radius:12px;margin:28px 0;"><tr><td style="padding:20px 24px;">'
      + '<p style="margin:0 0 10px;color:#2E5B76;font-weight:700;font-size:16px;">🌊 What you\'ll receive from us:</p>'
      + '<p style="margin:6px 0;color:#1F2933;font-size:15px;">📍 **Destinations:** In-depth guides to secret kayak fishing spots and best seasons.</p>'
      + '<p style="margin:6px 0;color:#1F2933;font-size:15px;">🍣 **Local Food:** The best local diners, seafood spots, and recipes from the coast.</p>'
      + '<p style="margin:6px 0;color:#1F2933;font-size:15px;">🔧 **Gear Reviews:** Honest breakdowns of budget-friendly outdoor and fishing gear.</p>'
      + '<p style="margin:6px 0;color:#1F2933;font-size:15px;">🎥 **Exclusive Reels:** Behind-the-scenes footage of our latest trips.</p>'
      + '</td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 28px;">Stay tuned for our upcoming updates. In the meantime, you can explore our latest videos on YouTube and follow our social channels.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center">'
      + '<a href="https://www.onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(199,125,74,0.3);letter-spacing:0.5px;">'
      + 'Visit Our Website</a>'
      + '</td></tr></table>'
      + '</td></tr>'
      + '<tr><td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid #D8C3A5;">'
      + '<p style="color:#7A8F7B;font-size:14px;margin:0;">Explore More. Fish More. Travel More.</p>'
      + '<p style="color:#1F2933;font-size:13px;margin:8px 0 0;">© 2026 One Trip One Bite. All rights reserved.</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: toEmail,
      bcc: CONFIG.SUPPORT_EMAIL,
      subject: subject,
      htmlBody: html,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.SUPPORT_EMAIL,
    });

    Logger.log('Welcome Email sent OK to: ' + toEmail);
    return true;
  } catch (err) {
    Logger.log('sendWelcomeEmail ERROR: ' + err.toString());
    return false;
  }
}

// ============================================================
// ACTION: REGISTER
// ============================================================

function handleRegister(body) {
  const { name, email, phone, method, product } = body;
  if (!name || !email) return jsonResponse({ success: false, error: 'Missing name or email' });

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

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
    product || CONFIG.PRODUCT_NAME, // PRODUCT
    '',               // AMOUNT
    '',               // SHIPPING_ADDRESS
  ]);

  return jsonResponse({ success: true, refCode });
}

// ============================================================
// ACTION: PAYPAL COMPLETE
// ============================================================

function handlePaypalComplete(body) {
  const { email, name, txId, amount, product, shippingAddress } = body;
  Logger.log('PayPal complete: ' + JSON.stringify(body));

  if (!email) return jsonResponse({ success: false, error: 'Missing email' });

  const sheet = getSheet();
  const now = new Date();
  const data = sheet.getDataRange().getValues();
  let updated = false;

  let paidRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][COLS.EMAIL - 1] || '').toString();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    if (rowEmail === email && rowStatus === 'PENDING') {
      sheet.getRange(i + 1, COLS.STATUS).setValue('PAID_PAYPAL');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(now);
      sheet.getRange(i + 1, COLS.TX_ID).setValue(txId || '');
      sheet.getRange(i + 1, COLS.NAME).setValue(name || data[i][COLS.NAME - 1]);
      if (COLS.PRODUCT) {
        const existingProduct = (data[i][COLS.PRODUCT - 1] || '').toString();
        sheet.getRange(i + 1, COLS.PRODUCT).setValue(product || existingProduct || CONFIG.PRODUCT_NAME);
      }
      if (COLS.AMOUNT) sheet.getRange(i + 1, COLS.AMOUNT).setValue(amount || '');
      if (COLS.SHIPPING_ADDRESS) sheet.getRange(i + 1, COLS.SHIPPING_ADDRESS).setValue(shippingAddress || '');
      updated = true;
      paidRowIndex = i;
      break;
    }
  }

  // Delete remaining duplicate PENDING rows for same email
  if (paidRowIndex !== -1) {
    const toDelete = [];
    for (let j = paidRowIndex + 1; j < data.length; j++) {
      if ((data[j][COLS.EMAIL - 1] || '').toString() === email &&
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
      product || CONFIG.PRODUCT_NAME,
      amount || '',
      shippingAddress || '',
    ]);
  }

  const emailSent = sendDeliveryEmail(email, name || 'Customer', 'paypal', txId || '');
  if (!emailSent) {
    throw new Error('MailApp delivery failed. The Gmail daily quota might be exceeded, or the Apps Script requires authorization.');
  }

  const paidAtPP = Utilities.formatDate(now, 'America/New_York', 'HH:mm - MM/dd/yyyy');
  const displayProduct = product || CONFIG.PRODUCT_NAME;
  const displayAmount = amount ? '$' + amount : CONFIG.PRODUCT_PRICE_USD;

  sendTelegramMessage(
    '🎉 NEW ORDER - PAYMENT SUCCESSFUL\n\n' +
    '📦 Product: ' + displayProduct + '\n' +
    '👤 Customer: ' + (name || 'N/A') + '\n' +
    '📧 Email: ' + email + '\n' +
    '📍 Shipping Address: ' + (shippingAddress || 'N/A') + '\n' +
    '💳 Method: PayPal\n' +
    '💰 Amount: ' + displayAmount + '\n' +
    '🔖 Transaction ID: ' + (txId || 'N/A') + '\n' +
    '⏰ Time: ' + paidAtPP
  );

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
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    const ref = (data[i][COLS.REF - 1] || '').toString().toUpperCase();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();

    if (!ref || rowStatus !== 'PENDING') continue;

    // MBBank có thể gửi: "CC30-546237474", "CC30546237474", hoặc "CC30 546237474"
    // Strip cả dash lẫn space để match mọi format
    const refNorm = ref.replace(/[-\s]/g, '');
    const contentNorm = content.replace(/[-\s]/g, '');
    const matched = content.includes(ref) || contentNorm.includes(refNorm);

    Logger.log('Row ' + i + ': ref=' + ref + ' refNorm=' + refNorm + ' matched=' + matched + ' status=' + rowStatus);

    if (matched) {
      sheet.getRange(i + 1, COLS.STATUS).setValue('PAID_BANK');
      sheet.getRange(i + 1, COLS.PAID_AT).setValue(now);
      sheet.getRange(i + 1, COLS.TX_ID).setValue(payload.id || '');
      sheet.getRange(i + 1, COLS.CK_CONTENT).setValue(content);

      const toEmail = (data[i][COLS.EMAIL - 1] || '').toString();
      const toName = (data[i][COLS.NAME - 1] || '').toString();
      sendDeliveryEmail(toEmail, toName, 'bank', ref);
      Logger.log('Confirmed PAID_BANK: ref=' + ref + ' email=' + toEmail);

      const paidAt = Utilities.formatDate(now, 'America/New_York', 'HH:mm - MM/dd/yyyy');
      sendTelegramMessage(
        '🎉 NEW ORDER - PAYMENT SUCCESSFUL\n\n' +
        '📦 Product: ' + CONFIG.PRODUCT_NAME + '\n' +
        '👤 Customer: ' + toName + '\n' +
        '📧 Email: ' + toEmail + '\n' +
        '📱 Phone: ' + (data[i][COLS.PHONE - 1] || 'N/A') + '\n' +
        '💳 Method: Bank Transfer ' + CONFIG.BANK_NAME + '\n' +
        '💰 Amount: ' + CONFIG.PRODUCT_PRICE_USD + '\n' +
        '🔖 Ref Code: ' + ref + '\n' +
        '⏰ Time: ' + paidAt
      );

      // Delete remaining duplicate PENDING rows with same ref
      const toDelete = [];
      for (let j = i + 1; j < data.length; j++) {
        const jRef = (data[j][COLS.REF - 1] || '').toString().toUpperCase();
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

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const refUpper = ref.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const rowRef = (data[i][COLS.REF - 1] || '').toString().toUpperCase();
    if (rowRef !== refUpper) continue;

    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    const toEmail = (data[i][COLS.EMAIL - 1] || '').toString();
    const toName = (data[i][COLS.NAME - 1] || '').toString();

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

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const refUpper = ref.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const rowRef = (data[i][COLS.REF - 1] || '').toString().toUpperCase();
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
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    let productName = CONFIG.PRODUCT_NAME;
    for (let i = 1; i < data.length; i++) {
      if ((data[i][COLS.REF - 1] || '').toString().toUpperCase() === ref.toUpperCase()) {
        productName = (data[i][COLS.PRODUCT - 1] || CONFIG.PRODUCT_NAME).toString();
        break;
      }
    }

    const subject = '🎉 [One Trip. One Bite.] Order Confirmation - ' + productName;
    const methodLabel = method === 'paypal'
      ? 'PayPal (TXN ID: ' + ref + ')'
      : 'Bank Transfer (Ref: ' + ref + ')';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif;font-size:16px;color:#1F2933;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,0.05);border:1px solid #D8C3A5;">'
      + '<tr><td style="background:#2E5B76;padding:40px 32px;text-align:center;">'
      + '<div style="font-size:48px;margin-bottom:14px;">🛍️</div>'
      + '<h1 style="color:#F7F4EE;margin:0;font-size:28px;font-family:\'Playfair Display\',Georgia,serif;font-weight:700;letter-spacing:1px;">ONE TRIP. ONE BITE.</h1>'
      + '<p style="color:rgba(247,244,238,0.8);margin:10px 0 0;font-size:15px;letter-spacing:0.5px;">Thank you for your order!</p>'
      + '</td></tr>'
      + '<tr><td style="padding:36px 32px;">'
      + '<h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi ' + escapeHtml(toName) + ',</h2>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Your payment has been successfully confirmed. Your order for **' + escapeHtml(productName) + '** is complete and ready.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;border-radius:12px;margin:24px 0;"><tr><td style="padding:20px 24px;">'
      + '<p style="margin:0 0 14px;color:#2E5B76;font-weight:700;font-size:16px;">📋 Order Details</p>'
      + '<table width="100%" style="border-collapse:collapse;">'
      + '<tr><td style="color:#1F2933;font-size:15px;padding:6px 0;border-bottom:1px solid #D8C3A5;">Product</td><td style="color:#2E5B76;font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid #D8C3A5;">' + escapeHtml(productName) + '</td></tr>'
      + '<tr><td style="color:#1F2933;font-size:15px;padding:6px 0;border-bottom:1px solid #D8C3A5;">Delivery Email</td><td style="color:#2E5B76;font-size:15px;font-weight:700;text-align:right;border-bottom:1px solid #D8C3A5;">' + escapeHtml(toEmail) + '</td></tr>'
      + '<tr><td style="color:#1F2933;font-size:15px;padding:6px 0;">Payment Method</td><td style="color:#2E5B76;font-size:15px;font-weight:700;text-align:right;">' + methodLabel + '</td></tr>'
      + '</table></td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 24px;">Our team is preparing your gear/guides for delivery. If this contains digital content, you can access it immediately. For physical items, shipping details will follow shortly.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center">'
      + '<a href="https://onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(199,125,74,0.3);letter-spacing:0.5px;">'
      + 'Visit Our Website</a>'
      + '</td></tr></table>'
      + '<p style="color:#1F2933;font-size:15px;line-height:1.7;margin:28px 0 0;text-align:center;">💬 Need help? Contact us at <a href="mailto:' + CONFIG.SUPPORT_EMAIL + '" style="color:#2E5B76;font-weight:700;text-decoration:none;">' + CONFIG.SUPPORT_EMAIL + '</a></p>'
      + '</td></tr>'
      + '<tr><td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid #D8C3A5;">'
      + '<p style="color:#7A8F7B;font-size:14px;margin:0;">Explore More. Fish More. Travel More.</p>'
      + '<p style="color:#1F2933;font-size:13px;margin:8px 0 0;">© 2026 One Trip One Bite. All rights reserved.</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: toEmail,
      bcc: CONFIG.SUPPORT_EMAIL,
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
// TELEGRAM
// ============================================================

function sendTelegramMessage(text) {
  const token = CONFIG.TELEGRAM_BOT_TOKEN;
  const chatId = CONFIG.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const res = UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' }),
        muteHttpExceptions: true
      }
    );
    Logger.log('Telegram response: ' + res.getContentText());
  } catch (err) {
    Logger.log('Telegram error: ' + err.toString());
  }
}

function sendDailyReport() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const todayStr = Utilities.formatDate(today, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');

  let formCount = 0, paidBank = 0, paidPaypal = 0;

  for (let i = 1; i < data.length; i++) {
    const ts = data[i][COLS.TIMESTAMP - 1];
    if (!ts) continue;
    const rowDate = Utilities.formatDate(new Date(ts), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
    if (rowDate !== todayStr) continue;

    formCount++;
    const status = (data[i][COLS.STATUS - 1] || '').toString();
    const method = (data[i][COLS.METHOD - 1] || '').toString().toLowerCase();
    if (status === 'PAID_BANK' || (status.startsWith('PAID') && method === 'bank')) paidBank++;
    if (status === 'PAID_PAYPAL' || (status.startsWith('PAID') && method === 'paypal')) paidPaypal++;
  }

  const paidTotal = paidBank + paidPaypal;
  const revenue = paidTotal * CONFIG.PRODUCT_PRICE_RAW;
  const convRate = formCount > 0 ? ((paidTotal / formCount) * 100).toFixed(1) : '0.0';
  const revenueStr = '$' + revenue.toFixed(2);
  const dateStr = Utilities.formatDate(today, 'America/New_York', 'MM/dd/yyyy');

  const msg =
    '📊 DAILY REPORT: ' + dateStr + '\n' +
    'Matrix Shad "Glow" Lures\n' +
    '▬▬▬▬▬▬▬▬▬▬▬▬\n\n' +
    '📝 Registrations: ' + formCount + '\n' +
    '✅ Paid Orders:   ' + paidTotal + '\n' +
    '💰 Revenue:       ' + revenueStr + '\n' +
    '📈 Conv. Rate:    ' + convRate + '%\n' +
    '▬▬▬▬▬▬▬▬▬▬▬▬\n' +
    '🏦 Bank Transfer: ' + paidBank + '\n' +
    '💳 PayPal:        ' + paidPaypal;

  sendTelegramMessage(msg);
  Logger.log('Daily report sent: ' + dateStr);
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
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS);
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

// Test 3 format ref mà MBBank có thể gửi — chạy trong GAS Editor, check Logs
function testSepayWebhook() {
  const TEST_REF = 'CC30-546237';
  const cases = [
    { desc: 'exact match with dash', content: 'CC30-546237 CHUYEN KHOAN' },
    { desc: 'no dash', content: 'CC30546237 CHUYEN KHOAN' },
    { desc: 'space separator', content: 'CC30 546237 CHUYEN KHOAN' },
  ];

  let allPassed = true;
  cases.forEach(function (c) {
    const ref = TEST_REF.toUpperCase();
    const content = c.content.toUpperCase();
    const refNorm = ref.replace(/[-\s]/g, '');
    const contentNorm = content.replace(/[-\s]/g, '');
    const matched = content.includes(ref) || contentNorm.includes(refNorm);
    const ok = matched === true;
    if (!ok) allPassed = false;
    Logger.log('[testSepayWebhook] ' + c.desc + ': matched=' + matched + ' ' + (ok ? 'PASS' : 'FAIL'));
  });
  Logger.log('[testSepayWebhook] ' + (allPassed ? 'ALL PASS' : 'SOME FAILED'));
}

// Resend delivery email cho khách đã PAID nhưng chưa nhận file — truyền vào email đầy đủ
function manualResendByEmail(email) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowEmail = (data[i][COLS.EMAIL - 1] || '').toString();
    const rowStatus = (data[i][COLS.STATUS - 1] || '').toString();
    if (rowEmail === email && rowStatus.startsWith('PAID')) {
      const name = (data[i][COLS.NAME - 1] || '').toString();
      const method = rowStatus === 'PAID_PAYPAL' ? 'paypal' : 'bank';
      const ref = (data[i][COLS.REF - 1] || '').toString();
      sendDeliveryEmail(rowEmail, name, method, ref);
      Logger.log('manualResendByEmail: sent to ' + email + ' ref=' + ref);
      return;
    }
  }
  Logger.log('manualResendByEmail: no PAID row found for ' + email);
}

// Chạy 1 lần từ GAS Editor để tạo time-driven trigger báo cáo cuối ngày 23:00
function setupDailyReportTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyReport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .inTimezone('Asia/Ho_Chi_Minh')
    .create();
  Logger.log('Daily report trigger created: 23:00 Asia/Ho_Chi_Minh');
}

// Test gửi Telegram thủ công — chạy trong GAS Editor để verify bot token + chat ID
function testTelegram() {
  sendTelegramMessage('✅ Telegram integration test successful!\nBot is ready to receive order notifications.');
  Logger.log('testTelegram sent');
}

// ============================================================
// NEWSLETTER SENDER
// ============================================================

// Gửi Email bản tin hàng tháng cho tất cả các khách hàng có trạng thái SUBSCRIBED
function sendMonthlyNewsletter() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  // ⚙️ TIÊU ĐỀ & NỘI DUNG EMAIL
  const subject = "⛵ Monthly Adventures & Updates - One Trip One Bite";
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif;font-size:16px;color:#1F2933;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,0.05);border:1px solid #D8C3A5;">
              
              <!-- Header -->
              <tr>
                <td style="background:#F7F4EE;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(46,91,118,0.12);">
                  <img src="https://www.onetriponebite.com/assets/logo_transparent.png" alt="One Trip One Bite Logo" style="width:160px;height:auto;display:block;margin:0 auto 10px;" />
                  <p style="color:#C77D4A;margin:5px 0 0;font-size:14px;font-family:Georgia,serif;font-style:italic;font-weight:600;letter-spacing:0.5px;">Monthly Digest & Updates</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding:36px 32px;">
                  <h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi {{NAME}},</h2>
                  <p style="line-height:1.7;margin:0 0 20px;">Here is a digest of our latest trip reports, hidden fishing spots, local food finds, and gear reviews from the Gulf Coast:</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;border-radius:12px;margin:24px 0;border:1px solid rgba(46,91,118,0.08);">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 12px;color:#2E5B76;font-weight:700;font-size:16px;">🌊 Highlights this month:</p>
                        <p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">📍 New Spots:</strong> Secret kayak launches and hot spots around the Gulf Coast.</p>
                        <p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">🎣 Tips &amp; Tactics:</strong> Selecting the best soft plastic color patterns for stained water.</p>
                        <p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">🍣 Local Flavors:</strong> Honest reviews of coastal seafood shacks and local dives.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="line-height:1.7;margin:0 0 28px;">Click below to visit our website and catch up on the latest stories from the water.</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                    <tr>
                      <td align="center">
                        <a href="https://www.onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(199,125,74,0.25);">Visit Our Website</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid rgba(46,91,118,0.12);">
                  <p style="font-family:Georgia,serif;font-style:italic;color:#C77D4A;font-weight:600;margin:0 0 6px;">Cast. Taste. Explore.</p>
                  <p style="color:#1F2933;font-size:13px;margin:0;">© 2026 One Trip One Bite. All rights reserved.</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  let sendCount = 0;

  for (let i = 1; i < data.length; i++) {
    const email = (data[i][COLS.EMAIL - 1] || '').toString().trim();
    const status = (data[i][COLS.STATUS - 1] || '').toString().trim();
    const name = (data[i][COLS.NAME - 1] || 'Friend').toString().trim();

    if (email && status === 'SUBSCRIBED') {
      try {
        const personalizedBody = htmlBody.replace('{{NAME}}', name);
        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: personalizedBody,
          name: CONFIG.SENDER_NAME,
          replyTo: CONFIG.SUPPORT_EMAIL
        });
        sendCount++;
        Logger.log('Newsletter sent successfully to: ' + email);
      } catch (err) {
        Logger.log('Newsletter send failed for ' + email + ': ' + err.toString());
      }
    }
  }

  Logger.log('============================================');
  Logger.log('SUMMARY: Newsletter sent to ' + sendCount + ' subscribers.');
  Logger.log('============================================');
}
