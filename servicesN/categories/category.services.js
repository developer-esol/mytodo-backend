const categoryRepository = require("../../repository/category/category.repository");

const processCategoryIcon = (category, req) => {
  const categoryObj = category.toObject();

  // Ensure icon path is complete
  if (categoryObj.icon && !categoryObj.icon.startsWith("http")) {
    // If it's a relative path, make sure it starts with /
    if (!categoryObj.icon.startsWith("/")) {
      categoryObj.icon = "/" + categoryObj.icon;
    }
    // Add full URL for better frontend handling
    categoryObj.iconUrl = `${req.protocol}://${req.get("host")}${
      categoryObj.icon
    }`;
  }

  return categoryObj;
};

const getAllActiveCategories = async (req) => {
  const categories = await categoryRepository.findAllActiveCategories();
  return categories.map((category) => processCategoryIcon(category, req));
};

const getCategoriesByLocationType = async (locationType, req) => {
  // Validate location type
  if (!locationType || !["In-person", "Online"].includes(locationType)) {
    throw new Error('Invalid location type. Must be "In-person" or "Online"');
  }

  // Build filter based on location type
  const filter = { isActive: true };

  if (locationType === "In-person") {
    // Show physical and both categories
    filter.$or = [{ locationType: "physical" }, { locationType: "both" }];
  } else if (locationType === "Online") {
    // Show online and both categories
    filter.$or = [{ locationType: "online" }, { locationType: "both" }];
  }

  const categories = await categoryRepository.findCategoriesByFilter(filter);
  return categories.map((category) => processCategoryIcon(category, req));
};

const createNewCategory = async (categoryData) => {
  const { name, description, icon, order, locationType } = categoryData;

  const newCategory = await categoryRepository.createCategory({
    name,
    description,
    icon,
    order,
    locationType,
  });

  return newCategory;
};

const deleteCategoryById = async (categoryId) => {
  const deletedCategory = await categoryRepository.findByIdAndDelete(
    categoryId
  );

  if (!deletedCategory) {
    throw new Error("Category not found");
  }

  return deletedCategory;
};

module.exports = {
  getAllActiveCategories,
  getCategoriesByLocationType,
  createNewCategory,
  deleteCategoryById,
};
