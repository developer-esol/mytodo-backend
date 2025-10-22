const fs = require('fs');
const path = require('path');

// Category icon mappings with appropriate SVG icons
const categoryIcons = {
  // Construction & Maintenance
  'fence-construction': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#8B5CF6"/>
    <rect x="12" y="20" width="4" height="24" fill="white"/>
    <rect x="20" y="16" width="4" height="28" fill="white"/>
    <rect x="28" y="20" width="4" height="24" fill="white"/>
    <rect x="36" y="16" width="4" height="28" fill="white"/>
    <rect x="44" y="20" width="4" height="24" fill="white"/>
    <rect x="10" y="28" width="40" height="2" fill="white"/>
    <rect x="10" y="36" width="40" height="2" fill="white"/>
  </svg>`,
  
  'appliance-installation-and-repair': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#EF4444"/>
    <rect x="16" y="12" width="32" height="40" rx="4" fill="white"/>
    <circle cx="32" cy="24" r="3" fill="#EF4444"/>
    <rect x="20" y="32" width="24" height="2" fill="#EF4444"/>
    <rect x="20" y="36" width="24" height="2" fill="#EF4444"/>
    <rect x="20" y="40" width="16" height="2" fill="#EF4444"/>
  </svg>`,

  'building-maintenance-and-renovations': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#F59E0B"/>
    <rect x="12" y="20" width="40" height="32" fill="white"/>
    <rect x="16" y="12" width="32" height="8" fill="white"/>
    <rect x="20" y="28" width="6" height="8" fill="#F59E0B"/>
    <rect x="30" y="28" width="6" height="8" fill="#F59E0B"/>
    <rect x="40" y="28" width="6" height="8" fill="#F59E0B"/>
    <rect x="20" y="40" width="6" height="8" fill="#F59E0B"/>
    <rect x="30" y="40" width="6" height="8" fill="#F59E0B"/>
    <rect x="40" y="40" width="6" height="8" fill="#F59E0B"/>
  </svg>`,

  'carpentry': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#92400E"/>
    <path d="M20 16l24 8-4 24-24-8z" fill="white"/>
    <rect x="28" y="28" width="8" height="2" fill="#92400E"/>
    <rect x="26" y="32" width="12" height="2" fill="#92400E"/>
    <circle cx="44" cy="20" r="6" fill="#FCD34D"/>
    <path d="M42 18h4v4h-4z" fill="#92400E"/>
  </svg>`,

  // Services
  'cleaning-and-organising': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#06B6D4"/>
    <ellipse cx="32" cy="40" rx="20" ry="12" fill="white"/>
    <rect x="30" y="12" width="4" height="32" fill="white"/>
    <circle cx="32" cy="16" r="8" fill="#F0F9FF"/>
    <path d="M24 16c0-4 4-8 8-8s8 4 8 8" stroke="#06B6D4" stroke-width="2" fill="none"/>
  </svg>`,

  'general-cleaning': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#06B6D4"/>
    <ellipse cx="32" cy="40" rx="20" ry="12" fill="white"/>
    <rect x="30" y="12" width="4" height="32" fill="white"/>
    <circle cx="32" cy="16" r="8" fill="#F0F9FF"/>
    <path d="M24 16c0-4 4-8 8-8s8 4 8 8" stroke="#06B6D4" stroke-width="2" fill="none"/>
  </svg>`,

  // Technology
  'it-support': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#3B82F6"/>
    <rect x="12" y="20" width="40" height="24" rx="2" fill="white"/>
    <rect x="16" y="24" width="32" height="16" fill="#3B82F6"/>
    <rect x="28" y="44" width="8" height="4" fill="white"/>
    <rect x="20" y="48" width="24" height="4" fill="white"/>
    <circle cx="40" cy="28" r="2" fill="white"/>
  </svg>`,

  'it-and-tech': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#3B82F6"/>
    <rect x="12" y="20" width="40" height="24" rx="2" fill="white"/>
    <rect x="16" y="24" width="32" height="16" fill="#3B82F6"/>
    <rect x="28" y="44" width="8" height="4" fill="white"/>
    <rect x="20" y="48" width="24" height="4" fill="white"/>
    <circle cx="40" cy="28" r="2" fill="white"/>
  </svg>`,

  'web-and-app-development': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#8B5CF6"/>
    <rect x="8" y="16" width="48" height="32" rx="4" fill="white"/>
    <rect x="12" y="20" width="40" height="2" fill="#8B5CF6"/>
    <circle cx="16" cy="26" r="2" fill="#EF4444"/>
    <circle cx="22" cy="26" r="2" fill="#F59E0B"/>
    <circle cx="28" cy="26" r="2" fill="#10B981"/>
    <path d="M16 36l8-4-8-4m16 8h12" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  </svg>`,

  // Education & Training
  'education-and-tutoring': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#10B981"/>
    <path d="M32 12l20 8v16l-20 8-20-8V20z" fill="white"/>
    <rect x="28" y="40" width="8" height="12" fill="white"/>
    <circle cx="32" cy="28" r="4" fill="#10B981"/>
    <path d="M24 24l16 0m-16 4l16 0m-16 4l12 0" stroke="#10B981" stroke-width="1"/>
  </svg>`,

  'fitness-trainers': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#EF4444"/>
    <circle cx="32" cy="20" r="6" fill="white"/>
    <rect x="26" y="28" width="12" height="16" fill="white"/>
    <rect x="20" y="36" width="24" height="4" fill="#EF4444"/>
    <circle cx="24" cy="38" r="3" fill="white"/>
    <circle cx="40" cy="38" r="3" fill="white"/>
    <rect x="30" y="44" width="4" height="8" fill="white"/>
  </svg>`,

  // Business
  'business-and-accounting': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#059669"/>
    <rect x="16" y="20" width="32" height="24" rx="2" fill="white"/>
    <rect x="20" y="24" width="24" height="2" fill="#059669"/>
    <rect x="20" y="28" width="24" height="2" fill="#059669"/>
    <rect x="20" y="32" width="16" height="2" fill="#059669"/>
    <rect x="20" y="36" width="20" height="2" fill="#059669"/>
    <circle cx="40" cy="16" r="6" fill="#FCD34D"/>
    <path d="M38 14h4v4h-4z" fill="#059669"/>
  </svg>`,

  // Default icon for categories without specific icons
  'default': `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="#6B7280"/>
    <circle cx="32" cy="32" r="16" fill="white"/>
    <path d="M28 28l8 8m0-8l-8 8" stroke="#6B7280" stroke-width="3"/>
  </svg>`
};

