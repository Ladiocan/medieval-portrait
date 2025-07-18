# Setup Instructions

## 🔧 Configuration Setup

### 1. Create Configuration File

Copy the example configuration file:
```bash
cp config.example.js config.js
```

### 2. Update Configuration

Edit `config.js` with your actual values:
```javascript
window.ENV = {
    WEBHOOK_URL: 'https://your-n8n-instance.app.n8n.cloud/webhook-test/medieval-souvenir',
    DONATION_URL: 'https://your-donation-url.com',
    MAX_IMAGE_SIZE: 5242880, // 5MB
    ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/heic,image/heif'
};
```

### 3. Security Note

⚠️ **Important**: 
- `config.js` is in `.gitignore` and will NOT be uploaded to GitHub
- Only `config.example.js` should be committed to version control
- Never commit your actual webhook URLs to public repositories

## 🚀 Running the Application

```bash
# Start local server
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

## 🔗 n8n Webhook Setup

Your webhook will receive:
- `name`: User's name
- `email`: User's email  
- `photo`: Image file
- `photoName`: Original filename
- `photoSize`: File size in bytes
- `photoType`: MIME type
- `timestamp`: ISO timestamp

## 🐛 Troubleshooting

### Photo Preview Not Showing
- Check browser console for errors
- Ensure file size is under 5MB
- Verify file format (JPG, PNG, HEIC)

### Form Not Submitting
- Verify all fields are filled
- Check webhook URL in config.js
- Check browser network tab for errors
