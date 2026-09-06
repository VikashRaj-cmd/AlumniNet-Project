const { AppError } = require('./errorMiddleware');

// Role-based authorization middleware
// Usage: authorize('admin', 'alumni') — only these roles can access the route
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

// Shortcut middlewares for common role checks
const adminOnly = authorize('admin');
const alumniOnly = authorize('alumni');
const studentOnly = authorize('student');
const alumniOrAdmin = authorize('alumni', 'admin');
const authenticatedUsers = authorize('student', 'alumni', 'admin');

module.exports = {
  authorize,
  adminOnly,
  alumniOnly,
  studentOnly,
  alumniOrAdmin,
  authenticatedUsers,
};
