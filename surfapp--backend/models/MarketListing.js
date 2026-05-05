const mongoose = require("mongoose");

const marketListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Surf Schools", "Instructors", "Rental Shops", "Boat Tours", "Gear & Equipment", "Other"],
      default: "Other",
    },
    price: {
      type: String,
      required: [true, "Price is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    // Up to 5 photos stored as relative paths (served via /uploads)
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "A listing can have at most 5 photos",
      },
    },
    // Owner - must be a Business account
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
marketListingSchema.index({ title: "text", description: "text", location: "text" });
marketListingSchema.index({ category: 1, isActive: 1 });
marketListingSchema.index({ owner: 1 });

module.exports = mongoose.model("MarketListing", marketListingSchema);
