import User from "../Models/UserModel.js";
import Vendor from "../Models/VendorModel.js";
import Admin from "../Models/AdminModel.js";
import DeliveryAgent from "../Models/DeliveryAgentModel.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import middleware from "../Middleware/middleware.js";
import { sendEmail } from "../utils/mailer.js";
import emailTemplates from "../utils/emailTemplates.js";
import config from "../config/config.js";
// import { auth } from "firebase-admin";

const JWT_SECRET = config.jwt.JWT_PRIVATE_KEY;

const createSafeUserObject = (user, userType) => {
  const baseObject = {
    id: user._id.toString(),
    role: user.role || userType,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  switch (userType) {
    case "user":
      return {
        ...baseObject,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
      };
    case "vendor":
      return {
        ...baseObject,
        businessName: user.businessName,
        businessDescription: user.businessDescription,
        businessPhoneNumber: user.businessPhoneNumber,
        businessEmail: user.businessEmail,
        businessAddress: user.businessAddress,
        verificationStatus: user.verificationStatus,
      };
    case "admin":
      return {
        ...baseObject,
        fullName: user.fullName,
        email: user.email,
        permissions: user.permissions,
        department: user.department,
      };
    case "delivery_agent":
      return {
        ...baseObject,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        vehicleType: user.vehicleType,
        licenseNumber: user.licenseNumber,
        isAvailable: user.isAvailable,
        currentLocation: user.currentLocation,
      };
    default:
      return baseObject;
  }
};

const validatePassword = (password) => {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new Error(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
  }
};

const getUserModel = (userType) => {
  switch (userType) {
    case "customer":
      return User;
    case "vendor":
      return Vendor;
    case "admin":
      return Admin;
    case "delivery_agent":
      return DeliveryAgent;
    default:
      return null;
  }
};

const getEmailField = (userType) => {
  switch (userType) {
    case "vendor":
      return "businessEmail";
    default:
      return "email";
  }
};

const getPasswordField = (userType) => {
  switch (userType) {
    case "vendor":
      return "businessPassword";
    default:
      return "password";
  }
};

const authService = {
  // ======================== USER AUTHENTICATION ========================
  userSignup: async (userData, ip) => {
    try {
      const { email, firebaseUid, provider = "local" } = userData;

      if (!email) {
        return {
          code: 400,
          success: false,
          message: "Email is required",
        };
      }

      // Validate password for local signup
      if (provider === "local" && !userData.password) {
        return {
          code: 400,
          success: false,
          message: "Password is required for local signup",
        };
      }

      // Validate firebaseUid for social signup
      if (provider !== "local" && !firebaseUid) {
        return {
          code: 400,
          success: false,
          message: "Firebase UID is required for social signup",
        };
      }

      const existingUser = await User.findOne({
        $or: [{ email }, ...(firebaseUid ? [{ firebaseUid }] : [])],
      });

      if (existingUser) {
        return {
          code: 409,
          success: false,
          message:
            existingUser.email === email
              ? "User with this email already exists"
              : "User with this social account already exists",
        };
      }

      const userToCreate = {
        fullName: userData.fullName,
        email,
        phone: userData.phone,
        provider,
        firebaseUid,
        password:
          provider === "local"
            ? await bcrypt.hash(userData.password, 12)
            : undefined,
        isEmailVerified: provider !== "local",
        avatar: userData.picture,
      };

      const newUser = new User(userToCreate);
      const savedUser = await newUser.save();

      const safeUser = createSafeUserObject(savedUser, "user");
      const token = middleware.generateUserToken(safeUser);

      // Send welcome email only for local signup
      if (provider === "local") {
        try {
          await sendEmail({
            to: email,
            subject: `Welcome to Our Platform - ${new Date().toLocaleString()}`,
            html: emailTemplates.signupHTML(
              userData.fullName,
              new Date().toLocaleString(),
              ip
            ),
          });
        } catch (mailErr) {
          console.error("❌ Error sending welcome email:", mailErr);
        }
      }

      return {
        code: 201,
        success: true,
        message: "User registered successfully",
        data: safeUser,
        token,
      };
    } catch (error) {
      console.error("User signup error:", error);
      return {
        code: 500,
        success: false,
        message: "Registration failed",
      };
    }
  },

  userLogin: async (data) => {
    try {
      const { email, password, firebaseUid, provider = "local" } = data;

      if (!email) {
        return {
          code: 400,
          success: false,
          message: "Email is required",
        };
      }

      // Social login validation
      if (provider !== "local") {
        if (!firebaseUid) {
          return {
            code: 400,
            success: false,
            message: "Firebase UID is required for social login",
          };
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
          return {
            code: 404,
            success: false,
            message: "User not found. Please sign up first.",
          };
        }

        const token = middleware.generateUserToken(user);
        return {
          code: 200,
          success: true,
          message: "Login successful",
          data: createSafeUserObject(user, "user"),
          token,
        };
      }

      // Local login validation
      if (!password) {
        return {
          code: 400,
          success: false,
          message: "Password is required for local login",
        };
      }

      const user = await User.findOne({ email, provider: "local" }).select(
        "+password"
      );
      if (!user) {
        return {
          code: 404,
          success: false,
          message: "User not found. Please sign up first.",
        };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          code: 401,
          success: false,
          message: "Invalid credentials",
        };
      }

      const safeUser = createSafeUserObject(user, "user");
      const token = middleware.generateUserToken(user);

      return {
        code: 200,
        success: true,
        message: "Login successful",
        data: safeUser,
        token,
      };
    } catch (error) {
      console.error("User login error:", error);
      return {
        code: 500,
        success: false,
        message: "Login failed",
      };
    }
  },

  updateUser: async (userId, tokenId, updateData) => {
    try {
      if (userId !== tokenId) {
        return { code: 403, success: false, message: "Unauthorized" };
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { code: 400, success: false, message: "Invalid user ID" };
      }

      const { password, ...otherData } = updateData;
      let updateFields = { ...otherData };

      if (password) {
        validatePassword(password);
        updateFields.password = await bcrypt.hash(password, 12);
        updateFields.passwordChangedAt = new Date();
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return { code: 404, success: false, message: "User not found" };
      }

      const safeUser = createSafeUserObject(updatedUser, "user");

      return {
        code: 200,
        success: true,
        message: "User updated successfully",
        data: safeUser,
      };
    } catch (error) {
      console.error("Update user error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Update failed",
      };
    }
  },

  deleteUser: async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { code: 400, success: false, message: "Invalid user ID" };
      }

      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return { code: 404, success: false, message: "User not found" };
      }

      return {
        code: 200,
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      console.error("Delete user error:", error);
      return {
        code: 500,
        success: false,
        message: "Delete failed",
      };
    }
  },

  // ======================== VENDOR AUTHENTICATION ========================
  vendorSignup: async (vendorData, ip) => {
    try {
      const {
        businessName,
        businessDescription,
        businessAddress,
        businessPhoneNumber,
        businessEmail,
        businessPassword,
        agreeToTerms,
      } = vendorData;

      if (
        !businessName ||
        !businessDescription ||
        !businessAddress ||
        !businessPhoneNumber ||
        !businessEmail ||
        !businessPassword
      ) {
        return {
          code: 400,
          success: false,
          message: "All business fields are required",
        };
      }

      if (!agreeToTerms) {
        return {
          code: 400,
          success: false,
          message: "You must agree to the terms and conditions",
        };
      }

      validatePassword(businessPassword);

      const existingVendor = await Vendor.findOne({ businessEmail });
      if (existingVendor) {
        return {
          code: 409,
          success: false,
          message: "Vendor already exists with this email",
        };
      }

      const hashedPassword = await bcrypt.hash(businessPassword, 12);
      const newVendor = new Vendor({
        ...vendorData,
        businessPassword: hashedPassword,
        role: "vendor",
        verificationStatus: "pending",
      });

      const savedVendor = await newVendor.save();
      const safeVendor = createSafeUserObject(savedVendor, "vendor");
      const token = middleware.generateVendorToken(safeVendor);

      // Send welcome email
      try {
        await sendEmail({
          to: businessEmail,
          subject: `Welcome to Our Platform - ${new Date().toLocaleString()}`,
          html: emailTemplates.signupHTML(
            businessName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending welcome email:", mailErr);
      }

      return {
        code: 201,
        success: true,
        message: "Vendor registered successfully",
        data: safeVendor,
        token,
      };
    } catch (error) {
      console.error("Vendor signup error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Registration failed",
      };
    }
  },

  vendorLogin: async (loginData, ip) => {
    try {
      const { businessEmail, businessPassword } = loginData;

      if (!businessEmail || !businessPassword) {
        return {
          code: 400,
          success: false,
          message: "Email and password are required",
        };
      }

      const vendor = await Vendor.findOne({ businessEmail }).select(
        "+businessPassword"
      );
      if (!vendor) {
        return { code: 404, success: false, message: "Vendor not found" };
      }

      const isMatch = await bcrypt.compare(
        businessPassword,
        vendor.businessPassword
      );
      if (!isMatch) {
        return { code: 401, success: false, message: "Invalid credentials" };
      }

      const safeVendor = createSafeUserObject(vendor, "vendor");
      const token = middleware.generateVendorToken(safeVendor);

      // Send login notification
      try {
        await sendEmail({
          to: businessEmail,
          subject: `Login Alert - ${new Date().toLocaleString()}`,
          html: emailTemplates.loginHTML(
            vendor.businessName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending login notification:", mailErr);
      }

      return {
        code: 200,
        success: true,
        message: "Login successful",
        data: safeVendor,
        token,
      };
    } catch (error) {
      console.error("Vendor login error:", error);
      return {
        code: 500,
        success: false,
        message: "Login failed",
      };
    }
  },

  vendorResetToken: async (email) => {
    try {
      const vendor = await Vendor.findOne({ businessEmail: email });
      if (!vendor) {
        return { code: 404, success: false, message: "Vendor not found" };
      }

      const rawToken = crypto.randomInt(100000, 999999).toString();
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      vendor.resetToken = hashedToken;
      vendor.resetTokenExpires = tokenExpires;
      await vendor.save();

      const tokenHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your password reset verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #333;">${rawToken}</span>
          </div>
          <p><strong>This code will expire at:</strong> ${tokenExpires.toLocaleString()}</p>
          <p><em>If you didn't request this reset, please ignore this email.</em></p>
        </div>
      `;

      const emailStatus = await sendEmail({
        to: email,
        subject: "Password Reset Verification Code",
        html: tokenHTML,
      });

      if (!emailStatus?.accepted?.length) {
        return {
          code: 400,
          success: false,
          message: "Failed to send verification code",
        };
      }

      return {
        code: 200,
        success: true,
        message: "Reset code sent successfully",
      };
    } catch (error) {
      console.error("Vendor reset token error:", error);
      return {
        code: 500,
        success: false,
        message: "Failed to send reset code",
      };
    }
  },

  vendorResetPassword: async ({ email, newPassword, token }) => {
    try {
      const vendor = await Vendor.findOne({ businessEmail: email });

      if (!vendor) {
        return { code: 404, success: false, message: "Vendor not found" };
      }

      if (vendor.resetBlockedUntil && new Date() < vendor.resetBlockedUntil) {
        return {
          code: 429,
          success: false,
          message: "Too many attempts. Try again later.",
        };
      }

      validatePassword(newPassword);

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      if (
        !vendor.resetToken ||
        vendor.resetToken !== hashedToken ||
        new Date() > vendor.resetTokenExpires
      ) {
        vendor.invalidResetAttempts = (vendor.invalidResetAttempts || 0) + 1;

        if (vendor.invalidResetAttempts >= 5) {
          vendor.resetBlockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        await vendor.save();

        return {
          code: 400,
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      vendor.businessPassword = hashedPassword;
      vendor.resetToken = undefined;
      vendor.resetTokenExpires = undefined;
      vendor.invalidResetAttempts = 0;
      vendor.resetBlockedUntil = undefined;
      vendor.passwordChangedAt = new Date();
      await vendor.save();

      return {
        code: 200,
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Vendor password reset error:", error);
      return {
        code: 500,
        success: false,
        message: error.message || "Password reset failed",
      };
    }
  },

  // ======================== ADMIN AUTHENTICATION ========================
  adminSignup: async (adminData, ip) => {
    try {
      const { fullName, email, password, department, permissions } = adminData;

      if (!fullName || !email || !password || !department) {
        return {
          code: 400,
          success: false,
          message: "Full name, email, password, and department are required",
        };
      }

      validatePassword(password);

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return {
          code: 409,
          success: false,
          message: "Admin already exists with this email",
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newAdmin = new Admin({
        ...adminData,
        password: hashedPassword,
        role: "admin",
        permissions: permissions || ["read"],
      });

      const savedAdmin = await newAdmin.save();
      const safeAdmin = createSafeUserObject(savedAdmin, "admin");
      const token = middleware.generateAdminToken(safeAdmin);

      // Send welcome email
      try {
        await sendEmail({
          to: email,
          subject: `Admin Account Created - ${new Date().toLocaleString()}`,
          html: emailTemplates.signupHTML(
            fullName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending welcome email:", mailErr);
      }

      return {
        code: 201,
        success: true,
        message: "Admin account created successfully",
        data: safeAdmin,
        token,
      };
    } catch (error) {
      console.error("Admin signup error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Admin registration failed",
      };
    }
  },

  adminLogin: async (loginData, ip) => {
    try {
      const { email, password } = loginData;

      if (!email || !password) {
        return {
          code: 400,
          success: false,
          message: "Email and password are required",
        };
      }

      const admin = await Admin.findOne({ email }).select("+password");
      if (!admin) {
        return { code: 404, success: false, message: "Admin not found" };
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return { code: 401, success: false, message: "Invalid credentials" };
      }

      const safeAdmin = createSafeUserObject(admin, "admin");
      const token = middleware.generateAdminToken(safeAdmin);

      // Send login notification
      try {
        await sendEmail({
          to: email,
          subject: `Admin Login Alert - ${new Date().toLocaleString()}`,
          html: emailTemplates.loginHTML(
            admin.fullName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending login notification:", mailErr);
      }

      return {
        code: 200,
        success: true,
        message: "Admin login successful",
        data: safeAdmin,
        token,
      };
    } catch (error) {
      console.error("Admin login error:", error);
      return {
        code: 500,
        success: false,
        message: "Login failed",
      };
    }
  },

  adminResetToken: async (email) => {
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return { code: 404, success: false, message: "Admin not found" };
      }

      const rawToken = crypto.randomInt(100000, 999999).toString();
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      admin.resetToken = hashedToken;
      admin.resetTokenExpires = tokenExpires;
      await admin.save();

      const tokenHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Admin Password Reset Request</h2>
          <p>Your password reset verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #333;">${rawToken}</span>
          </div>
          <p><strong>This code will expire at:</strong> ${tokenExpires.toLocaleString()}</p>
          <p><em>If you didn't request this reset, please contact IT support immediately.</em></p>
        </div>
      `;

      const emailStatus = await sendEmail({
        to: email,
        subject: "Admin Password Reset Verification Code",
        html: tokenHTML,
      });

      if (!emailStatus?.accepted?.length) {
        return {
          code: 400,
          success: false,
          message: "Failed to send verification code",
        };
      }

      return {
        code: 200,
        success: true,
        message: "Reset code sent successfully",
      };
    } catch (error) {
      console.error("Admin reset token error:", error);
      return {
        code: 500,
        success: false,
        message: "Failed to send reset code",
      };
    }
  },

  adminResetPassword: async ({ email, newPassword, token }) => {
    try {
      const admin = await Admin.findOne({ email });

      if (!admin) {
        return { code: 404, success: false, message: "Admin not found" };
      }

      validatePassword(newPassword);

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      if (
        !admin.resetToken ||
        admin.resetToken !== hashedToken ||
        new Date() > admin.resetTokenExpires
      ) {
        return {
          code: 400,
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      admin.password = hashedPassword;
      admin.resetToken = undefined;
      admin.resetTokenExpires = undefined;
      admin.passwordChangedAt = new Date();
      await admin.save();

      return {
        code: 200,
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Admin password reset error:", error);
      return {
        code: 500,
        success: false,
        message: error.message || "Password reset failed",
      };
    }
  },

  // ======================== DELIVERY AGENT AUTHENTICATION ========================
  deliveryAgentSignup: async (agentData, imagePath, ip) => {
    try {
      const { fullName, email, password, phone, vehicleType, licenseNumber } =
        agentData;
      const licenseImage = imagePath;
      console.log("Agent Data:", licenseImage, agentData);

      if (
        !fullName ||
        !email ||
        !password ||
        !phone ||
        !vehicleType || //bicycle', 'motorcycle', 'car', 'van', 'truck
        !licenseNumber
      ) {
        return {
          code: 400,
          success: false,
          message: "All fields are required",
        };
      }

      validatePassword(password);

      const existingAgent = await DeliveryAgent.findOne({ email });
      if (existingAgent) {
        return {
          code: 409,
          success: false,
          message: "Delivery agent already exists with this email",
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newAgent = new DeliveryAgent({
        ...agentData,
        password: hashedPassword,
        licenseImage,
        role: "delivery_agent",
        isAvailable: true,
        verificationStatus: "pending",
      });

      const savedAgent = await newAgent.save();
      const safeAgent = createSafeUserObject(savedAgent, "delivery_agent");
      const token = middleware.generateUserToken(safeAgent);

      // Send welcome email
      try {
        await sendEmail({
          to: email,
          subject: `Delivery Agent Account Created - ${new Date().toLocaleString()}`,
          html: emailTemplates.signupHTML(
            fullName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending welcome email:", mailErr);
      }

      return {
        code: 201,
        success: true,
        message: "Delivery agent registered successfully",
        data: safeAgent,
        token,
      };
    } catch (error) {
      console.error("Delivery agent signup error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Registration failed",
      };
    }
  },

  deliveryAgentLogin: async (loginData, ip) => {
    try {
      const { email, password } = loginData;

      if (!email || !password) {
        return {
          code: 400,
          success: false,
          message: "Email and password are required",
        };
      }

      const agent = await DeliveryAgent.findOne({ email: email });
      if (!agent) {
        return {
          code: 404,
          success: false,
          message: "Delivery agent not found",
        };
      }
      if (!agent.password) {
        return {
          code: 500,
          success: false,
          message: "Corrupted agent record: password hash missing",
        };
      }

      const isMatch = await bcrypt.compare(password, agent.password);

      if (!isMatch) {
        return { code: 401, success: false, message: "Invalid credentials" };
      }

      const safeAgent = createSafeUserObject(agent, "delivery_agent");
      const token = middleware.generateUserToken(safeAgent);

      // Send login notification
      try {
        await sendEmail({
          to: email,
          subject: `Delivery Agent Login Alert - ${new Date().toLocaleString()}`,
          html: emailTemplates.loginHTML(
            agent.fullName,
            new Date().toLocaleString(),
            ip
          ),
        });
      } catch (mailErr) {
        console.error("❌ Error sending login notification:", mailErr);
      }

      return {
        code: 200,
        success: true,
        message: "Login successful",
        data: safeAgent,
        token,
      };
    } catch (error) {
      console.error("Delivery agent login error:", error);
      return {
        code: 500,
        success: false,
        message: "Login failed",
      };
    }
  },

  deliveryAgentResetToken: async (email) => {
    try {
      const agent = await DeliveryAgent.findOne({ email });
      if (!agent) {
        return {
          code: 404,
          success: false,
          message: "Delivery agent not found",
        };
      }

      const rawToken = crypto.randomInt(100000, 999999).toString();
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      agent.resetToken = hashedToken;
      agent.resetTokenExpires = tokenExpires;
      await agent.save();
      console.log(rawToken, tokenExpires);
      const tokenHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your password reset verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center;">
            <span style="font-size: 24px; font-weight: bold; color: #333;">${rawToken}</span>
          </div>
          <p><strong>This code will expire at:</strong> ${tokenExpires.toLocaleString()}</p>
          <p><em>If you didn't request this reset, please ignore this email.</em></p>
        </div>
      `;

      const emailStatus = await sendEmail({
        to: email,
        subject: "Password Reset Verification Code",
        html: tokenHTML,
      });

      if (!emailStatus?.accepted?.length) {
        return {
          code: 400,
          success: false,
          message: "Failed to send verification code",
        };
      }

      return {
        code: 200,
        success: true,
        message: "Reset code sent successfully",
      };
    } catch (error) {
      console.error("Delivery agent reset token error:", error);
      return {
        code: 500,
        success: false,
        message: "Failed to send reset code",
      };
    }
  },

  deliveryAgentResetPassword: async ({ email, newPassword, token }) => {
    try {
      const agent = await DeliveryAgent.findOne({ email });

      if (!agent) {
        return {
          code: 404,
          success: false,
          message: "Delivery agent not found",
        };
      }

      validatePassword(newPassword);

      console.log(agent);
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      if (
        !agent.resetToken ||
        agent.resetToken !== hashedToken ||
        new Date() > agent.resetTokenExpires
      ) {
        return {
          code: 400,
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      agent.password = hashedPassword;
      agent.resetToken = undefined;
      agent.resetTokenExpires = undefined;
      agent.passwordChangedAt = new Date();
      await agent.save();

      return {
        code: 200,
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Delivery agent password reset error:", error);
      return {
        code: 500,
        success: false,
        message: error.message || "Password reset failed",
      };
    }
  },

  // ======================== TOKEN VERIFICATION ========================
  // Helper function to get the appropriate model based on user role

  verifyToken: async (token) => {
    const verifyResponse = (response, decoded) => {
      if (!response) {
        return {
          code: 404,
          success: false,
          message: "User not found in database",
        };
      }

      if (response.isActive === false) {
        return {
          code: 403,
          success: false,
          message: "User account is deactivated",
        };
      }

      // Check if password was changed after token was issued
      if (
        response.passwordChangedAt &&
        decoded.iat < response.passwordChangedAt.getTime() / 1000
      ) {
        return {
          code: 401,
          success: false,
          message: "Token expired due to password change. Please login again.",
        };
      }

      // Create safe user object without sensitive data
      const safeUser = { ...response.toObject() };
      delete safeUser.password;
      delete safeUser.passwordResetToken;
      delete safeUser.passwordResetExpires;

      return {
        code: 200,
        success: true,
        message: "Token is valid",
        data: {
          ...safeUser,
          tokenInfo: {
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
          },
        },
      };
    };
    try {
      // Verify JWT token
      const decoded = await jwt.verify(token, JWT_SECRET);

      // Check token expiration (JWT library handles this, but adding explicit check)
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return {
          code: 401,
          success: false,
          message: "Token has expired",
        };
      }

      // Validate required fields in decoded token
      if (!decoded.role) {
        return {
          code: 400,
          success: false,
          message: "Token missing role information",
        };
      }

      if (!decoded.id) {
        return {
          code: 400,
          success: false,
          message: "Token missing user ID",
        };
      }

      // Normalize role to lowercase for consistency
      const userRole = decoded.role.toLowerCase();

      // Validate role against allowed roles
      const allowedRoles = ["vendor", "delivery", "admin", "customer"];
      if (!allowedRoles.includes(userRole)) {
        return {
          code: 400,
          success: false,
          message: "Invalid user role",
        };
      }

      let userData = null;

      switch (userRole) {
        case "vendor":
          userData = await Vendor.findById(decoded.id);
          break;
        case "delivery":
          userData = await Delivery.findById(decoded.id);
          break;
        case "admin":
          userData = await Admin.findById(decoded.id);
          break;
        case "customer":
          userData = await User.findById(decoded.id);
          break;
        default:
          return {
            code: 400,
            success: false,
            message: "Invalid user role",
          };
      }

      // Verify the response and return appropriate result
      return verifyResponse(userData, decoded);
    } catch (error) {
      console.error("Token verification error:", error);

      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        return {
          code: 401,
          success: false,
          message: "Token has expired",
        };
      } else if (error.name === "JsonWebTokenError") {
        return {
          code: 401,
          success: false,
          message: "Invalid token format",
        };
      } else if (error.name === "NotBeforeError") {
        return {
          code: 401,
          success: false,
          message: "Token not active yet",
        };
      }

      return {
        code: 500,
        success: false,
        message: "Token verification failed",
      };
    }
  },

  // ======================== PROFILE MANAGEMENT ========================
  getProfile: async (token) => {
    try {
      const tokenResult = await authService.verifyToken(token);

      if (!tokenResult.success) {
        return tokenResult;
      }

      const userData = tokenResult.data;
      const userType = userData.role;
      const userId = userData.id;

      // Get the appropriate model based on user type
      const Model = getUserModel(userType);
      if (!Model) {
        return {
          code: 400,
          success: false,
          message: "Invalid user type",
        };
      }

      // Fetch the user profile, excluding sensitive fields
      const userProfile = await Model.findById(userId).select(
        "-password -businessPassword -resetToken -resetTokenExpires"
      );

      if (!userProfile) {
        return {
          code: 404,
          success: false,
          message: "User profile not found",
        };
      }

      // Create a safe user object without sensitive data
      const safeProfile = createSafeUserObject(userProfile, userType);

      return {
        code: 200,
        success: true,
        message: "Profile retrieved successfully",
        data: safeProfile,
      };
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        code: 500,
        success: false,
        message: error.message || "Failed to retrieve profile",
      };
    }
  },

  updateProfile: async (token, updateData) => {
    try {
      const tokenResult = await authService.verifyToken(token);

      if (!tokenResult.success) {
        return tokenResult;
      }

      const userData = tokenResult.data;
      const userType = userData.role;
      const userId = userData.id;

      // Get the appropriate model based on user type
      const Model = getUserModel(userType);
      if (!Model) {
        return {
          code: 400,
          success: false,
          message: "Invalid user type",
        };
      }

      // Handle password update separately if it exists
      const { password, businessPassword, ...profileData } = updateData;
      const updateFields = { ...profileData };

      // Determine the password field based on user type
      const passwordField = getPasswordField(userType);

      if (password || businessPassword) {
        const newPassword = password || businessPassword;
        validatePassword(newPassword);
        updateFields[passwordField] = await bcrypt.hash(newPassword, 12);
        updateFields.passwordChangedAt = new Date();
      }

      // Update the profile
      const updatedProfile = await Model.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("-password -businessPassword -resetToken -resetTokenExpires");

      if (!updatedProfile) {
        return {
          code: 404,
          success: false,
          message: "User profile not found",
        };
      }

      // Create a safe user object without sensitive data
      const safeProfile = createSafeUserObject(updatedProfile, userType);

      return {
        code: 200,
        success: true,
        message: "Profile updated successfully",
        data: safeProfile,
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Failed to update profile",
      };
    }
  },

  changePassword: async (authHeader, { currentPassword, newPassword }) => {
    try {
      const tokenResult = await authService.verifyToken(authHeader);

      if (!tokenResult.success) {
        return tokenResult;
      }

      const userData = tokenResult.data;
      const userType = userData.role;
      const userId = userData.id;

      // Get the appropriate model based on user type
      const Model = getUserModel(userType);
      if (!Model) {
        return {
          code: 400,
          success: false,
          message: "Invalid user type",
        };
      }

      // Determine the password field based on user type
      const passwordField = getPasswordField(userType);

      // Find user with password field
      const user = await Model.findById(userId).select(`+${passwordField}`);
      if (!user) {
        return {
          code: 404,
          success: false,
          message: "User not found",
        };
      }

      // Verify current password
      const isMatch = await bcrypt.compare(
        currentPassword,
        user[passwordField]
      );
      if (!isMatch) {
        return {
          code: 401,
          success: false,
          message: "Current password is incorrect",
        };
      }

      // Validate and update password
      validatePassword(newPassword);
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user[passwordField] = hashedPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      // Return success without sensitive data
      return {
        code: 200,
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        code: 400,
        success: false,
        message: error.message || "Failed to change password",
      };
    }
  },

  deactivateAccount: async (authHeader) => {
    try {
      const tokenResult = await authService.verifyToken(authHeader);

      if (!tokenResult.success) {
        return tokenResult;
      }

      const userData = tokenResult.data;
      const userType = userData.role;
      const userId = userData.id;

      // Get the appropriate model based on user type
      const Model = getUserModel(userType);
      if (!Model) {
        return {
          code: 400,
          success: false,
          message: "Invalid user type",
        };
      }

      // Deactivate the account by setting isActive to false
      const updatedUser = await Model.findByIdAndUpdate(
        userId,
        { isActive: false, deactivatedAt: new Date() },
        { new: true }
      ).select("-password -businessPassword -resetToken -resetTokenExpires");

      if (!updatedUser) {
        return {
          code: 404,
          success: false,
          message: "User not found",
        };
      }

      // Send deactivation notification email
      const emailField = getEmailField(userType);
      const email = updatedUser[emailField];
      const name =
        updatedUser.fullName || updatedUser.businessName || updatedUser.email;

      try {
        await sendEmail({
          to: email,
          subject: "Account Deactivation Confirmation",
          html: emailTemplates.deactivationHTML(
            name,
            new Date().toLocaleString()
          ),
        });
      } catch (emailError) {
        console.error("Failed to send deactivation email:", emailError);
      }

      return {
        code: 200,
        success: true,
        message: "Account deactivated successfully",
      };
    } catch (error) {
      console.error("Deactivate account error:", error);
      return {
        code: 500,
        success: false,
        message: error.message || "Failed to deactivate account",
      };
    }
  },
};

export default authService;
