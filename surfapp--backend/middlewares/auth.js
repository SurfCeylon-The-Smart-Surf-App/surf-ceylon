const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authenticate any logged-in user (Personal or Business)
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Token is not valid.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Token is not valid.",
    });
  }
};

/**
 * Restrict to admin users only
 */
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Access denied. Admin privileges required.",
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

/**
 * Restrict to Business account type only
 * Used for market listing CRUD operations
 */
const businessAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.accountType !== "Business") {
        return res.status(403).json({
          status: "error",
          message: "Access denied. Business account required to manage listings.",
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = { auth, adminAuth, businessAuth };
