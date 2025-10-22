const fs = require('fs');
const path = require('path');

const allCategories = [
  'Fence Construction', 'Fitness Trainers', 'Flooring Solutions', 'Food Services',
  'Furniture Assembly', 'Gardening Services', 'Gas Fitting', 'General Business & Admin',
  'General Cleaning', 'General Handyperson', 'General Plumbing', 'Glass Work',
  'Graphic Design', 'Gutter & Window Cleaning', 'Hazardous Materials', 'Herbalists',
  'Homestays / Accomodation', 'Hospitality Services', 'Household Equipment Repair & Installations',
  'IT Support', 'Impersonations', 'Insulation Installation', 'Interior Design',
  'Interstate Deliveries', 'Knitting / Needlecraft', 'Labour', 'Letterbox & Flyer Distribution',
  'Locksmiths', 'Market Research', 'Massage Therapy', 'Maternity, Childcare & Babysitting',
  'Mechanic', 'Meditation Teacher', 'Mentoring', 'Mining Activities', 'Mobile Language Lessons',
  'Mobile Tutors', 'Mystery Shopper', 'Other', 'Other IT', 'Packing & Unpacking',
  'Painting', 'Pest Control', 'Pet Services', 'Photo & Video Services', 'Piano Removals',
  'Pick Up & Delivery', 'Picture Framing', 'Pool Cleaning & Maintenance', 'Product Packing',
  'Property Inspection', 'Queue Line Up', 'Removalists', 'Respite Care', 'Roof Tiling',
  'Sales & Telemarketing', 'Security Patrol', 'Sewing / Clothing Repairs', 'Skylight Installation',
  'Social Media Online Support', 'Software Development', 'Sports & Adventure Sports Training',
  'Steel Fabrication', 'Stonemason', 'Stump Grinding & Tree Surgery', 'Stunt Men & Women',
  'Swim Instructors', 'Tanning Salon', 'Tee Shirt Printing', 'Translation', 'Transport Services',
  'Ventilation Installers', 'Wall Plastering', 'Washing & Ironing', 'Waste Disposal Collection',
  'Wedding & Event Planning', 'Welding', 'Appliance Installation and Repair', 'Auto Mechanic and Electrician',
  'Building Maintenance and Renovations', 'Business and Accounting', 'Carpentry', 'Cleaning and Organising',
  'Removalist', 'Education and Tutoring', 'Electrical', 'Event Planning', 'Furniture Repair and Flatpack Assembly',
  'Gardening and Landscaping', 'Handyman and Handywomen', 'Health & Fitness', 'IT & Tech',
  'Legal Services', 'Marketing and Advertising', 'Music and Entertainment', 'Pet Care',
  'Photography', 'Plumbing', 'Something Else', 'Web & App Development', 'Personal Assistance',
  'Tours and Transport', 'Delivery', 'Real Estate'
];

const generateIconPath = (categoryName) => {
  return categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and');
};

const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#059669'];

allCategories.forEach((category, index) => {
  const iconName = generateIconPath(category);
  const filePath = path.join(__dirname, 'public', 'images', 'categories', iconName + '.svg');
  
  if (!fs.existsSync(filePath)) {
    const color = colors[index % colors.length];
    const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="${color}"/>
  <circle cx="32" cy="32" r="16" fill="white"/>
  <rect x="28" y="28" width="8" height="8" rx="2" fill="${color}"/>
</svg>`;
    
    fs.writeFileSync(filePath, svgContent);
    console.log(`Created: ${iconName}.svg`);
  }
});

console.log('All missing category icons created!');