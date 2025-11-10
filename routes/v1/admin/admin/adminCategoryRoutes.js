const express = require("express");
const router = express.Router();
const categoriesController = require("../../../../controllers/categories/categories.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validator = require("../../../../validators/v1/categories/categories.validator");

// Admin-protected category management routes
router.post(
  "/",
  adminAuth,
  validator.createCategory,
  categoriesController.createCategory
);
router.put(
  "/:id",
  adminAuth,
  validator.updateCategory,
  categoriesController.updateCategory
);
router.delete(
  "/:id",
  adminAuth,
  validator.deleteCategory,
  categoriesController.deleteCategory
);

module.exports = router;
