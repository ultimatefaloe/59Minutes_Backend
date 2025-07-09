// orderService.js
import axios from "axios";
import Order from "../Models/OrderModel.js";

// Paystack configuration
const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY || "sk_test_your_secret_key_here";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Paystack API client
const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export const OrderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      // Validate required fields
      if (!orderData.user || !orderData.items || !orderData.items.length) {
        throw new Error("User and items are required");
      }

      // Calculate totals
      const subTotal = orderData.items.reduce(
        (sum, item) => sum + item.discountPrice * item.quantity,
        0
      );
      const total = subTotal + (orderData.shippingFee || 0); //- (orderData.discount || 0
      if (orderData.totalAmount !== total)
        throw new Error(`Mismatch total amount ${total}`);

      const order = new Order({
        ...orderData,
        subTotal,
        total,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedOrder = await order.save();

      // Populate references
      await savedOrder.populate([
        { path: "user", select: "fullName email phone" },
        {
          path: "items.productId",
          select: "name images discountPrice category",
        },
        { path: "items.vendorId", select: "businessName email phone" },
      ]);

      return savedOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Get user orders with pagination
  getUserOrders: async (userId, options = {}) => {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const query = { user: userId };
      if (status) {
        query.orderStatus = status;
      }

      const orders = await Order.find(query)
        .populate([
          { path: "items.product", select: "name images price category" },
          { path: "items.vendor", select: "businessName" },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },

  // Get specific order
  getOrder: async (orderId, userId = null) => {
    try {
      const query = { _id: orderId };
      if (userId) {
        query.user = userId;
      }

      const order = await Order.findOne(query);
      await order.populate([
        { path: "user", select: "fullName email phone" },
        {
          path: "items.productId",
          select: "name images discountPrice category",
        },
        { path: "items.vendorId", select: "businessName email phone" },
      ]);

      return order;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  // Verify payment with Paystack
  verifyPaymentWithPaystack: async (reference) => {
    try {
      const response = await paystackAPI.get(
        `/transaction/verify/${reference}`
      );

      if (response.data.status === true) {
        return {
          success: true,
          data: response.data.data,
          amount: response.data.data.amount / 100, // Convert from kobo to naira
          status: response.data.data.status,
          reference: response.data.data.reference,
          paidAt: response.data.data.paid_at,
          channel: response.data.data.channel,
          currency: response.data.data.currency,
          customer: response.data.data.customer,
        };
      } else {
        return {
          success: false,
          message: response.data.message || "Payment verification failed",
        };
      }
    } catch (error) {
      console.error("Paystack verification error:", error);

      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || "Payment verification failed",
          statusCode: error.response.status,
        };
      }

      throw new Error("Failed to verify payment with Paystack");
    }
  },

  // Update payment status after verification
  updatePaymentStatus: async (
    orderId,
    paymentReference,
    forceVerify = false
  ) => {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      // Skip verification if already paid and not forced
      if (order.paymentStatus === "paid" && !forceVerify) {
        return {
          order,
          message: "Order already marked as paid",
          alreadyPaid: true,
        };
      }

      // Verify payment with Paystack
      const verification = await OrderService.verifyPaymentWithPaystack(
        paymentReference
      );

      if (!verification.success) {
        // Update order as failed
        order.paymentStatus = "failed";
        order.updatedAt = new Date();
        await order.save();

        return {
          order,
          verification,
          message: "Payment verification failed",
        };
      }

      // Check if payment amount matches order total
      const expectedAmount = order.total;
      const paidAmount = verification.amount;

      if (Math.abs(expectedAmount - paidAmount) > 0.01) {
        // Allow small floating point differences
        order.paymentStatus = "failed";
        order.notes = `Payment amount mismatch. Expected: ₦${expectedAmount}, Paid: ₦${paidAmount}`;
        order.updatedAt = new Date();
        await order.save();

        throw new Error(
          `Payment amount mismatch. Expected: ₦${expectedAmount}, Paid: ₦${paidAmount}`
        );
      }

      // Update order status based on verification
      if (verification.status === "success") {
        order.paymentStatus = "paid";
        order.orderStatus =
          order.orderStatus === "pending" ? "processing" : order.orderStatus;

        // Add payment details to notes
        order.notes =
          (order.notes || "") +
          `\nPayment verified: ${verification.reference} at ${verification.paidAt} via ${verification.channel}`;
      } else {
        order.paymentStatus = "failed";
        order.notes =
          (order.notes || "") + `\nPayment failed: ${verification.reference}`;
      }

      order.updatedAt = new Date();
      const updatedOrder = await order.save();

      // Populate for response
      await updatedOrder.populate([
        { path: "user", select: "name email phone" },
        { path: "items.product", select: "name images price" },
        { path: "items.vendor", select: "businessName" },
      ]);

      return {
        order: updatedOrder,
        verification,
        message:
          verification.status === "success"
            ? "Payment verified successfully"
            : "Payment verification failed",
      };
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  // Standalone payment verification (without updating order)
  verifyPayment: async (orderId, orderData, paymentReference) => {
    try {
      const { street, city, state, country, fullName, email, phone } =
        orderData;

      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      const verification = await OrderService.verifyPaymentWithPaystack(
        paymentReference
      );

      if(!verification.success){
        return{
          success: fasle,
          reference: paymentReference,
          message: 'Invalid Payment'
        }
      }

      await Order.findByIdAndUpdate(orderId, {
        $set: {
          shippingAddress: {
            contactName: fullName,
            contactEmail: email,
            contactPhone: phone,
            street,
            city,
            state,
            country,
          },
          paymentStatus: paymentStatus,
        },
      });

      return {
        orderId,
        reference: paymentReference,
        verification,
        order: {
          id: order._id,
          total: order.total,
          currentPaymentStatus: order.paymentStatus,
          currentOrderStatus: order.orderStatus,
        },
      };
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, updateData) => {
    try {
      const { status, trackingNumber, notes } = updateData;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (status) {
        order.orderStatus = status;
      }

      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }

      if (notes) {
        order.notes = (order.notes || "") + `\n${notes}`;
      }

      order.updatedAt = new Date();

      const updatedOrder = await order.save();

      await updatedOrder.populate([
        { path: "user", select: "name email phone" },
        { path: "items.product", select: "name images price" },
        { path: "items.vendor", select: "businessName" },
      ]);

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, userId, reason) => {
    try {
      const order = await Order.findOne({ _id: orderId, user: userId });

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if order can be cancelled
      if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
        throw new Error(
          `Cannot cancel order with status: ${order.orderStatus}`
        );
      }

      order.orderStatus = "cancelled";
      order.notes =
        (order.notes || "") +
        `\nOrder cancelled by user. Reason: ${reason || "No reason provided"}`;
      order.updatedAt = new Date();

      const cancelledOrder = await order.save();

      await cancelledOrder.populate([
        { path: "items.product", select: "name images price" },
        { path: "items.vendor", select: "businessName" },
      ]);

      return cancelledOrder;
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  },

  // Add tracking update
  addTrackingUpdate: async (orderId, trackingData) => {
    try {
      const { status, location, note } = trackingData;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      order.trackingHistory.push({
        status,
        location,
        note,
        date: new Date(),
      });

      order.updatedAt = new Date();

      const updatedOrder = await order.save();

      await updatedOrder.populate([
        { path: "user", select: "name email phone" },
        { path: "items.product", select: "name images price" },
        { path: "items.vendor", select: "businessName" },
      ]);

      return updatedOrder;
    } catch (error) {
      console.error("Error adding tracking update:", error);
      throw error;
    }
  },

  // Get orders by status (for admin/vendor)
  getOrdersByStatus: async (status, options = {}) => {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const orders = await Order.find({ orderStatus: status })
        .populate([
          { path: "user", select: "name email phone" },
          { path: "items.product", select: "name images price category" },
          { path: "items.vendor", select: "businessName" },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalOrders = await Order.countDocuments({ orderStatus: status });
      const totalPages = Math.ceil(totalOrders / limit);

      return {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      throw error;
    }
  },

  // Delete order (admin only)
  deleteOrder: async (orderId) => {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      // Only allow deletion of cancelled or failed orders
      if (!["cancelled", "failed"].includes(order.orderStatus)) {
        throw new Error("Only cancelled or failed orders can be deleted");
      }

      await Order.findByIdAndDelete(orderId);

      return { message: "Order deleted successfully", orderId };
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};
