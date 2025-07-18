// Configuration file for Medieval Portrait Form
// Copy this file to config.js and update with your actual values

(function() {
    'use strict';
    
    // Set your actual configuration here
    if (typeof window !== 'undefined') {
        window.ENV = {
            // n8n webhook URL for S3 + Replicate AI generation flow
            // Format: https://your-n8n-instance.app.n8n.cloud/webhook/medieval-souvenir
            WEBHOOK_URL: 'https://your-n8n-instance.app.n8n.cloud/webhook/medieval-souvenir',
            
            // Optional donation URL
            DONATION_URL: 'https://your-donation-url.com',
            
            // Image upload constraints
            MAX_IMAGE_SIZE: 10485760, // 10MB in bytes (increased for better quality)
            ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/heic,image/heif',
            
            // S3 Configuration (for display purposes only - actual S3 config is in n8n)
            S3_BUCKET_URL: 'https://your-bucket-name.s3.amazonaws.com',
            
            // Replicate AI Generation settings
            AI_ENABLED: true,
            AI_IMAGE_DISPLAY: true, // Set to false to hide AI generated images from users
            AI_PROVIDER: 'replicate', // Using Replicate for cost-effective AI generation
            
            // Processing timeouts
            UPLOAD_TIMEOUT: 30000,    // 30 seconds for upload
            AI_GENERATION_TIMEOUT: 120000, // 120 seconds for Replicate AI generation (can take longer)
            
            // Debug mode
            DEBUG_MODE: false,
            
            // URL pentru exemplu de portret generat (folosit pentru testare)
            // Acesta va fi folosit doar dacă webhook-ul nu returnează o imagine
            SAMPLE_PORTRAIT_URL: 'https://turist-in-transilvania-medieval-portrait.s3.eu-central-1.amazonaws.com/sample-portrait.jpg'
        };
        
        console.log('Medieval Portrait Form configuration loaded successfully');
        console.log('Webhook URL configured:', window.ENV.WEBHOOK_URL);
        console.log('S3 integration enabled with AI generation');
        
        if (window.ENV.DEBUG_MODE) {
            console.log('Debug mode enabled - full configuration:', window.ENV);
        }
    }
})();
