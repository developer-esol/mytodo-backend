const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const {auth} = require("../config/firebase-admin");
const {protect} = require("../middleware/authMiddleware");
const multer = require("multer");
const {validateDateOfBirth} = require("../utils/ageValidation");
const router = express.Router();

// Configure multer for avatar upload (in-memory storage)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit to prevent large base64 strings
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper Functions
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Routes

// Firebase Custom Token E

// Signup Route
router.post("/signup", async (req, res) => {
  const {firstName, lastName, email, phone, password, location, dateOfBirth} = req.body;

  try {
    // Validation checks
    if (!email || !password) {
      return res.status(400).json({message: "Email and password are required"});
    }

    // Validate location data
    if (!location || !location.country || !location.region || !location.city) {
      return res.status(400).json({
        message: "Location data is required (country, region, city)"
      });
    }

    // Validate country code
    const validCountries = ['AU', 'NZ', 'LK'];
    if (!validCountries.includes(location.country)) {
      return res.status(400).json({
        message: "Invalid country. Supported countries: AU, NZ, LK"
      });
    }

    // Validate date of birth (18+ required)
    const dobValidation = validateDateOfBirth(dateOfBirth, 18);
    if (!dobValidation.success) {
      return res.status(400).json({
        success: false,
        message: dobValidation.message,
        field: dobValidation.field,
        currentAge: dobValidation.currentAge,
        minimumAge: dobValidation.minimumAge
      });
    }

    // Ensure countryCode matches country if provided
    const locationData = {
      country: location.country,
      countryCode: location.countryCode || location.country,
      region: location.region,
      city: location.city
    };

    // Convert DOB string to Date object
    const dobDate = new Date(dateOfBirth);

    // Check for existing users
    const [existingUser, existingUserByPhone, pendingUser, pendingUserByPhone] = await Promise.all([
      User.findOne({email}),
      phone ? User.findOne({phone}) : null,
      PendingUser.findOne({email}),
      phone ? PendingUser.findOne({phone}) : null,
    ]);

    if (existingUser) {
      return res.status(400).json({message: "Email already in use"});
    }

    if (existingUserByPhone && phone) {
      return res.status(400).json({
        message: "Phone number is already registered with another account"
      });
    }

    // Handle existing pending user
    if (pendingUser) {
      // If it's the same user with same phone, allow them to resend OTP
      if (pendingUser.phone === phone) {
        // Generate new OTP and update existing pending user
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        
        pendingUser.otp = hashedOTP;
        pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        pendingUser.firstName = firstName; // Update details in case they changed
        pendingUser.lastName = lastName;
        pendingUser.password = await bcrypt.hash(password, 10); // Update password if changed
        pendingUser.location = locationData; // Update location data
        pendingUser.dateOfBirth = dobDate; // Update date of birth
        
        await pendingUser.save();

        // Send OTP email
        await transporter.sendMail({
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP is ${otp}. It expires in 10 minutes.`,
          html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });

        return res.status(200).json({
          message: "New OTP sent to email",
          email: pendingUser.email,
        });
      } else {
        // Different phone number, delete old pending user and create new one
        await PendingUser.deleteOne({email});
      }
    }

    // Check if phone is already used by another pending user
    if (pendingUserByPhone && phone && pendingUserByPhone.email !== email) {
      return res.status(400).json({
        message: "Phone number is already being used for another pending registration"
      });
    }

    // If phone is used by same email in pending, remove the old pending user
    if (pendingUserByPhone && pendingUserByPhone.email === email) {
      await PendingUser.deleteOne({phone});
    }

    // Hash password and generate OTP
    const [hashedPassword, otp] = await Promise.all([
      bcrypt.hash(password, 10),
      generateOTP(),
    ]);

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Create pending user
    const newPendingUser = await PendingUser.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      otp: hashedOTP,
      otpExpires,
      location: locationData, // Include location data
      dateOfBirth: dobDate, // Include date of birth
    });

    // Send OTP email
    await transporter.sendMail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    res.status(201).json({
      message: "Signup successful, OTP sent to email",
      email: newPendingUser.email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({message: "Server error", error: error.message});
  }
});

// Login Route
// Updated login route
router.post("/login", async (req, res) => {
  const {email, password} = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({message: "Email and password are required"});
    }

    // Find user
    const user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({message: "Invalid credentials"});
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({message: "Invalid credentials"});
    }

    // Create JWT payload (exclude avatar from JWT to avoid large headers)
    const payload = {
      user: {
        id: user.id,
        _id: user._id, // Add _id for MongoDB
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || "user",
      },
    };

    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"});

    // Generate Firebase token
    let firebaseToken;
    try {
      firebaseToken = await auth.createCustomToken(user._id.toString());
    } catch (firebaseError) {
      console.error("Firebase token generation error:", firebaseError);
      // Continue with JWT even if Firebase fails
    }

    // Response with all required user data including verification status
    res.json({
      token,
      firebaseToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location, // Include location in response
        age: user.age, // Include calculated age (virtual property)
        ageRange: user.ageRange, // Include age range for privacy
        avatar: user.avatar || "",
        role: user.role || "user",
        isVerified: user.isVerified,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({message: "Server error", error: error.message});
  }
});

// Updated firebase-token endpoint
router.get("/firebase-token", async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({error: "Authorization token required"});
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user?.id) {
      return res.status(401).json({error: "Invalid token"});
    }

    // Generate Firebase token
    const customToken = await auth.createCustomToken(
      decoded.user.id.toString()
    );
    res.json({token: customToken});
  } catch (error) {
    console.error("Firebase token error:", error);
    res.status(500).json({error: "Failed to generate Firebase token"});
  }
});

// Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Migrate legacy skills if needed
    user.migrateSkills();
    if (user.isModified()) {
      await user.save();
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        age: user.age, // Include calculated age
        ageRange: user.ageRange, // Include age range for privacy
        bio: user.bio,
        skills: user.skills || {
          goodAt: [],
          transport: [],
          languages: [],
          qualifications: [],
          experience: []
        },
        avatar: user.avatar,
        role: user.role || 'user',
        rating: user.rating || 4.0,
        completedTasks: user.completedTasks || 0,
        createdAt: user.createdAt,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
});

// Update user profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, location, bio, skills } = req.body;
    
    console.log('Profile update request body:', JSON.stringify(req.body, null, 2));
    console.log('Skills received:', JSON.stringify(skills, null, 2));
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;
    
    // Handle skills update - support both structured and legacy formats
    if (skills) {
      console.log('Processing skills, type:', typeof skills, 'isArray:', Array.isArray(skills));
      
      if (typeof skills === 'object' && !Array.isArray(skills)) {
        // New structured format
        updateData.skills = {
          goodAt: Array.isArray(skills.goodAt) ? skills.goodAt : [],
          transport: Array.isArray(skills.transport) ? skills.transport : [],
          languages: Array.isArray(skills.languages) ? skills.languages : [],
          qualifications: Array.isArray(skills.qualifications) ? skills.qualifications : [],
          experience: Array.isArray(skills.experience) ? skills.experience : []
        };
        console.log('Structured skills to save:', JSON.stringify(updateData.skills, null, 2));
      } else if (Array.isArray(skills)) {
        // Legacy format - put all in goodAt
        updateData.skills = {
          goodAt: skills,
          transport: [],
          languages: [],
          qualifications: [],
          experience: []
        };
        updateData.legacySkills = skills; // Keep legacy for compatibility
        console.log('Legacy skills converted to structured:', JSON.stringify(updateData.skills, null, 2));
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        skills: user.skills || {
          goodAt: [],
          transport: [],
          languages: [],
          qualifications: [],
          experience: []
        },
        avatar: user.avatar,
        role: user.role || 'user',
        rating: user.rating || 4.0,
        completedTasks: user.completedTasks || 0,
        createdAt: user.createdAt,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile"
    });
  }
});

// Upload user avatar
router.post("/avatar", protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let avatarUrl;
    
    if (req.file) {
      // Check file size to prevent extremely large base64 strings
      if (req.file.size > 1024 * 1024) { // 1MB limit for base64 storage
        return res.status(400).json({
          success: false,
          message: "File too large. Please choose an image smaller than 1MB."
        });
      }
      
      // For smaller files, create a data URL from the uploaded file
      const base64Image = req.file.buffer.toString('base64');
      avatarUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    } else {
      // Generate a unique avatar URL if no file uploaded
      const colors = ['3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6', '06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`)}&background=${randomColor}&color=fff&size=200`;
    }
    
    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select("-password");

    // Migrate skills if needed
    updatedUser.migrateSkills();
    if (updatedUser.isModified()) {
      await updatedUser.save();
    }

    res.json({
      success: true,
      data: {
        avatar: avatarUrl,
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          bio: updatedUser.bio,
          skills: updatedUser.skills || {
            goodAt: [],
            transport: [],
            languages: [],
            qualifications: [],
            experience: []
          },
          avatar: updatedUser.avatar,
          role: updatedUser.role || 'user',
          rating: updatedUser.rating || 4.0,
          completedTasks: updatedUser.completedTasks || 0,
          createdAt: updatedUser.createdAt,
          isVerified: updatedUser.isVerified
        }
      },
      message: "Avatar uploaded successfully"
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 1MB."
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Server error while uploading avatar"
    });
  }
});

module.exports = router;
