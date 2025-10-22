const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Function to generate icon path from category name
const generateIconPath = (categoryName) => {
  const iconName = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/&/g, 'and'); // Replace & with 'and'
  return `/images/categories/${iconName}.svg`;
};

const categories = [
  "Fence Construction",
  "Fitness Trainers",
  "Flooring Solutions",
  "Food Services",
  "Furniture Assembly",
  "Gardening Services",
  "Gas Fitting",
  "General Business & Admin",
  "General Cleaning",
  "General Handyperson",
  "General Plumbing",
  "Glass Work",
  "Graphic Design",
  "Gutter & Window Cleaning",
  "Hazardous Materials",
  "Herbalists",
  "Homestays / Accomodation",
  "Hospitality Services",
  "Household Equipment Repair & Installations",
  "IT Support",
  "Impersonations",
  "Insulation Installation",
  "Interior Design",
  "Interstate Deliveries",
  "Knitting / Needlecraft",
  "Labour",
  "Letterbox & Flyer Distribution",
  "Locksmiths",
  "Market Research",
  "Massage Therapy",
  "Maternity, Childcare & Babysitting",
  "Mechanic",
  "Meditation Teacher",
  "Mentoring",
  "Mining Activities",
  "Mobile Language Lessons",
  "Mobile Tutors",
  "Mystery Shopper",
  "Other",
  "Other IT",
  "Packing & Unpacking",
  "Painting",
  "Pest Control",
  "Pet Services",
  "Photo & Video Services",
  "Piano Removals",
  "Pick Up & Delivery",
  "Picture Framing",
  "Pool Cleaning & Maintenance",
  "Product Packing",
  "Property Inspection",
  "Queue Line Up",
  "Removalists",
  "Respite Care",
  "Roof Tiling",
  "Sales & Telemarketing",
  "Security Patrol",
  "Sewing / Clothing Repairs",
  "Skylight Installation",
  "Social Media Online Support",
  "Software Development",
  "Sports & Adventure Sports Training",
  "Steel Fabrication",
  "Stonemason",
  "Stump Grinding & Tree Surgery",
  "Stunt Men & Women",
  "Swim Instructors",
  "Tanning Salon",
  "Tee Shirt Printing",
  "Translation",
  "Transport Services",
  "Ventilation Installers",
  "Wall Plastering",
  "Washing & Ironing",
  "Waste Disposal Collection",
  "Wedding & Event Planning",
  "Welding",
  "Appliance Installation and Repair",
  "Auto Mechanic and Electrician",
  "Building Maintenance and Renovations",
  "Business and Accounting",
  "Carpentry",
  "Cleaning and Organising",
  "Removalist",
  "Education and Tutoring",
  "Electrical",
  "Event Planning",
  "Furniture Repair and Flatpack Assembly",
  "Gardening and Landscaping",
  "Handyman and Handywomen",
  "Health & Fitness",
  "IT & Tech",
  "Legal Services",
  "Marketing and Advertising",
  "Music and Entertainment",
  "Pet Care",
  "Photography",
  "Plumbing",
  "Something Else",
  "Web & App Development",
  "Personal Assistance",
  "Tours and Transport",
  "Delivery",
  "Real Estate"
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create category documents with order
    const categoryDocs = categories.map((name, index) => ({
      name,
      description: `Services related to ${name}`,
      icon: generateIconPath(name),
      order: index + 1,
      isActive: true
    }));

    // Insert categories
    await Category.insertMany(categoryDocs);
    console.log('Categories seeded successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedCategories();
