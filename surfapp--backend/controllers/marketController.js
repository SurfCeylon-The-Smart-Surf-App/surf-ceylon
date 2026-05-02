const MarketListing = require("../models/MarketListing");

/**
 * Build public URL for an uploaded file from req
 * e.g. http://192.168.1.6:3000/uploads/images-1234567890.jpg
 */
const buildImageUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/uploads/${filename}`;
};

/**
 * GET /api/market
 * Public - Both Personal and Business users can view all active listings
 */
exports.getAllListings = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await MarketListing.find(query)
      .populate("owner", "name username businessName accountType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MarketListing.countDocuments(query);

    res.json({
      success: true,
      data: listings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get listings error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * GET /api/market/:id
 * Public - Any user can view a single listing
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await MarketListing.findById(req.params.id).populate(
      "owner",
      "name username businessName accountType"
    );

    if (!listing || !listing.isActive) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    res.json({ success: true, data: listing });
  } catch (error) {
    console.error("Get listing error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * POST /api/market
 * Business only - Create a new listing (up to 5 photos via multipart/form-data)
 */
exports.createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      location,
      contactPhone,
      contactEmail,
    } = req.body;

    if (!title || !description || !category || !price || !location) {
      return res.status(400).json({
        success: false,
        error: "Title, description, category, price, and location are required",
      });
    }

    // Build image URL array from uploaded files (multer provides req.files)
    const images = (req.files || []).map((f) => buildImageUrl(req, f.filename));

    if (images.length > 5) {
      return res.status(400).json({ success: false, error: "Maximum 5 photos allowed." });
    }

    const listing = new MarketListing({
      title,
      description,
      category,
      price,
      location,
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      images,
      owner: req.user._id,
      businessName: req.user.businessName || req.user.name,
    });

    await listing.save();
    await listing.populate("owner", "name username businessName accountType");

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * PUT /api/market/:id
 * Business only - Update an existing listing (must be owner)
 * New images replace old ones (or keep old if none sent)
 */
exports.updateListing = async (req, res) => {
  try {
    const listing = await MarketListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only edit your own listings.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "price",
      "location",
      "contactPhone",
      "contactEmail",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    // If new images were uploaded, replace the image set; otherwise keep existing
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({ success: false, error: "Maximum 5 photos allowed." });
      }
      listing.images = req.files.map((f) => buildImageUrl(req, f.filename));
    } else if (req.body.keepImages === "false") {
      // Explicit instruction to clear images
      listing.images = [];
    }

    await listing.save();
    await listing.populate("owner", "name username businessName accountType");

    res.json({ success: true, data: listing });
  } catch (error) {
    console.error("Update listing error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * DELETE /api/market/:id
 * Business only - Delete a listing (must be owner)
 */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await MarketListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, error: "Listing not found" });
    }

    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only delete your own listings.",
      });
    }

    await listing.deleteOne();

    res.json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * GET /api/market/my-listings
 * Business only - Get all listings created by the authenticated business user
 */
exports.getMyListings = async (req, res) => {
  try {
    const listings = await MarketListing.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: listings });
  } catch (error) {
    console.error("Get my listings error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
