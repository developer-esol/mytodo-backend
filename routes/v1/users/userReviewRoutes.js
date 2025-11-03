const express = require("express");
const router = express.Router();
const userReviewController = require("../../../controllers/userReviewController");
const { protect } = require("../../../middleware/authMiddleware");
const validators = require("../../../validators/v1/users/userReview.validator");

router.get(
  "/users/:userId/rating-stats",
  validators.getUserRatingStats,
  userReviewController.getUserRatingStats
);

router.get(
  "/users/:userId/reviews",
  validators.getUserReviews,
  userReviewController.getUserReviews
);

router.post(
  "/users/:userId/reviews",
  protect,
  validators.submitUserReview,
  userReviewController.submitUserReview
);

router.get(
  "/users/:userId/can-review",
  protect,
  validators.canReviewUser,
  userReviewController.canReviewUser
);

router.post(
  "/users/request-review",
  protect,
  validators.requestReview,
  userReviewController.requestReview
);

module.exports = router;
