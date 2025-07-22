// config-vercel.js - Configuration file compatible with Vercel environment variables
// This file SHOULD be committed to GitHub and deployed to Vercel

const config = {
  // Get webhook URL from Vercel environment variables OR use value from HTML data attribute
  WEBHOOK_URL: '',

  // Get other settings
  MAX_IMAGE_SIZE_MB: 15,
  ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/heic,image/heif',

  // Initialize from environment variables injected into HTML
  init: function() {
    // Try to get environment variables from HTML meta tags
    const webhookMeta = document.querySelector('meta[name="webhook-url"]');
    if (webhookMeta && webhookMeta.content) {
      this.WEBHOOK_URL = webhookMeta.content;
      console.log('Webhook URL loaded from meta tag');
    }
    
    return this;
  }
};

// Initialize config when loaded
if (typeof window !== 'undefined') {
  window.config = config.init();
}
