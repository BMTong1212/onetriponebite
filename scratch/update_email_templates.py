import os

WORKSPACE_DIR = "/Users/bmtong/Desktop/One Trip One Bite Landing Page"
PROJECT_DIR = os.path.join(WORKSPACE_DIR, "content-calendar-lp")

files_to_update = [
    os.path.join(PROJECT_DIR, "Code.gs"),
    os.path.join(PROJECT_DIR, "gas/Code.js"),
    os.path.join(PROJECT_DIR, "GAS_CODE.js"),
    os.path.join(PROJECT_DIR, "gas-script.js")
]

# Define Old Welcome Email Block
OLD_WELCOME = """function sendWelcomeEmail(toEmail, toName) {
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
      + '</table></td></tr></table></body></html>';"""

# Define New Welcome Email Block
NEW_WELCOME = """function sendWelcomeEmail(toEmail, toName) {
  try {
    const subject = '⛵ Welcome to the Crew! - One Trip One Bite';
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif;font-size:15px;color:#1F2933;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,0.05);border:1px solid rgba(46,91,118,0.12);">'
      + '<tr><td style="background:#F7F4EE;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(46,91,118,0.12);">'
      + '<img src="https://www.onetriponebite.com/assets/logo_transparent.png" alt="One Trip One Bite Logo" style="width:160px;height:auto;display:block;margin:0 auto 10px;" />'
      + '<p style="color:#C77D4A;margin:5px 0 0;font-size:14px;font-family:Georgia,serif;font-style:italic;font-weight:600;letter-spacing:0.5px;">Welcome to the Adventure Crew</p>'
      + '</td></tr>'
      + '<tr><td style="padding:36px 32px;">'
      + '<h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi ' + escapeHtml(toName) + ',</h2>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Thanks for joining the crew! You are now subscribed to <strong>One Trip One Bite</strong>.</p>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Here is your free shipping code for your first order:</p>'
      + '<div style="background:#fdfbf7;border:2px dashed #C77D4A;color:#2E5B76;padding:16px;border-radius:8px;font-weight:bold;text-align:center;margin:18px 0;font-size:18px;letter-spacing:1px;font-family:\'Courier New\',Courier,monospace;">🎁 Coupon Code: <span style="color:#C77D4A;font-size:20px;font-weight:800;">FREESHIP1</span></div>'
      + '<p style="line-height:1.7;margin:0 0 20px;">And here is your free copy of the <strong>2026 Gulf Coast Fishing Regulations Guide</strong> (includes license guides, species deep-dives, and seasonal calendars for Louisiana, Mississippi, and the Florida Panhandle):</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 24px;"><tr><td align="center">'
      + '<a href="https://www.onetriponebite.com/assets/OTOB_Gulf_Coast_Fishing_Regulations_2026.xlsx" style="display:inline-block;background:#2E5B76;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(46,91,118,0.15);">📥 Download 2026 Regulations Guide (.xlsx)</a>'
      + '</td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 20px;">We are excited to share our latest adventures with you—from kayak fishing trip reports to destination guides, local food spots, and gear reviews that we actually use and trust.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;border-radius:12px;margin:28px 0;border:1px solid rgba(46,91,118,0.08);"><tr><td style="padding:20px 24px;">'
      + '<p style="margin:0 0 12px;color:#2E5B76;font-weight:700;font-size:16px;">🌊 What you\'ll receive from us:</p>'
      + '<p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">📍 Destinations:</strong> In-depth guides to secret kayak fishing spots and best seasons.</p>'
      + '<p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">🍣 Local Food:</strong> The best local diners, seafood spots, and recipes from the coast.</p>'
      + '<p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">🔧 Gear Reviews:</strong> Honest breakdowns of budget-friendly outdoor and fishing gear.</p>'
      + '<p style="margin:8px 0;color:#52606d;font-size:14px;line-height:1.6;"><strong style="color:#1F2933;">🎥 Exclusive Reels:</strong> Behind-the-scenes footage of our latest trips.</p>'
      + '</td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 28px;">Stay tuned for our upcoming updates. In the meantime, you can explore our latest videos on YouTube and follow our social channels.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center">'
      + '<a href="https://www.onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(199,125,74,0.25);">Visit Our Website</a>'
      + '</td></tr></table>'
      + '</td></tr>'
      + '<tr><td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid rgba(46,91,118,0.12);">'
      + '<p style="font-family:Georgia,serif;font-style:italic;color:#C77D4A;font-weight:600;margin:0 0 6px;">Cast. Taste. Explore.</p>'
      + '<p style="color:#1F2933;font-size:13px;margin:0;">© 2026 One Trip One Bite. All rights reserved.</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';'
"""

