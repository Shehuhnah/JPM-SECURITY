import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Guard from "../models/guard.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try admin users first
      let found = await User.findById(decoded.id).select("-password");
      // If not found, try guards
      if (!found) {
        found = await Guard.findById(decoded.id).select("-password");
      }

      if (!found) {
        return res.status(401).json({ message: "Not authorized - user not found" });
      }

      req.user = found;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};


// Restrict access by role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};