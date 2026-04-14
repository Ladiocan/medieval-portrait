import fs from 'fs';
import path from 'path';
import os from 'os';

function ensureKeyFiles() {
  const tempDir = os.tmpdir();
  const pubKeyPath = path.join(tempDir, 'netopia_public.cer');
  const privKeyPath = path.join(tempDir, 'netopia_private.key');

  if (!fs.existsSync(pubKeyPath)) {
    fs.writeFileSync(pubKeyPath, process.env.NETOPIA_PUBLIC_KEY || '');
  }
  if (!fs.existsSync(privKeyPath)) {
    fs.writeFileSync(privKeyPath, process.env.NETOPIA_PRIVATE_KEY || '');
  }
  
  return { pubKeyPath, privKeyPath };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const isSandbox = process.env.NETOPIA_SANDBOX !== 'false'; 

  try {
    const { pubKeyPath, privKeyPath } = ensureKeyFiles();
    const NetopiaPkg = require('@bogdan-nita/netopia-card');
    const Netopia = typeof NetopiaPkg === 'function' ? NetopiaPkg : (NetopiaPkg.Netopia || NetopiaPkg.default || NetopiaPkg);

    const netopia = new Netopia({
      signature: process.env.NETOPIA_SIGNATURE || '',
      publicKey: pubKeyPath,
      privateKey: privKeyPath,
      sandbox: isSandbox
    });

    const { env_key, data } = req.body;
    
    if (!env_key || !data) {
      return res.status(400).send('Missing payload');
    }

    // Decrypt and validate Netopia response
    const response = await netopia.validateResponse(env_key, data);
    
    // Netopia returns orderId (which is the phone number in our case) and action
    const { orderId, action, errorMessage } = response;
    
    // Check if the payment got confirmed
    if (action === 'confirmed') {
      // 1. Alert N8N Webhook with the payment confirmation!
      // Provide the N8N_WEBHOOK_URL in environment vars
      const n8nWebhook = process.env.N8N_WEBHOOK_URL_PAYMENT;
      
      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: orderId, 
            status: 'paid',
            action: action,
            source: 'netopia_ipn'
          })
        });
      } else {
        console.warn('N8N_WEBHOOK_URL_PAYMENT nu este setat. N8N nu a fost notificat.');
      }
    }

    // Netopia requires an XML response to acknowledge their IPN!
    // Building a success XML:
    const ackXml = `<?xml version="1.0" encoding="utf-8"?>
<crc>SUCCESS</crc>`;
    
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(ackXml);

  } catch (error) {
    console.error('IPN Webhook error:', error);
    // If decryption fails or signature is wrong
    const errorXml = `<?xml version="1.0" encoding="utf-8"?>
<crc error_type="1" error_code="1">${error.message}</crc>`;
    
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(errorXml);
  }
}
