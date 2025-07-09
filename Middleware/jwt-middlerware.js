import jwt from 'jsonwebtoken';
import config from "../config/config.js";
import Vendor from '../Models/VendorModel.js';
import User from '../Models/UserModel.js';
import Admin from '../Models/AdminModel.js';
import DeliveryAgent from '../Models/DeliveryAgentModel.js';

const { JWT_PRIVATE_KEY } = config.jwt;

const roleModelMap = {
  VENDOR: Vendor,
  CUSTOMER: User,
  ADMIN: Admin,
  DELIVERY: DeliveryAgent,
};

export function decodeJWTToken() {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_PRIVATE_KEY);

      const role = decoded.role.toUpperCase();
      const userId = decoded.id;

      if (!role || !userId || !roleModelMap[role]) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Invalid role or missing user ID.",
        });
      }

      const Model = roleModelMap[role];
      const foundUser = await Model.findById(userId);

      if (!foundUser) {
        return res.status(401).json({
          success: false,
          message: "Invalid token. User not found.",
        });
      }

      req.user = {
        id: userId,
        role,
        ...decoded,
      };

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
  };
}
