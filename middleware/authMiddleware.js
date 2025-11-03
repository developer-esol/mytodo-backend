// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user/User");
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Get user and attach to request
    // Support both token formats: { _id: ... } and { user: { id: ... } }
    const userId = decoded._id || decoded.user?.id || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
      });
    }

    req.user = await User.findById(userId).select("-password");
    console.log("User found:", req.user);

    if (!req.user) {
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

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({
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

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no token provided",
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check token structure
    if (!decoded.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Invalid token structure",
      });
    }

    // 4. Get user from database
    const user = await User.findById(decoded.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 5. Check if user is verified
    if (!user.isVerified) {
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

    next();
  } catch (err) {
    console.error("Authentication error:", err);

    let errorMessage = "Not authorized";
    if (err.name === "TokenExpiredError") {
      errorMessage = "Token expired";
    } else if (err.name === "JsonWebTokenError") {
      errorMessage = "Invalid token";
    }

    res.status(401).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// For Firebase token verification (if needed)
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Firebase token not provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase token verification error:", error);
    res.status(401).json({ error: "Invalid Firebase token" });
  }
};
