/**
 * Admin-Only Middleware
 * 
 * Must be used AFTER the auth middleware (which sets req.user).
 * Checks that the authenticated user has the 'Admin' role.
 * 
 * Usage: router.post('/admin-action', auth, adminOnly, (req, res) => { ... })
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before role check.',
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

module.exports = adminOnly;
