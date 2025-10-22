const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true},
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  phone: {type: String, unique: true, sparse: true}, // Optional phone field
  password: {
    type: String, 
    required: function() {
      return !this.googleId; // Password not required for Google OAuth users
    }
  },
  // Enhanced location structure with country, region, and city
  location: {
    country: {
      type: String,
      required: function() {
        return !this.googleId; // Not required for Google OAuth users initially
      },
      enum: ['AU', 'NZ', 'LK']
    },
    countryCode: {
      type: String,
      required: function() {
        return !this.googleId;
      },
      enum: ['AU', 'NZ', 'LK']
    },
    region: {
      type: String,
      required: function() {
        return !this.googleId;
      }
    },
    city: {
      type: String,
      required: function() {
        return !this.googleId;
      }
    }
  },
  // Date of Birth with age validation (18+ required)
  dateOfBirth: {
    type: Date,
    required: function() {
      return !this.googleId; // Not required for Google OAuth users initially
    },
    validate: {
      validator: function(value) {
        if (!value) return true; // Skip validation if not provided (for Google OAuth)
        
        if (!(value instanceof Date) || isNaN(value.getTime())) {
          return false;
        }
        
        // Calculate age
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        // Must be 18+ and reasonable age (not over 120)
        return age >= 18 && age <= 120;
      },
      message: 'User must be at least 18 years old'
    }
  },
  bio: {type: String}, // User biography
  // Enhanced skills structure
  skills: {
    goodAt: [{type: String}],
    transport: [{type: String}],
    languages: [{type: String}],
    qualifications: [{type: String}],
    experience: [{type: String}]
  },
  // Keep legacy skills field for backward compatibility
  legacySkills: [{type: String}], // Array of user skills (legacy)
  avatar: {type: String}, // Profile picture URL
  rating: {type: Number, default: 0, min: 0, max: 5}, // Overall user rating (calculated from reviews)
  completedTasks: {type: Number, default: 0}, // Number of completed tasks
  completionRate: {type: Number, default: 100}, // Task completion rate percentage
  
  // Detailed rating statistics (updated automatically from Review model)
  ratingStats: {
    overall: {
      average: {type: Number, default: 0},
      count: {type: Number, default: 0},
      distribution: {
        type: Object,
        default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    },
    asPoster: {
      average: {type: Number, default: 0},
      count: {type: Number, default: 0}
    },
    asTasker: {
      average: {type: Number, default: 0},
      count: {type: Number, default: 0}
    }
  },
  
  isVerified: {type: Boolean, default: false},
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'poster', 'tasker', 'admin', 'superadmin'],
    default: "user"
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  verification: {
    ratifyId: {
      sessionId: { type: String },
      status: { 
        type: String, 
        enum: ['pending', 'verified', 'failed'], 
        default: null 
      },
      completedAt: { type: Date },
      details: { type: mongoose.Schema.Types.Mixed }
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: {
    virtuals: true, // Include virtual properties
    transform: function(doc, ret, options) {
      // Remove sensitive fields and ratingStats from normal JSON responses
      delete ret.ratingStats;
      delete ret.__v;
      delete ret.dateOfBirth; // Don't expose raw DOB for privacy
      return ret;
    }
  },
  toObject: {
    virtuals: true, // Include virtual properties
    transform: function(doc, ret, options) {
      // Remove ratingStats from normal object responses too
      delete ret.ratingStats;
      delete ret.__v;
      delete ret.dateOfBirth; // Don't expose raw DOB for privacy
      return ret;
    }
  }
});

// Virtual property for current age (calculated from DOB)
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual property for age range (for privacy)
userSchema.virtual('ageRange').get(function() {
  if (!this.dateOfBirth) return null;
  
  const age = this.age;
  if (!age) return null;
  
  if (age < 18) return 'Under 18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
});

// Migration method to convert legacy skills to new structure
userSchema.methods.migrateSkills = function() {
  if (this.legacySkills && this.legacySkills.length > 0 && 
      (!this.skills || Object.keys(this.skills).length === 0)) {
    this.skills = {
      goodAt: this.legacySkills,
      transport: [],
      languages: [],
      qualifications: [],
      experience: []
    };
  }
};

// Password comparison method for admin authentication
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
