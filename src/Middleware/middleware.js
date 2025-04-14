import admin from '../config/firebase-config.js';

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
          return next(); // Proceed even if token is invalid
        }
      }

      return next(); // Proceed if no token
    };
  }

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
  }
}

export default new Middleware();
