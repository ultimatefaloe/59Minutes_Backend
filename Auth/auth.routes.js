import express from "express";
import { rateLimiter } from "../utils/rateLimiter.js";
import authService from "./authService.js";

const authRouter = express.Router();

export const authRoutes = (router) => {
  router.use("/auth", authRouter);

  // User routes
  authRouter.post("/users/signup", async (req, res) => {
    try {
      const result = await authService.userSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/users/login", async (req, res) => {
    try {
      const result = await authService.userLogin(req.user.email);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/users/forget-password/:id", async (req, res) => {
    try {
      const result = await authService.updateUser(req.params.id, req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.delete("/users/delete/:id", async (req, res) => {
    try {
      const result = await authService.deleteUser(req.params.id);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Vendor routes
  authRouter.post("/vendors/signup", rateLimiter, async (req, res) => {
    try {
      const result = await authService.vendorSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/vendors/login", rateLimiter, async (req, res) => {
    try {
      const result = await authService.vendorLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Admin routes
  authRouter.post("/admin/signup", async (req, res) => {
    try {
      const result = await authService.adminSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/admin/login", async (req, res) => {
    try {
      const result = await authService.adminLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/admin/forget-password", async (req, res) => {
    try {
      const result = await authService.adminResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/admin/reset-token", async (req, res) => {
    try {
      const result = await authService.adminResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Delivery Agent routes
  authRouter.post("/delivery-agent/signup", async (req, res) => {
    try {
      const result = await authService.deliveryAgentSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/delivery-agent/login", async (req, res) => {
    try {
      const result = await authService.deliveryAgentLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/delivery-agent/forget-password", async (req, res) => {
    try {
      const result = await authService.deliveryAgentResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/delivery-agent/reset-token", async (req, res) => {
    try {
      const result = await authService.deliveryAgentResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Vendor password reset routes
  authRouter.post("/vendors/reset-token", async (req, res) => {
    try {
      const result = await authService.vendorResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/vendors/forget-password", async (req, res) => {
    try {
      const result = await authService.vendorResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Token verification
  authRouter.post("/verify", async (req, res) => {
    try {
      const result = await authService.verifyToken(req.headers["authorization"]);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  // Profile routes (for all user types)
  authRouter.get("/profile", async (req, res) => {
    try {
      const result = await authService.getProfile(req.headers["authorization"]);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/profile", async (req, res) => {
    try {
      const result = await authService.updateProfile(req.headers["authorization"], req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  });
};