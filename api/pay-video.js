// Netopia Payments — XML/RC4/RSA integration (same approach as n8n workflows)
// Uses Node.js built-in crypto, NO npm packages needed
import crypto from 'crypto';

// Helper to parse keys from env, handling escaped newlines and accidental quotes
function parseKey(key) {
  if (!key) return '';
  let cleaned = key.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

// RC4 encryption (same algorithm as in n8n Netopia Encryption node)
function rc4Encrypt(keyStr, dataStr) {
  const key = Buffer.from(keyStr);
  const data = Buffer.from(dataStr);
  const S = [];
  let j = 0, x;
  for (let i = 0; i < 256; i++) S[i] = i;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) % 256;
    x = S[i]; S[i] = S[j]; S[j] = x;
  }
  let i = 0; j = 0;
  const output = Buffer.alloc(data.length);
  for (let y = 0; y < data.length; y++) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    x = S[i]; S[i] = S[j]; S[j] = x;
    output[y] = data[y] ^ S[(S[i] + S[j]) % 256];
  }
  return output.toString('base64');
}

// Simple HTML escaping to prevent XSS
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  const { phone, name, email } = req.query;

  if (!phone) {
    return res.status(400).send('Lipsește numărul de telefon (phone) din URL.');
  }

  const signature = process.env.NETOPIA_SIGNATURE;
  const publicCert = parseKey(process.env.NETOPIA_PUBLIC_KEY);
  const isSandbox = process.env.NETOPIA_SANDBOX !== 'false';

  if (!signature) {
    return res.status(500).send('Eroare internă: NETOPIA_SIGNATURE lipsește.');
  }
  if (!publicCert) {
    return res.status(500).send('Eroare internă: NETOPIA_PUBLIC_KEY lipsește.');
  }

  // Order details
  const orderId = `${phone.replace(/[^0-9]/g, '')}-${Date.now()}`;
  const amount = "10.00";
  const currency = "RON";
  const details = "Portret Medieval - Video Animation";
  const confirmUrl = 'https://portrait.turistintransilvania.com/api/webhook/netopia';
  const returnUrl = 'https://portrait.turistintransilvania.com/payment-success.html';

  // Billing info — split name into firstName/lastName
  const nameParts = (name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Medieval';
  const billingEmail = email || 'contact@turistintransilvania.com';

  // Convert phone to Romanian local format (07xxxxxxxx) for Netopia
  let billingPhone = phone.replace(/[^0-9]/g, '');
  if (billingPhone.startsWith('40') && billingPhone.length > 9) {
    billingPhone = '0' + billingPhone.substring(2);
  } else if (!billingPhone.startsWith('0')) {
    billingPhone = '0' + billingPhone;
  }

  // Build Netopia XML (same format as VideoToBlog n8n workflow)
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<order type="card" id="${orderId}" timestamp="${Date.now()}">
  <signature>${signature}</signature>
  <params>
    <param>
      <name>test</name>
      <value>${isSandbox ? 'true' : 'false'}</value>
    </param>
  </params>
  <invoice currency="RON" amount="${amount}">
    <details>${details}</details>
    <contact_info>
      <billing type="person">
        <first_name>${firstName}</first_name>
        <last_name>${lastName}</last_name>
        <email>${billingEmail}</email>
        <mobile_phone>${billingPhone}</mobile_phone>
        <address>Romania</address>
      </billing>
    </contact_info>
  </invoice>
  <url>
    <return>${returnUrl}</return>
    <confirm>${confirmUrl}</confirm>
  </url>
</order>`;

  try {
    console.log('Building Netopia payment:', { orderId, phone, isSandbox });

    // 1. Generate random RC4 key
    const rc4Key = crypto.randomBytes(16).toString('hex');

    // 2. Encrypt XML with RC4
    const encryptedData = rc4Encrypt(rc4Key, xml);

    // 3. Encrypt RC4 key with RSA using public certificate
    const encryptedKey = crypto.publicEncrypt(
      {
        key: publicCert,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(rc4Key)
    ).toString('base64');

    // 4. Determine action URL
    const actionUrl = isSandbox
      ? 'https://sandboxsecure.mobilpay.ro'
      : 'https://secure.mobilpay.ro';

    console.log('Payment encrypted successfully, redirecting to:', actionUrl);

    // 5. Render auto-submitting form (same as n8n → Netopia flow)
    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecționare Netopia...</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111; color: #fff; margin: 0; }
          .loader { border: 4px solid #333; border-top: 4px solid #d4af37; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .text-center { text-align: center; }
        </style>
      </head>
      <body onload="document.forms[0].submit()">
        <div class="text-center">
          <div class="loader"></div>
          <h2>Securizăm conexiunea cu Netopia...</h2>
          <p>Vei fi redirecționat automat pentru plata animației video (10 RON).</p>
        </div>
        <form action="${escapeHtml(actionUrl)}" method="POST" style="display:none;">
          <input type="hidden" name="env_key" value="${escapeHtml(encryptedKey)}" />
          <input type="hidden" name="data" value="${escapeHtml(encryptedData)}" />
        </form>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(formHtml);

  } catch (error) {
    console.error('Netopia encryption error:', error);
    return res.status(500).send(
      `Eroare internă la generarea plății: ${error.message}. Verifică cheile de criptare din Vercel.`
    );
  }
}
