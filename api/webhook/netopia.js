// Netopia Payments — IPN Webhook handler (XML/RC4/RSA decryption)
// Same decryption approach as n8n "Decrypt Netopia" node
import crypto from 'crypto';

// Helper to parse keys from env
function parseKey(key) {
  if (!key) return '';
  let cleaned = key.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

// RC4 decryption (same as encryption — RC4 is symmetric)
function rc4Decrypt(keyBuffer, dataBase64) {
  const key = keyBuffer;
  const data = Buffer.from(dataBase64, 'base64');
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
  return output.toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const privateKey = parseKey(process.env.NETOPIA_PRIVATE_KEY);

  if (!privateKey) {
    console.error('Webhook error: NETOPIA_PRIVATE_KEY lipsește.');
    const errorXml = `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="1">Config Error</crc>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(errorXml);
  }

  try {
    const { env_key, data } = req.body;

    if (!env_key || !data) {
      console.error('Webhook: missing env_key or data');
      const errorXml = `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="1">Missing payload</crc>`;
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(errorXml);
    }

    // 1. RSA decrypt the RC4 key
    const decryptedKeyBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(env_key, 'base64')
    );

    // 2. RC4 decrypt the XML data
    const xml = rc4Decrypt(decryptedKeyBuffer, data);

    console.log('Decrypted Netopia XML (first 200 chars):', xml.substring(0, 200));

    // 3. Extract order ID and action from XML
    const orderIdMatch = xml.match(/id="([^"]+)"/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    const actionMatch = xml.match(/<action>(.*?)<\/action>/);
    const action = actionMatch ? actionMatch[1] : 'unknown';

    // Extract error info if present
    const errorCodeMatch = xml.match(/<error code="(\d+)">(.*?)<\/error>/);
    const errorCode = errorCodeMatch ? errorCodeMatch[1] : '0';

    console.log('Payment IPN:', { orderId, action, errorCode });

    // 4. If payment is confirmed, notify n8n
    if (action === 'confirmed' || action === 'paid') {
      const n8nWebhook = process.env.N8N_WEBHOOK_URL_PAYMENT;

      if (n8nWebhook) {
        try {
          // Extract phone from orderId (format: <phone>-<timestamp>)
          const phoneParts = orderId ? orderId.match(/^(\d+)-\d+$/) : null;
          const phone = phoneParts ? phoneParts[1] : orderId;

          await fetch(n8nWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              status: 'paid',
              action: action,
              orderId: orderId,
              source: 'netopia_ipn'
            })
          });
          console.log('N8N notified successfully for payment:', orderId);
        } catch (n8nError) {
          console.error('Failed to notify N8N:', n8nError.message);
        }
      } else {
        console.warn('N8N_WEBHOOK_URL_PAYMENT nu este setat.');
      }
    }

    // 5. Respond to Netopia with XML acknowledgment (required!)
    const ackXml = `<?xml version="1.0" encoding="utf-8"?><crc error_type="0" error_code="0">0</crc>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(ackXml);

  } catch (error) {
    console.error('IPN Webhook error:', error);
    const errorXml = `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="1">${error.message}</crc>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(errorXml);
  }
}
