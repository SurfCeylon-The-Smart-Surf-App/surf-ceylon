const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

function init() {
  if (initialized) return;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!keyPath) {
    // Try to find firebase-key.json in the backend root
    const possiblePath = path.join(__dirname, '..', 'firebase-key.json');
    if (fs.existsSync(possiblePath)) {
      try {
        const serviceAccount = require(possiblePath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        initialized = true;
        return;
      } catch (e) {
        console.warn('Failed to initialize Firebase with firebase-key.json:', e.message);
      }
    }
    console.warn('FIREBASE_SERVICE_ACCOUNT not set; Firebase admin will be disabled.');
    return;
  }

  if (!fs.existsSync(keyPath)) {
    console.warn('FIREBASE_SERVICE_ACCOUNT points to a missing file:', keyPath);
    return;
  }

  const serviceAccount = require(keyPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
}

init();

module.exports = {
  isInitialized: () => initialized,
  auth: () => admin.auth(),
  firestore: () => admin.firestore(),
  admin
};
