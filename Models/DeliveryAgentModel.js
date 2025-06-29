import mongoose from "mongoose";
import bcrypt from "bcrypt";

const DeliveryAgentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address`
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function(v) {
          return /^[0-9]{10,15}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number`
      }
    },
    vehicleType: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: ['bicycle', 'motorcycle', 'car', 'van', 'truck'],
        message: '{VALUE} is not a valid vehicle type'
      }
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true
    },
    licenseImage: {
      type: String,
      required: [true, "License image is required"]
    },
    profileImage: {
      type: String
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    currentLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      address: String
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationNotes: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deactivatedAt: {
      type: Date
    },
    resetToken: {
      type: String,
      // select: false
    },
    resetTokenExpires: {
      type: Date,
      // select: false
    },
    invalidResetAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    resetBlockedUntil: {
      type: Date,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      select: false
    },
    role: {
      type: String,
      default: "delivery_agent",
      immutable: true
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"]
      },
      count: {
        type: Number,
        default: 0
      }
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    earnings: {
      type: Number,
      default: 0,
      min: [0, "Earnings cannot be negative"]
    },
    lastActive: {
      type: Date
    },
    deviceToken: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for geospatial queries
DeliveryAgentSchema.index({ currentLocation: "2dsphere" });

// Index for frequently queried fields
DeliveryAgentSchema.index({ email: 1 });
DeliveryAgentSchema.index({ isAvailable: 1 });
DeliveryAgentSchema.index({ verificationStatus: 1 });

// Method to check if password was changed after token was issued
DeliveryAgentSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Query helper for active agents
DeliveryAgentSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Query helper for available agents
DeliveryAgentSchema.query.available = function() {
  return this.where({ isAvailable: true, isActive: true });
};

// Query helper for verified agents
DeliveryAgentSchema.query.verified = function() {
  return this.where({ verificationStatus: 'verified', isActive: true });
};

const DeliveryAgent = mongoose.model("DeliveryAgent", DeliveryAgentSchema);

export default DeliveryAgent;