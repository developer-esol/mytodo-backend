const express = require("express");
const router = express.Router();
const controller = require("../../../controllers/categories/categories.controller");
const { protect } = require("../../../middleware/authMiddleware");
const validator = require("../../../validators/v1/categories/categories.validator");

// Public routes
router.get("/", controller.getCategories);
router.get("/by-location", controller.getCategoriesByLocationType);

// Protected routes (admin only)
router.post("/", protect, validator.createCategory, controller.createCategory);
router.delete("/:id", protect, controller.deleteCategory);

module.exports = router;
