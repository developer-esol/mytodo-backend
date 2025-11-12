// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user/User");
const logger = require("../config/logger");
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Console log the token every time
    console.log("🔐 Token Received:", token);
    console.log("📍 Request Path:", req.path);
    console.log("🕒 Time:", new Date().toISOString());
    console.log("─".repeat(80));

    if (!token) {
      console.log("❌ No token provided");
      logger.warn("Unauthorized access attempt - no token provided", {
        middleware: "authMiddleware",
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token Verified Successfully");
    console.log("📦 Decoded Token:", JSON.stringify(decoded, null, 2));

    logger.debug("Token verified", {
      middleware: "authMiddleware",
      userId: decoded._id || decoded.user?.id || decoded.id,
    });

    // Get user and attach to request
    // Support both token formats: { _id: ... } and { user: { id: ... } }
    const userId = decoded._id || decoded.user?.id || decoded.id;

    if (!userId) {
      logger.warn("Invalid token format - no user ID found", {
        middleware: "authMiddleware",
        tokenStructure: Object.keys(decoded),
      });
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
      });
    }

    req.user = await User.findById(userId).select("-password");
    console.log("👤 User Found:", {
      userId,
      email: req.user?.email,
      firstName: req.user?.firstName,
      lastName: req.user?.lastName,
      role: req.user?.role,
    });

    logger.debug("User authenticated", {
      middleware: "authMiddleware",
      userId,
      email: req.user?.email,
    });

    if (!req.user) {
      console.log("❌ User not found in database for userId:", userId);
      logger.warn("User not found in database", {
        middleware: "authMiddleware",
        userId,
      });
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Ensure _id is available for controllers that expect it
    if (!req.user._id) {
      req.user._id = req.user.id;
    }

    // Ensure required fields have proper defaults to prevent undefined values
    if (req.user.avatar === undefined) {
      req.user.avatar = null; // Set to null instead of leaving undefined
    }
    if (req.user.firstName === undefined) {
      req.user.firstName = "";
    }
    if (req.user.lastName === undefined) {
      req.user.lastName = "";
    }

    console.log("✅ Authentication Successful - User attached to request");
    console.log("═".repeat(80));

    next();
  } catch (err) {
    console.log("❌ Authentication Error:", err.message);
    console.log("Error Type:", err.name);
    console.log("Stack:", err.stack);

    logger.error("Authentication error", {
      middleware: "authMiddleware",
      error: err.message,
      name: err.name,
      path: req.path,
    });
    return res.status(401).json({
      success: false,
      error: "Not authorized",
    });
  }
};
exports.authenticateUser = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Console log the token
    console.log("🔐 [authenticateUser] Token Received:", token);
    console.log("📍 [authenticateUser] Request Path:", req.path);
    console.log("🕒 [authenticateUser] Time:", new Date().toISOString());
    console.log("─".repeat(80));

    if (!token) {
      console.log("❌ [authenticateUser] No token provided");
      logger.warn("Unauthorized access attempt - no token", {
        middleware: "authMiddleware",
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: "Not authorized, no token provided",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [authenticateUser] Token Verified");
    console.log(
      "📦 [authenticateUser] Decoded:",
      JSON.stringify(decoded, null, 2)
    );

    // 3. Check token structure
    if (!decoded.user?.id) {
      console.log("❌ [authenticateUser] Invalid token structure");
      logger.warn("Invalid token structure in authenticateUser", {
        middleware: "authMiddleware",
        tokenKeys: Object.keys(decoded),
      });
      return res.status(401).json({
        success: false,
        error: "Invalid token structure",
      });
    }

    // 4. Get user from database
    const user = await User.findById(decoded.user.id).select("-password");
    console.log("👤 [authenticateUser] User Found:", {
      userId: decoded.user.id,
      email: user?.email,
      firstName: user?.firstName,
      isVerified: user?.isVerified,
    });

    if (!user) {
      console.log("❌ [authenticateUser] User not found");
      logger.warn("User not found during authentication", {
        middleware: "authMiddleware",
        userId: decoded.user.id,
      });
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 5. Check if user is verified
    if (!user.isVerified) {
      console.log("❌ [authenticateUser] User not verified");
      logger.warn("Unverified user attempting access", {
        middleware: "authMiddleware",
        userId: user._id,
        email: user.email,
      });
      return res.status(403).json({
        success: false,
        error: "Account not verified",
      });
    }

    // 6. Attach user to request
    req.user = {
      id: user._id.toString(),
      _id: user._id, // Include _id for controllers that expect it
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || "",
      role: user.role || "user",
    };

    console.log("✅ [authenticateUser] Authentication Successful");
    console.log("═".repeat(80));

    next();
  } catch (err) {
    console.log("❌ [authenticateUser] Error:", err.message);
    console.log("Error Type:", err.name);

    logger.error("Authentication error in authenticateUser", {
      middleware: "authMiddleware",
      error: err.message,
      name: err.name,
      path: req.path,
    });

    let errorMessage = "Not authorized";
    if (err.name === "TokenExpiredError") {
      errorMessage = "Token expired";
      logger.warn("Expired token used", {
        middleware: "authMiddleware",
        path: req.path,
      });
    } else if (err.name === "JsonWebTokenError") {
      errorMessage = "Invalid token";
      logger.warn("Invalid token format", {
        middleware: "authMiddleware",
        path: req.path,
      });
    }

    return res.status(401).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn("Unauthorized role access attempt", {
        middleware: "authMiddleware",
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    logger.debug("Role authorization successful", {
      middleware: "authMiddleware",
      userId: req.user._id,
      role: req.user.role,
      path: req.path,
    });
    next();
  };
};

// For Firebase token verification (if needed)
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn("Firebase token not provided", {
        middleware: "authMiddleware",
        path: req.path,
      });
      return res.status(401).json({ error: "Firebase token not provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken;
    logger.debug("Firebase token verified", {
      middleware: "authMiddleware",
      uid: decodedToken.uid,
    });
    next();
  } catch (error) {
    logger.error("Firebase token verification error", {
      middleware: "authMiddleware",
      error: error.message,
      path: req.path,
    });
    return res.status(401).json({ error: "Invalid Firebase token" });
  }
};
