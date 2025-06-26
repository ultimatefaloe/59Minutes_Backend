import { Router } from "express";
import middleware from "../Middleware/middleware.js";
import { rateLimiter } from "../utils/rateLimiter.js";
import vendorService from "../Vendor/vendorService.js";
import { sendEmail } from "../utils/mailer.js";
import emailTemplates from "../utils/emailTemplates.js";
import authService from "./authService.js";

export const authRoutes = (router) => {
  const authRouter = Router();

  router.use("/auth", authRouter);

  authRouter.post(
    "users/signup",
    middleware.authRequired(),
    async (req, res, next) => {
      try {
        console.log("req.user:", req.user);
        console.log("req.body:", req.body);

        const userdata = { ...req.user, ...req.body };

        if (!userdata.displayName) {
          return res.status(400).json({ message: "displayName is required." });
        }

        const response = await authService.create(userdata);

        if (!response) {
          return res
            .status(400)
            .json({ message: "Sign up unsuccessful, try again!" });
        }
        const token = middleware.generateToken(response);

        try {
          const emailStatus = await sendEmail({
            to: vendorData.businessEmail,
            subject: `🔔 Login Alert - ${new Date().toLocaleString()}`,
            html: emailTemplates.signupHTML(
              response.data.displayName,
              new Date().toLocaleString(),
              req.ip
            ),
          });

          if (!emailStatus?.accepted?.length) {
            console.warn("⚠️ Login alert email failed to send:", emailStatus);
          }
        } catch (mailErr) {
          console.error("❌ Error sending login alert email:", mailErr);
        }

        res.status(201).json({
          msg: "User signed up successfully",
          data: response,
          token,
        });
      } catch (e) {
        console.error("Failed to sign up:", e.message);
        res.status(500).json({
          message: e.message || "Internal server error",
        });
      }
    }
  );

  authRouter.get(
    "users/login/:email",
    middleware.authRequired(),
    async (req, res, next) => {
      try {
        const email = req.user.email;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            message: "Invalid email format",
          });
        }
        const response = await authService.getByEmail(email);

        if (!response) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        res.status(200).json({
          message: "Login route successful",
          data: response,
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
          message: error.message || "Internal server error",
        });
      }
    }
  );

  authRouter.patch("users/forget-password/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
      const updateData = req.body;

      const response = await authService.update(id, updateData);

      if (!response) {
        return res.status(400).json({
          message: "Failed to update user details",
        });
      }
      res.status(200).json({
        message: "Update successful",
        data: response,
      });
    } catch (e) {
      console.log("Fail to update user details: ", e.error);
      res.status(500).json({
        message: e.message,
      });
    }
  });

  authRouter.delete("users/delete/:id", async (req, res, next) => {
    try {
      const id = req.params.id;

      const response = await authService.delete(id);

      if (!response) {
        return res.status(400).json({
          message: "user can't be delete, try again!",
        });
      }

      res.status(200).json({
        message: `${id} is deleted successfully`,
      });
    } catch (e) {
      console.log("delete fail:", e.error);
      res.status(500).json({
        message: error.message || "Internal server error",
      });
    }
  });

  // Sign Up vendor
  authRouter.post("vendors/signup", rateLimiter, async (req, res) => {
    try {
      const vendorData = req.body;
      const response = await vendorService.create(vendorData);

      if (!response.success) {
        return res.status(response.code || 400).json({
          success: response.success,
          message: response.error || "Vendor sign up failed",
        });
      }

      if (response.data) {
        response.data.id = response.data._id.toString();
        delete response.data._id;
      }

      const token = Middleware.generateToken(response.data);

      try {
        const emailStatus = await sendEmail({
          to: vendorData.businessEmail,
          subject: `🔔 Login Alert - ${new Date().toLocaleString()}`,
          html: emailTemplates.signupHTML(
            vendorData.businessName,
            new Date().toLocaleString(),
            req.ip
          ),
        });

        if (!emailStatus?.accepted?.length) {
          console.warn("⚠️ Login alert email failed to send:", emailStatus);
        }
      } catch (mailErr) {
        console.error("❌ Error sending login alert email:", mailErr);
      }

      return res.status(response.code || 201).json({
        success: response.success,
        message: "Vendor signed up successfully",
        token,
        data: response.data,
      });
    } catch (e) {
      console.error("Error creating vendor ", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login vendor
  authRouter.post("vendors/login", rateLimiter, async (req, res) => {
    try {
      const response = await vendorService.login(req.body);

      if (!response.success) {
        return res.status(response.code || 401).json({
          success: false,
          message: response.error || "Invalid email or password",
        });
      }

      // Attempt to send login alert email
      try {
        const emailStatus = await sendEmail({
          to: vendor.businessEmail,
          subject: `🔔 Login Alert - ${new Date().toLocaleString()}`,
          html: emailTemplates.loginHTML(
            vendor.businessName,
            new Date().toLocaleString(),
            req.ip // Include IP address
          ),
        });
        if (result) {
          result.id = result._id.toString(); // add `id`
          delete result._id; // remove `_id` if you want
        }

        if (!emailStatus?.ok) {
          console.warn("⚠️ Login alert email failed to send:", emailStatus);
        }
      } catch (mailErr) {
        console.error("Error sending login alert email:", mailErr);
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: response.data.token,
        vendor: response.data.safeVendor,
      });
    } catch (err) {
      console.error("Vendor login error:", err);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  });

  //Verify current user
  authRouter.post("verify", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return res.json({ payload });
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  });
};
