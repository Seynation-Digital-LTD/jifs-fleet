const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// hasPerm('vehicles.write') — admins always pass; operators need the perm in their permissions array
const hasPerm = (perm) => (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.user.role === 'admin') return next();
    const perms = req.session.user.permissions || [];
    if (perms.includes(perm)) return next();
    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
};

module.exports = { isAuthenticated, isAdmin, hasPerm };