import admin from "../config/firebase-config.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import Vendor from "../Models/VendorModel.js";

const { JWT_PRIVATE_KEY } = config.jwt;
class Middleware {
  decodeFirebaseToken() {
    return async (req, res, next) => {
      req.user = null;
      const authHeader = req.headers?.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        try {
          const decoded = await admin.auth().verifyIdToken(token);
          req.user = decoded;
        } catch (error) {
          console.warn("Token decode failed:", error.message);
          req.user = null;
          return next();
        }
      }

      return next();
    };
  }

  decodeJWTToken() {
    return async (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Access denied. No token provided.",
          });
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, JWT_PRIVATE_KEY);

        console.log("Decoded JWT:", decoded);
        const verifyUser = await Vendor.findById(decoded.id);
        if (!verifyUser) {
          return res
            .status(401)
            .json({
              success: false,
              message: "Invalid token. User not found.",
            });
        }
        if (verifyUser.role !== decoded.role) {
          return res
            .status(403)
            .json({ success: false, message: "Access denied. Role mismatch." });
        }
        req.user = decoded; // Attach decoded data (like userId, role, etc.) to request
        next();
      } catch (err) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token." });
      }
    };
  }

  authRequired() {
    return async (req, res, next) => {
      const authHeader = req.headers?.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization token required",
        });
      }

      const token = authHeader.split(" ")[1];

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
          error: error.message,
        });
      }
    };
  }

  generateAdminToken(data) {
    // Extract id from _id or id
    const id = data.id || data._id;
    const payload = {
      id,
      role: data.role,
      adminName: data.adminName,
      verificationStatus: data.verificationStatus,
      permissions: data.permissions,
      adminPhone: data.adminPhone,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "1d" });
  }

  generateVendorToken(data) {
    // Extract id from _id or id
    const id = data.id || data._id;
    const payload = {
      id,
      role: data.role,
      businessEmail: data.businessEmail,
      verificationStatus: data.verificationStatus,
      businessName: data.businessName,
      businessPhoneNumber: data.businessPhoneNumber,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "1d" });
  }

  generateUserToken(data) {
    // Extract id from _id or id
    const id = data.id || data._id;
    const payload = {
      id,
      role: data.role,
      email: data.email,
      verificationStatus: data.verificationStatus,
      fullNam: data.fullName,
      phone: data.phone,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "1d" });
  }

  isAdmin() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "Access denied. No user found.",
        });
      }
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admins only.",
        });
      }
      next();
    };
  }

  isVendor() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "Access denied. No user found.",
        });
      }

      if (req.user.verificationStatus !== "verified") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Access denied. User is not verified.",
          });
      }

      if (req.user.role !== "vendor" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendors only.",
        });
      }
      next();
    };
  }

  isUser() {
    return (req, res, next) => {
      if (!req.user || req.user.role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Users only.",
        });
      }
      next();
    };
  }
}

export default new Middleware();
