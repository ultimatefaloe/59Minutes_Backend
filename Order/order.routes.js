// order.routes.js
import { Router } from "express";
import { decodeJWTToken } from "../Middleware/jwt-middlerware.js";
import { OrderService } from "./orderService.js";
import upload from "../Middleware/multerCloudinary.js";

const orderRouter = Router();

export const orderRoutes = (router) => {
  router.use("/orders", orderRouter);

  //upload image
  orderRouter.post("/upload", upload.single("file"), async (req, res) => {
    try {
      console.log(req.file);
      return res.status(200).json({ url: req.file.path }); // Cloudinary URL
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // Create new order
  orderRouter.post(
    "/place-order",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const orderData = {
          ...req.body,
          user: req.user.id
        }

        const order = await OrderService.createOrder(orderData);
        
        res.status(201).json({
          success: true,
          message: "Order created successfully",
          data: order,
        });
      } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to create order",
        });
      }
    }
  );

  // Get user orders
  orderRouter.get(
    "/my-orders",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const userId = req.user.uid;
        const { page = 1, limit = 10, status } = req.query;

        const orders = await OrderService.getUserOrders(userId, {
          page,
          limit,
          status,
        });

        res.status(200).json({
          success: true,
          data: orders,
        });
      } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to fetch orders",
        });
      }
    }
  );

  // Get specific order
  orderRouter.get(
    "/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const userId = req.user.uid;

        const order = await OrderService.getOrder(orderId, userId);

        if (!order) {
          return res.status(404).json({
            success: false,
            message: "Order not found",
          });
        }

        res.status(200).json({
          success: true,
          data: order,
        });
      } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to fetch order",
        });
      }
    }
  );

  // Update payment status (Paystack webhook or manual verification)
  orderRouter.put(
    "/update-payment-status/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const { paymentReference, forceVerify = false } = req.body;

        if (!paymentReference) {
          return res.status(400).json({
            success: false,
            message: "Payment reference is required",
          });
        }

        const result = await OrderService.updatePaymentStatus(
          orderId,
          paymentReference,
          forceVerify
        );

        res.status(200).json({
          success: true,
          message: "Payment status updated successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to update payment status",
        });
      }
    }
  );

  // Verify payment with Paystack
  orderRouter.post(
    "/verify-payment/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const { paymentReference } = req.body;

        if (!paymentReference) {
          return res.status(400).json({
            success: false,
            message: "Payment reference is required",
          });
        }

        const verification = await OrderService.verifyPayment(
          orderId,
          req.body,
          paymentReference
        );

        res.status(200).json({
          success: true,
          message: "Payment verification completed",
          data: verification,
        });
      } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to verify payment",
        });
      }
    }
  );

  // Update order status (for admin/vendor)
  orderRouter.put(
    "/update-status/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const { status, trackingNumber, notes } = req.body;

        const updatedOrder = await OrderService.updateOrderStatus(orderId, {
          status,
          trackingNumber,
          notes,
        });

        res.status(200).json({
          success: true,
          message: "Order status updated successfully",
          data: updatedOrder,
        });
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to update order status",
        });
      }
    }
  );

  // Cancel order
  orderRouter.put(
    "/cancel/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const userId = req.user.uid;
        const { reason } = req.body;

        const cancelledOrder = await OrderService.cancelOrder(
          orderId,
          userId,
          reason
        );

        res.status(200).json({
          success: true,
          message: "Order cancelled successfully",
          data: cancelledOrder,
        });
      } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to cancel order",
        });
      }
    }
  );

  // Add tracking update
  orderRouter.post(
    "/tracking/:orderId",
     decodeJWTToken(),
    async (req, res) => {
      try {
        const { orderId } = req.params;
        const { status, location, note } = req.body;

        const updatedOrder = await OrderService.addTrackingUpdate(orderId, {
          status,
          location,
          note,
        });

        res.status(200).json({
          success: true,
          message: "Tracking update added successfully",
          data: updatedOrder,
        });
      } catch (error) {
        console.error("Error adding tracking update:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Failed to add tracking update",
        });
      }
    }
  );
};
