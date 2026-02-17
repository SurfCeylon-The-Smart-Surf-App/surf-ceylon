/**
 * Firebase Admin SDK Configuration
 * Optional cloud features for AI Surf Tutor
 */

let admin = null;
let initialized = false;

/**
 * Initialize Firebase Admin SDK (optional)
 */
function initializeFirebase() {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.log("[Firebase] Service account not configured - running without Firebase");
      return;
    }

    const adminSDK = require("firebase-admin");
    
    admin = adminSDK.initializeApp({
      credential: adminSDK.credential.cert(require(serviceAccount)),
    });
    
    initialized = true;
    console.log("[Firebase] Successfully initialized");
  } catch (error) {
    console.warn("[Firebase] Failed to initialize:", error.message);
    console.warn("[Firebase] Continuing without Firebase features");
  }
}

/**
 * Check if Firebase is initialized
 */
function isInitialized() {
  return initialized;
}

/**
 * Get Firestore instance
 */
function firestore() {
  if (!initialized || !admin) {
    throw new Error("Firebase not initialized");
  }
  return admin.firestore();
}

/**
 * Get Auth instance
 */
function auth() {
  if (!initialized || !admin) {
    throw new Error("Firebase not initialized");
  }
  return admin.auth();
}

// Auto-initialize on load
initializeFirebase();

module.exports = {
  isInitialized,
  firestore,
  auth,
  admin,
};
