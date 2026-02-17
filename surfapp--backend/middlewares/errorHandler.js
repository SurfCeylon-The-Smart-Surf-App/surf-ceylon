/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

/**
 * Validation Error
 */
class ValidationError extends ApiError {
  constructor(message = "Validation failed", details = null) {
    super(400, message, details);
  }
}

/**
 * Unauthorized Error
 */
class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error("[ErrorHandler] Error occurred:", err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === "USER_EXISTS") {
    statusCode = 409;
    message = "User already exists";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Build error response
  const errorResponse = {
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Route not found" });
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
