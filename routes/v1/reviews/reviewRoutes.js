const express = require("express");
const router = express.Router();
const reviewController = require("../../../controllers/reviewController");
const { protect } = require("../../../middleware/authMiddleware");
const validators = require("../../../validators/v1/reviews/review.validator");

router.post(
  "/tasks/:taskId/reviews",
  protect,
  validators.submitReview,
  reviewController.submitReview
);

router.get(
  "/tasks/:taskId/reviews",
  protect,
  validators.getTaskReviews,
  reviewController.getTaskReviews
);

router.get(
  "/tasks/:taskId/can-review",
  protect,
  validators.checkCanReview,
  reviewController.checkCanReview
);

router.put(
  "/reviews/:reviewId",
  protect,
  validators.updateReview,
  reviewController.updateReview
);

router.delete(
  "/reviews/:reviewId",
  protect,
  validators.deleteReview,
  reviewController.deleteReview
);

router.post(
  "/reviews/:reviewId/response",
  protect,
  validators.respondToReview,
  reviewController.respondToReview
);

module.exports = router;
