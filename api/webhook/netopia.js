import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { env_key, data } = req.body;
    
    if (!env_key || !data) {
      // Netopia v2 might send a JSON body directly if it's the newer notification style
      // For now, we handle the standard env_key/data which remains common
      return res.status(400).send('Missing payload (env_key/data)');
    }

    const Netopia = require('netopia-card');
    
    // In v2, we often use the API Key for verification if it's a REST transaction
    const netopia = new Netopia({
      apiKey: process.env.NETOPIA_API_KEY,
      signature: process.env.NETOPIA_SIGNATURE,
      sandbox: process.env.NETOPIA_SANDBOX !== 'false'
    });

    // Validate and decrypt
    const response = await netopia.validatePayment(env_key, data);
    
    const { orderId, status, action } = response;
    
    // status 3 = paid, status 5 = confirmed (depending on Netopia version)
    // Most common is checking for 'confirmed' or 'paid'
    if (action === 'confirmed' || action === 'paid' || status === 'confirmed') {
      const n8nWebhook = process.env.N8N_WEBHOOK_URL_PAYMENT;
      
      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: orderId.split('-')[0], // Extract phone from orderID (phone-timestamp)
            orderId: orderId,
            status: 'paid',
            source: 'netopia_v2_ipn'
          })
        });
      }
    }

    // Modern API still often expects this XML ACK
    const ackXml = `<?xml version="1.0" encoding="utf-8"?><crc>SUCCESS</crc>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(ackXml);

  } catch (error) {
    console.error('IPN Webhook error:', error);
    const errorXml = `<?xml version="1.0" encoding="utf-8"?><crc error_type="1" error_code="1">${error.message}</crc>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(errorXml);
  }
}
