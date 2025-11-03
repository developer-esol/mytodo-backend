const express = require("express");
const router = express.Router();
const { adminAuth } = require("../../../../middleware/adminAuthSimple");

// Get available roles and statuses for dropdowns
// Note: This endpoint is intentionally public (no adminAuth middleware)
// because it provides static metadata needed for the admin UI dropdowns
// The actual user/task operations are still protected
router.get("/metadata", async (req, res) => {
  try {
    res.json({
      status: "success",
      data: {
        roles: [
          { value: "", label: "All Roles" },
          { value: "user", label: "User" },
          { value: "poster", label: "Poster" },
          { value: "tasker", label: "Tasker" },
          { value: "admin", label: "Admin" },
          { value: "superadmin", label: "Super Admin" },
        ],
        statuses: [
          { value: "", label: "All Statuses" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ],
      },
    });
  } catch (error) {
    console.error("Get metadata error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch metadata",
    });
  }
});

// Simple test route
router.get("/test", (req, res) => {
  res.json({
    status: "success",
    message: "Admin routes are working!",
    timestamp: new Date(),
  });
});

module.exports = router;
