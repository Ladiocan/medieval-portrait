export default async function handler(req, res) {
  const { phone, name } = req.query;
  
  if (!phone) {
    return res.status(400).send('Lipsește numărul de telefon (phone) din URL.');
  }

  const apiKey = process.env.NETOPIA_API_KEY;
  const posSignature = process.env.NETOPIA_SIGNATURE;
  const baseUrl = process.env.WEBHOOK_URL || 'https://portrait.turistintransilvania.com';
  const isSandbox = process.env.NETOPIA_SANDBOX !== 'false';
  
  const endpoint = isSandbox 
    ? 'https://secure.sandbox.netopia-payments.com/payment/card/start'
    : 'https://secure.mobilpay.ro/pay/payment/card/start';

  try {
    const paymentData = {
      config: {
        emailTemplate: 'default',
        notifyUrl: `${baseUrl}/api/webhook/netopia`,
        redirectUrl: `${baseUrl}/payment-success.html`,
        language: 'ro'
      },
      payment: {
        options: {
          installments: 0,
          bonus: 0
        },
        instrument: {
          type: 'card'
        },
        data: {
          BROWSER_USER_AGENT: req.headers['user-agent'] || 'Unknown',
          IP_ADDRESS: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
        }
      },
      order: {
        posSignature: posSignature,
        dateTime: new Date().toISOString(),
        description: 'Portret Medieval AI',
        orderID: `${phone}-${Date.now()}`,
        amount: 5.0,
        currency: 'RON',
        billing: {
          email: 'contact@turistintransilvania.com',
          phone: phone,
          firstName: name || 'Client',
          lastName: 'Medieval',
          city: 'Bucuresti',
          country: 642, // Romania country code
          state: 'Bucuresti',
          postalCode: '010001',
          details: `Plata portret pentru ${phone}`
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Netopia API Error:', result);
      throw new Error(result.message || result.error_description || 'Eroare la comunicarea cu Netopia API v2');
    }

    // Modern REST API returns a paymentURL to redirect to
    const paymentUrl = result.payment?.paymentURL;

    if (!paymentUrl) {
      throw new Error('Nu am primit link-ul de redirect de la Netopia.');
    }

    // Redirect user to Netopia checkout page
    res.redirect(302, paymentUrl);

  } catch (error) {
    console.error('Netopia request error:', error);
    res.status(500).send(`Eroare la generarea plății: ${error.message}`);
  }
}
