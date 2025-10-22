// utils/userUtils.js
/**
 * Utility function to format user name for display
 * Handles both legacy 'name' field and new 'firstName/lastName' fields
 */
const formatUserName = (user) => {
  if (!user) return '';
  
  // If user has firstName and lastName, use them
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  
  // Fallback to legacy name field
  return user.name || '';
};

/**
 * Format user object for API responses
 */
const formatUserObject = (user) => {
  if (!user) return null;
  
  return {
    _id: user._id,
    name: formatUserName(user),
    avatar: user.avatar,
    rating: user.rating,
    completedTasks: user.completedTasks,
    // Include original fields for backward compatibility
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

/**
 * Format currency amount for consistent display
 */
const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return null;
  
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return null;
  
  // Currency symbol mapping
  const currencySymbols = {
    'USD': '$',
    'AUD': 'A$',
    'LKR': 'Rs.',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
  };
  
  const symbol = currencySymbols[currency?.toUpperCase()] || currency || '$';
  
  // Format with commas for thousands
  const formattedAmount = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formattedAmount}`;
};

/**
 * Format currency object for API responses
 */
const formatCurrencyObject = (amount, currency = 'USD') => {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return { amount: null, currency, formatted: null };
  
  return {
    amount: numAmount,
    currency: currency?.toUpperCase() || 'USD',
    formatted: formatCurrency(amount, currency)
  };
};

module.exports = {
  formatUserName,
  formatUserObject,
  formatCurrency,
  formatCurrencyObject
};
