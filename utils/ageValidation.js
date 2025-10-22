/**
 * Age Validation Utility
 * 
 * Provides functions for calculating age and validating minimum age requirements
 */

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if age meets minimum requirement
 * @param {Date|string} dateOfBirth - Date of birth
 * @param {number} minAge - Minimum age requirement (default: 18)
 * @returns {boolean} True if age >= minAge
 */
function isAgeValid(dateOfBirth, minAge = 18) {
  const age = calculateAge(dateOfBirth);
  return age >= minAge;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid format and valid date
 */
function isValidDateFormat(dateString) {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
function isFutureDate(date) {
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return checkDate > today;
}

/**
 * Get age range for privacy (e.g., "18-24", "25-34", "35-44", etc.)
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {string} Age range
 */
function getAgeRange(dateOfBirth) {
  const age = calculateAge(dateOfBirth);
  
  if (age < 18) return 'Under 18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
}

/**
 * Validate date of birth with comprehensive checks
 * @param {string} dateOfBirth - DOB string (YYYY-MM-DD)
 * @param {number} minAge - Minimum age requirement (default: 18)
 * @returns {Object} Validation result with success flag and message
 */
function validateDateOfBirth(dateOfBirth, minAge = 18) {
  // Check if provided
  if (!dateOfBirth) {
    return {
      success: false,
      message: 'Date of birth is required',
      field: 'dateOfBirth'
    };
  }

  // Check format
  if (!isValidDateFormat(dateOfBirth)) {
    return {
      success: false,
      message: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 1990-05-15)',
      field: 'dateOfBirth'
    };
  }

  const dobDate = new Date(dateOfBirth);

  // Check future date
  if (isFutureDate(dobDate)) {
    return {
      success: false,
      message: 'Date of birth cannot be in the future',
      field: 'dateOfBirth'
    };
  }

  // Check age requirement
  if (!isAgeValid(dobDate, minAge)) {
    const age = calculateAge(dobDate);
    return {
      success: false,
      message: `You must be at least ${minAge} years old to register. Your age: ${age}`,
      field: 'dateOfBirth',
      currentAge: age,
      minimumAge: minAge
    };
  }

  // Check reasonable age (e.g., not over 120 years old)
  const age = calculateAge(dobDate);
  if (age > 120) {
    return {
      success: false,
      message: 'Please enter a valid date of birth',
      field: 'dateOfBirth'
    };
  }

  return {
    success: true,
    age: age,
    ageRange: getAgeRange(dobDate)
  };
}

module.exports = {
  calculateAge,
  isAgeValid,
  isValidDateFormat,
  isFutureDate,
  getAgeRange,
  validateDateOfBirth
};
