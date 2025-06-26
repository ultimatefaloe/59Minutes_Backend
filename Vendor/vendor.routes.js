import express from "express";
import vendorService from "./vendorService.js";
import Middleware from '../Middleware/middleware.js';
import { sendEmail } from '../utils/mailer.js'
import { rateLimiter } from '../utils/rateLimiter.js'
import middleware from "../Middleware/middleware.js";
// import Vendor from "../../Models/VendorModel.js";

const vendorRouter = express.Router();

const loginHTML = (vendorName, timestamp, ipAddress) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Login Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #dc3545;">Login Alert 🚨</h2>
          <p>Hello, <strong>${vendorName}</strong></p>
          
          <p>We detected a login to your <strong>59Minutes</strong> account:</p>
          
          <ul style="line-height: 1.6;">
            <li><strong>Time:</strong> ${timestamp}</li>
            <li><strong>IP Address:</strong> ${ipAddress}</li>
          </ul>

          <p>If this was <strong>you</strong>, no further action is needed.</p>
          <p>If you do not recognize this activity, please <strong>change your password</strong> immediately and contact support.</p>

          <p>Stay secure,<br/>The 59Minutes Team</p>

          <hr style="margin-top: 30px;"/>
          <small style="color: #777;">This is an automated message. Please do not reply to this email.</small>
        </div>
      </body>
    </html>
`;

const signupHTML = (vendorName, loginTime) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to 59Minutes</title>
    </head>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #007bff;">Welcome, ${vendorName}! 🎉</h2>
        <p>Thank you for signing up with <strong>59Minutes</strong>.</p>
        
        <p>We're excited to have you onboard. You can now access your dashboard and start managing your products and services efficiently.</p>

        <p>If you have any questions or need help, feel free to contact our support team at <a href="mailto:support@59minutes.com">support@59minutes.com</a>.</p>

        <p>Cheers, <br/>The 59Minutes Team</p>

        <hr style="margin-top: 30px;"/>
        <small style="color: #777;">You received this email because you created an account on 59Minutes.</small>
      </div>
    </body>
  </html>

`;

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
