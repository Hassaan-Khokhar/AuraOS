const jwt = require('jsonwebtoken');

/**
 * Middleware that blocks write operations for demo accounts.
 * Demo users can view everything but cannot mutate data.
 */
const demoGuard = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email === 'demo@admin.com' || decoded.role === 'demo') {
      return res.status(403).json({ 
        error: 'Demo accounts have read-only access. Action simulated successfully.' 
      });
    }

    next();
  } catch (err) {
    // If token is invalid, let the request continue — 
    // the actual auth middleware downstream will handle it.
    next();
  }
};

module.exports = demoGuard;
