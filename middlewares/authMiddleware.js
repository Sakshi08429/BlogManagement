const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).render('login', { error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).render('login', { error: 'Invalid or expired token' });
  }
};

const ensureAuthenticated = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/login');
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) return res.redirect('/login');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      

      next();
    } catch (err) {
      return res.redirect('/login');
    }
  };
};

module.exports = {
  authenticateJWT,
  ensureAuthenticated,
  checkRole
};