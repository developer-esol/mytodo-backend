const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

// GET all tasks
router.get("/", taskController.getTasks);

// GET single task with offers
router.get("/:id", taskController.getTaskWithOffers);

// GET task with offers
router.get("/:id/offers", taskController.getTaskWithOffers);

// POST create offer for task
router.post("/:id/offers", protect, taskController.createTaskOffer);

// PUT accept offer
router.put("/:taskId/offers/:offerId/accept", protect, taskController.acceptTaskOffer);

module.exports = router;