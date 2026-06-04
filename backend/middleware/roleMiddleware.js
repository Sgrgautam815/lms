
// ==========================================
// ROLE-BASED ACCESS MIDDLEWARE
// ==========================================

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Forbidden. This action requires ${roles.join(" or ")} role.` 
            });
        }

        next();
    };
};

module.exports = authorize;
