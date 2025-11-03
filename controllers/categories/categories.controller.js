const categoryService = require("../../servicesN/categories/category.services");
const logger = require("../../config/logger");

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllActiveCategories(req);

    logger.info("Categories fetched successfully", {
      controller: "categories.controller",
      count: categories.length,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Error fetching categories:", {
      controller: "categories.controller",
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

exports.getCategoriesByLocationType = async (req, res) => {
  try {
    const { type } = req.query;

    const categories = await categoryService.getCategoriesByLocationType(
      type,
      req
    );

    logger.info("Categories fetched by location type", {
      controller: "categories.controller",
      locationType: type,
      count: categories.length,
    });

    return res.status(200).json({
      success: true,
      data: categories,
      locationType: type,
    });
  } catch (error) {
    logger.error("Error fetching categories by location type:", {
      controller: "categories.controller",
      error: error.message,
      stack: error.stack,
    });

    const statusCode = error.message.includes("Invalid location type")
      ? 400
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error fetching categories by location type",
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    const category = await categoryService.createNewCategory(categoryData);

    logger.info("Category created successfully", {
      controller: "categories.controller",
      categoryId: category._id,
      name: category.name,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error("Error creating category:", {
      controller: "categories.controller",
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await categoryService.deleteCategoryById(id);

    logger.info("Category deleted successfully", {
      controller: "categories.controller",
      categoryId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting category:", {
      controller: "categories.controller",
      error: error.message,
      stack: error.stack,
    });

    const statusCode = error.message === "Category not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error deleting category",
    });
  }
};
