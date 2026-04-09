document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessageText = document.getElementById('errorMessage');

    if (!phone) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorMessageText.textContent = "Lipsește numărul de telefon din link.";
        return;
    }

    // Preia configuratiile
    const webhookUrl = typeof config !== 'undefined' && config.PAYMENT_WEBHOOK_URL
        ? config.PAYMENT_WEBHOOK_URL
        : 'https://n8n.ciocan.eu/webhook/medieval-whatsapp-payment';

    try {
        // Apelam webhook-ul n8n care va returna un formular Netopia sau linkul de plata (env_key si data)
        // Deoarece Netopia foloseste formular POST cu env_key si data, generam un formular invizibil
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: phone })
        });

        if (!response.ok) {
            throw new Error('Network error from webhook');
        }

        const data = await response.json();

        // Verificam daca am primit cheile Netopia
        if (data.env_key && data.data && data.paymentUrl) {
            // Cream formularul Netopia
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = data.paymentUrl;
            form.style.display = 'none';

            const envKeyInput = document.createElement('input');
            envKeyInput.type = 'hidden';
            envKeyInput.name = 'env_key';
            envKeyInput.value = data.env_key;
            form.appendChild(envKeyInput);

            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'data';
            dataInput.value = data.data;
            form.appendChild(dataInput);

            document.body.appendChild(form);
            form.submit();
        } else if (data.redirectUrl) {
            // Daca ne da direct un link (Stripe etc)
            window.location.href = data.redirectUrl;
        } else {
            throw new Error('Lipsesc datele de plată din răspuns');
        }
    } catch (error) {
        console.error('Payment init error:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorMessageText.textContent = "A apărut o problemă la generarea link-ului de plată. Eroare server.";
    }
});
