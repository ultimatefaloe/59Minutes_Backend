import admin from '../config/firebase-config.js';

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = {
      fullName: decodedToken.name || decodedToken.email.split('@')[0],
      email: decodedToken.email,
      firebaseUid: decodedToken.uid,  // Changed from firebaseUid to uid
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified
    };
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default verifyFirebaseToken;