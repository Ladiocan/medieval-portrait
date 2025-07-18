// public/assets/js/donation.js

document.addEventListener('DOMContentLoaded', () => {
  // Helper function to safely get elements by ID
  const $ = (selector) => document.querySelector(selector);

  // Check if the config object is available
  if (typeof config === 'undefined') {
    console.error('Configuration object (config.js) not found. Please ensure it is loaded correctly.');
    return;
  }

  // Map of button IDs to their corresponding config keys
  const donationLinks = {
    '#donate-5': config.DONATION_URL_5,
    '#donate-10': config.DONATION_URL_10,
    '#donate-25': config.DONATION_URL_25,
    '#donate-50': config.DONATION_URL_50,
  };

  // Assign the href from config to each donation button
  for (const selector in donationLinks) {
    const button = $(selector);
    const url = donationLinks[selector];

    if (button) {
      if (url && !url.includes('YOUR_STRIPE_LINK')) {
        button.href = url;
      } else {
        console.warn(`Stripe URL for ${selector} is not configured in config.js.`);
        // Optional: disable the button if the link is not set
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
        button.title = 'This donation option is currently unavailable.';
      }
    } else {
      console.warn(`Donation button with selector ${selector} not found in the DOM.`);
    }
  }
});
