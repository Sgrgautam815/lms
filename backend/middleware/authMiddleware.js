const jwt = require("jsonwebtoken");

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
// This function checks if a user has a valid JWT token before letting them access protected routes.
const authMiddleware = (req, res, next) => {
    try {
        // 1. Get the token from the request headers
        const authHeader = req.headers.authorization || req.headers.Authorization;

        console.log("--- AUTH DEBUG ---");
        console.log("Path:", req.path);
        console.log("Auth Header Present:", !!authHeader);

        if (!authHeader) {
            console.error("❌ Access Denied: No token provided in headers.");
            return res.status(401).json({ message: "Access Denied. No token provided." });
        }

        // 2. Format: "Bearer <token>"
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            console.error("❌ Access Denied: Invalid header format. Expected 'Bearer <token>'.");
            return res.status(401).json({ message: "Invalid token format." });
        }

        const token = parts[1];

        // 3. Verify
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log("✅ Token Verified for User:", decoded.name);
        
        // Attach to request
        req.user = decoded;
        next();

    } catch (error) {
        console.error("❌ AUTH ERROR:", error.message);
        res.status(401).json({ message: "Session expired or invalid token. Please login again." });
    }
};

module.exports = authMiddleware;
