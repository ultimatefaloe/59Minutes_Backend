import express from "express";
import productService from "./productService.js";
import Vendor from "../Models/VendorModel.js";
import Category from "../Models/CategoryModel.js";
import mongoose from "mongoose";
import { resolveCategoryId } from "../utils/resolveCategoryId.js";
import middleware from "../Middleware/middleware.js";
import upload from "../Middleware/multerCloudinary.js";

const productRouter = express.Router();

export const productRoutes = (router) => {
  router.use("/products", productRouter);

  // Create Product
  productRouter.post(
    "/add-product/:vendorid",
    middleware.jwtDecodeToken(),
    middleware.isVendor(),
    upload.array("images", 5), // Accept multiple images
    async (req, res) => {
      const vendorId = req.params.vendorid;
      const productData = {
        ...req.body,
        vendor: vendorId,
        images: req.files.path,
      };

      try {
        // Check vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: "Vendor not found",
          });
        }

        // Convert category name to ID if necessary
        if (
          typeof productData.category === "string" &&
          !mongoose.Types.ObjectId.isValid(productData.category)
        ) {
          const categoryDoc = await resolveCategoryId(productData.category);
          if (!categoryDoc) {
            return res.status(400).json({
              success: false,
              message: `Category '${productData.category}' not found`,
            });
          }
          productData.category = categoryDoc._id;
        }

        // Attach uploaded images
        if (req.files && req.files.length > 0) {
          productData.images = req.files.map((file) => file.path);
        }

        // Create product
        const response = await productService.create(productData);
        if (!response.success) {
          return res.status(response.code || 400).json({
            success: false,
            message: response.error || "Failed to add product",
          });
        }

        const newProduct = response.data;

        // Add to vendor's products
        await Vendor.findByIdAndUpdate(
          vendorId,
          { $push: { products: newProduct._id } },
          { new: true }
        );

        return res.status(201).json({
          success: true,
          message: "Product added successfully",
          data: newProduct,
        });
      } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // Get Product by ID
  productRouter.get("/:id", async (req, res) => {
    try {
      const response = await productService.getById(req.params.id);

      if (!response.success) {
        return res.status(response.code || 404).json({
          success: false,
          message: response.error || "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        data: response.data,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Update Product
  productRouter.patch(
    "/edit/:id",
    middleware.jwtDecodeToken(),
    middleware.isVendor(),
    upload.array("images", 5), // Accept multiple images
    async (req, res) => {
      try {
        const productId = req.params.id;
        const vendorId = req.user.id;
        const formData = req.body;

        const vendor = await Vendor.findById(vendorId);
        if (!vendor)
          return res.status(403).json({
            success: false,
            message: "Vendor not found or unauthorized",
          });

        const productResult = await productService.getById(productId);
        if (!productResult.success)
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        const product = productResult.data;

        if (product.vendor._id.toString() !== vendor._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Permission denied to update this product",
          });
        }

        const verifyCategory = await productService.categoryResolver(
          formData.category
        );
        delete formData.category;

        let newImages = product.images;

        if (req.files && req.files.length > 0) {
          newImages = await productService.updateCloudinaryImages(
            product.images,
            req.files
          );
        }
        const updateData = {
          ...formData,
          category: verifyCategory,
          images: newImages,
        };

        const response = await productService.update(productId, updateData);
        return res.status(response.success ? 200 : response.code || 400).json({
          success: response.success,
          message: response.success
            ? "Product updated successfully"
            : response.error,
          data: response.data,
        });
      } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Internal server error",
        });
      }
    }
  );

  // Delete Product
  productRouter.delete(
    "/:id",
    middleware.jwtDecodeToken(),
    async (req, res) => {
      try {
        const productId = req.params.id;
        const vendorId = req.user.id;

        const productResult = await productService.getById(productId);

        if (!productResult.success) {
          return res.status(productResult.code || 404).json({
            success: false,
            message: productResult.error || "Product not found",
          });
        }

        const product = productResult.data;

        if (!product.vendor || product.vendor._id.toString() !== vendorId) {
          return res.status(403).json({
            success: false,
            message: "You do not have permission to delete this product",
          });
        }

        const response = await productService.delete(productId);

        if (!response.success) {
          return res.status(response.code || 400).json({
            success: false,
            message: response.error || "Failed to delete product",
          });
        }

        await Vendor.findByIdAndUpdate(
          vendorId,
          { $pull: { products: productId } },
          { new: true }
        );

        return res.status(200).json({
          success: true,
          message: response.data?.message || "Product deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );

  // List Products
  productRouter.get("/", async (req, res) => {
    try {
      const response = await productService.list(req.query);

      if (!response.success) {
        return res.status(response.code || 400).json({
          success: false,
          message: response.error || "Failed to fetch products",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: response.data,
      });
    } catch (error) {
      console.error("Error listing products:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Search Products
  productRouter.get("/search/:term", async (req, res) => {
    try {
      const response = await productService.search(req.params.term);

      if (!response.success) {
        return res.status(response.code || 400).json({
          success: false,
          message: response.error || "Search failed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Search results",
        data: response.data,
      });
    } catch (error) {
      console.error("Error searching products:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Get Products by Vendor
  productRouter.get(
    "/vendor/:vendorId",
    middleware.jwtDecodeToken(),
    middleware.isVendor(),
    async (req, res) => {
      try {
        const response = await productService.getByVendor(req.params.vendorId);

        if (!response.success) {
          return res.status(response.code || 400).json({
            success: false,
            message: response.error || "Failed to fetch vendor products",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Vendor products fetched successfully",
          data: response.data,
        });
      } catch (error) {
        console.error("Error fetching vendor products:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );
};
