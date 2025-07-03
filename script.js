document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const webhookBaseUrl = window.ENV?.WEBHOOK_URL;
    const donationUrl = window.ENV?.DONATION_URL;
    const maxImageSize = window.ENV?.MAX_IMAGE_SIZE;
    const allowedImageTypes = (window.ENV?.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/heic,image/heif').split(',');

    // Check if required environment variables are set
    if (!webhookBaseUrl) {
        console.error('WEBHOOK_URL is not configured in environment variables');
        return;
    }

    if (!donationUrl) {
        console.error('DONATION_URL is not configured in environment variables');
        return;
    }

    // Form elements
    const form = document.querySelector('.simple-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const photoInput = document.getElementById('photo');
    const takePhotoBtn = document.getElementById('takePhoto');
    const choosePhotoBtn = document.getElementById('choosePhoto');
    const submitBtn = document.querySelector('.submit-btn');
    const successMessage = document.querySelector('.success-message');
    const newPortraitBtn = document.getElementById('newPortraitBtn');
    const donateBtn = document.getElementById('donateBtn');
    const removePhotoBtn = document.getElementById('removePhoto');
    const locationInput = document.getElementById('location');
    const uploadPhotoBtn = document.getElementById('uploadPhoto');

    // Hide camera button if not available on device
    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
        takePhotoBtn.style.display = 'none';
    }

    // Get location from URL parameters (set by QR code scan)
    function getLocationFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const location = params.get('loc');
        if (location) {
            locationInput.value = decodeURIComponent(location);
        }
    }

    // Initialize the page
    function init() {
        getLocationFromUrl();
        setupEventListeners();
        validateForm();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Camera button - triggers camera access
        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', async function() {
                try {
                    // Reset input to ensure change event fires even with same file
                    photoInput.value = '';
                    
                    // Check for camera access
                    if (!('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)) {
                        showError('Camera nu este disponibilă pe acest dispozitiv');
                        return;
                    }

                    // Request camera permissions
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    
                    // Create temporary video element to capture frame
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();

                    // Wait for video to load metadata
                    await new Promise(resolve => video.onloadedmetadata = resolve);

                    // Create canvas to capture frame
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    
                    // Capture frame
                    ctx.drawImage(video, 0, 0);
                    
                    // Convert to blob and create file with proper iPhone format
                    canvas.toBlob((blob) => {
                        // Use HEIC format for iPhone photos if supported
                        const fileType = navigator.userAgent.includes('iPhone') ? 'image/heic' : 'image/jpeg';
                        const file = new File([blob], 'photo.' + (fileType === 'image/heic' ? 'heic' : 'jpg'), { type: fileType });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        photoInput.files = dataTransfer.files;
                        
                        // Handle the selected file
                        handleFileSelect({ target: photoInput });
                        
                        // Clean up
                        stream.getTracks().forEach(track => track.stop());
                    }, 'image/jpeg');
                } catch (error) {
                    showError('Nu se poate accesa camera. Te rugăm să încerci din nou sau să alegi o imagine din galerie.');
                }
            });
        }
        
        // Gallery button - triggers file picker
        if (choosePhotoBtn) {
            choosePhotoBtn.addEventListener('click', function() {
                // Reset input to ensure change event fires
                photoInput.value = '';
                // Remove capture attribute to allow gallery access
                photoInput.removeAttribute('capture');
                photoInput.click();
            });
        }
        
        // Handle file selection
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.size > maxImageSize) {
                showError('Imaginea este prea mare. Te rugăm să încarci o imagine de maxim 5MB');
                return;
            }
            
            // Validate file type and size
            if (!allowedImageTypes.includes(file.type.toLowerCase())) {
                showError('Te rugăm să încarci o imagine în format JPG, PNG sau HEIC');
                return;
            }
            
            // Handle the selected file
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageDataUrl = event.target.result;
                // Update image preview
                const imagePreview = document.getElementById('image-preview');
                if (imagePreview) {
                    imagePreview.src = imageDataUrl;
                }
            };
            reader.readAsDataURL(file);
        }
        
        // Remove photo
        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', resetPhoto);
        }
        
        // Form submission
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        
        // Input validation on change
        if (nameInput) nameInput.addEventListener('input', validateForm);
        if (emailInput) emailInput.addEventListener('input', validateForm);
        
        // Donation button
        if (donateBtn) {
            donateBtn.addEventListener('click', handleDonate);
        }
    }

    // Show error message
    function showError(message) {
        // Simple error display - could be enhanced with a modal or toast
        alert(message);
    }

    // Validate form
    function validateForm() {
        if (!nameInput || !emailInput || !submitBtn) return false;
        
        const isNameValid = nameInput.value.trim() !== '';
        const isEmailValid = validateEmail(emailInput.value);
        const isPhotoSelected = photoInput && photoInput.files && photoInput.files.length > 0;
        
        // Toggle error states
        toggleError(nameInput, !isNameValid, 'Te rugăm să introduci un nume');
        toggleError(emailInput, emailInput.value === '' ? false : !isEmailValid, 
                  'Te rugăm să introduci o adresă de email validă');
        
        // Show/hide photo error
        const photoError = document.getElementById('photo-error');
        if (photoError) {
            photoError.style.display = !isPhotoSelected && photoInput ? 'block' : 'none';
        }
        
        // Update submit button state
        const isFormValid = isNameValid && isEmailValid && isPhotoSelected;
        if (submitBtn) {
            submitBtn.disabled = !isFormValid;
        }
        
        return isFormValid;
    }

    // Toggle error state for form fields
    function toggleError(inputElement, showError, message) {
        if (!inputElement) return;
        
        const formGroup = inputElement.closest('.form-group');
        if (!formGroup) return;
        
        let errorElement = formGroup.querySelector('.error-message');
        
        if (showError) {
            formGroup.classList.add('error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            formGroup.classList.remove('error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    // Email validation helper
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateForm() || !form) return;
        
        try {
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading-spinner"></span> Se procesează...';
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('name', nameInput ? nameInput.value.trim() : '');
            formData.append('email', emailInput ? emailInput.value.trim() : '');
            formData.append('location', locationInput ? locationInput.value : 'Nespecificat');
            if (photoInput && photoInput.files[0]) {
                formData.append('photo', photoInput.files[0]);
            }
            
            // Send to n8n webhook
            try {
                const response = await fetch(webhookBaseUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Webhook response:', data);
            } catch (error) {
                console.error('Webhook error:', error);
                throw error;
            }
            
            if (!response.ok) throw new Error('Eroare la trimiterea formularului');
            
            // Show success message
            if (form) form.style.display = 'none';
            if (successMessage) {
                successMessage.style.display = 'block';
                successMessage.scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('A apărut o eroare la trimiterea formularului. Te rugăm să încerci din nou.');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-magic"></i> Transformă în portret medieval';
            }
        }
    }

    // Handle donation button click
    function handleDonate() {
        // Redirect to donation page
        window.open(donationUrl, '_blank');
    }

    // Initialize the application
    init();
});
