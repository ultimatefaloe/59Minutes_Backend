import User from "../Models/UserModel.js";
import mongoose from "mongoose";

export default {
  create: async (userData) => {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          error: "User already exists",
          code: 409,
        };
      }

      // If no existing user, proceed to create a new one
      const newUser = new User(userData);
      const savedUser = await newUser.save();
      return { success: true, data: savedUser };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error: error.message,
        code: 400,
      };
    }
  },

  // Get user by ID
  get: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid user ID", code: 400 };
      }

      const user = await User.findById(id)
        .select("-password")
        .populate("wishlist", "name price images")
        .populate("cart.items.productId", "name price images");

      if (!user) {
        return { success: false, error: "User not found", code: 404 };
      }

      return { success: true, data: user };
    } catch (error) {
      console.error("Error fetching user:", error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Get user by email (for authentication)
  getByEmail: async (email) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, error: "User not found", code: 404 };
      }
      return { success: true, data: user };
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Update user
  update: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid user ID", code: 400 };
      }

      // Prevent role updates through this endpoint
      if (updateData.role) {
        delete updateData.role;
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!updatedUser) {
        return { success: false, error: "User not found", code: 404 };
      }

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error("Error updating user:", error);
      return { success: false, error: error.message, code: 400 };
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid user ID", code: 400 };
      }

      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return { success: false, error: "User not found", code: 404 };
      }

      return { success: true, data: { message: "User deleted successfully" } };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Create a new vendor
  create: async (vendorData) => {
    try {
      const {
        businessName,
        businessDescription,
        businessPhoneNumber,
        businessEmail,
        businessPassword,
        agreeToTerms,
      } = vendorData;

      if (
        !businessName ||
        !businessDescription ||
        !businessPhoneNumber ||
        !businessEmail ||
        !businessPassword
      ) {
        return {
          success: false,
          error: "Missing required fields",
          code: 400,
        };
      }

      if (!agreeToTerms) {
        return {
          success: false,
          error: "Agree to the terms and condition",
          code: 400,
        };
      }

      const hashedPassword = await bcrypt.hash(businessPassword, 10);
      vendorData.businessPassword = hashedPassword;

      // Check if vendor already exists
      const existingVendor = await Vendor.findOne({ businessEmail });
      if (existingVendor) {
        return {
          success: false,
          error: "Vendor already exists with this email",
          code: 409,
        };
      }

      // Create new vendor
      const newVendor = new Vendor(vendorData);
      const savedVendor = await newVendor.save();

      const safeVendor = {
        id: savedVendor._id.toString(),
        businessName: savedVendor.businessName,
        businessDescription: savedVendor.businessDescription,
        businessPhoneNumber: savedVendor.businessPhoneNumber,
        businessEmail: savedVendor.businessEmail,
        role: savedVendor.role,
        // Add other fields as needed
      };

      return {
        success: true,
        data: safeVendor,
      };
    } catch (error) {
      console.error("Error creating vendor:", error);
      return {
        success: false,
        error: error.message,
        code: error.code === 11000 ? 409 : 400,
      };
    }
  },

  // Login
  login: async (vendorData) => {
    try {
      const { businessEmail, businessPassword } = vendorData;

      if (!businessEmail || !businessPassword) {
        return {
          success: false,
          error: "Missing email or password",
          code: 400,
        };
      }

      // Find vendor by email
      const vendor = await Vendor.findOne({ businessEmail });
      if (!vendor) {
        return {
          success: false,
          error: "Vendor not found",
          code: 404,
        };
      }

      // Check if password matches
      const isMatch = await bcrypt.compare(
        businessPassword,
        vendor.businessPassword
      );
      if (!isMatch) {
        return {
          success: false,
          error: "Invalid credentials",
          code: 401,
        };
      }

      // Generate JWT token
      const token = Middleware.generateToken(vendor);

      const safeVendor = {
        id: vendor._id.toString(),
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        businessPhoneNumber: vendor.businessPhoneNumber,
        businessEmail: vendor.businessEmail,
        role: vendor.role,
        // Add other fields as needed
      };
      return {
        success: true,
        data: { token, safeVendor },
      };
    } catch (error) {
      console.error("Error during login:", error);
      return {
        success: false,
        error: error.message,
        code: 500,
      };
    }
  },

  // Get vendor by ID
  get: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid vendor ID", code: 400 };
      }

      const vendor = await Vendor.findById(id).populate(
        "products",
        "name price images"
      );

      if (!vendor) {
        return { success: false, error: "Vendor not found", code: 404 };
      }
      const safeVendor = {
        id: vendor._id.toString(),
        businessName: vendor.businessName,
        businessDescription: vendor.businessDescription,
        businessPhoneNumber: vendor.businessPhoneNumber,
        businessEmail: vendor.businessEmail,
        products: vendor.products.map((product) => ({
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          images: product.images,
        })),
        // Add other fields as needed
      };

      return { success: true, data: safeVendor };
    } catch (error) {
      console.error("Error fetching vendor:", error);
      return { success: false, error: error.message, code: 500 };
    }
  },

  // Update vendor
  update: async (email, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid vendor ID", code: 400 };
      }

      // Prevent certain fields from being updated
      if (updateData.businessPassword) {
        delete updateData.businessPassword;
      }
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.verificationStatus; // Special permissions needed for this

      const updatedVendor = await Vendor.findByIdAndUpdate(
        { businessEmail: email },
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!updatedVendor) {
        return { success: false, error: "Vendor not found", code: 404 };
      }

      const safeVendors = {
        id: updatedVendor._id.toString(),
        businessName: updatedVendor.businessName,
        businessDescription: updatedVendor.businessDescription,
        businessPhoneNumber: updatedVendor.businessPhoneNumber,
        businessEmail: updatedVendor.businessEmail,
        // Add other fields as needed
      };

      return { success: true, data: safeVendors };
    } catch (error) {
      console.error("Error updating vendor:", error);
      return {
        success: false,
        error: error.message,
        code: error.code === 11000 ? 409 : 400,
      };
    }
  },

  // Password reset token
  resetToken: async (email) => {
    try {
      const vendor = await Vendor.findOne({ businessEmail: email });

      if (!vendor) throw new Error("Vendor not found");

      // const token = crypto.randomBytes(3).toString('hex');
      const rawToken = crypto.randomInt(100000, 999999).toString();
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

      const hashedToken = await crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      vendor.resetToken = hashedToken;
      vendor.resetTokenExpires = tokenExpires;
      await vendor.save();

      const tokenHTML = `
                  <div>>img src='' width='100%' /></div>
                  <div>
                      Your password reset code is: <br/>
                      <span style="color:Yellow;font-size:28px;background-color:black">${rawToken}</span>
                      <p>valid till ${tokenExpires.toLocaleString}</p>
                  </div>
              `;
      try {
        const emailStatus = await sendEmail({
          to: email,
          subject: "Password reset verification code",
          html: tokenHTML,
        });

        if (!emailStatus?.accepted?.length) {
          console.warn("Failed to send verification code: ", emailStatus);
          return {
            code: 400,
            success: false,
            message: "Failed to send verification code",
          };
        }

        return { code: 200, success: true, message: "Token sent successfully" };
      } catch (mailErr) {
        console.error("Error sending verification code", mailErr);
        return {
          code: 500,
          success: false,
          message: "Error sending verification code",
        };
      }
    } catch (error) {
      console.error("internal error:", error);
      return {
        success: false,
        error: error.message,
        code: error.code === 11000 ? 409 : 400,
      };
    }
  },

  //forget password reset
  resetpassword: async (email, newPassword, token) => {
    try {
      validatePassword(newPassword);

      const vendor = await Vendor.findOne({ businessEmail: email });

      if (vendor.resetBlockedUntil && new Date() < vendor.resetBlockedUntil) {
        return {
          code: 400,
          success: false,
          meaasge: "Too many attempts, try again later.",
        };
      }

      if (!vendor)
        return { code: 400, success: false, message: "Email not found" };

      const hashedToken = await crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      if (
        !vendor.resetToken ||
        vendor.resetToken !== hashedToken ||
        new Date() > new Date(vendor.resetTokenExpires)
      ) {
        vendor.invalidResetAttempts = (vendor.invalidResetAttempts || 0) + 1;

        if (vendor.invalidResetAttempts >= 5) {
          vendor.resetBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        return {
          code: 400,
          success: false,
          message: "Invalid or expired code",
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      vendor.businessPassword = hashedPassword;
      vendor.resetToken = undefined;
      vendor.resetTokenExpires = undefined;
      vendor.passwordChangedAt = new Date();
      await vendor.save();

      return {
        code: 200,
        success: true,
        message: "Password has been reset successfully",
      };
    } catch (error) {
      console.error("internal Error:", error);
      return {
        success: false,
        error: error.message,
        code: error.code === 11000 ? 409 : 400,
      };
    }
  },

  // Delete vendor (soft delete)
  delete: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return { success: false, error: "Invalid vendor ID", code: 400 };
      }

      const deletedVendor = await Vendor.findByIdAndUpdate(
        id,
        { status: "inactive" }, // Soft delete
        { new: true }
      );

      if (!deletedVendor) {
        return { success: false, error: "Vendor not found", code: 404 };
      }

      return {
        success: true,
        data: { message: "Vendor deactivated successfully" },
      };
    } catch (error) {
      console.error("Error deleting vendor:", error);
      return { success: false, error: error.message, code: 500 };
    }
  },
};