// Function to create SVG file
const createIconFile = (iconName, svgContent) => {
  const filePath = path.join(__dirname, 'public', 'images', 'categories', `${iconName}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created icon: ${iconName}.svg`);
};

// Generate all basic icons
Object.keys(categoryIcons).forEach(iconName => {
  createIconFile(iconName, categoryIcons[iconName]);
});

// Create additional icons using default template with different colors
const additionalCategories = [
  'auto-mechanic-and-electrician', 'removalist', 'electrical', 'event-planning',
  'furniture-repair-and-flatpack-assembly', 'gardening-and-landscaping',
  'handyman-and-handywomen', 'health-and-fitness', 'legal-services',
  'marketing-and-advertising', 'music-and-entertainment', 'pet-care',
  'photography', 'plumbing', 'something-else', 'personal-assistance',
  'tours-and-transport', 'delivery', 'real-estate', 'flooring-solutions',
  'food-services', 'furniture-assembly', 'gardening-services', 'gas-fitting',
  'general-business-and-admin', 'general-handyperson', 'general-plumbing',
  'glass-work', 'graphic-design', 'gutter-and-window-cleaning'
];

const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

additionalCategories.forEach((category, index) => {
  const color = colors[index % colors.length];
  const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="8" fill="${color}"/>
    <circle cx="32" cy="32" r="16" fill="white"/>
    <rect x="28" y="28" width="8" height="8" rx="2" fill="${color}"/>
  </svg>`;
  createIconFile(category, svgContent);
});

console.log('All category icons generated successfully!');

module.exports = { categoryIcons, createIconFile };