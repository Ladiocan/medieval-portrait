import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Helper for Netopia. Creates temporary key files since the Netopia package expects file paths.
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
  const { phone, name } = req.query;
  
  if (!phone) {
    return res.status(400).send('Lipsește numărul de telefon (phone) din URL.');
  }

  // Set as sandbox if not explicitly 'false' (safer for testing initially)
  const isSandbox = process.env.NETOPIA_SANDBOX !== 'false'; 
  
  try {
    const { pubKeyPath, privKeyPath } = ensureKeyFiles();
    const Netopia = require('netopia-card');

    const netopia = new Netopia({
      signature: process.env.NETOPIA_SIGNATURE || '',
      publicKey: pubKeyPath,
      privateKey: privKeyPath,
      sandbox: isSandbox
    });

    const paymentData = {
      orderId: phone, 
      amount: '5',
      currency: 'RON',
      details: 'Portret Medieval',
      confirmUrl: 'https://portrait.turistintransilvania.com/api/webhook/netopia',
      returnUrl: 'https://portrait.turistintransilvania.com/payment-success.html',
      client: {
        billing: {
          firstName: name || 'Client',
          lastName: 'Turist',
          email: 'contact@turistintransilvania.com',
          phone: phone
        }
      }
    };
    
    // Netopia package builder
    const request = await netopia.buildRequest(paymentData);
    
    // If request.url is missing, fallback to known netopia URLs
    const paymentUrl = request.url || (
      isSandbox 
        ? 'https://sandboxsecure.mobilpay.ro' 
        : 'https://secure.mobilpay.ro'
    );
     
    // Render an auto-submitting form
    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecționare Netopia...</title>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #111; color: #fff; }
          .loader { border: 4px solid #333; border-top: 4px solid #d4af37; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .text-center { text-align: center; }
        </style>
      </head>
      <body onload="document.forms[0].submit()">
        <div class="text-center">
          <div class="loader"></div>
          <h2>Securizăm conexiunea cu Netopia...</h2>
          <p>Vei fi redirecționat automat pentru plata portretului (5 RON).</p>
        </div>
        <form action="${paymentUrl}" method="POST" style="display:none;">
          <input type="hidden" name="env_key" value="${request.envKey}" />
          <input type="hidden" name="data" value="${request.data}" />
        </form>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(formHtml);

  } catch (error) {
    console.error('Netopia request build error:', error);
    res.status(500).send('Eroare internă la generarea plății: ' + error.message + '. Verificați cheile de criptare.');
  }
}
