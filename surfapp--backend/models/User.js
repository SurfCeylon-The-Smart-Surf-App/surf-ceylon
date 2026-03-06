const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    bio: {
      type: String,
      maxlength: [160, "Bio cannot exceed 160 characters"],
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPhoto: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Surfing profile - integrated from thilina version
    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    // Preferences (can be updated based on session history)
    preferences: {
      minWaveHeight: { type: Number, default: 0.5 }, // meters
      maxWaveHeight: { type: Number, default: 2.0 }, // meters
      preferredWindSpeed: { type: Number, default: 15 }, // km/h
      preferredRegion: { type: String },
      boardType: {
        type: String,
        enum: ["Soft-top", "Longboard", "Funboard", "Shortboard"],
        default: "Soft-top",
      },
      tidePreference: {
        type: String,
        enum: ["Low", "Mid", "High", "Any"],
        default: "Any",
      },
    },

    // Learning preferences from session data
    learnedPreferences: {
      enabled: { type: Boolean, default: true },
      lastUpdated: { type: Date },
      confidence: { type: Number, min: 0, max: 100, default: 0 }, // Confidence in learned preferences
      data: {
        preferredWaveHeight: Number,
        preferredWindSpeed: Number,
        preferredTimeOfDay: Number,
        preferredCrowdLevel: String,
      },
    },

    // AI Surf Tutor Profile
    aiSurfTutor: {
      fitnessLevel: {
        type: String,
        enum: ["Beginner", "Intermediate", "Pro", ""],
        default: "",
      },
      experienceLevel: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert", ""],
        default: "",
      },
      goal: {
        type: String,
        enum: [
          "Warm up only",
          "Improve endurance",
          "Improve explosive pop-up speed",
          "",
        ],
        default: "",
      },
      trainingDuration: {
        type: String,
        enum: ["5-10 minutes", "10-20 minutes", "20+ minutes", ""],
        default: "",
      },
      height: { type: Number }, // in cm
      weight: { type: Number }, // in kg
      age: { type: Number },
      gender: {
        type: String,
        enum: ["Male", "Female", ""],
        default: "",
      },
      equipment: {
        type: String,
        enum: ["None", "Kettlebell", "Gym", ""],
        default: "",
      },
      limitations: { type: String, default: "" },
      bmi: { type: Number },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    },

    // Stats
    stats: {
      totalSessions: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      favoriteSpot: { type: String },
      lastSessionDate: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual("followingCount").get(function () {
  return this.following.length;
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Method to update learned preferences from session data
userSchema.methods.updateLearnedPreferences = async function () {
  if (!this.learnedPreferences.enabled) {
    return;
  }

  const Session = mongoose.model("Session");
  const preferredConditions = await Session.getPreferredConditions(this._id);

  if (preferredConditions && preferredConditions.sampleSize >= 5) {
    this.learnedPreferences.data = {
      preferredWaveHeight: parseFloat(preferredConditions.preferredWaveHeight),
      preferredWindSpeed: parseFloat(preferredConditions.preferredWindSpeed),
    };
    this.learnedPreferences.lastUpdated = new Date();
    this.learnedPreferences.confidence = Math.min(
      100,
      preferredConditions.sampleSize * 10
    );

    await this.save();
  }
};

// Method to get effective preferences (manual or learned)
userSchema.methods.getEffectivePreferences = function () {
  const base = {
    skillLevel: this.skillLevel,
    preferredWaveHeight: this.preferences.preferredWaveHeight,
    preferredWindSpeed: this.preferences.preferredWindSpeed,
    preferredRegion: this.preferences.preferredRegion,
    boardType: this.preferences.boardType,
    tidePreference: this.preferences.tidePreference,
  };

  // Use learned preferences if confidence is high enough and enabled
  if (
    this.learnedPreferences.enabled &&
    this.learnedPreferences.confidence >= 50 &&
    this.learnedPreferences.data
  ) {
    return {
      ...base,
      preferredWaveHeight:
        this.learnedPreferences.data.preferredWaveHeight ||
        base.preferredWaveHeight,
      preferredWindSpeed:
        this.learnedPreferences.data.preferredWindSpeed ||
        base.preferredWindSpeed,
      usingLearnedPreferences: true,
      confidence: this.learnedPreferences.confidence,
    };
  }

  return {
    ...base,
    usingLearnedPreferences: false,
  };
};

// Ensure virtuals are included in JSON output
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
