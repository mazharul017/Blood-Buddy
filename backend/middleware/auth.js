import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Expected format: "Bearer token"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ message: "Server error: JWT_SECRET missing" });
    }

    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();

  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};
