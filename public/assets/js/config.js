// config.js - Configuration file for Medieval Portrait Form
// This file reads from environment variables and provides fallbacks

const config = {
  // Get webhook URL from multiple sources with priority
  get WEBHOOK_URL() {
    // 1. From Vercel environment variables injected into window
    if (typeof window !== 'undefined' && window.ENV && window.ENV.WEBHOOK_URL) {
      return window.ENV.WEBHOOK_URL;
    }

    // 2. From meta tag (Vercel build replacement)
    if (typeof document !== 'undefined') {
      const webhookMeta = document.querySelector('meta[name="webhook-url"]');
      if (webhookMeta && webhookMeta.content && webhookMeta.content !== '%WEBHOOK_URL%') {
        return webhookMeta.content;
      }
    }

    // 3. Fallback for local development
    return 'https://your-n8n-instance.app.n8n.cloud/webhook/medieval-souvenir';
  },

  // WhatsApp phone number (international format without +)
  get WHATSAPP_NUMBER() {
    if (typeof window !== 'undefined' && window.ENV && window.ENV.WHATSAPP_NUMBER) {
      return window.ENV.WHATSAPP_NUMBER;
    }
    if (typeof document !== 'undefined') {
      const meta = document.querySelector('meta[name="whatsapp-number"]');
      if (meta && meta.content && meta.content !== '%WHATSAPP_NUMBER%') {
        return meta.content;
      }
    }
    return '40771229487';
  },

  // Image upload settings
  MAX_IMAGE_SIZE_MB: 15,
  ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/heic,image/heif',

  // Optional donation URL
  DONATION_URL: 'https://www.buymeacoffee.com/TuristinTransilvania',

  // Helper method to get webhook URL with validation
  getWebhookUrl() {
    const url = this.WEBHOOK_URL;
    if (!url || url.includes('your-n8n-instance')) {
      console.error('WEBHOOK_URL not properly configured');
      return '';
    }
    return url;
  },

  // Helper to build WhatsApp link with pre-filled message
  getWhatsAppUrl(lang) {
    const messages = {
      ro: 'Salut! Vreau un portret medieval! 🏰',
      en: 'Hi! I want a medieval portrait! 🏰',
      de: 'Hallo! Ich möchte ein mittelalterliches Porträt! 🏰',
      hu: 'Szia! Középkori portrét szeretnék! 🏰',
      es: '¡Hola! ¡Quiero un retrato medieval! 🏰',
      fr: 'Bonjour ! Je veux un portrait médiéval ! 🏰',
      it: 'Ciao! Voglio un ritratto medievale! 🏰',
      pl: 'Cześć! Chcę średniowieczny portret! 🏰',
    };
    const text = messages[lang] || messages.ro;
    return `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  },
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.config = config;
}
