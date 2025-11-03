const Category = require("../../models/category/Category");

const findAllActiveCategories = async () => {
  return await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .select("name description icon locationType");
};

const findCategoriesByFilter = async (filter) => {
  return await Category.find(filter)
    .sort({ order: 1, name: 1 })
    .select("name description icon locationType");
};

const createCategory = async (categoryData) => {
  return await Category.create(categoryData);
};

const findByIdAndUpdate = async (categoryId, updateData) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );
};

const findByIdAndDelete = async (categoryId) => {
  return await Category.findByIdAndDelete(categoryId);
};

module.exports = {
  findAllActiveCategories,
  findCategoriesByFilter,
  createCategory,
  findByIdAndUpdate,
  findByIdAndDelete,
};
