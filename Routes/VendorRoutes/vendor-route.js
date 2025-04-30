import express from "express";
import vendorService from "../../Service/vendor/vendorService.js";
import Middleware from '../../Middleware/middleware.js';
import { sendEmail } from '../../utils/mailer.js'

const vendorRouter = express.Router();

const loginHTML = (vendorName, loginTime) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
  <h2 style="color: #333;">🔔 New Login Alert</h2>
  <p>Hello <strong>${vendorName}</strong>,</p>
  <p>We noticed a login to your vendor account on <strong>${loginTime}</strong>.</p>

  <p>If this was you, no further action is needed.</p>
  <p>If you did not initiate this login, we recommend you change your password immediately to secure your account.</p>

  <hr style="margin: 20px 0;" />

  <p style="font-size: 0.9em; color: #777;">
    This is an automated message from <strong>59Minutes</strong>. Please do not reply.
  </p>
</div>
`;

export const vendorRoute = (router) => {
    router.use('/vendor', vendorRouter);

    // Sign Up vendor
    vendorRouter.post('/signup', async (req, res) => {
        try {
            const vendorData = req.body;
            const response = await vendorService.create(vendorData);
    
            if (!response.success) {
                return res.status(response.code || 400).json({
                    success: response.success,
                    message: response.error || 'Vendor sign up failed',
                });
            }
    
            const token = Middleware.generateToken(response.data);
    
            return res.status(response.code || 201).json({
                success: response.success,
                message: 'Vendor signed up successfully',
                token,
                data: response.data
            });
    
        } catch (e) {
            console.error('Error creating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    vendorRouter.post('/login', async (req, res) => {
        try {
          const { businessEmail, businessPassword } = req.body;
      
          // Input validation
          if (!businessEmail || !businessPassword) {
            return res.status(400).json({
              success: false,
              message: 'Both email and password are required',
            });
          }
      
          const response = await vendorService.login({ businessEmail, businessPassword });
      
          if (!response.success) {
            return res.status(response.code || 401).json({
              success: false,
              message: response.error || 'Invalid email or password',
            });
          }
      
          const { vendor, token } = response.data;
      
          // Attempt to send login alert email
          try {
            const emailStatus = await sendEmail({
              to: vendor.businessEmail,
              subject: `🔔 Login Alert - ${new Date().toLocaleString()}`,
              html: loginHTML(vendor.businessName, new Date().toLocaleString()),
            });
      
            if (!emailStatus?.accepted?.length) {
              console.warn('⚠️ Login alert email failed to send:', emailStatus);
            }
          } catch (mailErr) {
            console.error('❌ Error sending login alert email:', mailErr);
          }
      
          return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            vendor,
          });
      
        } catch (err) {
          console.error('❌ Vendor login error:', err);
      
          return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message,
          });
        }
      });
      
    
    // GET vendor by ID
    vendorRouter.get('/:id', async (req, res) => {
        try {
            const response = await vendorService.get(req.params.id);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error fetching vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // UPDATE vendo()r
    vendorRouter.put('/:id', Middleware.jwtDecodeToken(), async (req, res) => {
        try {
            const response = await vendorService.update(req.params.id, req.body);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error updating vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // DELETE (soft delete) vendor
    vendorRouter.delete('/:id', Middleware.jwtDecodeToken(), async (req, res) => {
        try {
            const response = await vendorService.delete(req.params.id);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error deleting vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // LIST vendors with filters and pagination
    vendorRouter.get('/', async (req, res) => {
        try {
            const response = await vendorService.list(req.query);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error listing vendors ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // VERIFY vendor (admin use)
    vendorRouter.patch('/verify/:id', Middleware.jwtDecodeToken(), async (req, res) => {
        try {
            const { status, adminId } = req.body;
            const response = await vendorService.verify(req.params.id, status, adminId);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error verifying vendor ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });

    // GET vendor statistics
    vendorRouter.get('/stats/:vendorId', async (req, res) => {
        try {
            const response = await vendorService.getStats(req.params.vendorId);
            return res.status(response.code || 200).json(response);
        } catch (e) {
            console.error('Error getting vendor stats ', e);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
};
