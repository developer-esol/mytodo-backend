const express = require("express");
const router = express.Router();
const controller = require("../../../controllers/categories/categories.controller");
const validator = require("../../../validators/v1/categories/categories.validator");

// Public routes
router.get("/", controller.getCategories);
router.get(
  "/by-location",
  validator.getByLocation,
  controller.getCategoriesByLocationType
);

module.exports = router;
