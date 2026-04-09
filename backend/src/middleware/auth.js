/** Middleware to check if the user is authenticated
 * Use this on any route that requires Authentication
 */

const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Aunthentication required" });
  }
  next();
};

/*
Middleware to check if the user is admin or not,
this to be used on the routes where admins are supposed to have access
*/

const isAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

module.exports = { isAuthenticated, isAdmin}