# Define Old Order Confirmation Block
OLD_DELIVERY = """function sendDeliveryEmail(toEmail, toName, method, ref) {
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
      + '</table></td></tr></table></body></html>';"""

# Define New Order Confirmation Block
NEW_DELIVERY = """function sendDeliveryEmail(toEmail, toName, method, ref) {
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

    const subject = '🎉 [One Trip One Bite] Order Confirmation - ' + productName;
    const methodLabel = method === 'paypal'
      ? 'PayPal (TXN ID: ' + ref + ')'
      : 'Bank Transfer (Ref: ' + ref + ')';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,sans-serif;font-size:15px;color:#1F2933;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(31,41,51,0.05);border:1px solid rgba(46,91,118,0.12);">'
      + '<tr><td style="background:#F7F4EE;padding:40px 32px;text-align:center;border-bottom:1px solid rgba(46,91,118,0.12);">'
      + '<img src="https://www.onetriponebite.com/assets/logo_transparent.png" alt="One Trip One Bite Logo" style="width:160px;height:auto;display:block;margin:0 auto 10px;" />'
      + '<p style="color:#C77D4A;margin:5px 0 0;font-size:14px;font-family:Georgia,serif;font-style:italic;font-weight:600;letter-spacing:0.5px;">Thank you for your order!</p>'
      + '</td></tr>'
      + '<tr><td style="padding:36px 32px;">'
      + '<h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi ' + escapeHtml(toName) + ',</h2>'
      + '<p style="line-height:1.7;margin:0 0 20px;">Your payment has been successfully confirmed. Your order for <strong>' + escapeHtml(productName) + '</strong> is complete and ready.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;border-radius:12px;margin:24px 0;border:1px solid rgba(46,91,118,0.08);"><tr><td style="padding:20px 24px;">'
      + '<p style="margin:0 0 14px;color:#2E5B76;font-weight:700;font-size:16px;">📋 Order Details</p>'
      + '<table width="100%" style="border-collapse:collapse;">'
      + '<tr><td style="color:#1F2933;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(46,91,118,0.08);">Product</td><td style="color:#2E5B76;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid rgba(46,91,118,0.08);">' + escapeHtml(productName) + '</td></tr>'
      + '<tr><td style="color:#1F2933;font-size:14px;padding:8px 0;border-bottom:1px solid rgba(46,91,118,0.08);">Delivery Email</td><td style="color:#2E5B76;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid rgba(46,91,118,0.08);">' + escapeHtml(toEmail) + '</td></tr>'
      + '<tr><td style="color:#1F2933;font-size:14px;padding:8px 0;">Payment Method</td><td style="color:#2E5B76;font-size:14px;font-weight:700;text-align:right;">' + methodLabel + '</td></tr>'
      + '</table></td></tr></table>'
      + '<p style="line-height:1.7;margin:0 0 24px;">Our team is preparing your gear/guides for delivery. If this contains digital content, you can access it immediately. For physical items, shipping details will follow shortly.</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center">'
      + '<a href="https://www.onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(199,125,74,0.25);">Visit Our Website</a>'
      + '</td></tr></table>'
      + '<p style="color:#1F2933;font-size:14px;line-height:1.7;margin:28px 0 0;text-align:center;">💬 Need help? Contact us at <a href="mailto:' + CONFIG.SUPPORT_EMAIL + '" style="color:#2E5B76;font-weight:700;text-decoration:none;">' + CONFIG.SUPPORT_EMAIL + '</a></p>'
      + '</td></tr>'
      + '<tr><td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid rgba(46,91,118,0.12);">'
      + '<p style="font-family:Georgia,serif;font-style:italic;color:#C77D4A;font-weight:600;margin:0 0 6px;">Cast. Taste. Explore.</p>'
      + '<p style="color:#1F2933;font-size:13px;margin:0;">© 2026 One Trip One Bite. All rights reserved.</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';"""

