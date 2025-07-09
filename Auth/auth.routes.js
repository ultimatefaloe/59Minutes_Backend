import express from "express";
import { rateLimiter } from "../utils/rateLimiter.js";
import authService from "./authService.js";
import middleware from "../Middleware/middleware.js";
import upload from "../Middleware/multerCloudinary.js";
import firbaseMiddleware from "../Middleware/firbase-middleware.js";

const authRouter = express.Router();

export const authRoutes = (router) => {
  router.use("/auth", authRouter);

  // User routes
  authRouter.post("/users/signup", async (req, res) => {
    try {
      const userData = { ...req.body, provider: "local" };
      const result = await authService.userSignup(userData, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/users/login", async (req, res) => {
    try {
      const userData = { ...req.body, provider: "local" };
      const result = await authService.userLogin(userData);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post(
    "/users/google/signup",
    firbaseMiddleware,
    async (req, res) => {
      try {
        const userData = {
          ...(req.firebaseUser || req.body),
          provider: "google",
        };
        const result = await authService.userSignup(userData, req.ip);
        res.status(result.code).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  authRouter.post(
    "/users/google/login",
    firbaseMiddleware,
    async (req, res) => {
      try {
        const userData = {
          ...(req.firebaseUser || req.body),
          provider: "google",
        };
        const result = await authService.userLogin(userData);
        res.status(result.code).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  authRouter.patch(
    "/users/forget-password/:id",
    middleware.authRequired(),
    async (req, res) => {
      try {
        const result = await authService.updateUser(
          req.params.id,
          req.user.id,
          req.body
        );
        res.status(result.code).json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  authRouter.delete("/users/delete/:id", async (req, res) => {
    try {
      const result = await authService.deleteUser(req.params.id);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Vendor routes
  authRouter.post("/vendors/signup", rateLimiter, async (req, res) => {
    try {
      const result = await authService.vendorSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/vendors/login", rateLimiter, async (req, res) => {
    try {
      const result = await authService.vendorLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/vendors/reset-token", async (req, res) => {
    try {
      const result = await authService.vendorResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/vendors/forget-password", async (req, res) => {
    try {
      const result = await authService.vendorResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Admin routes
  // Admin routes
  authRouter.post("/admin/signup", async (req, res) => {
    try {
      const result = await authService.adminSignup(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/admin/login", async (req, res) => {
    try {
      const result = await authService.adminLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/admin/forget-password", async (req, res) => {
    try {
      const result = await authService.adminResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/admin/reset-token", async (req, res) => {
    try {
      const result = await authService.adminResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Delivery Agent routes
  authRouter.post(
    "/delivery-agent/signup",
    upload.single("image"),
    async (req, res) => {
      try {
        const result = await authService.deliveryAgentSignup(
          req.body,
          req.file?.path,
          req.ip
        );
        res.status(result.code).json(result);
      } catch (error) {
        console.error("Error in delivery agent signup:", error);
        res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  authRouter.post("/delivery-agent/login", async (req, res) => {
    try {
      const result = await authService.deliveryAgentLogin(req.body, req.ip);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/delivery-agent/forget-password", async (req, res) => {
    try {
      const result = await authService.deliveryAgentResetPassword(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.post("/delivery-agent/reset-token", async (req, res) => {
    try {
      const result = await authService.deliveryAgentResetToken(req.body.email);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Token verification
  authRouter.post("/verify", async (req, res) => {
    try {
      const token = req.headers["authorization"].split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await authService.verifyToken(token);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Profile routes (for all user types)
  authRouter.get("/profile", async (req, res) => {
    try {
      const token = req.headers["authorization"].split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await authService.getProfile(token);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  authRouter.patch("/profile", async (req, res) => {
    try {
      const token = req.headers["authorization"].split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const result = await authService.updateProfile(token, req.body);
      res.status(result.code).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });
};
