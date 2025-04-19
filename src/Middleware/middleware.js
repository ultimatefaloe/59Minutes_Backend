import admin from '../config/firebase-config.js';
import jwt from 'jsonwebtoken';

class Middleware {

  decodeToken() {
    return async (req, res, next) => {
      req.user = null;
      const authHeader = req.headers?.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        try {
          const decoded = await admin.auth().verifyIdToken(token);
          req.user = decoded;
        } catch (error) {
          console.warn('Token decode failed:', error.message);
          req.user = null;
          return next();
        }
      }

      return next();
    };
  };

  authRequired() {
    return async (req, res, next) => {
      const authHeader = req.headers?.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token required',
        });
      }

      const token = authHeader.split(' ')[1];

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
          error: error.message,
        });
      }
    };
  };

  jwtAuthRequired(){
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
      }

      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        req.user = decoded; // Attach decoded data (like userId, role, etc.) to request
        next();
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
    };
  };

  generateToken(user) {
    return jwt.sign(
      { id: user._id.toString(), role: user.role }, 
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: '7d' }
    );
}


}

export default new Middleware();
