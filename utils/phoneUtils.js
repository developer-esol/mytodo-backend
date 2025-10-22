const validateAndFormatPhone = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters except + at the beginning
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If phone doesn't start with +, add the + prefix
  if (!cleanPhone.startsWith('+')) {
    // If it starts with '61' (Australia code), add +
    if (cleanPhone.startsWith('61')) {
      cleanPhone = '+' + cleanPhone;
    }
    // If it starts with '04' (Australian mobile format), convert to international
    else if (cleanPhone.startsWith('04')) {
      cleanPhone = '+61' + cleanPhone.substring(1);
    }
    // If it's a 10-digit number starting with 0, assume Australian
    else if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      cleanPhone = '+61' + cleanPhone.substring(1);
    }
    // If it's a 9-digit number, assume Australian without leading 0
    else if (cleanPhone.length === 9) {
      cleanPhone = '+61' + cleanPhone;
    }
    // For other formats, you might want to add more country codes or return an error
    else {
      // For now, just add + if it's missing and the number looks international
      if (cleanPhone.length > 10) {
        cleanPhone = '+' + cleanPhone;
      }
    }
  }

  return cleanPhone;
};

const isValidAustralianPhone = (phone) => {
  const formatted = validateAndFormatPhone(phone);
  if (!formatted) return false;
  
  // Australian mobile numbers: +61 4XX XXX XXX (length 13 with +61)
  const australianMobileRegex = /^\+614\d{8}$/;
  
  return australianMobileRegex.test(formatted);
};

const isValidInternationalPhone = (phone) => {
  const formatted = validateAndFormatPhone(phone);
  if (!formatted) return false;
  
  // Basic international phone validation (starts with +, 7-15 digits)
  const internationalRegex = /^\+\d{7,15}$/;
  
  return internationalRegex.test(formatted);
};

module.exports = {
  validateAndFormatPhone,
  isValidAustralianPhone,
  isValidInternationalPhone
};