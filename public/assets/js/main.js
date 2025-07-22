
// Determine configuration object set by config.js (const config) or fallback to window.config / ENV.
const cfg = (() => {
  if (typeof config !== 'undefined') return config; // from config.js
  if (typeof window.config !== 'undefined') return window.config; // legacy global
  // Fallback minimal config built from ENV vars
  return {
    webhookUrl: window.ENV?.WEBHOOK_URL || '',
    donationUrl: window.ENV?.DONATION_URL || '#',
    PAYMENT_URL_5: window.ENV?.PAYMENT_URL_5 || '',
  };
})();

// Short query-selector helper
const $ = (sel) => document.querySelector(sel);

function toggleLoading(show) {
  const overlay = $('#loadingOverlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showSuccess(show) {
  const success = $('#successMessage');
  if (success) success.classList.toggle('show', show);
}

function validateForm() {
  const nameInput = $('#name');
  const emailInput = $('#email');
  const photoInput = $('#photo');
  const termsInput = $('#terms');
  if (!nameInput || !emailInput || !photoInput) return false;

  const nameValid = nameInput.value.trim() !== '';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
  const photoSelected = photoInput.files && photoInput.files.length === 1;
  const termsChecked = termsInput && termsInput.checked;

  return nameValid && emailValid && photoSelected && termsChecked;
}

async function sendToWebhook(formData) {
  const webhookUrl = config.getWebhookUrl();
  if (!webhookUrl) {
    console.error('WEBHOOK_URL not configured');
    throw new Error('WEBHOOK_URL not configured');
  }
  
  console.log('Webhook URL configured:', webhookUrl);
  
  // Log formData contents for debugging
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    if (pair[0] === 'file') {
      console.log('File entry:', { 
        name: pair[1].name, 
        type: pair[1].type, 
        size: pair[1].size 
      });
    } else {
      console.log(pair[0] + ':', pair[1]);
    }
  }
  
  let resp;
  try {
    resp = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    });
    
    console.log('Webhook response:', { 
      status: resp.status, 
      statusText: resp.statusText,
      ok: resp.ok
    });
    
    if (!resp.ok) {
      throw new Error(`Webhook error – HTTP ${resp.status}`);
    }
    return resp.blob();
  } catch (error) {
    console.warn('Primary fetch failed, trying CORS proxy...', error);
    
    // Attempt retry via CORS proxy
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(webhookUrl)}`;
      console.log('Retrying via proxy:', proxyUrl);
      resp = await fetch(proxyUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
      });
      if (!resp.ok) {
        throw new Error(`Proxy webhook error – HTTP ${resp.status}`);
      }
      return resp.blob();
    } catch (proxyErr) {
      console.error('Proxy fetch also failed:', proxyErr);
      throw error; // propagate original error
    }
  }
}

function renderPortrait(imageUrl) {
  const img = $('#generatedPortrait');
  const downloadBtn = $('#downloadBtn');

  if (img) {
    img.src = imageUrl;
    img.onload = () => {
      if (downloadBtn) {
        downloadBtn.href = imageUrl;
        downloadBtn.download = `portret-medieval-${Date.now()}.png`;
        downloadBtn.style.display = 'inline-flex';
      }
    };
  }

  showSuccess(true);
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    alert('Formular incomplet sau invalid.');
    return;
  }

  const form = e.currentTarget;
  const submitBtn = form.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Se procesează…';
  }

  toggleLoading(true);

  try {
    // Build FormData manually to allow HEIC conversion
    const formData = new FormData();
    // copy fields except file
    [...new FormData(form).entries()].forEach(([k, v]) => {
      if (k !== 'file') formData.append(k, v);
    });
    formData.append('timestamp', new Date().toISOString());

    // handle file
    const photoInput = $('#photo');
    if (!photoInput || !photoInput.files || !photoInput.files[0]) {
      throw new Error('Nu s-a găsit nicio imagine');
    }
    const fileToSend = photoInput.files[0];
    formData.append('file', fileToSend, fileToSend.name);

    const blob = await sendToWebhook(formData);
    const blobUrl = URL.createObjectURL(blob);
    renderPortrait(blobUrl);
  } catch (err) {
    console.error(err);
    alert('A apărut o eroare la procesarea portretului. Încearcă din nou.');
  } finally {
    toggleLoading(false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = (translations[currentLang] || translations.ro).submitBtn;
    }
  }
}

function init() {
  const form = $('#portraitForm');
  if (form) form.addEventListener('submit', handleSubmit);

  const newPortraitBtn = $('#newPortraitBtn');
  if (newPortraitBtn) newPortraitBtn.addEventListener('click', () => {
    location.reload();
  });


  // photo upload buttons
  const uploadBtn = $('#uploadBtn');
  const selfieBtn = $('#selfieBtn');
  const photoInput = $('#photo');

  const photoFilename = $('#photoFilename');

  if (uploadBtn && photoInput) {
    uploadBtn.addEventListener('click', () => {
      photoInput.removeAttribute('capture');
      photoInput.click();
    });
  }

  if (selfieBtn && photoInput) {
    selfieBtn.addEventListener('click', () => {
      photoInput.setAttribute('capture', 'user');
      photoInput.click();
    });
  }

  // show filename when selected
  if (photoInput) {
    photoInput.addEventListener('change', () => {
      if (photoInput.files && photoInput.files.length) {
        const file = photoInput.files[0];
        if (photoFilename) {
          photoFilename.textContent = file.name;
        }
      } else if (photoFilename) {
        photoFilename.textContent = '';
      }
    });
  }
}


// ---------------- i18n ----------------
const translations = {
  ro: {
    labelName: 'Numele tău',
    labelEmail: 'Email',
    labelPhoto: 'Fotografia ta',
    hintPhoto: 'Formate acceptate: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Creează portretul',
    placeholderName: 'Introdu numele tău',
    placeholderEmail: 'adresa.ta@email.com',
    btnUpload: '<i class="fas fa-upload"></i> Încarcă imagine',
    btnSelfie: '<i class="fas fa-camera"></i> Fă un selfie',
    termsText: 'Sunt de acord cu <a href="terms.html" target="_blank">Termenii și Condițiile</a> și politica GDPR',
    loadingTitle: 'Se procesează portretul tău medieval',
    loadingText: 'Te rugăm să aștepți câteva momente…',
    successTitle: 'Portretul tău medieval este gata!',
    downloadBtn: '<i class="fas fa-download"></i> Descarcă portretul',
    donateBtn: '<i class="fas fa-heart"></i> Donează',
    newPortraitBtn: '<i class="fas fa-plus"></i> Alt portret',
  },
  en: {
    labelName: 'Your Name',
    labelEmail: 'Email',
    labelPhoto: 'Your Photo',
    hintPhoto: 'Accepted formats: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Create portrait',
    placeholderName: 'Enter your name',
    placeholderEmail: 'your.email@example.com',
    btnUpload: '<i class="fas fa-upload"></i> Upload image',
    btnSelfie: '<i class="fas fa-camera"></i> Take a selfie',
    termsText: 'I agree to the <a href="terms.html" target="_blank">Terms & Conditions</a> and GDPR policy',
    loadingTitle: 'Your medieval portrait is processing',
    loadingText: 'Please wait a few moments…',
    successTitle: 'Your medieval portrait is ready!',
    downloadBtn: '<i class="fas fa-download"></i> Download portrait',
    donateBtn: '<i class="fas fa-heart"></i> Donate',
    newPortraitBtn: '<i class="fas fa-plus"></i> New portrait',
  },
  de: {
    labelName: 'Dein Name',
    labelEmail: 'E-Mail',
    labelPhoto: 'Dein Foto',
    hintPhoto: 'Akzeptierte Formate: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Porträt erstellen',
    placeholderName: 'Gib deinen Namen ein',
    placeholderEmail: 'deine.email@example.com',
    btnUpload: '<i class="fas fa-upload"></i> Bild hochladen',
    btnSelfie: '<i class="fas fa-camera"></i> Selfie machen',
    termsText: 'Ich stimme den <a href="terms.html" target="_blank">Geschäftsbedingungen</a> und der Datenschutzrichtlinie zu',
    loadingTitle: 'Dein mittelalterliches Porträt wird erstellt',
    loadingText: 'Bitte warte einen Moment…',
    successTitle: 'Dein mittelalterliches Porträt ist fertig!',
    downloadBtn: '<i class="fas fa-download"></i> Porträt herunterladen',
    donateBtn: '<i class="fas fa-heart"></i> Spenden',
    newPortraitBtn: '<i class="fas fa-plus"></i> Neues Porträt',
  },
  hu: {
    labelName: 'Neved',
    labelEmail: 'Email',
    labelPhoto: 'Fényképed',
    hintPhoto: 'Elfogadott formátumok: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Portré készítése',
    placeholderName: 'Add meg a neved',
    placeholderEmail: 'email@példa.hu',
    btnUpload: '<i class="fas fa-upload"></i> Kép feltöltése',
    btnSelfie: '<i class="fas fa-camera"></i> Készíts szelfit',
    termsText: 'Elfogadom az <a href="terms.html" target="_blank">Általános Szerződési Feltételeket</a> és az adatkezelést',
    loadingTitle: 'A középkori portré feldolgozás alatt',
    loadingText: 'Kérjük, várj néhány pillanatot…',
    successTitle: 'Elkészült a középkori portréd!',
    downloadBtn: '<i class="fas fa-download"></i> Portré letöltése',
    donateBtn: '<i class="fas fa-heart"></i> Adományozás',
    newPortraitBtn: '<i class="fas fa-plus"></i> Új portré',
  },
  es: {
    labelName: 'Tu nombre',
    labelEmail: 'Correo electrónico',
    labelPhoto: 'Tu foto',
    hintPhoto: 'Formatos aceptados: JPG, PNG, HEIC (máx 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Crear retrato',
    placeholderName: 'Introduce tu nombre',
    placeholderEmail: 'tu.email@ejemplo.com',
    btnUpload: '<i class="fas fa-upload"></i> Subir imagen',
    btnSelfie: '<i class="fas fa-camera"></i> Tomar selfie',
    termsText: 'Acepto los <a href="terms.html" target="_blank">Términos y Condiciones</a> y la política GDPR',
    loadingTitle: 'Tu retrato medieval se está procesando',
    loadingText: 'Por favor, espera unos momentos…',
    successTitle: '¡Tu retrato medieval está listo!',
    downloadBtn: '<i class="fas fa-download"></i> Descargar retrato',
    donateBtn: '<i class="fas fa-heart"></i> Donar',
    newPortraitBtn: '<i class="fas fa-plus"></i> Nuevo retrato',
  },
  fr: {
    labelName: 'Votre nom',
    labelEmail: 'Email',
    labelPhoto: 'Votre photo',
    hintPhoto: 'Formats acceptés : JPG, PNG, HEIC (max 5Mo)',
    submitBtn: '<i class="fas fa-magic"></i> Créer le portrait',
    placeholderName: 'Entrez votre nom',
    placeholderEmail: 'votre.email@exemple.com',
    btnUpload: '<i class="fas fa-upload"></i> Télécharger l\'image',
    btnSelfie: '<i class="fas fa-camera"></i> Prendre un selfie',
    termsText: 'J\'accepte les <a href="terms.html" target="_blank">Conditions générales</a> et la politique RGPD',
    loadingTitle: 'Votre portrait médiéval est en cours de traitement',
    loadingText: 'Veuillez patienter quelques instants…',
    successTitle: 'Votre portrait médiéval est prêt !',
    downloadBtn: '<i class="fas fa-download"></i> Télécharger le portrait',
    donateBtn: '<i class="fas fa-heart"></i> Faire un don',
    newPortraitBtn: '<i class="fas fa-plus"></i> Nouveau portrait',
  },
  it: {
    labelName: 'Il tuo nome',
    labelEmail: 'Email',
    labelPhoto: 'La tua foto',
    hintPhoto: 'Formati accettati: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Crea ritratto',
    placeholderName: 'Inserisci il tuo nome',
    placeholderEmail: 'tuo.email@esempio.it',
    btnUpload: '<i class="fas fa-upload"></i> Carica immagine',
    btnSelfie: '<i class="fas fa-camera"></i> Scatta selfie',
    termsText: 'Accetto i <a href="terms.html" target="_blank">Termini e Condizioni</a> e l\'informativa GDPR',
    loadingTitle: 'Il tuo ritratto medievale è in elaborazione',
    loadingText: 'Attendi qualche istante…',
    successTitle: 'Il tuo ritratto medievale è pronto!',
    downloadBtn: '<i class="fas fa-download"></i> Scarica ritratto',
    donateBtn: '<i class="fas fa-heart"></i> Dona',
    newPortraitBtn: '<i class="fas fa-plus"></i> Nuovo ritratto',
  },
  pl: {
    labelName: 'Twoje imię',
    labelEmail: 'Email',
    labelPhoto: 'Twoje zdjęcie',
    hintPhoto: 'Akceptowane formaty: JPG, PNG, HEIC (max 5MB)',
    submitBtn: '<i class="fas fa-magic"></i> Stwórz portret',
    placeholderName: 'Wpisz swoje imię',
    placeholderEmail: 'twoj.email@przyklad.pl',
    btnUpload: '<i class="fas fa-upload"></i> Prześlij obraz',
    btnSelfie: '<i class="fas fa-camera"></i> Zrób selfie',
    termsText: 'Akceptuję <a href="terms.html" target="_blank">Regulamin</a> i politykę RODO',
    loadingTitle: 'Twój średniowieczny portret jest przetwarzany',
    loadingText: 'Poczekaj chwilę…',
    successTitle: 'Twój średniowieczny portret jest gotowy!',
    downloadBtn: '<i class="fas fa-download"></i> Pobierz portret',
    donateBtn: '<i class="fas fa-heart"></i> Wspomóż',
    newPortraitBtn: '<i class="fas fa-plus"></i> Nowy portret',
  },
};

let currentLang = 'ro';

function applyTranslations(lang) {
  currentLang = lang;
  const dict = translations[lang] || translations.ro;

  // Support legacy attribute names (data-translate-key / data-translate-placeholder-key)
  document
    .querySelectorAll(
      '[data-i18n], [data-translate-key], [data-translate-placeholder-key]'
    )
    .forEach((el) => {
      const key =
        el.getAttribute('data-i18n') ||
        el.getAttribute('data-translate-key') ||
        el.getAttribute('data-translate-placeholder-key');

      if (dict[key]) {
        // For inputs or elements explicitly marked as placeholder translations
        if (el.tagName === 'INPUT' || el.hasAttribute('data-translate-placeholder-key')) {
          el.placeholder = dict[key];
        } else {
          el.innerHTML = dict[key];
        }
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // detect lang param on portrait page
  const params = new URLSearchParams(window.location.search);
  const lang =
    params.get('lang') ||
    document.documentElement.getAttribute('lang') ||
    'ro';
  applyTranslations(lang);
  init();
});
