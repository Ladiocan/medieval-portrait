# Medieval Portrait Form

A web application that allows users to upload their photos and receive medieval-style portraits generated through an AI service via n8n webhook integration.

## ✨ Features

- **📸 Photo Upload**: Camera capture or gallery selection
- **✅ Form Validation**: Real-time validation with error handling
- **🔗 Webhook Integration**: Seamless n8n webhook integration for AI processing
- **📱 Responsive Design**: Optimized for desktop and mobile devices
- **🏰 Medieval Theme**: Beautiful medieval-inspired UI design
- **🚀 Performance**: Optimized code with no duplicates or unused elements
- **🔒 Security**: Input validation, file restrictions, and secure headers

## 🚀 Quick Start

### 1. Configuration

Edit `config.js` to set your webhook URLs:

```javascript
window.ENV = {
    WEBHOOK_URL: 'https://your-n8n-webhook-url.com/webhook',
    DONATION_URL: 'https://your-donation-url.com',
    MAX_IMAGE_SIZE: 5242880, // 5MB
    ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png,image/heic,image/heif'
};
```

### 2. Running the Application

```bash
# Using Python (recommended)
python3 -m http.server 8080

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8080
```

### 3. Access
Open `http://localhost:8080` in your browser

## 🔗 Webhook Integration

### Request Format
The form sends a `multipart/form-data` POST request with:

```
name: string           # User's name
email: string          # User's email
photo: File           # Image file (JPG/PNG/HEIC)
photoName: string     # Original filename
photoSize: number     # File size in bytes
photoType: string     # MIME type
timestamp: string     # ISO timestamp
```

### Response Handling
- ✅ **Success**: Any 2xx status code
- ❌ **Error**: Detailed error messages for different failure scenarios
- 🔄 **Retry Logic**: User-friendly error messages with retry suggestions

## 📁 File Structure

```
├── index.html          # Main HTML file
├── style.css           # Clean, organized styles
├── script.js           # Optimized JavaScript
├── config.js           # Configuration management
├── logo.png           # Application logo
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
└── README.md          # Documentation
```

## 🔧 Code Quality Improvements

### ✅ Fixed Issues:
- ❌ **Removed duplicate functions** (handleDonate was defined twice)
- ❌ **Removed unused elements** (removePhotoBtn, locationInput, uploadPhotoBtn)
- ❌ **Cleaned CSS duplicates** (footer styles, button styles, responsive breakpoints)
- ✅ **Enhanced error handling** with specific error messages
- ✅ **Improved form validation** with dynamic error element creation
- ✅ **Better environment variable management**
- ✅ **Optimized webhook integration** with proper error handling

### 🎯 Form Functionality:
- ✅ **Photo validation**: File type, size, and format checking
- ✅ **Real-time validation**: Instant feedback on form inputs
- ✅ **Camera integration**: Direct camera access for photo capture
- ✅ **Gallery selection**: File picker with proper filtering
- ✅ **Success handling**: Clean success message with reset functionality

## 🌐 Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Features

- Input validation and sanitization
- File type and size restrictions (max 5MB)
- Security headers (XSS, CSRF protection)
- Secure form submission with error handling
- No sensitive data exposure

## 📱 Mobile Optimization

- Touch-friendly interface
- Camera access on mobile devices
- Responsive design for all screen sizes
- Optimized file upload for mobile

## 🎨 UI/UX Features

- Medieval-themed design
- Loading states and animations
- Error and success feedback
- Accessibility support
- Keyboard navigation

## 📄 License

MIT License - feel free to use and modify as needed.
