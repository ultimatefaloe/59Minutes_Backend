import express from "express";
import vendorService from "./vendorService.js";
import Middleware from '../Middleware/middleware.js';
import { sendEmail } from '../utils/mailer.js'
import { rateLimiter } from '../utils/rateLimiter.js'
import middleware from "../Middleware/middleware.js";
// import Vendor from "../../Models/VendorModel.js";

const vendorRouter = express.Router();

export const vendorRoutes = (router) => {
    router.use('/vendors', vendorRouter);
    
    // GET vendor by ID
    vendorRouter.get('/:id', middleware.jwtDecodeToken(), middleware.isVendor(),async (req, res) => {
        try {

            const response = await vendorService.get(req.params.id);
            
            if (response) {
              response.id = response._id.toString();
              delete response._id;
            }
            
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error fetching vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // UPDATE vendor
    vendorRouter.put('/:id', Middleware.jwtDecodeToken(), middleware.isVendor(), async (req, res) => {
        try {

            const response = await vendorService.update(req.params.id, req.body);

            if (response) {
              response.id = response._id.toString();
              delete response._id;
            }

            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error updating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // password reset token
    vendorRouter.post('/reset-token', rateLimiter, async (req, res) => {
      const { email } = req.body

      if(!email) return res.status(400).json({success: false, message:'Email is required'})

      try {
        const token = await vendorService.resetToken(email);

        if(token.code === 400){
          return res.status(400).json({message: 'Failed to send verification code'})
        }
        return res.status(200).json({ token })
      } catch (error) {
        return res.status(500).json({
          message: error
        })
      }
    });

    // Password reset 
    vendorRouter.patch('/reset-password', rateLimiter, async (req, res) => {
      const {email, newpassword, token } = req.body

      if(!email || !newpassword || !token) return res.status(400).json({meaasge: 'All input field are required'});

      try {
        const response = await vendorService.resetpassword( email, newpassword, token )

        if(response.code === 400) return res.status(400).json({ success: false, message: response.message || 'Failed to reset password, try again'});

        return res.status(200).json({ response })

      } catch (error) {
        return res.status(500).json({
          message: error
        })
      }
    })

    // DELETE (soft delete) vendor
    vendorRouter.delete('/:id', Middleware.jwtDecodeToken(), middleware.isVendor(), async (req, res) => {
        try {
            const response = await vendorService.delete(req.params.id);

            if (response) {
              response.id = response._id.toString();
              delete response._id;
            }

            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error deleting vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // LIST vendors with filters and pagination
    vendorRouter.get('/', middleware.jwtDecodeToken(), async (req, res) => {
        try {
            const response = await vendorService.list(req.query)

            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error listing vendors ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // VERIFY vendor (admin use)
    vendorRouter.patch('/verify/:id', Middleware.jwtDecodeToken(), middleware.isAdmin(), async (req, res) => {
        try {
            const { status, adminId } = req.body;
            const response = await vendorService.verify(req.params.id, status, adminId);

            if (response) {
              response.id = response._id.toString();
              delete response._id;
            }
            
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error verifying vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // GET vendor statistics
    vendorRouter.get('/stats/:vendorId', middleware.jwtDecodeToken(), middleware.isVendor(), async (req, res) => {
        try {
            const response = await vendorService.getStats(req.params.vendorId);

            if (response) {
              response.id = response._id.toString();
              delete response._id;
            }
            
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error getting vendor stats ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
};
