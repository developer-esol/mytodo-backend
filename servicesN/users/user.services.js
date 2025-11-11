const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth } = require("../../config/firebase-admin");
const { validateDateOfBirth } = require("../../utils/ageValidation");
const userRepository = require("../../repository/user/user.repository");
const logger = require("../../config/logger");
const emailService = require("../../shared/services/email.service");
// S3 upload helper (no base64 persistence)
const { uploadBuffer } = require("../../utils/imageUpload");

/**
 * User Service - Business Logic Layer
 * Handles authentication, profile management, and user operations
 */
class UserService {
  constructor() {
    this.validCountries = ["AU", "NZ", "LK"];
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, otp) {
    logger.info("Sending OTP email", {
      service: "user.services",
      function: "sendOTPEmail",
      email,
    });

    try {
      await emailService.sendOtpEmail({
        email,
        otp,
        context: {
          service: "user.services",
          function: "sendOTPEmail",
        },
      });

      logger.info("OTP email sent successfully", {
        service: "user.services",
        function: "sendOTPEmail",
        email,
      });
    } catch (error) {
      logger.error("Failed to send OTP email", {
        service: "user.services",
        function: "sendOTPEmail",
        email,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Failed to send OTP email");
    }
  }

  /**
   * Validate signup data
   */
  validateSignupData(data) {
    const { email, password, location, dateOfBirth } = data;

    logger.debug("Validating signup data", {
      service: "user.services",
      function: "validateSignupData",
      email,
    });

    // Email and password check
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Location validation
    if (!location || !location.country || !location.region || !location.city) {
      throw new Error("Location data is required (country, region, city)");
    }

    // Country validation
    if (!this.validCountries.includes(location.country)) {
      throw new Error(
        `Invalid country. Supported countries: ${this.validCountries.join(
          ", "
        )}`
      );
    }

    // Date of birth validation (18+ required)
    const dobValidation = validateDateOfBirth(dateOfBirth, 18);
    if (!dobValidation.success) {
      const error = new Error(dobValidation.message);
      error.field = dobValidation.field;
      error.currentAge = dobValidation.currentAge;
      error.minimumAge = dobValidation.minimumAge;
      throw error;
    }

    logger.debug("Signup data validated successfully", {
      service: "user.services",
      function: "validateSignupData",
      email,
    });
  }

  /**
   * User Signup
   */
  async signup(userData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      location,
      dateOfBirth,
    } = userData;

    logger.info("User signup initiated", {
      service: "user.services",
      function: "signup",
      email,
    });

    try {
      // Validate signup data
      this.validateSignupData(userData);

      // Prepare location data
      const locationData = {
        country: location.country,
        countryCode: location.countryCode || location.country,
        region: location.region,
        city: location.city,
      };

      // Convert DOB string to Date object
      const dobDate = new Date(dateOfBirth);

      // Check for existing users
      const {
        existingUser,
        existingUserByPhone,
        pendingUser,
        pendingUserByPhone,
      } = await userRepository.checkUserExistence(email, phone);

      // Check if email already in use
      if (existingUser) {
        logger.warn("Signup attempt with existing email", {
          service: "user.services",
          function: "signup",
          email,
        });
        throw new Error("Email already in use");
      }

      // Check if phone already in use
      if (existingUserByPhone && phone) {
        logger.warn("Signup attempt with existing phone", {
          service: "user.services",
          function: "signup",
          email,
          phone,
        });
        throw new Error(
          "Phone number is already registered with another account"
        );
      }

      // Handle existing pending user
      if (pendingUser) {
        if (pendingUser.phone === phone) {
          logger.info("Resending OTP to existing pending user", {
            service: "user.services",
            function: "signup",
            email,
          });

          // Generate new OTP and update existing pending user
          const otp = this.generateOTP();
          const hashedOTP = await bcrypt.hash(otp, 10);

          pendingUser.otp = hashedOTP;
          pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
          pendingUser.firstName = firstName;
          pendingUser.lastName = lastName;
          pendingUser.password = await bcrypt.hash(password, 10);
          pendingUser.location = locationData;
          pendingUser.dateOfBirth = dobDate;

          await userRepository.updatePendingUser(pendingUser);
          await this.sendOTPEmail(email, otp);

          logger.info("OTP resent successfully", {
            service: "user.services",
            function: "signup",
            email,
          });

          return {
            message: "New OTP sent to email",
            email: pendingUser.email,
          };
        } else {
          // Different phone number, delete old pending user
          logger.info("Deleting old pending user with different phone", {
            service: "user.services",
            function: "signup",
            email,
          });
          await userRepository.deletePendingByEmail(email);
        }
      }

      // Check if phone is already used by another pending user
      if (pendingUserByPhone && phone && pendingUserByPhone.email !== email) {
        logger.warn(
          "Signup attempt with phone used in another pending registration",
          {
            service: "user.services",
            function: "signup",
            email,
            phone,
          }
        );
        throw new Error(
          "Phone number is already being used for another pending registration"
        );
      }

      // If phone is used by same email in pending, remove the old pending user
      if (pendingUserByPhone && pendingUserByPhone.email === email) {
        logger.info("Removing duplicate pending user by phone", {
          service: "user.services",
          function: "signup",
          email,
        });
        await userRepository.deletePendingByPhone(phone);
      }

      // Hash password and generate OTP
      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = this.generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      logger.debug("Creating new pending user", {
        service: "user.services",
        function: "signup",
        email,
      });

      // Create pending user
      const newPendingUser = await userRepository.createPendingUser({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        otp: hashedOTP,
        otpExpires,
        location: locationData,
        dateOfBirth: dobDate,
      });

      // Send OTP email
      await this.sendOTPEmail(email, otp);

      logger.info("User signup completed successfully", {
        service: "user.services",
        function: "signup",
        email,
      });

      return {
        message: "Signup successful, OTP sent to email",
        email: newPendingUser.email,
      };
    } catch (error) {
      logger.error("Signup error", {
        service: "user.services",
        function: "signup",
        email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * User Login
   */
  async login(credentials) {
    const { email, password } = credentials;

    logger.info("User login initiated - RAW EMAIL RECEIVED", {
      service: "user.services",
      function: "login",
      email,
      emailLength: email?.length || 0,
      emailCharCodes: email
        ? Array.from(email)
            .map((c) => c.charCodeAt(0))
            .join(",")
        : "N/A",
      hasDot: email?.includes(".") || false,
      rawCredentials: JSON.stringify(credentials),
    });

    try {
      // Input validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Find user
      logger.debug("Searching for user with email", {
        service: "user.services",
        function: "login",
        searchEmail: email,
        emailHasDot: email.includes("."),
      });

      const user = await userRepository.findByEmail(email);
      if (!user) {
        logger.warn("Login attempt with non-existent email", {
          service: "user.services",
          function: "login",
          email,
        });
        throw new Error("Invalid credentials");
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn("Login attempt with incorrect password", {
          service: "user.services",
          function: "login",
          email,
        });
        throw new Error("Invalid credentials");
      }

      logger.debug("Password verified, generating tokens", {
        service: "user.services",
        function: "login",
        userId: user._id,
      });

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || "user",
        },
      };

      // Generate JWT token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Generate Firebase token
      let firebaseToken;
      try {
        firebaseToken = await auth.createCustomToken(user._id.toString());
        logger.debug("Firebase token generated successfully", {
          service: "user.services",
          function: "login",
          userId: user._id,
        });
      } catch (firebaseError) {
        logger.error("Firebase token generation error", {
          service: "user.services",
          function: "login",
          userId: user._id,
          error: firebaseError.message,
          stack: firebaseError.stack,
        });
        // Continue with JWT even if Firebase fails
      }

      logger.info("User login successful", {
        service: "user.services",
        function: "login",
        userId: user._id,
        email: user.email,
      });

      return {
        token,
        firebaseToken,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          location: user.location,
          age: user.age,
          ageRange: user.ageRange,
          avatar: user.avatar || "",
          role: user.role || "user",
          isVerified: user.isVerified,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
      };
    } catch (error) {
      logger.error("Login error", {
        service: "user.services",
        function: "login",
        email,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Generate Firebase custom token from JWT
   */
  async generateFirebaseToken(jwtToken) {
    logger.info("Generating Firebase token from JWT", {
      service: "user.services",
      function: "generateFirebaseToken",
    });

    try {
      // Verify JWT token
      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
      if (!decoded.user?.id) {
        logger.warn("Invalid JWT token for Firebase token generation", {
          service: "user.services",
          function: "generateFirebaseToken",
        });
        throw new Error("Invalid token");
      }

      logger.debug("JWT verified, creating Firebase custom token", {
        service: "user.services",
        function: "generateFirebaseToken",
        userId: decoded.user.id,
      });

      // Generate Firebase token
      const customToken = await auth.createCustomToken(
        decoded.user.id.toString()
      );

      logger.info("Firebase token generated successfully", {
        service: "user.services",
        function: "generateFirebaseToken",
        userId: decoded.user.id,
      });

      return { token: customToken };
    } catch (error) {
      logger.error("Firebase token generation error", {
        service: "user.services",
        function: "generateFirebaseToken",
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    logger.info("Fetching user profile", {
      service: "user.services",
      function: "getProfile",
      userId,
    });

    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        logger.warn("Profile fetch attempted for non-existent user", {
          service: "user.services",
          function: "getProfile",
          userId,
        });
        throw new Error("User not found");
      }

      // Migrate legacy skills if needed
      user.migrateSkills();
      if (user.isModified()) {
        await user.save();
        logger.debug("Legacy skills migrated", {
          service: "user.services",
          function: "getProfile",
          userId,
        });
      }

      logger.info("Profile fetched successfully", {
        service: "user.services",
        function: "getProfile",
        userId,
      });

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        age: user.age,
        ageRange: user.ageRange,
        bio: user.bio,
        skills: user.skills || {
          goodAt: [],
          transport: [],
          languages: [],
          qualifications: [],
          experience: [],
        },
        avatar: user.avatar,
        role: user.role || "user",
        rating: user.rating || 4.0,
        completedTasks: user.completedTasks || 0,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
      };
    } catch (error) {
      logger.error("Profile fetch error", {
        service: "user.services",
        function: "getProfile",
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const { firstName, lastName, phone, location, bio, skills } = profileData;

    logger.info("Updating user profile", {
      service: "user.services",
      function: "updateProfile",
      userId,
      hasSkills: !!skills,
    });

    try {
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone) updateData.phone = phone;
      if (location) updateData.location = location;
      if (bio) updateData.bio = bio;

      // Handle skills update - support both structured and legacy formats
      if (skills) {
        logger.debug("Processing skills update", {
          service: "user.services",
          function: "updateProfile",
          userId,
          skillsType: typeof skills,
          isArray: Array.isArray(skills),
        });

        if (typeof skills === "object" && !Array.isArray(skills)) {
          // New structured format
          updateData.skills = {
            goodAt: Array.isArray(skills.goodAt) ? skills.goodAt : [],
            transport: Array.isArray(skills.transport) ? skills.transport : [],
            languages: Array.isArray(skills.languages) ? skills.languages : [],
            qualifications: Array.isArray(skills.qualifications)
              ? skills.qualifications
              : [],
            experience: Array.isArray(skills.experience)
              ? skills.experience
              : [],
          };
          logger.debug("Structured skills format", {
            service: "user.services",
            function: "updateProfile",
            userId,
            skillsCount: {
              goodAt: updateData.skills.goodAt.length,
              transport: updateData.skills.transport.length,
              languages: updateData.skills.languages.length,
            },
          });
        } else if (Array.isArray(skills)) {
          // Legacy format - put all in goodAt
          updateData.skills = {
            goodAt: skills,
            transport: [],
            languages: [],
            qualifications: [],
            experience: [],
          };
          updateData.legacySkills = skills; // Keep legacy for compatibility
          logger.debug("Legacy skills converted to structured format", {
            service: "user.services",
            function: "updateProfile",
            userId,
            skillsCount: skills.length,
          });
        }
      }

      const user = await userRepository.updateUser(userId, updateData);

      if (!user) {
        logger.warn("Profile update attempted for non-existent user", {
          service: "user.services",
          function: "updateProfile",
          userId,
        });
        throw new Error("User not found");
      }

      logger.info("Profile updated successfully", {
        service: "user.services",
        function: "updateProfile",
        userId,
        updatedFields: Object.keys(updateData),
      });

      return {
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
          experience: [],
        },
        avatar: user.avatar,
        role: user.role || "user",
        rating: user.rating || 4.0,
        completedTasks: user.completedTasks || 0,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
      };
    } catch (error) {
      logger.error("Profile update error", {
        service: "user.services",
        function: "updateProfile",
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId, file) {
    logger.info("Uploading user avatar", {
      service: "user.services",
      function: "uploadAvatar",
      userId,
      hasFile: !!file,
    });

    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        logger.warn("Avatar upload attempted for non-existent user", {
          service: "user.services",
          function: "uploadAvatar",
          userId,
        });
        throw new Error("User not found");
      }

      let avatarUrl;

      if (file) {
        // Enforce size limit (5MB) before uploading to S3
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          logger.warn("Avatar file too large", {
            service: "user.services",
            function: "uploadAvatar",
            userId,
            fileSize: file.size,
            maxAllowed: MAX_SIZE,
          });
          throw new Error(
            "File too large. Please choose an image smaller than 5MB."
          );
        }

        try {
          avatarUrl = await uploadBuffer(file.buffer, file.mimetype, "avatars");
          logger.debug("Avatar uploaded to S3", {
            service: "user.services",
            function: "uploadAvatar",
            userId,
            mimeType: file.mimetype,
            s3Url: avatarUrl,
          });
        } catch (uploadErr) {
          logger.error("Failed uploading avatar to S3", {
            service: "user.services",
            function: "uploadAvatar",
            userId,
            error: uploadErr.message,
          });
          throw new Error("Failed to upload avatar");
        }
      } else {
        // Generate a unique avatar URL if no file uploaded
        const colors = [
          "3b82f6",
          "10b981",
          "f59e0b",
          "ef4444",
          "8b5cf6",
          "06b6d4",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${user.firstName} ${user.lastName}`
        )}&background=${randomColor}&color=fff&size=200`;
        logger.debug("Generated avatar URL", {
          service: "user.services",
          function: "uploadAvatar",
          userId,
        });
      }

      // Update user's avatar
      const updatedUser = await userRepository.updateAvatar(userId, avatarUrl);

      // Migrate skills if needed
      updatedUser.migrateSkills();
      if (updatedUser.isModified()) {
        await updatedUser.save();
      }

      logger.info("Avatar uploaded successfully", {
        service: "user.services",
        function: "uploadAvatar",
        userId,
      });

      return {
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
            experience: [],
          },
          avatar: updatedUser.avatar,
          role: updatedUser.role || "user",
          rating: updatedUser.rating || 4.0,
          completedTasks: updatedUser.completedTasks || 0,
          createdAt: updatedUser.createdAt,
          isVerified: updatedUser.isVerified,
        },
      };
    } catch (error) {
      logger.error("Avatar upload error", {
        service: "user.services",
        function: "uploadAvatar",
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new UserService();