# Define Old Monthly Newsletter Block
OLD_NEWSLETTER = """              <!-- Header -->
              <tr>
                <td style="background:#2E5B76;padding:40px 32px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:14px;">⛵</div>
                  <h1 style="color:#F7F4EE;margin:0;font-size:28px;font-family:Georgia,serif;font-weight:700;letter-spacing:1px;">ONE TRIP ONE BITE</h1>
                  <p style="color:rgba(247,244,238,0.8);margin:10px 0 0;font-size:15px;letter-spacing:0.5px;">Monthly Newsletter</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding:36px 32px;">
                  <h2 style="color:#2E5B76;font-size:22px;font-weight:700;margin:0 0 16px;">Hi {{NAME}},</h2>
                  <p style="line-height:1.7;margin:0 0 20px;">Here is a digest of our latest trip reports, hidden fishing spots, local food finds, and gear reviews from the Gulf Coast:</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;border-radius:12px;margin:24px 0;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 10px;color:#2E5B76;font-weight:700;font-size:16px;">🌊 Highlights this month:</p>
                        <p style="margin:6px 0;color:#1F2933;font-size:15px;">📍 <strong>New Spots:</strong> Secret kayak launches and hot spots around the Gulf Coast.</p>
                        <p style="margin:6px 0;color:#1F2933;font-size:15px;">🎣 <strong>Tips &amp; Tactics:</strong> Selecting the best soft plastic color patterns for stained water.</p>
                        <p style="margin:6px 0;color:#1F2933;font-size:15px;">🍣 <strong>Local Flavors:</strong> Honest reviews of coastal seafood shacks and local dives.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="line-height:1.7;margin:0 0 28px;">Click below to visit our website and catch up on the latest stories from the water.</p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                    <tr>
                      <td align="center">
                        <a href="https://onetriponebite.com" style="display:inline-block;background:#C77D4A;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 6px 18px rgba(199,125,74,0.3);letter-spacing:0.5px;">Visit Our Website</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#F7F4EE;padding:24px 32px;text-align:center;border-top:1px solid #D8C3A5;">
                  <p style="color:#7A8F7B;font-size:14px;margin:0;">Explore More. Fish More. Travel More.</p>
                  <p style="color:#1F2933;font-size:13px;margin:8px 0 0;">© 2026 One Trip One Bite. All rights reserved.</p>
                </td>
              </tr>"""

# Define New Monthly Newsletter Block
NEW_NEWSLETTER = """              <!-- Header -->
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
              </tr>"""

for file_path in files_to_update:
    if os.path.exists(file_path):
        print(f"Updating {os.path.basename(file_path)}...")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Perform replacements
        original_len = len(content)
        content = content.replace(OLD_WELCOME, NEW_WELCOME)
        content = content.replace(OLD_DELIVERY, NEW_DELIVERY)
        content = content.replace(OLD_NEWSLETTER, NEW_NEWSLETTER)
        
        if len(content) == original_len:
            print(f"  Warning: No replacements made in {os.path.basename(file_path)}. Code structure might differ.")
        else:
            print(f"  Successfully updated {os.path.basename(file_path)}.")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
    else:
        print(f"Error: File not found at {file_path}")

print("Update completed.")
