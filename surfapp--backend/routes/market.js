const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const { auth, businessAuth } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Multer: accept up to 5 files under the field name "images"
const uploadImages = upload.array("images", 5);

// ==================== PUBLIC ROUTES (any authenticated user) ====================

// GET /api/market           - List all active listings
router.get("/", auth, marketController.getAllListings);

// GET /api/market/my-listings - Business user's own listings (must come before /:id)
router.get("/my-listings", businessAuth, marketController.getMyListings);

// GET /api/market/:id       - View a single listing
router.get("/:id", auth, marketController.getListingById);

// ==================== BUSINESS ONLY ROUTES ====================

// POST /api/market          - Create a listing with up to 5 photos
router.post("/", businessAuth, uploadImages, marketController.createListing);

// PUT /api/market/:id       - Update a listing with up to 5 photos
router.put("/:id", businessAuth, uploadImages, marketController.updateListing);

// DELETE /api/market/:id    - Delete a listing
router.delete("/:id", businessAuth, marketController.deleteListing);

module.exports = router;
